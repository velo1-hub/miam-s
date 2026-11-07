import type { Locale } from "@/lib/format/number";
import type { Settings } from "@/lib/settings/types";
import { coverImage } from "@/lib/vehicles/media";
import { vehicleFullTitle, type Vehicle } from "@/lib/vehicles/types";

const vehiclePath = (v: Vehicle, locale: Locale) => `/${locale}/${locale === "fr" ? "inventaire" : "inventory"}/${v.slug}`;

/** Car + Offer — brief §18 */
export function vehicleJsonLd(v: Vehicle, locale: Locale, settings: Settings, siteUrl: string) {
  const cover = coverImage(v);
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicleFullTitle(v),
    vehicleIdentificationNumber: v.vin ?? undefined,
    brand: { "@type": "Brand", name: v.make },
    model: v.model,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.odometerKm, unitCode: "KMT" },
    itemCondition: v.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    color: v.exteriorColor ?? undefined,
    bodyType: v.bodyType,
    fuelType: v.fuelType ?? undefined,
    vehicleTransmission: v.transmission ?? undefined,
    numberOfDoors: v.doors ?? undefined,
    vehicleSeatingCapacity: v.seats ?? undefined,
    image: cover ? `${siteUrl}${cover.src}` : undefined,
    url: `${siteUrl}${vehiclePath(v, locale)}`,
    offers: {
      "@type": "Offer",
      price: v.priceCad,
      priceCurrency: "CAD",
      availability: v.status === "available" ? "https://schema.org/InStock" : v.status === "pending" ? "https://schema.org/LimitedAvailability" : "https://schema.org/SoldOut",
      url: `${siteUrl}${vehiclePath(v, locale)}`,
      seller: { "@type": "AutoDealer", name: settings.business.displayName, telephone: settings.business.phone },
    },
  };
}

export function breadcrumbJsonLd(v: Vehicle, locale: Locale, siteUrl: string) {
  const inv = `${siteUrl}/${locale}/${locale === "fr" ? "inventaire" : "inventory"}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "fr" ? "Inventaire" : "Inventory", item: inv },
      { "@type": "ListItem", position: 2, name: v.make, item: `${inv}?make=${encodeURIComponent(v.make)}` },
      { "@type": "ListItem", position: 3, name: vehicleFullTitle(v), item: `${siteUrl}${vehiclePath(v, locale)}` },
    ],
  };
}

/** AutoDealer — home and contact pages */
export function dealerJsonLd(settings: Settings, siteUrl: string) {
  const b = settings.business;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: b.displayName,
    legalName: b.legalName,
    url: siteUrl,
    telephone: b.phone,
    email: b.email,
    address: { "@type": "PostalAddress", streetAddress: b.addressLine1, addressLocality: b.city, addressRegion: "QC", postalCode: b.postalCode, addressCountry: "CA" },
    geo: b.lat !== null && b.lng !== null ? { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng } : undefined,
    openingHoursSpecification: ([0, 1, 2, 3, 4, 5, 6] as const)
      .filter((d) => settings.hours[d].open)
      .map((d) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: days[d], opens: settings.hours[d].open, closes: settings.hours[d].close })),
  };
}
