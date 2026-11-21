import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { SERVICES, type Service } from "@/content/services";
import { ZONES } from "@/content/zones";
import { BIZ } from "@/content/business";
import { Section, ServiceCard, Faq, CtaBand, Check, PageHero, Breadcrumbs } from "@/components/ui";
import { JsonLd, serviceJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/JsonLd";
import { AssistantOpen } from "@/components/AssistantOpen";
import { SERVICE_PHOTO } from "@/content/media";
import { mediaExists } from "@/lib/media-exists";
import { I, type IconName } from "@/components/Icons";

export function ServicesIndex({ locale }: { locale: Locale }) {
  const d = t(locale);
  return (
    <>
      <PageHero eyebrow={d.nav.services} title={d.sections.servicesTitle} sub={d.sections.servicesSub}><Link href={pagePath(locale, "book")} className="btn btn-primary">{d.common.bookNow}</Link><Link href={pagePath(locale, "quote")} className="btn btn-light">{d.hero.cta}</Link></PageHero>
      <Section><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{SERVICES.map((s) => <ServiceCard key={s.id} s={s} locale={locale} photo={mediaExists(SERVICE_PHOTO[s.id]) ? SERVICE_PHOTO[s.id] : null} />)}</div>
        <p className="mt-10 max-w-2xl text-[14.5px] text-ink-500">{locale === "fr" ? "Nous travaillons uniquement avec des entreprises, des gestionnaires et des propriétaires d'immeubles. Nous n'offrons pas de ménage résidentiel pour particuliers." : "We work only with businesses, managers and building owners. We do not offer residential cleaning for private individuals."}</p></Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function ServicePage({ locale, s }: { locale: Locale; s: Service }) {
  const d = t(locale); const fr = locale === "fr"; const Icon = I[s.icon as IconName];
  const photo = mediaExists(SERVICE_PHOTO[s.id]) ? SERVICE_PHOTO[s.id] : null;
  const related = SERVICES.filter((x) => x.id !== s.id).slice(0, 3);
  const zones = ZONES.filter((z) => z.popular.includes(s.id)).slice(0, 5);
  return (
    <>
      <JsonLd data={serviceJsonLd(locale, s)} /><JsonLd data={faqJsonLd(s.faq[locale])} /><JsonLd data={breadcrumbJsonLd(locale, [{ name: d.nav.services, path: pagePath(locale, "services") }, { name: s.name[locale], path: pagePath(locale, "services", s.slug[locale]) }])} />
      <section className="relative overflow-hidden bg-navy-950 pt-20 text-white sm:pt-24">
        {photo ? <><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} aria-hidden /><div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/85 to-navy-950/45" aria-hidden /><div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/30" aria-hidden /></> : <div className="aurora" aria-hidden><div className="aurora-blob a1" /><div className="aurora-blob a2" /></div>}
        <div className="grain" aria-hidden />
        <div className="container-x relative grid gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24" style={{ textShadow: photo ? "0 1px 2px rgba(0,0,0,.4)" : undefined }}>
          <div><p className="eyebrow !text-amber-400">{d.sections.commercial}</p><h1 className="h-display mt-3 text-4xl !text-white sm:text-5xl">{s.name[locale]}</h1><p className="mt-5 text-[19px] leading-relaxed text-white/85">{s.tagline[locale]}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href={`${pagePath(locale, "book")}?service=${s.id}`} className="btn btn-primary"><I.calendar width={18} height={18} />{d.common.walkthrough}</Link><Link href={`${pagePath(locale, "quote")}?service=${s.id}`} className="btn btn-light">{d.hero.cta}</Link></div>
            <p className="mt-5 text-[14px] text-white/70">{s.format[locale]} · {fr ? "soumission écrite en 24 h" : "written quote within 24 h"}</p></div>
          <div className="glass rounded-3xl p-6"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-navy-950"><Icon width={24} height={24} /></span><h2 className="mt-4 text-[16px] font-semibold">{d.common.idealFor}</h2><ul className="mt-3 space-y-2 text-[15px] text-white/85">{s.idealFor[locale].map((x) => <li key={x} className="flex gap-2"><I.check width={16} height={16} className="mt-1 shrink-0 text-amber-400" strokeWidth={2.5} />{x}</li>)}</ul></div>
        </div></section>
      <Breadcrumbs items={[{ name: fr ? "Accueil" : "Home", href: fr ? "/" : "/en" }, { name: d.nav.services, href: pagePath(locale, "services") }, { name: s.name[locale] }]} />
      <Section className="!pt-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="prose-gnm"><p>{s.intro[locale]}</p><p>{s.intro2[locale]}</p>
            <h2>{d.common.included}</h2><ul className="!list-none !pl-0 grid gap-2.5 sm:grid-cols-2">{s.included[locale].map((x) => <Check key={x}>{x}</Check>)}</ul>
            <h2>{d.common.faq}</h2><Faq items={s.faq[locale]} /></div>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <div className="bg-navy-950 p-5 text-white"><p className="eyebrow !text-amber-400">{fr ? "Prochaine étape" : "Next step"}</p><h3 className="mt-2 text-[20px] font-semibold">{fr ? "Visite gratuite de 20 minutes" : "Free 20-minute walkthrough"}</h3><p className="mt-2 text-[14.5px] text-white/75">{fr ? "En semaine, à l'heure qui vous convient. Soumission écrite et détaillée dans les 24 heures. Aucun engagement." : "On a weekday, at the time that suits you. Detailed written quote within 24 hours. No commitment."}</p></div>
              <div className="space-y-2 p-5"><Link href={`${pagePath(locale, "book")}?service=${s.id}`} className="btn btn-primary w-full"><I.calendar width={18} height={18} />{d.common.bookNow}</Link><Link href={`${pagePath(locale, "quote")}?service=${s.id}`} className="btn btn-ghost w-full">{d.hero.cta}</Link><AssistantOpen className="btn btn-ghost w-full">{d.hero.cta2}<I.chat width={18} height={18} /></AssistantOpen><a href={`tel:${BIZ.phone}`} className="block pt-1 text-center text-[14px] font-semibold text-navy-900">{BIZ.phoneDisplay}</a></div>
            </div>
            <div className="card p-5"><h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{d.common.relatedZones}</h3><div className="mt-3 flex flex-wrap gap-2">{zones.map((z) => <Link key={z.id} href={pagePath(locale, "zones", z.slug[locale])} className="chip">{z.name[locale]}</Link>)}</div></div>
            <div className="card p-5"><h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{d.common.relatedServices}</h3><ul className="mt-3 space-y-2">{related.map((r) => <li key={r.id}><Link href={pagePath(locale, "services", r.slug[locale])} className="flex items-center justify-between text-[15px] font-medium text-navy-900 hover:text-amber-600">{r.name[locale]}<I.arrow width={16} height={16} /></Link></li>)}</ul></div>
          </aside>
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
