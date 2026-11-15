import { pagesText } from "@/content/pages";
import { dict } from "@/content/ui";
import { personSchema } from "@/lib/schema";
import type { Lang } from "@/lib/site";
import { CtaBand, PageHeader } from "../blocks";
import { Icon } from "../Icon";
import { JsonLd } from "../JsonLd";
import { Shell } from "../Shell";
import { Portrait } from "../home";

export function AboutPage({ lang }: { lang: Lang }) {
  const p = pagesText.about[lang];
  const t = dict(lang);
  return (
    <Shell lang={lang} routeKey="about">
      <JsonLd data={personSchema(lang)} />
      <PageHeader lang={lang} crumbs={[{ name: t.nav.about, key: "about" }]} title={p.h1} intro={<p>{p.intro}</p>} />
      <section className="section" aria-labelledby="about-zo">
        <div className="container-site grid items-start gap-12 md:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <div className="reveal mx-auto w-full max-w-sm"><Portrait lang={lang} /></div>
          <div className="reveal" data-delay="2">
            <h2 id="about-zo" className="h2">Zouhaier Othmani</h2>
            <p className="mt-2 font-medium text-navy">{lang === "fr" ? "CPA auditeur, fondateur" : "CPA auditor, founder"}</p>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink/90">
              {t.zouhaier.lines.map((l) => <p key={l}>{l}</p>)}
            </div>
            <h3 className="mt-10 text-xl font-semibold">{p.credH2}</h3>
            <ul className="mt-4 space-y-3">
              {p.creds.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-white"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} /></span>
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="section border-y border-line bg-paper" aria-labelledby="about-approach">
        <div className="container-site">
          <h2 id="about-approach" className="h2 reveal">{p.approachH2}</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {p.approach.map(([k, v], i) => (
              <li key={k} className="card reveal p-7" data-delay={String((i % 3) + 1)}>
                <h3 className="text-lg font-semibold">{k}</h3>
                <p className="mt-2 leading-relaxed text-muted">{v}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand lang={lang} />
    </Shell>
  );
}
