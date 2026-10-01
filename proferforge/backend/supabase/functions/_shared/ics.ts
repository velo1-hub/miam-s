// Minimal RFC 5545 calendar invite for a booked visit.
const icsDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => line.match(/.{1,73}/g)!.join("\r\n ");

export function buildIcs(o: { uid: string; start: string; end: string; summary: string; location?: string; description?: string; now?: string }): string {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pro Fer Forge//Assistant//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${o.uid}@proferforge.ca`, `DTSTAMP:${icsDate(o.now ?? new Date().toISOString())}`,
    `DTSTART:${icsDate(o.start)}`, `DTEND:${icsDate(o.end)}`, `SUMMARY:${icsText(o.summary)}`,
    ...(o.location ? [`LOCATION:${icsText(o.location)}`] : []), ...(o.description ? [`DESCRIPTION:${icsText(o.description)}`] : []),
    "END:VEVENT", "END:VCALENDAR",
  ].map(fold).join("\r\n") + "\r\n";
}
