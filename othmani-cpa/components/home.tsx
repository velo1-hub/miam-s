import Link from "next/link";
import { concernsFor, type Concern } from "@/content/concerns";
import { reviews } from "@/content/reviews";
import { dict } from "@/content/ui";
import { buildDate, formatDate } from "@/lib/dates";
import { href } from "@/lib/routes";
import { portalHref, site, type Lang } from "@/lib/site";
import { Icon } from "./Icon";
import { HeroEnhance } from "./HeroEnhance";
import { DeadlineList } from "./DeadlineList";
import { NextDeadline } from "./NextDeadline";
import { ContactForm, ReminderForm } from "./forms";
import { MapEmbed } from "./MapEmbed";
import { AddressLines, EmailLink, PhoneLink } from "./ContactInfo";
import { SectionHead } from "./blocks";

/* 1. Héros ─────────────────────────────────────────────── */
export function Hero({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const fr = lang === "fr";
  return (
    <section id="hero-track" className="hero-track relative bg-white" aria-labelledby="hero-title">
      <div className="sticky top-0 flex h-[100svh] min-h-[38rem] flex-col overflow-hidden">
        {/* Halo très doux derrière le titre */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-sky/20 blur-3xl" aria-hidden="true" />

        <div className="container-site relative pt-28 text-center sm:pt-32">
          <p className="mx-auto flex items-center justify-center gap-2 text-[0.8rem] font-medium tracking-wide text-balance text-muted">
            <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-sky sm:inline-block" aria-hidden="true" />
            {fr ? "Comptables professionnels agréés · Saint-Léonard, Montréal" : "Chartered professional accountants · Saint-Léonard, Montreal"}
          </p>
          <h1 id="hero-title" className="mx-auto mt-4 max-w-4xl text-[2.4rem] leading-[1.05] font-semibold tracking-[-0.035em] text-navy sm:text-6xl lg:text-[4.5rem]">
            {t.hero.h1}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{t.hero.sub}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={href("contact", lang)} className="btn-primary">
              {t.cta.talk} <Icon name="arrow" className="h-5 w-5" />
            </Link>
            <a href="#preoccupations" className="inline-flex min-h-12 items-center gap-1.5 px-4 font-semibold text-navy hover:underline underline-offset-4">
              {fr ? "Voir comment on peut vous aider" : "See how we can help"} <Icon name="arrow" className="h-4 w-4 rotate-90" />
            </a>
          </div>
        </div>

        {/* Grande image dans un cadre arrondi, avec cartes vitrées */}
        <div className="container-site relative mt-8 min-h-0 flex-1 pb-6 sm:mt-10 sm:pb-8">
          <div id="hero-media" className="relative h-full min-h-[13rem] overflow-hidden rounded-[1.75rem] bg-sky-50 sm:rounded-[2.25rem]">
            <picture>
              <source media="(max-width: 767px)" srcSet="/images/saint-leonard-800.webp" type="image/webp" />
              <source media="(max-width: 1199px)" srcSet="/images/saint-leonard-1000.webp" type="image/webp" />
              <img
                src="/images/saint-leonard-1600.webp"
                alt={t.hero.imgAlt}
                width={1600}
                height={895}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
              />
            </picture>

            <div className="glass absolute bottom-4 left-4 max-w-[19rem] rounded-2xl p-4 sm:bottom-6 sm:left-6 sm:p-5">
              <NextDeadline lang={lang} buildDate={buildDate()} light />
            </div>
            <ul className="glass absolute top-6 left-6 hidden rounded-2xl px-5 py-4 text-sm text-ink lg:block">
              {t.pro.creds.map((c) => (
                <li key={c} className="flex items-center gap-2.5 py-0.5">
                  <Icon name="check" className="h-4 w-4 text-navy" strokeWidth={2.2} /> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <HeroEnhance titleId="hero-title" trackId="hero-track" mediaId="hero-media" />
    </section>
  );
}

/* 2. Les deux portes ─────────────────────────────────────── */
function Door({ lang, title, icon, items, hub, delay }: { lang: Lang; title: string; icon: string; items: Concern[]; hub: "individuals" | "businesses"; delay: string }) {
  return (
    <div className="glass reveal flex flex-col overflow-hidden rounded-[1.75rem]" data-delay={delay}>
      <div className="flex items-center justify-between gap-4 border-b border-navy/10 bg-white/40 px-6 py-5 sm:px-8">
        <h3 className="flex items-center gap-3 text-xl font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white"><Icon name={icon} className="h-5 w-5" /></span>
          <Link href={href(hub, lang)} className="underline-offset-4 hover:underline">{title}</Link>
        </h3>
        <span className="font-display text-sm font-medium text-muted">04</span>
      </div>
      <ul className="divide-y divide-navy/10">
        {items.map((c, i) => (
          <li key={c.key}>
            <Link href={href(c.key, lang)} className="group grid grid-cols-[2rem_1fr_auto] items-start gap-3 px-6 py-5 transition-colors hover:bg-white/70 sm:px-8">
              <span className="pt-0.5 font-display text-sm font-medium text-navy/60">0{i + 1}</span>
              <span>
                <span className="block font-display text-[1.05rem] font-semibold text-navy">{c[lang].label}</span>
                <span className="mt-1 block text-[0.92rem] leading-relaxed text-muted">{c[lang].teaser}</span>
              </span>
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-navy/15 bg-white/60 text-navy transition-colors group-hover:border-navy group-hover:bg-navy group-hover:text-white">
                <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Doors({ lang }: { lang: Lang }) {
  const t = dict(lang);
  return (
    <section id="preoccupations" className="section mesh relative overflow-hidden" aria-labelledby="doors-title">
      <div className="container-site">
        <SectionHead id="doors-title" eyebrow={t.pro.eyebrows.doors} title={t.doors.h2} intro={t.doors.intro} />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Door lang={lang} title={t.doors.me} icon="user" items={concernsFor("individuals")} hub="individuals" delay="1" />
          <Door lang={lang} title={t.doors.business} icon="briefcase" items={concernsFor("businesses")} hub="businesses" delay="2" />
        </div>
        <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <span className="text-sm font-medium text-muted">{lang === "fr" ? "Outils gratuits :" : "Free tools:"}</span>
          <div className="flex flex-wrap gap-2">
            <Link href={href("tools", lang) + "#documents"} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-navy hover:bg-white"><Icon name="receipt" className="h-4 w-4" />{lang === "fr" ? "Ma liste de documents" : "My document checklist"}</Link>
            <Link href={href("tools", lang) + "#calculatrice"} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-navy hover:bg-white"><Icon name="percent" className="h-4 w-4" />{lang === "fr" ? "Calculatrice TPS/TVQ" : "GST/QST calculator"}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 3. Comment ça marche ───────────────────────────────────── */
export function Steps({ lang }: { lang: Lang }) {
  const t = dict(lang);
  return (
    <section className="section border-t border-line" aria-labelledby="steps-title">
      <div className="container-site">
        <SectionHead id="steps-title" eyebrow={t.pro.eyebrows.steps} title={t.steps.h2} intro={t.steps.intro} />
        <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* Ligne de progression */}
          <span className="absolute top-6 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-navy/30 via-sky to-navy/30 md:block" aria-hidden="true" />
          {t.steps.items.map((s, i) => (
            <li key={s.t} className="reveal relative flex gap-5 md:flex-col md:items-center md:text-center" data-delay={String(i + 1)}>
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-navy/20 bg-white font-display text-lg font-semibold text-navy ring-8 ring-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-xl font-semibold md:mt-6">
                  <span className="sr-only">{lang === "fr" ? `Étape ${i + 1} : ` : `Step ${i + 1}: `}</span>
                  {s.t}
                </h3>
                <p className="mt-2 max-w-xs leading-relaxed text-muted md:mx-auto">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* 4. Pilote Fiscal ───────────────────────────────────────── */
function PhoneMock({ lang }: { lang: Lang }) {
  const t = dict(lang).portal;
  return (
    <figure role="img" aria-label={t.mockLabel} className="glass relative mx-auto w-[17.5rem] rounded-[2.6rem] p-3">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-paper" aria-hidden="true">
        <div className="flex items-center justify-between bg-navy px-5 pt-7 pb-5 text-white">
          <div>
            <p className="text-[0.65rem] tracking-[0.18em] text-sky uppercase">Pilote Fiscal</p>
            <p className="mt-1 font-display text-lg font-semibold">{t.mockStatus}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"><Icon name="bell" className="h-5 w-5" /></span>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-2xl border border-line bg-white p-4">
            <ol className="space-y-3">
              {t.mockSteps.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${i < 2 ? "bg-navy text-white" : i === 2 ? "border-2 border-sky bg-white" : "border border-line bg-white"}`}>
                    {i < 2 && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />}
                  </span>
                  <span className={i <= 2 ? "font-medium text-ink" : "text-muted"}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-navy/30 bg-white p-4 text-sm font-medium text-navy">
            <Icon name="upload" className="h-5 w-5" /> {t.mockUpload}
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-ink">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky font-display text-xs font-semibold text-navy">OC</span>
            {t.mockMsg}
          </div>
        </div>
      </div>
    </figure>
  );
}

export function Portal({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const p = t.portal;
  return (
    <section id="pilote-fiscal" className="section mesh-dark on-dark relative overflow-hidden text-white" aria-labelledby="portal-title">
      <div className="container-site grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHead id="portal-title" eyebrow={t.pro.eyebrows.portal + " · Pilote Fiscal"} title={p.h2} intro={p.intro} dark />
          <ul className="mt-10 grid gap-3">
            {p.items.map((it, i) => (
              <li key={it.t} className="glass-dark reveal flex gap-4 rounded-2xl p-5" data-delay={String(i + 1)}>
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky text-navy">
                  <Icon name={["chart", "upload", "chat"][i]} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">{it.t}</h3>
                  <p className="mt-1 leading-relaxed text-white/80">{it.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <a href={portalHref(lang)} className="btn-light mt-9">{p.button} <Icon name="arrow" className="h-5 w-5" /></a>
        </div>
        <div className="reveal relative" data-delay="2">
          <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky/30 blur-3xl" aria-hidden="true" />
          <div className="floaty relative py-6"><PhoneMock lang={lang} /></div>
        </div>
      </div>
    </section>
  );
}

/* 5. Dates ───────────────────────────────────────────────── */
export function Dates({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const d = t.dates;
  return (
    <section className="section relative overflow-hidden" aria-labelledby="dates-title">
      <div className="container-site">
        <SectionHead
          id="dates-title"
          eyebrow={t.pro.eyebrows.dates}
          title={d.h2}
          intro={d.intro}
          action={
            <Link href={href("calendar", lang)} className="btn glass text-navy hover:bg-white">
              {d.all} <Icon name="arrow" className="h-5 w-5" />
            </Link>
          }
        />
        <div className="mt-10"><DeadlineList lang={lang} buildDate={buildDate()} /></div>
        <p className="mt-4 text-sm text-muted">{d.note}</p>
        <div className="reveal on-dark relative mt-10 overflow-hidden rounded-[1.75rem] bg-navy p-7 text-white sm:p-10">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-sky/35 blur-3xl" aria-hidden="true" />
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

/* 6. Pourquoi nous ───────────────────────────────────────── */
export function Why({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const icons = ["badge", "shield", "building", "globe"];
  return (
    <section className="section" aria-labelledby="why-title">
      <div className="container-site">
        <div className="mesh-dark on-dark relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 sm:py-16">
          <svg className="pointer-events-none absolute -right-20 -bottom-28 h-96 w-96 text-sky/20" viewBox="0 0 200 200" fill="none" aria-hidden="true">
            <circle cx="100" cy="100" r="99" stroke="currentColor" /><circle cx="100" cy="100" r="70" stroke="currentColor" /><circle cx="100" cy="100" r="41" stroke="currentColor" />
          </svg>
          <div className="relative grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
            <div className="self-start lg:pt-2"><SectionHead id="why-title" eyebrow={t.pro.eyebrows.why} title={t.why.h2} intro={t.pro.whyLead} dark /></div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {t.why.items.map((it, i) => (
                <li key={it.t} className="glass-dark reveal rounded-2xl p-6" data-delay={String((i % 3) + 1)}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sky"><Icon name={icons[i]} /></span>
                  <h3 className="mt-5 text-lg leading-snug font-semibold text-white">{it.t}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-white/80">{it.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 7. Avis Google (vrais avis uniquement) ─────────────────── */
export function Reviews({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const r = t.reviews;
  const list = reviews.filter((x) => x.lang === lang || reviews.length < 4);
  const writeUrl = site.googleWriteReviewUrl || site.googleReviewsUrl || "https://www.google.com/maps/search/?api=1&query=Othmani+CPA+Saint-L%C3%A9onard";
  return (
    <section className="section pt-0" aria-labelledby="reviews-title">
      <div className="container-site">
        <SectionHead
          id="reviews-title"
          eyebrow={t.pro.eyebrows.reviews}
          title={r.h2}
          intro={r.intro}
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              {site.googleReviewsUrl && <a href={site.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">{r.see}</a>}
              <a href={writeUrl} target="_blank" rel="noopener noreferrer" className="btn-primary"><Icon name="star" className="h-5 w-5" /> {r.leave}</a>
            </div>
          }
        />
        {list.length > 0 ? (
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {list.slice(0, 6).map((v) => (
              <li key={v.author + v.date} className="card reveal flex flex-col p-7">
                <p className="flex gap-0.5 text-navy" aria-label={lang === "fr" ? `${v.rating} étoiles sur 5` : `${v.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon key={i} name="star" className={`h-5 w-5 ${i < v.rating ? "fill-sky text-navy" : "text-line"}`} />
                  ))}
                </p>
                <blockquote className="mt-4 flex-1 leading-relaxed text-ink" lang={v.lang}>« {v.text} »</blockquote>
                <p className="mt-5 text-sm text-muted">
                  <span className="font-semibold text-ink">{v.author}</span> · {r.source} · <time dateTime={v.date}>{formatDate(v.date, lang, { month: "long", year: "numeric" })}</time>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="reveal mt-10 flex flex-col items-start gap-4 rounded-[1.75rem] border border-line p-7 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-navy"><Icon name="star" /></span>
            <p className="flex-1 text-muted">{r.empty}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* 8. Qui est Zouhaier ────────────────────────────────────── */
export function Portrait({ lang, className = "" }: { lang: Lang; className?: string }) {
  return (
    <img
      src="/images/zouhaier-othmani.webp"
      alt={dict(lang).zouhaier.alt}
      width={800}
      height={1000}
      loading="lazy"
      decoding="async"
      className={`aspect-[4/5] w-full rounded-[var(--radius-card)] border border-line object-cover ${className}`}
    />
  );
}

export function Zouhaier({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const z = t.zouhaier;
  return (
    <section className="section relative overflow-hidden" aria-labelledby="zo-title">
      <div className="container-site grid items-center gap-12 md:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
        <div className="reveal relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-4 -z-0 rounded-[2.25rem] bg-gradient-to-br from-sky/40 to-navy/10 blur-2xl" aria-hidden="true" />
          <div className="relative">
            <Portrait lang={lang} className="!rounded-[1.75rem]" />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/70 bg-white/85 px-5 py-4 backdrop-blur-xl">
              <p className="font-display font-semibold text-navy">Zouhaier Othmani</p>
              <p className="text-sm text-ink/80">{lang === "fr" ? "CPA auditeur · Fondateur" : "CPA auditor · Founder"}</p>
            </div>
          </div>
        </div>
        <div className="reveal" data-delay="2">
          <p className="eyebrow">{t.pro.eyebrows.about}</p>
          <h2 id="zo-title" className="h2">{z.h2}</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink/90">
            {z.lines.map((l) => <p key={l}>{l}</p>)}
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {t.pro.creds.map((c) => (
              <li key={c} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-navy">
                <Icon name="check" className="h-4 w-4" strokeWidth={2.2} /> {c}
              </li>
            ))}
          </ul>
          <div className="glass mt-8 flex max-w-md items-center gap-4 rounded-2xl p-3 pr-5">
            <img src="/images/racha-ghazoini-thumb.webp" alt="Racha Ghazoini" width={240} height={240} loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <p className="text-sm leading-snug text-ink/90">
              {lang === "fr" ? "Avec " : "With "}<strong className="font-semibold text-navy">Racha Ghazoini</strong>{lang === "fr" ? ", technicienne comptable, qui suit vos documents au quotidien." : ", accounting technician, who follows up on your documents day to day."}
            </p>
          </div>
          <Link href={href("about", lang)} className="btn-primary mt-8">{z.more} <Icon name="arrow" className="h-5 w-5" /></Link>
        </div>
      </div>
    </section>
  );
}

/* 9. Contact ─────────────────────────────────────────────── */
export function ContactDetails({ lang, sub = "h3" }: { lang: Lang; sub?: "h2" | "h3" }) {
  const t = dict(lang).contact;
  const H = sub;
  const row = "flex gap-4";
  const ico = "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-navy";
  return (
    <div className="space-y-6">
      <div className={row}>
        <span className={ico}><Icon name="pin" className="h-5 w-5" /></span>
        <div><H className="font-display font-semibold">{t.address}</H><address className="mt-1 leading-relaxed text-muted not-italic"><AddressLines lang={lang} /></address></div>
      </div>
      <div className={row}>
        <span className={ico}><Icon name="clock" className="h-5 w-5" /></span>
        <div>
          <H className="font-display font-semibold">{t.hours}</H>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted">
            {site.hoursLabel[lang].map(([d, h]) => (<div key={d} className="contents"><dt>{d}</dt><dd>{h}</dd></div>))}
          </dl>
        </div>
      </div>
      <div className={row}>
        <span className={ico}><Icon name="phone" className="h-5 w-5" /></span>
        <div><H className="font-display font-semibold">{t.phoneLabel}</H><p className="mt-1 text-muted"><PhoneLink lang={lang} className="font-medium text-navy underline-offset-4 hover:underline" /></p>
          <p className="mt-0.5 text-sm text-muted">{lang === "fr" ? "Cellulaire : " : "Mobile: "}<a href={`tel:${site.mobile.tel}`} className="font-medium text-navy underline-offset-4 hover:underline">{site.mobile.display}</a></p></div>
      </div>
      <div className={row}>
        <span className={ico}><Icon name="mail" className="h-5 w-5" /></span>
        <div><H className="font-display font-semibold">{t.emailLabel}</H><p className="mt-1 text-muted"><EmailLink lang={lang} className="font-medium text-navy underline-offset-4 hover:underline" /></p></div>
      </div>
    </div>
  );
}

export function ContactSection({ lang, headingLevel = 2 }: { lang: Lang; headingLevel?: 1 | 2 }) {
  const t = dict(lang).contact;
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <section id="contact" className="section mesh relative overflow-hidden" aria-labelledby="contact-title">
      <div className="container-site">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">{dict(lang).pro.eyebrows.contact}</p>
          <H id="contact-title" className={headingLevel === 1 ? "text-4xl leading-tight font-semibold sm:text-5xl" : "h2"}>{t.h2}</H>
          <p className="lead mt-4">{t.intro}</p>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <div className="glass reveal relative rounded-[1.75rem] p-6 sm:p-9"><ContactForm lang={lang} /></div>
          <div className="reveal space-y-8" data-delay="2">
            <ContactDetails lang={lang} sub={headingLevel === 1 ? "h2" : "h3"} />
            <MapEmbed lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}
