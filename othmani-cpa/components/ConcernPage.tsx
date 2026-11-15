import Link from "next/link";
import { concernByKey } from "@/content/concerns";
import { dict } from "@/content/ui";
import { href, type RouteKey } from "@/lib/routes";
import { faqSchema } from "@/lib/schema";
import type { Lang } from "@/lib/site";
import { CtaBand, Faq, PageHeader } from "./blocks";
import { Icon } from "./Icon";
import { JsonLd } from "./JsonLd";
import { Shell } from "./Shell";

/** Gabarit d'une page de préoccupation : réponse simple → explication → FAQ (5) → « Parler à un CPA ». */
export function ConcernPage({ lang, routeKey }: { lang: Lang; routeKey: RouteKey }) {
  const c = concernByKey(routeKey);
  const x = c[lang];
  const t = dict(lang);
  const hub = c.audience;
  const hubLabel = hub === "individuals" ? t.nav.individuals : t.nav.businesses;

  return (
    <Shell lang={lang} routeKey={routeKey}>
      <JsonLd data={faqSchema(x.faq)} />
      <article>
        <PageHeader
          lang={lang}
          crumbs={[{ name: hubLabel, key: hub }, { name: x.label, key: routeKey }]}
          eyebrow={hub === "individuals" ? t.doors.me : t.doors.business}
          title={x.h1}
        >
          {/* La réponse simple, tout en haut */}
          <div className="glass mt-8 max-w-3xl rounded-[1.75rem] p-6 sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-navy uppercase">
              <Icon name="check" className="h-5 w-5" strokeWidth={2.2} /> {t.concern.short}
            </p>
            <p className="mt-3 text-lg leading-relaxed text-ink sm:text-xl">{x.answer}</p>
            <Link href={href("contact", lang)} className="btn-primary mt-6">{t.cta.talk} <Icon name="arrow" className="h-5 w-5" /></Link>
          </div>
        </PageHeader>

        <div className="container-site grid gap-14 py-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
          <div className="max-w-3xl">
            <div className="prose-site space-y-12">
              {x.sections.map((s) => (
                <section key={s.h2} className="reveal">
                  <h2 className="mb-5 text-2xl font-semibold sm:text-[1.75rem]">{s.h2}</h2>
                  {s.paras?.map((p) => <p key={p}>{p}</p>)}
                  {s.list && <ul>{s.list.map((li) => <li key={li}>{li}</li>)}</ul>}
                  {s.after?.map((p) => <p key={p}>{p}</p>)}
                </section>
              ))}
            </div>

            <Faq items={x.faq} title={t.concern.faq} />
            <p className="mt-8 rounded-2xl bg-paper p-5 text-sm leading-relaxed text-muted">{t.concern.disclaimer}</p>
          </div>

          {/* Liens internes entre préoccupations */}
          <aside aria-labelledby="related-title" className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="related-title" className="font-display text-lg font-semibold">{t.concern.related}</h2>
            <ul className="mt-4 space-y-2">
              {c.related.map((k) => {
                const r = concernByKey(k);
                return (
                  <li key={k}>
                    <Link href={href(k, lang)} className="group block rounded-2xl border border-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-[0_16px_40px_-28px_rgba(42,42,92,.6)]">
                      <span className="flex items-center gap-3 font-medium text-ink">
                        <Icon name={r.icon} className="h-5 w-5 shrink-0 text-navy" /> {r[lang].label}
                      </span>
                      <span className="mt-1.5 block text-sm leading-snug text-muted">{r[lang].teaser}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href={href(hub, lang)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy underline-offset-4 hover:underline">
              {t.concern.back[hub]} <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </article>
      <CtaBand lang={lang} />
    </Shell>
  );
}
