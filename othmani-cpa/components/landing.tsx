import Link from "next/link";
import { concernsFor, type Concern } from "@/content/concerns";
import { homeText } from "@/content/home";
import { landing } from "@/content/landing";
import { dict } from "@/content/ui";
import { buildDate } from "@/lib/dates";
import { href, type RouteKey } from "@/lib/routes";
import type { Lang } from "@/lib/site";
import { SectionHead } from "./blocks";
import { HeroEnhance } from "./HeroEnhance";
import { Icon } from "./Icon";
import { NextDeadline } from "./NextDeadline";
import { preload } from "react-dom";

const HERO_SRCSET = "/images/saint-leonard-800.webp 720w, /images/saint-leonard-1000.webp 1000w, /images/saint-leonard-1600.webp 1600w";
const HERO_SIZES = "(max-width: 1023px) 92vw, 46vw";

/* ───────────── Héros en deux colonnes ───────────── */
export function LandingHero({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const L = landing[lang];
  const quick: RouteKey[] = ["personalTaxes", "taxLetter", "selfEmployed", "salesTax", "startBusiness"];
  const all = [...concernsFor("individuals"), ...concernsFor("businesses")];
  // Précharge l'image du héros (meilleur LCP)
  preload("/images/saint-leonard-1600.webp", { as: "image", fetchPriority: "high", imageSrcSet: HERO_SRCSET, imageSizes: HERO_SIZES });
  return (
    <section id="hero-track" className="hero-track relative overflow-x-clip bg-white" aria-labelledby="hero-title">
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden lg:h-[100svh]">
        {/* Fond : halos très doux */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 -left-40 h-[36rem] w-[36rem] rounded-full bg-sky/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-[28rem] w-[40rem] rounded-full bg-navy/[0.06] blur-3xl" />
        </div>

        <div className="container-site relative grid w-full items-center gap-10 pt-28 pb-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-24 lg:pb-0">
          {/* Texte */}
          <div>
            <p className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.8rem] font-medium text-ink/80">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky" />
              </span>
              {L.eyebrow}
            </p>
            <h1 id="hero-title" className="mt-6 text-[2.5rem] leading-[1.03] font-semibold tracking-[-0.035em] text-navy sm:text-6xl xl:text-[4.6rem]">
              {t.hero.h1}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{t.hero.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={href("contact", lang)} className="btn-primary">
                {t.cta.talk} <Icon name="arrow" className="h-5 w-5" />
              </Link>
              <Link href={href("calendar", lang)} className="btn-secondary">
                <Icon name="calendar" className="h-5 w-5" /> {L.secondary}
              </Link>
            </div>

            {/* Raccourcis vers les préoccupations */}
            <div className="mt-9">
              <p className="text-sm font-medium text-muted">{L.helpLabel}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {quick.map((k) => {
                  const c = all.find((x) => x.key === k)!;
                  return (
                    <li key={k}>
                      <Link href={href(k, lang)} className="group inline-flex items-center gap-2 rounded-full border border-navy/12 bg-white/80 py-1.5 pr-3.5 pl-1.5 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-[0_10px_24px_-16px_rgba(42,42,92,.6)]">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-navy transition-colors group-hover:bg-navy group-hover:text-white"><Icon name={c.icon} className="h-4 w-4" /></span>
                        {c[lang].label}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <a href="#preoccupations" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-navy hover:underline underline-offset-4">
                    {L.seeAll} <Icon name="arrow" className="h-4 w-4 rotate-90" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Image + cartes vitrées */}
          <div className="relative">
            <div id="hero-media" className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-sky-50 shadow-[0_40px_90px_-50px_rgba(23,23,58,.6)] lg:aspect-[4/5] lg:max-h-[min(40rem,calc(100svh-9rem))] lg:w-full">
              <img
                src="/images/saint-leonard-1600.webp"
                srcSet={HERO_SRCSET}
                sizes={HERO_SIZES}
                alt={t.hero.imgAlt}
                width={1600}
                height={895}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/25 via-transparent to-transparent" aria-hidden="true" />
            </div>

            <div className="glass floaty absolute -bottom-5 left-3 max-w-[18.5rem] rounded-2xl p-4 sm:left-[-1.5rem] sm:p-5">
              <NextDeadline lang={lang} buildDate={buildDate()} light />
            </div>
            <div className="glass absolute top-5 right-3 hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex sm:right-[-1rem]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white"><Icon name="badge" className="h-5 w-5" /></span>
              <span>
                <span className="block font-display text-sm font-semibold text-navy">{L.credCard.t}</span>
                <span className="block text-xs text-ink/75">{L.credCard.d}</span>
              </span>
            </div>
            <div className="glass absolute top-1/2 right-3 hidden -translate-y-1/2 items-center gap-3 rounded-2xl px-4 py-3 xl:flex xl:right-[-2rem]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-navy"><Icon name="clock" className="h-5 w-5" /></span>
              <span>
                <span className="block font-display text-sm font-semibold text-navy">{L.replyCard.t}</span>
                <span className="block text-xs text-ink/75">{L.replyCard.d}</span>
              </span>
            </div>
          </div>
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
    <ul className="ticker-row flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map((x) => (
        <li key={x} className="flex shrink-0 items-center gap-10 text-[0.95rem] font-medium whitespace-nowrap text-white/85">
          {x}
          <span className="h-1.5 w-1.5 rounded-full bg-sky" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="on-dark relative overflow-hidden bg-navy py-5" aria-label={lang === "fr" ? "Titres et secteurs desservis" : "Credentials and areas served"} role="region">
      <div className="ticker flex w-max">{row(false)}{row(true)}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-navy to-transparent" aria-hidden="true" />
    </div>
  );
}

/* ───────────── Grande déclaration ───────────── */
export function Manifesto({ lang }: { lang: Lang }) {
  const m = landing[lang].manifesto;
  return (
    <section className="section" aria-labelledby="manifesto-title">
      <div className="container-site">
        <p className="eyebrow reveal">{m.eyebrow}</p>
        <h2 id="manifesto-title" className="reveal max-w-5xl text-[2rem] leading-[1.12] font-semibold tracking-[-0.03em] text-navy sm:text-5xl lg:text-[3.6rem]">
          {m.big}
        </h2>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div className="reveal space-y-5 text-lg leading-relaxed text-ink/85" data-delay="1">
            {m.text.map((p) => <p key={p}>{p}</p>)}
          </div>
          <ol className="reveal grid gap-4" data-delay="2">
            {m.points.map((p, i) => (
              <li key={p.t} className="flex items-center gap-5 rounded-2xl border border-line p-5">
                <span className="font-display text-3xl font-semibold text-[#2f7e98]">0{i + 1}</span>
                <span>
                  <span className="block font-display text-lg font-semibold text-navy">{p.t}</span>
                  <span className="block text-muted">{p.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Mosaïque des préoccupations ───────────── */
function BentoCard({ c, lang, big, read }: { c: Concern; lang: Lang; big?: boolean; read: string }) {
  return (
    <Link
      href={href(c.key, lang)}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7 ${
        big ? "on-dark mesh-dark border-transparent text-white" : "border-line bg-white hover:border-navy/25 hover:shadow-[0_30px_60px_-40px_rgba(42,42,92,.55)]"
      }`}
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${big ? "bg-white/10 text-sky" : "bg-sky-50 text-navy"} transition-colors ${big ? "" : "group-hover:bg-navy group-hover:text-white"}`}>
        <Icon name={c.icon} />
      </span>
      <h3 className={`mt-6 text-xl font-semibold ${big ? "text-white" : ""}`}>{c[lang].label}</h3>
      <p className={`mt-2 font-medium leading-snug ${big ? "text-[1.35rem] text-white sm:text-2xl" : "text-navy/90"}`}>{c[lang].h1}</p>
      <p className={`mt-3 flex-1 leading-relaxed ${big ? "text-white/80" : "text-muted"}`}>{big ? c[lang].answer : c[lang].teaser}</p>
      <span className={`mt-6 inline-flex items-center gap-2 font-semibold ${big ? "text-sky" : "text-navy"}`}>
        {read} <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function ConcernBento({ lang }: { lang: Lang }) {
  const b = landing[lang].bento;
  const groups = [
    { title: b.me, icon: "user", items: concernsFor("individuals"), hub: href("individuals", lang) },
    { title: b.biz, icon: "briefcase", items: concernsFor("businesses"), hub: href("businesses", lang) },
  ];
  return (
    <section id="preoccupations" className="section mesh" aria-labelledby="bento-title">
      <div className="container-site">
        <SectionHead id="bento-title" eyebrow={b.eyebrow} title={b.h2} intro={b.intro} />
        <div className="mt-14 space-y-14">
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="reveal mb-6 flex items-center gap-3 text-2xl font-semibold">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white"><Icon name={g.icon} className="h-5 w-5" /></span>
                <Link href={g.hub} className="underline-offset-4 hover:underline">{g.title}</Link>
              </h3>
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
                {g.items.map((c, i) => (
                  <li key={c.key} className={`reveal ${i === 0 ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : i === 3 ? "md:col-span-2" : ""}`} data-delay={String((i % 3) + 1)}>
                    <BentoCard c={c} lang={lang} big={i === 0} read={b.read} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Comment ça marche + premier rendez-vous ───────────── */
export function Process({ lang }: { lang: Lang }) {
  const P = landing[lang].process;
  const t = dict(lang);
  const h = homeText[lang];
  const icons = ["chat", "upload", "check"];
  return (
    <section className="section" aria-labelledby="process-title">
      <div className="container-site grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHead id="process-title" eyebrow={P.eyebrow} title={P.h2} intro={P.intro} />
          <Link href={href("contact", lang)} className="btn-primary reveal mt-8">{t.cta.talk} <Icon name="arrow" className="h-5 w-5" /></Link>
        </div>
        <div>
          <ol className="relative space-y-6 before:absolute before:top-8 before:bottom-8 before:left-6 before:w-px before:bg-gradient-to-b before:from-sky before:to-navy/20 sm:before:left-7">
            {t.steps.items.map((s, i) => (
              <li key={s.t} className="reveal relative flex gap-5 sm:gap-7" data-delay={String(i + 1)}>
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white ring-8 ring-white sm:h-14 sm:w-14">
                  <Icon name={icons[i]} className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <div className="flex-1 rounded-[1.5rem] border border-line p-6">
                  <p className="text-xs font-semibold tracking-[0.14em] text-navy/80 uppercase">{lang === "fr" ? "Étape" : "Step"} {i + 1}</p>
                  <h3 className="mt-1 text-xl font-semibold">{s.t}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.d}</p>
                  <ul className="mt-4 grid gap-1.5 border-t border-line pt-4 text-[0.95rem] text-ink/85 sm:grid-cols-1">
                    {h.meeting.steps[i].list.map((l) => (
                      <li key={l} className="flex items-start gap-2.5"><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-sky" strokeWidth={2.6} />{l}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <h3 className="reveal font-display text-2xl font-semibold text-navy">{h.commitments.h2}</h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {h.commitments.items.map((c, i) => (
                <li key={c.t} className="reveal flex gap-4 rounded-2xl bg-paper p-5" data-delay={String((i % 3) + 1)}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-navy"><Icon name={c.icon} className="h-5 w-5" /></span>
                  <span>
                    <span className="block font-display font-semibold text-navy">{c.t}</span>
                    <span className="mt-0.5 block text-[0.95rem] leading-relaxed text-muted">{c.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
