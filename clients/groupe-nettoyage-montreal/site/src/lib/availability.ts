import type { DB } from "./db/types";

/** The only thing booked online is the free 20-minute walkthrough, on weekdays. */
export type SlotKind = "walkthrough";
export interface Slot { date: string; start: string; end: string; kind: SlotKind; remaining: number }

export const SCHEDULE = {
  timezone: "America/Toronto",
  minLeadDays: 1,
  horizonDays: 45,
  walkthrough: { starts: ["09:00", "11:00", "14:00", "16:00", "18:00"], durationH: 0.5, perSlot: 1 },
};

export function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(":").map(Number); const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
export function todayISO(tz = SCHEDULE.timezone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export function dayOfWeek(iso: string) { return new Date(`${iso}T12:00:00Z`).getUTCDay(); } // 0 = Sunday
export const isValidISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

export function isBookableDate(iso: string) {
  if (!isValidISODate(iso)) return false;
  const today = todayISO(); const min = addDays(today, SCHEDULE.minLeadDays); const max = addDays(today, SCHEDULE.horizonDays);
  if (iso < min || iso > max) return false;
  const dow = dayOfWeek(iso);
  return dow !== 0 && dow !== 6;
}

export async function getSlots(db: DB, date: string): Promise<Slot[]> {
  if (!isBookableDate(date)) return [];
  const booked = await db.listBookings({ from: date, to: date });
  const cfg = SCHEDULE.walkthrough;
  return cfg.starts.map((start) => {
    const used = booked.filter((b) => b.status === "confirmed" && b.slot_start === start).length;
    return { date, start, end: addMinutes(start, cfg.durationH * 60), kind: "walkthrough", remaining: Math.max(0, cfg.perSlot - used) };
  });
}

export async function nextAvailableDays(db: DB, count = 7, fromDate?: string) {
  const out: { date: string; slots: Slot[] }[] = [];
  let d = fromDate && isValidISODate(fromDate) ? fromDate : addDays(todayISO(), SCHEDULE.minLeadDays);
  for (let i = 0; i < SCHEDULE.horizonDays && out.length < count; i++, d = addDays(d, 1)) {
    const slots = await getSlots(db, d);
    if (slots.some((s) => s.remaining > 0)) out.push({ date: d, slots: slots.filter((s) => s.remaining > 0) });
  }
  return out;
}

export function makeRef() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "GNM-";
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}
