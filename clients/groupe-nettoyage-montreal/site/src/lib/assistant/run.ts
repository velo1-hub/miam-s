import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SERVICES, serviceById, type ServiceId } from "@/content/services";
import { ZONES } from "@/content/zones";
import { FAQ } from "@/content/faq";
import { BIZ } from "@/content/business";
import { computeQuote, withTax, type QuoteInput } from "@/lib/pricing";
import { getSlots, nextAvailableDays, isBookableDate, addMinutes, SCHEDULE, makeRef, todayISO } from "@/lib/availability";
import { getDB, type Booking } from "@/lib/db";
import { notifyBooking, notifyLead } from "@/lib/email";
import { quoteInputSchema } from "@/lib/schema";
import type { Locale } from "@/i18n/config";

export const MODEL = "claude-opus-5-5";
export type ChatMsg = { role: "user" | "assistant"; content: string };
export type AssistantState = { quote?: QuoteInput & { zone?: string }; name?: string; email?: string; phone?: string; address?: string };

const serviceIds = SERVICES.map((s) => s.id) as [ServiceId, ...ServiceId[]];
const tools: Anthropic.Beta.BetaToolUnion[] = [
  { name: "estimate_price", description: "Compute the price for a cleaning service from the structured details. Residential, deep, move, airbnb and small post-construction return a firm price or range; office, restaurant and property return a monthly range or 'quote' and require a free walkthrough.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["service"], properties: { service: { type: "string", enum: serviceIds }, homeType: { type: "string", enum: ["studio", "3half", "4half", "5half", "house"] }, bedrooms: { type: "integer" }, bathrooms: { type: "integer" }, floors: { type: "integer" }, sqft: { type: "integer" }, frequency: { type: "string", enum: ["once", "weekly", "biweekly", "monthly"] }, visitsPerWeek: { type: "integer" }, addons: { type: "array", items: { type: "string", enum: ["oven", "fridge", "windows", "pets", "laundry", "linens", "carpet", "balcony"] } }, zone: { type: "string", enum: ZONES.map((z) => z.id) } } } },
  { name: "get_availability", description: "List open appointment slots. kind=cleaning for a bookable cleaning, kind=walkthrough for the free 20-minute commercial visit. Pass a date (YYYY-MM-DD) for one day, or omit it for the next 5 days with openings.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["kind"], properties: { kind: { type: "string", enum: ["cleaning", "walkthrough"] }, date: { type: "string" } } } },
  { name: "book_appointment", description: "Create a confirmed booking. Only call after the user has explicitly confirmed the date, time slot, service, full address, name, email and phone. Returns the reference.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["kind", "service", "date", "slot_start", "name", "email", "phone", "address"], properties: { kind: { type: "string", enum: ["cleaning", "walkthrough"] }, service: { type: "string", enum: serviceIds }, date: { type: "string" }, slot_start: { type: "string" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, address: { type: "string" }, notes: { type: "string" } } } },
  { name: "create_lead", description: "Save a callback/quote request when the user cannot or does not want to book now (e.g. property management, restaurant, out-of-area, custom needs). Requires name and email or phone.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["name", "message"], properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, service: { type: "string", enum: serviceIds }, message: { type: "string" } } } },
];

const bookSchema = z.object({ kind: z.enum(["cleaning", "walkthrough"]), service: z.enum(serviceIds), date: z.string(), slot_start: z.string(), name: z.string().min(2), email: z.string().email(), phone: z.string().min(7), address: z.string().min(5), notes: z.string().optional() });
const leadSchema = z.object({ name: z.string().min(2), email: z.string().email().optional(), phone: z.string().optional(), service: z.enum(serviceIds).optional(), message: z.string().min(1) });

function catalog(locale: Locale) {
  return SERVICES.map((s) => `- ${s.id}: ${s.name[locale]} · ${s.priceHint[locale]} · ${s.bookable ? "bookable online (kind=cleaning)" : "quote after free walkthrough (kind=walkthrough)"}`).join("\n");
}
function systemPrompt(locale: Locale) {
  const fr = locale === "fr";
  return `You are the booking assistant of ${BIZ.name}, a cleaning company serving Montréal, Laval, Longueuil, Brossard and the West Island. Reply in ${fr ? "French (Québec, vouvoiement)" : "English (Canadian)"} only, in short plain sentences, no markdown headings, no bullet lists longer than 4 items.

Your job: (1) understand the space, (2) give a price with estimate_price, (3) offer slots with get_availability, (4) collect name, email, phone, full address, (5) read back the summary and ask for an explicit yes, (6) call book_appointment, then give the reference. Never invent prices, slots or references: always use the tools. Never claim a booking exists unless book_appointment returned ok.

Services (ids for tools):
${catalog(locale)}

Rules:
- Residential (residential, deep, move, airbnb, postconstruction under 2,500 sq ft) get a firm price and can be booked as kind=cleaning.
- Office, restaurant, property management and large post-construction get a range or a quote and are booked as kind=walkthrough (free 20-minute visit, weekdays only). Mention the written quote arrives within 24 hours.
- Ask one or two questions at a time. Use sensible defaults (4½ = 2 bedrooms 1 bathroom; biweekly is most popular) and say what you assumed.
- Prices are before tax (GST 5% + QST 9.975%); products, equipment, insured dedicated team, photo report and the 24-hour fix guarantee are included.
- Same-day emergencies: tell them to call ${BIZ.phoneDisplay}. Hours ${BIZ.hours.opens}–${BIZ.hours.closes}, 7 days.
- Outside the service area or for anything you cannot handle, offer create_lead so a human calls back within 24 business hours.
- If the user asks something unrelated to cleaning services, politely steer back.
- Today's date is ${todayISO()} (America/Toronto). Slots start tomorrow.

Company FAQ:
${FAQ[locale].map((f) => `Q: ${f.q} A: ${f.a}`).join("\n")}`;
}

export async function runAssistant(locale: Locale, history: ChatMsg[], state: AssistantState) {
  const client = new Anthropic();
  const db = getDB();
  let booking: Booking | null = null; const newState: AssistantState = { ...state };
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  if (Object.keys(state).length) messages.push({ role: "system", content: `Known context (from earlier in this session, do not ask again unless missing): ${JSON.stringify(state)}` });

  async function exec(name: string, input: unknown): Promise<string> {
    switch (name) {
      case "estimate_price": {
        const p = quoteInputSchema.safeParse(input); if (!p.success) return JSON.stringify({ error: "invalid_input" });
        const zone = ZONES.find((z) => z.id === p.data.zone); const q = computeQuote({ ...p.data, travelFee: zone?.travelFee ?? 0 });
        newState.quote = p.data; return JSON.stringify({ ...q, tax_example: withTax(q.min), currency: "CAD", before_tax: true });
      }
      case "get_availability": {
        const { kind, date } = input as { kind: "cleaning" | "walkthrough"; date?: string };
        if (date) { if (!isBookableDate(date, kind)) return JSON.stringify({ date, slots: [], reason: "date_not_bookable", min_lead_days: SCHEDULE.minLeadDays }); return JSON.stringify({ date, slots: (await getSlots(db, date, kind)).filter((s) => s.remaining > 0) }); }
        return JSON.stringify({ days: await nextAvailableDays(db, kind, 5) });
      }
      case "book_appointment": {
        const p = bookSchema.safeParse(input); if (!p.success) return JSON.stringify({ error: "invalid_input", issues: p.error.issues.map((i) => i.path.join(".")) });
        const b = p.data; const svc = serviceById(b.service);
        const slots = await getSlots(db, b.date, b.kind); const slot = slots.find((s) => s.start === b.slot_start);
        if (!slot || slot.remaining <= 0) return JSON.stringify({ error: "slot_unavailable", alternatives: slots.filter((s) => s.remaining > 0).map((s) => s.start) });
        const q = b.kind === "cleaning" && newState.quote?.service === b.service ? computeQuote({ ...newState.quote, travelFee: ZONES.find((z) => z.id === newState.quote?.zone)?.travelFee ?? 0 }) : null;
        booking = await db.createBooking({ ref: makeRef(), locale, kind: b.kind, service: b.service, date: b.date, slot_start: b.slot_start, slot_end: addMinutes(b.slot_start, SCHEDULE[b.kind].durationH * 60), name: b.name, email: b.email, phone: b.phone, address: b.address, notes: b.notes ?? null, price_min: q?.min ?? null, price_max: q?.max ?? null, quote: q, status: "confirmed", lead_id: null });
        Object.assign(newState, { name: b.name, email: b.email, phone: b.phone, address: b.address });
        void notifyBooking(booking, svc.name[locale]);
        return JSON.stringify({ ok: true, ref: booking.ref, date: booking.date, slot: `${booking.slot_start}-${booking.slot_end}`, price_min: booking.price_min, price_max: booking.price_max });
      }
      case "create_lead": {
        const p = leadSchema.safeParse(input); if (!p.success || (!p.data.email && !p.data.phone)) return JSON.stringify({ error: "need_email_or_phone" });
        const lead = await db.createLead({ locale, type: "assistant", name: p.data.name, email: p.data.email ?? "", phone: p.data.phone ?? null, message: p.data.message, service: p.data.service ?? null, source: "assistant", quote: newState.quote ? computeQuote(newState.quote) : null, meta: { history_tail: history.slice(-6) } });
        void notifyLead(lead); return JSON.stringify({ ok: true, id: lead.id });
      }
      default: return JSON.stringify({ error: "unknown_tool" });
    }
  }

  let reply = "";
  for (let i = 0; i < 6; i++) {
    const res = await client.beta.messages.create({
      model: MODEL, max_tokens: 1200,
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: systemPrompt(locale), cache_control: { type: "ephemeral" } }],
      tools, messages,
    });
    const text = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("").trim();
    if (res.stop_reason === "refusal") { reply = text || (locale === "fr" ? "Je ne peux pas aider avec cette demande. Pour tout ce qui concerne le nettoyage, je suis là." : "I can't help with that request. For anything about cleaning, I'm here."); break; }
    const uses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (uses.length === 0 || res.stop_reason !== "tool_use") { reply = text; break; }
    messages.push({ role: "assistant", content: res.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const u of uses) { let out: string; try { out = await exec(u.name, u.input); } catch (e) { out = JSON.stringify({ error: "tool_failed", detail: String((e as Error).message) }); } results.push({ type: "tool_result", tool_use_id: u.id, content: out }); }
    messages.push({ role: "user", content: results });
  }
  return { reply, state: newState, booking };
}
