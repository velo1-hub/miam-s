"use client";
import { deadlines, type Deadline } from "@/content/deadlines";
import type { Lang } from "@/lib/site";
import { Icon } from "./Icon";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const ymd = (iso: string) => iso.replace(/-/g, "");
const next = (iso: string) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ""); };

/** Fichier iCalendar : événements d'une journée avec rappel 3 jours avant. */
function ics(items: Deadline[], lang: Lang) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const ev = items.map((d) => [
    "BEGIN:VEVENT",
    `UID:${d.date}-${ymd(d.date)}-${d.audience}@othmanicpa.ca`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(d.date)}`,
    `DTEND;VALUE=DATE:${next(d.date)}`,
    `SUMMARY:${esc(d[lang].title)}`,
    `DESCRIPTION:${esc(d[lang].detail + (lang === "fr" ? " — Othmani CPA" : " — Othmani CPA"))}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-P3D", `DESCRIPTION:${esc(d[lang].title)}`, "END:VALARM",
    "END:VEVENT",
  ].join("\r\n"));
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Othmani CPA//Calendrier fiscal//FR", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n");
}

function download(items: Deadline[], lang: Lang, name: string) {
  const blob = new Blob([ics(items, lang)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AddToCalendar({ lang, date, title, small = false }: { lang: Lang; date: string; title: string; small?: boolean }) {
  const label = lang === "fr" ? "Ajouter à mon agenda" : "Add to my calendar";
  return (
    <button
      type="button"
      onClick={() => download(deadlines.filter((d) => d.date === date && d[lang].title === title), lang, `${date}-othmani-cpa.ics`)}
      className={`inline-flex items-center gap-1.5 font-semibold text-navy underline-offset-4 hover:underline ${small ? "text-xs" : "text-sm"}`}
      aria-label={`${label} : ${title}`}
    >
      <Icon name="calendar" className="h-4 w-4" /> {label}
    </button>
  );
}

export function AddAllToCalendar({ lang, today }: { lang: Lang; today: string }) {
  return (
    <button type="button" onClick={() => download(deadlines.filter((d) => d.date >= today), lang, "calendrier-fiscal-othmani-cpa.ics")} className="btn glass text-navy hover:bg-white">
      <Icon name="calendar" className="h-5 w-5" /> {lang === "fr" ? "Tout ajouter à mon agenda" : "Add all to my calendar"}
    </button>
  );
}
