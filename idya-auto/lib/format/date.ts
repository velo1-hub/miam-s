import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { enCA, frCA } from "date-fns/locale";
import type { Locale } from "./number";

export const TIMEZONE = "America/Toronto";
const locales = { fr: frCA, en: enCA };
const tz = (iso: string | Date) => new TZDate(typeof iso === "string" ? new Date(iso) : iso, TIMEZONE);

export function formatDateLong(iso: string | Date, locale: Locale): string {
  const d = tz(iso);
  return format(d, locale === "fr" ? "EEEE d MMMM yyyy" : "EEEE, MMMM d, yyyy", { locale: locales[locale] });
}

export function formatDateShort(iso: string | Date, locale: Locale): string {
  const d = tz(iso);
  return format(d, locale === "fr" ? "d MMM" : "MMM d", { locale: locales[locale] });
}

export function formatTime(iso: string | Date, locale: Locale): string {
  const d = tz(iso);
  return format(d, locale === "fr" ? "H 'h' mm" : "h:mm a", { locale: locales[locale] });
}

export function formatDateTime(iso: string | Date, locale: Locale): string {
  return `${formatDateLong(iso, locale)}${locale === "fr" ? " à " : " at "}${formatTime(iso, locale)}`;
}

export function weekdayName(weekday: number, locale: Locale, width: "long" | "short" = "long"): string {
  // Pure lookup through the date-fns locale (no Date construction → safe during prerendering)
  const day = locales[locale].localize?.day((weekday % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6, { width: width === "long" ? "wide" : "abbreviated" });
  return day ?? "";
}

/** "09:00" → FR "9 h" / "9 h 30", EN "9 a.m." / "9:30 a.m." */
export function formatHoursLabel(hhmm: string, locale: Locale): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (locale === "fr") return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
  const suffix = h >= 12 ? "p.m." : "a.m.";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hh} ${suffix}` : `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}
