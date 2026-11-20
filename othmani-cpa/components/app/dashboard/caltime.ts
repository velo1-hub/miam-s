/**
 * Outils de calendrier, sans dépendance : tout est calculé à l'heure de Montréal.
 * Un jour est une chaîne « AAAA-MM-JJ », un mois « AAAA-MM », une heure un nombre de minutes depuis minuit (heure affichée à Montréal).
 * Les instants enregistrés sont des dates ISO (UTC). Les essais sont dans caltime.test.mjs.
 */
export const TZ = "America/Montreal";
const DAY_MS = 86400000;
const partsFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
const pad = (n: number) => String(n).padStart(2, "0");

/** Jour et minute affichés à Montréal pour un instant donné. */
export function mtlParts(at: number | string | Date): { day: string; min: number } {
  const p = partsFmt.formatToParts(new Date(at));
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { day: `${v("year")}-${v("month")}-${v("day")}`, min: Number(v("hour")) * 60 + Number(v("minute")) };
}
/** Heure de Montréal lue comme si elle était en UTC : sert à mesurer le décalage. */
const wallAsUtc = (ms: number) => { const p = mtlParts(ms); return Date.parse(`${p.day}T00:00:00Z`) + p.min * 60000; };

/**
 * Instant ISO d'un jour et d'une minute de Montréal. Deux passes : la seconde corrige le décalage près d'un changement d'heure.
 * Une heure qui n'existe pas (nuit du passage à l'heure avancée) est reportée d'une heure ; une heure double (retour à l'heure normale) donne la première.
 */
export function mtlISO(day: string, min: number): string | null {
  const wall = Date.parse(`${day}T00:00:00Z`) + min * 60000;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(wall)) return null;
  const first = wall - (wallAsUtc(wall) - wall);
  const second = wall - (wallAsUtc(first) - first);
  // Si aucune des deux passes ne retombe sur l'heure demandée, cette heure n'existe pas : on prend l'instant le plus tardif.
  let t = wallAsUtc(second) === wall ? second : wallAsUtc(first) === wall ? first : Math.max(first, second);
  // Heure double : les deux instants donnent la même heure affichée ; on garde le premier.
  if (wallAsUtc(t - 3600000) === wall) t -= 3600000;
  return new Date(t).toISOString();
}
/** « 09:30 » → 570. */
export const minOf = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN; };
export const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
/** Heure à la française : « 9 h », « 14 h 30 ». */
export const fmtMin = (min: number) => `${Math.floor(min / 60)} h${min % 60 ? ` ${pad(min % 60)}` : ""}`;
/** Durée en mots : « 30 min », « 1 h », « 1 h 30 ». */
export const fmtDuration = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${pad(min % 60)}` : ""}`);

const dayMs = (day: string) => Date.parse(`${day}T00:00:00Z`);
export const shiftDay = (day: string, n: number) => new Date(dayMs(day) + n * DAY_MS).toISOString().slice(0, 10);
/** Jour de la semaine : 0 = dimanche … 6 = samedi. */
export const weekday = (day: string) => new Date(dayMs(day)).getUTCDay();
export const shiftMonth = (month: string, n: number) => { const [y, m] = month.split("-").map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
export const daysInMonth = (month: string) => { const [y, m] = month.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
/** Même quantième dans un autre mois, ramené au dernier jour si le mois est plus court (31 janvier → 28 février). */
export function sameDayInMonth(day: string, n: number): string {
  const month = shiftMonth(day.slice(0, 7), n);
  return `${month}-${pad(Math.min(Number(day.slice(8)), daysInMonth(month)))}`;
}
/** Semaines complètes d'un mois, du lundi au dimanche, avec les jours des mois voisins qui complètent la grille. */
export function monthWeeks(month: string): string[][] {
  const first = `${month}-01`;
  const start = shiftDay(first, -((weekday(first) + 6) % 7));
  const last = `${month}-${pad(daysInMonth(month))}`;
  const weeks: string[][] = [];
  for (let d = start; d <= last; d = shiftDay(d, 7)) weeks.push(Array.from({ length: 7 }, (_, i) => shiftDay(d, i)));
  return weeks;
}

export type Span = { id: string; start: number; end: number };
/** Plages libres entre `open` et `close` (en minutes), une fois les rendez-vous retirés. */
export function freeRanges(busy: Pick<Span, "start" | "end">[], open: number, close: number): [number, number][] {
  const out: [number, number][] = [];
  let at = open;
  for (const b of [...busy].sort((x, y) => x.start - y.start)) {
    if (b.end <= at || b.start >= close) continue;
    if (b.start > at) out.push([at, Math.min(b.start, close)]);
    at = Math.max(at, b.end);
  }
  if (at < close) out.push([at, close]);
  return out;
}
/**
 * Disposition des rendez-vous d'une même colonne : ceux qui se chevauchent sont placés côte à côte.
 * `lane` : rang dans le groupe ; `lanes` : largeur du groupe ; `clash` : vrai si le rendez-vous en chevauche un autre.
 */
export function layout(spans: Span[]): Map<string, { lane: number; lanes: number; clash: boolean }> {
  const out = new Map<string, { lane: number; lanes: number; clash: boolean }>();
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  let group: Span[] = [], ends: number[] = [], groupEnd = -Infinity;
  const flush = () => { for (const s of group) { const o = out.get(s.id)!; o.lanes = ends.length; o.clash = group.length > 1; } group = []; ends = []; };
  for (const s of sorted) {
    if (s.start >= groupEnd) flush();
    let lane = ends.findIndex((e) => e <= s.start);
    if (lane < 0) lane = ends.length;
    ends[lane] = s.end;
    out.set(s.id, { lane, lanes: 1, clash: false });
    group.push(s);
    groupEnd = Math.max(groupEnd, s.end);
  }
  flush();
  return out;
}
/** Rendez-vous qui chevauchent la plage donnée. */
export const clashes = <T extends Pick<Span, "start" | "end">>(list: T[], start: number, end: number) => list.filter((s) => s.start < end && start < s.end);
