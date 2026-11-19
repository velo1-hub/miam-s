"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode, type SetStateAction } from "react";
import { real, supabase } from "@/lib/supabase";
import { demoRole } from "@/lib/demo";
import { LoadError, Skeleton, toast, type Doc, type DocRequest, type Dossier } from "../shared";
/* ───────────── Types ───────────── */
export type Lead = {
  id: string; created_at: string; source: string; lang: string; name: string; email: string | null; phone: string | null;
  audience: string | null; topic: string | null; message: string; status: string; notes: string;
};
export type Note = { id: string; dossier_id: string; created_at: string; author: string; body: string };
export type Task = { id: string; dossier_id: string; created_at: string; label: string; assignee: string; due_date: string | null; done: boolean };
export type Req = DocRequest & { created_at?: string };
export type FileDoc = Doc & { request_id?: string | null };
export type Sub = { id: string; email: string; lang: string; consent_at: string; unsubscribed_at: string | null };
export type Member = { email: string; name: string; is_admin?: boolean | null };
export type Invoice = { id: string; dossier_id: string; created_at: string; label: string; amount_cents: number; status: string; pay_url: string | null; paid_at: string | null };
export type LastMsg = { dossier_id: string; created_at: string; author_role: string; author_name: string; body: string };
/** `docs` : fichiers récents des deux côtés ; `clientDocs` en est la partie déposée par les clients. `lastMsgs` : dernier message de chaque dossier. */
export type Store = { dossiers: Dossier[]; leads: Lead[]; waiting: string[]; team: string[]; tasks: Task[]; docs: FileDoc[]; clientDocs: FileDoc[]; pendingReqs: string[]; invoices: Invoice[]; lastMsgs: LastMsg[] };
export type Focus = "messages" | "rdv" | "facture" | "documents";
export type OpenDossier = (id: string, focus?: Focus) => void;
export type DFilter = { scope: "a_faire" | "fermes" | "tous"; stage: string; owner: string; signal: "" | "retard" | "bientot" | "messages"; q: string };
export type DossierUi = { view: "liste" | "tableau"; current: string | null; creating: boolean; filter: DFilter };
export type PatchOpts = { ok?: string; undo?: () => void };
export type PatchDossier = (id: string, p: Partial<Dossier>, o?: PatchOpts) => Promise<boolean>;
export type PatchLead = (id: string, p: Partial<Lead>, o?: PatchOpts) => Promise<boolean>;

/* ───────────── Constantes ───────────── */
export const SECTIONS = [["aujourdhui", "Aujourd'hui"], ["prospects", "Prospects"], ["clients", "Clients"], ["dossiers", "Dossiers"], ["documents", "Documents"], ["messages", "Messages"], ["facturation", "Facturation"], ["calendrier", "Calendrier"], ["parametres", "Paramètres"]] as const;
/** Anciennes adresses (signets, cloche de notifications) : elles mènent à la section renommée. */
export const SECTION_ALIAS: Record<string, string> = { demandes: "prospects", honoraires: "facturation", reglages: "parametres" };
export type Section = (typeof SECTIONS)[number][0];
export const LEAD_STATUS: Record<string, string> = { nouveau: "Nouveau", contacte: "Contacté", rdv_a_confirmer: "Rendez-vous à confirmer", client: "Devenu client", ferme: "Refusé ou fermé" };
export const LEAD_FILTERS = [["ouverts", "À traiter"], ["nouveau", "Nouveaux"], ["rdv_a_confirmer", "RDV à confirmer"], ["client", "Devenus clients"], ["ferme", "Refusés ou fermés"], ["tous", "Tous"]] as const;
export const SOURCE: Record<string, string> = { contact: "Formulaire", clara: "Clara", telephone: "Téléphone", autre: "Autre" };
export const INVOICE_STATUS: Record<string, string> = { brouillon: "Brouillon", a_payer: "À payer", payee: "Payée", annulee: "Annulée" };
export const NO_FILTER: DFilter = { scope: "a_faire", stage: "", owner: "", signal: "", q: "" };
export const PAY_OFF = "Le paiement en ligne n'est pas encore activé.";
export const SOON_DAYS = 14;

export const pill = "rounded-full px-2.5 py-1 text-xs font-semibold";
export const warnPill = `${pill} bg-[#fff4e5] text-[#6b3d00]`;
export const latePill = `${pill} bg-[#fdecea] text-[#8f1f19]`;
export const chip = "min-h-10 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink hover:border-navy aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white";
export const link = "font-semibold text-navy underline underline-offset-4";
export const smallBtn = "btn-secondary min-h-11 px-4 py-2 text-sm";
export const removeBtn = "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#a3261f] underline underline-offset-4 hover:bg-[#fdecea]";
export const panel = "rounded-3xl border border-line bg-white p-5 sm:p-6";
export const empty = "rounded-3xl border border-line bg-white p-6 text-muted";
/** Carte blanche de la présentation : coins doux, bordure fine, fond blanc. */
export const box = "rounded-2xl border border-[#e6e8f2] bg-white p-4 sm:p-5";
/** Teintes des 5 étapes, du bleu ciel au marine. Le texte posé dessus reste lisible (voir `STAGE_INK`). */
export const STAGE_TONE = ["#d3ebf5", "#9fd4e6", "#6aa9d6", "#4a6db0", "#2a2a5c"] as const;
export const STAGE_INK = ["#1b1d33", "#1b1d33", "#1b1d33", "#ffffff", "#ffffff"] as const;
export const BUSINESS_KINDS = ["impot_societe", "etats_financiers", "tenue_de_livres"];
export const PERSONAL_KINDS = ["impot_particulier", "travailleur_autonome"];

/** Documents demandés par défaut à l'ouverture d'un dossier, selon le type de mandat (modifiable ensuite). */
export const DEFAULT_REQUESTS: Record<string, string[]> = {
  impot_particulier: ["Avis de cotisation de l'an dernier (fédéral et Québec)", "Feuillets de revenus : T4 et Relevé 1, T5 et Relevé 3, etc.", "Reçus de cotisations REER", "Reçus de frais médicaux, de dons et de frais de garde", "Relevé 31 (locataire) ou compte de taxes municipales (propriétaire)"],
  travailleur_autonome: ["Avis de cotisation de l'an dernier (fédéral et Québec)", "Revenus de l'année : factures émises ou relevé des ventes", "Dépenses de l'année, avec les reçus", "Relevés bancaires et de carte de crédit de l'entreprise", "Kilométrage et dépenses du véhicule", "Dépenses du bureau à domicile", "Acomptes provisionnels versés"],
  impot_societe: ["États financiers et déclarations de l'an dernier", "Balance de vérification et grand livre de l'exercice", "Relevés bancaires et de carte de crédit de l'exercice", "Registre des salaires et sommaires T4 et Relevé 1", "Déclarations de TPS/TVQ de l'exercice", "Contrats de prêt et de location en vigueur"],
  taxes: ["Numéros de TPS et de TVQ", "Factures de ventes de la période", "Factures d'achats et de dépenses de la période", "Relevés bancaires de la période", "Dernière déclaration produite"],
  etats_financiers: ["États financiers de l'exercice précédent", "Balance de vérification et grand livre", "Relevés bancaires et conciliations de fin d'exercice", "Liste des comptes clients et fournisseurs", "Inventaire de fin d'exercice, s'il y a lieu", "Contrats de prêt, baux et ententes importantes"],
  tenue_de_livres: ["Relevés bancaires et de carte de crédit", "Factures de ventes", "Factures d'achats et reçus de dépenses", "Registre des salaires"],
  lettre_fisc: ["La lettre ou l'avis reçu, toutes les pages", "La déclaration visée et son avis de cotisation", "Les pièces justificatives demandées dans la lettre"],
  autre: [],
};

/* ───────────── Outils ───────────── */
export const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal", year: "numeric", month: "2-digit", day: "2-digit" });
export const todayISO = () => dayFmt.format(new Date());
export const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const addDays = (iso: string, n: number) => new Date(ms(iso) + n * 86400000).toISOString().slice(0, 10);
export const daysUntil = (iso: string) => Math.round((ms(iso) - ms(todayISO())) / 86400000);
export const money = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });
export const hm = (d: Date) => new Intl.DateTimeFormat("fr-CA", { hour: "numeric", minute: "2-digit" }).format(d);
export const newId = () => crypto.randomUUID();
export const mailto = (email: string, query = "") => `mailto:${encodeURIComponent(email)}${query}`;
export const telto = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const mailQuery = (subject: string, body: string) => `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
export const origin = () => (typeof window === "undefined" ? "" : window.location.origin);
export const isOpenLead = (l: Lead) => !["client", "ferme"].includes(l.status);
export const leadMatches = (l: Lead, f: string) => (f === "tous" ? true : f === "ouverts" ? isOpenLead(l) : l.status === f);

/** Échéance en mots : « En retard de 3 j », « Aujourd'hui », « Dans 5 j ». */
export function dueInfo(iso: string): { text: string; late: boolean; soon: boolean } {
  const n = daysUntil(iso);
  if (n < 0) return { text: `En retard de ${-n} j`, late: true, soon: false };
  return { text: n === 0 ? "Aujourd'hui" : n === 1 ? "Demain" : `Dans ${n} j`, late: false, soon: n <= SOON_DAYS };
}
export const isLate = (d: Dossier) => d.status !== "ferme" && !!d.due_date && daysUntil(d.due_date) < 0;
export const isSoon = (d: Dossier) => d.status !== "ferme" && !!d.due_date && daysUntil(d.due_date) >= 0 && daysUntil(d.due_date) <= SOON_DAYS;

export async function rows<T>(q: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw error;
  return (data as T[] | null) ?? [];
}

/** Chargement avec trois états distincts : en cours (data null), erreur, prêt. `set` sert aux mises à jour optimistes. */
export function useLoad<T>(fn: () => Promise<T>, key = "") {
  const [state, setState] = useState<{ data: T | null; error: boolean }>({ data: null, error: false });
  const f = useRef(fn);
  f.current = fn;
  const seq = useRef(0);
  const has = useRef(false);
  const reload = useCallback((announce = false) => {
    const n = ++seq.current;
    if (!has.current) setState({ data: null, error: false });
    f.current().then(
      (data) => { if (n !== seq.current) return; has.current = true; setState({ data, error: false }); if (announce) toast("Données à jour."); },
      () => { if (n !== seq.current) return; if (has.current) toast("Actualisation impossible. Vérifiez votre connexion.", "error"); else setState({ data: null, error: true }); },
    );
  }, []);
  useEffect(() => { reload(); return () => { seq.current++; }; }, [reload, key]);
  const set = useCallback((u: SetStateAction<T | null>) => setState((s) => ({ ...s, data: typeof u === "function" ? (u as (p: T | null) => T | null)(s.data) : u })), []);
  return { data: state.data, error: state.error, reload, set };
}

/* ───────────── Petits composants ───────────── */
export function SavedAt({ at }: { at: Date | null }) {
  return <p role="status" aria-live="polite" className="mt-1 min-h-5 text-xs text-muted">{at ? `Enregistré à ${hm(at)}` : ""}</p>;
}

export function SectionHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Loadable<T>({ load, label, rows: n = 2, children }: { load: { data: T | null; error: boolean; reload: () => void }; label: string; rows?: number; children: (data: T) => ReactNode }) {
  if (load.data) return <>{children(load.data)}</>;
  if (load.error) return <LoadError lang="fr" retry={() => load.reload()} />;
  return <Skeleton label={label} rows={n} />;
}
/** Panneau latéral droit : Échap ferme, le focus reste dedans et revient au point de départ. */
export function Drawer({ label, returnTo, onClose, children }: { label: string; returnTo: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const opener = document.activeElement as HTMLElement | null;
    el.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close.current(); return; }
      if (e.key !== "Tab") return;
      const f = [...el.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])")].filter((x) => x.getClientRects().length > 0);
      if (!f.length) return;
      const active = document.activeElement;
      if (e.shiftKey && (active === f[0] || !el.contains(active))) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (active === f[f.length - 1] || !el.contains(active))) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      (opener?.isConnected ? opener : document.querySelector<HTMLElement>(returnTo))?.focus();
    };
  }, [returnTo]);
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-navy-950/50" aria-hidden="true" onClick={onClose} />
      <div ref={box} role="dialog" aria-modal="true" aria-label={label} className="absolute inset-y-0 right-0 w-full max-w-[68rem] overflow-y-auto bg-[#f4f6fb] shadow-[0_0_80px_-20px_rgba(23,23,58,.7)]">
        <div className="sticky top-0 z-10 border-b border-line bg-white px-4 py-2.5 sm:px-6">
          <button type="button" data-autofocus onClick={onClose} className={smallBtn}>← Retour au tableau</button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
/** Assistant IA de l'équipe : demande un brouillon au serveur. En démonstration, renvoie un exemple local. */
export const AI_OFF = "L'assistant IA n'est pas disponible pour l'instant.";
export async function askAi(dossierId: string, task: "reply" | "summary" | "relance"): Promise<string | null> {
  if (demoRole()) {
    return task === "summary"
      ? "- Dossier en cours, à l'étape indiquée ci-dessus.\n- Un document demandé est encore manquant.\n- Le client attend une confirmation du cabinet.\n- Prochaine action : relancer pour le document manquant."
      : "Bonjour,\n\nMerci pour votre message. Nous avons bien reçu vos documents. Il nous manque encore un élément pour terminer : pouvez-vous le déposer dans votre espace quand vous aurez un moment ?\n\nNous vous tenons au courant dès que votre dossier avance.";
  }
  try {
    const { data } = await real().auth.getSession();
    const res = await fetch("/api/assist/", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ dossier_id: dossierId, task }) });
    const json = res.ok ? ((await res.json()) as { text?: unknown }) : null;
    if (typeof json?.text !== "string") throw new Error("indisponible");
    return json.text;
  } catch { toast(AI_OFF, "error"); return null; }
}

/* ───────────── Présentation Pilote Fiscal : petits outils communs ───────────── */
export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
export const initials = (name: string) => name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
const TILE = [["#fde6d2", "#7a3d0c"], ["#dbe9ff", "#1f3c78"], ["#fdeccb", "#6b4a00"], ["#dff3e6", "#1e5b2e"], ["#ece6ff", "#43308f"]] as const;
/** Pastille d'initiales : la couleur dépend du nom, elle reste donc la même d'un écran à l'autre. */
export function Avatar({ name, className = "h-10 w-10 text-sm" }: { name: string; className?: string }) {
  const [bg, fg] = TILE[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TILE.length];
  return <span aria-hidden="true" style={{ background: bg, color: fg }} className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}>{initials(name)}</span>;
}
export function Eyebrow({ children, as: Tag = "h2", className = "" }: { children: ReactNode; as?: "h2" | "h3" | "p"; className?: string }) {
  return <Tag className={`pf-eyebrow ${className}`}>{children}</Tag>;
}
/** Carte de la présentation : petit titre en capitales, contenu. */
export function Box({ title, aside, children, className = "", id }: { title: string; aside?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`${box} ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3"><Eyebrow>{title}</Eyebrow>{aside}</div>
      {children}
    </section>
  );
}

const ICONS = {
  home: "M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4Z",
  prospect: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c0-3.3 2.7-5.5 6-5.5 1.2 0 2.3.3 3.2.8M18 14v6M15 17h6",
  clients: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.8c1.8.7 3 2.5 3 5.2",
  dossier: "M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z",
  document: "M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M9 13h6M9 17h6",
  message: "M4 5h16v11H9l-5 4Z",
  invoice: "M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6",
  calendar: "M4 6h16v14H4ZM4 10h16M8 3v4M16 3v4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  spark: "M12 3l1.8 5.6L19.5 10l-5.7 1.4L12 17l-1.8-5.6L4.5 10l5.7-1.4Z",
} as const;
export type IconName = keyof typeof ICONS;
export function Icon({ name, className = "h-[1.15rem] w-[1.15rem]" }: { name: IconName; className?: string }) {
  return <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={ICONS[name]} /></svg>;
}

/** Ouvre un fichier par lien temporaire. Fenêtre ouverte tout de suite (sinon Safari la bloque), adresse fixée après la réponse. */
export async function openFile(path: string) {
  const w = window.open("", "_blank");
  const { data } = await supabase().storage.from("documents").createSignedUrl(path, 120);
  if (!data?.signedUrl) { w?.close(); toast("Ce document ne peut pas être ouvert pour l'instant.", "error"); return; }
  if (w) { w.opener = null; w.location.href = data.signedUrl; } else window.location.href = data.signedUrl;
}

/** Date et heure saisies au cabinet, lues comme l'heure de Montréal quel que soit le fuseau de l'appareil. */
export function montrealISO(date: string, time: string): string | null {
  const guess = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(guess)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess));
  const v = (t: string) => Number(parts.find((x) => x.type === t)?.value);
  const shown = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"));
  return new Date(guess - (shown - guess)).toISOString();
}
export const clockFmt = new Intl.DateTimeFormat("fr-CA", { timeZone: "America/Montreal", hour: "numeric", minute: "2-digit" });
/** Jour (AAAA-MM-JJ) d'un instant, à l'heure de Montréal. */
export const dayOf = (iso: string) => (iso.length === 10 ? iso : dayFmt.format(new Date(iso)));

/** Phrase du jour, construite à partir des vrais décomptes : rien n'est inventé. */
export function daySentence(c: { review: number; prospects: number; unpaid: number; late: number; toRead: number }): string {
  const parts = [
    c.review && `${plural(c.review, "dossier", "dossiers")} à réviser.`,
    c.prospects && (c.prospects > 1 ? `${c.prospects} prospects attendent votre décision.` : "1 prospect attend votre décision."),
    c.toRead && `${plural(c.toRead, "message", "messages")} de clients à lire.`,
    c.late && `${plural(c.late, "dossier", "dossiers")} en retard.`,
    c.unpaid && `${plural(c.unpaid, "facture", "factures")} en attente de paiement.`,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "Rien ne presse aujourd'hui : aucun dossier à réviser, aucun prospect ni paiement en attente.";
}

/** À vérifier : fichier lié à une demande pas encore marquée reçue, ou fichier récent d'un client sans demande associée. */
export function docsToCheck(store: Store): FileDoc[] {
  const byId = new Map(store.dossiers.map((d) => [d.id, d]));
  const recent = addDays(todayISO(), -SOON_DAYS);
  return store.clientDocs.filter((f) => byId.has(f.dossier_id) && byId.get(f.dossier_id)!.status !== "ferme" && (f.request_id ? store.pendingReqs.includes(f.request_id) : f.created_at.slice(0, 10) >= recent));
}
/** Texte comparable : minuscules, sans accents. */
export const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Fiches clients : les dossiers regroupés par courriel. Les coordonnées venant d'un prospect ne sont pas vérifiées. */
export type Client = { email: string; name: string; dossiers: Dossier[]; lead: Lead | null };
export function groupClients(dossiers: Dossier[], leads: Lead[]): Client[] {
  const map = new Map<string, Client>();
  for (const x of dossiers) {
    const r = map.get(x.client_email) ?? { email: x.client_email, name: x.client_name, dossiers: [], lead: null };
    r.dossiers.push(x);
    map.set(x.client_email, r);
  }
  for (const x of leads) { const r = x.email ? map.get(x.email) : undefined; if (r && !r.lead) r.lead = x; }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
/** Particulier ou Entreprise : d'après le prospect d'origine, sinon d'après les types de mandat. Rien si ce n'est pas clair. */
export function clientTags(c: Client): string[] {
  const kinds = c.dossiers.map((d) => d.kind);
  const tags = new Set<string>();
  if (c.lead?.audience === "entreprise" || kinds.some((k) => BUSINESS_KINDS.includes(k))) tags.add("Entreprise");
  if (c.lead?.audience === "moi" || kinds.some((k) => PERSONAL_KINDS.includes(k))) tags.add("Particulier");
  return [...tags];
}
