"use client";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Messages, fmtDate, type Appointment } from "../shared";
import { Avatar, Loadable, WAIT_RULE, addDays, askAi, box, chip, clockFmt, dayOf, docsToCheck, empty, link, openFile, pill, rows, smallBtn, todayISO, useLoad, waitOf, warnPill, type OpenDossier, type Store } from "./common";
import { Templates } from "./detail";

/* ───────────── Documents : tous les fichiers récents, tous dossiers confondus ───────────── */
export function DocumentsSection({ store, openDossier, markReceived }: { store: Store; openDossier: OpenDossier; markReceived: (requestId: string) => void }) {
  const [filter, setFilter] = useState<"tous" | "a_verifier">("tous");
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(store.dossiers.map((d) => [d.id, d])), [store.dossiers]);
  const check = useMemo(() => new Set(docsToCheck(store).map((f) => f.id)), [store]);
  const n = q.trim().toLowerCase();
  const shown = store.docs.filter((f) => (filter === "tous" || check.has(f.id)) && (!n || `${f.name} ${byId.get(f.dossier_id)?.client_name ?? ""} ${byId.get(f.dossier_id)?.title ?? ""}`.toLowerCase().includes(n)));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Documents affichés" className="flex gap-1">
          <button type="button" aria-pressed={filter === "tous"} onClick={() => setFilter("tous")} className={chip}>Tous ({store.docs.length})</button>
          <button type="button" aria-pressed={filter === "a_verifier"} onClick={() => setFilter("a_verifier")} className={chip}>À vérifier ({check.size})</button>
        </div>
        <div className="min-w-0 flex-1 basis-56 sm:max-w-sm">
          <label htmlFor="doc-q" className="sr-only">Chercher un document</label>
          <input id="doc-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un document, un client" className="field min-h-11 py-2 text-sm" />
        </div>
      </div>
      {shown.length === 0 ? <p className={empty}>{filter === "a_verifier" ? "Aucun document à vérifier." : n ? "Aucun document ne correspond à cette recherche." : "Aucun document récent."}</p> : (
        <ul className={`${box} divide-y divide-line !py-1`}>
          {shown.map((f) => {
            const d = byId.get(f.dossier_id);
            return (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="truncate font-semibold text-ink">{f.name}</p>
                  <p className="text-sm text-muted">{d ? <button type="button" onClick={() => openDossier(d.id, "documents")} className={link}>{d.client_name}, {d.title}</button> : "Dossier introuvable"} · {fmtDate(f.created_at, "fr")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${pill} ${f.uploader_role === "client" ? "bg-sky-100 text-navy" : "bg-[#eef0f6] text-ink"}`}>{f.uploader_role === "client" ? "Du client" : "Du cabinet"}</span>
                  {check.has(f.id) && <span className={warnPill}>À vérifier</span>}
                  {check.has(f.id) && f.request_id && <button type="button" onClick={() => markReceived(f.request_id!)} className={smallBtn}>Marquer reçu</button>}
                  <button type="button" onClick={() => openFile(f.path)} aria-label={`Ouvrir ${f.name}`} className={smallBtn}>Ouvrir</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Les {store.docs.length >= 300 ? "300 " : ""}fichiers les plus récents. « À vérifier » : fichier d'un client lié à une demande pas encore marquée reçue, ou déposé sans demande depuis 14 jours.</p>
    </div>
  );
}

/* ───────────── Messages : les conversations, celles qui attendent une réponse d'abord ───────────── */
export function MessagesSection({ store, staffName, current, setCurrent, openDossier, onSent }: { store: Store; staffName: string; current: string | null; setCurrent: (id: string | null) => void; openDossier: OpenDossier; onSent: (dossierId: string) => void }) {
  const byId = useMemo(() => new Map(store.dossiers.map((d) => [d.id, d])), [store.dossiers]);
  const waiting = useMemo(() => new Set(store.waiting), [store.waiting]);
  // Un dossier qui attend une réponse figure toujours dans la liste, même si son dernier message est trop ancien pour avoir été chargé.
  const all = useMemo(() => [...store.lastMsgs.filter((m) => byId.has(m.dossier_id)), ...store.waiting.filter((id) => byId.has(id) && !store.lastMsgs.some((m) => m.dossier_id === id)).map((id) => ({ dossier_id: id, created_at: byId.get(id)!.updated_at, author_role: "client", author_name: "", body: "Message du client à lire." }))], [store.lastMsgs, store.waiting, byId]);
  // Attente de chaque conversation qui attend le cabinet ; la plus longue d'abord, puis les autres conversations, les plus récentes d'abord.
  const waits = useMemo(() => new Map(store.waiting.map((id) => [id, waitOf(store, id)] as const)), [store]);
  const threads = useMemo(() => [...all].sort((a, b) => Number(waiting.has(b.dossier_id)) - Number(waiting.has(a.dossier_id)) || (waiting.has(a.dossier_id) ? (waits.get(b.dossier_id)?.hours ?? -1) - (waits.get(a.dossier_id)?.hours ?? -1) : 0) || b.created_at.localeCompare(a.created_at)), [all, waiting, waits]);
  const overdue = threads.filter((m) => waits.get(m.dossier_id)?.late).length;
  const d = current ? byId.get(current) : undefined;
  return (
    <div className="grid gap-5 lg:grid-cols-[21rem_minmax(0,1fr)] lg:items-start">
      <div className={d ? "hidden lg:block" : ""}>
        {waiting.size > 0 && (
          <p className={`mb-3 rounded-2xl px-3.5 py-2.5 text-sm ${overdue ? "bg-[#fff4e5] text-[#6b3d00]" : "border border-[#e6e8f2] bg-white text-ink"}`} title={WAIT_RULE}>
            <strong className="font-semibold">{overdue ? (overdue > 1 ? `${overdue} conversations attendent depuis plus d'un jour ouvrable.` : "1 conversation attend depuis plus d'un jour ouvrable.") : "Aucune réponse en retard."}</strong> Le cabinet promet une réponse en un jour ouvrable. La plus longue attente figure en premier.
          </p>
        )}
        {threads.length === 0 ? <p className={empty}>Aucune conversation pour l'instant.</p> : (
          <ul aria-label="Conversations" className="space-y-2">
            {threads.map((m) => {
              const x = byId.get(m.dossier_id)!;
              const w = waits.get(x.id);
              return (
                <li key={m.dossier_id}>
                  <button type="button" data-thread={x.id} onClick={() => setCurrent(x.id)} aria-current={x.id === current ? "true" : undefined} className="flex w-full items-start gap-3 rounded-2xl border border-[#e6e8f2] bg-white p-3.5 text-left hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-sky-50">
                    <Avatar name={x.client_name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><span className="truncate font-semibold text-ink">{x.client_name}</span><span className="shrink-0 text-xs text-muted">{fmtDate(m.created_at, "fr")}</span></span>
                      <span className="block truncate text-xs text-muted">{x.title}</span>
                      <span className="mt-1 line-clamp-2 block text-sm text-ink/80">{m.author_role === "client" ? "" : "Vous : "}{m.body}</span>
                      {waiting.has(x.id) && (w?.late
                        ? <span data-wait="late" title={WAIT_RULE} className={`${warnPill} mt-2 inline-block`}>À répondre · attend depuis {w.text} · délai dépassé</span>
                        : <span data-wait="ok" title={WAIT_RULE} className={`${pill} mt-2 inline-block bg-sky-100 text-navy`}>À répondre{w ? ` · attend depuis ${w.text}` : ""}</span>)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">{WAIT_RULE}</p>
        <p className="mt-2 text-xs text-muted">Pour écrire à un client qui n'a pas encore de conversation, ouvrez son dossier.</p>
      </div>
      <div className={`min-w-0 ${d ? "" : "hidden lg:block"}`}>
        {d ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={() => setCurrent(null)} className={`${smallBtn} lg:hidden`}>← Conversations</button>
              <p className="min-w-0 font-display text-lg font-semibold text-ink">{d.client_name} <span className="text-sm font-normal text-muted">· {d.title}</span></p>
              <button type="button" onClick={() => openDossier(d.id, "messages")} className={smallBtn}>Ouvrir le dossier</button>
            </div>
            <Messages key={d.id} dossierId={d.id} role="cabinet" lang="fr" authorName={staffName} onSent={() => onSent(d.id)} aiDraft={() => askAi(d.id, "reply")} />
            <div className="mt-3"><Templates key={d.id} d={d} /></div>
          </>
        ) : <p className={empty}>Choisissez une conversation.</p>}
      </div>
    </div>
  );
}

/* ───────────── Calendrier : échéances, tâches et rendez-vous confirmés du mois ───────────── */
type Item = { key: string; day: string; time?: string; kind: "Échéance" | "Tâche" | "Rendez-vous"; title: string; sub: string; dossierId: string; focus?: "rdv" };
const monthFmt = new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLong = new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const KIND_PILL: Record<Item["kind"], string> = { "Échéance": "bg-[#e9e8f7] text-navy", "Tâche": "bg-[#eef0f6] text-ink", "Rendez-vous": "bg-sky-100 text-navy" };
const APPT_MODE: Record<string, string> = { bureau: "au bureau", telephone: "par téléphone", video: "en visioconférence" };

export function Calendar({ store, openDossier }: { store: Store; openDossier: OpenDossier }) {
  const today = todayISO();
  const [month, setMonth] = useState(today.slice(0, 7));
  // Si les rendez-vous ne se chargent pas, les échéances et les tâches restent affichées, avec un avis.
  const appts = useLoad(async () => {
    try { return { list: await rows<Appointment>(supabase().from("appointment_requests").select("*").eq("status", "confirme").order("confirmed_at").limit(500)), failed: false }; }
    catch { return { list: [] as Appointment[], failed: true }; }
  });
  const byId = useMemo(() => new Map(store.dossiers.map((d) => [d.id, d])), [store.dossiers]);
  const shift = (n: number) => { const [y, m] = month.split("-").map(Number); setMonth(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7)); };
  const build = (list: Appointment[]): Item[] => [
    ...store.dossiers.filter((d) => d.status !== "ferme" && d.due_date).map((d): Item => ({ key: `d-${d.id}`, day: d.due_date!, kind: "Échéance", title: d.client_name, sub: d.title, dossierId: d.id })),
    ...store.tasks.filter((t) => !t.done && t.due_date && byId.has(t.dossier_id)).map((t): Item => ({ key: `t-${t.id}`, day: t.due_date!, kind: "Tâche", title: t.label, sub: `${byId.get(t.dossier_id)!.client_name}${t.assignee ? ` · ${t.assignee}` : ""}`, dossierId: t.dossier_id })),
    ...list.filter((a) => a.confirmed_at && byId.has(a.dossier_id)).map((a): Item => ({ key: `a-${a.id}`, day: dayOf(a.confirmed_at!), time: clockFmt.format(new Date(a.confirmed_at!)), kind: "Rendez-vous", title: byId.get(a.dossier_id)!.client_name, sub: `Rendez-vous ${APPT_MODE[a.mode] ?? a.mode}`, dossierId: a.dossier_id, focus: "rdv" })),
  ].filter((x) => x.day.startsWith(month)).sort((a, b) => a.day.localeCompare(b.day) || (a.time ?? "").localeCompare(b.time ?? ""));
  const nav = "btn-secondary min-h-11 px-4 py-2 text-sm";
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => shift(-1)} className={nav}>← Mois précédent</button>
        <h2 aria-live="polite" className="min-w-40 px-2 text-center font-display text-lg font-semibold text-ink first-letter:uppercase">{monthFmt.format(new Date(`${month}-01T00:00:00Z`))}</h2>
        <button type="button" onClick={() => shift(1)} className={nav}>Mois suivant →</button>
        {month !== today.slice(0, 7) && <button type="button" onClick={() => setMonth(today.slice(0, 7))} className={`${link} min-h-11 px-2 text-sm`}>Revenir à ce mois-ci</button>}
      </div>
      <Loadable load={appts} label="Chargement du calendrier">
        {({ list, failed }) => {
          const items = build(list);
          const days = [...new Set(items.map((x) => x.day))];
          return <>{failed && <p role="alert" className="mb-3 rounded-xl bg-[#fff4e5] px-4 py-3 text-sm text-[#6b3d00]">Les rendez-vous n'ont pas pu être chargés. <button type="button" className="font-semibold underline underline-offset-4" onClick={() => appts.reload()}>Réessayer</button></p>}{items.length === 0 ? <p className={empty}>Rien de prévu ce mois-ci : aucune échéance, aucune tâche datée, aucun rendez-vous confirmé.</p> : (
            <ol className="space-y-3">
              {days.map((day) => (
                <li key={day} className={`${box} sm:grid sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4`}>
                  <h3 className="mb-2 text-sm font-semibold text-ink first-letter:uppercase sm:mb-0 sm:pt-2.5">
                    {dayLong.format(new Date(`${day}T00:00:00Z`))}
                    {day === today ? <span className={`${pill} ml-2 bg-navy text-white`}>Aujourd'hui</span> : day < today ? <span className="mt-0.5 block text-xs font-medium text-[#a3261f]">Passé</span> : day === addDays(today, 1) ? <span className="mt-0.5 block text-xs font-medium text-muted">Demain</span> : null}
                  </h3>
                  <ul className="divide-y divide-line">
                    {items.filter((x) => x.day === day).map((x) => (
                      <li key={x.key}>
                        <button type="button" onClick={() => openDossier(x.dossierId, x.focus)} className="flex min-h-12 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-1 py-2 text-left hover:bg-sky-50">
                          <span className={`${pill} shrink-0 ${KIND_PILL[x.kind]}`}>{x.kind}{x.time ? ` · ${x.time}` : ""}</span>
                          <span className="min-w-0 flex-1 basis-48"><span className="block truncate text-sm font-semibold text-ink">{x.title}</span><span className="block truncate text-xs text-muted">{x.sub}</span></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}</>;
        }}
      </Loadable>
      <p className="mt-3 text-xs text-muted">Échéances des dossiers en cours, tâches ouvertes datées et rendez-vous confirmés par le cabinet. Aucun calendrier externe n'est relié.</p>
    </div>
  );
}
