import Link from "next/link";
import { homeText } from "@/content/home";
import { pagesText } from "@/content/pages";
import { href } from "@/lib/routes";
import { faqSchema } from "@/lib/schema";
import type { Lang } from "@/lib/site";
import { Faq, SectionHead } from "./blocks";
import { Icon } from "./Icon";
import { JsonLd } from "./JsonLd";

/** Services détaillés (particuliers et entreprises). */
export function Services({ lang }: { lang: Lang }) {
  const t = homeText[lang].services;
  const cols = [
    { title: t.me, items: pagesText.individuals[lang].do, to: href("individuals", lang), icon: "user" },
    { title: t.biz, items: pagesText.businesses[lang].do, to: href("businesses", lang), icon: "briefcase" },
  ];
  return (
    <section className="section" aria-labelledby="services-title">
      <div className="container-site">
        <SectionHead id="services-title" eyebrow={t.eyebrow} title={t.h2} intro={t.intro} />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {cols.map((c, i) => (
            <div key={c.title} className="reveal rounded-[1.75rem] border border-line p-7 sm:p-9" data-delay={String(i + 1)}>
              <h3 className="flex items-center gap-3 text-xl font-semibold">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white"><Icon name={c.icon} className="h-5 w-5" /></span>
                {c.title}
              </h3>
              <ul className="mt-6 grid gap-3">
                {c.items.map((d) => (
                  <li key={d} className="flex items-start gap-3 leading-relaxed">
                    <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-sky" strokeWidth={2.6} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <Link href={c.to} className="mt-7 inline-flex items-center gap-1.5 font-semibold text-navy underline-offset-4 hover:underline">
                {t.seeAll} <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Premier rendez-vous + engagements. */
export function FirstMeeting({ lang }: { lang: Lang }) {
  const t = homeText[lang];
  return (
    <section className="section border-y border-line bg-paper" aria-labelledby="meeting-title">
      <div className="container-site">
        <SectionHead id="meeting-title" eyebrow={t.meeting.eyebrow} title={t.meeting.h2} intro={t.meeting.intro} />
        <ol className="mt-12 grid gap-5 lg:grid-cols-3">
          {t.meeting.steps.map((s, i) => (
            <li key={s.t} className="reveal flex flex-col rounded-[1.75rem] border border-line bg-white p-7" data-delay={String(i + 1)}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-sm font-semibold text-white">{i + 1}</span>
                <h3 className="text-xl font-semibold">{s.t}</h3>
              </div>
              <p className="mt-4 leading-relaxed text-ink/90">{s.d}</p>
              <ul className="mt-5 space-y-2 border-t border-navy/10 pt-5 text-[0.95rem] text-muted">
                {s.list.map((l) => (
                  <li key={l} className="flex items-start gap-2.5"><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-navy" strokeWidth={2.2} />{l}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="mt-16">
          <h3 id="commit-title" className="reveal font-display text-2xl font-semibold text-navy">{t.commitments.h2}</h3>
          <ul aria-labelledby="commit-title" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.commitments.items.map((c, i) => (
              <li key={c.t} className="reveal rounded-2xl border border-line bg-white p-6" data-delay={String((i % 3) + 1)}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-navy"><Icon name={c.icon} className="h-5 w-5" /></span>
                <p className="mt-4 font-display text-lg font-semibold text-navy">{c.t}</p>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{c.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** FAQ générale de l'accueil (avec FAQPage). */
export function HomeFaq({ lang }: { lang: Lang }) {
  const t = homeText[lang].faq;
  return (
    <section className="section border-t border-line" aria-labelledby="faq-generale-title">
      <JsonLd data={faqSchema(t.items)} />
      <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="faq-generale-title" className="h2">{t.h2}</h2>
        </div>
        <Faq items={t.items} title={t.h2} id="faq-generale" hideTitle />
      </div>
    </section>
  );
}
