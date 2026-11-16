import type { Lang } from "./site";

/**
 * Actualités économiques et fiscales, lues côté serveur dans les fils officiels (RSS / Atom).
 * Sur Vercel, la page d'accueil se régénère toute seule (ISR) : au plus une fois par heure.
 * Aucune donnée de visiteur n'est transmise à ces sources ; seuls le titre, la date et le lien sont repris.
 */
export const NEWS_REVALIDATE = 3600;

export type NewsItem = { title: string; url: string; date: string; source: string };
export type Indicator = { label: string; value: string; date: string };

type Feed = { source: { fr: string; en: string }; urls: { fr: string[]; en: string[] }; home: { fr: string; en: string } };

const canadaNews = (lang: Lang, dept: string) =>
  `https://api.io.canada.ca/io-server/gc/news/${lang}/v2?dept=${dept}&sort=publishedDate&orderBy=desc&pick=8&format=atom&atomtitle=news`;

export const feeds: Feed[] = [
  {
    source: { fr: "Banque du Canada", en: "Bank of Canada" },
    urls: {
      fr: ["https://www.banqueducanada.ca/content_type/communiques/feed/", "https://www.banqueducanada.ca/feed/"],
      en: ["https://www.bankofcanada.ca/content_type/press-releases/feed/", "https://www.bankofcanada.ca/feed/"],
    },
    home: { fr: "https://www.banqueducanada.ca/presse/", en: "https://www.bankofcanada.ca/press/" },
  },
  {
    source: { fr: "Statistique Canada", en: "Statistics Canada" },
    urls: {
      fr: ["https://www150.statcan.gc.ca/n1/dai-quo/ssi/homepage/rss-fra.xml"],
      en: ["https://www150.statcan.gc.ca/n1/dai-quo/ssi/homepage/rss-eng.xml"],
    },
    home: { fr: "https://www150.statcan.gc.ca/n1/dai-quo/index-fra.htm", en: "https://www150.statcan.gc.ca/n1/dai-quo/index-eng.htm" },
  },
  {
    source: { fr: "Agence du revenu du Canada", en: "Canada Revenue Agency" },
    urls: { fr: [canadaNews("fr", "canadarevenueagency")], en: [canadaNews("en", "canadarevenueagency")] },
    home: { fr: "https://www.canada.ca/fr/agence-revenu/nouvelles.html", en: "https://www.canada.ca/en/revenue-agency/news.html" },
  },
  {
    source: { fr: "Finances Canada", en: "Finance Canada" },
    urls: { fr: [canadaNews("fr", "departmentfinance")], en: [canadaNews("en", "departmentfinance")] },
    home: { fr: "https://www.canada.ca/fr/ministere-finances/nouvelles.html", en: "https://www.canada.ca/en/department-finance/news.html" },
  },
];

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;|&rsquo;/g, "’").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const tag = (xml: string, names: string[]) => {
  for (const n of names) {
    const m = xml.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"));
    if (m && m[1].trim()) return m[1];
  }
  return "";
};

/** Analyse tolérante : RSS 2.0, RSS 1.0 (RDF) et Atom. */
export function parseFeed(xml: string, source: string): NewsItem[] {
  const blocks = xml.match(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi) ?? [];
  const out: NewsItem[] = [];
  for (const b of blocks) {
    const title = decode(tag(b, ["title"]));
    let url = decode(tag(b, ["link", "guid", "id"]));
    if (!/^https?:\/\//.test(url)) {
      const href = b.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i);
      url = href ? href[1].replace(/&amp;/g, "&") : "";
    }
    const raw = decode(tag(b, ["pubDate", "dc:date", "published", "updated", "date"]));
    const t = Date.parse(raw);
    if (!title || !/^https:\/\//.test(url) || Number.isNaN(t)) continue;
    out.push({ title: title.length > 170 ? title.slice(0, 167).trimEnd() + "…" : title, url, date: new Date(t).toISOString(), source });
  }
  return out;
}

const isExport = process.env.NEXT_EXPORT === "1";

async function get(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; site-news-reader)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*" },
      ...(isExport ? {} : { next: { revalidate: NEWS_REVALIDATE } }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function readFeed(f: Feed, lang: Lang): Promise<NewsItem[]> {
  for (const url of f.urls[lang]) {
    try {
      const items = parseFeed(await get(url), f.source[lang]);
      if (items.length) return items.slice(0, 4);
    } catch {
      /* on essaie l'adresse suivante */
    }
  }
  return [];
}

export async function getNews(lang: Lang, limit = 6): Promise<NewsItem[]> {
  const all = (await Promise.all(feeds.map((f) => readFeed(f, lang)))).flat();
  const seen = new Set<string>();
  return all
    .filter((n) => (seen.has(n.url) ? false : (seen.add(n.url), true)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/** Taux directeur et dollar américain : API ouverte « Valet » de la Banque du Canada. */
export async function getIndicators(lang: Lang): Promise<Indicator[]> {
  try {
    const j = JSON.parse(await get("https://www.bankofcanada.ca/valet/observations/V39079,FXUSDCAD/json?recent=1"));
    const o = j?.observations?.[0];
    if (!o) return [];
    const nf = (n: number, d: number) => new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
    const out: Indicator[] = [];
    const rate = Number(o.V39079?.v), fx = Number(o.FXUSDCAD?.v);
    if (Number.isFinite(rate)) out.push({ label: lang === "fr" ? "Taux directeur" : "Policy rate", value: `${nf(rate, 2)}${lang === "fr" ? " %" : "%"}`, date: o.d });
    if (Number.isFinite(fx)) out.push({ label: lang === "fr" ? "1 $ US en $ CA" : "US$1 in CA$", value: `${nf(fx, 4)}${lang === "fr" ? " $" : ""}`, date: o.d });
    return out;
  } catch {
    return [];
  }
}
