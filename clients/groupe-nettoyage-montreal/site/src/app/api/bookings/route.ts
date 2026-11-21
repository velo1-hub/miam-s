import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/schema";
import { getDB } from "@/lib/db";
import { getSlots, addMinutes, SCHEDULE, makeRef } from "@/lib/availability";
import { serviceById } from "@/content/services";
import { notifyBooking } from "@/lib/email";
import { bookingICS } from "@/lib/ics";
export const dynamic = "force-dynamic";

const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string, max = 10, windowMs = 60_000) {
  const now = Date.now(); const h = hits.get(ip); if (!h || now - h.t > windowMs) { hits.set(ip, { n: 1, t: now }); return false; } h.n++; return h.n > max;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  const body = await req.json().catch(() => null); const p = bookingSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ ok: false, error: "invalid_input", issues: p.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  const b = p.data; const db = getDB(); const svc = serviceById(b.service);
  const slot = (await getSlots(db, b.date)).find((s) => s.start === b.slot_start);
  if (!slot || slot.remaining <= 0) return NextResponse.json({ ok: false, error: "slot_unavailable" }, { status: 409 });
  const notes = [b.company ? `${b.locale === "fr" ? "Entreprise" : "Company"} : ${b.company}` : "", b.notes ?? ""].filter(Boolean).join("\n") || null;
  const booking = await db.createBooking({ ref: makeRef(), locale: b.locale, kind: "walkthrough", service: b.service, date: b.date, slot_start: slot.start, slot_end: addMinutes(slot.start, SCHEDULE.walkthrough.durationH * 60), name: b.name, email: b.email, phone: b.phone, address: b.address, company: b.company ?? null, notes, price_min: null, price_max: null, quote: null, status: "confirmed", lead_id: null });
  void notifyBooking(booking, svc.name[b.locale]);
  return NextResponse.json({ ok: true, booking });
}

export async function GET(req: Request) {
  const u = new URL(req.url); const ref = u.searchParams.get("ref") ?? ""; const email = u.searchParams.get("email") ?? "";
  if (!ref || !email) return NextResponse.json({ ok: false }, { status: 400 });
  const b = await getDB().findBooking(ref, email); if (!b) return NextResponse.json({ ok: false }, { status: 404 });
  if (u.searchParams.get("format") === "ics") {
    const svc = serviceById(b.service as never); const ics = bookingICS(b, `${svc?.name[b.locale] ?? b.service} · Groupe Nettoyage Montréal`);
    return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${b.ref}.ics"` } });
  }
  return NextResponse.json({ ok: true, booking: b });
}

export async function DELETE(req: Request) {
  const u = new URL(req.url); const ref = u.searchParams.get("ref") ?? ""; const email = u.searchParams.get("email") ?? "";
  const b = await getDB().cancelBooking(ref, email); if (!b) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, booking: b });
}
