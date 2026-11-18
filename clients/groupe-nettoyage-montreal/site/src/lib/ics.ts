import type { Booking } from "./db/types";
import { BIZ } from "@/content/business";
const pad = (n: number) => String(n).padStart(2, "0");
export function bookingICS(b: Booking, title: string) {
  const [y, m, d] = b.date.split("-").map(Number); const [sh, sm] = b.slot_start.split(":").map(Number); const [eh, em] = b.slot_end.split(":").map(Number);
  const fmt = (h: number, mi: number) => `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(mi)}00`;
  const esc = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${BIZ.name}//Booking//FR`, "BEGIN:VEVENT", `UID:${b.ref}@groupenettoyagemontreal.ca`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`, `DTSTART;TZID=America/Toronto:${fmt(sh, sm)}`, `DTEND;TZID=America/Toronto:${fmt(eh, em)}`,
    `SUMMARY:${esc(title)}`, `LOCATION:${esc(b.address)}`, `DESCRIPTION:${esc(`Réf. ${b.ref} · ${BIZ.phoneDisplay}`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
