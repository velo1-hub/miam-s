"use client";
/**
 * Calendrier du cabinet : le mois en grille, puis la journée heure par heure avec une colonne par membre de l'équipe.
 * Les heures sont toujours celles de Montréal ; les rendez-vous sont enregistrés comme des instants ISO.
 */
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type Dispatch, type KeyboardEvent, type ReactNode, type SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import { OFFICE_HOURS, fmtDate, type Appointment, type Dossier } from "../shared";
import { Dialog, Eyebrow, box, link, newId, norm, plural, removeBtn, rows, smallBtn, todayISO, useLoad, type OpenDossier, type Store, type Task } from "./common";
import { CLOSE_MIN, DURATIONS, MODES, MODE_LABEL, OFF_HOURS_CONFIRM, OPEN_MIN, PART_LABEL, addAppointment, bookingPatch, cancelPatch, dayText, durationOf, inOfficeHours, isOpenDay, patchAppointment, whenText, type CalUi, type SetAppointments } from "./agenda";
import { clashes, fmtDuration, fmtMin, freeRanges, layout, monthWeeks, mtlParts, sameDayInMonth, shiftDay, shiftMonth } from "./caltime";

/* ───────────── Données du calendrier ───────────── */
/** Rendez-vous confirmé, placé dans la journée : `start` et `end` en minutes, à l'heure de Montréal. */
type Ev = { id: string; a: Appointment; d: Dossier; day: string; start: number; end: number; who: string };
type DayData = { evs: Ev[]; dues: Dossier[]; tasks: Task[]; wishes: Appointment[] };
const NO_DAY: DayData = { evs: [], dues: [], tasks: [], wishes: [] };

/** Couleurs des membres de l'équipe, dans l'ordre de la liste. Le texte foncé reste lisible sur le fond clair (contraste AA). */
const TONES = [
  { bg: "#dbe9ff", bar: "#2f5fb3", ink: "#16305f" },
  { bg: "#dff3e6", bar: "#2e7d46", ink: "#174326" },
  { bg: "#fde6d2", bar: "#b85c14", ink: "#5e2f08" },
  { bg: "#ece6ff", bar: "#6a4fc4", ink: "#33246e" },
  { bg: "#fbe3ee", bar: "#b03a72", ink: "#5e1a3a" },
  { bg: "#d9f2f2", bar: "#1f7f86", ink: "#0f4347" },
] as const;
const NEUTRAL = { bg: "#eef0f6", bar: "#6b6f8a", ink: "#1b1d33" };
const NOBODY = "Non attribué";
const WEEKDAYS = [["lun.", "lundi"], ["mar.", "mardi"], ["mer.", "mercredi"], ["jeu.", "jeudi"], ["ven.", "vendredi"], ["sam.", "samedi"], ["dim.", "dimanche"]] as const;
const HATCH = "repeating-linear-gradient(135deg, #e3e6ef 0 6px, #f6f7fb 6px 12px)";
const monthFmt = new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric", timeZone: "UTC" });
const monthTitle = (month: string) => monthFmt.format(new Date(`${month}-01T00:00:00Z`));
const HOURS_TEXT = `${fmtMin(OPEN_MIN)} à ${fmtMin(CLOSE_MIN)}, du lundi au vendredi`;
const SLOT = OFFICE_HOURS.slotMin;
/** Hauteur d'un créneau : assez grande pour être touchée du doigt. */
const ROW = 44;
const PX = ROW / SLOT;
const iconBtn = "btn-secondary min-h-11 min-w-11 px-3 py-2 text-sm";
const warnBox = "rounded-xl bg-[#fff4e5] px-3.5 py-2.5 text-sm text-[#6b3d00]";

/** « a, b et c ». */
const listText = (l: string[]) => (l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} et ${l[l.length - 1]}`);
const wishText = (a: Appointment) => (a.wished_date ? `Souhaite le ${dayText(a.wished_date)}${a.wished_part && a.wished_part !== "indifferent" ? `, ${PART_LABEL[a.wished_part]}` : ""}` : a.wished_part && a.wished_part !== "indifferent" ? `Souhaite ${PART_LABEL[a.wished_part]}` : "Aucune date souhaitée");

function useAgenda(store: Store) {
  // Si les rendez-vous ne se chargent pas, les échéances et les tâches restent affichées, avec un avis.
  const load = useLoad(async () => {
    try { return { list: await rows<Appointment>(supabase().from("appointment_requests").select("*").neq("status", "annule").order("created_at", { ascending: false }).limit(1000)), failed: false }; }
    catch { return { list: [] as Appointment[], failed: true }; }
  });
  const { set } = load;
  const setList: SetAppointments = useMemo(() => (f) => set((s) => (s ? { ...s, list: f(s.list) } : s)), [set]);
  const list = load.data?.list;
  const data = useMemo(() => {
    const byId = new Map(store.dossiers.map((d) => [d.id, d]));
    const days = new Map<string, DayData>();
    const at = (day: string) => { let x = days.get(day); if (!x) days.set(day, (x = { evs: [], dues: [], tasks: [], wishes: [] })); return x; };
    const pending: { a: Appointment; d: Dossier }[] = [];
    for (const a of list ?? []) {
      const d = byId.get(a.dossier_id);
      if (!d) continue;
      if (a.status === "confirme" && a.confirmed_at) {
        const p = mtlParts(a.confirmed_at);
        at(p.day).evs.push({ id: a.id, a, d, day: p.day, start: p.min, end: p.min + durationOf(a), who: (a.assignee ?? "").trim() });
      } else if (a.status === "demande") {
        pending.push({ a, d });
        if (a.wished_date) at(a.wished_date).wishes.push(a);
      }
    }
    for (const d of store.dossiers) if (d.status !== "ferme" && d.due_date) at(d.due_date).dues.push(d);
    for (const t of store.tasks) if (!t.done && t.due_date && byId.has(t.dossier_id)) at(t.due_date).tasks.push(t);
    for (const x of days.values()) x.evs.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
    pending.sort((x, y) => x.a.created_at.localeCompare(y.a.created_at));
    return { byId, days, pending };
  }, [list, store.dossiers, store.tasks]);
  return { load, setList, ...data };
}
type Agenda = ReturnType<typeof useAgenda>;

/* ───────────── Calendrier ───────────── */
export function Calendar({ store, ui, setUi, openDossier }: { store: Store; ui: CalUi; setUi: Dispatch<SetStateAction<CalUi>>; openDossier: OpenDossier }) {
  const agenda = useAgenda(store);
  const tone = (who: string) => { const i = store.team.indexOf(who); return i < 0 ? NEUTRAL : TONES[i % TONES.length]; };
  const pick = (a: Appointment) => {
    const today = todayISO();
    setUi({ view: "jour", day: a.wished_date && a.wished_date >= today ? a.wished_date : today, request: a.id });
  };
  const failed = agenda.load.data?.failed;
  const ready = agenda.load.data !== null;
  // En revenant de la journée, le focus retourne sur le jour dans la grille.
  const cameFromDay = useRef(false);
  useEffect(() => { cameFromDay.current = ui.view === "jour"; }, [ui.view]);
  const pendingPanel = <Pending agenda={agenda} ready={ready} current={ui.request} onPick={pick} />;
  return (
    <div>
      {failed && <p role="alert" className={`mb-3 ${warnBox}`}>Les rendez-vous n'ont pas pu être chargés. Les échéances et les tâches restent affichées. <button type="button" className="font-semibold underline underline-offset-4" onClick={() => agenda.load.reload()}>Réessayer</button></p>}
      {ui.view === "mois"
        ? <Month focusCell={cameFromDay.current} store={store} agenda={agenda} ui={ui} setUi={setUi} tone={tone} openDossier={openDossier} onPick={pick} side={pendingPanel} />
        : <Day store={store} agenda={agenda} ui={ui} setUi={setUi} tone={tone} openDossier={openDossier} side={pendingPanel} />}
      <p className="mt-4 text-xs text-muted">Heures affichées : heure de Montréal. Ouverture du cabinet : {HOURS_TEXT}. Les jours fériés ne sont pas pris en compte. Aucun calendrier externe n'est relié.</p>
    </div>
  );
}

/* ───────────── Demandes à placer ───────────── */
function Pending({ agenda, ready, current, onPick }: { agenda: Agenda; ready: boolean; current: string | null; onPick: (a: Appointment) => void }) {
  return (
    <section aria-labelledby="cal-pending" className={box}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Eyebrow><span id="cal-pending">Demandes à placer</span></Eyebrow>
        {agenda.pending.length > 0 && <span className="rounded-full bg-[#fff4e5] px-2.5 py-1 text-xs font-semibold text-[#6b3d00]">{agenda.pending.length}</span>}
      </div>
      {!ready ? <p className="text-sm text-muted">Chargement des demandes…</p> : agenda.pending.length === 0 ? <p className="text-sm text-muted">Aucune demande de rendez-vous en attente.</p> : (
        <ul className="space-y-3">
          {agenda.pending.map(({ a, d }) => (
            <li key={a.id} data-request={a.id} className={`rounded-xl border p-3 ${a.id === current ? "border-navy bg-sky-50" : "border-line"}`}>
              <p className="font-semibold text-ink">{d.client_name}</p>
              <p className="text-sm text-muted">{d.title} · {MODE_LABEL[a.mode] ?? a.mode}</p>
              {a.preference && <p className="mt-1 text-sm text-ink/80">« {a.preference} »</p>}
              <p className="mt-1 text-sm text-ink/80">{wishText(a)}</p>
              <p className="text-xs text-muted">Demandé le {fmtDate(a.created_at, "fr")}</p>
              <button type="button" onClick={() => onPick(a)} aria-label={`Choisir un moment pour ${d.client_name}`} className={`${smallBtn} mt-2`}>{a.id === current ? "Moment à choisir dans la journée" : "Choisir un moment"}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Legend({ team, tone, extra = false }: { team: string[]; tone: (who: string) => { bg: string; bar: string }; extra?: boolean }) {
  const sw = "inline-block h-3.5 w-3.5 shrink-0 rounded-[4px] border";
  return (
    <ul aria-label="Légende" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink">
      {team.map((n) => <li key={n} className="flex items-center gap-1.5"><span aria-hidden="true" className={sw} style={{ background: tone(n).bg, borderColor: tone(n).bar, borderLeftWidth: 4 }} />{n}</li>)}
      {extra && <>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className={`${sw} rotate-45 !rounded-[2px] border-navy bg-[#e9e8f7]`} />Échéance d'un dossier</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className={`${sw} border-[#6b6f8a] bg-[#eef0f6]`} />Tâche datée</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className={`${sw} !rounded-full border-[#b45309] bg-[#fff4e5]`} />Date souhaitée par un client</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className={`${sw} border-line`} style={{ background: HATCH }} />Bureau fermé</li>
      </>}
    </ul>
  );
}

/* ───────────── Mois ───────────── */
type ViewProps = { store: Store; agenda: Agenda; ui: CalUi; setUi: Dispatch<SetStateAction<CalUi>>; tone: (who: string) => { bg: string; bar: string; ink: string }; openDossier: OpenDossier; side: ReactNode };

function daySummary(x: DayData, day: string, today: string): string {
  const parts = [
    day === today && "aujourd'hui",
    x.evs.length > 0 && `${x.evs.length} rendez-vous`,
    x.dues.length > 0 && plural(x.dues.length, "échéance", "échéances"),
    x.tasks.length > 0 && plural(x.tasks.length, "tâche", "tâches"),
    x.wishes.length > 0 && plural(x.wishes.length, "date souhaitée par un client", "dates souhaitées par des clients"),
    !isOpenDay(day) && "bureau fermé",
  ].filter(Boolean);
  return `${dayText(day, true)}${parts.length ? `, ${parts.join(", ")}` : ", rien de prévu"}`;
}

function Month({ store, agenda, ui, setUi, tone, openDossier, side, onPick, focusCell }: ViewProps & { onPick: (a: Appointment) => void; focusCell: boolean }) {
  const today = todayISO();
  const month = ui.day.slice(0, 7);
  const weeks = useMemo(() => monthWeeks(month), [month]);
  const grid = useRef<HTMLDivElement>(null);
  const refocus = useRef(focusCell);
  const titleId = useId();
  // Après un déplacement au clavier, le focus suit le jour choisi, même s'il est dans un autre mois.
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-day="${ui.day}"]`)?.focus();
  }, [ui.day]);
  const select = (day: string, focus = false) => { refocus.current = focus; setUi((u) => ({ ...u, day })); };
  const open = (day: string) => setUi((u) => ({ ...u, view: "jour", day }));
  const onKey = (e: KeyboardEvent<HTMLDivElement>, day: string) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const col = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
    const to: Record<string, string> = { ArrowLeft: shiftDay(day, -1), ArrowRight: shiftDay(day, 1), ArrowUp: shiftDay(day, -7), ArrowDown: shiftDay(day, 7), Home: shiftDay(day, -col), End: shiftDay(day, 6 - col), PageUp: sameDayInMonth(day, -1), PageDown: sameDayInMonth(day, 1) };
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(day); return; }
    if (!to[e.key]) return;
    e.preventDefault();
    select(to[e.key], true);
  };
  const onClick = (day: string) => {
    // Grand écran : le clic ouvre la journée. Petit écran : il la choisit, son contenu s'affiche sous la grille.
    if (window.matchMedia("(min-width: 640px)").matches) open(day); else select(day);
  };
  const sel = agenda.days.get(ui.day) ?? NO_DAY;
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => select(sameDayInMonth(ui.day, -1))} aria-label="Mois précédent" className={iconBtn}>←</button>
          <button type="button" onClick={() => select(sameDayInMonth(ui.day, 1))} aria-label="Mois suivant" className={iconBtn}>→</button>
          <h2 id={titleId} aria-live="polite" className="min-w-0 flex-1 px-1 font-display text-lg font-semibold text-ink first-letter:uppercase sm:text-2xl">{monthTitle(month)}</h2>
          <button type="button" onClick={() => select(today)} disabled={ui.day === today} className={`${smallBtn} disabled:opacity-60`}>Aujourd'hui</button>
        </div>
        <div ref={grid} role="grid" aria-labelledby={titleId} aria-describedby={`${titleId}-aide`} className="overflow-hidden rounded-xl border border-[#d5d9e6] bg-white">
          <div role="row" className="grid grid-cols-7 border-b border-[#d5d9e6] bg-[#f4f5fa]">
            {WEEKDAYS.map(([short, long]) => <div key={long} role="columnheader" aria-label={long} className="px-1 py-2 text-center text-xs font-semibold text-ink first-letter:uppercase sm:px-2 sm:text-left">{short}</div>)}
          </div>
          {weeks.map((week) => (
            <div key={week[0]} role="row" className="grid grid-cols-7 border-b border-[#e6e8f2] last:border-b-0">
              {week.map((day) => {
                const x = agenda.days.get(day) ?? NO_DAY;
                const out = !day.startsWith(month), closed = !isOpenDay(day), isToday = day === today, chosen = day === ui.day;
                const items = [
                  ...x.evs.map((e) => ({ key: e.id, kind: "rdv" as const, text: `${fmtMin(e.start)} ${e.d.client_name}`, who: e.who })),
                  ...x.dues.map((d) => ({ key: `d${d.id}`, kind: "due" as const, text: `Échéance · ${d.client_name}`, who: "" })),
                  ...x.tasks.map((t) => ({ key: `t${t.id}`, kind: "task" as const, text: `Tâche · ${t.label}`, who: "" })),
                ];
                const shown = items.slice(0, items.length > 3 ? 2 : 3);
                return (
                  <div
                    key={day} role="gridcell" data-day={day} tabIndex={chosen ? 0 : -1} aria-selected={chosen} aria-current={isToday ? "date" : undefined} aria-label={daySummary(x, day, today)}
                    onClick={() => onClick(day)} onKeyDown={(e) => onKey(e, day)}
                    style={closed ? { background: HATCH } : undefined}
                    className={`relative min-h-[3.4rem] min-w-0 cursor-pointer border-r border-[#e6e8f2] p-1 last:border-r-0 hover:bg-sky-50 focus-visible:z-10 focus-visible:!rounded-none focus-visible:[outline:3px_solid_#2a2a5c] focus-visible:[outline-offset:-3px] sm:min-h-[7.25rem] sm:p-1.5 ${out && !closed ? "bg-[#f7f8fb]" : ""} ${chosen ? "shadow-[inset_0_0_0_2px_var(--color-navy)]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold sm:text-sm ${isToday ? "bg-navy text-white" : out ? "font-normal text-muted" : closed ? "text-muted" : "text-ink"}`}>{Number(day.slice(8))}</span>
                      {x.wishes.length > 0 && <span data-wishes={x.wishes.length} title="Dates souhaitées par des clients" className="rounded-full border border-[#b45309] bg-[#fff4e5] px-1.5 text-[0.68rem] leading-5 font-semibold text-[#6b3d00]"><span className="sm:hidden">{x.wishes.length}</span><span className="hidden sm:inline">{plural(x.wishes.length, "demande", "demandes")}</span></span>}
                    </div>
                    {/* Grand écran : libellés. Petit écran : points. */}
                    <ul aria-hidden="true" className="mt-1 hidden space-y-0.5 sm:block">
                      {shown.map((it) => (
                        <li key={it.key} data-marker={it.kind} className="truncate rounded-[5px] border-l-[3px] px-1 py-px text-[0.7rem] leading-4 font-medium"
                          style={it.kind === "rdv" ? { background: tone(it.who).bg, borderColor: tone(it.who).bar, color: tone(it.who).ink } : it.kind === "due" ? { background: "#e9e8f7", borderColor: "#2a2a5c", color: "#2a2a5c" } : { background: "#eef0f6", borderColor: "#6b6f8a", color: "#1b1d33" }}>{it.text}</li>
                      ))}
                      {items.length > shown.length && <li data-more className="px-1 text-[0.7rem] leading-4 font-semibold text-muted">+{items.length - shown.length}</li>}
                    </ul>
                    {items.length > 0 && (
                      <div aria-hidden="true" className="mt-1 flex flex-wrap items-center gap-[3px] sm:hidden">
                        {items.slice(0, 4).map((it) => <span key={it.key} className={`h-2 w-2 border ${it.kind === "rdv" ? "rounded-full" : it.kind === "due" ? "rotate-45 rounded-[1px]" : "rounded-[2px]"}`} style={it.kind === "rdv" ? { background: tone(it.who).bar, borderColor: tone(it.who).bar } : it.kind === "due" ? { background: "#2a2a5c", borderColor: "#2a2a5c" } : { background: "#eef0f6", borderColor: "#6b6f8a" }} />)}
                        {items.length > 4 && <span className="text-[0.6rem] leading-none font-semibold text-muted">+{items.length - 4}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <p id={`${titleId}-aide`} className="mt-2 hidden text-xs text-muted sm:block">Cliquez sur un jour pour voir ses heures. Au clavier : les flèches changent de jour, Entrée ouvre la journée, Page préc. et Page suiv. changent de mois.</p>
        <div className="mt-3"><Legend team={store.team} tone={tone} extra /></div>

        <section aria-live="polite" aria-labelledby={`${titleId}-jour`} data-selected-day={ui.day} className={`${box} mt-4`}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 id={`${titleId}-jour`} className="font-display text-lg font-semibold text-ink first-letter:uppercase">{dayText(ui.day)}{ui.day === today && <span className="ml-2 rounded-full bg-navy px-2.5 py-1 align-middle text-xs font-semibold text-white">Aujourd'hui</span>}</h3>
            <button type="button" onClick={() => open(ui.day)} className="btn-primary min-h-11 px-4 py-2 text-sm">Voir la journée, heure par heure</button>
          </div>
          {!isOpenDay(ui.day) && <p className="mb-2 text-sm text-muted">Bureau fermé ce jour-là.</p>}
          {sel.evs.length + sel.dues.length + sel.tasks.length + sel.wishes.length === 0 ? <p className="text-sm text-muted">Rien de prévu ce jour-là.</p> : (
            <ul className="divide-y divide-line">
              {sel.evs.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="rounded-[6px] border-l-4 px-2 py-1 text-xs font-semibold" style={{ background: tone(e.who).bg, borderColor: tone(e.who).bar, color: tone(e.who).ink }}>{fmtMin(e.start)} à {fmtMin(e.end)}</span>
                  <span className="min-w-0 flex-1 basis-48 text-sm"><span className="font-semibold text-ink">{e.d.client_name}</span> <span className="text-muted">· {e.d.title} · {MODE_LABEL[e.a.mode] ?? e.a.mode} · {e.who || NOBODY}</span></span>
                </li>
              ))}
              {sel.dues.map((d) => <li key={d.id} className="py-2 text-sm"><button type="button" onClick={() => openDossier(d.id)} className={`${link} inline-flex min-h-11 items-center text-left`}>Échéance : {d.client_name}, {d.title}</button></li>)}
              {sel.tasks.map((t) => <li key={t.id} className="py-2 text-sm"><button type="button" onClick={() => openDossier(t.dossier_id)} className={`${link} inline-flex min-h-11 items-center text-left`}>Tâche : {t.label}{t.assignee ? ` (${t.assignee})` : ""}</button></li>)}
              {sel.wishes.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-ink">Date souhaitée par {agenda.byId.get(a.dossier_id)?.client_name}{a.wished_part && a.wished_part !== "indifferent" ? `, ${PART_LABEL[a.wished_part]}` : ""}</span>
                  <button type="button" onClick={() => onPick(a)} className={smallBtn}>Choisir un moment</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="min-w-0">{side}</div>
    </div>
  );
}

/* ───────────── Journée ───────────── */
type Panel = { kind: "book"; who: string; min: number } | { kind: "edit"; id: string };

function Day({ store, agenda, ui, setUi, tone, openDossier, side }: ViewProps) {
  const today = todayISO();
  const day = ui.day;
  const x = agenda.days.get(day) ?? NO_DAY;
  const open = isOpenDay(day);
  const [wide, setWide] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => { head.current?.focus(); }, []);
  const go = (d: string) => setUi((u) => ({ ...u, day: d }));

  // Colonnes : l'équipe, puis les responsables qui n'y figurent plus, puis « Non attribué » s'il le faut.
  const cols = useMemo(() => {
    const others = [...new Set(x.evs.map((e) => e.who).filter((w) => w && !store.team.includes(w)))].sort((a, b) => a.localeCompare(b, "fr"));
    const list = [...store.team, ...others];
    return x.evs.some((e) => !e.who) || list.length === 0 ? [...list, ""] : list;
  }, [x.evs, store.team]);
  const firstNames = cols.map((c) => c.split(" ")[0]);
  const short = (c: string, i: number) => (!c ? NOBODY : firstNames.filter((f) => f === firstNames[i]).length > 1 || c.includes("@") ? c : firstNames[i]);

  // La grille couvre les heures d'ouverture, et s'étend d'elle-même pour montrer un rendez-vous pris en dehors.
  const floor = (m: number) => Math.floor(m / 60) * 60, ceil = (m: number) => Math.ceil(m / 60) * 60;
  const from = Math.max(0, Math.min(OPEN_MIN, wide ? 7 * 60 : OPEN_MIN, ...x.evs.map((e) => floor(e.start))));
  const to = Math.min(1440, Math.max(CLOSE_MIN, wide ? 21 * 60 : CLOSE_MIN, ...x.evs.map((e) => ceil(e.end))));
  const slots = Array.from({ length: Math.ceil((to - from) / SLOT) }, (_, i) => from + i * SLOT);
  const height = slots.length * ROW;
  const now = day === today ? mtlParts(Date.now()).min : -1;
  const request = ui.request ? agenda.pending.find((p) => p.a.id === ui.request) ?? null : null;
  const editing = panel?.kind === "edit" ? x.evs.find((e) => e.id === panel.id) ?? [...agenda.days.values()].flatMap((d) => d.evs).find((e) => e.id === panel.id) : undefined;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button type="button" data-back onClick={() => setUi((u) => ({ ...u, view: "mois" }))} className={smallBtn}>← Mois</button>
          <button type="button" onClick={() => go(shiftDay(day, -1))} aria-label="Jour précédent" className={iconBtn}>←</button>
          <button type="button" onClick={() => go(shiftDay(day, 1))} aria-label="Jour suivant" className={iconBtn}>→</button>
          <button type="button" onClick={() => go(today)} disabled={day === today} className={`${smallBtn} disabled:opacity-60`}>Aujourd'hui</button>
        </div>
        <h2 ref={head} tabIndex={-1} aria-live="polite" className="font-display text-xl font-semibold text-ink first-letter:uppercase focus:outline-none sm:text-2xl">
          {dayText(day, true)}
          {day === today && <span className="ml-2 rounded-full bg-navy px-2.5 py-1 align-middle text-xs font-semibold text-white">Aujourd'hui</span>}
          {!open && <span data-closed className="ml-2 rounded-full bg-[#eef0f6] px-2.5 py-1 align-middle text-xs font-semibold text-ink">Bureau fermé</span>}
        </h2>
        {!open && <p className="mt-1 text-sm text-muted">Le cabinet est fermé ce jour-là. Un rendez-vous reste possible après confirmation.</p>}

        {request && (
          <p data-placing className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-navy bg-sky-50 px-3.5 py-2.5 text-sm text-ink">
            <span><strong className="font-semibold">Demande à placer : {request.d.client_name}</strong>, {request.d.title}, {(MODE_LABEL[request.a.mode] ?? request.a.mode).toLowerCase()}. {wishText(request.a)}. Choisissez un créneau libre.</span>
            <button type="button" onClick={() => setUi((u) => ({ ...u, request: null }))} className={`${link} inline-flex min-h-11 items-center px-1`}>Ne plus placer</button>
          </p>
        )}

        <ul aria-label="Disponibilité de l'équipe" className="mt-3 space-y-1 text-sm text-ink">
          {cols.map((c, i) => {
            const mine = x.evs.filter((e) => e.who === c);
            const free = freeRanges(mine, OPEN_MIN, CLOSE_MIN).filter(([a, b]) => b - a >= SLOT);
            const count = mine.length ? `${mine.length} rendez-vous` : "aucun rendez-vous";
            const rest = !open ? "bureau fermé" : !c ? "" : free.length === 0 ? "aucun moment libre" : free.length === 1 && free[0][0] === OPEN_MIN && free[0][1] === CLOSE_MIN ? `libre toute la journée, de ${fmtMin(OPEN_MIN)} à ${fmtMin(CLOSE_MIN)}` : `libre ${listText(free.map(([a, b]) => `de ${fmtMin(a)} à ${fmtMin(b)}`))}`;
            return <li key={c} data-summary={c || NOBODY} className="flex items-baseline gap-2"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tone(c).bar }} /><span><strong className="font-semibold">{short(c, i)}</strong> : {count}{rest ? `, ${rest}` : ""}</span></li>;
          })}
        </ul>

        {(x.dues.length > 0 || x.tasks.length > 0 || x.wishes.length > 0) && (
          <div data-allday className="mt-3 rounded-xl border border-[#d5d9e6] bg-white p-2.5">
            <p className="pf-eyebrow mb-1.5">Toute la journée</p>
            <ul className="flex flex-wrap gap-1.5">
              {x.dues.map((d) => <li key={d.id}><button type="button" onClick={() => openDossier(d.id)} className="min-h-11 rounded-lg border-l-4 border-navy bg-[#e9e8f7] px-2.5 py-1.5 text-left text-sm font-medium text-navy hover:bg-[#dcdaf2]">Échéance · {d.client_name}, {d.title}</button></li>)}
              {x.wishes.map((a) => <li key={a.id}><button type="button" aria-pressed={a.id === ui.request} onClick={() => setUi((u) => ({ ...u, request: a.id }))} className="min-h-11 rounded-lg border-l-4 border-[#b45309] bg-[#fff4e5] px-2.5 py-1.5 text-left text-sm font-medium text-[#6b3d00] hover:bg-[#ffe9c9]">Date souhaitée · {agenda.byId.get(a.dossier_id)?.client_name}{a.wished_part && a.wished_part !== "indifferent" ? `, ${PART_LABEL[a.wished_part]}` : ""}</button></li>)}
              {x.tasks.map((t) => <li key={t.id}><button type="button" onClick={() => openDossier(t.dossier_id)} className="min-h-11 rounded-lg border-l-4 border-[#6b6f8a] bg-[#eef0f6] px-2.5 py-1.5 text-left text-sm font-medium text-ink hover:bg-[#e2e5ee]">Tâche · {t.label}{t.assignee ? ` (${t.assignee})` : ""}</button></li>)}
            </ul>
          </div>
        )}

        {/* La grille défile à l'horizontale dans son propre cadre quand l'équipe est nombreuse. */}
        <div data-daygrid className="mt-3 overflow-x-auto rounded-xl border border-[#d5d9e6] bg-white">
          <div style={{ minWidth: `${3.5 + cols.length * 9.5}rem` }}>
            <div className="sticky top-0 z-[3] flex border-b border-[#d5d9e6] bg-[#f4f5fa]">
              <div className="sticky left-0 z-[2] w-14 shrink-0 bg-[#f4f5fa]" />
              {cols.map((c) => <div key={c} className="min-w-0 flex-1 border-l border-[#e6e8f2] px-2 py-2 text-sm font-semibold text-ink" style={{ boxShadow: `inset 0 3px 0 ${tone(c).bar}` }}><span className="block truncate" title={c || NOBODY}>{c || NOBODY}</span></div>)}
            </div>
            <div className="flex">
              <div aria-hidden="true" className="sticky left-0 z-[2] w-14 shrink-0 border-r border-[#e6e8f2] bg-white" style={{ height }}>
                {slots.filter((s) => s % 60 === 0).map((s) => <span key={s} className="absolute right-1.5 text-xs font-medium text-muted" style={{ top: (s - from) * PX + 2 }}>{fmtMin(s)}</span>)}
              </div>
              {cols.map((c) => {
                const mine = x.evs.filter((e) => e.who === c);
                const lanes = layout(mine);
                const t = tone(c);
                return (
                  <div key={c} role="group" aria-label={`${c || NOBODY}, ${dayText(day)}`} data-col={c || NOBODY} className="relative min-w-0 flex-1 border-l border-[#e6e8f2]" style={{ height }}>
                    {slots.map((s) => {
                      const off = !open || s < OPEN_MIN || s + SLOT > CLOSE_MIN;
                      const busy = clashes(mine, s, s + SLOT).length > 0;
                      const st: CSSProperties = { top: (s - from) * PX, height: ROW, ...(off ? { background: HATCH } : {}) };
                      const line = `absolute inset-x-0 border-t ${s % 60 === 0 ? "border-[#d5d9e6]" : "border-dashed border-[#e6e8f2]"}`;
                      if (busy) return <div key={s} aria-hidden="true" className={line} style={st} />;
                      return (
                        <button key={s} type="button" data-slot={fmtMin(s)} onClick={() => setPanel({ kind: "book", who: c, min: s })} aria-label={`Réserver à ${fmtMin(s)}, ${c || NOBODY}${off ? ", hors des heures d'ouverture" : ""}`}
                          className={`${line} group block w-full cursor-pointer text-left hover:!bg-sky-100 focus-visible:z-[2] focus-visible:!rounded-none focus-visible:!bg-sky-100 focus-visible:[outline:3px_solid_#2a2a5c] focus-visible:[outline-offset:-3px]`} style={st}>
                          <span aria-hidden="true" className="hidden px-2 text-xs font-semibold text-navy group-hover:inline group-focus-visible:inline">+ {fmtMin(s)}</span>
                        </button>
                      );
                    })}
                    {mine.map((e) => {
                      const l = lanes.get(e.id)!;
                      const h = Math.max((e.end - e.start) * PX, 22) - 2;
                      return (
                        <button key={e.id} type="button" data-appt={e.id} data-clash={l.clash || undefined} onClick={() => setPanel({ kind: "edit", id: e.id })}
                          aria-label={`${fmtMin(e.start)} à ${fmtMin(e.end)}, ${e.d.client_name}, ${e.d.title}, ${(MODE_LABEL[e.a.mode] ?? e.a.mode).toLowerCase()}${l.clash ? ", chevauche un autre rendez-vous" : ""}. Modifier.`}
                          className={`absolute z-[1] cursor-pointer overflow-hidden rounded-[7px] border-l-4 px-1.5 py-0.5 text-left text-xs leading-4 hover:brightness-[.97] focus-visible:z-[2] focus-visible:[outline:3px_solid_#2a2a5c] focus-visible:[outline-offset:1px] ${l.clash ? "shadow-[inset_0_0_0_2px_#b45309]" : ""}`}
                          style={{ top: (e.start - from) * PX + 1, height: h, left: `calc(${(l.lane / l.lanes) * 100}% + 2px)`, width: `calc(${100 / l.lanes}% - 4px)`, background: t.bg, borderLeftColor: l.clash ? "#b45309" : t.bar, color: t.ink }}>
                          <span className="block truncate font-semibold">{fmtMin(e.start)} – {fmtMin(e.end)}{h < 40 ? ` · ${e.d.client_name}` : ""}</span>
                          {h >= 40 && <span className="block truncate font-semibold">{e.d.client_name}</span>}
                          {l.clash && h >= 58 && <span className="mt-0.5 inline-block rounded-[4px] bg-[#fff4e5] px-1 font-semibold text-[#6b3d00]">Chevauchement</span>}
                          {h >= 76 && <span className="block truncate">{e.d.title}</span>}
                          {h >= 58 && <span className="block truncate">{MODE_LABEL[e.a.mode] ?? e.a.mode}</span>}
                          {h >= 94 && e.a.staff_note && <span className="block truncate italic">{e.a.staff_note}</span>}
                        </button>
                      );
                    })}
                    {now >= from && now < to && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-[1] border-t-2 border-[#a3261f]" style={{ top: (now - from) * PX }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {x.evs.some((e) => layout(x.evs.filter((o) => o.who === e.who)).get(e.id)?.clash) && <p data-clash-note role="status" className={`mt-2 ${warnBox}`}><strong className="font-semibold">Chevauchement.</strong> Des rendez-vous d'une même personne se recoupent ce jour-là. Ils sont encadrés en orange.</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Legend team={store.team} tone={tone} />
          <button type="button" aria-pressed={wide} onClick={() => setWide((w) => !w)} className={smallBtn}>{wide ? "Revenir aux heures d'ouverture" : "Afficher de 7 h à 21 h"}</button>
        </div>
        <p className="mt-2 text-xs text-muted">Cliquez sur un créneau libre pour réserver, ou sur un rendez-vous pour le déplacer, changer sa durée ou son responsable, ou l'annuler. Les zones hachurées sont hors des heures d'ouverture.</p>
      </div>
      <div className="min-w-0">{side}</div>

      {panel?.kind === "book" && <BookDialog key={`${day}-${panel.who}-${panel.min}`} store={store} agenda={agenda} day={day} who={panel.who} min={panel.min} cols={cols} request={ui.request} onPlaced={() => setUi((u) => ({ ...u, request: null }))} onClose={() => setPanel(null)} />}
      {panel?.kind === "edit" && editing && <EditDialog key={editing.id} store={store} agenda={agenda} ev={editing} onMoved={(d) => go(d)} openDossier={openDossier} onClose={() => setPanel(null)} />}
    </div>
  );
}

/* ───────────── Réserver ───────────── */
/** Heures proposées, par quart d'heure, de 6 h à 22 h ; l'heure déjà choisie y figure toujours. */
function timeOptions(current: number): number[] {
  const list: number[] = [];
  for (let m = 6 * 60; m <= 22 * 60; m += 15) list.push(m);
  return list.includes(current) ? list : [...list, current].sort((a, b) => a - b);
}
/** Avis affichés avant d'enregistrer : chevauchement, hors des heures, moment passé. Rien n'est bloqué. */
function Warnings({ agenda, day, min, duration, who, except }: { agenda: Agenda; day: string; min: number; duration: number; who: string; except?: string }) {
  const hit = clashes((agenda.days.get(day)?.evs ?? []).filter((e) => e.who === who && e.id !== except), min, min + duration);
  const off = !inOfficeHours(day, min, duration);
  const now = mtlParts(Date.now());
  const past = day < now.day || (day === now.day && min < now.min);
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      {hit.length > 0 && <p data-warn="clash" className={warnBox}><strong className="font-semibold">Chevauchement.</strong> {who || NOBODY} a déjà {hit.map((e) => `${e.d.client_name} de ${fmtMin(e.start)} à ${fmtMin(e.end)}`).join(", ")}.</p>}
      {off && <p data-warn="off" className={warnBox}>Hors des heures d'ouverture ({HOURS_TEXT}).</p>}
      {past && <p data-warn="past" className={warnBox}>Ce moment est déjà passé.</p>}
    </div>
  );
}
function Fields({ id, team, who, setWho, min, setMin, duration, setDuration, note, setNote }: { id: string; team: string[]; who: string; setWho: (v: string) => void; min: number; setMin: (v: number) => void; duration: number; setDuration: (v: number) => void; note: string; setNote: (v: string) => void }) {
  const people = [...new Set([...team, who].filter(Boolean))];
  const durations = (DURATIONS as readonly number[]).includes(duration) ? DURATIONS : [...DURATIONS, duration].sort((a, b) => a - b);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div><label htmlFor={`${id}-who`} className="label">Responsable</label><select id={`${id}-who`} value={who} onChange={(e) => setWho(e.target.value)} className="field min-h-11 py-2"><option value="">{NOBODY}</option>{people.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
      <div><label htmlFor={`${id}-time`} className="label">Heure</label><select id={`${id}-time`} value={min} onChange={(e) => setMin(Number(e.target.value))} className="field min-h-11 py-2">{timeOptions(min).map((m) => <option key={m} value={m}>{fmtMin(m)}</option>)}</select></div>
      <div><label htmlFor={`${id}-dur`} className="label">Durée</label><select id={`${id}-dur`} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="field min-h-11 py-2">{durations.map((m) => <option key={m} value={m}>{fmtDuration(m)}</option>)}</select></div>
      <div className="sm:col-span-3"><label htmlFor={`${id}-note`} className="label">Note au client (facultatif)</label><input id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Ex. Apportez vos relevés bancaires." className="field min-h-11 py-2" /></div>
    </div>
  );
}

function BookDialog({ store, agenda, day, who: who0, min: min0, cols, request, onPlaced, onClose }: { store: Store; agenda: Agenda; day: string; who: string; min: number; cols: string[]; request: string | null; onPlaced: () => void; onClose: () => void }) {
  const id = useId();
  const chosen = request ? agenda.pending.find((p) => p.a.id === request)?.a : undefined;
  const [who, setWho] = useState(who0);
  const [min, setMin] = useState(min0);
  const [duration, setDuration] = useState(chosen ? durationOf(chosen) : 30);
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [mode, setMode] = useState<Appointment["mode"]>("bureau");
  const [err, setErr] = useState("");
  // La demande choisie d'abord, puis celles qui souhaitent ce jour, puis les autres.
  const rank = (a: Appointment) => (a.id === request ? 0 : a.wished_date === day ? 1 : 2);
  const pending = [...agenda.pending].sort((x, y) => rank(x.a) - rank(y.a));
  const n = norm(q.trim());
  const openDossiers = store.dossiers.filter((d) => d.status !== "ferme");
  const found = openDossiers.filter((d) => !n || norm(`${d.client_name} ${d.title} ${d.client_email}`).includes(n)).sort((a, b) => a.client_name.localeCompare(b.client_name, "fr")).slice(0, 8);
  const patch = () => {
    const p = bookingPatch({ day, min, assignee: who, duration, note });
    if (!p) { setErr("Choisissez une heure valide."); return null; }
    if (!inOfficeHours(day, min, duration) && !window.confirm(OFF_HOURS_CONFIRM)) return null;
    return p;
  };
  const place = (a: Appointment, d: Dossier, close: () => void) => {
    const p = patch();
    if (!p) return;
    close();
    onPlaced();
    void patchAppointment(agenda.setList, a, p, `Rendez-vous confirmé : ${d.client_name}, ${whenText(p.confirmed_at!)}.`, "Confirmation annulée. La demande est de nouveau à placer.");
  };
  const create = (close: () => void) => {
    const d = store.dossiers.find((x) => x.id === dossierId);
    if (!d) { setErr("Choisissez d'abord un dossier."); return; }
    const p = patch();
    if (!p) return;
    close();
    void addAppointment(agenda.setList, { id: newId(), dossier_id: d.id, created_at: new Date().toISOString(), preference: "", mode, wished_date: null, wished_part: null, ...p }, `Rendez-vous ajouté : ${d.client_name}, ${whenText(p.confirmed_at!)}.`);
  };
  return (
    <Dialog title="Réserver un moment" onClose={onClose} wide>
      {(close) => (
        <div data-book className="space-y-4">
          <p className="-mt-2 text-sm text-ink first-letter:uppercase">{dayText(day, true)}, de {fmtMin(min)} à {fmtMin(min + duration)}, {who ? `avec ${who}` : "sans responsable"}.</p>
          <Fields id={id} team={[...store.team, ...cols]} who={who} setWho={setWho} min={min} setMin={setMin} duration={duration} setDuration={setDuration} note={note} setNote={setNote} />
          <Warnings agenda={agenda} day={day} min={min} duration={duration} who={who} />

          <section aria-labelledby={`${id}-p`}>
            <h3 id={`${id}-p`} className="pf-eyebrow mb-2">Demandes à placer</h3>
            {pending.length === 0 ? <p className="text-sm text-muted">Aucune demande en attente.</p> : (
              <ul className="space-y-2">
                {pending.map(({ a, d }) => (
                  <li key={a.id} data-request={a.id} className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border p-3 ${a.id === request ? "border-navy bg-sky-50" : "border-line"}`}>
                    <div className="min-w-0 flex-1 basis-56 text-sm">
                      <p className="font-semibold text-ink">{d.client_name}{a.id === request && <span className="ml-2 rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">Demande choisie</span>}{a.id !== request && a.wished_date === day && <span className="ml-2 rounded-full bg-[#fff4e5] px-2 py-0.5 text-xs font-semibold text-[#6b3d00]">Souhaite ce jour</span>}</p>
                      <p className="text-muted">{d.title} · {MODE_LABEL[a.mode] ?? a.mode}</p>
                      {a.preference && <p className="text-ink/80">« {a.preference} »</p>}
                      <p className="text-ink/80">{wishText(a)}</p>
                    </div>
                    <button type="button" onClick={() => place(a, d, close)} aria-label={`Placer ici la demande de ${d.client_name}`} className="btn-primary min-h-11 px-4 py-2 text-sm">Placer ici</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby={`${id}-n`} className="border-t border-line pt-4">
            <h3 id={`${id}-n`} className="pf-eyebrow mb-2">Nouveau rendez-vous</h3>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <div><label htmlFor={`${id}-q`} className="label">Chercher un client</label><input id={`${id}-q`} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du client ou du dossier" className="field min-h-11 py-2" /></div>
              <div><label htmlFor={`${id}-mode`} className="label">Mode</label><select id={`${id}-mode`} value={mode} onChange={(e) => setMode(e.target.value as Appointment["mode"])} className="field min-h-11 py-2">{MODES.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}</select></div>
            </div>
            {found.length === 0 ? <p className="mt-2 text-sm text-muted">{openDossiers.length === 0 ? "Aucun dossier ouvert." : "Aucun dossier ouvert ne correspond."}</p> : (
              <ul aria-label="Dossiers ouverts" className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {found.map((d) => (
                  <li key={d.id}><button type="button" data-dossier={d.id} aria-pressed={d.id === dossierId} onClick={() => { setDossierId(d.id); setErr(""); }} className="min-h-11 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-left text-sm hover:border-navy aria-pressed:border-navy aria-pressed:bg-sky-50 aria-pressed:shadow-[inset_0_0_0_1px_var(--color-navy)]"><span className="block truncate font-semibold text-ink">{d.client_name}</span><span className="block truncate text-xs text-muted">{d.title}</span></button></li>
                ))}
              </ul>
            )}
            {!n && openDossiers.length > found.length && <p className="mt-1 text-xs text-muted">Les {found.length} premiers dossiers ouverts. Cherchez un client pour voir les autres.</p>}
            <p role="alert" className={err ? `mt-2 ${warnBox}` : "sr-only"}>{err}</p>
            <button type="button" onClick={() => create(close)} className="btn-primary mt-3 min-h-11 px-5 py-2 text-sm">Réserver ce rendez-vous</button>
          </section>
        </div>
      )}
    </Dialog>
  );
}

/* ───────────── Modifier un rendez-vous ───────────── */
function EditDialog({ store, agenda, ev, onMoved, openDossier, onClose }: { store: Store; agenda: Agenda; ev: Ev; onMoved: (day: string) => void; openDossier: OpenDossier; onClose: () => void }) {
  const id = useId();
  const [day, setDay] = useState(ev.day);
  const [who, setWho] = useState(ev.who);
  const [min, setMin] = useState(ev.start);
  const [duration, setDuration] = useState(ev.end - ev.start);
  const [note, setNote] = useState(ev.a.staff_note ?? "");
  const [err, setErr] = useState("");
  const changed = day !== ev.day || who !== ev.who || min !== ev.start || duration !== ev.end - ev.start || note.trim() !== (ev.a.staff_note ?? "");
  const saveIt = (close: () => void) => {
    if (!changed) { close(); return; }
    const p = bookingPatch({ day, min, assignee: who, duration, note });
    if (!p) { setErr("Choisissez une date et une heure valides."); return; }
    // La confirmation n'est demandée que si le rendez-vous sort des heures d'ouverture par ce changement.
    if (!inOfficeHours(day, min, duration) && (day !== ev.day || min !== ev.start || duration !== ev.end - ev.start) && !window.confirm(OFF_HOURS_CONFIRM)) return;
    close();
    if (day !== ev.day) onMoved(day);
    void patchAppointment(agenda.setList, ev.a, p, `Rendez-vous modifié : ${ev.d.client_name}, ${whenText(p.confirmed_at!)}.`, "Modification annulée.");
  };
  const cancel = (close: () => void) => {
    close();
    void patchAppointment(agenda.setList, ev.a, cancelPatch(ev.a), "Rendez-vous annulé.", "Rendez-vous rétabli.");
  };
  return (
    <Dialog title={`Rendez-vous : ${ev.d.client_name}`} onClose={onClose} wide>
      {(close) => (
        <div data-edit className="space-y-4">
          <div className="-mt-2 text-sm text-ink">
            <p className="first-letter:uppercase">{whenText(ev.a.confirmed_at!)}, {fmtDuration(ev.end - ev.start)}, {(MODE_LABEL[ev.a.mode] ?? ev.a.mode).toLowerCase()}, {ev.who ? `avec ${ev.who}` : "sans responsable"}.</p>
            <p className="text-muted">Dossier : {ev.d.title}{ev.a.preference ? ` · Préférence du client : « ${ev.a.preference} »` : ""}</p>
          </div>
          <div><label htmlFor={`${id}-day`} className="label">Date</label><input id={`${id}-day`} type="date" required value={day} onChange={(e) => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) setDay(e.target.value); }} className="field min-h-11 py-2 sm:max-w-56" /></div>
          <Fields id={id} team={store.team} who={who} setWho={setWho} min={min} setMin={setMin} duration={duration} setDuration={setDuration} note={note} setNote={setNote} />
          <Warnings agenda={agenda} day={day} min={min} duration={duration} who={who} except={ev.id} />
          <p role="alert" className={err ? warnBox : "sr-only"}>{err}</p>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => saveIt(close)} className="btn-primary min-h-11 px-5 py-2 text-sm">Enregistrer les changements</button>
            <button type="button" onClick={() => { close(); openDossier(ev.d.id, "rdv"); }} className={smallBtn}>Ouvrir le dossier</button>
            <button type="button" onClick={() => cancel(close)} className={removeBtn}>Annuler le rendez-vous</button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
