import Link from "next/link";
import { concernsFor } from "@/content/concerns";
import { pagesText } from "@/content/pages";
import { dict } from "@/content/ui";
import { href } from "@/lib/routes";
import type { Lang } from "@/lib/site";
import { CtaBand, PageHeader } from "../blocks";
import { Icon } from "../Icon";
import { Shell } from "../Shell";
import { Steps } from "../home";

export function HubPage({ lang, audience }: { lang: Lang; audience: "individuals" | "businesses" }) {
  const p = pagesText[audience][lang];
  const t = dict(lang);
  const items = concernsFor(audience);
  return (
    <Shell lang={lang} routeKey={audience}>
      <PageHeader lang={lang} crumbs={[{ name: audience === "individuals" ? t.nav.individuals : t.nav.businesses, key: audience }]} eyebrow={audience === "individuals" ? t.doors.me : t.doors.business} title={p.h1} intro={<p>{p.intro}</p>} />

      <section className="section mesh" aria-labelledby="hub-concerns">
        <div className="container-site">
          <h2 id="hub-concerns" className="h2 reveal">{t.doors.h2}</h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {items.map((c, i) => (
              <li key={c.key} className="reveal" data-delay={String((i % 2) + 1)}>
                <Link href={href(c.key, lang)} className="glass group flex h-full flex-col rounded-[1.75rem] p-7 transition-transform hover:-translate-y-1">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-navy"><Icon name={c.icon} /></span>
                  <h3 className="mt-5 text-xl font-semibold">{c[lang].label}</h3>
                  <p className="mt-1 font-medium text-navy/90">{c[lang].h1}</p>
                  <p className="mt-3 flex-1 leading-relaxed text-muted">{c[lang].teaser}</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-semibold text-navy">
                    {t.pro.readAnswer}
                    <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="hub-do">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <div className="reveal">
            <h2 id="hub-do" className="h2">{p.doH2}</h2>
            <p className="lead mt-4">{p.areas}</p>
          </div>
          <ul className="reveal grid gap-3" data-delay="2">
            {p.do.map((d) => (
              <li key={d} className="glass flex items-start gap-3 rounded-2xl p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-white"><Icon name="check" className="h-4 w-4" strokeWidth={2.4} /></span>
                <span className="leading-relaxed">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Steps lang={lang} />
      <CtaBand lang={lang} />
    </Shell>
  );
}
