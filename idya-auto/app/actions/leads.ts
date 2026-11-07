"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import type { z } from "zod";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { LeadNotificationEmail } from "@/emails/lead-notification";
import { generateLeadBrief } from "@/lib/ai/lead-brief";
import { generateSlots, type DaySlots } from "@/lib/booking/slots";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { formatDateLong, formatTime } from "@/lib/format/date";
import { formatPhone, toE164 } from "@/lib/format/phone";
import { getLeadRepository } from "@/lib/leads";
import { alertSchema, bookingSchema, contactSchema, financingSchema, humanSchema, questionSchema, tradeInSchema } from "@/lib/leads/schemas";
import type { LeadType, NewLead } from "@/lib/leads/types";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { getSettings } from "@/lib/settings";
import { getVehicleRepository } from "@/lib/vehicles";
import { vehicleFullTitle } from "@/lib/vehicles/types";

export type ActionResult =
  | { ok: true; id: string; bookingId?: string; startsAt?: string }
  | { ok: false; error: "validation" | "spam" | "rateLimited" | "slot" | "generic"; fieldErrors?: Record<string, string> };

const SCHEMAS = { question: questionSchema, contact: contactSchema, financing: financingSchema, trade_in: tradeInSchema, inventory_alert: alertSchema, human: humanSchema } as const;
export type FormKind = keyof typeof SCHEMAS;
const LEAD_TYPE: Record<FormKind, LeadType> = { question: "question", contact: "contact", financing: "financing", trade_in: "trade_in", inventory_alert: "inventory_alert", human: "question" };
const TYPE_LABEL: Record<LeadType, string> = { test_drive: "Essai routier", question: "Question", financing: "Financement", trade_in: "Échange", contact: "Contact", inventory_alert: "Alerte inventaire" };

async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0].trim();
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function guard(formData: FormData): Promise<ActionResult | null> {
  const ip = await clientIp();
  if (String(formData.get("website") ?? "") !== "") return { ok: false, error: "spam" };
  if (!rateLimit(`lead:${ip}`).ok) return { ok: false, error: "rateLimited" };
  if (!(await verifyTurnstile(String(formData.get("turnstileToken") ?? ""), ip))) return { ok: false, error: "spam" };
  return null;
}

const obj = (fd: FormData) => Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : v.name])) as Record<string, string>;
const bool = (o: Record<string, string>, k: string) => (o[k] === "on" || o[k] === "true" ? true : o[k] ? o[k] : undefined);

async function notifySales(lead: NewLead & { id: string }, vehicleTitle: string | null, details: { label: string; value: string }[]) {
  const settings = await getSettings();
  await sendEmail({
    to: settings.business.leadsEmail,
    subject: `Nouveau lead · ${TYPE_LABEL[lead.type]} · ${[lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email || ""}`,
    replyTo: lead.email ?? undefined,
    react: LeadNotificationEmail({
      typeLabel: TYPE_LABEL[lead.type],
      name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—",
      email: lead.email,
      phone: lead.phone ? formatPhone(lead.phone) : null,
      vehicleTitle,
      message: lead.message,
      details,
      adminUrl: `${env.siteUrl}/admin/leads/${lead.id}`,
      dealerName: settings.business.displayName,
    }),
  });
}

/** Generic lead submission for every form of brief §13 (+ assistant human handoff). */
export async function submitLead(kind: FormKind, formData: FormData): Promise<ActionResult> {
  const blocked = await guard(formData);
  if (blocked) return blocked;
  const raw = obj(formData);
  const data = { ...raw, consent: bool(raw, "consent"), licence: bool(raw, "licence") };
  const parsed = SCHEMAS[kind].safeParse(data);
  if (!parsed.success) return { ok: false, error: "validation", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data as Record<string, unknown>;
  const consentText = String(formData.get("consentText") ?? "");
  const vehicles = await getVehicleRepository();
  const vehicleId = typeof d.vehicleId === "string" && d.vehicleId ? d.vehicleId : null;
  const vehicle = vehicleId ? await vehicles.getById(vehicleId) : null;
  const name = typeof d.name === "string" ? d.name : "";
  const [firstName, ...rest] = name.split(" ");
  const { consent: _c, website: _w, turnstileToken: _t, ...payload } = d;
  void _c;
  void _w;
  void _t;
  const lead: NewLead = {
    type: LEAD_TYPE[kind],
    vehicleId: vehicle?.id ?? null,
    firstName: typeof d.firstName === "string" ? d.firstName : firstName || null,
    lastName: typeof d.lastName === "string" ? d.lastName : rest.join(" ") || null,
    email: typeof d.email === "string" && d.email ? d.email : null,
    phone: typeof d.phone === "string" && d.phone ? (toE164(d.phone) ?? d.phone) : null,
    locale: d.locale === "en" ? "en" : "fr",
    preferredContact: null,
    message: typeof d.message === "string" && d.message ? d.message : null,
    payload: { kind, ...payload },
    consentText,
    consentAt: new Date().toISOString(),
    utm: null,
    chatSessionId: typeof d.chatSessionId === "string" && d.chatSessionId ? d.chatSessionId : null,
  };
  try {
    const repo = await getLeadRepository();
    const saved = await repo.createLead(lead);
    const details = Object.entries(payload)
      .filter(([k, v]) => !["kind", "vehicleId", "vehicle", "locale", "name", "firstName", "lastName", "email", "phone", "message", "chatSessionId"].includes(k) && v !== "" && v !== undefined)
      .map(([k, v]) => ({ label: k, value: String(v) }));
    after(async () => {
      await notifySales(saved, vehicle ? vehicleFullTitle(vehicle) : (typeof d.vehicle === "string" && d.vehicle) || null, details);
      const brief = await generateLeadBrief(saved);
      if (brief) await repo.saveAiBrief(brief);
    });
    return { ok: true, id: saved.id };
  } catch (e) {
    console.error("[lead] save failed", e);
    return { ok: false, error: "generic" };
  }
}

/** Available slots for the next horizon, capacity-aware (brief §12). */
export async function fetchSlots(): Promise<DaySlots[]> {
  const settings = await getSettings();
  const repo = await getLeadRepository();
  const from = new Date();
  const to = new Date(from.getTime() + (settings.booking.horizonDays + 1) * 86_400_000);
  const existing = await repo.bookingsBetween(from.toISOString(), to.toISOString());
  return generateSlots(settings, existing).filter((d) => d.slots.length > 0);
}

export async function submitBooking(formData: FormData): Promise<ActionResult> {
  const blocked = await guard(formData);
  if (blocked) return blocked;
  const raw = obj(formData);
  const parsed = bookingSchema.safeParse({ ...raw, consent: bool(raw, "consent"), licence: bool(raw, "licence") });
  if (!parsed.success) return { ok: false, error: "validation", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const settings = await getSettings();
  const repo = await getLeadRepository();
  const vehicles = await getVehicleRepository();
  const vehicle = await vehicles.getById(d.vehicleId);
  if (!vehicle) return { ok: false, error: "validation", fieldErrors: { vehicleId: "required" } };
  // Re-check the slot against hours, closures, lead time and capacity
  const startsAt = new Date(d.startsAt).toISOString();
  const days = generateSlots(settings, await repo.bookingsBetween(startsAt, new Date(new Date(startsAt).getTime() + 1).toISOString()));
  const slot = days.flatMap((x) => x.slots).find((s) => s.startsAt === startsAt);
  if (!slot || slot.remaining <= 0) return { ok: false, error: "slot" };
  const consentText = String(formData.get("consentText") ?? "");
  try {
    const lead = await repo.createLead({
      type: "test_drive",
      vehicleId: vehicle.id,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: toE164(d.phone) ?? d.phone,
      locale: d.locale,
      preferredContact: d.preferredContact,
      message: null,
      payload: { preferredLanguage: d.preferredLanguage, licence: true, startsAt },
      consentText,
      consentAt: new Date().toISOString(),
      utm: null,
      chatSessionId: null,
    });
    const booking = await repo.createBooking(lead.id, vehicle.id, startsAt);
    const title = vehicleFullTitle(vehicle);
    const locale = d.preferredLanguage;
    after(async () => {
      await sendEmail({
        to: d.email,
        subject: locale === "fr" ? `Votre essai routier · ${title}` : `Your test drive · ${title}`,
        react: BookingConfirmationEmail({
          locale,
          firstName: d.firstName,
          vehicleTitle: title,
          dateLabel: formatDateLong(startsAt, locale),
          timeLabel: formatTime(startsAt, locale),
          address: `${settings.business.addressLine1}, ${settings.business.city}`,
          phone: formatPhone(settings.business.phone),
          icsUrl: `${env.siteUrl}/api/ics/${booking.id}`,
          dealerName: settings.business.displayName,
        }),
      });
      await notifySales({ ...lead, id: lead.id }, title, [
        { label: "Date", value: `${formatDateLong(startsAt, "fr")} ${formatTime(startsAt, "fr")}` },
        { label: "Contact préféré", value: d.preferredContact },
        { label: "Langue", value: d.preferredLanguage.toUpperCase() },
      ]);
      const brief = await generateLeadBrief(lead);
      if (brief) await repo.saveAiBrief(brief);
    });
    return { ok: true, id: lead.id, bookingId: booking.id, startsAt };
  } catch (e) {
    console.error("[booking] save failed", e);
    return { ok: false, error: "generic" };
  }
}
