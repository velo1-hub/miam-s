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
import { ContactForm, ReminderForm } from "./forms";
import { MapEmbed } from "./MapEmbed";
import { AddressLines, EmailLink, PhoneLink } from "./ContactInfo";

/* 1. Héros ─────────────────────────────────────────────── */
export function Hero({ lang }: { lang: Lang }) {
  const t = dict(lang);
  return (
    <section id="hero-track" className="hero-track relative bg-navy-950" aria-labelledby="hero-title">
      <div className="on-dark sticky top-0 flex h-[100svh] min-h-[34rem] items-end overflow-hidden pb-16 sm:items-center sm:pb-0">
        <div id="hero-media" className="absolute inset-0">
          <picture>
            <source media="(max-width: 767px)" srcSet="/images/hero-800.webp" type="image/webp" />
            <img
              src="/images/hero-1600.webp"
              alt={t.hero.imgAlt}
              width={1600}
              height={1000}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
        </div>
        {/* Voile pour garantir le contraste du texte (AA) sur l'image ou la vidéo */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/70 to-navy-950/40 sm:bg-gradient-to-r sm:from-navy-950/90 sm:via-navy-950/65 sm:to-navy-950/20" aria-hidden="true" />

        <div className="container-site relative pt-28">
          <h1 id="hero-title" className="max-w-4xl text-[2.6rem] leading-[1.05] font-semibold text-white sm:text-6xl lg:text-7xl">
            {t.hero.h1}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">{t.hero.sub}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={href("contact", lang)} className="btn-light">
              {t.cta.talk} <Icon name="arrow" className="h-5 w-5" />
            </Link>
            <a href={portalHref(lang)} className="btn-ghost-light">
              <Icon name="shield" className="h-5 w-5" /> {t.cta.portal}
            </a>
          </div>
        </div>
        <a href="#preoccupations" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium tracking-[0.2em] text-white/80 uppercase sm:flex">
          {t.hero.scroll}
          <span className="block h-10 w-px bg-gradient-to-b from-sky to-transparent" aria-hidden="true" />
        </a>
      </div>
      <HeroEnhance titleId="hero-title" trackId="hero-track" mediaId="hero-media" />
    </section>
  );
}

/* 2. Les deux portes ─────────────────────────────────────── */
function Door({ lang, title, icon, items, hub, delay }: { lang: Lang; title: string; icon: string; items: Concern[]; hub: "individuals" | "businesses"; delay: string }) {
  return (
    <div className="card reveal flex flex-col p-6 sm:p-8" data-delay={delay}>
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-navy"><Icon name={icon} /></span>
        <h3 className="text-2xl font-semibold">
          <Link href={href(hub, lang)} className="hover:underline underline-offset-4">{title}</Link>
        </h3>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((c) => (
          <li key={c.key}>
            <Link
              href={href(c.key, lang)}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-line px-5 py-4 transition-colors hover:border-navy/40 hover:bg-sky-50"
            >
              <span className="flex items-center gap-3.5">
                <Icon name={c.icon} className="h-5 w-5 shrink-0 text-navy" />
                <span className="font-medium text-ink">{c[lang].label}</span>
              </span>
              <Icon name="arrow" className="h-5 w-5 shrink-0 text-navy/40 transition-transform group-hover:translate-x-1 group-hover:text-navy" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Doors({ lang }: { lang: Lang }) {
  const t = dict(lang).doors;
  return (
    <section id="preoccupations" className="section" aria-labelledby="doors-title">
      <div className="container-site">
        <div className="reveal max-w-2xl">
          <h2 id="doors-title" className="h2">{t.h2}</h2>
          <p className="lead mt-4">{t.intro}</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Door lang={lang} title={t.me} icon="user" items={concernsFor("individuals")} hub="individuals" delay="1" />
          <Door lang={lang} title={t.business} icon="briefcase" items={concernsFor("businesses")} hub="businesses" delay="2" />
        </div>
      </div>
    </section>
  );
}

/* 3. Comment ça marche ───────────────────────────────────── */
export function Steps({ lang }: { lang: Lang }) {
  const t = dict(lang).steps;
  const icons = ["chat", "upload", "check"];
  return (
    <section className="section border-y border-line bg-paper" aria-labelledby="steps-title">
      <div className="container-site">
        <div className="reveal max-w-2xl">
          <h2 id="steps-title" className="h2">{t.h2}</h2>
          <p className="lead mt-4">{t.intro}</p>
        </div>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {t.items.map((s, i) => (
            <li key={s.t} className="card reveal relative p-7" data-delay={String(i + 1)}>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-white"><Icon name={icons[i]} /></span>
                <span className="font-display text-4xl font-semibold text-navy/55" aria-hidden="true">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">
                <span className="sr-only">{lang === "fr" ? `Étape ${i + 1} : ` : `Step ${i + 1}: `}</span>
                {s.t}
              </h3>
              <p className="mt-2 leading-relaxed text-muted">{s.d}</p>
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
    <figure role="img" aria-label={t.mockLabel} className="relative mx-auto w-[17.5rem] rounded-[2.6rem] border border-navy/15 bg-white p-3">
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
  const t = dict(lang).portal;
  return (
    <section id="pilote-fiscal" className="section overflow-hidden" aria-labelledby="portal-title">
      <div className="container-site grid items-center gap-14 lg:grid-cols-2">
        <div className="reveal">
          <p className="eyebrow">Pilote Fiscal</p>
          <h2 id="portal-title" className="h2">{t.h2}</h2>
          <p className="lead mt-4 max-w-lg">{t.intro}</p>
          <ul className="mt-8 space-y-5">
            {t.items.map((it, i) => (
              <li key={it.t} className="flex gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-navy">
                  <Icon name={["chart", "upload", "chat"][i]} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{it.t}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{it.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <a href={portalHref(lang)} className="btn-primary mt-9">{t.button} <Icon name="arrow" className="h-5 w-5" /></a>
        </div>
        <div className="reveal relative" data-delay="2">
          <div className="absolute inset-x-6 top-10 bottom-10 rounded-[3rem] bg-gradient-to-br from-sky-100 to-sky-50" aria-hidden="true" />
          <div className="relative py-6"><PhoneMock lang={lang} /></div>
        </div>
      </div>
    </section>
  );
}

/* 5. Dates ───────────────────────────────────────────────── */
export function Dates({ lang }: { lang: Lang }) {
  const t = dict(lang).dates;
  return (
    <section className="section border-y border-line bg-paper" aria-labelledby="dates-title">
      <div className="container-site">
        <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 id="dates-title" className="h2">{t.h2}</h2>
            <p className="lead mt-4">{t.intro}</p>
          </div>
          <Link href={href("calendar", lang)} className="inline-flex items-center gap-2 font-semibold text-navy underline-offset-4 hover:underline">
            {t.all} <Icon name="arrow" className="h-5 w-5" />
          </Link>
        </div>
        <div className="mt-10"><DeadlineList lang={lang} buildDate={buildDate()} /></div>
        <p className="mt-4 text-sm text-muted">{t.note}</p>
        <div className="reveal mt-10 grid gap-6 rounded-[var(--radius-card)] bg-navy p-7 text-white on-dark sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="flex items-center gap-3 text-2xl font-semibold text-white"><Icon name="bell" /> {t.remind}</h3>
            <p className="mt-2 text-white/85">{t.remindHelp}</p>
          </div>
          <ReminderForm lang={lang} dark />
        </div>
      </div>
    </section>
  );
}

/* 6. Pourquoi nous ───────────────────────────────────────── */
export function Why({ lang }: { lang: Lang }) {
  const t = dict(lang).why;
  const icons = ["badge", "shield", "building", "globe"];
  return (
    <section className="section" aria-labelledby="why-title">
      <div className="container-site">
        <h2 id="why-title" className="h2 reveal">{t.h2}</h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.items.map((it, i) => (
            <li key={it.t} className="card reveal p-7" data-delay={String((i % 3) + 1)}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-navy"><Icon name={icons[i]} /></span>
              <h3 className="mt-5 text-lg font-semibold leading-snug">{it.t}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{it.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* 7. Avis Google (vrais avis uniquement) ─────────────────── */
export function Reviews({ lang }: { lang: Lang }) {
  const t = dict(lang).reviews;
  const list = reviews.filter((r) => r.lang === lang || reviews.length < 4);
  return (
    <section className="section border-y border-line bg-paper" aria-labelledby="reviews-title">
      <div className="container-site">
        <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 id="reviews-title" className="h2">{t.h2}</h2>
            <p className="lead mt-4">{t.intro}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {site.googleReviewsUrl && (
              <a href={site.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">{t.see}</a>
            )}
            <a href={site.googleWriteReviewUrl || site.googleReviewsUrl || "https://www.google.com/maps/search/?api=1&query=Othmani+CPA+Saint-L%C3%A9onard"} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <Icon name="star" className="h-5 w-5" /> {t.leave}
            </a>
          </div>
        </div>
        {list.length > 0 ? (
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {list.slice(0, 6).map((r) => (
              <li key={r.author + r.date} className="card reveal flex flex-col p-7">
                <p className="flex gap-0.5 text-navy" aria-label={lang === "fr" ? `${r.rating} étoiles sur 5` : `${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon key={i} name="star" className={`h-5 w-5 ${i < r.rating ? "fill-sky text-navy" : "text-line"}`} />
                  ))}
                </p>
                <blockquote className="mt-4 flex-1 leading-relaxed text-ink" lang={r.lang}>« {r.text} »</blockquote>
                <p className="mt-5 text-sm text-muted">
                  <span className="font-semibold text-ink">{r.author}</span> · {t.source} · <time dateTime={r.date}>{formatDate(r.date, lang, { month: "long", year: "numeric" })}</time>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="reveal mt-10 flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-navy/25 bg-white p-6 text-muted">
            <Icon name="star" className="h-6 w-6 shrink-0 text-navy" /> {t.empty}
          </p>
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
  const t = dict(lang).zouhaier;
  return (
    <section className="section" aria-labelledby="zo-title">
      <div className="container-site grid items-center gap-12 md:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        <div className="reveal mx-auto w-full max-w-sm"><Portrait lang={lang} /></div>
        <div className="reveal" data-delay="2">
          <h2 id="zo-title" className="h2">{t.h2}</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink/90">
            {t.lines.map((l) => <p key={l}>{l}</p>)}
          </div>
          <Link href={href("about", lang)} className="mt-8 inline-flex items-center gap-2 font-semibold text-navy underline-offset-4 hover:underline">
            {t.more} <Icon name="arrow" className="h-5 w-5" />
          </Link>
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
        <div><H className="font-display font-semibold">{t.phoneLabel}</H><p className="mt-1 text-muted"><PhoneLink lang={lang} className="font-medium text-navy underline-offset-4 hover:underline" /></p></div>
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
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className="container-site">
        <div className="reveal max-w-2xl">
          <H id="contact-title" className={headingLevel === 1 ? "text-4xl leading-tight font-semibold sm:text-5xl" : "h2"}>{t.h2}</H>
          <p className="lead mt-4">{t.intro}</p>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <div className="card reveal relative p-6 sm:p-9"><ContactForm lang={lang} /></div>
          <div className="reveal space-y-8" data-delay="2">
            <ContactDetails lang={lang} sub={headingLevel === 1 ? "h2" : "h3"} />
            <MapEmbed lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}
