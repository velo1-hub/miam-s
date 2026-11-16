import { feeds, getIndicators, getNews, newsStatus } from "@/lib/news";
import type { Lang } from "@/lib/site";
import { SectionHead } from "./blocks";
import { Icon } from "./Icon";

/**
 * Actualités économiques : se met à jour toute seule (régénération horaire sur Vercel).
 * Si aucune source ne répond, la section affiche les liens vers les sources officielles.
 */
export async function EconNews({ lang }: { lang: Lang }) {
  const fr = lang === "fr";
  const [news, indicators, status] = await Promise.all([getNews(lang, 6), getIndicators(lang), newsStatus(lang)]);
  const fmt = (iso: string) => new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Montreal" }).format(new Date(iso));
  const now = new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Montreal" }).format(new Date());
  const [lead, ...rest] = news;

  return (
    <section id="actualites" className="section" aria-labelledby="news-title" data-news-status={status}>
      <div className="container-site">
        <SectionHead
          id="news-title"
          eyebrow={fr ? "Actualités économiques" : "Economic news"}
          title={fr ? "Ce qui bouge pour votre portefeuille" : "What's moving for your wallet"}
          intro={fr ? "Les dernières annonces des sources officielles : taux d'intérêt, inflation, impôts. Mis à jour automatiquement." : "The latest from official sources: interest rates, inflation, taxes. Updated automatically."}
          action={
            <p className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky" />
              </span>
              {news.length ? (fr ? `Mis à jour le ${now}` : `Updated ${now}`) : fr ? "Sources officielles" : "Official sources"}
            </p>
          }
        />

        {indicators.length > 0 && (
          <ul className="reveal mt-10 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
            {indicators.map((i) => (
              <li key={i.label} className="flex items-center justify-between gap-4 rounded-2xl bg-navy px-6 py-5 text-white on-dark">
                <span>
                  <span className="block text-sm text-white/80">{i.label}</span>
                  <span className="block text-xs text-white/60">{fr ? "Banque du Canada" : "Bank of Canada"} · <time dateTime={i.date}>{fmt(i.date + "T12:00:00Z")}</time></span>
                </span>
                <span className="font-display text-3xl font-semibold text-white tabular-nums">{i.value}</span>
              </li>
            ))}
          </ul>
        )}

        {lead ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            <a href={lead.url} target="_blank" rel="noopener noreferrer" className="reveal mesh-dark on-dark group relative flex min-h-[20rem] flex-col justify-end overflow-hidden rounded-[2rem] p-7 text-white sm:p-9">
              <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-sky/30 blur-3xl" aria-hidden="true" />
              <p className="relative flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-sky">{lead.source}</span>
                <time dateTime={lead.date}>{fmt(lead.date)}</time>
              </p>
              <h3 className="relative mt-4 text-2xl leading-snug font-semibold text-white sm:text-3xl">{lead.title}</h3>
              <span className="relative mt-6 inline-flex items-center gap-2 font-semibold text-sky">
                {fr ? "Lire à la source" : "Read at the source"} <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                <span className="sr-only">{fr ? " (nouvel onglet)" : " (new tab)"}</span>
              </span>
            </a>
            <ul className="divide-y divide-line overflow-hidden rounded-[2rem] border border-line">
              {rest.map((n, i) => (
                <li key={n.url} className="reveal" data-delay={String((i % 3) + 1)}>
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 bg-white px-6 py-4 transition-colors hover:bg-sky-50">
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                        <span className="font-semibold tracking-wide text-navy uppercase">{n.source}</span>
                        <time dateTime={n.date}>{fmt(n.date)}</time>
                      </span>
                      <span className="mt-1 block font-display leading-snug font-semibold text-ink group-hover:text-navy">{n.title}</span>
                      <span className="sr-only">{fr ? " (nouvel onglet)" : " (new tab)"}</span>
                    </span>
                    <Icon name="arrow" className="mt-1 h-5 w-5 shrink-0 -rotate-45 text-navy/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-navy" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {feeds.map((f) => (
              <li key={f.home.fr}>
                <a href={f.home[lang]} target="_blank" rel="noopener noreferrer" className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-line p-5 font-display font-semibold text-navy transition-colors hover:bg-sky-50">
                  {f.source[lang]}
                  <Icon name="arrow" className="h-5 w-5 shrink-0 -rotate-45" />
                </a>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-sm leading-relaxed text-muted">
          {fr
            ? "Titres repris automatiquement des sources officielles, sans sélection ni commentaire du cabinet. Une question sur l'effet d'une annonce sur vos impôts ? Parlez-en à un CPA."
            : "Headlines pulled automatically from official sources, with no selection or commentary by the firm. Wondering how an announcement affects your taxes? Talk to a CPA."}
        </p>
      </div>
    </section>
  );
}
