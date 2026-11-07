import { TZDate } from "@date-fns/tz";
import type { DayHours, Settings, Weekday } from "@/lib/settings/types";

export const TIMEZONE = "America/Toronto";

export interface OpenStatus {
  open: boolean;
  /** "HH:mm" of the next change (closing if open, opening if closed) */
  nextChange: string | null;
  /** Weekday of the next opening when closed and not today */
  nextOpenDay: Weekday | null;
  closedForHoliday: string | null;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function localNow(now = new Date()): TZDate {
  return new TZDate(now, TIMEZONE);
}

export function isoDay(d: TZDate): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function hoursFor(settings: Pick<Settings, "hours" | "closures">, day: TZDate): DayHours & { closure: string | null } {
  const closure = settings.closures.find((c) => c.day === isoDay(day));
  if (closure) return { open: null, close: null, closure: closure.reason };
  const h = settings.hours[day.getDay() as Weekday];
  return { ...h, closure: null };
}

export function openStatus(settings: Pick<Settings, "hours" | "closures">, now = new Date()): OpenStatus {
  const local = localNow(now);
  const today = hoursFor(settings, local);
  const minutes = local.getHours() * 60 + local.getMinutes();
  if (today.open && today.close && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { open: true, nextChange: today.close, nextOpenDay: null, closedForHoliday: null };
  }
  if (today.open && minutes < toMinutes(today.open)) {
    return { open: false, nextChange: today.open, nextOpenDay: local.getDay() as Weekday, closedForHoliday: today.closure };
  }
  for (let i = 1; i <= 7; i++) {
    const d = new TZDate(local.getFullYear(), local.getMonth(), local.getDate() + i, TIMEZONE);
    const h = hoursFor(settings, d);
    if (h.open) return { open: false, nextChange: h.open, nextOpenDay: d.getDay() as Weekday, closedForHoliday: today.closure };
  }
  return { open: false, nextChange: null, nextOpenDay: null, closedForHoliday: today.closure };
}
