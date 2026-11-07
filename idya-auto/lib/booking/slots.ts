import { TZDate } from "@date-fns/tz";
import { hoursFor, isoDay, localNow, TIMEZONE } from "@/lib/hours/status";
import type { Settings } from "@/lib/settings/types";

export interface Slot {
  /** ISO 8601 instant */
  startsAt: string;
  /** "HH:mm" local label */
  label: string;
  remaining: number;
}

export interface DaySlots {
  day: string; // YYYY-MM-DD
  weekday: number;
  slots: Slot[];
}

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * 30-minute slots over the next N days from dealership hours, excluding closures, past slots and
 * anything less than minLeadHours away. Capacity per slot is reduced by existing bookings. Brief §12.
 * The last slot starts slotMinutes before closing.
 */
export function generateSlots(
  settings: Pick<Settings, "hours" | "closures" | "booking">,
  existing: { startsAt: string }[],
  now = new Date(),
): DaySlots[] {
  const { slotMinutes, capacityPerSlot, minLeadHours, horizonDays } = settings.booking;
  const local = localNow(now);
  const earliest = now.getTime() + minLeadHours * 3_600_000;
  const taken = new Map<string, number>();
  for (const b of existing) {
    const key = new Date(b.startsAt).toISOString();
    taken.set(key, (taken.get(key) ?? 0) + 1);
  }

  const days: DaySlots[] = [];
  for (let i = 0; i < horizonDays; i++) {
    const day = new TZDate(local.getFullYear(), local.getMonth(), local.getDate() + i, TIMEZONE);
    const h = hoursFor(settings, day);
    const slots: Slot[] = [];
    if (h.open && h.close) {
      for (let m = minutesOf(h.open); m + slotMinutes <= minutesOf(h.close); m += slotMinutes) {
        const start = new TZDate(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60, TIMEZONE);
        if (start.getTime() < earliest) continue;
        const iso = new Date(start.getTime()).toISOString();
        const remaining = capacityPerSlot - (taken.get(iso) ?? 0);
        slots.push({
          startsAt: iso,
          label: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
          remaining: Math.max(0, remaining),
        });
      }
    }
    days.push({ day: isoDay(day), weekday: day.getDay(), slots });
  }
  return days;
}
