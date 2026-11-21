import { Resend } from "resend";
import type { Booking, Lead } from "./db/types";
import { BIZ } from "@/content/business";

const from = process.env.EMAIL_FROM ?? `${BIZ.name} <onboarding@resend.dev>`;
const owner = process.env.OWNER_NOTIFY_EMAIL ?? BIZ.email;
function client() { const k = process.env.RESEND_API_KEY; return k ? new Resend(k) : null; }

async function send(to: string, subject: string, html: string) {
  const c = client();
  if (!c) { console.info(`[email:skipped] to=${to} subject=${subject}`); return; }
  try { await c.emails.send({ from, to, subject, html }); } catch (e) { console.error("[email:error]", e); }
}

export async function notifyBooking(b: Booking, serviceName: string) {
  const fr = b.locale === "fr";
  const when = `${b.date} · ${b.slot_start}–${b.slot_end}`;
  await send(b.email, fr ? `Confirmation ${b.ref} · ${serviceName}` : `Confirmation ${b.ref} · ${serviceName}`,
    `<p>${fr ? "Bonjour" : "Hello"} ${b.name},</p><p>${fr ? "Votre visite d'évaluation gratuite est confirmée. Vous recevrez une soumission écrite dans les 24 heures suivant la visite." : "Your free walkthrough is confirmed. You will receive a written quote within 24 hours of the visit."}</p>
     <p><strong>${serviceName}</strong><br>${when}<br>${b.address}</p>
     <p>${fr ? "Référence" : "Reference"} : <strong>${b.ref}</strong><br>${BIZ.phoneDisplay} · ${BIZ.email}</p>`);
  await send(owner, `[Réservation] ${b.ref} · ${serviceName} · ${when}`,
    `<p>${b.name} · ${b.phone} · ${b.email}</p><p>${b.address}</p><p>${(b.notes ?? "").replace(/\n/g, "<br>")}</p>`);
}

export async function notifyLead(l: Lead) {
  await send(owner, `[Lead ${l.type}] ${l.name} · ${l.service ?? ""}`,
    `<p>${l.name} · ${l.phone ?? ""} · ${l.email}</p><p>${l.message ?? ""}</p><pre>${l.meta ? JSON.stringify(l.meta, null, 1) : ""}</pre>`);
}
