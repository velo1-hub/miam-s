export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

/** Public path for a locale: FR has no prefix, EN has /en. */
export function href(locale: Locale, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === "fr") return p === "/" ? "/" : p;
  return p === "/" ? "/en" : `/en${p}`;
}

/** Static page slugs per locale (pages that are not services, zones or posts). */
export const pageSlugs = {
  services: { fr: "services", en: "services" },
  zones: { fr: "zones", en: "areas" },
  pricing: { fr: "tarifs", en: "pricing" },
  quote: { fr: "soumission", en: "quote" },
  book: { fr: "reserver", en: "book" },
  about: { fr: "a-propos", en: "about" },
  method: { fr: "notre-methode", en: "our-method" },
  reviews: { fr: "avis", en: "reviews" },
  work: { fr: "realisations", en: "our-work" },
  careers: { fr: "carrieres", en: "careers" },
  blog: { fr: "blogue", en: "blog" },
  contact: { fr: "contact", en: "contact" },
  privacy: { fr: "confidentialite", en: "privacy" },
  terms: { fr: "conditions", en: "terms" },
  accessibility: { fr: "accessibilite", en: "accessibility" },
  myBooking: { fr: "ma-reservation", en: "my-booking" },
  confirmation: { fr: "confirmation", en: "confirmation" },
} as const;
export type PageKey = keyof typeof pageSlugs;

export function pagePath(locale: Locale, key: PageKey, sub?: string) {
  return href(locale, `/${pageSlugs[key][locale]}${sub ? `/${sub}` : ""}`);
}
