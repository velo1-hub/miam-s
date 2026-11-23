"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, LoadError, VERDICT, fmtDate, type Dossier, type Receipt } from "../shared";
import { Dialog, Loadable, NO_RECEIPT_FILTER, RECEIPT_CAP, RECEIPT_STATUS, chip, dayOf, empty, isTyping, link, money, pill, plural, rows, smallBtn, todayISO, useLoad, warnPill, openFile, type OpenDossier, type PatchReceipt, type ReceiptUi, type ShowReceipts, type Store } from "./common";
import { confirmedTotals, dollarsText, duplicatesOf, flagsOf, parseDollars, pretaxCents, receiptsCsv, type Flag } from "./receiptcheck";

/* ───────────── Outils ───────────── */
/** Notes proposées en un clic. Le texte reste modifiable avant la décision. */
export const NOTE_SUGGESTIONS = ["Ajouté à vos dépenses d'entreprise.", "Dépense personnelle, non déductible.", "Il nous faut la facture détaillée.", "Photo illisible. Merci de reprendre le reçu en photo."];
const PAGE = 30;
const STATUS_PILL: Record<Receipt["status"], string> = { a_verifier: warnPill, valide: `${pill} bg-[#e6f4ea] text-[#1e5b2e]`, refuse: `${pill} bg-[#eef0f6] text-ink` };
const cents = (c: number | null) => (c == null ? "Non lu" : money.format(c / 100));
const vendorOf = (r: Pick<Receipt, "vendor">) => r.vendor?.trim() || "Commerçant non lu";
/** Mois d'un reçu (AAAA-MM) : celui de la date lue ; à défaut, celui de l'envoi (heure de Montréal). */
export const monthOf = (r: Pick<Receipt, "receipt_date" | "created_at">) => (r.receipt_date ?? dayOf(r.created_at)).slice(0, 7);
const monthFmt = new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric", timeZone: "UTC" });
const monthLabel = (m: string) => { const t = Date.parse(`${m}-01T00:00:00Z`); return Number.isFinite(t) ? monthFmt.format(t) : m; };

/** Liens temporaires des aperçus, gardés un moment pour ne pas les redemander à chaque affichage. Un échec est réessayé après une minute. */
const urlCache = new Map<string, { url: string | null; at: number }>();
async function signedUrl(path: string): Promise<string | null> {
  const hit = urlCache.get(path);
  if (hit && Date.now() - hit.at < (hit.url ? 50 * 60000 : 60000)) return hit.url;
  let url: string | null = null;
  try { url = (await supabase().storage.from("documents").createSignedUrl(path, 3600)).data?.signedUrl ?? null; } catch { url = null; }
  urlCache.set(path, { url, at: Date.now() });
  return url;
}

/* ───────────── Aperçu et visionneuse ───────────── */
/** Vignette du reçu. Avec un aperçu : ouvre la visionneuse. Sans aperçu : tente d'ouvrir le fichier, comme dans Documents. */
function Thumb({ r, onView }: { r: Receipt; onView: (url: string) => void }) {
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let on = true;
    setUrl(undefined);
    signedUrl(r.path).then((u) => { if (on) setUrl(u); });
    return () => { on = false; };
  }, [r.path]);
  return (
    <button type="button" data-thumb onClick={() => (url ? onView(url) : openFile(r.path))} aria-label={`${url ? "Agrandir" : "Ouvrir"} la photo du reçu, ${vendorOf(r)}`} className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#8a8ea3] bg-[#f4f5fa] text-center text-xs leading-tight font-medium text-ink hover:border-navy">
      {url
        // eslint-disable-next-line @next/next/no-img-element -- lien temporaire du stockage privé : pas d'optimisation d'image possible.
        ? <img src={url} alt="" loading="lazy" onError={() => setUrl(null)} className="h-full w-full object-cover" />
        : <span className="px-1.5">{url === undefined ? "Aperçu…" : <>Ouvrir<br />la photo</>}</span>}
    </button>
  );
}

const ZOOMS = [1, 1.5, 2, 3, 4];
/** Photo du reçu en grand, avec zoom. L'image défile dans son cadre ; aucun effet d'animation. */
function Viewer({ r, url, onClose }: { r: Receipt; url: string; onClose: () => void }) {
  const [z, setZ] = useState(0);
  return (
    <Dialog title={`Reçu : ${vendorOf(r)}`} onClose={onClose} wide>
      {() => (
        <div onKeyDown={(e) => { if (e.key === "+" || e.key === "=") setZ((i) => Math.min(ZOOMS.length - 1, i + 1)); else if (e.key === "-") setZ((i) => Math.max(0, i - 1)); }}>
          <div role="group" aria-label="Zoom de la photo" className="mb-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setZ((i) => Math.max(0, i - 1))} disabled={z === 0} className={`${smallBtn} disabled:opacity-50`}>Réduire</button>
            <button type="button" onClick={() => setZ((i) => Math.min(ZOOMS.length - 1, i + 1))} disabled={z === ZOOMS.length - 1} className={`${smallBtn} disabled:opacity-50`}>Agrandir</button>
            <span role="status" aria-live="polite" data-zoom className="min-w-14 text-sm font-semibold text-ink">{ZOOMS[z] * 100} %</span>
            <button type="button" onClick={() => openFile(r.path)} className={`${link} inline-flex min-h-11 items-center px-2 text-sm`}>Ouvrir dans un nouvel onglet</button>
          </div>
          <div tabIndex={0} aria-label="Photo du reçu. Défilez pour voir toute l'image." className="max-h-[62svh] overflow-auto rounded-xl border border-line bg-[#f4f5fa]">
            {/* eslint-disable-next-line @next/next/no-img-element -- lien temporaire du stockage privé. */}
            <img src={url} alt={`Photo du reçu envoyé le ${fmtDate(r.created_at, "fr")}`} style={{ width: `${ZOOMS[z] * 100}%`, maxWidth: "none" }} className="block" />
          </div>
          <p className="mt-2 text-xs text-muted">Touches + et − pour le zoom. Échap ferme la fenêtre.</p>
        </div>
      )}
    </Dialog>
  );
}

/* ───────────── Un reçu de la file ───────────── */
type Decide = (r: Receipt, status: Receipt["status"]) => void;
const lab = "mb-1 block text-xs font-semibold text-ink";
const fld = "field min-h-11 px-3 py-2 text-sm";
const unread = <span className="font-semibold text-[#8a4b00]"> · Non lu</span>;

function Row({ r, d, flags, active, note, setNote, onSelect, patch, decide, onView, openDossier }: {
  r: Receipt; d: Dossier | undefined; flags: Flag[]; active: boolean; note: string; setNote: (v: string) => void; onSelect: () => void;
  patch: PatchReceipt; decide: Decide; onView: (url: string) => void; openDossier: OpenDossier;
}) {
  const [err, setErr] = useState("");
  /** Enregistre une valeur lue corrigée par le cabinet ; « Annuler » rétablit l'ancienne. */
  const edit = <K extends "vendor" | "receipt_date" | "total_cents" | "gst_cents" | "qst_cents" | "category">(k: K, v: Receipt[K], what: string) => {
    const before = r[k];
    if (v === before) return;
    void patch(r.id, { [k]: v } as Partial<Receipt>, { ok: `${what} : enregistré.`, undo: () => { void patch(r.id, { [k]: before } as Partial<Receipt>, { ok: `${what} : valeur précédente rétablie.` }); } });
  };
  const amount = (k: "total_cents" | "gst_cents" | "qst_cents", what: string) => (raw: string) => {
    const v = parseDollars(raw);
    if (v === undefined) { setErr(`${what} : montant illisible. Écrivez par exemple 85,50. Laissez vide si le montant n'est pas lisible.`); return; }
    setErr("");
    edit(k, v, what);
  };
  const text = (k: "vendor" | "category", what: string) => (raw: string) => edit(k, raw.trim() || null, what);
  const base = pretaxCents(r);
  const id = (k: string) => `rc-${k}-${r.id}`;
  const money3: ["total_cents" | "gst_cents" | "qst_cents", string, string][] = [["total_cents", "Total ($)", "Total"], ["gst_cents", "TPS ($)", "TPS"], ["qst_cents", "TVQ ($)", "TVQ"]];
  const decided = r.status !== "a_verifier";
  const dirty = decided && note.trim() !== r.staff_note;
  return (
    <li data-receipt={r.id} data-status={r.status} tabIndex={-1} aria-current={active ? "true" : undefined} onFocusCapture={onSelect} onPointerDown={onSelect} className="scroll-mt-24 rounded-2xl border border-[#e6e8f2] bg-white p-4 outline-offset-2 aria-[current=true]:border-navy aria-[current=true]:shadow-[inset_4px_0_0_0_var(--color-navy)] sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <Thumb r={r} onView={onView} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <h3 className="min-w-0 font-semibold break-words text-ink">{d?.client_name ?? "Dossier introuvable"}</h3>
            <span data-status-pill className={`${STATUS_PILL[r.status]} shrink-0`}>{RECEIPT_STATUS[r.status]}</span>
          </div>
          <p className="text-sm text-muted">{d && <><button type="button" onClick={() => openDossier(d.id)} className={`${link} text-left`}>{d.title}</button> · </>}Envoyé le {fmtDate(r.created_at, "fr")}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink"><span className="font-semibold">Question du client : </span>{r.question.trim() ? `« ${r.question.trim()} »` : <span className="text-muted">aucune question jointe.</span>}</p>
        </div>
      </div>

      {flags.length > 0 && (
        <ul aria-label="Points à revérifier" className="mt-3 space-y-1.5">
          {flags.map((f) => <li key={f.code} data-flag={f.code} className="rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]"><strong className="font-semibold">{f.label}.</strong> {f.detail}</li>)}
        </ul>
      )}

      <fieldset className="mt-3 min-w-0">
        <legend className="mb-2 text-sm font-semibold text-ink">Valeurs lues sur la photo <span className="font-normal text-muted">(à corriger au besoin)</span></legend>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3 xl:grid-cols-6">
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <label htmlFor={id("vendor")} className={lab}>Commerçant{r.vendor == null && unread}</label>
            <input id={id("vendor")} key={r.vendor ?? ""} defaultValue={r.vendor ?? ""} maxLength={160} placeholder="Non lu" autoComplete="off" className={fld} onBlur={(e) => text("vendor", "Commerçant")(e.target.value)} />
          </div>
          <div className="col-span-2 min-w-0 min-[26rem]:col-span-1">
            <label htmlFor={id("date")} className={lab}>Date du reçu{r.receipt_date == null && unread}</label>
            <input id={id("date")} key={r.receipt_date ?? ""} type="date" defaultValue={r.receipt_date ?? ""} className={fld} onBlur={(e) => { if (e.target.validity.valid) edit("receipt_date", e.target.value || null, "Date du reçu"); }} />
          </div>
          {money3.map(([k, label, what]) => (
            <div key={k} className="min-w-0">
              <label htmlFor={id(k)} className={lab}>{label}{r[k] == null && unread}</label>
              <input id={id(k)} key={r[k] ?? ""} inputMode="decimal" defaultValue={dollarsText(r[k])} placeholder="Non lu" autoComplete="off" className={fld} onBlur={(e) => amount(k, what)(e.target.value)} />
            </div>
          ))}
          <div className="min-w-0">
            <label htmlFor={id("category")} className={lab}>Catégorie{r.category == null && unread}</label>
            <input id={id("category")} key={r.category ?? ""} defaultValue={r.category ?? ""} maxLength={80} placeholder="Non lue" list="rc-categories" autoComplete="off" className={fld} onBlur={(e) => text("category", "Catégorie")(e.target.value)} />
          </div>
        </div>
        <p role="alert" className={err ? "mt-2 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{err}</p>
        <p className="mt-1.5 text-xs text-muted">Chaque valeur s'enregistre quand vous quittez le champ.{base != null && base > 0 ? ` Avant taxes, par calcul (total moins taxes) : ${money.format(base / 100)}.` : ""}</p>
      </fieldset>

      <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:items-start">
        <section aria-label="Indication automatique" className="min-w-0 rounded-xl border border-[#dcd6fb] bg-[#f5f3ff] p-3.5">
          <h4 className="text-sm font-semibold text-[#43308f]">Indication automatique (à vérifier)</h4>
          {r.ai_verdict || r.ai_note.trim() ? (
            <>
              {r.ai_verdict && <p data-verdict={r.ai_verdict} className="mt-1 font-semibold text-ink">{VERDICT[r.ai_verdict]?.fr ?? r.ai_verdict}</p>}
              {r.ai_note.trim() && <p className="mt-1 text-sm leading-relaxed text-ink">{r.ai_note}</p>}
            </>
          ) : <p className="mt-1 text-sm text-ink">Aucune indication pour ce reçu.</p>}
          <p className="mt-2 text-xs text-ink/80">Premier avis produit par une IA à partir de la photo. Il peut être faux. Seul le cabinet décide.</p>
        </section>

        <section aria-label="Décision du cabinet" className="min-w-0 rounded-xl border border-line p-3.5">
          <h4 className="text-sm font-semibold text-ink">Décision du cabinet</h4>
          <p id={id("seen")} className="mt-0.5 text-xs text-ink/80">Le client voit la décision et la note dans son espace.</p>
          {decided && <p data-decision className="mt-2 text-sm text-ink"><span className="font-semibold">{RECEIPT_STATUS[r.status]}.</span> {r.staff_note ? `Note vue par le client : « ${r.staff_note} »` : "Aucune note au client."}</p>}
          <label htmlFor={id("note")} className={`${lab} mt-2.5`}>Note au client (facultative)</label>
          <textarea id={id("note")} data-note rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} aria-describedby={id("seen")} className={`${fld} resize-y`} />
          <div role="group" aria-label="Notes proposées" className="mt-2 flex flex-wrap gap-1.5">
            {NOTE_SUGGESTIONS.map((s) => <button key={s} type="button" data-suggest aria-pressed={note === s} onClick={() => setNote(s)} className="min-h-10 rounded-full border border-[#8a8ea3] bg-white px-3 py-1.5 text-left text-xs font-medium text-ink hover:border-navy aria-pressed:border-navy aria-pressed:bg-sky-100">{s}</button>)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {dirty && <button type="button" data-act="note" onClick={() => decide(r, r.status)} className="btn-primary min-h-11 px-5 py-2 text-sm">Enregistrer la note</button>}
            {r.status !== "valide" && <button type="button" data-act="valide" aria-keyshortcuts="c" title="Raccourci : touche C" onClick={() => decide(r, "valide")} className={decided ? smallBtn : "btn-primary min-h-11 px-5 py-2 text-sm"}>Confirmer</button>}
            {r.status !== "refuse" && <button type="button" data-act="refuse" aria-keyshortcuts="r" title="Raccourci : touche R" onClick={() => decide(r, "refuse")} className={smallBtn}>Ne pas retenir</button>}
            {decided && <button type="button" data-act="a_verifier" onClick={() => decide(r, "a_verifier")} className={`${link} inline-flex min-h-11 items-center px-2 text-sm`}>Remettre à vérifier</button>}
          </div>
        </section>
      </div>
    </li>
  );
}

/* ───────────── File de révision ───────────── */
const STATUS_TABS: [ReceiptUi["status"], string][] = [["a_verifier", "À vérifier"], ["valide", "Confirmés"], ["refuse", "Non retenus"], ["tous", "Tous"]];
const kbd = "rounded-md border border-[#c9cde0] bg-[#f4f5fa] px-1.5 py-0.5 font-sans text-xs font-semibold text-ink";

export function Receipts({ store, ui, setUi, patch, openDossier, retry }: { store: Store; ui: ReceiptUi; setUi: (f: (u: ReceiptUi) => ReceiptUi) => void; patch: PatchReceipt; openDossier: OpenDossier; retry: () => void }) {
  const byId = useMemo(() => new Map(store.dossiers.map((d) => [d.id, d])), [store.dossiers]);
  const all = useMemo(() => store.receipts.filter((r) => byId.has(r.dossier_id)), [store.receipts, byId]);
  // Doublons et signalements : calculés sur tous les reçus chargés, pas sur la liste filtrée.
  const flags = useMemo(() => { const dups = duplicatesOf(all), today = todayISO(); return new Map(all.map((r) => [r.id, flagsOf(r, dups, today)])); }, [all]);
  const clients = useMemo(() => [...new Map(all.map((r) => { const d = byId.get(r.dossier_id)!; return [d.client_email, d.client_name] as const; })).entries()].sort((a, b) => a[1].localeCompare(b[1], "fr")), [all, byId]);
  const months = useMemo(() => [...new Set(all.map(monthOf))].sort().reverse(), [all]);
  const categories = useMemo(() => [...new Set(all.map((r) => r.category?.trim() ?? "").filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), [all]);
  // Filtres autres que le statut : les décomptes des onglets en tiennent compte.
  const scoped = useMemo(() => all.filter((r) => (!ui.dossier || r.dossier_id === ui.dossier) && (!ui.client || byId.get(r.dossier_id)!.client_email === ui.client) && (!ui.month || monthOf(r) === ui.month)), [all, byId, ui.dossier, ui.client, ui.month]);
  const shown = useMemo(() => scoped.filter((r) => ui.status === "tous" || r.status === ui.status).sort((a, b) => b.created_at.localeCompare(a.created_at)), [scoped, ui.status]);
  const count = (s: ReceiptUi["status"]) => (s === "tous" ? scoped.length : scoped.filter((r) => r.status === s).length);

  const [limit, setLimit] = useState(PAGE);
  useEffect(() => { setLimit(PAGE); }, [ui.status, ui.client, ui.dossier, ui.month]);
  const page = shown.slice(0, limit);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const noteOf = (r: Receipt) => notes[r.id] ?? r.staff_note;
  const [view, setView] = useState<{ r: Receipt; url: string } | null>(null);

  // Reçu actif : suivi par identifiant ; s'il quitte la liste (décision prise), le suivant prend sa place au même rang.
  const [active, setActive] = useState<string | null>(ui.focus);
  const at = useRef(0);
  const found = page.findIndex((r) => r.id === active);
  if (found >= 0) at.current = found;
  const cur = found >= 0 ? page[found] : page[Math.min(at.current, page.length - 1)] ?? null;

  const reveal = (id: string) => window.setTimeout(() => {
    const el = document.querySelector<HTMLElement>(`[data-receipt="${CSS.escape(id)}"]`);
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest" });
  }, 0);
  // Arrivée depuis un dossier ou la recherche : le reçu demandé devient actif, à l'écran.
  useEffect(() => {
    if (!ui.focus) return;
    const id = ui.focus;
    setActive(id);
    const idx = shown.findIndex((r) => r.id === id);
    if (idx >= limit) setLimit(idx + 1);
    const t = reveal(id);
    setUi((u) => (u.focus === id ? { ...u, focus: null } : u));
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne réagit qu'à un nouveau reçu demandé.
  }, [ui.focus]);

  const live = useRef({ page, cur, notes });
  live.current = { page, cur, notes };
  /** Décision du cabinet, avec la note du champ. « Annuler » rétablit le statut et la note précédents. */
  const decide: Decide = useCallback((r, status) => {
    const before = { status: r.status, staff_note: r.staff_note };
    // Remis à vérifier, un reçu n'a plus de décision : la note au client est retirée avec elle.
    const next = { status, staff_note: status === "a_verifier" ? "" : (live.current.notes[r.id] ?? r.staff_note).trim().slice(0, 500) };
    if (next.status === before.status && next.staff_note === before.staff_note) return;
    const who = vendorOf(r);
    const ok = status === before.status ? "Note au client enregistrée." : status === "valide" ? `Reçu confirmé : ${who}. Le client voit la décision.` : status === "refuse" ? `Reçu non retenu : ${who}. Le client voit la décision.` : `Reçu remis à vérifier : ${who}.${before.staff_note ? " La note au client est retirée." : ""}`;
    void patch(r.id, next, { ok, undo: () => { void patch(r.id, before, { ok: "Décision annulée. Le reçu retrouve son état précédent." }); } });
  }, [patch]);

  // Clavier : J, K ou les flèches changent de reçu ; C confirme, R ne retient pas. Rien pendant la saisie ni quand une fenêtre est ouverte.
  useEffect(() => {
    let g = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || document.querySelector("dialog[open],[role=dialog]")) { g = 0; return; }
      const k = e.key.toLowerCase();
      // « g » puis une lettre change de section (voir Dashboard) : cette lettre ne doit pas agir ici.
      if (g && Date.now() - g < 1500) { g = 0; return; }
      if (k === "g") { g = Date.now(); return; }
      const { page, cur } = live.current;
      const step = (n: number) => {
        if (!page.length) return;
        e.preventDefault();
        const i = cur ? page.findIndex((r) => r.id === cur.id) : -1;
        const next = page[Math.max(0, Math.min(page.length - 1, i + n))];
        setActive(next.id);
        reveal(next.id);
      };
      if (k === "j" || e.key === "ArrowDown") step(1);
      else if (k === "k" || e.key === "ArrowUp") step(-1);
      else if ((k === "c" || k === "r") && cur && !e.repeat) { e.preventDefault(); setActive(cur.id); decide(cur, k === "c" ? "valide" : "refuse"); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [decide]);

  if (!store.receiptsOk) return <div><p className="mb-3 text-sm text-ink">Les reçus n'ont pas pu être lus. Le reste du tableau de bord fonctionne.</p><LoadError lang="fr" retry={retry} /></div>;
  const scope = byId.get(ui.dossier);
  const filtered = ui.dossier || ui.client || ui.month;
  return (
    <div>
      <p className="mb-4 max-w-3xl rounded-2xl border border-[#e6e8f2] bg-white px-4 py-3 text-sm leading-relaxed text-ink">
        <strong className="font-semibold">Seul le cabinet décide.</strong> L'indication automatique n'est qu'un premier avis, à vérifier. Le client voit votre décision et votre note dans son espace.
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-x-3 gap-y-2">
        <div role="group" aria-label="Reçus affichés" className="flex flex-wrap gap-1">
          {STATUS_TABS.map(([k, l]) => <button key={k} type="button" data-tab={k} aria-pressed={ui.status === k} onClick={() => setUi((u) => ({ ...u, status: k }))} className={chip}>{l} ({count(k)})</button>)}
        </div>
        <div className="min-w-0 flex-1 basis-40 sm:max-w-60">
          <label htmlFor="rc-client" className="sr-only">Filtrer par client</label>
          <select id="rc-client" value={ui.client} onChange={(e) => setUi((u) => ({ ...u, client: e.target.value, dossier: "" }))} className={fld}>
            <option value="">Tous les clients</option>
            {clients.map(([email, name]) => <option key={email} value={email}>{name}</option>)}
          </select>
        </div>
        <div className="min-w-0 flex-1 basis-40 sm:max-w-52">
          <label htmlFor="rc-month" className="sr-only">Filtrer par mois</label>
          <select id="rc-month" value={ui.month} onChange={(e) => setUi((u) => ({ ...u, month: e.target.value }))} className={fld}>
            <option value="">Tous les mois</option>
            {[...new Set([...months, ui.month].filter(Boolean))].map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        {filtered && <button type="button" onClick={() => setUi((u) => ({ ...NO_RECEIPT_FILTER, status: u.status }))} className={`${link} inline-flex min-h-11 items-center px-1 text-sm`}>Retirer les filtres</button>}
      </div>
      {scope && <p data-scope className="mb-3 text-sm text-ink">Reçus du dossier <button type="button" onClick={() => openDossier(scope.id)} className={link}>{scope.client_name}, {scope.title}</button> seulement.</p>}
      <p role="status" aria-live="polite" className="sr-only">{plural(shown.length, "reçu affiché", "reçus affichés")}</p>

      {shown.length === 0 ? (
        <p className={empty}>{all.length === 0 ? "Aucun reçu pour l'instant. Les clients envoient leurs reçus en photo depuis leur espace." : ui.status === "a_verifier" ? (filtered ? "Aucun reçu à vérifier avec ces filtres." : "Aucun reçu à vérifier. Tout est traité.") : "Aucun reçu ne correspond à ces filtres."}</p>
      ) : (
        <>
          <p className="mb-2 hidden text-xs text-muted lg:block">Clavier : <kbd className={kbd}>J</kbd> ou <kbd className={kbd}>↓</kbd> reçu suivant, <kbd className={kbd}>K</kbd> ou <kbd className={kbd}>↑</kbd> précédent, <kbd className={kbd}>C</kbd> confirmer, <kbd className={kbd}>R</kbd> ne pas retenir. Le reçu actif porte un trait marine. Chaque décision peut être annulée.</p>
          <ul aria-label="Reçus, du plus récent au plus ancien" className="space-y-3">
            {page.map((r) => <Row key={r.id} r={r} d={byId.get(r.dossier_id)} flags={flags.get(r.id) ?? []} active={cur?.id === r.id} note={noteOf(r)} setNote={(v) => setNotes((n) => ({ ...n, [r.id]: v }))} onSelect={() => setActive(r.id)} patch={patch} decide={decide} onView={(url) => setView({ r, url })} openDossier={openDossier} />)}
          </ul>
          {shown.length > page.length && <button type="button" onClick={() => setLimit((n) => n + PAGE)} className={`${smallBtn} mt-4`}>Afficher {Math.min(PAGE, shown.length - page.length)} de plus ({shown.length - page.length} restants)</button>}
        </>
      )}
      <datalist id="rc-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      {view && <Viewer r={view.r} url={view.url} onClose={() => setView(null)} />}
      <p className="mt-4 text-xs text-muted">Les plus récents d'abord{store.receipts.length >= RECEIPT_CAP ? ` ; seuls les ${RECEIPT_CAP} derniers reçus sont chargés` : ""}. Le mois est celui de la date lue sur le reçu ; à défaut, celui de l'envoi. Points à revérifier calculés sur place, sans IA : TPS de 5 % et TVQ de 9,975 % du montant avant taxes (écart toléré de 2 cents), total, date dans le futur, doublons probables (même commerçant, même total et même date dans le même dossier).</p>
    </div>
  );
}

/* ───────────── Carte « Reçus » de la fiche d'un dossier ───────────── */
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "dossier";

export function DossierReceipts({ d, onQueue }: { d: Dossier; onQueue?: ShowReceipts }) {
  // Lus pour ce dossier seulement : les totaux et l'export ne dépendent pas de la liste récente du tableau de bord.
  const load = useLoad(() => rows<Receipt>(supabase().from("receipts").select("*").eq("dossier_id", d.id).order("created_at", { ascending: false }).limit(5000)), d.id);
  const exportCsv = (list: Receipt[]) => {
    // Le BOM fait lire les accents correctement par les tableurs.
    const blob = new Blob(["﻿" + receiptsCsv(list)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `recus-confirmes-${slug(d.client_name)}${d.tax_year ? `-${d.tax_year}` : ""}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Card title="Reçus">
      <p className="-mt-2 mb-3 text-xs text-muted">Reçus photographiés par le client. Le client voit la décision et la note du cabinet dans son espace.</p>
      <Loadable load={load} label="Chargement des reçus" rows={1}>
        {(list) => {
          if (list.length === 0) return <p className="text-sm text-muted">Aucun reçu pour ce dossier.</p>;
          const n = (s: Receipt["status"]) => list.filter((r) => r.status === s).length;
          const t = confirmedTotals(list, d.tax_year ?? null);
          const period = d.tax_year ? `datés de ${d.tax_year}` : "toutes dates confondues";
          return (
            <>
              <dl data-receipt-counts className="grid grid-cols-3 gap-2 text-center">
                {([["a_verifier", "À vérifier", "text-[#8a4b00]"], ["valide", n("valide") > 1 ? "Confirmés" : "Confirmé", "text-[#1e5b2e]"], ["refuse", n("refuse") > 1 ? "Non retenus" : "Non retenu", "text-ink"]] as const).map(([k, l, tone]) => (
                  <div key={k} className="flex flex-col-reverse rounded-xl bg-[#f5f7fb] px-2 py-2.5">
                    <dt className="text-xs text-ink/80">{l}</dt>
                    <dd data-count={k} className={`font-display text-xl font-bold ${tone}`}>{n(k)}</dd>
                  </div>
                ))}
              </dl>

              <h4 className="mt-4 text-sm font-semibold text-ink">Reçus confirmés {period}</h4>
              {t.count === 0 ? <p data-totals="none" className="mt-1 text-sm text-muted">Aucun reçu confirmé {d.tax_year ? `daté de ${d.tax_year}` : "pour l'instant"}.</p> : (
                <dl data-totals className="mt-1.5 grid grid-cols-3 gap-2">
                  {([["Total", t.total], ["TPS", t.gst], ["TVQ", t.qst]] as const).map(([l, v]) => (
                    <div key={l} className="flex flex-col-reverse rounded-xl border border-line px-3 py-2">
                      <dt className="text-xs text-ink/80">{l}</dt>
                      <dd className="font-semibold break-words text-ink">{money.format(v / 100)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-1.5 text-xs text-muted">
                {t.count > 0 && `Somme de ${plural(t.count, "reçu confirmé", "reçus confirmés")}. Les reçus à vérifier ou non retenus ne comptent pas. Une taxe non lue compte pour zéro.`}
                {t.noTotal > 0 && ` ${plural(t.noTotal, "reçu confirmé n'a pas de total lu", "reçus confirmés n'ont pas de total lu")}.`}
                {t.otherYears > 0 && ` ${plural(t.otherYears, "reçu confirmé daté d'une autre année n'est pas compté", "reçus confirmés datés d'une autre année ne sont pas comptés")}.`}
                {t.undated > 0 && ` ${plural(t.undated, "reçu confirmé sans date lue n'est pas compté", "reçus confirmés sans date lue ne sont pas comptés")}.`}
              </p>

              <h4 className="mt-4 text-sm font-semibold text-ink">{list.length > 5 ? "Cinq derniers reçus" : "Derniers reçus"}</h4>
              <ul data-receipt-latest className="mt-1 divide-y divide-line">
                {list.slice(0, 5).map((r) => {
                  const inner = (
                    <>
                      <span className="min-w-0 flex-1 basis-40"><span className="block truncate text-sm font-medium text-ink">{vendorOf(r)}</span><span className="block text-xs text-muted">{r.receipt_date ? fmtDate(r.receipt_date, "fr") : "Date non lue"} · {r.total_cents == null ? "total non lu" : cents(r.total_cents)}</span></span>
                      <span className={`${STATUS_PILL[r.status]} shrink-0`}>{RECEIPT_STATUS[r.status]}</span>
                    </>
                  );
                  return <li key={r.id}>{onQueue ? <button type="button" onClick={() => onQueue({ dossier: d.id, status: "tous", focus: r.id })} aria-label={`Ouvrir dans la file : ${vendorOf(r)}, ${RECEIPT_STATUS[r.status]}`} className="flex min-h-12 w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg py-2 text-left hover:bg-sky-50">{inner}</button> : <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">{inner}</div>}</li>;
                })}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
                {onQueue && <button type="button" data-receipt-queue onClick={() => onQueue({ dossier: d.id, status: n("a_verifier") ? "a_verifier" : "tous" })} className={smallBtn}>{n("a_verifier") ? `Vérifier les reçus de ce dossier (${n("a_verifier")})` : `Voir les reçus de ce dossier (${list.length})`}</button>}
                {n("valide") > 0 && <button type="button" data-receipt-csv onClick={() => exportCsv(list)} className={smallBtn}>Exporter les reçus confirmés (CSV)</button>}
                {n("valide") > 0 && <p className="basis-full text-xs text-muted">L'export contient tous les reçus confirmés du dossier ({n("valide")}), toutes dates confondues, avec la date de chacun. Montants en dollars.</p>}
              </div>
            </>
          );
        }}
      </Loadable>
    </Card>
  );
}
