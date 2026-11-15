import type { Lang } from "./site";

/** Chaque page a son équivalent dans l'autre langue (hreflang, sélecteur de langue, sitemap). */
export const routes = {
  home: { fr: "/", en: "/en/" },
  individuals: { fr: "/particuliers/", en: "/en/individuals/" },
  businesses: { fr: "/entreprises/", en: "/en/businesses/" },
  calendar: { fr: "/calendrier-fiscal/", en: "/en/tax-calendar/" },
  about: { fr: "/a-propos/", en: "/en/about/" },
  contact: { fr: "/contact/", en: "/en/contact/" },
  privacy: { fr: "/confidentialite/", en: "/en/privacy/" },
  // Préoccupations
  personalTaxes: { fr: "/impots-particuliers/", en: "/en/personal-taxes/" },
  taxLetter: { fr: "/lettre-impot/", en: "/en/tax-letter/" },
  selfEmployed: { fr: "/travailleur-autonome/", en: "/en/self-employed/" },
  lifeChanges: { fr: "/grands-changements/", en: "/en/life-changes/" },
  startBusiness: { fr: "/demarrer-entreprise/", en: "/en/start-a-business/" },
  salesTax: { fr: "/taxes-tps-tvq/", en: "/en/gst-qst/" },
  statements: { fr: "/etats-financiers/", en: "/en/financial-statements/" },
  multiCompanies: { fr: "/plusieurs-entreprises/", en: "/en/multiple-companies/" },
} as const;

export type RouteKey = keyof typeof routes;

export const href = (key: RouteKey, lang: Lang) => routes[key][lang];

/** Segment de l'URL (sans barres obliques ni /en) */
export const slugOf = (key: RouteKey, lang: Lang) =>
  routes[key][lang].replace(/^\/(en\/)?/, "").replace(/\/$/, "");
