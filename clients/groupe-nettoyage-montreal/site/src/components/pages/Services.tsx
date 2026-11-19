import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { SERVICES, type Service } from "@/content/services";
import { ZONES } from "@/content/zones";
import { Section, Heading, ServiceCard, Faq, CtaBand, Check, PageHero, Breadcrumbs } from "@/components/ui";
import { JsonLd, serviceJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/JsonLd";
import { QuoteWizard } from "@/components/QuoteWizard";
import { I, type IconName } from "@/components/Icons";

export function ServicesIndex({ locale }: { locale: Locale }) {
  const d = t(locale);
  return (
    <>
      <PageHero eyebrow={d.nav.services} title={locale === "fr" ? "Un service pour chaque espace" : "A service for every space"} sub={d.sections.servicesSub}><Link href={pagePath(locale, "quote")} className="btn btn-primary">{d.hero.cta}</Link></PageHero>
      <Section><h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{d.sections.residential}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{SERVICES.filter((s) => s.segment === "residential").map((s) => <ServiceCard key={s.id} s={s} locale={locale} />)}</div>
        <h2 className="mt-14 text-[13px] font-semibold uppercase tracking-wider text-ink-500">{d.sections.commercial}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{SERVICES.filter((s) => s.segment === "commercial").map((s) => <ServiceCard key={s.id} s={s} locale={locale} />)}</div></Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function ServicePage({ locale, s }: { locale: Locale; s: Service }) {
  const d = t(locale); const Icon = I[s.icon as IconName];
  const related = SERVICES.filter((x) => x.segment === s.segment && x.id !== s.id).slice(0, 3);
  const zones = ZONES.filter((z) => z.popular.includes(s.id)).slice(0, 5);
  return (
    <>
      <JsonLd data={serviceJsonLd(locale, s)} /><JsonLd data={faqJsonLd(s.faq[locale])} /><JsonLd data={breadcrumbJsonLd(locale, [{ name: d.nav.services, path: pagePath(locale, "services") }, { name: s.name[locale], path: pagePath(locale, "services", s.slug[locale]) }])} />
      <section className="relative overflow-hidden bg-navy-950 pt-20 text-white sm:pt-24"><div className="aurora" aria-hidden><div className="aurora-blob a1" /><div className="aurora-blob a2" /></div><div className="grain" aria-hidden />
        <div className="container-x relative grid gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div><p className="eyebrow !text-amber-400">{s.segment === "residential" ? d.sections.residential : d.sections.commercial}</p><h1 className="h-display mt-3 text-4xl !text-white sm:text-5xl">{s.name[locale]}</h1><p className="mt-5 text-[19px] leading-relaxed text-white/85">{s.tagline[locale]}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href={`${pagePath(locale, "quote")}?service=${s.id}`} className="btn btn-primary">{s.bookable ? d.common.getQuote : d.common.walkthrough}<I.arrow width={18} height={18} /></Link><Link href={pagePath(locale, "contact")} className="btn btn-light">{d.nav.contact}</Link></div>
            <p className="mt-5 text-[14px] text-white/70">{s.priceHint[locale]} · {d.common.beforeTax}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-navy-950"><Icon width={24} height={24} /></span><h2 className="mt-4 text-[16px] font-semibold">{d.common.idealFor}</h2><ul className="mt-3 space-y-2 text-[15px] text-white/85">{s.idealFor[locale].map((x) => <li key={x} className="flex gap-2"><I.check width={16} height={16} className="mt-1 shrink-0 text-amber-400" strokeWidth={2.5} />{x}</li>)}</ul></div>
        </div></section>
      <Breadcrumbs items={[{ name: locale === "fr" ? "Accueil" : "Home", href: locale === "fr" ? "/" : "/en" }, { name: d.nav.services, href: pagePath(locale, "services") }, { name: s.name[locale] }]} />
      <Section className="!pt-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="prose-gnm"><p>{s.intro[locale]}</p><p>{s.intro2[locale]}</p>
            <h2>{d.common.included}</h2><ul className="!list-none !pl-0 grid gap-2.5 sm:grid-cols-2">{s.included[locale].map((x) => <Check key={x}>{x}</Check>)}</ul>
            <h2>{d.common.faq}</h2><Faq items={s.faq[locale]} /></div>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div id="quote"><QuoteWizard locale={locale} initialService={s.id} /></div>
            <div className="card p-5"><h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{d.common.relatedZones}</h3><div className="mt-3 flex flex-wrap gap-2">{zones.map((z) => <Link key={z.id} href={pagePath(locale, "zones", z.slug[locale])} className="chip">{z.name[locale]}</Link>)}</div></div>
            <div className="card p-5"><h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{d.common.relatedServices}</h3><ul className="mt-3 space-y-2">{related.map((r) => <li key={r.id}><Link href={pagePath(locale, "services", r.slug[locale])} className="flex items-center justify-between text-[15px] font-medium text-navy-900 hover:text-amber-600">{r.name[locale]}<I.arrow width={16} height={16} /></Link></li>)}</ul></div>
          </aside>
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
