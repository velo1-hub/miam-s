"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { real, supabase } from "@/lib/supabase";
import { demoRole } from "@/lib/demo";
import { AppFrame, Card, Documents, LoadError, Messages, Skeleton, KINDS, STATUSES, fmtDate, save, statusLabel, toast, type Doc, type DocRequest, type Dossier } from "./shared";

/* ───────────── Types ───────────── */
type Lead = {
  id: string; created_at: string; source: string; lang: string; name: string; email: string | null; phone: string | null;
  audience: string | null; topic: string | null; message: string; status: string; notes: string;
};
type Note = { id: string; dossier_id: string; created_at: string; author: string; body: string };
type Task = { id: string; dossier_id: string; created_at: string; label: string; assignee: string; due_date: string | null; done: boolean };
type Req = DocRequest & { created_at?: string };
type FileDoc = Doc & { request_id?: string | null };
type Sub = { id: string; email: string; lang: string; consent_at: string; unsubscribed_at: string | null };
type Member = { email: string; name: string; is_admin?: boolean | null };
type Invoice = { id: string; dossier_id: string; created_at: string; label: string; amount_cents: number; status: string; pay_url: string | null; paid_at: string | null };
type Store = { dossiers: Dossier[]; leads: Lead[]; waiting: string[]; team: string[]; tasks: Task[]; clientDocs: FileDoc[]; pendingReqs: string[] };
type DFilter = { scope: "a_faire" | "fermes" | "tous"; stage: string; owner: string; signal: "" | "retard" | "bientot" | "messages"; q: string };
type DossierUi = { view: "liste" | "tableau"; current: string | null; creating: boolean; filter: DFilter };
type PatchOpts = { ok?: string; undo?: () => void };
type PatchDossier = (id: string, p: Partial<Dossier>, o?: PatchOpts) => Promise<boolean>;
type PatchLead = (id: string, p: Partial<Lead>, o?: PatchOpts) => Promise<boolean>;

/* ───────────── Constantes ───────────── */
const SECTIONS = [["aujourdhui", "Aujourd'hui"], ["demandes", "Demandes"], ["dossiers", "Dossiers"], ["clients", "Clients"], ["honoraires", "Honoraires"], ["reglages", "Réglages"]] as const;
type Section = (typeof SECTIONS)[number][0];
const LEAD_STATUS: Record<string, string> = { nouveau: "Nouveau", contacte: "Contacté", rdv_a_confirmer: "Rendez-vous à confirmer", client: "Devenu client", ferme: "Fermé" };
const LEAD_FILTERS = [["ouverts", "À traiter"], ["nouveau", "Nouvelles"], ["rdv_a_confirmer", "RDV à confirmer"], ["client", "Devenues clients"], ["tous", "Toutes"]] as const;
const SOURCE: Record<string, string> = { contact: "Formulaire", clara: "Clara", telephone: "Téléphone", autre: "Autre" };
const INVOICE_STATUS: Record<string, string> = { brouillon: "Brouillon", a_payer: "À payer", payee: "Payée", annulee: "Annulée" };
const NO_FILTER: DFilter = { scope: "a_faire", stage: "", owner: "", signal: "", q: "" };
const PAY_OFF = "Le paiement en ligne n'est pas encore activé.";
const SOON_DAYS = 14;

const pill = "rounded-full px-2.5 py-1 text-xs font-semibold";
const warnPill = `${pill} bg-[#fff4e5] text-[#6b3d00]`;
const latePill = `${pill} bg-[#fdecea] text-[#8f1f19]`;
const chip = "min-h-10 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink hover:border-navy aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white";
const link = "font-semibold text-navy underline underline-offset-4";
const smallBtn = "btn-secondary min-h-11 px-4 py-2 text-sm";
const removeBtn = "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#a3261f] underline underline-offset-4 hover:bg-[#fdecea]";
const panel = "rounded-3xl border border-line bg-white p-5 sm:p-6";
const empty = "rounded-3xl border border-line bg-white p-6 text-muted";

/** Documents demandés par défaut à l'ouverture d'un dossier, selon le type de mandat (modifiable ensuite). */
const DEFAULT_REQUESTS: Record<string, string[]> = {
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
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal", year: "numeric", month: "2-digit", day: "2-digit" });
const todayISO = () => dayFmt.format(new Date());
const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const addDays = (iso: string, n: number) => new Date(ms(iso) + n * 86400000).toISOString().slice(0, 10);
const daysUntil = (iso: string) => Math.round((ms(iso) - ms(todayISO())) / 86400000);
const money = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });
const hm = (d: Date) => new Intl.DateTimeFormat("fr-CA", { hour: "numeric", minute: "2-digit" }).format(d);
const newId = () => crypto.randomUUID();
const mailto = (email: string, query = "") => `mailto:${encodeURIComponent(email)}${query}`;
const telto = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const mailQuery = (subject: string, body: string) => `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const origin = () => (typeof window === "undefined" ? "" : window.location.origin);
const isOpenLead = (l: Lead) => !["client", "ferme"].includes(l.status);
const leadMatches = (l: Lead, f: string) => (f === "tous" ? true : f === "ouverts" ? isOpenLead(l) : l.status === f);

/** Échéance en mots : « En retard de 3 j », « Aujourd'hui », « Dans 5 j ». */
function dueInfo(iso: string): { text: string; late: boolean; soon: boolean } {
  const n = daysUntil(iso);
  if (n < 0) return { text: `En retard de ${-n} j`, late: true, soon: false };
  return { text: n === 0 ? "Aujourd'hui" : n === 1 ? "Demain" : `Dans ${n} j`, late: false, soon: n <= SOON_DAYS };
}
const isLate = (d: Dossier) => d.status !== "ferme" && !!d.due_date && daysUntil(d.due_date) < 0;
const isSoon = (d: Dossier) => d.status !== "ferme" && !!d.due_date && daysUntil(d.due_date) >= 0 && daysUntil(d.due_date) <= SOON_DAYS;

async function rows<T>(q: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw error;
  return (data as T[] | null) ?? [];
}

/** Chargement avec trois états distincts : en cours (data null), erreur, prêt. `set` sert aux mises à jour optimistes. */
function useLoad<T>(fn: () => Promise<T>, key = "") {
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
function SavedAt({ at }: { at: Date | null }) {
  return <p role="status" aria-live="polite" className="mt-1 min-h-5 text-xs text-muted">{at ? `Enregistré à ${hm(at)}` : ""}</p>;
}

function SectionHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
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

function Loadable<T>({ load, label, rows: n = 2, children }: { load: { data: T | null; error: boolean; reload: () => void }; label: string; rows?: number; children: (data: T) => ReactNode }) {
  if (load.data) return <>{children(load.data)}</>;
  if (load.error) return <LoadError lang="fr" retry={() => load.reload()} />;
  return <Skeleton label={label} rows={n} />;
}

function SideNav({ section, go, badges }: { section: Section; go: (s: Section) => void; badges: Partial<Record<Section, [number, string]>> }) {
  const bar = useRef<HTMLElement>(null);
  // Sur petit écran, la barre défile : la section active reste visible.
  useEffect(() => {
    const el = bar.current, a = el?.querySelector<HTMLElement>("[aria-current=page]");
    if (el && a && el.scrollWidth > el.clientWidth) el.scrollTo({ left: a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2 });
  }, [section]);
  return (
    <nav ref={bar} aria-label="Sections du tableau de bord" className="glass relative -mx-4 overflow-x-auto px-3 py-2 sm:mx-0 sm:rounded-2xl lg:sticky lg:top-28 lg:self-start lg:overflow-visible lg:p-3">
      <ul className="flex gap-1 lg:flex-col">
        {SECTIONS.map(([k, l]) => {
          const b = badges[k];
          return (
            <li key={k} className="shrink-0">
              <a href={`#${k}`} aria-current={section === k ? "page" : undefined} onClick={(e) => { e.preventDefault(); go(k); }} className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-4 text-sm font-semibold whitespace-nowrap text-ink hover:bg-white/80 aria-[current=page]:bg-navy aria-[current=page]:text-white">
                {l}
                {b && b[0] > 0 && <span className={`${pill} ${section === k ? "bg-white text-navy" : "bg-navy text-white"}`}>{b[0]}<span className="sr-only"> {b[1]}</span></span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Panneau latéral droit : Échap ferme, le focus reste dedans et revient au point de départ. */
function Drawer({ label, returnTo, onClose, children }: { label: string; returnTo: string; onClose: () => void; children: ReactNode }) {
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

/* ───────────── Aujourd'hui ───────────── */
function Kpis({ items }: { items: { label: string; value: number; alert?: boolean; onClick: () => void }[] }) {
  return (
    <ul aria-label="Chiffres du jour" className="glass mb-6 grid grid-cols-2 gap-1 rounded-3xl p-2 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((k) => (
        <li key={k.label}>
          <button type="button" onClick={k.onClick} className="h-full w-full rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/80">
            <span className="block text-xs font-semibold text-ink/80">{k.label}</span>
            <span className={`mt-1 block font-display text-2xl font-bold ${k.alert && k.value > 0 ? "text-[#a3261f]" : "text-navy"}`}>{k.value}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TodayCard({ title, count, none, children }: { title: string; count: number; none: string; children: ReactNode }) {
  return (
    <Card title={title} aside={<span className={`${pill} ${count ? "bg-navy text-white" : "bg-[#eef0f6] text-ink"}`}>{count}</span>}>
      {count === 0 ? <p className="text-sm text-muted">{none}</p> : <ul className="-mx-2 divide-y divide-line">{children}</ul>}
    </Card>
  );
}

function TodayRow({ title, sub, right, onClick }: { title: string; sub: string; right?: ReactNode; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-sky-50">
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{title}</span>
          <span className="block truncate text-sm text-muted">{sub}</span>
        </span>
        {right && <span className="shrink-0 text-right text-sm">{right}</span>}
      </button>
    </li>
  );
}

function DueTag({ iso }: { iso: string }) {
  const i = dueInfo(iso);
  return <span className={i.late ? "font-semibold text-[#a3261f]" : "text-ink"}>{i.text}<span className="block text-xs font-normal text-muted">{fmtDate(iso, "fr")}</span></span>;
}

function Today({ store, staffName, openDossier, openLead, showDossiers, showLeads, completeTask, markReceived }: {
  store: Store; staffName: string; openDossier: (id: string) => void; openLead: (id: string) => void;
  showDossiers: (f: Partial<DFilter>) => void; showLeads: (f: string) => void; completeTask: (t: Task) => void; markReceived: (requestId: string) => void;
}) {
  const byId = useMemo(() => new Map(store.dossiers.map((d) => [d.id, d])), [store.dossiers]);
  const open = store.dossiers.filter((d) => d.status !== "ferme");
  const toRead = store.dossiers.filter((d) => store.waiting.includes(d.id));
  const fresh = store.leads.filter((l) => l.status === "nouveau");
  const late = open.filter(isLate);
  const due = [...late, ...open.filter(isSoon)].sort((a, b) => a.due_date!.localeCompare(b.due_date!));
  const recent = addDays(todayISO(), -SOON_DAYS);
  // À vérifier : fichier lié à une demande pas encore marquée reçue, ou fichier récent sans demande associée.
  const toCheck = store.clientDocs.filter((f) => byId.has(f.dossier_id) && byId.get(f.dossier_id)!.status !== "ferme" && (f.request_id ? store.pendingReqs.includes(f.request_id) : f.created_at.slice(0, 10) >= recent));
  const mine = store.tasks.filter((t) => !t.done && t.assignee === staffName).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  const name = (id: string) => byId.get(id)?.client_name ?? "Dossier";

  return (
    <div>
      <Kpis items={[
        { label: "Messages à lire", value: toRead.length, onClick: () => showDossiers({ scope: "tous", signal: "messages" }) },
        { label: "Nouvelles demandes", value: fresh.length, onClick: () => showLeads("nouveau") },
        { label: "RDV à confirmer", value: store.leads.filter((l) => l.status === "rdv_a_confirmer").length, onClick: () => showLeads("rdv_a_confirmer") },
        { label: "Dossiers en cours", value: open.length, onClick: () => showDossiers({}) },
        { label: "Documents attendus", value: open.filter((d) => d.status === "documents_attendus").length, onClick: () => showDossiers({ stage: "documents_attendus" }) },
        { label: "Dossiers en retard", value: late.length, alert: true, onClick: () => showDossiers({ signal: "retard" }) },
      ]} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
        <TodayCard title="Messages à lire" count={toRead.length} none="Aucun message en attente de réponse.">
          {toRead.map((d) => <TodayRow key={d.id} title={d.client_name} sub={d.title} right={<span className={warnPill}>À lire</span>} onClick={() => openDossier(d.id)} />)}
        </TodayCard>
        <TodayCard title="Nouvelles demandes" count={fresh.length} none="Aucune nouvelle demande.">
          {fresh.map((l) => <TodayRow key={l.id} title={l.name} sub={l.topic || l.message || "Sans détails"} right={<span className="text-muted">{fmtDate(l.created_at, "fr")}</span>} onClick={() => openLead(l.id)} />)}
        </TodayCard>
        <TodayCard title="Documents reçus à vérifier" count={toCheck.length} none="Aucun document à vérifier.">
          {toCheck.map((f) => (
            <li key={f.id} className="flex items-center gap-1">
              <button type="button" onClick={() => openDossier(f.dossier_id)} className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-sky-50">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{f.name}</span>
                  <span className="block truncate text-sm text-muted">{name(f.dossier_id)} · {f.request_id ? "demande en attente" : "sans demande associée"}</span>
                </span>
                <span className="shrink-0 text-sm text-muted">{fmtDate(f.created_at, "fr")}</span>
              </button>
              {f.request_id && <button type="button" onClick={() => markReceived(f.request_id!)} className={`${smallBtn} shrink-0`}>Marquer reçu</button>}
            </li>
          ))}
        </TodayCard>
        <TodayCard title={`Échéances (retards et ${SOON_DAYS} prochains jours)`} count={due.length} none="Aucune échéance proche.">
          {due.map((d) => <TodayRow key={d.id} title={d.client_name} sub={`${d.title} · ${statusLabel[d.status]?.fr ?? d.status}`} right={<DueTag iso={d.due_date!} />} onClick={() => openDossier(d.id)} />)}
        </TodayCard>
        <TodayCard title="Mes tâches ouvertes" count={mine.length} none="Aucune tâche ouverte à votre nom.">
          {mine.map((t) => (
            <li key={t.id} className="flex items-center gap-1 pl-2">
              <input type="checkbox" aria-label={`Terminer : ${t.label}`} checked={false} onChange={() => completeTask(t)} className="h-5 w-5 shrink-0 accent-navy" />
              <button type="button" onClick={() => openDossier(t.dossier_id)} className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-sky-50">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{t.label}</span>
                  <span className="block truncate text-sm text-muted">{name(t.dossier_id)}</span>
                </span>
                {t.due_date && <span className="shrink-0 text-right text-sm"><DueTag iso={t.due_date} /></span>}
              </button>
            </li>
          ))}
        </TodayCard>
      </div>
    </div>
  );
}

/* ───────────── Demandes ───────────── */
function LeadForm({ onAdd, onDone }: { onAdd: (l: Lead) => Promise<boolean>; onDone: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    if (!v("email") && !v("phone")) { setErr("Indiquez un courriel ou un téléphone."); return; }
    setErr(""); setBusy(true);
    const ok = await onAdd({ id: newId(), created_at: new Date().toISOString(), source: "telephone", lang: "fr", name: v("name"), email: v("email").toLowerCase() || null, phone: v("phone") || null, audience: v("audience"), topic: v("topic") || null, message: v("message"), status: "nouveau", notes: "" });
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <form onSubmit={submit} className={`${panel} mb-4 space-y-4`}>
      <h2 className="font-display text-xl font-semibold text-navy">Nouvelle demande (appel, visite, référence)</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label htmlFor="nl-name" className="label">Nom</label><input id="nl-name" name="name" required maxLength={120} className="field" /></div>
        <div><label htmlFor="nl-email" className="label">Courriel</label><input id="nl-email" name="email" type="email" maxLength={200} className="field" /></div>
        <div><label htmlFor="nl-phone" className="label">Téléphone</label><input id="nl-phone" name="phone" type="tel" maxLength={40} className="field" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <div><label htmlFor="nl-aud" className="label">Pour</label><select id="nl-aud" name="audience" className="field"><option value="moi">Particulier</option><option value="entreprise">Entreprise</option></select></div>
        <div><label htmlFor="nl-topic" className="label">Sujet</label><input id="nl-topic" name="topic" maxLength={120} className="field" /></div>
      </div>
      <div><label htmlFor="nl-msg" className="label">Détails</label><textarea id="nl-msg" name="message" rows={3} maxLength={4000} className="field resize-y" /></div>
      <button type="submit" disabled={busy} className="btn-primary min-h-11">{busy ? "Enregistrement…" : "Enregistrer"}</button>
      <p role="alert" className={err ? "rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{err}</p>
    </form>
  );
}

function LeadCard({ l, focused, patch, onCreateDossier }: { l: Lead; focused: boolean; patch: PatchLead; onCreateDossier: (l: Lead) => void }) {
  const [saved, setSaved] = useState<Date | null>(null);
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => { if (focused) { ref.current?.scrollIntoView({ block: "center" }); ref.current?.focus(); } }, [focused]);
  const setStatus = (status: string) => {
    const prev = l.status;
    patch(l.id, { status }, { ok: `${l.name} → ${LEAD_STATUS[status] ?? status}`, undo: () => { patch(l.id, { status: prev }, { ok: "Statut rétabli." }); } });
  };
  const addEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (v) patch(l.id, { email: v }, { ok: "Courriel ajouté." });
  };
  return (
    <li ref={ref} tabIndex={-1} className={`${panel} ${focused ? "border-navy ring-2 ring-navy" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{l.name}</h2>
          <p className="mt-0.5 text-sm text-muted">{fmtDate(l.created_at, "fr", true)} · {l.audience === "entreprise" ? "Entreprise" : l.audience === "moi" ? "Particulier" : "Non précisé"} · {l.lang.toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`${pill} ${l.source === "clara" ? "bg-sky-100 text-navy" : "bg-[#eef0f6] text-ink"}`}>{SOURCE[l.source] ?? l.source}</span>
          <label className="sr-only" htmlFor={`st-${l.id}`}>Statut de la demande de {l.name}</label>
          <select id={`st-${l.id}`} value={l.status} onChange={(e) => setStatus(e.target.value)} className="field min-h-11 w-auto py-1.5 text-sm">
            {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      {(l.email || l.phone) && (
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {l.email && <a href={mailto(l.email)} className={link}>{l.email}</a>}
          {l.phone && <a href={telto(l.phone)} className={link}>{l.phone}</a>}
        </p>
      )}
      {l.topic && <p className="mt-3 text-sm font-semibold text-ink">{l.topic}</p>}
      {l.message && <p className="mt-1 leading-relaxed whitespace-pre-line text-ink">{l.message}</p>}
      <label htmlFor={`n-${l.id}`} className="label mt-4">Notes internes</label>
      <textarea id={`n-${l.id}`} defaultValue={l.notes} rows={2} maxLength={4000} className="field resize-y" onBlur={async (e) => { if (e.target.value !== l.notes && (await patch(l.id, { notes: e.target.value }))) setSaved(new Date()); }} />
      <SavedAt at={saved} />
      {l.email ? (
        <button type="button" onClick={() => onCreateDossier(l)} className={`${smallBtn} mt-2`}>Ouvrir un dossier</button>
      ) : (
        <div className="mt-2">
          <form onSubmit={addEmail} className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <label htmlFor={`em-${l.id}`} className="label">Courriel du client</label>
              <input id={`em-${l.id}`} name="email" type="email" required maxLength={200} autoCapitalize="none" className="field min-h-11 py-2" />
            </div>
            <button type="submit" className={smallBtn}>Ajouter le courriel</button>
          </form>
          <button type="button" disabled aria-describedby={`emh-${l.id}`} className={`${smallBtn} mt-3 disabled:cursor-not-allowed disabled:border-line disabled:bg-[#f1f2f6] disabled:text-muted`}>Ouvrir un dossier</button>
          <p id={`emh-${l.id}`} className="mt-1.5 text-sm text-muted">Ajoutez un courriel pour ouvrir un dossier.</p>
        </div>
      )}
    </li>
  );
}

function Leads({ leads, filter, setFilter, focusId, patch, onAdd, onCreateDossier }: {
  leads: Lead[]; filter: string; setFilter: (f: string) => void; focusId: string | null; patch: PatchLead; onAdd: (l: Lead) => Promise<boolean>; onCreateDossier: (l: Lead) => void;
}) {
  const [adding, setAdding] = useState(false);
  const shown = leads.filter((l) => leadMatches(l, filter) || l.id === focusId);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {LEAD_FILTERS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} className={chip}>{l} ({leads.filter((x) => leadMatches(x, k)).length})</button>
        ))}
        <button type="button" onClick={() => setAdding((a) => !a)} className={`${adding ? "btn-secondary" : "btn-primary"} ml-auto min-h-11 px-4 py-2 text-sm`}>{adding ? "Fermer le formulaire" : "Ajouter une demande"}</button>
      </div>
      {adding && <LeadForm onAdd={onAdd} onDone={() => setAdding(false)} />}
      {shown.length === 0 ? <p className={empty}>Aucune demande dans cette vue.</p> : (
        <ul className="space-y-4">
          {shown.map((l) => <LeadCard key={l.id} l={l} focused={l.id === focusId} patch={patch} onCreateDossier={onCreateDossier} />)}
        </ul>
      )}
    </div>
  );
}

/* ───────────── Honoraires ───────────── */
function useInvoiceActions(set: (u: SetStateAction<Invoice[] | null>) => void) {
  const apply = useCallback((id: string, p: Partial<Invoice>) => set((l) => l?.map((x) => (x.id === id ? { ...x, ...p } : x)) ?? null), [set]);
  const patch = useCallback((inv: Invoice, p: Partial<Invoice>, o: PatchOpts = {}) => {
    const back = Object.fromEntries(Object.keys(p).map((k) => [k, inv[k as keyof Invoice]])) as Partial<Invoice>;
    apply(inv.id, p);
    return save(supabase().from("invoices").update(p).eq("id", inv.id), { ...o, rollback: () => apply(inv.id, back) });
  }, [apply]);
  const setStatus = useCallback((inv: Invoice, status: string) => {
    const prev = { status: inv.status, paid_at: inv.paid_at };
    patch(inv, { status, paid_at: status === "payee" ? new Date().toISOString() : null }, { ok: `${inv.label} → ${INVOICE_STATUS[status] ?? status}`, undo: () => { patch({ ...inv, status }, prev, { ok: "Statut rétabli." }); } });
  }, [patch]);
  const setLink = useCallback(async (inv: Invoice, raw: string) => {
    const v = raw.trim();
    if (v === (inv.pay_url ?? "")) return false;
    if (v && !/^https:\/\/\S+$/.test(v)) { toast("Le lien doit commencer par https://", "error"); return false; }
    return patch(inv, { pay_url: v || null });
  }, [patch]);
  /** Demande un lien de paiement au serveur. Rien n'est envoyé au client automatiquement. */
  const createLink = useCallback(async (inv: Invoice) => {
    if (demoRole()) { toast(PAY_OFF, "error"); return; }
    try {
      const { data } = await real().auth.getSession();
      const res = await fetch("/api/pay/", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ invoice_id: inv.id }) });
      const json = res.ok ? ((await res.json()) as { url?: unknown }) : null;
      if (typeof json?.url !== "string" || !json.url.startsWith("https://")) throw new Error("indisponible");
      await patch(inv, { pay_url: json.url }, { ok: "Lien de paiement créé." });
    } catch { toast(PAY_OFF, "error"); }
  }, [patch]);
  return { setStatus, setLink, createLink };
}

function InvoiceItem({ inv, context, actions }: { inv: Invoice; context?: ReactNode; actions: ReturnType<typeof useInvoiceActions> }) {
  const [saved, setSaved] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{inv.label}</p>
          <p className="text-sm text-muted">{context}{context ? " · " : ""}{fmtDate(inv.created_at, "fr")}{inv.paid_at ? ` · payée le ${fmtDate(inv.paid_at, "fr")}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold text-navy">{money.format(inv.amount_cents / 100)}</span>
          <label className="sr-only" htmlFor={`is-${inv.id}`}>Statut de la facture {inv.label}</label>
          <select id={`is-${inv.id}`} value={inv.status} onChange={(e) => actions.setStatus(inv, e.target.value)} className="field min-h-11 w-auto py-1.5 text-sm">
            {Object.entries(INVOICE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor={`ip-${inv.id}`} className="label">Lien de paiement (facultatif)</label>
          <input id={`ip-${inv.id}`} key={inv.pay_url ?? ""} type="url" inputMode="url" defaultValue={inv.pay_url ?? ""} maxLength={600} placeholder="https://" className="field min-h-11 py-2 text-sm" onBlur={async (e) => { if (await actions.setLink(inv, e.target.value)) setSaved(new Date()); }} />
        </div>
        {inv.pay_url && <a href={inv.pay_url} target="_blank" rel="noopener noreferrer" className={smallBtn}>Ouvrir le lien</a>}
        {!inv.pay_url && inv.status === "a_payer" && (
          <button type="button" disabled={busy} onClick={async () => { setBusy(true); await actions.createLink(inv); setBusy(false); }} className={smallBtn}>{busy ? "Création…" : "Créer un lien de paiement"}</button>
        )}
      </div>
      <SavedAt at={saved} />
    </li>
  );
}

function DossierInvoices({ dossierId }: { dossierId: string }) {
  const load = useLoad(() => rows<Invoice>(supabase().from("invoices").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false })), dossierId);
  const actions = useInvoiceActions(load.set);
  const [err, setErr] = useState("");
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const label = String(f.get("label") ?? "").trim();
    const cents = Math.round(Number(String(f.get("amount") ?? "").replace(/\s|\$/g, "").replace(",", ".")) * 100);
    if (!label) { setErr("Indiquez une description."); return; }
    if (!Number.isFinite(cents) || cents < 1 || cents > 100000000) { setErr("Indiquez un montant en dollars, par exemple 287,44."); return; }
    setErr("");
    const row: Invoice = { id: newId(), dossier_id: dossierId, created_at: new Date().toISOString(), label: label.slice(0, 200), amount_cents: cents, status: String(f.get("status") ?? "a_payer"), pay_url: null, paid_at: null };
    load.set((l) => [row, ...(l ?? [])]);
    const { created_at: _local, ...payload } = row;
    void _local;
    if (await save(supabase().from("invoices").insert(payload), { ok: "Facture ajoutée.", rollback: () => load.set((l) => l?.filter((x) => x.id !== row.id) ?? null) })) form.reset();
  };
  return (
    <Card title="Honoraires">
      <Loadable load={load} label="Chargement des honoraires" rows={1}>
        {(list) => (list.length === 0 ? <p className="text-sm text-muted">Aucune facture pour ce dossier.</p> : <ul className="divide-y divide-line">{list.map((inv) => <InvoiceItem key={inv.id} inv={inv} actions={actions} />)}</ul>)}
      </Loadable>
      <form onSubmit={add} className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_9rem]">
        <div><label htmlFor="inv-label" className="label">Description</label><input id="inv-label" name="label" maxLength={200} placeholder="Ex. Déclarations de revenus" className="field min-h-11 py-2" /></div>
        <div><label htmlFor="inv-amount" className="label">Montant ($)</label><input id="inv-amount" name="amount" inputMode="decimal" placeholder="287,44" className="field min-h-11 py-2" /></div>
        <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
          <div><label htmlFor="inv-status" className="label">Statut</label><select id="inv-status" name="status" defaultValue="a_payer" className="field min-h-11 w-auto py-2"><option value="brouillon">Brouillon (invisible pour le client)</option><option value="a_payer">À payer</option></select></div>
          <button type="submit" className={smallBtn}>Ajouter la facture</button>
        </div>
        <p role="alert" className={err ? "rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00] sm:col-span-2" : "sr-only"}>{err}</p>
      </form>
    </Card>
  );
}

function Fees({ dossiers, openDossier }: { dossiers: Dossier[]; openDossier: (id: string) => void }) {
  const load = useLoad(() => rows<Invoice>(supabase().from("invoices").select("*").order("created_at", { ascending: false }).limit(1000)));
  const actions = useInvoiceActions(load.set);
  const [filter, setFilter] = useState("toutes");
  const byId = useMemo(() => new Map(dossiers.map((d) => [d.id, d])), [dossiers]);
  return (
    <Loadable load={load} label="Chargement des honoraires">
      {(list) => {
        const month = todayISO().slice(0, 7);
        const sum = (l: Invoice[]) => money.format(l.reduce((n, x) => n + x.amount_cents, 0) / 100);
        const due = list.filter((x) => x.status === "a_payer");
        const paid = list.filter((x) => x.status === "payee" && x.paid_at && dayFmt.format(new Date(x.paid_at)).slice(0, 7) === month);
        const drafts = list.filter((x) => x.status === "brouillon");
        const shown = list.filter((x) => filter === "toutes" || x.status === filter);
        return (
          <div>
            <dl className="glass mb-6 grid gap-1 rounded-3xl p-2 sm:grid-cols-3">
              {([["À payer", due], ["Payé ce mois-ci", paid], ["Brouillons", drafts]] as const).map(([l, v]) => (
                <div key={l} className="px-4 py-3">
                  <dt className="text-xs font-semibold text-ink/80">{l}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-navy">{sum(v)}</dd>
                  <dd className="text-xs text-ink/80">{v.length} facture{v.length > 1 ? "s" : ""}</dd>
                </div>
              ))}
            </dl>
            <div className="mb-4 flex flex-wrap gap-2">
              {[["toutes", "Toutes"], ...Object.entries(INVOICE_STATUS)].map(([k, l]) => (
                <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={chip}>{l} ({list.filter((x) => k === "toutes" || x.status === k).length})</button>
              ))}
            </div>
            {shown.length === 0 ? <p className={empty}>Aucune facture dans cette vue. Les factures s'ajoutent dans chaque dossier.</p> : (
              <ul className={`${panel} divide-y divide-line`}>
                {shown.map((inv) => {
                  const d = byId.get(inv.dossier_id);
                  return <InvoiceItem key={inv.id} inv={inv} actions={actions} context={d ? <button type="button" onClick={() => openDossier(d.id)} className={link}>{d.client_name}, {d.title}</button> : "Dossier introuvable"} />;
                })}
              </ul>
            )}
          </div>
        );
      }}
    </Loadable>
  );
}

/* ───────────── Détail d'un dossier ───────────── */
function DossierHeader({ d }: { d: Dossier }) {
  const text = `Bonjour,\n\nVotre dossier « ${d.title} » est ouvert chez Othmani CPA. Vous pouvez suivre son avancement, déposer vos documents et nous écrire dans votre espace client :\n\n${origin()}/espace-client/\n\nConnectez-vous avec ce courriel : ${d.client_email}. Vous recevrez un code de connexion, sans mot de passe.\n\nL'équipe d'Othmani CPA`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast("Invitation copiée."); } catch { toast("Copie impossible. Utilisez le lien courriel.", "error"); }
  };
  return (
    <header className={panel}>
      <h2 className="font-display text-2xl font-bold tracking-tight text-navy">{d.title}</h2>
      <p className="mt-1 text-sm text-muted">{d.client_name} · <a className={link} href={mailto(d.client_email)}>{d.client_email}</a> · {KINDS[d.kind]?.fr ?? d.kind}{d.tax_year ? ` · ${d.tax_year}` : ""}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={copy} className={smallBtn}>Copier l'invitation à l'espace client</button>
        <a href={mailto(d.client_email, mailQuery("Votre espace client Othmani CPA", text))} className={`${link} text-sm`}>L'envoyer par courriel</a>
      </div>
    </header>
  );
}

function FollowUp({ d, team, onPatch, onMove }: { d: Dossier; team: string[]; onPatch: (p: Partial<Dossier>, o?: PatchOpts) => Promise<boolean>; onMove: (status: string) => void }) {
  const [saved, setSaved] = useState<{ due?: Date; next?: Date }>({});
  return (
    <Card title="Suivi">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="d-status" className="label">Étape (visible par le client)</label>
          <select id="d-status" value={d.status} onChange={(e) => onMove(e.target.value)} className="field">
            {STATUSES.map((s, i) => <option key={s} value={s}>{i + 1}. {statusLabel[s].fr}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="d-assignee" className="label">Responsable au cabinet</label>
          <select id="d-assignee" value={d.assignee ?? ""} onChange={(e) => onPatch({ assignee: e.target.value }, { ok: "Enregistré" })} className="field">
            <option value="">Non attribué</option>
            {[...new Set([...team, d.assignee ?? ""].filter(Boolean))].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="d-due" className="label">Échéance</label>
          <input id="d-due" key={d.due_date ?? ""} type="date" defaultValue={d.due_date ?? ""} className="field" onBlur={async (e) => { const v = e.target.value || null; if (v !== d.due_date && (await onPatch({ due_date: v }))) setSaved((s) => ({ ...s, due: new Date() })); }} />
          <SavedAt at={saved.due ?? null} />
        </div>
      </div>
      <label htmlFor="d-next" className="label mt-2">Message au client sur la suite</label>
      <textarea id="d-next" defaultValue={d.next_step} rows={2} maxLength={500} aria-describedby="d-next-h" className="field resize-y" onBlur={async (e) => { if (e.target.value !== d.next_step && (await onPatch({ next_step: e.target.value }))) setSaved((s) => ({ ...s, next: new Date() })); }} />
      <p id="d-next-h" className="mt-1 text-xs text-muted">Le client lit ce texte dans son espace. Il s'enregistre quand vous quittez le champ.</p>
      <SavedAt at={saved.next ?? null} />
    </Card>
  );
}

function Tasks({ d, team }: { d: Dossier; team: string[] }) {
  const load = useLoad(() => rows<Task>(supabase().from("tasks").select("*").eq("dossier_id", d.id).order("created_at")), d.id);
  const edit = (f: (l: Task[]) => Task[]) => load.set((l) => (l ? f(l) : l));
  const insert = (t: Task, ok: string, undo?: () => void) => {
    edit((l) => [...l.filter((x) => x.id !== t.id), t]);
    return save(supabase().from("tasks").insert(t), { ok, undo, rollback: () => edit((l) => l.filter((x) => x.id !== t.id)) });
  };
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const label = String(f.get("label") ?? "").trim();
    if (!label) return;
    if (await insert({ id: newId(), dossier_id: d.id, created_at: new Date().toISOString(), label: label.slice(0, 300), assignee: String(f.get("assignee") ?? ""), due_date: String(f.get("due") ?? "") || null, done: false }, "Tâche ajoutée.")) form.reset();
  };
  const toggle = (t: Task, done: boolean) => {
    edit((l) => l.map((x) => (x.id === t.id ? { ...x, done } : x)));
    save(supabase().from("tasks").update({ done }).eq("id", t.id), { rollback: () => edit((l) => l.map((x) => (x.id === t.id ? { ...x, done: t.done } : x))) });
  };
  const remove = (t: Task) => {
    edit((l) => l.filter((x) => x.id !== t.id));
    save(supabase().from("tasks").delete().eq("id", t.id), { ok: "Tâche retirée.", rollback: () => edit((l) => [...l, t]), undo: () => { insert(t, "Tâche rétablie."); } });
  };
  return (
    <Card title="Tâches internes">
      <Loadable load={load} label="Chargement des tâches" rows={1}>
        {(list) => {
          const sorted = [...list].sort((a, b) => Number(a.done) - Number(b.done) || a.created_at.localeCompare(b.created_at));
          return sorted.length === 0 ? <p className="text-sm text-muted">Aucune tâche pour ce dossier.</p> : (
            <ul className="space-y-2">
              {sorted.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-3 rounded-xl border border-line py-1 pr-1 pl-3">
                  <label className="flex min-h-11 min-w-0 flex-1 basis-56 items-center gap-3 text-ink">
                    <input type="checkbox" checked={t.done} className="h-5 w-5 shrink-0 accent-navy" onChange={(e) => toggle(t, e.target.checked)} />
                    <span className={t.done ? "text-muted line-through" : ""}>{t.label}</span>
                  </label>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                    {t.assignee && <span>{t.assignee}</span>}
                    {t.due_date && <span className={!t.done && daysUntil(t.due_date) < 0 ? "font-semibold text-[#a3261f]" : ""}>{fmtDate(t.due_date, "fr")}</span>}
                    <button type="button" className={removeBtn} aria-label={`Retirer la tâche : ${t.label}`} onClick={() => remove(t)}>Retirer</button>
                  </span>
                </li>
              ))}
            </ul>
          );
        }}
      </Loadable>
      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div className="sm:col-span-3"><label htmlFor="tk-label" className="sr-only">Nouvelle tâche</label><input id="tk-label" name="label" placeholder="Ex. Rappeler le client pour le Relevé 1" maxLength={300} className="field min-h-11 py-2" /></div>
        <div><label htmlFor="tk-who" className="sr-only">Responsable de la tâche</label><select id="tk-who" name="assignee" defaultValue={d.assignee ?? ""} className="field min-h-11 py-2"><option value="">Non attribuée</option>{team.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        <div><label htmlFor="tk-due" className="sr-only">Échéance de la tâche</label><input id="tk-due" name="due" type="date" className="field min-h-11 py-2" /></div>
        <button type="submit" className={smallBtn}>Ajouter la tâche</button>
      </form>
    </Card>
  );
}

function Requests({ d, staffName }: { d: Dossier; staffName: string }) {
  const load = useLoad(async () => {
    const [reqs, files] = await Promise.all([
      rows<Req>(supabase().from("document_requests").select("*").eq("dossier_id", d.id).order("created_at")),
      rows<FileDoc>(supabase().from("documents").select("*").eq("dossier_id", d.id).order("created_at", { ascending: false })),
    ]);
    return { reqs, files };
  }, d.id);
  const edit = (f: (l: Req[]) => Req[]) => load.set((s) => (s ? { ...s, reqs: f(s.reqs) } : s));
  const linked = (id: string) => (load.data?.files ?? []).filter((x) => x.request_id === id && x.uploader_role === "client");
  const insert = (r: Req, ok: string) => {
    edit((l) => [...l.filter((x) => x.id !== r.id), r]);
    return save(supabase().from("document_requests").insert(r), { ok, rollback: () => edit((l) => l.filter((x) => x.id !== r.id)) });
  };
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = String(new FormData(form).get("v") ?? "").trim();
    if (!v) return;
    if (await insert({ id: newId(), dossier_id: d.id, created_at: new Date().toISOString(), label: v.slice(0, 200), received: false }, "Document demandé ajouté.")) form.reset();
  };
  const setReceived = (r: Req, received: boolean, ok?: string) => {
    edit((l) => l.map((x) => (x.id === r.id ? { ...x, received } : x)));
    save(supabase().from("document_requests").update({ received }).eq("id", r.id), { ok, rollback: () => edit((l) => l.map((x) => (x.id === r.id ? { ...x, received: r.received } : x))) });
  };
  const remove = (r: Req) => {
    const files = linked(r.id);
    edit((l) => l.filter((x) => x.id !== r.id));
    save(supabase().from("document_requests").delete().eq("id", r.id), {
      ok: "Document demandé retiré.", rollback: () => edit((l) => [...l, r]),
      undo: async () => {
        // La base détache les fichiers quand la demande disparaît : on les rattache après l'avoir recréée.
        if (await insert(r, "Document demandé rétabli.")) for (const f of files) await save(supabase().from("documents").update({ request_id: r.id }).eq("id", f.id));
      },
    });
  };
  const missing = (load.data?.reqs ?? []).filter((r) => !r.received);
  const reminder = `Bonjour ${d.client_name},\n\nPour avancer dans votre dossier « ${d.title} », il nous manque encore :\n\n${missing.map((r) => `- ${r.label}`).join("\n")}\n\nVous pouvez les déposer dans votre espace client (une photo suffit) :\n${origin()}/espace-client/\n\nMerci,\n${staffName}\nOthmani CPA`;
  const copyReminder = async () => {
    try { await navigator.clipboard.writeText(reminder); toast("Rappel copié. Collez-le dans votre courriel."); } catch { toast("Copie impossible. Utilisez le lien courriel.", "error"); }
  };
  return (
    <Card title="Documents demandés au client">
      <Loadable load={load} label="Chargement des documents demandés" rows={1}>
        {({ reqs }) => (
          <>
            {reqs.length === 0 ? <p className="text-sm text-muted">Aucun document demandé pour l'instant.</p> : (
              <ul className="space-y-2">
                {[...reqs].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")).map((r) => {
                  const files = linked(r.id);
                  return (
                    <li key={r.id} className="rounded-xl border border-line py-1 pr-1 pl-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex min-h-11 min-w-0 items-center gap-3 text-ink">
                          <input type="checkbox" checked={r.received} className="h-5 w-5 shrink-0 accent-navy" onChange={(e) => setReceived(r, e.target.checked)} />
                          <span className={r.received ? "text-muted line-through" : ""}>{r.label}</span>
                        </label>
                        <button type="button" className={removeBtn} aria-label={`Retirer le document demandé : ${r.label}`} onClick={() => remove(r)}>Retirer</button>
                      </div>
                      {files.length > 0 && (
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm">
                          <span className="min-w-0 text-ink">Déposé par le client : <strong className="font-semibold">{files.map((f) => f.name).join(", ")}</strong> ({fmtDate(files[0].created_at, "fr")})</span>
                          {r.received ? <span className={`${pill} bg-[#e6f4ea] text-[#1e5b2e]`}>Reçu</span> : <button type="button" onClick={() => setReceived(r, true, "Marqué reçu.")} className={smallBtn}>Marquer reçu</button>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={add} className="mt-4 flex flex-wrap gap-2">
              <label htmlFor="req-new" className="sr-only">Document à demander</label>
              <input id="req-new" name="v" placeholder="Ex. Relevé 1 et T4 de l'employeur" maxLength={200} className="field min-h-11 min-w-0 flex-1 basis-56 py-2" />
              <button type="submit" className={smallBtn}>Ajouter</button>
            </form>
            <div className="mt-5 border-t border-line pt-4">
              {missing.length === 0 ? <p className="text-sm text-muted">Rien à relancer : tout est reçu.</p> : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button type="button" onClick={copyReminder} className={smallBtn}>Relancer le client ({missing.length} manquant{missing.length > 1 ? "s" : ""})</button>
                  <a href={mailto(d.client_email, mailQuery(`Documents manquants : ${d.title}`, reminder))} className={`${link} text-sm`}>Ouvrir dans un courriel</a>
                  <p className="basis-full text-xs text-muted">Le rappel est copié. Rien n'est envoyé automatiquement.</p>
                </div>
              )}
            </div>
          </>
        )}
      </Loadable>
    </Card>
  );
}

/** Assistant IA de l'équipe : demande un brouillon au serveur. En démonstration, renvoie un exemple local. */
const AI_OFF = "L'assistant IA n'est pas disponible pour l'instant.";
async function askAi(dossierId: string, task: "reply" | "summary" | "relance"): Promise<string | null> {
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

function AiSummary({ dossierId }: { dossierId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Assistant IA">
      <p className="-mt-2 mb-3 text-xs text-muted">Résumé et brouillons à relire. Les fichiers et les coordonnées du client ne sont jamais transmis à l'IA.</p>
      <div className="flex flex-wrap gap-2">
        {([["summary", "Résumer le dossier"], ["relance", "Rédiger une relance"]] as const).map(([k, l]) => (
          <button key={k} type="button" disabled={busy} className={smallBtn} onClick={async () => { setBusy(true); setText(await askAi(dossierId, k)); setBusy(false); }}>{l}</button>
        ))}
      </div>
      {busy && <p className="mt-3 text-sm text-muted" role="status">L'assistant rédige…</p>}
      {text && !busy && (
        <div className="mt-3 rounded-xl bg-[#f3f7fc] px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink">{text}</p>
          <button type="button" className="mt-2 text-sm font-semibold text-navy underline underline-offset-4" onClick={async () => { try { await navigator.clipboard.writeText(text); toast("Texte copié."); } catch { toast("Copie impossible sur cet appareil.", "error"); } }}>Copier</button>
        </div>
      )}
    </Card>
  );
}

/** Journal d'activité : écrit par la base elle-même, il ne peut être ni modifié ni effacé depuis l'application. */
type Act = { id: number; created_at: string; actor: string; actor_role: string; kind: string; detail: string };
const ACT: Record<string, string> = {
  dossier_ouvert: "Dossier ouvert", etape: "Étape changée", responsable: "Responsable", echeance: "Échéance", message_suite: "Message au client sur la suite",
  courriel_client: "Courriel du client modifié", document_depose: "Document déposé", document_supprime: "Document supprimé", document_recu: "Document marqué reçu",
  message: "Message", facture_creee: "Facture créée", facture_statut: "Facture",
};
const actDetail = (a: Act) => (a.kind === "etape" || a.kind === "facture_statut" ? a.detail.replace(/\b[a-z_]+\b/g, (w) => statusLabel[w]?.fr ?? ({ brouillon: "Brouillon", a_payer: "À payer", payee: "Payée", annulee: "Annulée" } as Record<string, string>)[w] ?? w) : a.detail);

function Journal({ dossierId }: { dossierId: string }) {
  const load = useLoad(() => rows<Act>(supabase().from("activity").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false }).limit(50)), dossierId);
  return (
    <Card title="Journal d'activité">
      <p className="-mt-2 mb-3 text-xs text-muted">Qui a fait quoi, et quand. Tenu automatiquement ; personne ne peut le modifier.</p>
      <Loadable load={load} label="Chargement du journal" rows={1}>
        {(acts) => acts.length === 0 ? <p className="text-sm text-muted">Aucune activité enregistrée pour ce dossier.</p> : (
          <ol className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
            {acts.map((a) => (
              <li key={a.id} className="border-l-2 border-line pl-3 text-sm">
                <p className="text-ink"><span className="font-semibold">{ACT[a.kind] ?? a.kind}</span>{a.detail ? <> : {actDetail(a)}</> : null}</p>
                <p className="text-xs text-muted">{a.actor_role === "client" ? "Client" : a.actor} · {fmtDate(a.created_at, "fr", true)}</p>
              </li>
            ))}
          </ol>
        )}
      </Loadable>
    </Card>
  );
}

function Notes({ dossierId, staffName }: { dossierId: string; staffName: string }) {
  const load = useLoad(() => rows<Note>(supabase().from("dossier_notes").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false })), dossierId);
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = String(new FormData(form).get("v") ?? "").trim();
    if (!v) return;
    const n: Note = { id: newId(), dossier_id: dossierId, created_at: new Date().toISOString(), author: staffName, body: v.slice(0, 4000) };
    load.set((l) => [n, ...(l ?? [])]);
    if (await save(supabase().from("dossier_notes").insert({ id: n.id, dossier_id: n.dossier_id, author: n.author, body: n.body }), { ok: "Note ajoutée.", rollback: () => load.set((l) => l?.filter((x) => x.id !== n.id) ?? null) })) form.reset();
  };
  return (
    <Card title="Notes internes">
      <p className="-mt-2 mb-3 text-xs text-muted">Jamais visibles par le client.</p>
      <form onSubmit={add}>
        <label htmlFor="note-new" className="sr-only">Nouvelle note interne</label>
        <textarea id="note-new" name="v" rows={2} maxLength={4000} className="field resize-y" />
        <button type="submit" className={`${smallBtn} mt-2`}>Ajouter la note</button>
      </form>
      <div className="mt-4">
        <Loadable load={load} label="Chargement des notes" rows={1}>
          {(notes) => (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-[#f5f7fb] px-4 py-3">
                  <p className="leading-relaxed whitespace-pre-line text-ink">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">{n.author} · {fmtDate(n.created_at, "fr", true)}</p>
                </li>
              ))}
            </ul>
          )}
        </Loadable>
      </div>
    </Card>
  );
}

/** Fiche d'un dossier : le travail à gauche, les échanges à droite (colonne fixe quand la place le permet). */
function DossierDetail({ d, staffName, team, railTop, onPatch, onMove, onTouch }: {
  d: Dossier; staffName: string; team: string[]; railTop: string; onPatch: (p: Partial<Dossier>, o?: PatchOpts) => Promise<boolean>; onMove: (status: string) => void; onTouch: () => void;
}) {
  useEffect(() => { onTouch(); }, [onTouch]);
  const rail = useRef<HTMLElement>(null);
  return (
    <div className="@container">
      <DossierHeader d={d} />
      <button type="button" onClick={() => { rail.current?.scrollIntoView({ block: "start" }); rail.current?.focus(); }} className={`${smallBtn} mt-4 @[50rem]:hidden`}>Aller aux messages et aux notes</button>
      <div className="mt-6 grid gap-6 @[50rem]:grid-cols-[minmax(0,1fr)_21rem] @[50rem]:items-start">
        <div className="min-w-0 space-y-6">
          <FollowUp d={d} team={team} onPatch={onPatch} onMove={onMove} />
          <Tasks d={d} team={team} />
          <Requests d={d} staffName={staffName} />
          <Documents dossierId={d.id} role="cabinet" lang="fr" />
          <DossierInvoices dossierId={d.id} />
        </div>
        <aside ref={rail} tabIndex={-1} aria-label="Échanges et notes" className={`min-w-0 scroll-mt-28 space-y-6 @[50rem]:sticky @[50rem]:max-h-[calc(100svh-8.5rem)] @[50rem]:overflow-y-auto @[50rem]:rounded-3xl ${railTop}`}>
          <Messages dossierId={d.id} role="cabinet" lang="fr" authorName={staffName} aiDraft={() => askAi(d.id, "reply")} />
          <Notes dossierId={d.id} staffName={staffName} />
            <AiSummary dossierId={d.id} />
            <Journal dossierId={d.id} />
        </aside>
      </div>
    </div>
  );
}

/* ───────────── Dossiers ───────────── */
function NewDossier({ draft, onCreate }: { draft: Lead | null; onCreate: (row: Record<string, unknown>) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("client_email")).trim().toLowerCase();
    // Une faute de frappe donnerait accès au dossier à la mauvaise personne : on fait relire le courriel.
    if (!window.confirm(`Ce courriel donnera accès au dossier :\n\n${email}\n\nConfirmer ?`)) return;
    setBusy(true);
    await onCreate({ client_name: String(f.get("client_name")).trim(), client_email: email, title: String(f.get("title")).trim(), kind: String(f.get("kind")), tax_year: f.get("tax_year") ? Number(f.get("tax_year")) : null, lead_id: draft?.id ?? null });
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className={`${panel} space-y-4`}>
      <h2 className="font-display text-2xl font-bold tracking-tight text-navy">Nouveau dossier</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="c-name" className="label">Nom du client</label><input id="c-name" name="client_name" required maxLength={160} defaultValue={draft?.name ?? ""} className="field" /></div>
        <div><label htmlFor="c-email" className="label">Courriel du client</label><input id="c-email" name="client_email" type="email" required maxLength={200} defaultValue={draft?.email ?? ""} aria-describedby="c-email-h" autoCapitalize="none" className="field" /><p id="c-email-h" className="mt-1.5 text-xs text-muted">Le client se connecte à son espace avec ce courriel. Vérifiez-le bien.</p></div>
      </div>
      <div><label htmlFor="c-title" className="label">Titre du dossier</label><input id="c-title" name="title" required maxLength={160} defaultValue={draft?.topic ?? ""} placeholder="Ex. Déclarations de revenus 2026" className="field" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="c-kind" className="label">Type de mandat</label><select id="c-kind" name="kind" aria-describedby="c-kind-h" className="field">{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v.fr}</option>)}</select><p id="c-kind-h" className="mt-1.5 text-xs text-muted">La liste des documents à demander est préremplie selon le type.</p></div>
        <div><label htmlFor="c-year" className="label">Année visée (facultatif)</label><input id="c-year" name="tax_year" type="number" min={2000} max={2100} className="field" /></div>
      </div>
      <button type="submit" disabled={busy} className="btn-primary">{busy ? "Création…" : "Créer le dossier"}</button>
    </form>
  );
}

function DossierFlags({ d, waiting }: { d: Dossier; waiting: boolean }) {
  return (
    <>
      {waiting && <span className={warnPill}>Message à lire</span>}
      {isLate(d) && <span className={latePill}>{dueInfo(d.due_date!).text}</span>}
    </>
  );
}

function StageBoard({ shown, waiting, hidesClosed, onOpen, onMove }: { shown: Dossier[]; waiting: Set<string>; hidesClosed: boolean; onOpen: (id: string) => void; onMove: (id: string, status: string) => void }) {
  const [over, setOver] = useState<string | null>(null);
  return (
    <div>
      <p className="mb-3 text-sm text-muted">Glissez un dossier d'une colonne à l'autre, ou changez son étape dans le menu de la carte. Le client voit la nouvelle étape dans son espace.</p>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {STATUSES.map((st, i) => {
          const col = shown.filter((x) => x.status === st);
          return (
            <section key={st} aria-label={statusLabel[st].fr} className={`glass w-64 shrink-0 rounded-2xl p-2.5 transition-shadow ${over === st ? "ring-4 ring-navy" : ""}`}
              onDragOver={(e) => { e.preventDefault(); if (over !== st) setOver(st); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null); }}
              onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) onMove(id, st); }}>
              <h2 className="flex items-center justify-between px-1.5 pb-2 font-display text-sm font-semibold text-navy"><span>{i + 1}. {statusLabel[st].fr}</span><span className="text-ink/80">{col.length}</span></h2>
              {over === st && <p className="mb-2 rounded-lg bg-navy px-2 py-1.5 text-center text-xs font-semibold text-white">Déposer ici</p>}
              <ul className="min-h-16 space-y-2">
                {col.map((x) => (
                  <li key={x.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", x.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setOver(null)} className="cursor-grab rounded-xl border border-line bg-white p-3 active:cursor-grabbing">
                    <button type="button" data-card={x.id} onClick={() => onOpen(x.id)} className="block w-full rounded-lg text-left hover:underline">
                      <span className="block font-display font-semibold text-ink">{x.client_name}</span>
                      <span className="block text-sm text-ink/80">{x.title}</span>
                    </button>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <span>{x.assignee || "Non attribué"}</span>
                      {x.due_date && !isLate(x) && <span>· {fmtDate(x.due_date, "fr")}</span>}
                      <DossierFlags d={x} waiting={waiting.has(x.id)} />
                    </span>
                    <label className="sr-only" htmlFor={`mv-${x.id}`}>Étape du dossier de {x.client_name}</label>
                    <select id={`mv-${x.id}`} value={x.status} onChange={(e) => onMove(x.id, e.target.value)} className="field mt-2 min-h-11 py-1.5 text-sm">
                      {STATUSES.map((s2, j) => <option key={s2} value={s2}>{j + 1}. {statusLabel[s2].fr}</option>)}
                    </select>
                  </li>
                ))}
                {st === "ferme" && hidesClosed && <li className="px-1.5 text-xs text-ink/80">Les dossiers fermés sont masqués. Choisissez « Fermés » ou « Tous » pour les voir.</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Dossiers({ store, ui, setUi, staffName, draft, clearDraft, patch, move, onCreated, onTouch }: {
  store: Store; ui: DossierUi; setUi: (f: (u: DossierUi) => DossierUi) => void; staffName: string; draft: Lead | null; clearDraft: () => void;
  patch: PatchDossier; move: (id: string, status: string) => void; onCreated: (d: Dossier, lead: Lead | null) => void; onTouch: () => void;
}) {
  const { filter: f, view, current, creating } = ui;
  const waiting = useMemo(() => new Set(store.waiting), [store.waiting]);
  const setFilter = (p: Partial<DFilter>) => setUi((u) => ({ ...u, filter: { ...u.filter, ...p } }));
  const owners = useMemo(() => [...new Set([...store.team, ...store.dossiers.map((d) => d.assignee ?? "")].filter(Boolean))], [store.team, store.dossiers]);

  const shown = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const rank = (d: Dossier) => (d.status === "ferme" ? 4 : waiting.has(d.id) ? 0 : isLate(d) ? 1 : isSoon(d) ? 2 : 3);
    return store.dossiers
      .filter((d) => (f.scope === "tous" ? true : f.scope === "fermes" ? d.status === "ferme" : d.status !== "ferme"))
      .filter((d) => !f.stage || d.status === f.stage)
      .filter((d) => !f.owner || (f.owner === "__aucun" ? !d.assignee : d.assignee === f.owner))
      .filter((d) => (f.signal === "retard" ? isLate(d) : f.signal === "bientot" ? isSoon(d) : f.signal === "messages" ? waiting.has(d.id) : true))
      .filter((d) => !n || `${d.client_name} ${d.client_email} ${d.title}`.toLowerCase().includes(n))
      .sort((a, b) => rank(a) - rank(b) || (rank(a) === 1 || rank(a) === 2 ? a.due_date!.localeCompare(b.due_date!) : 0) || b.updated_at.localeCompare(a.updated_at));
  }, [store.dossiers, f, waiting]);

  const d = store.dossiers.find((x) => x.id === current);
  const filtered = JSON.stringify(f) !== JSON.stringify(NO_FILTER);
  const detailOpen = view === "liste" && (creating || !!d);
  const closeDetail = () => { setUi((u) => ({ ...u, current: null, creating: false })); clearDraft(); };

  const create = async (row: Record<string, unknown>) => {
    let created: Dossier | null = null;
    const ok = await save(supabase().from("dossiers").insert(row).select().single().then((r) => { created = r.data as Dossier | null; return r; }), { ok: "Dossier créé." });
    const made = created as Dossier | null;
    if (!ok || !made) return false;
    const reqs = DEFAULT_REQUESTS[String(row.kind)] ?? [];
    if (reqs.length) await save(supabase().from("document_requests").insert(reqs.map((label) => ({ dossier_id: made.id, label }))));
    onCreated(made, draft);
    return true;
  };
  const detail = (x: Dossier, railTop: string) => <DossierDetail key={x.id} d={x} staffName={staffName} team={store.team} railTop={railTop} onPatch={(p, o) => patch(x.id, p, o)} onMove={(s) => move(x.id, s)} onTouch={onTouch} />;

  return (
    <div>
      <div className={`glass mb-5 rounded-2xl p-3 ${detailOpen ? "hidden min-[1400px]:block" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Affichage" className="flex gap-1">
            {([["liste", "Liste"], ["tableau", "Tableau par étape"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setUi((u) => ({ ...u, view: k, creating: false, current: k === "tableau" ? null : u.current }))} aria-pressed={view === k} className={chip}>{l}</button>
            ))}
          </div>
          <div role="group" aria-label="Dossiers affichés" className="flex gap-1 sm:ml-3">
            {([["a_faire", "À faire"], ["fermes", "Fermés"], ["tous", "Tous"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setFilter({ scope: k })} aria-pressed={f.scope === k} className={chip}>{l}</button>
            ))}
          </div>
          <button type="button" onClick={() => setUi((u) => ({ ...u, view: "liste", creating: true, current: null }))} className="btn-primary ml-auto min-h-11 px-5 py-2 text-sm">Nouveau dossier</button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div><label htmlFor="d-q" className="sr-only">Chercher un dossier</label><input id="d-q" type="search" value={f.q} onChange={(e) => setFilter({ q: e.target.value })} placeholder="Chercher un client, un dossier" className="field min-h-11 py-2 text-sm" /></div>
          <div><label htmlFor="f-stage" className="sr-only">Filtrer par étape</label><select id="f-stage" value={f.stage} onChange={(e) => setFilter({ stage: e.target.value })} className="field min-h-11 py-2 text-sm"><option value="">Toutes les étapes</option>{STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s].fr}</option>)}</select></div>
          <div><label htmlFor="f-owner" className="sr-only">Filtrer par responsable</label><select id="f-owner" value={f.owner} onChange={(e) => setFilter({ owner: e.target.value })} className="field min-h-11 py-2 text-sm"><option value="">Tous les responsables</option>{owners.includes(staffName) && <option value={staffName}>Mes dossiers</option>}{owners.filter((n) => n !== staffName).map((n) => <option key={n} value={n}>{n}</option>)}<option value="__aucun">Non attribué</option></select></div>
          <div><label htmlFor="f-signal" className="sr-only">Filtrer par urgence</label><select id="f-signal" value={f.signal} onChange={(e) => setFilter({ signal: e.target.value as DFilter["signal"] })} className="field min-h-11 py-2 text-sm"><option value="">Toutes les urgences</option><option value="messages">Message à lire</option><option value="retard">En retard</option><option value="bientot">Échéance d'ici {SOON_DAYS} jours</option></select></div>
          {filtered && <button type="button" onClick={() => setFilter(NO_FILTER)} className={`${link} min-h-11 px-2 text-sm`}>Réinitialiser</button>}
        </div>
        <p role="status" aria-live="polite" className="mt-2 px-1 text-xs text-ink/80">{shown.length} dossier{shown.length > 1 ? "s" : ""} affiché{shown.length > 1 ? "s" : ""}, les plus urgents d'abord.</p>
      </div>

      {view === "tableau" ? (
        <>
          <StageBoard shown={shown} waiting={waiting} hidesClosed={f.scope === "a_faire"} onOpen={(id) => setUi((u) => ({ ...u, current: id }))} onMove={move} />
          {d && <Drawer label={`Dossier de ${d.client_name}`} returnTo={`[data-card="${d.id}"]`} onClose={() => setUi((u) => ({ ...u, current: null }))}>{detail(d, "@[50rem]:top-20")}</Drawer>}
        </>
      ) : (
        <div className="grid gap-6 min-[1400px]:grid-cols-[17rem_minmax(0,1fr)] min-[1400px]:items-start">
          <ul aria-label="Dossiers" className={`space-y-2 ${detailOpen ? "hidden min-[1400px]:block" : ""}`}>
            {shown.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => setUi((u) => ({ ...u, current: x.id, creating: false }))} aria-current={x.id === current ? "true" : undefined} className="w-full rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-sky-50 aria-[current=true]:shadow-[inset_4px_0_0_var(--color-navy)]">
                  <span className="block font-display font-semibold text-ink">{x.client_name}</span>
                  <span className="block text-sm text-ink/80">{x.title}</span>
                  <span className="mt-1 block text-xs text-muted">{statusLabel[x.status]?.fr ?? x.status}{x.due_date && !isLate(x) ? ` · ${dueInfo(x.due_date).text.toLowerCase()}` : ""}{x.assignee ? ` · ${x.assignee}` : ""}</span>
                  {(waiting.has(x.id) || isLate(x)) && <span className="mt-2 flex flex-wrap gap-1.5"><DossierFlags d={x} waiting={waiting.has(x.id)} /></span>}
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">{filtered ? "Aucun dossier ne correspond à ces filtres." : "Aucun dossier en cours. Créez-en un avec « Nouveau dossier »."}</li>}
          </ul>
          <div className={`min-w-0 ${detailOpen ? "" : "hidden min-[1400px]:block"}`}>
            {detailOpen && <button type="button" onClick={closeDetail} className={`${smallBtn} mb-4 min-[1400px]:hidden`}>← Dossiers</button>}
            {creating ? <NewDossier key={draft?.id ?? "nouveau"} draft={draft} onCreate={create} /> : d ? detail(d, "@[50rem]:top-28") : <p className={empty}>Choisissez un dossier dans la liste, ou créez-en un.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── Clients ───────────── */
/** Fiches clients : regroupe les dossiers par courriel. Les coordonnées des demandes ne sont pas vérifiées. */
function Clients({ dossiers, leads, onShow, openDossier }: { dossiers: Dossier[]; leads: Lead[]; onShow: (email: string) => void; openDossier: (id: string) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const map = new Map<string, { email: string; name: string; dossiers: Dossier[]; lead: Lead | null }>();
    for (const x of dossiers) {
      const r = map.get(x.client_email) ?? { email: x.client_email, name: x.client_name, dossiers: [], lead: null };
      r.dossiers.push(x);
      map.set(x.client_email, r);
    }
    for (const x of leads) { const r = x.email ? map.get(x.email) : undefined; if (r && !r.lead && x.phone) r.lead = x; }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [dossiers, leads]);
  const n = q.trim().toLowerCase();
  const shown = list.filter((r) => !n || `${r.name} ${r.email}`.toLowerCase().includes(n));
  return (
    <div>
      <label htmlFor="cl-q" className="sr-only">Chercher un client</label>
      <input id="cl-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un client" className="field mb-4 min-h-11 max-w-md py-2" />
      {shown.length === 0 ? <p className={empty}>{n ? "Aucun client ne correspond à cette recherche." : "Aucun client. Un client apparaît ici dès qu'un dossier est ouvert à son nom."}</p> : (
        <ul className="grid gap-4 md:grid-cols-2">
          {shown.map((r) => {
            const active = r.dossiers.filter((d) => d.status !== "ferme").length;
            const closed = r.dossiers.length - active;
            return (
              <li key={r.email} className="rounded-3xl border border-line bg-white p-5">
                <h2 className="font-display text-lg font-semibold text-ink">{r.name}</h2>
                <p className="mt-0.5 text-sm"><a href={mailto(r.email)} className={link}>{r.email}</a></p>
                {r.lead?.phone && <p className="mt-1 text-sm text-muted"><a href={telto(r.lead.phone)} className={link}>{r.lead.phone}</a> · non vérifié (demande du {fmtDate(r.lead.created_at, "fr")})</p>}
                <p className="mt-3 text-sm text-muted">{active} dossier{active > 1 ? "s" : ""} en cours · {closed} fermé{closed > 1 ? "s" : ""} · dernière activité {fmtDate(r.dossiers[0].updated_at, "fr")}</p>
                <ul className="mt-3 space-y-1">
                  {r.dossiers.slice(0, 4).map((d) => (
                    <li key={d.id}>
                      <button type="button" onClick={() => openDossier(d.id)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-sm hover:bg-sky-50">
                        <span className="truncate font-medium text-navy underline underline-offset-4">{d.title}</span>
                        <span className={`${pill} shrink-0 bg-[#eef0f6] text-ink`}>{statusLabel[d.status]?.fr ?? d.status}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {r.dossiers.length > 4 && <button type="button" onClick={() => onShow(r.email)} className={`${smallBtn} mt-3`}>Voir ses {r.dossiers.length} dossiers</button>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ───────────── Réglages : équipe et rappels ───────────── */
function Team({ me }: { me: string }) {
  const load = useLoad(() => rows<Member>(supabase().from("staff").select("email,name,is_admin").order("name")));
  const [err, setErr] = useState("");
  const admin = Boolean(load.data?.find((m) => m.email === me)?.is_admin);
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const m: Member = { email: String(f.get("email")).trim().toLowerCase(), name: String(f.get("name")).trim(), is_admin: false };
    if (load.data?.some((x) => x.email === m.email)) { setErr("Ce courriel est déjà dans l'équipe."); return; }
    setErr("");
    load.set((l) => [...(l ?? []), m]);
    if (await save(supabase().from("staff").insert({ email: m.email, name: m.name }), { ok: `${m.name} fait maintenant partie de l'équipe.`, rollback: () => load.set((l) => l?.filter((x) => x.email !== m.email) ?? null) })) form.reset();
  };
  const remove = (m: Member) => {
    if (!window.confirm(`Retirer ${m.name || m.email} de l'équipe ?\nCette personne n'aura plus accès au tableau de bord.`)) return;
    load.set((l) => l?.filter((x) => x.email !== m.email) ?? null);
    save(supabase().from("staff").delete().eq("email", m.email), { ok: `${m.name || m.email} retiré de l'équipe.`, rollback: () => load.set((l) => [...(l ?? []), m]) });
  };
  return (
    <Card title={`Équipe${load.data ? ` (${load.data.length})` : ""}`}>
      <p className="mb-3 text-sm text-muted">Ces personnes voient toutes les demandes, tous les dossiers et tous les documents. Retirez sans délai toute personne qui quitte le cabinet.</p>
      <Loadable load={load} label="Chargement de l'équipe" rows={1}>
        {(list) => (
          <>
            <ul className="divide-y divide-line">
              {list.map((m) => (
                <li key={m.email} className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-1.5">
                  <span className="min-w-0"><span className="font-medium text-ink">{m.name || m.email}</span> <span className="text-sm break-all text-muted">· {m.email}</span></span>
                  <span className="flex items-center gap-2">
                    {m.is_admin && <span className={`${pill} bg-sky-100 text-navy`}>Administrateur</span>}
                    {m.email === me ? <span className="px-2 text-sm text-muted">Vous</span> : admin && !m.is_admin ? <button type="button" className={removeBtn} aria-label={`Retirer ${m.name || m.email} de l'équipe`} onClick={() => remove(m)}>Retirer</button> : null}
                  </span>
                </li>
              ))}
            </ul>
            {admin ? (
              <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div><label htmlFor="tm-name" className="label">Nom</label><input id="tm-name" name="name" required maxLength={120} className="field" /></div>
                <div><label htmlFor="tm-email" className="label">Courriel</label><input id="tm-email" name="email" type="email" required maxLength={200} autoCapitalize="none" className="field" /></div>
                <button type="submit" className="btn-primary min-h-12">Ajouter</button>
              </form>
            ) : <p className="mt-4 rounded-xl bg-[#f5f7fb] px-4 py-3 text-sm text-ink">Seul l'administrateur peut modifier l'équipe.</p>}
            <p role="alert" className={err ? "mt-3 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{err}</p>
          </>
        )}
      </Loadable>
    </Card>
  );
}

function Reminders() {
  const load = useLoad(() => rows<Sub>(supabase().from("reminder_subscribers").select("*").order("consent_at", { ascending: false })));
  const setOff = (s: Sub, at: string | null, ok: string, undo?: () => void) => {
    load.set((l) => l?.map((x) => (x.id === s.id ? { ...x, unsubscribed_at: at } : x)) ?? null);
    save(supabase().from("reminder_subscribers").update({ unsubscribed_at: at }).eq("id", s.id), { ok, undo, rollback: () => load.set((l) => l?.map((x) => (x.id === s.id ? { ...x, unsubscribed_at: s.unsubscribed_at } : x)) ?? null) });
  };
  const unsubscribe = (s: Sub) => {
    const at = new Date().toISOString();
    setOff(s, at, `${s.email} désinscrit.`, () => setOff({ ...s, unsubscribed_at: at }, null, `${s.email} réinscrit.`));
  };
  const resubscribe = (s: Sub) => { if (window.confirm(`Réinscrire ${s.email} aux rappels ?\nFaites-le seulement si cette personne l'a demandé.`)) setOff(s, null, `${s.email} réinscrit.`); };
  const active = (load.data ?? []).filter((s) => !s.unsubscribed_at);
  const csv = () => {
    // Chaque champ est entre guillemets, et un début de formule (=, +, -, @) est neutralisé pour les tableurs.
    const q = (s: string) => `"${(/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"`;
    const blob = new Blob(["courriel,langue,consentement\n" + active.map((s) => [s.email, s.lang, s.consent_at].map(q).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "rappels-fiscaux.csv"; a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Card title={`Inscrits aux rappels fiscaux${load.data ? ` (${active.length})` : ""}`} aside={active.length > 0 && <button type="button" onClick={csv} className={smallBtn}>Exporter (CSV)</button>}>
      <p className="mb-3 text-sm text-muted">Ces personnes ont donné leur consentement explicite pour recevoir les rappels d'échéances. Désinscrivez sans délai toute personne qui le demande.</p>
      <Loadable load={load} label="Chargement des inscriptions" rows={1}>
        {(subs) => (subs.length === 0 ? <p className="text-sm text-muted">Aucune inscription pour l'instant.</p> : (
          <ul className="divide-y divide-line">
            {subs.map((s) => (
              <li key={s.id} className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                <span className={`break-all ${s.unsubscribed_at ? "text-muted line-through" : "font-medium text-ink"}`}>{s.email}</span>
                <span className="flex items-center gap-2 text-muted">
                  {s.lang.toUpperCase()} · {s.unsubscribed_at ? "désinscrit" : fmtDate(s.consent_at, "fr")}
                  {s.unsubscribed_at
                    ? <button type="button" className={`${link} inline-flex min-h-11 items-center px-3 text-sm`} onClick={() => resubscribe(s)}>Réinscrire</button>
                    : <button type="button" className={removeBtn} aria-label={`Désinscrire ${s.email}`} onClick={() => unsubscribe(s)}>Désinscrire</button>}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </Loadable>
    </Card>
  );
}

/* ───────────── Espace de travail ───────────── */
async function loadStore(): Promise<Store> {
  const db = supabase();
  const [dossiers, leads, waiting, staff, tasks, clientDocs, pending] = await Promise.all([
    rows<Dossier>(db.from("dossiers").select("*").order("updated_at", { ascending: false }).limit(500)),
    rows<Lead>(db.from("leads").select("*").order("created_at", { ascending: false }).limit(300)),
    rows<string>(db.rpc("dossiers_a_repondre")),
    rows<{ name: string; email: string }>(db.from("staff").select("name,email").order("name")),
    rows<Task>(db.from("tasks").select("*").eq("done", false).order("created_at").limit(500)),
    rows<FileDoc>(db.from("documents").select("*").eq("uploader_role", "client").order("created_at", { ascending: false }).limit(200)),
    rows<{ id: string }>(db.from("document_requests").select("id").eq("received", false).limit(2000)),
  ]);
  return { dossiers, leads, waiting, team: staff.map((m) => m.name || m.email), tasks, clientDocs, pendingReqs: pending.map((r) => r.id) };
}

function Workspace({ email, staffName }: { email: string; staffName: string }) {
  const load = useLoad(loadStore);
  const { set, reload } = load;
  const snap = useRef<Store | null>(null);
  snap.current = load.data;
  const dirty = useRef(false);
  const [section, setSection] = useState<Section>("aujourdhui");
  const [leadFilter, setLeadFilter] = useState("ouverts");
  const [focusLead, setFocusLead] = useState<string | null>(null);
  const [draft, setDraft] = useState<Lead | null>(null);
  const [ui, setUi] = useState<DossierUi>({ view: "liste", current: null, creating: false, filter: NO_FILTER });

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (SECTIONS.some(([k]) => k === h)) setSection(h as Section);
  }, []);
  const go = useCallback((k: Section) => {
    setSection(k);
    try { window.history.replaceState(null, "", `#${k}`); } catch { /* adresse non modifiable : sans conséquence */ }
    // Les chiffres ne sont rechargés que si une fiche de dossier a été ouverte entre-temps.
    if (k === "aujourdhui" && dirty.current) { dirty.current = false; reload(); }
  }, [reload]);
  const touch = useCallback(() => { dirty.current = true; }, []);

  const edit = useCallback(<K extends keyof Store>(k: K, f: (v: Store[K]) => Store[K]) => set((s) => (s ? { ...s, [k]: f(s[k]) } : s)), [set]);
  const patchDossier: PatchDossier = useCallback((id, p, o = {}) => {
    const before = snap.current?.dossiers.find((x) => x.id === id);
    if (!before) return Promise.resolve(false);
    const back = Object.fromEntries(Object.keys(p).map((k) => [k, before[k as keyof Dossier]])) as Partial<Dossier>;
    edit("dossiers", (l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
    return save(supabase().from("dossiers").update(p).eq("id", id), { ...o, rollback: () => edit("dossiers", (l) => l.map((x) => (x.id === id ? { ...x, ...back } : x))) });
  }, [edit]);
  const patchLead: PatchLead = useCallback((id, p, o = {}) => {
    const before = snap.current?.leads.find((x) => x.id === id);
    if (!before) return Promise.resolve(false);
    const back = Object.fromEntries(Object.keys(p).map((k) => [k, before[k as keyof Lead]])) as Partial<Lead>;
    edit("leads", (l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
    return save(supabase().from("leads").update(p).eq("id", id), { ...o, rollback: () => edit("leads", (l) => l.map((x) => (x.id === id ? { ...x, ...back } : x))) });
  }, [edit]);
  /** Changement d'étape : confirmation si le client le remarque (transmis, fermé), puis message avec « Annuler ». */
  const move = useCallback((id: string, status: string) => {
    const d = snap.current?.dossiers.find((x) => x.id === id);
    if (!d || d.status === status) return;
    const label = statusLabel[status]?.fr ?? status;
    if ((status === "transmis" || status === "ferme") && !window.confirm(`Passer le dossier « ${d.title} » de ${d.client_name} à l'étape « ${label} » ?\nLe client verra ce changement dans son espace.`)) return;
    const prev = d.status;
    patchDossier(id, { status }, { ok: `${d.client_name} → ${label}`, undo: () => { patchDossier(id, { status: prev }, { ok: "Étape rétablie." }); } });
  }, [patchDossier]);
  const addLead = useCallback((l: Lead) => {
    edit("leads", (list) => [l, ...list]);
    const { created_at: _local, ...payload } = l;
    void _local;
    return save(supabase().from("leads").insert(payload), { ok: "Demande ajoutée.", rollback: () => edit("leads", (list) => list.filter((x) => x.id !== l.id)) });
  }, [edit]);
  const completeTask = useCallback((t: Task) => {
    const open = { ...t, done: false };
    const setDone = (done: boolean, ok: string, undo?: () => void) => {
      edit("tasks", (l) => (done ? l.filter((x) => x.id !== t.id) : [...l, open]));
      save(supabase().from("tasks").update({ done }).eq("id", t.id), { ok, undo, rollback: () => edit("tasks", (l) => (done ? [...l, open] : l.filter((x) => x.id !== t.id))) });
    };
    setDone(true, "Tâche terminée.", () => setDone(false, "Tâche rouverte."));
  }, [edit]);
  const markReceived = useCallback((requestId: string) => {
    edit("pendingReqs", (l) => l.filter((x) => x !== requestId));
    save(supabase().from("document_requests").update({ received: true }).eq("id", requestId), { ok: "Marqué reçu.", rollback: () => edit("pendingReqs", (l) => [...l, requestId]) });
  }, [edit]);

  const openDossier = useCallback((id: string) => {
    // Les filtres sont remis à zéro pour que le dossier ouvert figure dans la liste à côté de sa fiche.
    const closed = snap.current?.dossiers.find((x) => x.id === id)?.status === "ferme";
    setUi((u) => ({ ...u, view: "liste", current: id, creating: false, filter: { ...NO_FILTER, scope: closed ? "tous" : "a_faire" } }));
    go("dossiers");
  }, [go]);
  const showDossiers = useCallback((f: Partial<DFilter>) => { setUi((u) => ({ ...u, view: "liste", current: null, creating: false, filter: { ...NO_FILTER, ...f } })); go("dossiers"); }, [go]);
  const showLeads = useCallback((f: string) => { setFocusLead(null); setLeadFilter(f); go("demandes"); }, [go]);
  const onCreated = useCallback((d: Dossier, lead: Lead | null) => {
    edit("dossiers", (l) => [d, ...l]);
    if (lead) patchLead(lead.id, { status: "client" });
    setDraft(null);
    setUi((u) => ({ ...u, view: "liste", current: d.id, creating: false }));
  }, [edit, patchLead]);

  const store = load.data;
  const badges: Partial<Record<Section, [number, string]>> = store ? {
    demandes: [store.leads.filter((l) => l.status === "nouveau").length, "nouvelles demandes"],
    dossiers: [store.dossiers.filter((d) => store.waiting.includes(d.id)).length, "messages à lire"],
  } : {};
  const refresh = <button type="button" onClick={() => reload(true)} className={smallBtn}>Actualiser</button>;
  const firstName = staffName.includes("@") ? "" : staffName.split(" ")[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-6 [&_.field]:placeholder:text-muted">
      <SideNav section={section} go={go} badges={badges} />
      <div className="min-w-0">
        {section === "reglages" ? (
          <>
            <SectionHead title="Réglages" sub="Équipe du cabinet et inscriptions aux rappels fiscaux." />
            <div className="grid gap-6 xl:grid-cols-2 xl:items-start"><Team me={email.toLowerCase()} /><Reminders /></div>
          </>
        ) : !store ? (
          load.error ? <LoadError lang="fr" retry={() => reload()} /> : <Skeleton label="Chargement du tableau de bord" rows={4} />
        ) : section === "aujourdhui" ? (
          <>
            <SectionHead title={firstName ? `Bonjour, ${firstName}` : "Bonjour"} sub={`${new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Montreal" }).format(new Date())}. Voici ce qui demande votre attention.`}>{refresh}</SectionHead>
            <Today store={store} staffName={staffName} openDossier={openDossier} openLead={(id) => { setLeadFilter("ouverts"); setFocusLead(id); go("demandes"); }} showDossiers={showDossiers} showLeads={showLeads} completeTask={completeTask} markReceived={markReceived} />
          </>
        ) : section === "demandes" ? (
          <>
            <SectionHead title="Demandes" sub="Formulaire du site, Clara, appels et visites.">{refresh}</SectionHead>
            <Leads leads={store.leads} filter={leadFilter} setFilter={(f) => { setFocusLead(null); setLeadFilter(f); }} focusId={focusLead} patch={patchLead} onAdd={addLead} onCreateDossier={(l) => { setDraft(l); setUi((u) => ({ ...u, view: "liste", current: null, creating: true })); go("dossiers"); }} />
          </>
        ) : section === "dossiers" ? (
          <>
            <div className={ui.view === "liste" && (ui.creating || ui.current) ? "hidden min-[1400px]:block" : ""}><SectionHead title="Dossiers">{refresh}</SectionHead></div>
            <Dossiers store={store} ui={ui} setUi={setUi} staffName={staffName} draft={draft} clearDraft={() => setDraft(null)} patch={patchDossier} move={move} onCreated={onCreated} onTouch={touch} />
          </>
        ) : section === "clients" ? (
          <>
            <SectionHead title="Clients" sub="Un client apparaît dès qu'un dossier est ouvert à son nom." />
            <Clients dossiers={store.dossiers} leads={store.leads} onShow={(e) => showDossiers({ scope: "tous", q: e })} openDossier={openDossier} />
          </>
        ) : (
          <>
            <SectionHead title="Honoraires" sub="Toutes les factures du cabinet. Les brouillons ne sont pas visibles par les clients." />
            <Fees dossiers={store.dossiers} openDossier={openDossier} />
          </>
        )}
      </div>
    </div>
  );
}

/** Vérifie que le courriel connecté fait partie de l'équipe avant d'afficher quoi que ce soit. */
function Board({ email }: { email: string }) {
  const me = useLoad(async () => {
    const { data, error } = await supabase().from("staff").select("name").eq("email", email.toLowerCase()).maybeSingle();
    if (error) throw error;
    return { staff: data as { name: string } | null };
  }, email);
  if (!me.data) return me.error ? <LoadError lang="fr" retry={() => me.reload()} /> : <Skeleton label="Vérification de votre accès" rows={2} />;
  if (!me.data.staff)
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-white p-7">
        <h1 className="font-display text-xl font-semibold text-ink">Accès réservé à l'équipe du cabinet.</h1>
        <p className="mt-2 leading-relaxed text-muted">Le courriel {email} n'est pas dans la liste de l'équipe. Si vous êtes client, votre espace est ici : <a className={link} href="/espace-client/">Mon espace client</a>.</p>
      </div>
    );
  return <Workspace email={email} staffName={me.data.staff.name || email} />;
}

export function Dashboard() {
  return <AppFrame lang="fr" title="Tableau de bord" subtitle="Gestion du cabinet" demo="cabinet" wide>{(s) => <Board email={s.email} />}</AppFrame>;
}
