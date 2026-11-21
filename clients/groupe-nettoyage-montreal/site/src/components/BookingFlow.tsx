"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SERVICES, type ServiceId } from "@/content/services";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { I } from "./Icons";
import type { Booking } from "@/lib/db/types";

type Day = { date: string; slots: { start: string; end: string; remaining: number }[] };
const L = {
  fr: { pick: "Pour quel type de local?", when: "Quand pouvons-nous passer?", who: "Vos coordonnées", done: "Votre visite est confirmée!", more: "Autres dates", summary: "Résumé", confirmNote: "Visite gratuite et sans engagement. Déplacez-la ou annulez-la en tout temps.", sent: "Une confirmation vous a été envoyée par courriel. La soumission écrite suit dans les 24 heures après la visite.", ref: "Votre référence", walkInfo: "Une visite de 20 minutes sur place, en semaine, gratuite et sans engagement. Vous recevez la soumission écrite et détaillée dans les 24 heures.", noDates: "Aucune disponibilité en ligne pour le moment. Appelez-nous.", kindW: "Visite d'évaluation", addr: "Adresse complète des locaux (rue, ville, code postal)", err: "La réservation a échoué. Le créneau est peut-être pris; choisissez-en un autre.", free: "Gratuit", duration: "20 minutes" },
  en: { pick: "What kind of space?", when: "When can we come by?", who: "Your details", done: "Your walkthrough is confirmed!", more: "More dates", summary: "Summary", confirmNote: "Free walkthrough, no commitment. Move or cancel it at any time.", sent: "A confirmation has been sent to your email. The written quote follows within 24 hours of the visit.", ref: "Your reference", walkInfo: "A free 20-minute on-site visit on a weekday, no commitment. You receive the detailed written quote within 24 hours.", noDates: "No online availability right now. Please call us.", kindW: "Walkthrough", addr: "Full premises address (street, city, postal code)", err: "Booking failed. The slot may be taken; please pick another.", free: "Free", duration: "20 minutes" },
};
const fmtDate = (iso: string, locale: Locale) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", { weekday: "short", day: "numeric", month: "short" });

export function BookingFlow({ locale, initialService }: { locale: Locale; initialService?: ServiceId }) {
  const d = t(locale); const s = L[locale];
  const [service, setService] = useState<ServiceId | null>(initialService ?? null);
  const [days, setDays] = useState<Day[] | null>(null); const [from, setFrom] = useState<string | undefined>();
  const [date, setDate] = useState<string>(""); const [slot, setSlot] = useState<string>("");
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", address: "", notes: "", consent: false });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [booking, setBooking] = useState<Booking | null>(null);
  const svc = useMemo(() => SERVICES.find((x) => x.id === service) ?? null, [service]);

  useEffect(() => { if (!svc) return; setDays(null); setDate(""); setSlot("");
    fetch(`/api/availability${from ? `?from=${from}` : ""}`).then((r) => r.json()).then((x) => { setDays(x.days); if (x.days?.[0]) setDate(x.days[0].date); }).catch(() => setDays([])); }, [svc, from]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!svc || !date || !slot) return; setBusy(true); setErr("");
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale, service: svc.id, date, slot_start: slot, ...form, company: form.company || undefined, notes: form.notes || undefined }) });
      const data = await res.json(); if (!res.ok || !data.ok) throw new Error(data.error ?? "fail"); setBooking(data.booking); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setErr(s.err); } finally { setBusy(false); }
  }

  if (booking) return (
    <div className="card rise p-6 sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600"><I.check width={26} height={26} strokeWidth={2.5} /></span>
      <h2 className="h-display mt-4 text-3xl">{s.done}</h2>
      <p className="mt-2 text-ink-600">{s.sent}</p>
      <dl className="mt-6 grid gap-3 rounded-xl bg-sand-50 p-5 text-[15px] sm:grid-cols-2">
        <div><dt className="text-ink-500">{s.ref}</dt><dd className="text-xl font-semibold text-navy-950">{booking.ref}</dd></div>
        <div><dt className="text-ink-500">{d.common.date}</dt><dd className="font-semibold text-navy-950">{fmtDate(booking.date, locale)} · {booking.slot_start}–{booking.slot_end}</dd></div>
        <div><dt className="text-ink-500">Service</dt><dd className="font-semibold text-navy-950">{s.kindW} · {svc?.name[locale]}</dd></div>
        <div><dt className="text-ink-500">{d.common.address}</dt><dd className="font-semibold text-navy-950">{booking.address}</dd></div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3"><a className="btn btn-dark" href={`/api/bookings?ref=${booking.ref}&email=${encodeURIComponent(booking.email)}&format=ics`}><I.calendar width={18} height={18} />{d.common.addToCalendar}</a><Link className="btn btn-ghost" href={pagePath(locale, "myBooking")}>{d.common.lookup}</Link></div>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="card p-5 sm:p-7">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">1 · {s.pick}</h2>
          <div className="mt-4 flex flex-wrap gap-2">{SERVICES.map((x) => <button type="button" key={x.id} onClick={() => setService(x.id)} className={`chip ${service === x.id ? "chip-on" : ""}`}>{x.name[locale]}</button>)}</div>
          {svc && <div className="mt-4 rounded-xl bg-sand-50 p-4 text-[14.5px] text-ink-700"><p>{s.walkInfo}</p></div>}
        </section>
        {svc && (
          <section className="card p-5 sm:p-7">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">2 · {s.when} <span className="ml-2 rounded-full bg-sand-100 px-2 py-0.5 text-[11px] text-ink-600">{s.kindW}</span></h2>
            {days === null ? <p className="mt-4 text-ink-500">{d.common.loading}</p> : days.length === 0 ? <p className="mt-4 text-ink-600">{s.noDates}</p> : (<>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">{days.map((dy) => <button type="button" key={dy.date} onClick={() => { setDate(dy.date); setSlot(""); }} className={`shrink-0 rounded-xl border px-4 py-3 text-left ${date === dy.date ? "border-navy-900 bg-navy-900 text-white" : "border-line hover:border-navy-900"}`}><span className="block text-[13px] capitalize opacity-80">{fmtDate(dy.date, locale)}</span><span className="block text-[12px] opacity-70">{dy.slots.length} {locale === "fr" ? "créneaux" : "slots"}</span></button>)}
                <button type="button" onClick={() => setFrom(days[days.length - 1].date)} className="shrink-0 rounded-xl border border-dashed border-line px-4 py-3 text-[13px] text-ink-600 hover:border-navy-900">{s.more} →</button></div>
              <div className="mt-4 flex flex-wrap gap-2">{days.find((x) => x.date === date)?.slots.map((sl) => <button type="button" key={sl.start} onClick={() => setSlot(sl.start)} className={`chip ${slot === sl.start ? "chip-on" : ""}`}>{sl.start} – {sl.end}</button>)}</div>
            </>)}
          </section>
        )}
        {svc && slot && (
          <form onSubmit={submit} className="card p-5 sm:p-7">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">3 · {s.who}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="b-company">{d.common.company}</label><input id="b-company" required className="field" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" /></div>
              <div><label className="label" htmlFor="b-name">{d.common.name}</label><input id="b-name" required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></div>
              <div><label className="label" htmlFor="b-phone">{d.common.phone}</label><input id="b-phone" required type="tel" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></div>
              <div><label className="label" htmlFor="b-email">{d.common.email}</label><input id="b-email" required type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="b-addr">{s.addr}</label><input id="b-addr" required className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} autoComplete="street-address" /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="b-notes">{d.common.notes} <span className="font-normal text-ink-500">({d.common.optional})</span></label><textarea id="b-notes" rows={3} className="field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <label className="mt-4 flex items-start gap-3 text-[14px] text-ink-700"><input type="checkbox" required checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1 h-4 w-4 accent-navy-900" />{d.common.consent}</label>
            {err && <p className="mt-3 text-[14px] text-red-700">{err}</p>}
            <button type="submit" className="btn btn-primary mt-5" disabled={busy}>{busy ? d.common.loading : d.common.confirm}<I.check width={18} height={18} /></button>
            <p className="mt-3 text-[12.5px] text-ink-500">{s.confirmNote}</p>
          </form>
        )}
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{s.summary}</h3>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-700">
            <li className="flex justify-between gap-3"><span>Service</span><strong className="text-right text-navy-950">{svc?.name[locale] ?? "—"}</strong></li>
            <li className="flex justify-between gap-3"><span>{d.common.date}</span><strong className="text-navy-950">{date ? fmtDate(date, locale) : "—"}</strong></li>
            <li className="flex justify-between gap-3"><span>{d.common.time}</span><strong className="text-navy-950">{slot || "—"}</strong></li>
            <li className="flex justify-between gap-3 border-t border-line pt-2"><span>{s.kindW}</span><strong className="text-navy-950">{s.free} · {s.duration}</strong></li>
          </ul>
          <ul className="mt-4 space-y-1.5 text-[13px] text-ink-600">{d.hero.proof.map((p) => <li key={p} className="flex items-center gap-2"><I.check width={14} height={14} className="text-teal-600" />{p}</li>)}</ul>
        </div>
      </aside>
    </div>
  );
}
