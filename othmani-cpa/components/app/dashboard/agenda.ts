/**
 * Rendez-vous : la même logique sert au calendrier et à la carte « Rendez-vous » d'un dossier.
 * Un rendez-vous confirmé a une date et une heure (instant ISO, saisi à l'heure de Montréal), un responsable et une durée.
 */
import { supabase } from "@/lib/supabase";
import { OFFICE_HOURS, save, type Appointment } from "../shared";
import { fmtMin, mtlISO, mtlParts, weekday } from "./caltime";

export const MODE_LABEL: Record<string, string> = { bureau: "Au bureau", telephone: "Par téléphone", video: "En visioconférence" };
export const MODES = ["bureau", "telephone", "video"] as const;
export const PART_LABEL: Record<string, string> = { matin: "le matin", apres_midi: "l'après-midi", indifferent: "peu importe le moment" };
/** Durées proposées, en minutes. La base accepte de 15 à 240 minutes. */
export const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240] as const;
export const durationOf = (a: Pick<Appointment, "duration_min">) => Math.min(240, Math.max(15, Math.round(Number(a.duration_min) || 30)));
export const OPEN_MIN = OFFICE_HOURS.open * 60;
export const CLOSE_MIN = OFFICE_HOURS.close * 60;
export const isOpenDay = (day: string) => (OFFICE_HOURS.days as readonly number[]).includes(weekday(day));
/** Vrai si la plage tient entièrement dans les heures d'ouverture du cabinet. */
export const inOfficeHours = (day: string, start: number, duration: number) => isOpenDay(day) && start >= OPEN_MIN && start + duration <= CLOSE_MIN;
export const OFF_HOURS_CONFIRM = "Hors des heures d'ouverture. Continuer ?";

const longDay = new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
/** « vendredi 20 novembre » ; avec l'année si `year`. */
export const dayText = (day: string, year = false) => (year ? fullDay : longDay).format(new Date(`${day}T00:00:00Z`));
/** « vendredi 20 novembre à 10 h » pour un instant enregistré. */
export const whenText = (iso: string) => { const p = mtlParts(iso); return `${dayText(p.day)} à ${fmtMin(p.min)}`; };

export type Booking = { day: string; min: number; assignee: string; duration: number; note: string };
/** Champs enregistrés quand le cabinet fixe un rendez-vous. Rien si la date ou l'heure ne sont pas valides. */
export function bookingPatch(b: Booking): Pick<Appointment, "status" | "confirmed_at" | "assignee" | "duration_min" | "staff_note"> | null {
  const at = Number.isFinite(b.min) ? mtlISO(b.day, b.min) : null;
  if (!at) return null;
  return { status: "confirme", confirmed_at: at, assignee: b.assignee.trim().slice(0, 200), duration_min: durationOf({ duration_min: b.duration }), staff_note: b.note.trim().slice(0, 300) };
}
/** Champs enregistrés quand un rendez-vous ou une demande est annulé. */
export const cancelPatch = (a: Appointment, note = ""): Partial<Appointment> => ({ status: "annule", confirmed_at: null, staff_note: note.trim().slice(0, 300) || a.staff_note });

export type SetAppointments = (f: (list: Appointment[]) => Appointment[]) => void;
/**
 * Modifie un rendez-vous : l'écran change tout de suite, revient en arrière si l'enregistrement échoue,
 * et « Annuler » rétablit tous les champs touchés (date, responsable, durée, note, état).
 */
export function patchAppointment(set: SetAppointments, a: Appointment, p: Partial<Appointment>, ok: string, undone?: string): Promise<boolean> {
  // Un rendez-vous chargé avant l'ajout du responsable et de la durée reprend les valeurs par défaut de la base.
  const blank: Partial<Record<keyof Appointment, unknown>> = { assignee: "", duration_min: 30, staff_note: "" };
  const back = Object.fromEntries(Object.keys(p).map((k) => [k, a[k as keyof Appointment] ?? blank[k as keyof Appointment] ?? null])) as Partial<Appointment>;
  const apply = (v: Partial<Appointment>) => set((l) => l.map((x) => (x.id === a.id ? { ...x, ...v } : x)));
  apply(p);
  return save(supabase().from("appointment_requests").update(p).eq("id", a.id), { ok, undo: undone ? () => { void patchAppointment(set, { ...a, ...p }, back, undone); } : undefined, rollback: () => apply(back) });
}
/** Crée un rendez-vous confirmé sans demande du client. « Annuler » le retire. */
export function addAppointment(set: SetAppointments, row: Appointment, ok: string): Promise<boolean> {
  const drop = () => set((l) => l.filter((x) => x.id !== row.id));
  set((l) => [...l, row]);
  const { created_at: _local, ...payload } = row;
  void _local;
  return save(supabase().from("appointment_requests").insert(payload), {
    ok, rollback: drop,
    undo: () => { drop(); void save(supabase().from("appointment_requests").delete().eq("id", row.id), { ok: "Rendez-vous retiré.", rollback: () => set((l) => [...l, row]) }); },
  });
}

/** État du calendrier, gardé par le tableau de bord : on retrouve le même jour en revenant d'un dossier. */
export type CalUi = { view: "mois" | "jour"; day: string; request: string | null };
export type OpenCalendar = (day: string, requestId?: string | null) => void;
