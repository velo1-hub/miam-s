import { deadlines, type Deadline } from "@/content/deadlines";
import type { Lang } from "./site";

export function upcoming(today: string, audience?: Deadline["audience"]) {
  return deadlines
    .filter((d) => d.date >= today)
    .filter((d) => !audience || d.audience === audience || d.audience === "both")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function formatDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", { ...opts, timeZone: "UTC" }).format(new Date(iso + "T12:00:00Z"));
}

/** Date de génération du site (AAAA-MM-JJ, heure de Montréal) */
export const buildDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal" }).format(new Date());
