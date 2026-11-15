import type { Metadata } from "next";
import { routes, type RouteKey } from "./routes";
import { abs, site, type Lang } from "./site";

/** Métadonnées d'une page : title unique, description, canonical, hreflang fr-CA / en-CA, Open Graph. */
export function pageMeta(key: RouteKey, lang: Lang, title: string, description: string): Metadata {
  const r = routes[key];
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: abs(r[lang]),
      languages: { "fr-CA": abs(r.fr), "en-CA": abs(r.en), "x-default": abs(r.fr) },
    },
    openGraph: {
      type: "website",
      url: abs(r[lang]),
      title,
      description,
      siteName: site.name,
      locale: lang === "fr" ? "fr_CA" : "en_CA",
      alternateLocale: lang === "fr" ? "en_CA" : "fr_CA",
      images: [{ url: abs("/images/og.png"), width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [abs("/images/og.png")] },
  };
}
