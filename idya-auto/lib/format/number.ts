export type Locale = "fr" | "en";

const BCP47: Record<Locale, string> = { fr: "fr-CA", en: "en-CA" };

const cadFormatters: Record<Locale, Intl.NumberFormat> = {
  fr: new Intl.NumberFormat(BCP47.fr, {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }),
  en: new Intl.NumberFormat(BCP47.en, {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }),
};

const integerFormatters: Record<Locale, Intl.NumberFormat> = {
  fr: new Intl.NumberFormat(BCP47.fr, { maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat(BCP47.en, { maximumFractionDigits: 0 }),
};

/** Whole-dollar CAD price: FR `28 995 $`, EN `$28,995` (brief §18). */
export function formatPrice(amountCad: number, locale: Locale): string {
  return cadFormatters[locale].format(Math.round(amountCad));
}

/** Odometer: FR `45 200 km`, EN `45,200 km` (brief §18). */
export function formatKm(km: number, locale: Locale): string {
  return `${integerFormatters[locale].format(Math.round(km))} km`;
}
