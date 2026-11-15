import { routes, type RouteKey } from "./routes";
import { abs, hasEmail, hasPhone, site, type Lang } from "./site";
import type { QA } from "@/content/concerns";

const BUSINESS_ID = abs("/#cabinet");

/** AccountingService + LocalBusiness : adresse, heures, téléphone, zone desservie. */
export function businessSchema(lang: Lang) {
  const a = site.address;
  return {
    "@context": "https://schema.org",
    "@type": ["AccountingService", "LocalBusiness"],
    "@id": BUSINESS_ID,
    name: site.name,
    url: abs(routes.home[lang]),
    image: abs("/images/og.png"),
    logo: abs("/icon.svg"),
    description:
      lang === "fr"
        ? "Cabinet de CPA à Saint-Léonard (Montréal) pour particuliers et entreprises : impôts, TPS/TVQ, états financiers, audit."
        : "CPA firm in Saint-Léonard (Montreal) for individuals and businesses: taxes, GST/QST, financial statements, audit.",
    founder: { "@type": "Person", name: site.owner, jobTitle: site.ownerTitle[lang] },
    address: {
      "@type": "PostalAddress",
      streetAddress: lang === "fr" ? a.street : a.streetEn,
      addressLocality: a.city,
      addressRegion: a.region,
      postalCode: a.postalCode,
      addressCountry: a.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    ...(hasPhone() ? { telephone: site.phone.tel } : {}),
    ...(hasEmail() ? { email: site.email } : {}),
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: site.areaServed.map((name) => ({ "@type": "Place", name })),
    knowsLanguage: ["fr-CA", "en-CA"],
    ...(site.googleReviewsUrl ? { sameAs: [site.googleReviewsUrl] } : {}),
  };
}

export function faqSchema(faq: QA[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export type Crumb = { name: string; key: RouteKey };

export function breadcrumbSchema(lang: Lang, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(routes[c.key][lang]),
    })),
  };
}

export function personSchema(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.owner,
    jobTitle: site.ownerTitle[lang],
    image: abs("/images/zouhaier-othmani.webp"),
    worksFor: { "@id": BUSINESS_ID },
    memberOf: { "@type": "Organization", name: "Ordre des comptables professionnels agréés du Québec", url: "https://cpaquebec.ca" },
    knowsLanguage: ["fr", "en"],
  };
}
