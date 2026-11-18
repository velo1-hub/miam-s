import type { DB } from "./db/types";

export type SlotKind = "cleaning" | "walkthrough";
export interface Slot { date: string; start: string; end: string; kind: SlotKind; remaining: number }

export const SCHEDULE = {
  timezone: "America/Toronto",
  minLeadDays: 1,
  horizonDays: 45,
  cleaning: { starts: ["08:00", "10:30", "13:00", "15:30"], durationH: 2.5, teams: 3, sundayTeams: 1 },
  walkthrough: { starts: ["09:00", "11:00", "14:00", "16:00", "18:00"], durationH: 0.5, perSlot: 1, weekdaysOnly: true },
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

export function isBookableDate(iso: string, kind: SlotKind) {
  if (!isValidISODate(iso)) return false;
  const today = todayISO(); const min = addDays(today, SCHEDULE.minLeadDays); const max = addDays(today, SCHEDULE.horizonDays);
  if (iso < min || iso > max) return false;
  const dow = dayOfWeek(iso);
  if (kind === "walkthrough" && (dow === 0 || dow === 6)) return false;
  return true;
}

export async function getSlots(db: DB, date: string, kind: SlotKind): Promise<Slot[]> {
  if (!isBookableDate(date, kind)) return [];
  const booked = await db.listBookings({ from: date, to: date });
  const cfg = SCHEDULE[kind];
  const capacity = kind === "cleaning" ? (dayOfWeek(date) === 0 ? SCHEDULE.cleaning.sundayTeams : SCHEDULE.cleaning.teams) : SCHEDULE.walkthrough.perSlot;
  return cfg.starts.map((start) => {
    const used = booked.filter((b) => b.status === "confirmed" && b.kind === kind && b.slot_start === start).length;
    return { date, start, end: addMinutes(start, cfg.durationH * 60), kind, remaining: Math.max(0, capacity - used) };
  });
}

export async function nextAvailableDays(db: DB, kind: SlotKind, count = 7, fromDate?: string) {
  const out: { date: string; slots: Slot[] }[] = [];
  let d = fromDate && isValidISODate(fromDate) ? fromDate : addDays(todayISO(), SCHEDULE.minLeadDays);
  for (let i = 0; i < SCHEDULE.horizonDays && out.length < count; i++, d = addDays(d, 1)) {
    const slots = await getSlots(db, d, kind);
    if (slots.some((s) => s.remaining > 0)) out.push({ date: d, slots: slots.filter((s) => s.remaining > 0) });
  }
  return out;
}

export function makeRef() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "GNM-";
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}
