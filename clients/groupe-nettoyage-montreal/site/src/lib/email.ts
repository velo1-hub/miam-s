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
  const price = b.price_min != null ? (b.price_min === b.price_max ? `${b.price_min} $` : `${b.price_min}–${b.price_max} $`) : "";
  await send(b.email, fr ? `Confirmation ${b.ref} · ${serviceName}` : `Confirmation ${b.ref} · ${serviceName}`,
    `<p>${fr ? "Bonjour" : "Hello"} ${b.name},</p><p>${fr ? "Votre rendez-vous est confirmé." : "Your appointment is confirmed."}</p>
     <p><strong>${serviceName}</strong><br>${when}<br>${b.address}<br>${price ? `${fr ? "Prix estimé" : "Estimated price"} : ${price} ${fr ? "avant taxes" : "before tax"}` : ""}</p>
     <p>${fr ? "Référence" : "Reference"} : <strong>${b.ref}</strong><br>${BIZ.phoneDisplay} · ${BIZ.email}</p>`);
  await send(owner, `[Réservation] ${b.ref} · ${serviceName} · ${when}`,
    `<p>${b.name} · ${b.phone} · ${b.email}</p><p>${b.address}</p><p>${b.notes ?? ""}</p><p>${price}</p>`);
}

export async function notifyLead(l: Lead) {
  await send(owner, `[Lead ${l.type}] ${l.name} · ${l.service ?? ""}`,
    `<p>${l.name} · ${l.phone ?? ""} · ${l.email}</p><p>${l.message ?? ""}</p><pre>${l.quote ? JSON.stringify(l.quote, null, 1) : ""}</pre>`);
}
