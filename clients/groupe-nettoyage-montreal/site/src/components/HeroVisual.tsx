import type { Locale } from "@/i18n/config";
import { I } from "./Icons";
/** Product-style visual: booking card, visit report, rating. Replaces stock photography until the photo shoot. */
export function HeroVisual({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="relative rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:p-6">
        <div className="rounded-2xl bg-white p-5 text-ink-900 shadow-soft">
          <div className="flex items-center justify-between"><p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">{fr ? "Réservation" : "Booking"}</p><span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-600">{fr ? "Confirmée" : "Confirmed"}</span></div>
          <p className="mt-2 text-[18px] font-semibold text-navy-950">{fr ? "Ménage régulier · 4½" : "Regular clean · 2-bedroom"}</p>
          <p className="text-[14px] text-ink-600">{fr ? "Jeudi 8 h – 10 h 30 · Rosemont" : "Thursday 8:00 – 10:30 · Rosemont"}</p>
          <div className="mt-4 flex items-end justify-between"><div><p className="text-[12px] text-ink-500">{fr ? "Prix ferme" : "Firm price"}</p><p className="text-3xl font-semibold tracking-tight text-navy-950">128 $</p></div><div className="flex -space-x-2">{["MA", "JL"].map((x) => <span key={x} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-navy-900 text-[11px] font-semibold text-white">{x}</span>)}</div></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-4 text-ink-900 shadow-soft"><p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-ink-500"><I.camera width={14} height={14} />{fr ? "Rapport de visite" : "Visit report"}</p>
            <ul className="mt-3 space-y-2 text-[13px]">{(fr ? ["Cuisine", "Salles de bain", "Planchers", "Plinthes"] : ["Kitchen", "Bathrooms", "Floors", "Baseboards"]).map((x) => <li key={x} className="flex items-center gap-2"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 text-teal-600"><I.check width={10} height={10} strokeWidth={3} /></span>{x}</li>)}</ul>
            <p className="mt-3 text-[11px] text-ink-500">{fr ? "12 photos · 10 h 24" : "12 photos · 10:24"}</p></div>
          <div className="flex flex-col justify-between rounded-2xl bg-amber-500 p-4 text-navy-950 shadow-soft"><p className="text-[12px] font-semibold uppercase tracking-wider">{fr ? "Satisfaction" : "Satisfaction"}</p><div><p className="text-4xl font-semibold tracking-tight">4,9</p><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <I.star key={i} width={14} height={14} />)}</div><p className="mt-1 text-[11px] opacity-80">{fr ? "avis Google · exemple" : "Google reviews · sample"}</p></div></div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 hidden rounded-2xl bg-navy-800 px-4 py-3 text-[13px] text-white shadow-soft sm:block"><span className="flex items-center gap-2"><I.clock width={16} height={16} className="text-amber-400" />{fr ? "Un oubli? Retour sous 24 h, sans frais." : "Missed something? Fixed within 24 h, free."}</span></div>
    </div>
  );
}
