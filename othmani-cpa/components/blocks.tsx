import Link from "next/link";
import type { ReactNode } from "react";
import { dict } from "@/content/ui";
import { href } from "@/lib/routes";
import type { Crumb } from "@/lib/schema";
import type { Lang } from "@/lib/site";
import { Breadcrumbs } from "./Breadcrumbs";
import { Icon } from "./Icon";

export function PageHeader({ lang, crumbs, eyebrow, title, intro, children }: { lang: Lang; crumbs: Crumb[]; eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mesh relative overflow-hidden border-b border-line">
      <svg className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 text-sky/30" viewBox="0 0 200 200" fill="none" aria-hidden="true">
        <circle cx="100" cy="100" r="99" stroke="currentColor" />
        <circle cx="100" cy="100" r="70" stroke="currentColor" />
        <circle cx="100" cy="100" r="41" stroke="currentColor" />
      </svg>
      <div className="container-site relative py-12 sm:py-16">
        <Breadcrumbs lang={lang} items={crumbs} />
        {eyebrow && <p className="eyebrow mt-8">{eyebrow}</p>}
        <h1 className={`${eyebrow ? "" : "mt-8"} max-w-3xl text-[2.1rem] leading-[1.1] font-semibold sm:text-5xl`}>{title}</h1>
        {intro && <div className="lead mt-5 max-w-2xl">{intro}</div>}
        {children}
      </div>
    </div>
  );
}

export function CtaBand({ lang, title, text }: { lang: Lang; title?: string; text?: string }) {
  const t = dict(lang);
  return (
    <section className="container-site py-16 sm:py-20" aria-labelledby="cta-band-title">
      <div className="reveal on-dark mesh-dark relative overflow-hidden rounded-[2rem] px-6 py-12 text-white sm:px-12 sm:py-14">
        <div className="absolute -top-20 left-1/3 h-64 w-64 rounded-full bg-sky/30 blur-3xl" aria-hidden="true" />
        <svg className="pointer-events-none absolute -right-16 -bottom-24 h-80 w-80 text-sky/25" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <circle cx="100" cy="100" r="99" stroke="currentColor" /><circle cx="100" cy="100" r="66" stroke="currentColor" />
        </svg>
        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 id="cta-band-title" className="text-3xl font-semibold text-white">{title ?? t.concern.ctaTitle}</h2>
            <p className="mt-3 text-lg text-white/85">{text ?? t.concern.ctaText}</p>
          </div>
          <Link href={href("contact", lang)} className="btn-light shrink-0">{t.cta.talk} <Icon name="arrow" className="h-5 w-5" /></Link>
        </div>
      </div>
    </section>
  );
}

export function Faq({ items, title, id = "faq" }: { items: { q: string; a: string }[]; title: string; id?: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-16">
      <h2 id={`${id}-title`} className="h2">{title}</h2>
      <div className="mt-8 divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line">
        {items.map((f, i) => (
          <details key={f.q} className="group bg-white open:bg-paper" open={i === 0}>
            <summary className="flex cursor-pointer items-center justify-between gap-6 px-5 py-5 sm:px-7">
              <h3 className="font-display text-lg leading-snug font-semibold">{f.q}</h3>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-navy transition-transform group-open:rotate-45" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </span>
            </summary>
            <p className="px-5 pb-6 leading-relaxed text-ink/90 sm:px-7">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** En-tête de section uniforme : surtitre, titre, introduction et action facultative. */
export function SectionHead({ id, eyebrow, title, intro, action, dark = false, center = false }: { id: string; eyebrow: string; title: string; intro?: string; action?: ReactNode; dark?: boolean; center?: boolean }) {
  return (
    <div className={`reveal flex flex-col gap-6 md:flex-row md:items-end ${center ? "md:justify-center text-center" : "md:justify-between"}`}>
      <div className={`max-w-2xl ${center ? "mx-auto" : ""}`}>
        <p className={`eyebrow ${dark ? "text-sky" : ""} ${center ? "justify-center" : ""}`}>{eyebrow}</p>
        <h2 id={id} className={`h2 ${dark ? "text-white" : ""}`}>{title}</h2>
        {intro && <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-white/80" : "text-muted"}`}>{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
