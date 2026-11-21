"use client";
import { useState } from "react";
import Link from "next/link";
import { SERVICES, type ServiceId } from "@/content/services";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { I } from "./Icons";

const L = {
  fr: { space: "Type de local", sqft: "Superficie approximative (pi²)", units: "Nombre de locaux ou de logements", frequency: "Fréquence souhaitée", freq: { daily: "Quotidien (5 à 7 passages/sem.)", three: "2 à 3 passages par semaine", weekly: "Hebdomadaire", project: "Ponctuel ou par projet", unsure: "À déterminer ensemble" }, when: "Horaire préféré", whenOpts: { evening: "Soir (après 18 h)", morning: "Tôt le matin", day: "Pendant les heures d'ouverture", night: "Nuit, après fermeture" }, start: "Début souhaité", startOpts: { asap: "Dès que possible", month: "Dans le mois", quarter: "Dans les trois mois", info: "Je m'informe" }, details: "Précisions utiles", detailsPh: "Accès, étages, planchers, zones sensibles, exigences particulières…", submit: "Envoyer ma demande", done: "Demande reçue. Merci!", doneSub: "Nous vous rappelons sous 24 heures ouvrables pour fixer la visite. Vous préférez choisir le créneau tout de suite?", pick: "Choisir le créneau de la visite", b2b: "Entreprises et gestionnaires seulement. Nous n'offrons pas de ménage résidentiel pour particuliers." },
  en: { space: "Type of space", sqft: "Approximate area (sq ft)", units: "Number of locations or units", frequency: "Desired frequency", freq: { daily: "Daily (5 to 7 visits/week)", three: "2 to 3 visits a week", weekly: "Weekly", project: "One-off or per project", unsure: "To be determined together" }, when: "Preferred hours", whenOpts: { evening: "Evenings (after 6 p.m.)", morning: "Early mornings", day: "During opening hours", night: "Nights, after closing" }, start: "Desired start", startOpts: { asap: "As soon as possible", month: "Within the month", quarter: "Within three months", info: "Just gathering information" }, details: "Useful details", detailsPh: "Access, floors, flooring, sensitive areas, special requirements…", submit: "Send my request", done: "Request received. Thank you!", doneSub: "We call you back within 24 business hours to set the walkthrough. Prefer to pick the slot right now?", pick: "Pick the walkthrough slot", b2b: "Businesses and managers only. We do not offer residential cleaning for private individuals." },
};

export function QuoteRequest({ locale, initialService }: { locale: Locale; initialService?: ServiceId }) {
  const d = t(locale); const s = L[locale];
  const [f, setF] = useState({ service: initialService ?? ("office" as ServiceId), company: "", name: "", email: "", phone: "", address: "", sqft: "", units: "1", frequency: "three", when: "evening", start: "asap", details: "", consent: false, website: "" });
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setState("busy");
    const svc = SERVICES.find((x) => x.id === f.service)!;
    const lines = [`${d.common.company}: ${f.company}`, `${s.space}: ${svc.name[locale]}`, f.sqft ? `${s.sqft}: ${f.sqft}` : "", `${s.units}: ${f.units}`, `${s.frequency}: ${s.freq[f.frequency as keyof typeof s.freq]}`, `${s.when}: ${s.whenOpts[f.when as keyof typeof s.whenOpts]}`, `${s.start}: ${s.startOpts[f.start as keyof typeof s.startOpts]}`, `${d.common.address}: ${f.address}`, f.details ? `${s.details}: ${f.details}` : ""].filter(Boolean);
    try {
      const r = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale, type: "quote", source: "quote-request", name: f.name, email: f.email, phone: f.phone || undefined, service: f.service, segment: "commercial", message: lines.join("\n"), meta: { company: f.company, sqft: f.sqft || null, units: f.units, frequency: f.frequency, when: f.when, start: f.start, address: f.address }, consent: f.consent, website: f.website }) });
      setState(r.ok ? "ok" : "err");
    } catch { setState("err"); }
  }
  if (state === "ok") return (
    <div className="card rise p-6 sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600"><I.check width={26} height={26} strokeWidth={2.5} /></span>
      <h2 className="h-display mt-4 text-3xl">{s.done}</h2><p className="mt-2 text-[16px] text-ink-600">{s.doneSub}</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link href={`${pagePath(locale, "book")}?service=${f.service}`} className="btn btn-primary"><I.calendar width={18} height={18} />{s.pick}</Link><button type="button" className="btn btn-ghost" onClick={() => window.dispatchEvent(new CustomEvent("gnm:assistant", { detail: { open: true } }))}>{d.hero.cta2}<I.chat width={18} height={18} /></button></div>
    </div>
  );
  return (
    <form onSubmit={submit} className="card space-y-6 p-5 sm:p-7" data-testid="quote-request">
      <div>
        <span className="label">{s.space}</span>
        <div className="flex flex-wrap gap-2">{SERVICES.map((x) => <button type="button" key={x.id} onClick={() => set("service", x.id)} className={`chip ${f.service === x.id ? "chip-on" : ""}`} aria-pressed={f.service === x.id}>{x.name[locale]}</button>)}</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="q-sqft">{s.sqft} <span className="font-normal text-ink-500">({d.common.optional})</span></label><input id="q-sqft" type="number" min={100} step={50} className="field" value={f.sqft} onChange={(e) => set("sqft", e.target.value)} inputMode="numeric" /></div>
        <div><label className="label" htmlFor="q-units">{s.units}</label><input id="q-units" type="number" min={1} max={500} className="field" value={f.units} onChange={(e) => set("units", e.target.value)} inputMode="numeric" /></div>
        <div><label className="label" htmlFor="q-freq">{s.frequency}</label><select id="q-freq" className="field" value={f.frequency} onChange={(e) => set("frequency", e.target.value)}>{Object.entries(s.freq).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label className="label" htmlFor="q-when">{s.when}</label><select id="q-when" className="field" value={f.when} onChange={(e) => set("when", e.target.value)}>{Object.entries(s.whenOpts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="q-start">{s.start}</label><select id="q-start" className="field" value={f.start} onChange={(e) => set("start", e.target.value)}>{Object.entries(s.startOpts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="q-address">{d.common.address}</label><input id="q-address" required className="field" value={f.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="q-details">{s.details} <span className="font-normal text-ink-500">({d.common.optional})</span></label><textarea id="q-details" rows={3} className="field" placeholder={s.detailsPh} value={f.details} onChange={(e) => set("details", e.target.value)} /></div>
      </div>
      <div className="grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        <div><label className="label" htmlFor="q-company">{d.common.company}</label><input id="q-company" required className="field" value={f.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" /></div>
        <div><label className="label" htmlFor="q-name">{d.common.name}</label><input id="q-name" required className="field" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>
        <div><label className="label" htmlFor="q-email">{d.common.email}</label><input id="q-email" required type="email" className="field" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></div>
        <div><label className="label" htmlFor="q-phone">{d.common.phone}</label><input id="q-phone" required type="tel" className="field" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></div>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} aria-hidden />
      <label className="flex items-start gap-3 text-[14px] text-ink-700"><input type="checkbox" required checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 h-4 w-4 accent-navy-900" />{d.common.consent}</label>
      {state === "err" && <p className="text-[14px] text-red-700">{d.common.error}</p>}
      <div className="flex flex-wrap items-center gap-4"><button className="btn btn-primary" disabled={state === "busy"}>{state === "busy" ? d.common.sending : s.submit}<I.arrow width={18} height={18} /></button><p className="text-[12.5px] text-ink-500">{s.b2b}</p></div>
    </form>
  );
}
