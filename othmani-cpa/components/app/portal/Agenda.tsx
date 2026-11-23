"use client";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { Deadline } from "@/content/deadlines";
import { upcoming } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import { site, type Lang } from "@/lib/site";
import { OFFICE_HOURS, fmtDate, save, toast, type Appointment, type Dossier } from "../shared";
import { addDays, addMonths, clock, dayTitle, durationLabel, fullDate, hourLabel, isDay, isOpenDay, monthOf, monthTitle, monthWeeks, mtlParts, weekdayNames } from "./cal";
import { Deadlines } from "./Deadlines";
import { Ico } from "./icons";
import type { T } from "./text";
import { Box, Eyebrow, PageTitle, Pill, Tile } from "./ui";
import { audienceOf, dossierLabel, downloadFile, icsDay, isClosed, telHref, todayMtl, type Go } from "./util";

/* ───────────── Agenda : un vrai calendrier ; le client exprime un souhait, le cabinet confirme l'heure ───────────── */
const MODES = ["bureau", "telephone", "video"] as const;
const MODE_ICON = { bureau: "home", telephone: "phone", video: "camera" } as const;
const PARTS = ["matin", "apres_midi", "indifferent"] as const;
type Part = (typeof PARTS)[number];
const modeOf = (a: Appointment) => ((MODES as readonly string[]).includes(a.mode) ? a.mode : "bureau");
const statusOf = (a: Appointment) => a.status ?? "demande";

/** Rendez-vous confirmé, placé à son jour et à son heure de Montréal. */
type Fixed = { a: Appointment; start: number; dur: number };
type DayInfo = { appts: Fixed[]; wishes: Appointment[]; dues: Dossier[]; official: Deadline[] };
const EMPTY: DayInfo = { appts: [], wishes: [], dues: [], official: [] };

/** Tout ce qui se passe, jour par jour, pour l'ensemble des dossiers du client. */
function buildIndex(appts: Appointment[], dossiers: Dossier[]) {
  const map = new Map<string, DayInfo>();
  const at = (day: string) => { let x = map.get(day); if (!x) map.set(day, (x = { appts: [], wishes: [], dues: [], official: [] })); return x; };
  for (const a of appts) {
    const st = statusOf(a);
    if (st === "confirme" && a.confirmed_at) {
      const p = mtlParts(a.confirmed_at);
      if (p) at(p.day).appts.push({ a, start: p.minutes, dur: Math.min(240, Math.max(15, Number(a.duration_min) || 30)) });
    } else if (st === "demande" && isDay(a.wished_date)) at(a.wished_date).wishes.push(a);
  }
  for (const x of map.values()) x.appts.sort((p, q) => p.start - q.start);
  for (const d of dossiers) if (isDay(d.due_date) && !isClosed(d)) at(d.due_date).dues.push(d);
  // Même règle que « Mes échéances » : les dates officielles qui visent le type de dossier. Plusieurs publics : toutes les dates.
  const auds = new Set(dossiers.map((d) => audienceOf(d.kind)));
  const aud = auds.size === 1 ? [...auds][0] : undefined;
  for (const o of upcoming("", aud)) at(o.date).official.push(o);
  return map;
}

/** Marques du calendrier : une forme par type, pour ne pas dépendre de la couleur seule. */
const SHAPES = {
  appt: "h-2.5 w-2.5 rounded-full bg-[#0b6248]",
  wish: "h-2.5 w-2.5 rounded-full border-2 border-[#175f77] bg-white",
  official: "h-2 w-2 rotate-45 bg-[#4338a8]",
  due: "h-1.5 w-3.5 rounded-[2px] bg-[#a15c00]",
} as const;
const Shape = ({ kind }: { kind: keyof typeof SHAPES }) => <span aria-hidden="true" className={`inline-block shrink-0 ${SHAPES[kind]}`} />;
const CHIP = {
  appt: "bg-[#0b6248] text-white font-semibold",
  wish: "border border-dashed border-[#175f77] bg-white text-[#175f77]",
  official: "bg-[#ecebfd] text-[#3b3196]",
  due: "bg-[#fff1dc] text-[#7a4300]",
} as const;

const navBtn = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#8a8ea3] bg-white text-navy hover:border-navy hover:bg-[#f4f5fa]";
const textBtn = "inline-flex min-h-11 items-center rounded-full border border-[#8a8ea3] bg-white px-4 text-[0.95rem] font-semibold text-navy hover:border-navy hover:bg-[#f4f5fa]";

/* ───────────── Vue du mois ───────────── */
function MonthView({ cursor, today, index, move, open, lang, t }: { cursor: string; today: string; index: Map<string, DayInfo>; move: (day: string, focus?: boolean) => void; open: (day: string) => void; lang: Lang; t: T }) {
  const weeks = monthWeeks(cursor);
  const names = weekdayNames(lang);
  const month = monthOf(cursor);
  const keysId = useId();
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const col = weeks.findIndex((w) => w.includes(cursor)) >= 0 ? weeks.find((w) => w.includes(cursor))!.indexOf(cursor) : 0;
    const next =
      e.key === "ArrowLeft" ? addDays(cursor, -1) : e.key === "ArrowRight" ? addDays(cursor, 1)
      : e.key === "ArrowUp" ? addDays(cursor, -7) : e.key === "ArrowDown" ? addDays(cursor, 7)
      : e.key === "Home" ? addDays(cursor, -col) : e.key === "End" ? addDays(cursor, 6 - col)
      : e.key === "PageUp" ? addMonths(cursor, -1) : e.key === "PageDown" ? addMonths(cursor, 1) : null;
    if (!next) return;
    e.preventDefault();
    move(next, true);
  };
  const summary = (day: string, x: DayInfo) => {
    const parts = [
      x.appts.length ? t.sumAppt(x.appts.length) : "", x.wishes.length ? t.sumWish(x.wishes.length) : "",
      x.dues.length ? t.sumDue : "", x.official.length ? t.sumOfficial(x.official.length) : "",
    ].filter(Boolean);
    return [fullDate(day, lang), day === today ? t.sumToday : "", parts.length ? parts.join(", ") : t.sumNone, isOpenDay(day) ? "" : t.sumClosed].filter(Boolean).join(", ");
  };
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
        <h2 aria-live="polite" className="font-display text-xl font-bold tracking-tight text-ink">{monthTitle(cursor, lang)}</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(today)} className={textBtn}>{t.calToday}</button>
          <button type="button" onClick={() => move(addMonths(cursor, -1))} aria-label={t.calPrev} className={navBtn}><Ico name="back" className="h-5 w-5" strokeWidth={2.2} /></button>
          <button type="button" onClick={() => move(addMonths(cursor, 1))} aria-label={t.calNext} className={navBtn}><Ico name="chevron" className="h-5 w-5" strokeWidth={2.2} /></button>
        </div>
      </div>
      <p id={keysId} className="sr-only">{t.calKeys}</p>
      <div role="grid" aria-label={monthTitle(cursor, lang)} aria-describedby={keysId} onKeyDown={onKey} className="border-t border-line">
        <div role="row" className="grid grid-cols-7 bg-[#f4f5fa]">
          {names.map((n) => (
            <div key={n.long} role="columnheader" aria-label={n.long} className="py-2 text-center text-xs font-semibold tracking-wide text-[#3d4159] uppercase">
              <span aria-hidden="true">{n.short}</span>
            </div>
          ))}
        </div>
        {weeks.map((w) => (
          <div key={w[0]} role="row" className="grid grid-cols-7">
            {w.map((day, i) => {
              const x = index.get(day) ?? EMPTY;
              const inMonth = monthOf(day) === month;
              const closed = !isOpenDay(day);
              const sel = day === cursor;
              const chips: { key: string; kind: keyof typeof CHIP; text: string }[] = [
                ...x.appts.map((f) => ({ key: f.a.id, kind: "appt" as const, text: clock(f.a.confirmed_at as string, lang) })),
                ...x.wishes.map((a) => ({ key: a.id, kind: "wish" as const, text: t.chipWish })),
                ...x.dues.map((d) => ({ key: d.id, kind: "due" as const, text: t.chipDue })),
                ...x.official.map((o) => ({ key: `${o.audience}-${o.fr.title}`, kind: "official" as const, text: o[lang].title })),
              ];
              const shown = chips.length > 3 ? chips.slice(0, 2) : chips;
              return (
                <div key={day} role="gridcell" aria-selected={sel} className={`min-w-0 border-t border-line ${i ? "border-l" : ""} ${closed ? "bg-[#eceef5]" : "bg-white"}`}>
                  <button
                    type="button" data-cal-day={day} tabIndex={sel ? 0 : -1} aria-label={summary(day, x)} aria-current={day === today ? "date" : undefined}
                    onClick={() => open(day)}
                    className={`flex min-h-[3.75rem] w-full flex-col items-center gap-1 px-0.5 pt-1.5 pb-1.5 text-left !rounded-none outline-offset-[-3px] hover:bg-[#e4f4f9]/60 sm:min-h-[6.5rem] sm:items-stretch sm:px-1.5 ${sel ? "shadow-[inset_0_0_0_2px_#2a2a5c]" : ""}`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${day === today ? "bg-navy font-bold text-white" : inMonth ? `font-semibold ${closed ? "text-[#3d4159]" : "text-ink"}` : "text-[#5d6079]"}`}>{Number(day.slice(8))}</span>
                    <span aria-hidden="true" className={`flex min-h-2.5 flex-wrap items-center justify-center gap-1 sm:hidden`}>
                      {x.appts.length > 0 && <Shape kind="appt" />}{x.wishes.length > 0 && <Shape kind="wish" />}{x.dues.length > 0 && <Shape kind="due" />}{x.official.length > 0 && <Shape kind="official" />}
                    </span>
                    <span aria-hidden="true" className={`hidden min-w-0 flex-col gap-1 sm:flex`}>
                      {shown.map((c) => <span key={c.key} className={`block truncate rounded-md px-1.5 py-0.5 text-[0.72rem] leading-tight ${CHIP[c.kind]}`}>{c.text}</span>)}
                      {chips.length > shown.length && <span className="px-1 text-[0.72rem] font-semibold text-[#3d4159]">{t.more(chips.length - shown.length)}</span>}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-line px-4 py-3.5 sm:px-5">
        <p className="text-[0.95rem] leading-relaxed text-ink">{t.calHint}</p>
        <ul aria-label={t.calLegend} className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[#3d4159]">
          <li className="flex items-center gap-1.5"><Shape kind="appt" />{t.lgAppt}</li>
          <li className="flex items-center gap-1.5"><Shape kind="wish" />{t.lgWish}</li>
          <li className="flex items-center gap-1.5"><Shape kind="due" />{t.lgDue}</li>
          <li className="flex items-center gap-1.5"><Shape kind="official" />{t.lgOfficial}</li>
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px] border border-[#8a8ea3] bg-[#eceef5]" />{t.lgClosed}</li>
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-navy" />{t.calToday}</li>
        </ul>
      </div>
    </section>
  );
}

/* ───────────── Vue d'un jour ───────────── */
const OPEN = OFFICE_HOURS.open * 60, CLOSE = OFFICE_HOURS.close * 60, STEP = OFFICE_HOURS.slotMin;
const NOON = Math.min(CLOSE, Math.max(OPEN, 12 * 60));

function ApptBlock({ f, many, dossiers, lang, t }: { f: Fixed; many: boolean; dossiers: Dossier[]; lang: Lang; t: T }) {
  const { a } = f;
  const from = new Date(a.confirmed_at as string).getTime();
  const m = modeOf(a);
  const file = many ? dossiers.find((x) => x.id === a.dossier_id) : undefined;
  return (
    <article className="h-full min-w-0 rounded-xl border-l-4 border-[#0b6248] bg-[#e3f5ee] px-2.5 py-1.5 text-[0.9rem] leading-snug text-[#0a4a37]">
      <p className="font-semibold"><span className="sr-only">{t.lgAppt}, </span>{clock(from, lang)} – {clock(from + f.dur * 60000, lang)} <span className="font-normal">· {durationLabel(f.dur, lang)}</span></p>
      <p className="flex flex-wrap items-center gap-x-1.5 break-words"><Ico name={MODE_ICON[m]} className="h-4 w-4 shrink-0" />{t.modes[m]}{a.assignee ? ` · ${t.apptWho(a.assignee)}` : ""}</p>
      {file && <p className="break-words">{dossierLabel(file)}</p>}
      {a.staff_note && <p className="mt-0.5 break-words whitespace-pre-line"><span className="font-semibold">{t.apptStaff} : </span>{a.staff_note}</p>}
    </article>
  );
}

function WishCard({ a, many, dossiers, t, showPart = false }: { a: Appointment; many: boolean; dossiers: Dossier[]; t: T; showPart?: boolean }) {
  const m = modeOf(a);
  const file = many ? dossiers.find((x) => x.id === a.dossier_id) : undefined;
  const part = a.wished_part && a.wished_part in t.parts ? t.parts[a.wished_part] : t.parts.indifferent;
  return (
    <div className="rounded-xl border-2 border-dashed border-[#175f77] bg-white px-3 py-2 text-[0.9rem] leading-snug text-ink">
      <p className="font-semibold text-[#175f77]">{t.wishPending}</p>
      <p className="break-words">{t.modes[m]}{showPart ? ` · ${part}` : ""}{file ? ` · ${dossierLabel(file)}` : ""}</p>
      {a.preference && <p className="break-words whitespace-pre-line text-muted">{a.preference}</p>}
    </div>
  );
}

/** Échelle des heures du bureau, en deux moitiés. C'est un repère : aucune ligne n'est un créneau à réserver. */
function Timeline({ fixed, wishes, many, dossiers, lang, t }: { fixed: Fixed[]; wishes: Appointment[]; many: boolean; dossiers: Dossier[]; lang: Lang; t: T }) {
  type Row = { head: "am" | "pm" } | { min: number } | { end: true };
  const rows: Row[] = [];
  if (NOON > OPEN) { rows.push({ head: "am" }); for (let m = OPEN; m < NOON; m += STEP) rows.push({ min: m }); }
  if (CLOSE > NOON) { rows.push({ head: "pm" }); for (let m = NOON; m < CLOSE; m += STEP) rows.push({ min: m }); }
  rows.push({ end: true });
  const startLine = (min: number) => rows.findIndex((r) => "min" in r && r.min <= min && min < r.min + STEP) + 1;
  const endLine = (min: number) => { let last = 0; rows.forEach((r, i) => { if ("min" in r && r.min < min) last = i; }); return last + 2; };
  // Un rendez-vous qui dépasse midi reste dessiné dans sa moitié : le texte garde ses vraies heures.
  // Rendez-vous qui se chevauchent (dossiers différents) : côte à côte.
  const ends: number[] = [];
  const placed = fixed.map((f) => {
    let lane = ends.findIndex((e) => e <= f.start);
    if (lane < 0) lane = ends.length;
    ends[lane] = f.start + f.dur;
    return { f, lane };
  });
  const lanes = Math.max(1, ends.length);
  const half = (part: "matin" | "apres_midi") => wishes.filter((a) => a.wished_part === part);
  return (
    <div className="mt-3 grid gap-x-2" style={{ gridTemplateColumns: `3.4rem repeat(${lanes}, minmax(0, 1fr))` }}>
      {rows.map((r, i) => {
        const row = i + 1;
        if ("head" in r) {
          const am = r.head === "am";
          const list = half(am ? "matin" : "apres_midi");
          return (
            <div key={r.head} style={{ gridRow: row, gridColumn: "1 / -1" }} className={`${am ? "" : "mt-1"} rounded-xl bg-[#eef0f7] px-3 py-2`}>
              <h4 className="font-display font-semibold text-ink">{am ? t.am : t.pm} <span className="font-sans text-sm font-normal text-[#3d4159]">· {t.hoursRange(hourLabel((am ? OPEN : NOON) / 60, lang), hourLabel((am ? NOON : CLOSE) / 60, lang))}</span></h4>
              {list.length > 0 && <div className="mt-1.5 space-y-1.5">{list.map((a) => <WishCard key={a.id} a={a} many={many} dossiers={dossiers} t={t} />)}</div>}
            </div>
          );
        }
        const min = "min" in r ? r.min : CLOSE;
        const onHour = min % 60 === 0 || "end" in r;
        return (
          <div key={min} aria-hidden="true" style={{ gridRow: row, gridColumn: "1 / -1" }} className={`grid grid-cols-[3.4rem_minmax(0,1fr)] gap-x-2 ${"end" in r ? "" : "min-h-7"}`}>
            <span className="pt-0.5 pr-0.5 text-right text-xs font-semibold text-[#3d4159]">{onHour ? hourLabel(Math.floor(min / 60), lang) : ""}</span>
            <span className={`mt-2 border-t ${onHour ? "border-[#b9bdcf]" : "border-dashed border-[#d5d8e4]"}`} />
          </div>
        );
      })}
      {placed.map(({ f, lane }) => (
        <div key={f.a.id} style={{ gridRow: `${startLine(f.start)} / ${Math.max(startLine(f.start) + 1, endLine(Math.min(f.start < NOON ? NOON : CLOSE, f.start + f.dur)))}`, gridColumn: lane + 2 }} className="z-[1] min-w-0 pt-2 pb-px">
          <ApptBlock f={f} many={many} dossiers={dossiers} lang={lang} t={t} />
        </div>
      ))}
    </div>
  );
}

function RequestForm({ day, dossiers, current, reload, lang, t }: { day: string; dossiers: Dossier[]; current: string; reload: () => void; lang: Lang; t: T }) {
  const [open, setOpen] = useState(false);
  const [part, setPart] = useState<Part>("indifferent");
  const [mode, setMode] = useState<(typeof MODES)[number]>("bureau");
  const [dossier, setDossier] = useState(current);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const id = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const many = dossiers.length > 1;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    // La journée a pu se terminer pendant que l'écran restait ouvert.
    if (day <= todayMtl() || !isOpenDay(day)) { toast(t.whyPast, "error"); return; }
    setBusy(true);
    const ok = await save(
      supabase().from("appointment_requests").insert({ dossier_id: dossiers.some((x) => x.id === dossier) ? dossier : current, preference: note.trim().slice(0, 300), mode, wished_date: day, wished_part: part }),
      { ok: t.reqOk, lang },
    );
    setBusy(false);
    if (!ok) return;
    setNote(""); setOpen(false); reload();
    toggle.current?.focus();
  };
  const radio = (on: boolean) => `flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy ${on ? "border-navy bg-[#eef0f7] text-navy" : "border-[#8a8ea3] bg-white text-ink"}`;
  return (
    <Box>
      <button ref={toggle} type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={`${id}-form`} className="btn-primary w-full sm:w-auto">
        <Ico name="calendar" />{t.reqCta}
      </button>
      <p className="mt-3 font-semibold text-ink">{t.reqExact}</p>
      {open && (
        <form id={`${id}-form`} onSubmit={submit} className="mt-4 border-t border-line pt-4">
          <fieldset>
            <legend className="label">{t.reqPart}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {PARTS.map((p) => (
                <label key={p} className={radio(part === p)}>
                  <input type="radio" name={`${id}-part`} value={p} checked={part === p} onChange={() => setPart(p)} className="sr-only" />
                  <span className="flex-1">{t.parts[p]}</span>
                  {part === p && <Ico name="check" className="h-4 w-4" strokeWidth={2.6} />}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="label">{t.apptMode}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <label key={m} className={radio(mode === m)}>
                  <input type="radio" name={`${id}-mode`} value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                  <Ico name={MODE_ICON[m]} />
                  <span className="flex-1">{t.modes[m]}</span>
                  {mode === m && <Ico name="check" className="h-4 w-4" strokeWidth={2.6} />}
                </label>
              ))}
            </div>
          </fieldset>
          {many && (
            <div className="mt-4">
              <label htmlFor={`${id}-file`} className="label">{t.apptFile}</label>
              <select id={`${id}-file`} value={dossier} onChange={(e) => setDossier(e.target.value)} className="field">
                {dossiers.map((x) => <option key={x.id} value={x.id}>{dossierLabel(x)}</option>)}
              </select>
            </div>
          )}
          <div className="mt-4">
            <label htmlFor={`${id}-note`} className="label">{t.reqNote}</label>
            <textarea id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} aria-describedby={`${id}-help`} className="field resize-y" />
            <p id={`${id}-help`} className="mt-1.5 text-sm text-muted">{t.reqNoteHelp}</p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:cursor-not-allowed disabled:!bg-none disabled:!bg-[#5d6079] sm:w-auto">{busy ? t.apptBusy : t.apptSend}</button>
            <button type="button" onClick={() => { setOpen(false); toggle.current?.focus(); }} className="btn-secondary w-full sm:w-auto">{t.reqCancel}</button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t.apptNote}</p>
        </form>
      )}
    </Box>
  );
}

function DayView({ day, today, info, dossiers, current, reload, back, show, lang, t }: { day: string; today: string; info: DayInfo; dossiers: Dossier[]; current: string; reload: () => void; back: () => void; show: (day: string) => void; lang: Lang; t: T }) {
  const many = dossiers.length > 1;
  const openDay = isOpenDay(day);
  const inHours = (f: Fixed) => openDay && f.start >= OPEN && f.start < CLOSE;
  const fixed = info.appts.filter(inHours);
  const outside = info.appts.filter((f) => !inHours(f));
  // Souhaits sans moitié de journée précise (ou jour fermé) : affichés au-dessus de l'échelle.
  const loose = info.wishes.filter((a) => !openDay || (a.wished_part !== "matin" && a.wished_part !== "apres_midi"));
  const names = weekdayNames(lang);
  const openNames = [...OFFICE_HOURS.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => names[(d + 6) % 7].long);
  const contiguous = OFFICE_HOURS.days.length > 2 && [...OFFICE_HOURS.days].sort((a, b) => a - b).every((d, i, l) => !i || d === l[i - 1] + 1);
  const openText = contiguous ? t.dayRange(openNames[0], openNames[openNames.length - 1]) : openNames.join(", ");
  const why = !openDay ? t.whyClosed(openText) : day < today ? t.whyPast : day === today ? t.whyToday : "";
  const ics = (date: string, title: string, detail: string, key: string) => downloadFile(icsDay(date, title, `${detail} — ${site.name}`, key), "text/calendar;charset=utf-8", `${date}-othmani-cpa.ics`);
  const addBtn = (label: string, run: () => void) => (
    <button type="button" onClick={run} aria-label={`${t.dlAdd} : ${label}`} className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-navy underline underline-offset-4">
      <Ico name="download" className="h-4 w-4" strokeWidth={2} />{t.dlAdd}
    </button>
  );
  const allDay = info.dues.length + info.official.length;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={back} className={`${textBtn} gap-0.5 !pl-2.5`}><Ico name="back" className="h-5 w-5" strokeWidth={2.2} />{t.dayBack}</button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => show(addDays(day, -1))} aria-label={t.dayPrev} className={navBtn}><Ico name="back" className="h-5 w-5" strokeWidth={2.2} /></button>
            <button type="button" onClick={() => show(addDays(day, 1))} aria-label={t.dayNext} className={navBtn}><Ico name="chevron" className="h-5 w-5" strokeWidth={2.2} /></button>
          </div>
        </div>
        <h2 id="agenda-day" tabIndex={-1} aria-live="polite" className="mt-3 font-display text-[1.45rem] leading-tight font-bold tracking-tight text-ink outline-none">{dayTitle(day, lang)}</h2>
        {(day === today || !openDay) && (
          <p className="mt-2 flex flex-wrap gap-2">
            {day === today && <Pill tone="slate">{t.dayToday}</Pill>}
            {!openDay && <Pill tone="amber">{t.lgClosed}</Pill>}
          </p>
        )}
      </div>

      <Box>
        <h3 className="font-display text-lg font-semibold text-ink">{t.dayAllDay}</h3>
        {allDay === 0 ? <p className="mt-1 text-[0.95rem] text-muted">{t.dayNoDeadline}</p> : (
          <ul className="mt-1 divide-y divide-line">
            {info.dues.map((d) => (
              <li key={d.id} className="flex items-start gap-3 py-3">
                <Tile icon="folder" tone="amber" className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words text-ink">{t.dlFile}</p>
                  <p className="text-sm break-words text-muted">{dossierLabel(d)}</p>
                  {addBtn(t.dlFile, () => ics(day, `${t.dlFile} : ${dossierLabel(d)}`, dossierLabel(d), `dossier-${d.id}`))}
                </div>
              </li>
            ))}
            {info.official.map((o) => (
              <li key={`${o.audience}-${o.fr.title}`} className="flex items-start gap-3 py-3">
                <Tile icon="calendar" tone="violet" className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words text-ink">{o[lang].title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed break-words text-muted">{o[lang].detail}</p>
                  {addBtn(o[lang].title, () => ics(o.date, o[lang].title, o[lang].detail, o.audience))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {info.official.length > 0 && <p className="mt-1 border-t border-line pt-3 text-sm leading-relaxed text-muted">{t.dlNote}</p>}
      </Box>

      <Box>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="font-display text-lg font-semibold text-ink">{t.dayHours}</h3>
          {openDay && <p className="text-sm text-[#3d4159]">{t.hoursRange(hourLabel(OFFICE_HOURS.open, lang), hourLabel(OFFICE_HOURS.close, lang))} · {t.hoursNote}</p>}
        </div>
        {!openDay && <p className="mt-1 leading-relaxed text-ink">{t.dayClosed}</p>}
        {openDay && info.appts.length === 0 && <p className="mt-1 text-[0.95rem] text-muted">{t.dayNoAppt}</p>}
        {outside.length > 0 && (
          <div className="mt-3">
            <Eyebrow>{t.dayOutside}</Eyebrow>
            <div className="mt-1.5 space-y-2">{outside.map((f) => <ApptBlock key={f.a.id} f={f} many={many} dossiers={dossiers} lang={lang} t={t} />)}</div>
          </div>
        )}
        {loose.length > 0 && (
          <div className="mt-3">
            {openDay && <Eyebrow>{t.wishAny}</Eyebrow>}
            <div className="mt-1.5 space-y-2">{loose.map((a) => <WishCard key={a.id} a={a} many={many} dossiers={dossiers} t={t} showPart={!openDay} />)}</div>
          </div>
        )}
        {openDay && <Timeline fixed={fixed} wishes={info.wishes} many={many} dossiers={dossiers} lang={lang} t={t} />}
      </Box>

      {why ? (
        <Box className="flex items-start gap-3.5">
          <Tile icon="clock" tone="slate" />
          <div className="min-w-0">
            <p className="leading-relaxed text-ink">{why}</p>
            {openDay && day === today && <a href={telHref(site.phone.tel)} className="btn-secondary mt-3"><Ico name="phone" />{site.phone.display}</a>}
          </div>
        </Box>
      ) : <RequestForm key={day} day={day} dossiers={dossiers} current={current} reload={reload} lang={lang} t={t} />}
    </div>
  );
}

/* ───────────── Écran ───────────── */
export function ApptScreen({ appts, dossiers, current, reload, lang, t, go }: { appts: Appointment[]; dossiers: Dossier[]; current: string; reload: () => void; lang: Lang; t: T; go: Go }) {
  const today = todayMtl();
  const [cursor, setCursor] = useState(today);
  const [openDay, setOpenDay] = useState<string | null>(null);
  // Le focus ne bouge qu'après un geste de la personne, jamais lors d'un rafraîchissement.
  const want = useRef<"cell" | "title" | null>(null);
  const index = useMemo(() => buildIndex(appts, dossiers), [appts, dossiers]);
  useEffect(() => {
    const w = want.current;
    want.current = null;
    if (w === "cell" && !openDay) document.querySelector<HTMLElement>(`[data-cal-day="${cursor}"]`)?.focus();
    if (w === "title" && openDay) { window.scrollTo(0, 0); document.getElementById("agenda-day")?.focus({ preventScroll: true }); }
  }, [cursor, openDay]);
  const many = dossiers.length > 1;
  const titleOf = (id: string) => { const d = dossiers.find((x) => x.id === id); return d ? dossierLabel(d) : ""; };
  const show = (day: string) => { want.current = "title"; setCursor(day); setOpenDay(day); };
  const sorted = [...appts].sort((a, b) => b.created_at.localeCompare(a.created_at));
  let body: ReactNode;
  if (openDay)
    body = <DayView day={openDay} today={today} info={index.get(openDay) ?? EMPTY} dossiers={dossiers} current={current} reload={reload} back={() => { want.current = "cell"; setOpenDay(null); }} show={(d) => { setCursor(d); setOpenDay(d); }} lang={lang} t={t} />;
  else
    body = (
      <>
        <MonthView cursor={cursor} today={today} index={index} move={(d, focus) => { if (focus) want.current = "cell"; setCursor(d); }} open={show} lang={lang} t={t} />

        <h2 className="mt-6 mb-3 px-1 font-display text-lg font-semibold text-ink">{t.apptList}</h2>
        {sorted.length === 0 ? <p className="px-1 text-[0.95rem] text-muted">{t.apptEmpty}</p> : (
          <ul className="space-y-3">
            {sorted.map((a) => {
              const st = statusOf(a);
              const m = modeOf(a);
              const fixedDay = st === "confirme" && a.confirmed_at ? mtlParts(a.confirmed_at)?.day ?? null : null;
              const wished = isDay(a.wished_date) ? a.wished_date : null;
              const target = fixedDay ?? (st === "demande" ? wished : null);
              return (
                <li key={a.id}>
                  <Box className="!py-4">
                    <div className="flex items-start gap-3.5">
                      <Tile icon={MODE_ICON[m]} tone={st === "confirme" ? "green" : st === "annule" ? "slate" : "sky"} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-display font-semibold text-ink">{t.modes[m]}</p>
                          {st === "confirme" ? <Pill tone="green" icon="check">{a.confirmed_at ? t.apptConfirmedOn(fmtDate(a.confirmed_at, lang, true)) : t.apptConfirmed}</Pill> : st === "annule" ? <Pill tone="slate">{t.apptCancelled}</Pill> : <Pill tone="sky">{t.apptSent}</Pill>}
                        </div>
                        {wished && <p className="mt-1 break-words text-ink">{t.wishedFor(fullDate(wished, lang), t.parts[a.wished_part && a.wished_part in t.parts ? a.wished_part : "indifferent"])}</p>}
                        {a.preference && <p className="mt-1 leading-relaxed break-words whitespace-pre-line text-ink">{a.preference}</p>}
                        <p className="mt-1 text-sm text-muted">{t.apptAsked} {fmtDate(a.created_at, lang)}{many && titleOf(a.dossier_id) ? ` · ${titleOf(a.dossier_id)}` : ""}</p>
                        {a.staff_note && <p className="mt-2.5 rounded-xl bg-[#f4f5fa] px-3.5 py-2.5 text-[0.95rem] leading-relaxed text-ink"><span className="font-semibold">{t.apptStaff} : </span>{a.staff_note}</p>}
                        {target && (
                          <button type="button" onClick={() => show(target)} aria-label={`${t.seeDay} : ${fullDate(target, lang)}`} className="-ml-1 mt-1 inline-flex min-h-11 items-center gap-0.5 rounded-lg px-1 text-sm font-semibold text-navy underline underline-offset-4">
                            {t.seeDay}<Ico name="chevron" className="h-4 w-4" strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    </div>
                  </Box>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6"><Deadlines d={dossiers.find((x) => x.id === current) ?? dossiers[0]} appts={appts} lang={lang} t={t} /></div>
      </>
    );
  return (
    <div className="max-w-4xl">
      <PageTitle back={t.back} go={go} sub={t.agendaIntro}>{t.apptTitle}</PageTitle>
      {body}
    </div>
  );
}
