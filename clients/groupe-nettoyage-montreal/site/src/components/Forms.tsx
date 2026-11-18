"use client";
import { useState } from "react";
import { SERVICES } from "@/content/services";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";

export function LeadForm({ locale, type, source }: { locale: Locale; type: "contact" | "career"; source: string }) {
  const d = t(locale); const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [f, setF] = useState({ name: "", email: "", phone: "", service: "", message: "", consent: false, website: "" });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setState("busy");
    try { const r = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, locale, type, source, service: f.service || undefined, phone: f.phone || undefined }) }); setState(r.ok ? "ok" : "err"); } catch { setState("err"); }
  }
  if (state === "ok") return <div className="rounded-2xl bg-teal-100 p-6 text-[16px] font-medium text-teal-600">{d.common.thanks}</div>;
  const career = type === "career";
  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor={`${type}-name`}>{d.common.name}</label><input id={`${type}-name`} required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></div>
        <div><label className="label" htmlFor={`${type}-phone`}>{d.common.phone}</label><input id={`${type}-phone`} type="tel" className="field" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor={`${type}-email`}>{d.common.email}</label><input id={`${type}-email`} required type="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor={`${type}-service`}>{career ? (locale === "fr" ? "Poste souhaité" : "Position") : (locale === "fr" ? "Service concerné" : "Service")}</label>
          <select id={`${type}-service`} className="field" value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })}>
            <option value="">—</option>
            {career ? ["Préposé(e) à l'entretien résidentiel", "Préposé(e) commercial (soir)", "Chef d'équipe", "Coordination / bureau"].map((p) => <option key={p}>{p}</option>) : SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name[locale]}</option>)}
          </select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor={`${type}-msg`}>{career ? (locale === "fr" ? "Expérience, disponibilités, secteur" : "Experience, availability, area") : d.common.message}</label><textarea id={`${type}-msg`} rows={5} required className="field" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} aria-hidden />
      <label className="flex items-start gap-3 text-[14px] text-ink-700"><input type="checkbox" required checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-1 h-4 w-4 accent-navy-900" />{d.common.consent}</label>
      {state === "err" && <p className="text-[14px] text-red-700">{d.common.error}</p>}
      <button className="btn btn-primary" disabled={state === "busy"}>{state === "busy" ? d.common.sending : d.common.send}</button>
    </form>
  );
}

export function BookingLookup({ locale }: { locale: Locale }) {
  const d = t(locale); const [ref, setRef] = useState(""); const [email, setEmail] = useState(""); const [res, setRes] = useState<null | { ok: boolean; booking?: { ref: string; date: string; slot_start: string; slot_end: string; service: string; address: string; status: string } }>(null); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) { e.preventDefault(); setBusy(true); const r = await fetch(`/api/bookings?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`); setRes(r.ok ? await r.json() : { ok: false }); setBusy(false); }
  async function cancel() { if (!confirm(locale === "fr" ? "Annuler cette réservation?" : "Cancel this booking?")) return; const r = await fetch(`/api/bookings?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`, { method: "DELETE" }); setRes(r.ok ? await r.json() : { ok: false }); }
  const svcName = (id: string) => SERVICES.find((s) => s.id === id)?.name[locale] ?? id;
  return (
    <div className="card p-5 sm:p-7">
      <form onSubmit={go} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div><label className="label" htmlFor="lk-ref">{d.common.ref}</label><input id="lk-ref" required className="field" placeholder="GNM-XXXXXX" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} /></div>
        <div><label className="label" htmlFor="lk-email">{d.common.email}</label><input id="lk-email" required type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="flex items-end"><button className="btn btn-dark w-full" disabled={busy}>{d.common.lookup}</button></div>
      </form>
      {res && (res.ok && res.booking ? (
        <div className="mt-6 rounded-xl bg-sand-50 p-5 text-[15px]">
          <p className="text-xl font-semibold text-navy-950">{res.booking.ref} <span className={`ml-2 rounded-full px-2 py-0.5 text-[12px] ${res.booking.status === "confirmed" ? "bg-teal-100 text-teal-600" : "bg-line text-ink-600"}`}>{res.booking.status}</span></p>
          <p className="mt-2 text-ink-700">{svcName(res.booking.service)} · {res.booking.date} · {res.booking.slot_start}–{res.booking.slot_end}</p>
          <p className="text-ink-700">{res.booking.address}</p>
          <div className="mt-4 flex gap-3"><a className="btn btn-ghost !py-2" href={`/api/bookings?ref=${res.booking.ref}&email=${encodeURIComponent(email)}&format=ics`}>{d.common.addToCalendar}</a>{res.booking.status === "confirmed" && <button type="button" className="btn btn-ghost !py-2 text-red-700" onClick={cancel}>{d.common.cancel}</button>}</div>
        </div>
      ) : <p className="mt-4 text-[14px] text-red-700">{locale === "fr" ? "Aucune réservation trouvée avec cette référence et ce courriel." : "No booking found with that reference and email."}</p>)}
    </div>
  );
}
