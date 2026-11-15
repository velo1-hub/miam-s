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
import { PrintButton, ReadingProgress, TocSpy } from "./ReadingTools";
import { DocChecklist } from "./tools/DocChecklist";
import { TaxCalculator } from "./tools/TaxCalculator";
import { ThresholdCheck } from "./tools/ThresholdCheck";
import { toolsText } from "@/content/tools";

/** Date de dernière révision du contenu fiscal (à mettre à jour après relecture). */
const REVIEWED = "2026-11-15";

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

/** Gabarit d'une page de préoccupation : réponse simple → explication → FAQ (5) → « Parler à un CPA ». */
export function ConcernPage({ lang, routeKey }: { lang: Lang; routeKey: RouteKey }) {
  const c = concernByKey(routeKey);
  const x = c[lang];
  const t = dict(lang);
  const hub = c.audience;
  const hubLabel = hub === "individuals" ? t.nav.individuals : t.nav.businesses;
  const tool = routeKey === "salesTax" ? "sales" : routeKey === "personalTaxes" || routeKey === "selfEmployed" || routeKey === "lifeChanges" ? "docs" : null;
  const tt = toolsText[lang];
  const toc = [
    ...x.sections.map((s) => ({ id: slug(s.h2), label: s.h2 })),
    ...(tool ? [{ id: "outil", label: tool === "sales" ? tt.calc.h2 : tt.checklist.h2 }] : []),
    { id: "faq", label: t.concern.faq },
  ];
  const fr = lang === "fr";
  const minutes = Math.max(2, Math.round([x.answer, ...x.sections.flatMap((s) => [...(s.paras ?? []), ...(s.list ?? []), ...(s.after ?? [])]), ...x.faq.map((f) => f.q + f.a)].join(" ").split(/\s+/).length / 200));
  const reviewed = new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(REVIEWED + "T12:00:00Z"));

  return (
    <Shell lang={lang} routeKey={routeKey}>
      <JsonLd data={faqSchema(x.faq)} />
      <ReadingProgress targetId="article-body" />
      <TocSpy ids={toc.map((i) => i.id)} />
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
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><Icon name="clock" className="h-4 w-4" /> {fr ? `Lecture : ${minutes} min` : `${minutes} min read`}</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="badge" className="h-4 w-4" /> {fr ? "Révisé par un CPA le " : "Reviewed by a CPA on "}<time dateTime={REVIEWED}>{reviewed}</time></span>
          </p>
        </PageHeader>

        <div id="article-body" className="container-site grid gap-14 py-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
          <div className="max-w-3xl min-w-0">
            <div className="prose-site space-y-12">
              {x.sections.map((s) => (
                <section key={s.h2} id={slug(s.h2)} className="reveal">
                  <h2 className="mb-5 text-2xl font-semibold sm:text-[1.75rem]">{s.h2}</h2>
                  {s.paras?.map((p) => <p key={p}>{p}</p>)}
                  {s.list && <ul>{s.list.map((li) => <li key={li}>{li}</li>)}</ul>}
                  {s.after?.map((p) => <p key={p}>{p}</p>)}
                </section>
              ))}
            </div>

            {tool && (
              <section id="outil" aria-labelledby="outil-title" className="mt-16">
                <p className="eyebrow">{fr ? "Outil gratuit" : "Free tool"}</p>
                <h2 id="outil-title" className="h2">{tool === "sales" ? tt.calc.h2 : tt.checklist.h2}</h2>
                <p className="lead mt-3">{tool === "sales" ? tt.calc.intro : tt.checklist.intro}</p>
                <div className="mt-8">
                  {tool === "sales" ? (
                    <div className="grid gap-6 xl:grid-cols-2"><TaxCalculator lang={lang} /><ThresholdCheck lang={lang} /></div>
                  ) : (
                    <DocChecklist lang={lang} preset={routeKey === "selfEmployed" ? ["selfEmployed"] : routeKey === "lifeChanges" ? ["homebuyer", "parent"] : ["employee"]} />
                  )}
                </div>
              </section>
            )}

            <Faq items={x.faq} title={t.concern.faq} />
            <p className="mt-8 rounded-2xl bg-paper p-5 text-sm leading-relaxed text-muted">{t.concern.disclaimer}</p>
          </div>

          {/* Liens internes entre préoccupations */}
          <aside aria-labelledby="related-title" className="lg:sticky lg:top-36 lg:self-start">
            <nav aria-labelledby="toc-title" className="glass mb-8 hidden rounded-[1.5rem] p-5 lg:block">
              <h2 id="toc-title" className="text-xs font-semibold tracking-[0.14em] text-navy uppercase">{fr ? "Sur cette page" : "On this page"}</h2>
              <ol className="mt-3 space-y-1 border-l border-navy/10">
                {toc.map((i) => (
                  <li key={i.id}>
                    <a href={`#${i.id}`} data-toc={i.id} className="-ml-px block border-l-2 border-transparent py-1.5 pl-3 text-sm leading-snug text-muted hover:text-navy aria-[current=true]:border-navy aria-[current=true]:font-semibold aria-[current=true]:text-navy">{i.label}</a>
                  </li>
                ))}
              </ol>
              <div className="mt-4 border-t border-navy/10 pt-4"><PrintButton label={fr ? "Imprimer cette page" : "Print this page"} /></div>
            </nav>
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
