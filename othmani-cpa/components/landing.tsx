import Link from "next/link";
import { preload } from "react-dom";
import type { ReactNode } from "react";
import { concernsFor, type Concern } from "@/content/concerns";
import { homeText } from "@/content/home";
import { landing } from "@/content/landing";
import { pagesText } from "@/content/pages";
import { reviews } from "@/content/reviews";
import { team } from "@/content/team";
import { dict } from "@/content/ui";
import { buildDate } from "@/lib/dates";
import { href } from "@/lib/routes";
import { faqSchema } from "@/lib/schema";
import { site, type Lang } from "@/lib/site";
import { AddressLines } from "./ContactInfo";
import { CountUp } from "./CountUp";
import { DeadlineList } from "./DeadlineList";
import { ContactForm, ReminderForm } from "./forms";
import { HeroEnhance } from "./HeroEnhance";
import { Icon } from "./Icon";
import { JsonLd } from "./JsonLd";
import { MapEmbed } from "./MapEmbed";
import { NextDeadlineInline } from "./NextDeadline";

/**
 * Page d'accueil, style « Grand livre » :
 * papier réglé, folios numérotés, parallélogrammes du logo, compte en T, points de conduite.
 */

const HERO_SRCSET = "/images/saint-leonard-800.webp 720w, /images/saint-leonard-1000.webp 1000w, /images/saint-leonard-1600.webp 1600w";
const HERO_SIZES = "(max-width: 1023px) 92vw, 44vw";

/** Surtitre de section : « ▰ 02 — Préoccupations » */
function Folio({ n, children, dark = false }: { n: string; children: ReactNode; dark?: boolean }) {
  return (
    <p className={`folio reveal ${dark ? "folio-dark" : ""}`}>
      <span className="para-glyph" aria-hidden="true" />
      <span className="tabular-nums">{n}</span>
      <span className={`h-px w-8 ${dark ? "bg-white/40" : "bg-navy/30"}`} aria-hidden="true" />
      {children}
    </p>
  );
}

function CutButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link href={to} className="btn-cut">
      <span>{children}</span>
      <span aria-hidden="true"><Icon name="arrow" className="h-5 w-5" /></span>
    </Link>
  );
}

/* ───────────── 01. Héros ───────────── */
export function LandingHero({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const L = landing[lang];
  const fr = lang === "fr";
  preload("/images/saint-leonard-1600.webp", { as: "image", fetchPriority: "high", imageSrcSet: HERO_SRCSET, imageSizes: HERO_SIZES });
  return (
    <section id="hero-track" className="hero-track relative bg-white" aria-labelledby="hero-title">
      <div className="ledger-bg sticky top-0 flex min-h-[100svh] flex-col overflow-hidden lg:h-[100svh]">
        {/* Marge du grand livre */}
        <div className="pointer-events-none absolute inset-y-0 left-[max(1.25rem,calc((100vw-72rem)/2-1.5rem))] hidden w-px bg-sky/70 sm:block" aria-hidden="true" />

        <div className="container-site relative grid flex-1 items-center gap-10 pt-28 pb-8 lg:grid-cols-[1.35fr_1fr] lg:gap-8 lg:pt-28 lg:pb-0">
          <div className="relative z-10">
            <p className="folio">
              <span className="para-glyph" aria-hidden="true" />
              <span>01</span>
              <span className="h-px w-8 bg-navy/30" aria-hidden="true" />
              {L.eyebrow}
            </p>
            <h1 id="hero-title" className="mt-7 text-[2.7rem] leading-[0.98] font-semibold tracking-[-0.045em] text-navy sm:text-6xl xl:text-[4.9rem]">
              {t.hero.h1}
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink/80 sm:text-xl">{t.hero.sub}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CutButton to={href("contact", lang)}>{t.cta.talk}</CutButton>
              <a href="#preoccupations" className="btn-line">
                {fr ? "Qu'est-ce qui vous préoccupe ?" : "What's on your mind?"} <Icon name="arrow" className="h-4 w-4 rotate-90" />
              </a>
            </div>
          </div>

          {/* Composition en parallélogrammes, comme le logo */}
          <div className="relative mx-auto aspect-[5/4] w-full max-w-xl lg:aspect-auto lg:h-[min(34rem,calc(100svh-17rem))] lg:max-w-none" aria-hidden={false}>
            <div className="para absolute inset-0 translate-x-[7%] translate-y-[7%] bg-navy" aria-hidden="true" />
            <div id="hero-media" className="para absolute inset-0 bg-sky-50">
              <img
                src="/images/saint-leonard-1600.webp"
                srcSet={HERO_SRCSET}
                sizes={HERO_SIZES}
                alt={t.hero.imgAlt}
                width={1600}
                height={895}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
              />
            </div>
            <div className="para absolute -bottom-[6%] -left-[4%] h-[22%] w-[46%] bg-sky" style={{ ["--k" as string]: "30%" }} aria-hidden="true" />
          </div>
        </div>

        {/* Ligne de bilan */}
        <div className="relative border-t-2 border-navy bg-white/90">
          <dl className="container-site grid divide-navy/15 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
            {[
              { k: fr ? "Clients" : "Clients", v: <CountUp to={site.stats.clients} lang={lang} suffix="+" /> },
              { k: fr ? "Entreprises" : "Businesses", v: <CountUp to={site.stats.businesses} lang={lang} suffix="+" /> },
              { k: fr ? "Échéance fiscale" : "Tax deadline", v: <NextDeadlineInline lang={lang} buildDate={buildDate()} /> },
              { k: fr ? "Territoire" : "Territory", v: fr ? "Canada" : "Canada" },
            ].map((r, i) => (
              <div key={r.k} className={`flex items-baseline py-4 lg:py-5 ${i > 0 ? "lg:pl-6" : ""} ${i < 3 ? "lg:pr-6" : ""} ${i > 0 ? "border-t border-navy/15 sm:border-t-0" : ""} ${i > 1 ? "sm:border-t sm:border-navy/15 lg:border-t-0" : ""} ${i % 2 === 1 ? "sm:pl-6" : "sm:pr-6"}`}>
                <dt className="text-sm font-medium whitespace-nowrap text-ink/80">{r.k}</dt>
                <span className="leader" aria-hidden="true" />
                <dd className="font-display text-2xl font-semibold whitespace-nowrap text-navy tabular-nums sm:text-[1.7rem]">{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <HeroEnhance titleId="hero-title" trackId="hero-track" mediaId="hero-media" />
    </section>
  );
}

/* ───────────── Bandeau défilant ───────────── */
export function Ticker({ lang }: { lang: Lang }) {
  const items = landing[lang].ticker;
  const row = (hidden: boolean) => (
    <ul className="ticker-row flex shrink-0 items-center gap-9 pr-9" aria-hidden={hidden || undefined}>
      {items.map((x) => (
        <li key={x} className="flex shrink-0 items-center gap-9 font-display text-lg font-medium whitespace-nowrap text-white">
          {x}
          <span className="para-glyph" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="on-dark relative overflow-hidden bg-navy py-5" aria-label={lang === "fr" ? "Titres et secteurs desservis" : "Credentials and areas served"} role="region">
      <div className="ticker flex w-max">{row(false)}{row(true)}</div>
    </div>
  );
}

/* ───────────── 02. Préoccupations : le compte en T ───────────── */
function TColumn({ title, items, lang, prefix, hub }: { title: string; items: Concern[]; lang: Lang; prefix: string; hub: string }) {
  return (
    <div>
      <h3 className="flex items-baseline justify-between border-b-2 border-navy px-2 pb-4 font-display text-2xl font-semibold sm:text-3xl">
        <Link href={hub} className="underline-offset-4 hover:underline">{title}</Link>
        <span className="text-sm font-medium tracking-[0.14em] text-navy/70 uppercase">{prefix}</span>
      </h3>
      <ul>
        {items.map((c, i) => (
          <li key={c.key} className="reveal" data-delay={String((i % 3) + 1)}>
            <Link href={href(c.key, lang)} className="t-row">
              <span className="pt-1 font-display text-sm font-semibold text-navy/70 tabular-nums">{prefix}.{i + 1}</span>
              <span>
                <span className="block font-display text-[1.35rem] leading-tight font-semibold text-navy sm:text-2xl">{c[lang].label}</span>
                <span className="mt-1.5 block leading-snug text-muted">{c[lang].h1}</span>
              </span>
              <Icon name="arrow" className="t-arrow mt-1.5 h-5 w-5 text-navy" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConcernT({ lang }: { lang: Lang }) {
  const b = landing[lang].bento;
  return (
    <section id="preoccupations" className="section" aria-labelledby="t-title">
      <div className="container-site">
        <Folio n="02">{b.eyebrow}</Folio>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h2 id="t-title" className="reveal text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">{b.h2}</h2>
          <p className="reveal text-lg leading-relaxed text-muted" data-delay="1">{b.intro}</p>
        </div>
        {/* Le « T » : un trait vertical sépare les deux colonnes */}
        <div className="relative mt-14 grid gap-14 lg:grid-cols-2 lg:gap-0">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-0.5 -translate-x-1/2 bg-navy lg:block" aria-hidden="true" />
          <div className="lg:pr-10"><TColumn title={b.me} items={concernsFor("individuals")} lang={lang} prefix="A" hub={href("individuals", lang)} /></div>
          <div className="lg:pl-10"><TColumn title={b.biz} items={concernsFor("businesses")} lang={lang} prefix="B" hub={href("businesses", lang)} /></div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 03. Philosophie ───────────── */
export function Manifesto({ lang }: { lang: Lang }) {
  const m = landing[lang].manifesto;
  return (
    <section className="on-dark ledger-bg-dark relative overflow-hidden bg-navy-950 py-24 text-white sm:py-32" aria-labelledby="manifesto-title">
      <div className="para pointer-events-none absolute -right-24 -bottom-20 h-72 w-[34rem] bg-sky/15" aria-hidden="true" />
      <div className="para pointer-events-none absolute -top-16 -left-32 h-56 w-[26rem] bg-white/[0.04]" aria-hidden="true" />
      <div className="container-site relative">
        <Folio n="03" dark>{m.eyebrow}</Folio>
        <h2 id="manifesto-title" className="reveal mt-8 max-w-6xl text-[2.3rem] leading-[1.04] font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-[5.2rem]">
          {m.pre}<span className="strike text-white/55">{m.struck}</span>{m.post}
        </h2>
        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div className="reveal space-y-5 text-lg leading-relaxed text-white/80" data-delay="1">
            {m.text.map((p) => <p key={p}>{p}</p>)}
          </div>
          <ol className="reveal border-t border-white/25" data-delay="2">
            {m.points.map((p, i) => (
              <li key={p.t} className="flex items-baseline gap-5 border-b border-white/25 py-5">
                <span className="font-display text-sm font-semibold text-sky tabular-nums">0{i + 1}</span>
                <span className="font-display text-xl font-semibold text-white">{p.t}</span>
                <span className="leader" aria-hidden="true" />
                <span className="max-w-[12rem] text-right text-sm text-white/75 sm:max-w-none">{p.d}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 04. Comment ça marche ───────────── */
export function Process({ lang }: { lang: Lang }) {
  const P = landing[lang].process;
  const t = dict(lang);
  const h = homeText[lang];
  return (
    <section className="section" aria-labelledby="process-title">
      <div className="container-site">
        <Folio n="04">{P.eyebrow}</Folio>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h2 id="process-title" className="reveal text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">{P.h2}</h2>
          <p className="reveal text-lg leading-relaxed text-muted" data-delay="1">{P.intro}</p>
        </div>
        <ol className="mt-16 grid gap-12 lg:grid-cols-3 lg:gap-0">
          {t.steps.items.map((s, i) => (
            <li key={s.t} className={`reveal relative ${i > 0 ? "lg:border-l lg:border-navy/15 lg:pl-10" : ""} ${i < 2 ? "lg:pr-10" : ""}`} data-delay={String(i + 1)}>
              <div className="flex items-end gap-4">
                <span className="outline-num text-[6.5rem] sm:text-[8rem]" aria-hidden="true">{i + 1}</span>
                <span className="para mb-5 h-4 w-16 bg-sky" style={{ ["--k" as string]: "30%" }} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-2xl font-semibold">
                <span className="sr-only">{lang === "fr" ? `Étape ${i + 1} : ` : `Step ${i + 1}: `}</span>
                {s.t}
              </h3>
              <p className="mt-3 leading-relaxed text-muted">{s.d}</p>
              <ul className="mt-5 border-t border-navy/15">
                {h.meeting.steps[i].list.map((l) => (
                  <li key={l} className="flex items-start gap-3 border-b border-navy/15 py-2.5 text-[0.95rem]">
                    <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-navy" strokeWidth={2.4} /> {l}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        {/* Engagements, en lignes de registre */}
        <div className="mt-20 grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <h3 className="reveal font-display text-3xl leading-tight font-semibold text-navy">{h.commitments.h2}</h3>
          <ul className="reveal border-t-2 border-navy" data-delay="1">
            {h.commitments.items.map((c) => (
              <li key={c.t} className="grid gap-1 border-b border-navy/15 py-5 sm:grid-cols-[15rem_1fr] sm:gap-8">
                <span className="flex items-center gap-3 font-display text-lg font-semibold text-navy"><Icon name={c.icon} className="h-5 w-5" /> {c.t}</span>
                <span className="leading-relaxed text-muted">{c.d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 05. Services ───────────── */
export function ServicesLedger({ lang }: { lang: Lang }) {
  const t = homeText[lang].services;
  const cols = [
    { title: t.me, items: pagesText.individuals[lang].do, to: href("individuals", lang) },
    { title: t.biz, items: pagesText.businesses[lang].do, to: href("businesses", lang) },
  ];
  return (
    <section className="ledger-bg section border-y-2 border-navy bg-paper" aria-labelledby="services-title">
      <div className="container-site">
        <Folio n="05">{t.eyebrow}</Folio>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h2 id="services-title" className="reveal text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">{t.h2}</h2>
          <p className="reveal text-lg leading-relaxed text-muted" data-delay="1">{t.intro}</p>
        </div>
        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {cols.map((c, ci) => (
            <div key={c.title} className="reveal bg-white" data-delay={String(ci + 1)}>
              <div className="flex items-center justify-between bg-navy px-6 py-4 text-white">
                <h3 className="font-display text-xl font-semibold text-white">{c.title}</h3>
                <span className="para-glyph" aria-hidden="true" />
              </div>
              <ol className="border-x border-b border-navy/20">
                {c.items.map((d, i) => (
                  <li key={d} className="flex items-baseline gap-4 border-b border-navy/12 px-6 py-3.5 last:border-b-0">
                    <span className="font-display text-xs font-semibold text-navy/70 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="leading-snug">{d}</span>
                  </li>
                ))}
              </ol>
              <Link href={c.to} className="mt-4 inline-flex items-center gap-2 px-1 font-semibold text-navy underline-offset-4 hover:underline">
                {t.seeAll} <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 06. Dates ───────────── */
export function DatesLedger({ lang }: { lang: Lang }) {
  const d = dict(lang).dates;
  return (
    <section className="section" aria-labelledby="dates-title">
      <div className="container-site">
        <Folio n="06">{dict(lang).pro.eyebrows.dates}</Folio>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="dates-title" className="reveal text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">{d.h2}</h2>
          <Link href={href("calendar", lang)} className="btn-line reveal shrink-0">{d.all} <Icon name="arrow" className="h-4 w-4" /></Link>
        </div>
        <div className="mt-12"><DeadlineList lang={lang} buildDate={buildDate()} variant="ledger" /></div>
        <p className="mt-4 text-sm text-muted">{d.note}</p>

        <div className="on-dark reveal relative mt-12 overflow-hidden bg-navy p-7 text-white sm:p-10">
          <div className="para pointer-events-none absolute -top-10 -right-16 h-40 w-80 bg-sky/25" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="flex items-center gap-3 text-2xl font-semibold text-white"><Icon name="bell" /> {d.remind}</h3>
              <p className="mt-2 text-white/85">{d.remindHelp}</p>
            </div>
            <ReminderForm lang={lang} dark />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 07. Pourquoi nous + équipe ───────────── */
export function WhyTeam({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const fr = lang === "fr";
  return (
    <section className="on-dark ledger-bg-dark relative overflow-hidden bg-navy py-24 text-white sm:py-32" aria-labelledby="why-title">
      <div className="container-site relative">
        <Folio n="07" dark>{t.pro.eyebrows.why}</Folio>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h2 id="why-title" className="reveal text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] text-white sm:text-6xl">{t.why.h2}</h2>
          <p className="reveal text-lg leading-relaxed text-white/80" data-delay="1">{t.pro.whyLead}</p>
        </div>
        <ul className="mt-14 grid border-t border-white/25 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.items.map((it, i) => (
            <li key={it.t} className={`reveal border-b border-white/25 py-7 lg:border-b-0 ${i > 0 ? "lg:border-l lg:border-white/25 lg:pl-7" : ""} ${i % 2 === 1 ? "sm:pl-7 lg:pl-7" : ""} pr-7`} data-delay={String((i % 3) + 1)}>
              <span className="font-display text-sm font-semibold text-sky">{String.fromCharCode(65 + i)}.</span>
              <h3 className="mt-3 text-xl leading-snug font-semibold text-white">{it.t}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-white/75">{it.d}</p>
            </li>
          ))}
        </ul>

        {/* L'équipe */}
        <div className="mt-24 grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div className="reveal">
            <p className="folio folio-dark"><span className="para-glyph" aria-hidden="true" />{fr ? "L'équipe" : "The team"}</p>
            <h3 className="mt-5 font-display text-4xl leading-tight font-semibold text-white">{fr ? "Les personnes derrière votre dossier." : "The people behind your file."}</h3>
            <div className="mt-6 space-y-4 leading-relaxed text-white/80">
              {t.zouhaier.lines.map((l) => <p key={l}>{l}</p>)}
            </div>
            <Link href={href("about", lang)} className="btn-line mt-8">{t.zouhaier.more} <Icon name="arrow" className="h-4 w-4" /></Link>
          </div>
          <ul className="grid gap-8 sm:grid-cols-2">
            {team.map((m, i) => (
              <li key={m.id} className="reveal" data-delay={String(i + 1)}>
                <div className="relative">
                  <div className="para absolute -right-3 -bottom-3 h-1/3 w-2/3 bg-sky" style={{ ["--k" as string]: "25%" }} aria-hidden="true" />
                  <img src={m.photo} alt={`${m.name}, ${m[lang].role}, Othmani CPA`} width={800} height={1000} loading="lazy" decoding="async" className="relative aspect-[4/5] w-full object-cover" />
                </div>
                <div className="mt-6 flex items-baseline border-b border-white/25 pb-3">
                  <span className="font-display text-xl font-semibold text-white">{m.name}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="text-right text-sm text-sky">{m[lang].role}</span>
                </div>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-white/75">{m[lang].text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 08. Avis + FAQ ───────────── */
export function ReviewsFaq({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const f = homeText[lang].faq;
  const r = t.reviews;
  const list = reviews.filter((x) => x.lang === lang || reviews.length < 4).slice(0, 3);
  const writeUrl = site.googleWriteReviewUrl || site.googleReviewsUrl || "https://www.google.com/maps/search/?api=1&query=Othmani+CPA+Saint-L%C3%A9onard";
  return (
    <section className="section" aria-labelledby="faq-title">
      <JsonLd data={faqSchema(f.items)} />
      <div className="container-site">
        <Folio n="08">{f.eyebrow}</Folio>
        <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <h2 id="faq-title" className="reveal text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">{f.h2}</h2>
            {/* Avis Google : vrais avis seulement */}
            <div className="reveal mt-12 border-t-2 border-navy pt-6" data-delay="1">
              <h3 className="font-display text-xl font-semibold text-navy">{r.h2}</h3>
              {list.length > 0 ? (
                <ul className="mt-4 space-y-5">
                  {list.map((v) => (
                    <li key={v.author + v.date}>
                      <blockquote className="leading-relaxed text-ink" lang={v.lang}>« {v.text} »</blockquote>
                      <p className="mt-1 text-sm text-muted">{v.author} · {r.source}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 leading-relaxed text-muted">{r.intro} {r.empty}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                {site.googleReviewsUrl && <a href={site.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn-line">{r.see}</a>}
                <a href={writeUrl} target="_blank" rel="noopener noreferrer" className="btn-line"><Icon name="star" className="h-4 w-4" /> {r.leave}</a>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-navy">
            {f.items.map((q, i) => (
              <details key={q.q} className="group border-b border-navy/15" open={i === 0}>
                <summary className="flex cursor-pointer items-baseline gap-4 py-5">
                  <span className="font-display text-sm font-semibold text-navy/70 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="flex-1 font-display text-xl leading-snug font-semibold">{q.q}</h3>
                  <span className="relative h-5 w-5 shrink-0 self-center text-navy" aria-hidden="true">
                    <span className="absolute top-1/2 left-0 h-0.5 w-5 -translate-y-1/2 bg-current" />
                    <span className="absolute top-0 left-1/2 h-5 w-0.5 -translate-x-1/2 bg-current transition-transform duration-300 group-open:rotate-90" />
                  </span>
                </summary>
                <p className="pr-8 pb-6 pl-9 leading-relaxed text-ink/85">{q.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 09. Contact ───────────── */
export function ContactLedger({ lang }: { lang: Lang }) {
  const t = dict(lang).contact;
  const fr = lang === "fr";
  const rows: [string, ReactNode][] = [
    [t.phoneLabel, <a key="p" href={`tel:${site.phone.tel}`} className="underline-offset-4 hover:underline">{site.phone.display}</a>],
    [fr ? "Cellulaire" : "Mobile", <a key="m" href={`tel:${site.mobile.tel}`} className="underline-offset-4 hover:underline">{site.mobile.display}</a>],
    [t.emailLabel, <a key="e" href={`mailto:${site.email}`} className="underline-offset-4 hover:underline">{site.email}</a>],
    ...site.hoursLabel[lang].map(([d, h]): [string, ReactNode] => [d, h]),
  ];
  return (
    <section id="contact" className="ledger-bg section border-t-2 border-navy bg-paper" aria-labelledby="contact-title">
      <div className="container-site">
        <Folio n="09">{dict(lang).pro.eyebrows.contact}</Folio>
        <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 id="contact-title" className="reveal text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">{t.h2}</h2>
            <p className="reveal mt-6 max-w-md text-lg leading-relaxed text-muted" data-delay="1">{t.intro}</p>
            <dl className="reveal mt-10 border-t-2 border-navy bg-white/70" data-delay="2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline border-b border-navy/15 px-1 py-3.5">
                  <dt className="text-sm font-medium text-ink/80">{k}</dt>
                  <span className="leader" aria-hidden="true" />
                  <dd className="text-right font-display font-semibold text-navy">{v}</dd>
                </div>
              ))}
              <div className="flex items-baseline border-b border-navy/15 px-1 py-3.5">
                <dt className="text-sm font-medium text-ink/80">{t.address}</dt>
                <span className="leader" aria-hidden="true" />
                <dd className="text-right font-display font-semibold text-navy"><address className="not-italic"><AddressLines lang={lang} /></address></dd>
              </div>
            </dl>
            <div className="reveal mt-8 [&>div]:rounded-none [&>div]:border-navy/25"><MapEmbed lang={lang} /></div>
          </div>
          <div className="reveal relative" data-delay="1">
            <div className="para absolute -top-4 -right-4 h-24 w-56 bg-sky" style={{ ["--k" as string]: "22%" }} aria-hidden="true" />
            <div className="relative border-2 border-navy bg-white p-6 sm:p-9"><ContactForm lang={lang} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
