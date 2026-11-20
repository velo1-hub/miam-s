import type { Metadata } from "next";
import { routes, type RouteKey } from "./routes";
import { abs, liveUrl, SHARE_IMAGE, site, type Lang } from "./site";

/** Métadonnées d'une page : title unique, description, canonical, hreflang fr-CA / en-CA, Open Graph. */
export function pageMeta(key: RouteKey, lang: Lang, title: string, description: string): Metadata {
  const r = routes[key];
  // Aperçu du lien : la marque d'abord
  const shareTitle = `${site.name} · ${title.replace(/\s*\|\s*(Othmani CPA|CPA)\s*$/, "")}`;
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
      title: shareTitle,
      description,
      siteName: site.name,
      locale: lang === "fr" ? "fr_CA" : "en_CA",
      alternateLocale: lang === "fr" ? "en_CA" : "fr_CA",
      images: [{ url: liveUrl(SHARE_IMAGE), width: 1200, height: 630, alt: `Logo ${site.name}` }],
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [liveUrl(SHARE_IMAGE)] },
  };
}
