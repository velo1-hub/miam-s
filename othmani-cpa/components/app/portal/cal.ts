import type { Lang } from "@/lib/site";
import { OFFICE_HOURS } from "../shared";

/**
 * Petits outils de calendrier. Un jour est toujours une chaîne AAAA-MM-JJ : tous les calculs se font
 * en UTC à midi, donc jamais de décalage dû au fuseau de l'appareil ni au changement d'heure.
 * Les moments précis (rendez-vous confirmés) sont lus et affichés à l'heure de Montréal.
 */
export const TZ = "America/Montreal";
const loc = (lang: Lang) => (lang === "fr" ? "fr-CA" : "en-CA");
const noon = (day: string) => new Date(`${day}T12:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const pad = (n: number) => String(n).padStart(2, "0");

export const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(noon(s).getTime());
export const addDays = (day: string, n: number) => { const d = noon(day); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
/** Lundi = 0 … dimanche = 6. */
export const weekdayMon = (day: string) => (noon(day).getUTCDay() + 6) % 7;
/** Jour de la semaine au sens de `OFFICE_HOURS.days` : dimanche = 0 … samedi = 6. */
export const weekdaySun = (day: string) => noon(day).getUTCDay();
export const isOpenDay = (day: string) => (OFFICE_HOURS.days as readonly number[]).includes(weekdaySun(day));
export const monthOf = (day: string) => day.slice(0, 7);
export const firstOfMonth = (day: string) => `${monthOf(day)}-01`;
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0, 12)).getUTCDate(); // m : 1 à 12
/** Même quantième n mois plus loin ; le 31 devient le dernier jour quand le mois est plus court. */
export const addMonths = (day: string, n: number) => {
  const [y, m, d] = day.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12), nm = (total % 12 + 12) % 12 + 1;
  return `${ny}-${pad(nm)}-${pad(Math.min(d, daysInMonth(ny, nm)))}`;
};
/** Semaines complètes (lundi à dimanche) qui couvrent le mois du jour donné. */
export const monthWeeks = (day: string): string[][] => {
  const first = firstOfMonth(day);
  const [y, m] = first.split("-").map(Number);
  const start = addDays(first, -weekdayMon(first));
  const count = Math.ceil((weekdayMon(first) + daysInMonth(y, m)) / 7);
  return Array.from({ length: count }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)));
};

/** Jour (AAAA-MM-JJ) et minutes depuis minuit, à Montréal, d'un moment précis. `null` si la date est illisible. */
export const mtlParts = (stamp: string): { day: string; minutes: number } | null => {
  const d = new Date(stamp);
  if (Number.isNaN(d.getTime())) return null;
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d)) p[x.type] = x.value;
  return { day: `${p.year}-${p.month}-${p.day}`, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
};

const fmtDay = (day: string, lang: Lang, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc(lang), { ...o, timeZone: "UTC" }).format(noon(day));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « Novembre 2026 » */
export const monthTitle = (day: string, lang: Lang) => cap(fmtDay(day, lang, { month: "long", year: "numeric" }));
/** « vendredi 20 novembre 2026 » */
export const fullDate = (day: string, lang: Lang) => fmtDay(day, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const dayTitle = (day: string, lang: Lang) => cap(fullDate(day, lang));
/** Noms des jours, lundi d'abord : abrégé pour l'en-tête, complet pour les lecteurs d'écran. */
export const weekdayNames = (lang: Lang) =>
  Array.from({ length: 7 }, (_, i) => {
    const day = addDays("2024-01-01", i); // le 1er janvier 2024 est un lundi
    return { short: fmtDay(day, lang, { weekday: "short" }).replace(".", ""), long: fmtDay(day, lang, { weekday: "long" }) };
  });
/** Heure d'un moment précis, à Montréal : « 11 h 00 » ou « 11:00 a.m. ». */
export const clock = (stamp: string | number, lang: Lang) => new Intl.DateTimeFormat(loc(lang), { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(stamp));
/** Graduation de l'échelle horaire : « 9 h » ou « 9 a.m. ». */
export const hourLabel = (h: number, lang: Lang) => (lang === "fr" ? `${h} h` : `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "a.m." : "p.m."}`);
export const durationLabel = (min: number, lang: Lang) => {
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} min`;
  return lang === "fr" ? `${h} h${m ? ` ${pad(m)}` : ""}` : `${h} h${m ? ` ${m} min` : ""}`;
};
