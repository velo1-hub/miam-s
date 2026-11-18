import Link from "next/link";
import type { ReactNode } from "react";
import { I, type IconName } from "./Icons";
import type { Locale } from "@/i18n/config";
import { pagePath } from "@/i18n/config";
import { t } from "@/i18n/dict";
import type { Service } from "@/content/services";

export function Section({ children, className = "", tone = "white", id }: { children: ReactNode; className?: string; tone?: "white" | "sand" | "navy"; id?: string }) {
  const bg = tone === "sand" ? "bg-sand-50" : tone === "navy" ? "bg-navy-950 text-white" : "bg-white";
  return <section id={id} className={`${bg} py-16 sm:py-20 lg:py-24 ${className}`}><div className="container-x">{children}</div></section>;
}
export function Heading({ eyebrow, title, sub, light = false, center = false }: { eyebrow?: string; title: string; sub?: string; light?: boolean; center?: boolean }) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow ${light ? "!text-amber-400" : ""}`}>{eyebrow}</p>}
      <h2 className={`h-display mt-3 text-3xl sm:text-4xl ${light ? "!text-white" : ""}`}>{title}</h2>
      {sub && <p className={`mt-4 text-[17px] leading-relaxed ${light ? "text-white/75" : "text-ink-600"}`}>{sub}</p>}
    </div>
  );
}
export function PageHero({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div className="pattern-grid absolute inset-0" aria-hidden />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" aria-hidden />
      <div className="container-x relative py-16 sm:py-20">
        <div className="max-w-3xl">
          {eyebrow && <p className="eyebrow !text-amber-400">{eyebrow}</p>}
          <h1 className="h-display mt-3 text-4xl !text-white sm:text-5xl">{title}</h1>
          {sub && <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-white/80">{sub}</p>}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}
export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="container-x py-4 text-[13px] text-ink-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => <li key={i} className="flex items-center gap-2">{i > 0 && <span aria-hidden>/</span>}{it.href ? <Link href={it.href} className="hover:text-navy-900">{it.name}</Link> : <span className="font-medium text-navy-900">{it.name}</span>}</li>)}
      </ol>
    </nav>
  );
}
export function ServiceCard({ s, locale }: { s: Service; locale: Locale }) {
  const d = t(locale); const Icon = I[s.icon as IconName];
  return (
    <Link href={pagePath(locale, "services", s.slug[locale])} className="card group flex h-full flex-col p-6 transition-shadow hover:shadow-soft">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand-100 text-navy-900"><Icon width={22} height={22} /></span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${s.bookable ? "bg-teal-100 text-teal-600" : "bg-sand-100 text-ink-600"}`}>{s.bookable ? (locale === "fr" ? "Réservable en ligne" : "Book online") : (locale === "fr" ? "Sur visite" : "Walkthrough")}</span>
      </div>
      <h3 className="mt-5 text-[19px] font-semibold text-navy-950">{s.name[locale]}</h3>
      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-600">{s.short[locale]}</p>
      <div className="mt-5 flex items-center justify-between text-[14px]"><span className="font-semibold text-navy-900">{s.priceHint[locale]}</span><span className="flex items-center gap-1 font-medium text-amber-600 group-hover:gap-2 transition-all">{d.common.learnMore}<I.arrow width={16} height={16} /></span></div>
    </Link>
  );
}
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((it, i) => (
        <details key={i} className="group px-5 py-4 open:bg-sand-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-navy-950 marker:content-none">
            {it.q}<span className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-ink-600 transition-transform group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
export function CtaBand({ locale, title, sub }: { locale: Locale; title?: string; sub?: string }) {
  const d = t(locale);
  return (
    <Section tone="navy" className="!py-16">
      <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl"><h2 className="h-display text-3xl !text-white sm:text-4xl">{title ?? d.sections.ctaTitle}</h2><p className="mt-3 text-[17px] text-white/75">{sub ?? d.sections.ctaSub}</p></div>
        <div className="flex flex-wrap gap-3"><Link href={pagePath(locale, "quote")} className="btn btn-primary">{d.hero.cta}</Link><Link href={pagePath(locale, "contact")} className="btn btn-light">{d.nav.contact}</Link></div>
      </div>
    </Section>
  );
}
export function Check({ children }: { children: ReactNode }) {
  return <li className="flex items-start gap-3 text-[15.5px] text-ink-700"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600"><I.check width={13} height={13} strokeWidth={2.5} /></span>{children}</li>;
}
