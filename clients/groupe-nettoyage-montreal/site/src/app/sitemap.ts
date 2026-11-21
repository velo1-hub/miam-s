import type { MetadataRoute } from "next";
import { BIZ } from "@/content/business";
import { SERVICES } from "@/content/services";
import { ZONES } from "@/content/zones";
import { POSTS } from "@/content/posts";
import { locales, pagePath, pageSlugs, href, type PageKey } from "@/i18n/config";
export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = []; const now = new Date();
  const add = (paths: Record<string, string>, priority: number) => out.push({ url: `${BIZ.url}${paths.fr}`, lastModified: now, priority, alternates: { languages: { "fr-CA": `${BIZ.url}${paths.fr}`, "en-CA": `${BIZ.url}${paths.en}`, "x-default": `${BIZ.url}${paths.fr}` } } }, { url: `${BIZ.url}${paths.en}`, lastModified: now, priority, alternates: { languages: { "fr-CA": `${BIZ.url}${paths.fr}`, "en-CA": `${BIZ.url}${paths.en}`, "x-default": `${BIZ.url}${paths.fr}` } } });
  add({ fr: "/", en: "/en" }, 1);
  (Object.keys(pageSlugs) as PageKey[]).filter((k) => !["confirmation", "myBooking"].includes(k)).forEach((k) => add({ fr: pagePath("fr", k), en: pagePath("en", k) }, k === "quote" || k === "book" ? 0.9 : 0.6));
  SERVICES.forEach((s) => add({ fr: pagePath("fr", "services", s.slug.fr), en: pagePath("en", "services", s.slug.en) }, 0.9));
  ZONES.forEach((z) => add({ fr: pagePath("fr", "zones", z.slug.fr), en: pagePath("en", "zones", z.slug.en) }, 0.7));
  POSTS.forEach((p) => add({ fr: pagePath("fr", "blog", p.slug.fr), en: pagePath("en", "blog", p.slug.en) }, 0.5));
  void locales; void href; return out;
}
