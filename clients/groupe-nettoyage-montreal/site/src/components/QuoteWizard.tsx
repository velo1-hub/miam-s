"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SERVICES, type ServiceId } from "@/content/services";
import { ZONES } from "@/content/zones";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { fmtCAD, type QuoteInput, type QuoteResult, type HomeType, type Frequency, type Addon } from "@/lib/pricing";
import { I, type IconName } from "./Icons";

const QUOTE_KEY = "gnm-quote";
export function saveQuote(input: QuoteInput & { zone?: string }) { try { sessionStorage.setItem(QUOTE_KEY, JSON.stringify(input)); } catch {} }
export function loadQuote(): (QuoteInput & { zone?: string }) | null { try { const v = sessionStorage.getItem(QUOTE_KEY); return v ? JSON.parse(v) : null; } catch { return null; } }

const L = {
  fr: { step: ["Service", "Détails", "Votre prix"], segRes: "Résidentiel", segCom: "Commercial", homeType: "Type de logement", types: { studio: "Studio / 1½–2½", "3half": "3½", "4half": "4½", "5half": "5½ et plus", house: "Maison" }, bedrooms: "Chambres", bathrooms: "Salles de bain", floors: "Étages", sqft: "Superficie (pi²)", frequency: "Fréquence", freq: { once: "Une fois", weekly: "Hebdomadaire (−15 %)", biweekly: "Aux deux semaines (−10 %)", monthly: "Mensuel" }, visits: "Passages par semaine", addons: "Extras", addon: { oven: "Four (int.)", fridge: "Frigo (int.)", windows: "Fenêtres int.", pets: "Animaux", laundry: "Buanderie", linens: "Literie fournie", carpet: "Shampoing tapis", balcony: "Balcon" }, zone: "Secteur", calc: "Voir mon prix", firm: "Prix ferme", range: "Fourchette estimée", quoteOnly: "Sur soumission après visite", perVisit: { visit: "par visite", turnover: "par rotation", month: "par mois", project: "pour le projet" }, beforeTax: "avant taxes, produits et matériel inclus", book: "Réserver ce service", walk: "Planifier une visite gratuite (20 min)", ask: "Poser une question à l'assistant", duration: "Durée estimée", hours: "h", notes: { empty_home: "Le logement doit être vide ou presque pour ce forfait.", site_visit_required: "Au-delà de 2 500 pi², une visite gratuite précède le prix définitif.", walkthrough_required: "Le prix définitif est confirmé par écrit en 24 h après une visite gratuite de 20 minutes." }, change: "Modifier", included: "Toujours inclus : équipe attitrée, assurance, rapport photo, retour sous 24 h.", err: "Impossible de calculer le prix. Réessayez." },
  en: { step: ["Service", "Details", "Your price"], segRes: "Residential", segCom: "Commercial", homeType: "Home type", types: { studio: "Studio / 1-bed", "3half": "3½ (1 bedroom)", "4half": "4½ (2 bedrooms)", "5half": "5½ and up", house: "House" }, bedrooms: "Bedrooms", bathrooms: "Bathrooms", floors: "Floors", sqft: "Area (sq ft)", frequency: "Frequency", freq: { once: "One time", weekly: "Weekly (−15%)", biweekly: "Biweekly (−10%)", monthly: "Monthly" }, visits: "Visits per week", addons: "Add-ons", addon: { oven: "Oven (inside)", fridge: "Fridge (inside)", windows: "Interior windows", pets: "Pets", laundry: "Laundry", linens: "Linens supplied", carpet: "Carpet shampoo", balcony: "Balcony" }, zone: "Area", calc: "See my price", firm: "Firm price", range: "Estimated range", quoteOnly: "Quote after walkthrough", perVisit: { visit: "per visit", turnover: "per turnover", month: "per month", project: "for the project" }, beforeTax: "before tax, products and equipment included", book: "Book this service", walk: "Schedule a free walkthrough (20 min)", ask: "Ask the assistant", duration: "Estimated duration", hours: "h", notes: { empty_home: "The home must be empty or nearly empty for this package.", site_visit_required: "Above 2,500 sq ft, a free visit precedes the final price.", walkthrough_required: "The final price is confirmed in writing within 24 h after a free 20-minute walkthrough." }, change: "Change", included: "Always included: dedicated team, insurance, photo report, 24-hour fix.", err: "Could not compute the price. Please try again." },
};

export function QuoteWizard({ locale, initialService }: { locale: Locale; initialService?: ServiceId }) {
  const d = t(locale); const s = L[locale];
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [segment, setSegment] = useState<"residential" | "commercial">(initialService ? SERVICES.find((x) => x.id === initialService)!.segment : "residential");
  const [service, setService] = useState<ServiceId | null>(initialService ?? null);
  const [homeType, setHomeType] = useState<HomeType>("4half");
  const [bedrooms, setBedrooms] = useState(2); const [bathrooms, setBathrooms] = useState(1); const [floors, setFloors] = useState(1);
  const [sqft, setSqft] = useState(2000); const [frequency, setFrequency] = useState<Frequency>("biweekly"); const [visits, setVisits] = useState(3);
  const [addons, setAddons] = useState<Addon[]>([]); const [zone, setZone] = useState("montreal");
  const [result, setResult] = useState<{ quote: QuoteResult; tax: { total: number } } | null>(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const svc = useMemo(() => SERVICES.find((x) => x.id === service) ?? null, [service]);

  useEffect(() => { const saved = loadQuote(); if (saved && !initialService) { setService(saved.service); setSegment(SERVICES.find((x) => x.id === saved.service)?.segment ?? "residential"); if (saved.homeType) setHomeType(saved.homeType); if (saved.bedrooms != null) setBedrooms(saved.bedrooms); if (saved.sqft) setSqft(saved.sqft); if (saved.frequency) setFrequency(saved.frequency); if (saved.zone) setZone(saved.zone); } }, [initialService]);

  const input = (): QuoteInput & { zone: string } => ({ service: service!, homeType, bedrooms, bathrooms, floors, sqft, frequency, visitsPerWeek: visits, addons, windows: 4, zone });
  async function calc() {
    if (!service) return; setLoading(true); setErr("");
    try {
      const res = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...input(), locale }) });
      if (!res.ok) throw new Error(); const data = await res.json(); setResult(data); saveQuote(input()); setStep(2);
    } catch { setErr(s.err); } finally { setLoading(false); }
  }
  const addonsFor: Addon[] = service === "airbnb" ? ["linens", "laundry", "pets"] : service === "move" ? ["oven", "fridge", "windows", "carpet", "balcony"] : service === "deep" ? ["windows", "carpet", "balcony", "pets"] : ["oven", "fridge", "windows", "pets", "laundry"];
  const toggle = (a: Addon) => setAddons((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));
  const Num = ({ label, v, set, min, max }: { label: string; v: number; set: (n: number) => void; min: number; max: number }) => (
    <div><span className="label">{label}</span><div className="flex items-center gap-2"><button type="button" className="btn btn-ghost !min-h-10 !px-4 !py-1" onClick={() => set(Math.max(min, v - 1))} aria-label="−">−</button><span className="w-8 text-center text-[16px] font-semibold">{v}</span><button type="button" className="btn btn-ghost !min-h-10 !px-4 !py-1" onClick={() => set(Math.min(max, v + 1))} aria-label="+">+</button></div></div>
  );

  return (
    <div className="card overflow-hidden">
      <ol className="flex border-b border-line bg-sand-50 text-[13px] font-semibold">{s.step.map((lab, i) => <li key={lab} className={`flex flex-1 items-center gap-2 px-4 py-3 ${i === step ? "text-navy-950" : "text-ink-500"}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${i <= step ? "bg-navy-900 text-white" : "bg-line text-ink-600"}`}>{i + 1}</span><span className="hidden sm:inline">{lab}</span></li>)}</ol>
      <div className="p-5 sm:p-7">
        {step === 0 && (
          <div>
            <div className="mb-5 inline-flex rounded-full border border-line p-1 text-[14px] font-semibold">{(["residential", "commercial"] as const).map((g) => <button key={g} type="button" onClick={() => setSegment(g)} className={`rounded-full px-4 py-2 ${segment === g ? "bg-navy-900 text-white" : "text-ink-600"}`}>{g === "residential" ? s.segRes : s.segCom}</button>)}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {SERVICES.filter((x) => x.segment === segment).map((x) => { const Icon = I[x.icon as IconName]; return (
                <button key={x.id} type="button" onClick={() => { setService(x.id); setStep(1); }} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-navy-900 ${service === x.id ? "border-navy-900 bg-sand-50" : "border-line"}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-navy-900"><Icon width={20} height={20} /></span>
                  <span><span className="block text-[15px] font-semibold text-navy-950">{x.name[locale]}</span><span className="mt-0.5 block text-[13px] text-ink-600">{x.priceHint[locale]}</span></span>
                </button>); })}
            </div>
          </div>
        )}
        {step === 1 && svc && (
          <form onSubmit={(e) => { e.preventDefault(); calc(); }} className="space-y-6">
            <div className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3"><span className="text-[15px] font-semibold text-navy-950">{svc.name[locale]}</span><button type="button" className="text-[13px] font-semibold text-amber-600 underline" onClick={() => setStep(0)}>{s.change}</button></div>
            {(svc.id === "residential" || svc.id === "deep" || svc.id === "move") && (<>
              <div><span className="label">{s.homeType}</span><div className="flex flex-wrap gap-2">{(Object.keys(s.types) as HomeType[]).map((k) => <button type="button" key={k} onClick={() => setHomeType(k)} className={`chip ${homeType === k ? "chip-on" : ""}`}>{s.types[k]}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">{homeType === "house" && <Num label={s.bedrooms} v={bedrooms} set={setBedrooms} min={1} max={8} />}<Num label={s.bathrooms} v={bathrooms} set={setBathrooms} min={1} max={6} />{homeType === "house" && <Num label={s.floors} v={floors} set={setFloors} min={1} max={4} />}</div>
              {svc.id === "residential" && <div><span className="label">{s.frequency}</span><div className="flex flex-wrap gap-2">{(Object.keys(s.freq) as Frequency[]).map((k) => <button type="button" key={k} onClick={() => setFrequency(k)} className={`chip ${frequency === k ? "chip-on" : ""}`}>{s.freq[k]}</button>)}</div></div>}
            </>)}
            {svc.id === "airbnb" && <div className="grid grid-cols-2 gap-5"><Num label={s.bedrooms} v={bedrooms} set={setBedrooms} min={0} max={6} /><Num label={s.bathrooms} v={bathrooms} set={setBathrooms} min={1} max={4} /></div>}
            {(svc.id === "postconstruction" || svc.id === "office" || svc.id === "restaurant") && (
              <div><label className="label" htmlFor="sqft">{s.sqft}</label><input id="sqft" type="number" min={100} max={200000} step={50} value={sqft} onChange={(e) => setSqft(Number(e.target.value))} className="field max-w-xs" /><input type="range" min={300} max={svc.id === "office" ? 20000 : 6000} step={50} value={Math.min(sqft, 20000)} onChange={(e) => setSqft(Number(e.target.value))} className="mt-3 w-full max-w-md accent-navy-900" aria-label={s.sqft} /></div>
            )}
            {svc.id === "office" && <div><span className="label">{s.visits}</span><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setVisits(n)} className={`chip ${visits === n ? "chip-on" : ""}`}>{n}</button>)}</div></div>}
            {svc.id === "property" && <p className="rounded-xl bg-sand-50 p-4 text-[15px] text-ink-700">{s.notes.walkthrough_required}</p>}
            {svc.segment === "residential" && <div><span className="label">{s.addons}</span><div className="flex flex-wrap gap-2">{addonsFor.map((a) => <button type="button" key={a} onClick={() => toggle(a)} className={`chip ${addons.includes(a) ? "chip-on" : ""}`}>{s.addon[a]}</button>)}</div></div>}
            <div><label className="label" htmlFor="zone">{s.zone}</label><select id="zone" value={zone} onChange={(e) => setZone(e.target.value)} className="field max-w-xs">{ZONES.map((z) => <option key={z.id} value={z.id}>{z.name[locale]}</option>)}</select></div>
            {err && <p className="text-[14px] text-red-700">{err}</p>}
            <div className="flex flex-wrap gap-3"><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? d.common.loading : s.calc}<I.arrow width={18} height={18} /></button><button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>{d.common.previous}</button></div>
          </form>
        )}
        {step === 2 && result && svc && (
          <div className="rise">
            <div className="flex items-center justify-between"><span className="text-[15px] font-semibold text-navy-950">{svc.name[locale]}</span><button type="button" className="text-[13px] font-semibold text-amber-600 underline" onClick={() => setStep(1)}>{s.change}</button></div>
            <div className="mt-5 rounded-2xl bg-navy-950 p-6 text-white">
              <p className="eyebrow !text-amber-400">{result.quote.kind === "firm" ? s.firm : result.quote.kind === "range" ? s.range : s.quoteOnly}</p>
              {result.quote.kind !== "quote" || result.quote.min > 0 ? (
                <p className="mt-2 text-4xl font-semibold tracking-tight">{result.quote.min === result.quote.max ? fmtCAD(result.quote.min, locale) : `${fmtCAD(result.quote.min, locale)} – ${fmtCAD(result.quote.max, locale)}`}<span className="ml-2 text-[15px] font-normal text-white/70">{s.perVisit[result.quote.unit]}</span></p>
              ) : <p className="mt-2 text-2xl font-semibold">{s.quoteOnly}</p>}
              <p className="mt-2 text-[13.5px] text-white/65">{s.beforeTax}{result.quote.durationHours ? ` · ${s.duration} ${result.quote.durationHours.toFixed(1).replace(".0", "")} ${s.hours}` : ""}</p>
              {result.quote.notes.map((n) => <p key={n} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-[13.5px] text-white/85">{s.notes[n as keyof typeof s.notes] ?? n}</p>)}
            </div>
            <p className="mt-4 text-[13.5px] text-ink-600">{s.included}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`${pagePath(locale, "book")}?service=${svc.id}`} className="btn btn-primary">{svc.bookable && result.quote.kind !== "quote" ? s.book : s.walk}<I.calendar width={18} height={18} /></Link>
              <button type="button" className="btn btn-ghost" onClick={() => window.dispatchEvent(new CustomEvent("gnm:assistant", { detail: { open: true, context: { quote: input() } } }))}>{s.ask}<I.chat width={18} height={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
