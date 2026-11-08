import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { vehicles } from "@/lib/vehicles";

const STATIC: { fr: string; en: string; priority: number }[] = [
  { fr: "/fr", en: "/en", priority: 1 },
  { fr: "/fr/inventaire", en: "/en/inventory", priority: 0.9 },
  { fr: "/fr/financement", en: "/en/financing", priority: 0.7 },
  { fr: "/fr/echange", en: "/en/trade-in", priority: 0.7 },
  { fr: "/fr/vendre-mon-auto", en: "/en/sell-my-car", priority: 0.7 },
  { fr: "/fr/a-propos", en: "/en/about", priority: 0.5 },
  { fr: "/fr/contact", en: "/en/contact", priority: 0.6 },
  { fr: "/fr/confidentialite", en: "/en/privacy", priority: 0.2 },
  { fr: "/fr/conditions", en: "/en/terms", priority: 0.2 },
];

/** Dynamic sitemap with every published vehicle and hreflang alternates — brief §18. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const entries: MetadataRoute.Sitemap = STATIC.flatMap((s) => [
    { url: `${base}${s.fr}`, priority: s.priority, changeFrequency: "daily" as const, alternates: { languages: { "fr-CA": `${base}${s.fr}`, "en-CA": `${base}${s.en}` } } },
    { url: `${base}${s.en}`, priority: s.priority, changeFrequency: "daily" as const, alternates: { languages: { "fr-CA": `${base}${s.fr}`, "en-CA": `${base}${s.en}` } } },
  ]);
  for (const v of await vehicles.publishedSlugs()) {
    const fr = `${base}/fr/inventaire/${v.slug}`;
    const en = `${base}/en/inventory/${v.slug}`;
    entries.push({ url: fr, lastModified: v.updatedAt, priority: 0.8, changeFrequency: "weekly", alternates: { languages: { "fr-CA": fr, "en-CA": en } } });
    entries.push({ url: en, lastModified: v.updatedAt, priority: 0.8, changeFrequency: "weekly", alternates: { languages: { "fr-CA": fr, "en-CA": en } } });
  }
  return entries;
}
