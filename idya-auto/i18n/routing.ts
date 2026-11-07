import { defineRouting } from "next-intl/routing";

export const locales = ["fr", "en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "fr";

/** Localized pathnames — brief §4. Internal (file-system) paths are the keys. */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  // French is the default for everyone (Charter of the French language); the toggle is explicit.
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/inventory": { fr: "/inventaire", en: "/inventory" },
    "/inventory/[slug]": { fr: "/inventaire/[slug]", en: "/inventory/[slug]" },
    "/compare": { fr: "/comparer", en: "/compare" },
    "/favorites": { fr: "/favoris", en: "/favorites" },
    "/financing": { fr: "/financement", en: "/financing" },
    "/trade-in": { fr: "/echange", en: "/trade-in" },
    "/about": { fr: "/a-propos", en: "/about" },
    "/contact": "/contact",
    "/privacy": { fr: "/confidentialite", en: "/privacy" },
    "/terms": { fr: "/conditions", en: "/terms" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
