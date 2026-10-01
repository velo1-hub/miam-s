// Visit slots from the owner's availability rules, in the business time zone (America/Montreal).
export type Rule = { weekday: number; start_time: string; end_time: string; active?: boolean };
export type Slot = { id: string; start: string; end: string; label_fr: string; label_en: string };

/** Offset (ms) of `tz` at instant `t`: local wall-clock minus UTC. */
function tzOffset(t: number, tz: string): number {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(new Date(t)).filter((x) => x.type !== "literal").map((x) => [x.type, +x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
}
/** UTC instant for a wall-clock time in `tz` (DST-safe). */
export function zonedInstant(y: number, mo: number, d: number, h: number, mi: number, tz: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - tzOffset(guess, tz);
  return guess - tzOffset(first, tz);
}
function localYMD(t: number, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
    .formatToParts(new Date(t)).filter((x) => x.type !== "literal").map((x) => [x.type, x.value]));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { y: +p.year, m: +p.month, d: +p.day, wd, iso: `${p.year}-${p.month}-${p.day}` };
}
const hm = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + (m || 0); };

export function labelSlot(t: number, tz: string) {
  const d = new Date(t);
  const fr = new Intl.DateTimeFormat("fr-CA", { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  const en = new Intl.DateTimeFormat("en-CA", { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(d);
  return { fr, en };
}

export function availableSlots(o: {
  now: number; rules: Rule[]; blackouts?: string[]; booked?: string[]; tz?: string;
  visitMinutes?: number; leadHours?: number; horizonDays?: number; maxSlots?: number; maxPerDay?: number;
}): Slot[] {
  const tz = o.tz ?? "America/Montreal", len = o.visitMinutes ?? 60, earliest = o.now + (o.leadHours ?? 24) * 3600e3;
  const booked = new Set((o.booked ?? []).map((s) => new Date(s).getTime()));
  const black = new Set(o.blackouts ?? []);
  const out: Slot[] = [];
  for (let i = 0; i <= (o.horizonDays ?? 21) && out.length < (o.maxSlots ?? 9); i++) {
    const day = localYMD(o.now + i * 86400e3, tz);
    if (black.has(day.iso)) continue;
    let perDay = 0;
    for (const r of o.rules.filter((r) => r.active !== false && r.weekday === day.wd).sort((a, b) => hm(a.start_time) - hm(b.start_time))) {
      for (let m = hm(r.start_time); m + len <= hm(r.end_time); m += len) {
        const t = zonedInstant(day.y, day.m, day.d, Math.floor(m / 60), m % 60, tz);
        if (t < earliest || booked.has(t)) continue;
        if (perDay >= (o.maxPerDay ?? 3) || out.length >= (o.maxSlots ?? 9)) break;
        const l = labelSlot(t, tz);
        out.push({ id: new Date(t).toISOString(), start: new Date(t).toISOString(), end: new Date(t + len * 60e3).toISOString(), label_fr: l.fr, label_en: l.en });
        perDay++;
      }
    }
  }
  return out;
}
