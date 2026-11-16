import Link from "next/link";
import { preload } from "react-dom";
import { concernsFor, type Concern } from "@/content/concerns";
import { homeText } from "@/content/home";
import { landing } from "@/content/landing";
import { team } from "@/content/team";
import { dict } from "@/content/ui";
import { buildDate } from "@/lib/dates";
import { href } from "@/lib/routes";
import { site, type Lang } from "@/lib/site";
import { SectionHead } from "./blocks";
import { CountUp } from "./CountUp";
import { HeroEnhance } from "./HeroEnhance";
import { Icon } from "./Icon";
import { NextDeadline } from "./NextDeadline";

/**
 * Page d'accueil « cinématique » : héros plein écran animé (diaporama, puis vidéo quand
 * site.heroVideo est renseigné), grandes cartes photo, bandeau de chiffres sur image, équipe.
 */

const HERO = [
  { src: "saint-leonard", w: [800, 1000, 1600], pos: "object-[60%_center]" },
  { src: "boulevard", w: [900, 1600], pos: "object-center" },
];
const srcset = (h: (typeof HERO)[number]) => h.w.map((w) => `/images/${h.src}-${w}.webp ${w === 800 ? 720 : w}w`).join(", ");

/* ───────────── Héros plein écran ───────────── */
export function LandingHero({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const L = landing[lang];
  const fr = lang === "fr";
  preload("/images/saint-leonard-1600.webp", { as: "image", fetchPriority: "high", imageSrcSet: srcset(HERO[0]), imageSizes: "100vw" });
  return (
    <section id="hero-track" className="hero-track relative bg-navy-950" aria-labelledby="hero-title">
      <div className="on-dark sticky top-0 flex min-h-[100svh] flex-col overflow-hidden lg:h-[100svh]">
        {/* Médias : diaporama animé ; la vidéo vient se poser par-dessus quand elle est configurée */}
        <div id="hero-media" className="kb absolute inset-0">
          {HERO.map((h, i) => (
            <img
              key={h.src}
              src={`/images/${h.src}-1600.webp`}
              srcSet={srcset(h)}
              sizes="100vw"
              alt={i === 0 ? t.hero.imgAlt : (fr ? "Boulevard commerçant de Montréal bordé d'érables" : "Montreal commercial boulevard lined with maples")}
              width={1600}
              height={895}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className={h.pos}
            />
          ))}
        </div>
        {/* Voile marine : lisibilité du texte (contraste AA) */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/45 to-navy-950/25" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/75 via-navy-950/25 to-transparent" aria-hidden="true" />

        <div className="container-site relative flex flex-1 flex-col justify-end pt-28 pb-8 sm:pb-10">
          <p className="glass-dark inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-1.5 text-[0.8rem] font-medium text-white/90">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky" />
            </span>
            {L.eyebrow}
          </p>
          <h1 id="hero-title" className="mt-6 max-w-5xl text-[2.7rem] leading-[1.02] font-semibold tracking-[-0.04em] text-white sm:text-7xl xl:text-[6rem]">
            {t.hero.h1}
          </h1>
          <div className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{t.hero.sub}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={href("contact", lang)} className="btn-light whitespace-nowrap">
                  {t.cta.talk} <Icon name="arrow" className="h-5 w-5" />
                </Link>
                <a href="#preoccupations" className="btn glass-dark whitespace-nowrap text-white hover:bg-white/15">
                  {fr ? "Qu'est-ce qui vous préoccupe ?" : "What's on your mind?"} <Icon name="arrow" className="h-4 w-4 rotate-90" />
                </a>
              </div>
            </div>

            {/* Chiffres clés en verre */}
            <ul className="grid shrink-0 grid-cols-2 gap-3 sm:flex">
              <li className="glass-dark rounded-2xl px-5 py-4">
                <span className="block font-display text-3xl font-semibold text-white sm:text-4xl"><CountUp to={site.stats.clients} lang={lang} suffix="+" /></span>
                <span className="mt-1 block text-sm text-white/80">{fr ? "clients accompagnés" : "clients served"}</span>
              </li>
              <li className="glass-dark rounded-2xl px-5 py-4">
                <span className="block font-display text-3xl font-semibold text-white sm:text-4xl"><CountUp to={site.stats.businesses} lang={lang} suffix="+" /></span>
                <span className="mt-1 block text-sm text-white/80">{fr ? "entreprises" : "businesses"}</span>
              </li>
              <li className="glass-dark col-span-2 hidden max-w-[17rem] rounded-2xl px-5 py-4 xl:block">
                <NextDeadline lang={lang} buildDate={buildDate()} />
              </li>
            </ul>
          </div>

          {/* Progression du diaporama */}
          <div className="mt-8 hidden items-center gap-2 sm:flex" aria-hidden="true">
            {HERO.map((h) => (
              <span key={h.src} className="kb-bar h-0.5 w-14 overflow-hidden rounded-full bg-white/25"><span /></span>
            ))}
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
        <li key={x} className="flex shrink-0 items-center gap-10 font-display text-[1.05rem] font-medium whitespace-nowrap text-navy">
          {x}
          <span className="h-1.5 w-1.5 rounded-full bg-sky" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="relative overflow-hidden border-b border-line bg-white py-5" aria-label={lang === "fr" ? "Titres et secteurs desservis" : "Credentials and areas served"} role="region">
      <div className="ticker flex w-max">{row(false)}{row(true)}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
    </div>
  );
}

/* ───────────── Les deux portes, en grandes cartes photo ───────────── */
function MediaDoor({ lang, title, lead, img, alt, items, hub, delay, pos = "object-center" }: { lang: Lang; title: string; lead: string; img: string; alt: string; items: Concern[]; hub: string; delay: string; pos?: string }) {
  return (
    <article className="media-card on-dark reveal relative flex flex-col overflow-hidden rounded-[2rem] bg-navy-950" data-delay={delay}>
      <div className="relative h-64 overflow-hidden sm:h-[22rem]">
        <img src={img} alt={alt} width={900} height={1124} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover ${pos}`} />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-950 to-transparent" aria-hidden="true" />
      </div>
      <div className="relative flex-1 p-5 pt-2 sm:p-7 sm:pt-3">
        <h3 className="text-4xl font-semibold text-white sm:text-5xl">
          <Link href={hub} className="underline-offset-8 hover:underline">{title}</Link>
        </h3>
        <p className="mt-3 max-w-md text-lg text-white/85">{lead}</p>
        <ul className="mt-6 grid gap-2">
          {items.map((c) => (
            <li key={c.key}>
              <Link href={href(c.key, lang)} className="glass-dark group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors hover:bg-white/15">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sky"><Icon name={c.icon} className="h-5 w-5" /></span>
                <span className="flex-1">
                  <span className="block font-display text-lg font-semibold text-white">{c[lang].label}</span>
                  <span className="block text-sm leading-snug text-white/75">{c[lang].teaser}</span>
                </span>
                <Icon name="arrow" className="h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function MediaDoors({ lang }: { lang: Lang }) {
  const b = landing[lang].bento;
  const fr = lang === "fr";
  return (
    <section id="preoccupations" className="section" aria-labelledby="doors-title">
      <div className="container-site">
        <SectionHead id="doors-title" eyebrow={b.eyebrow} title={b.h2} intro={b.intro} />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <MediaDoor
            lang={lang} title={b.me} delay="1" hub={href("individuals", lang)} items={concernsFor("individuals")}
            lead={fr ? "Vos impôts, vos lettres, vos grands projets de vie." : "Your taxes, your letters, your big life plans."}
            img="/images/consultation-1070.webp" pos="object-[40%_52%]"
            alt={fr ? "Un CPA explique un dossier à un client, assis à une table" : "A CPA explains a file to a client, seated at a table"}
          />
          <MediaDoor
            lang={lang} title={b.biz} delay="2" hub={href("businesses", lang)} items={concernsFor("businesses")}
            lead={fr ? "Du démarrage au groupe de sociétés." : "From start-up to a group of companies."}
            img="/images/porte-entreprises.webp"
            alt={fr ? "Commerces en brique et terrasse de café sur un boulevard de Montréal" : "Brick storefronts and a café terrace on a Montreal boulevard"}
          />
        </div>
      </div>
    </section>
  );
}

/* ───────────── Philosophie : image + texte ───────────── */
export function Manifesto({ lang }: { lang: Lang }) {
  const m = landing[lang].manifesto;
  const fr = lang === "fr";
  return (
    <section className="section mesh overflow-hidden" aria-labelledby="manifesto-title">
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="reveal relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-sky/40 to-navy/10 blur-2xl" aria-hidden="true" />
          <div className="media-card relative overflow-hidden rounded-[2rem]">
            <img
              src="/images/consultation-1070.webp"
              srcSet="/images/consultation-700.webp 700w, /images/consultation-1070.webp 1070w"
              sizes="(max-width: 1023px) 92vw, 44vw"
              alt={fr ? "Un CPA explique un dossier à un client, assis à une table dans un bureau lumineux" : "A CPA explains a file to a client, seated at a table in a bright office"}
              width={1070} height={1470} loading="lazy" decoding="async"
              className="aspect-[4/5] w-full object-cover object-[35%_60%]"
            />
          </div>
          <ol className="relative mt-3 grid grid-cols-3 gap-3 rounded-2xl border border-line bg-white p-4 sm:absolute sm:inset-x-6 sm:bottom-6 sm:mt-0 sm:gap-4 sm:border-white/80 sm:bg-white/90 sm:p-5 sm:backdrop-blur-xl">
            {m.points.map((p, i) => (
              <li key={p.t}>
                <span className="font-display text-xs font-semibold text-navy/70">0{i + 1}</span>
                <span className="block font-display font-semibold text-navy">{p.t}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="eyebrow reveal">{m.eyebrow}</p>
          <h2 id="manifesto-title" className="reveal text-[2.1rem] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-5xl lg:text-[3.4rem]">{m.big}</h2>
          <div className="reveal mt-8 space-y-5 text-lg leading-relaxed text-ink/85" data-delay="1">
            {m.text.map((p) => <p key={p}>{p}</p>)}
          </div>
          <Link href={href("about", lang)} className="btn-primary reveal mt-9" data-delay="2">{fr ? "Découvrir le cabinet" : "Discover the firm"} <Icon name="arrow" className="h-5 w-5" /></Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Comment ça marche ───────────── */
export function Process({ lang }: { lang: Lang }) {
  const P = landing[lang].process;
  const t = dict(lang);
  const h = homeText[lang];
  const icons = ["chat", "upload", "check"];
  return (
    <section className="section" aria-labelledby="process-title">
      <div className="container-site">
        <SectionHead id="process-title" eyebrow={P.eyebrow} title={P.h2} intro={P.intro} />
        <ol className="mt-12 grid gap-5 lg:grid-cols-3">
          {t.steps.items.map((s, i) => (
            <li key={s.t} className="reveal flex flex-col rounded-[2rem] border border-line bg-white p-7 sm:p-8" data-delay={String(i + 1)}>
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white"><Icon name={icons[i]} className="h-6 w-6" /></span>
                <span className="font-display text-6xl font-semibold text-navy/55" aria-hidden="true">0{i + 1}</span>
              </div>
              <h3 className="mt-7 text-2xl font-semibold">
                <span className="sr-only">{lang === "fr" ? `Étape ${i + 1} : ` : `Step ${i + 1}: `}</span>
                {s.t}
              </h3>
              <p className="mt-3 leading-relaxed text-muted">{s.d}</p>
              <ul className="mt-6 space-y-2.5 border-t border-line pt-6 text-[0.95rem]">
                {h.meeting.steps[i].list.map((l) => (
                  <li key={l} className="flex items-start gap-2.5"><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-navy" strokeWidth={2.4} />{l}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {h.commitments.items.map((c, i) => (
            <li key={c.t} className="reveal rounded-2xl bg-paper p-6" data-delay={String((i % 3) + 1)}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy"><Icon name={c.icon} className="h-5 w-5" /></span>
              <p className="mt-4 font-display text-lg font-semibold text-navy">{c.t}</p>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{c.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────────── Bandeau de chiffres sur photo ───────────── */
export function StatsBand({ lang }: { lang: Lang }) {
  const fr = lang === "fr";
  const t = dict(lang);
  return (
    <section className="on-dark relative overflow-hidden bg-navy-950 py-24 text-white sm:py-32" aria-labelledby="stats-title">
      <img src="/images/boulevard-1600.webp" srcSet="/images/boulevard-900.webp 900w, /images/boulevard-1600.webp 1600w" sizes="100vw" alt={fr ? "Boulevard de Montréal en fin de journée" : "Montreal boulevard in late afternoon"} width={1600} height={895} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/75 to-navy-950/45" aria-hidden="true" />
      <div className="container-site relative">
        <p className="eyebrow reveal text-sky">{fr ? "Othmani CPA en chiffres" : "Othmani CPA in numbers"}</p>
        <h2 id="stats-title" className="reveal max-w-4xl text-[2.2rem] leading-[1.06] font-semibold tracking-[-0.03em] text-white sm:text-6xl">
          {fr ? "De Saint-Léonard à tout le Canada." : "From Saint-Léonard to all of Canada."}
        </h2>
        <ul className="mt-14 grid gap-5 sm:grid-cols-3">
          {[
            { v: <CountUp to={site.stats.clients} lang={lang} suffix="+" />, k: fr ? "clients accompagnés" : "clients served", d: fr ? "Particuliers, familles et entreprises" : "Individuals, families and businesses" },
            { v: <CountUp to={site.stats.businesses} lang={lang} suffix="+" />, k: fr ? "entreprises" : "businesses", d: fr ? "Travailleurs autonomes, PME et groupes de sociétés" : "Self-employed, SMEs and groups of companies" },
            { v: "2", k: fr ? "langues de service" : "service languages", d: fr ? "Français et anglais, au bureau ou à distance" : "French and English, in person or remotely" },
          ].map((s, i) => (
            <li key={s.k} className="glass-dark reveal rounded-[1.75rem] p-7 sm:p-8" data-delay={String(i + 1)}>
              <span className="block font-display text-6xl font-semibold tracking-tight text-white sm:text-7xl">{s.v}</span>
              <span className="mt-3 block font-display text-xl font-semibold text-sky">{s.k}</span>
              <span className="mt-1 block text-white/80">{s.d}</span>
            </li>
          ))}
        </ul>
        <Link href={href("contact", lang)} className="btn-light reveal mt-10">{t.cta.talk} <Icon name="arrow" className="h-5 w-5" /></Link>
      </div>
    </section>
  );
}

/* ───────────── L'équipe, en grands portraits ───────────── */
export function TeamShowcase({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const fr = lang === "fr";
  return (
    <section className="on-dark mesh-dark relative overflow-hidden py-24 text-white sm:py-32" aria-labelledby="team-home-title">
      <div className="container-site grid gap-14 lg:grid-cols-[1fr_1.35fr] lg:items-center lg:gap-20">
        <div>
          <p className="eyebrow reveal text-sky">{fr ? "L'équipe" : "The team"}</p>
          <h2 id="team-home-title" className="reveal text-[2.2rem] leading-[1.06] font-semibold tracking-[-0.03em] text-white sm:text-5xl">{fr ? "Les personnes derrière votre dossier." : "The people behind your file."}</h2>
          <div className="reveal mt-7 space-y-4 text-lg leading-relaxed text-white/80" data-delay="1">
            {t.zouhaier.lines.map((l) => <p key={l}>{l}</p>)}
          </div>
          <ul className="reveal mt-8 flex flex-wrap gap-2" data-delay="2">
            {t.pro.creds.map((c) => (
              <li key={c} className="glass-dark inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white">
                <Icon name="check" className="h-4 w-4 text-sky" strokeWidth={2.4} /> {c}
              </li>
            ))}
          </ul>
          <Link href={href("about", lang)} className="btn-light reveal mt-9" data-delay="2">{t.zouhaier.more} <Icon name="arrow" className="h-5 w-5" /></Link>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2">
          {team.map((m, i) => (
            <li key={m.id} className={`media-card reveal relative overflow-hidden rounded-[2rem] ${i === 1 ? "sm:mt-14" : ""}`} data-delay={String(i + 1)}>
              <img src={m.photo} alt={`${m.name}, ${m[lang].role}, Othmani CPA`} width={800} height={1000} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent p-6 pt-20">
                <h3 className="font-display text-2xl font-semibold text-white">{m.name}</h3>
                <p className="text-sky">{m[lang].role}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{m[lang].text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
