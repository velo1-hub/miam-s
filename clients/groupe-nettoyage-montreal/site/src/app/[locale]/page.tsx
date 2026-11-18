import Link from "next/link";
import type { Metadata } from "next";
import { isLocale, pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { SERVICES } from "@/content/services";
import { ZONES } from "@/content/zones";
import { FAQ } from "@/content/faq";
import { BIZ } from "@/content/business";
import { Section, Heading, ServiceCard, Faq, CtaBand } from "@/components/ui";
import { JsonLd, faqJsonLd } from "@/components/JsonLd";
import { I } from "@/components/Icons";
import { AssistantOpen } from "@/components/AssistantOpen";
import { HeroVisual } from "@/components/HeroVisual";
import { Reviews } from "@/components/Reviews";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const fr = locale === "fr";
  return { title: fr ? "Entretien ménager à Montréal · Prix en ligne, réservation en 2 minutes" : "Cleaning services in Montréal · Online price, book in 2 minutes", alternates: { canonical: fr ? "/" : "/en", languages: { "fr-CA": "/", "en-CA": "/en", "x-default": "/" } } };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params; if (!isLocale(raw)) notFound(); const locale: Locale = raw; const d = t(locale);
  const res = SERVICES.filter((s) => s.segment === "residential"), com = SERVICES.filter((s) => s.segment === "commercial");
  const segments = locale === "fr" ? [["Gestionnaires immobiliers", "property"], ["Bureaux et commerces", "office"], ["Restaurants", "restaurant"], ["Hôtes Airbnb", "airbnb"], ["Propriétaires et locataires", "residential"]] : [["Property managers", "property"], ["Offices and retail", "office"], ["Restaurants", "restaurant"], ["Airbnb hosts", "airbnb"], ["Homeowners and tenants", "residential"]];
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ[locale])} />
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="pattern-grid absolute inset-0" aria-hidden />
        <div className="absolute -left-40 top-20 h-[32rem] w-[32rem] rounded-full bg-amber-500/10 blur-3xl" aria-hidden />
        <div className="container-x relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div className="rise">
            <p className="eyebrow !text-amber-400">{d.hero.eyebrow}</p>
            <h1 className="h-display mt-4 text-[2.6rem] leading-[1.05] !text-white sm:text-6xl">{d.hero.h1a} <span className="text-amber-400">{d.hero.h1b}</span></h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-white/80">{d.hero.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href={pagePath(locale, "quote")} className="btn btn-primary">{d.hero.cta}<I.arrow width={18} height={18} /></Link><AssistantOpen className="btn btn-light">{d.hero.cta2}<I.chat width={18} height={18} /></AssistantOpen></div>
            <ul className="mt-8 grid gap-2.5 text-[14.5px] text-white/85 sm:grid-cols-2">{d.hero.proof.map((p) => <li key={p} className="flex items-center gap-2"><I.check width={16} height={16} className="text-amber-400" strokeWidth={2.5} />{p}</li>)}</ul>
          </div>
          <HeroVisual locale={locale} />
        </div>
      </section>

      <Section>
        <Heading eyebrow={locale === "fr" ? "Pour qui" : "Who we serve"} title={locale === "fr" ? "Fait pour votre réalité" : "Built for your reality"} sub={locale === "fr" ? "Un gestionnaire de 40 logements et un hôte Airbnb n'ont pas les mêmes contraintes. Chaque parcours a sa page, sa liste et son prix." : "A 40-unit manager and an Airbnb host do not share the same constraints. Each path has its own page, checklist and price."} />
        <div className="mt-8 flex flex-wrap gap-2">{segments.map(([label, id]) => { const s = SERVICES.find((x) => x.id === id)!; return <Link key={id} href={pagePath(locale, "services", s.slug[locale])} className="chip !px-4 !py-2.5 !text-[14px]">{label}<I.arrow width={14} height={14} className="ml-1.5 inline" /></Link>; })}</div>
        <div className="mt-12"><h3 className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-wider text-ink-500"><span className="h-px w-8 bg-amber-500" />{d.sections.residential} · {locale === "fr" ? "prix ferme, réservation en ligne" : "firm price, online booking"}</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{res.map((s) => <ServiceCard key={s.id} s={s} locale={locale} />)}</div></div>
        <div className="mt-12"><h3 className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-wider text-ink-500"><span className="h-px w-8 bg-amber-500" />{d.sections.commercial} · {locale === "fr" ? "visite gratuite, soumission en 24 h" : "free walkthrough, quote in 24 h"}</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{com.map((s) => <ServiceCard key={s.id} s={s} locale={locale} />)}</div></div>
      </Section>

      <Section tone="sand">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div><Heading eyebrow={d.sections.howTitle} title={locale === "fr" ? "Trois étapes. Aucun appel obligatoire." : "Three steps. No mandatory phone call."} />
            <ol className="mt-8 space-y-6">{d.how.map((h, i) => <li key={h.t} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[15px] font-semibold text-white">{i + 1}</span><div><h3 className="text-[17px] font-semibold text-navy-950">{h.t}</h3><p className="mt-1 text-[15.5px] leading-relaxed text-ink-600">{h.d}</p></div></li>)}</ol>
            <div className="mt-8 flex flex-wrap gap-3"><Link href={pagePath(locale, "quote")} className="btn btn-dark">{d.hero.cta}</Link><Link href={pagePath(locale, "method")} className="btn btn-ghost">{d.nav.method}</Link></div></div>
          <div className="grid gap-4 sm:grid-cols-2">{d.guarantee.map((g, i) => { const Icon = [I.clock, I.shield, I.users, I.check][i]; return <div key={g.t} className="card p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600"><Icon width={20} height={20} /></span><h3 className="mt-4 text-[16px] font-semibold text-navy-950">{g.t}</h3><p className="mt-1 text-[14.5px] leading-relaxed text-ink-600">{g.d}</p></div>; })}</div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <Heading eyebrow={d.nav.pricing} title={d.sections.pricingTitle} sub={d.sections.pricingSub} />
          <div className="card divide-y divide-line">
            {[["residential", locale === "fr" ? "Ménage régulier 4½" : "Regular clean, 2-bedroom", "115–150 $"], ["deep", locale === "fr" ? "Grand ménage 4½" : "Deep clean, 2-bedroom", "250–330 $"], ["move", locale === "fr" ? "Déménagement 4½" : "Move-out, 2-bedroom", "290–380 $"], ["airbnb", locale === "fr" ? "Rotation Airbnb 1 ch" : "Airbnb turnover, 1 bed", "115 $"], ["office", locale === "fr" ? "Bureau 2 000 pi², 3 soirs" : "Office 2,000 sq ft, 3 nights", locale === "fr" ? "450–650 $ / mois" : "$450–650 / month"]].map(([id, label, price]) => { const s = SERVICES.find((x) => x.id === id)!; return <Link key={id} href={pagePath(locale, "services", s.slug[locale])} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-sand-50"><span className="text-[15.5px] text-ink-700">{label}</span><span className="whitespace-nowrap text-[15.5px] font-semibold text-navy-950">{price}</span></Link>; })}
            <div className="px-5 py-4 text-[13px] text-ink-500">{d.common.beforeTax} · <Link href={pagePath(locale, "pricing")} className="font-semibold text-amber-600 underline">{d.common.seeAll}</Link></div>
          </div>
        </div>
      </Section>

      <Section tone="navy" id="assistant">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div><Heading light eyebrow="IA" title={d.sections.assistantTitle} sub={locale === "fr" ? "Décrivez votre espace en une phrase. L'assistant calcule le prix, propose les créneaux libres et confirme la réservation. Un humain reste joignable à chaque étape." : "Describe your space in one sentence. The assistant computes the price, offers open slots and confirms the booking. A human stays reachable at every step."} />
            <div className="mt-8 flex flex-wrap gap-3"><AssistantOpen className="btn btn-primary">{d.hero.cta2}<I.chat width={18} height={18} /></AssistantOpen><a href={`tel:${BIZ.phone}`} className="btn btn-light"><I.phone width={18} height={18} />{BIZ.phoneDisplay}</a></div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-[14.5px] backdrop-blur">
            {(locale === "fr" ? [["u", "Ménage d'un 4½ à Rosemont aux deux semaines, avec un chat."], ["a", "Pour un 4½ (2 chambres, 1 salle de bain) aux deux semaines avec un animal, c'est 128 $ par visite avant taxes, produits inclus. Voulez-vous voir les créneaux de cette semaine?"], ["u", "Oui, jeudi matin si possible."], ["a", "Jeudi 8 h – 10 h 30 ou 10 h 30 – 13 h sont libres. Lequel vous convient?"]] : [["u", "Biweekly clean for a 2-bedroom in Verdun, we have a cat."], ["a", "For a 2-bedroom, 1-bath biweekly clean with a pet, it's $128 per visit before tax, products included. Want to see this week's slots?"], ["u", "Yes, Thursday morning if possible."], ["a", "Thursday 8:00–10:30 or 10:30–13:00 are open. Which one works?"]]).map(([r, txt], i) => <div key={i} className={`flex ${r === "u" ? "justify-end" : ""} ${i ? "mt-3" : ""}`}><p className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${r === "u" ? "bg-amber-500 text-navy-950" : "bg-white/10 text-white"}`}>{txt}</p></div>)}
          </div>
        </div>
      </Section>

      <Reviews locale={locale} />

      <Section tone="sand">
        <Heading eyebrow={d.sections.zonesTitle} title={locale === "fr" ? "Montréal, Laval et les deux rives" : "Montréal, Laval and both shores"} sub={locale === "fr" ? "Des équipes basées dans chaque secteur, sans frais de déplacement sur l'île." : "Teams based in each area, no travel fee on the island."} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{ZONES.map((z) => <Link key={z.id} href={pagePath(locale, "zones", z.slug[locale])} className="card flex items-start gap-3 p-5 hover:shadow-soft"><I.pin width={20} height={20} className="mt-0.5 shrink-0 text-amber-600" /><span><span className="block text-[16px] font-semibold text-navy-950">{z.name[locale]}</span><span className="mt-1 block text-[13.5px] text-ink-600">{z.sectors.slice(0, 3).join(" · ")}</span></span></Link>)}</div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]"><Heading eyebrow="FAQ" title={d.sections.faqTitle} sub={locale === "fr" ? "Pas de réponse à votre question? L'assistant ou le (514) 260-5194." : "Can't find your answer? Ask the assistant or call (514) 260-5194."} /><Faq items={FAQ[locale]} /></div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
