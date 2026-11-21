import { BIZ } from "@/content/business";
import { SERVICES, type Service } from "@/content/services";
import { href, pagePath, type Locale } from "@/i18n/config";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function businessJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": `${BIZ.url}/#business`,
    name: BIZ.name, url: BIZ.url, telephone: BIZ.phone, email: BIZ.email,
    image: `${BIZ.url}/opengraph-image`, logo: `${BIZ.url}/icon.svg`,
    address: { "@type": "PostalAddress", streetAddress: BIZ.address.street, addressLocality: BIZ.address.city, addressRegion: BIZ.address.region, postalCode: BIZ.address.postal, addressCountry: "CA" },
    geo: { "@type": "GeoCoordinates", latitude: BIZ.geo.lat, longitude: BIZ.geo.lng },
    areaServed: BIZ.serviceArea.map((name) => ({ "@type": "City", name })),
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: BIZ.hours.opens, closes: BIZ.hours.closes }],
    availableLanguage: ["fr", "en"],
    hasOfferCatalog: { "@type": "OfferCatalog", name: locale === "fr" ? "Services de nettoyage" : "Cleaning services",
      itemListElement: SERVICES.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name[locale], url: `${BIZ.url}${pagePath(locale, "services", s.slug[locale])}` } })) },
    potentialAction: { "@type": "ReserveAction", name: locale === "fr" ? "Planifier une visite d'évaluation gratuite" : "Schedule a free walkthrough", target: `${BIZ.url}${pagePath(locale, "book")}` },
  };
}

export function serviceJsonLd(locale: Locale, s: Service) {
  return {
    "@context": "https://schema.org", "@type": "Service", name: s.name[locale], description: s.intro[locale], serviceType: s.name.en,
    provider: { "@id": `${BIZ.url}/#business` }, areaServed: BIZ.serviceArea.map((name) => ({ "@type": "City", name })),
    url: `${BIZ.url}${pagePath(locale, "services", s.slug[locale])}`,
  };
}
export function faqJsonLd(items: { q: string; a: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) };
}
export function breadcrumbJsonLd(locale: Locale, items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: locale === "fr" ? "Accueil" : "Home", item: `${BIZ.url}${href(locale, "/")}` }, ...items.map((it, i) => ({ "@type": "ListItem", position: i + 2, name: it.name, item: `${BIZ.url}${it.path}` }))] };
}
