import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { ZONES, type Zone } from "@/content/zones";
import { SERVICES } from "@/content/services";
import { Section, Heading, ServiceCard, CtaBand, PageHero, Breadcrumbs, Faq } from "@/components/ui";
import { JsonLd, breadcrumbJsonLd } from "@/components/JsonLd";
import { I } from "@/components/Icons";
import { BIZ } from "@/content/business";
import { SERVICE_PHOTO } from "@/content/media";
import { mediaExists } from "@/lib/media-exists";

export function ZonesIndex({ locale }: { locale: Locale }) {
  const d = t(locale);
  return (
    <>
      <PageHero eyebrow={d.nav.zones} title={locale === "fr" ? "Montréal, Laval et les deux rives" : "Montréal, Laval and both shores"} sub={locale === "fr" ? "Des équipes basées dans chaque secteur. Aucun frais de déplacement sur l'île de Montréal; 15 $ à 20 $ pour les rives, offerts sur les services récurrents." : "Teams based in each area. No travel fee on the island of Montréal; $15 to $20 for the shores, waived on recurring service."} />
      <Section><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{ZONES.map((z) => <Link key={z.id} href={pagePath(locale, "zones", z.slug[locale])} className="card p-6 hover:shadow-soft"><p className="eyebrow">{z.region[locale]}</p><h2 className="mt-2 text-[20px] font-semibold text-navy-950">{z.name[locale]}</h2><p className="mt-2 text-[15px] leading-relaxed text-ink-600">{z.intro[locale]}</p><p className="mt-4 text-[13px] text-ink-500">{z.sectors.slice(0, 4).join(" · ")}</p></Link>)}</div></Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function ZonePage({ locale, z }: { locale: Locale; z: Zone }) {
  const d = t(locale); const services = SERVICES.filter((s) => z.popular.includes(s.id));
  const faq = locale === "fr" ? [
    { q: `Y a-t-il des frais de déplacement à ${z.name.fr}?`, a: z.travelFee ? `${z.travelFee} $ par visite ponctuelle, offerts pour les services récurrents et les contrats commerciaux.` : "Non, aucun frais de déplacement sur l'île de Montréal." },
    { q: "Quels secteurs exactement?", a: `${z.sectors.join(", ")}. Les secteurs voisins sont évalués au cas par cas.` },
    { q: "Quel délai pour un premier rendez-vous?", a: "Les créneaux en ligne commencent le lendemain. Pour le commercial, la visite d'évaluation se fait généralement dans les 48 heures." },
  ] : [
    { q: `Is there a travel fee in ${z.name.en}?`, a: z.travelFee ? `$${z.travelFee} per one-time visit, waived for recurring service and commercial agreements.` : "No, there is no travel fee on the island of Montréal." },
    { q: "Which sectors exactly?", a: `${z.sectors.join(", ")}. Neighbouring sectors are assessed case by case.` },
    { q: "How soon can you come?", a: "Online slots start the next day. For commercial, the walkthrough usually happens within 48 hours." },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: d.nav.zones, path: pagePath(locale, "zones") }, { name: z.name[locale], path: pagePath(locale, "zones", z.slug[locale]) }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: locale === "fr" ? `Entretien ménager ${z.name.fr}` : `Cleaning services ${z.name.en}`, provider: { "@id": `${BIZ.url}/#business` }, areaServed: { "@type": "Place", name: z.name[locale] } }} />
      <PageHero eyebrow={z.region[locale]} title={locale === "fr" ? `Entretien ménager à ${z.name.fr}` : `Cleaning services in ${z.name.en}`} sub={z.intro[locale]}><Link href={pagePath(locale, "quote")} className="btn btn-primary">{d.hero.cta}</Link><a href={`tel:${BIZ.phone}`} className="btn btn-light"><I.phone width={18} height={18} />{BIZ.phoneDisplay}</a></PageHero>
      <Breadcrumbs items={[{ name: locale === "fr" ? "Accueil" : "Home", href: locale === "fr" ? "/" : "/en" }, { name: d.nav.zones, href: pagePath(locale, "zones") }, { name: z.name[locale] }]} />
      <Section className="!pt-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="prose-gnm"><h2 className="!mt-0">{locale === "fr" ? `Ce que nous savons de ${z.name.fr}` : `What we know about ${z.name.en}`}</h2><p>{z.local[locale]}</p>
            <h2>{locale === "fr" ? "Secteurs desservis" : "Sectors served"}</h2><div className="flex flex-wrap gap-2">{z.sectors.map((s) => <span key={s} className="chip cursor-default">{s}</span>)}</div>
            <h2>{d.common.faq}</h2><Faq items={faq} /></div>
          <aside className="space-y-4"><h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{locale === "fr" ? "Services populaires ici" : "Popular services here"}</h3>{services.map((s) => <ServiceCard key={s.id} s={s} locale={locale} photo={mediaExists(SERVICE_PHOTO[s.id]) ? SERVICE_PHOTO[s.id] : null} />)}</aside>
        </div>
      </Section>
      <Section tone="sand"><Heading title={locale === "fr" ? "Autres zones" : "Other areas"} /><div className="mt-6 flex flex-wrap gap-2">{ZONES.filter((x) => x.id !== z.id).map((x) => <Link key={x.id} href={pagePath(locale, "zones", x.slug[locale])} className="chip">{x.name[locale]}</Link>)}</div></Section>
      <CtaBand locale={locale} />
    </>
  );
}
