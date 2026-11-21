"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { backendReady, real, supabase } from "@/lib/supabase";
import { DEMO_CODE, DEMO_EMAIL, demoRole, setDemo, type DemoRole } from "@/lib/demo";
import { site, type Lang } from "@/lib/site";
import { LogoMark } from "../Logo";

export type Role = "client" | "cabinet";
export type Dossier = {
  id: string; created_at: string; updated_at: string; client_email: string; client_name: string; title: string;
  kind: string; tax_year: number | null; status: string; next_step: string; due_date: string | null; lead_id: string | null; assignee?: string; savings_cents?: number | null; weather?: "degage" | "nuageux" | "orage" | null; weather_note?: string;
};
export type Doc = { id: string; dossier_id: string; created_at: string; uploader_role: Role; path: string; name: string; size: number; request_id?: string | null };
export type Message = { id: string; dossier_id: string; created_at: string; author_role: Role; author_name: string; body: string };
export type DocRequest = { id: string; dossier_id: string; label: string; received: boolean };

export const STATUSES = ["ouvert", "documents_attendus", "en_preparation", "en_revision", "a_signer", "transmis", "ferme"] as const;
export const statusLabel: Record<string, { fr: string; en: string }> = {
  ouvert: { fr: "Dossier ouvert", en: "File opened" },
  documents_attendus: { fr: "Documents attendus", en: "Waiting for documents" },
  en_preparation: { fr: "En préparation", en: "In preparation" },
  en_revision: { fr: "Révision par un CPA", en: "CPA review" },
  a_signer: { fr: "À signer", en: "Ready to sign" },
  transmis: { fr: "Transmis", en: "Filed" },
  ferme: { fr: "Dossier fermé", en: "File closed" },
};
export const KINDS: Record<string, { fr: string; en: string }> = {
  impot_particulier: { fr: "Impôts personnels", en: "Personal taxes" },
  travailleur_autonome: { fr: "Travailleur autonome", en: "Self-employed" },
  impot_societe: { fr: "Impôts de société", en: "Corporate taxes" },
  taxes: { fr: "TPS / TVQ", en: "GST / QST" },
  etats_financiers: { fr: "États financiers", en: "Financial statements" },
  tenue_de_livres: { fr: "Tenue de livres", en: "Bookkeeping" },
  lettre_fisc: { fr: "Lettre du fisc", en: "Tax letter" },
  autre: { fr: "Autre", en: "Other" },
};

export const fmtDate = (iso: string, lang: Lang, time = false) =>
  new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", { day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: iso.length === 10 ? "UTC" : "America/Montreal" }).format(new Date(iso));
const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} ko`);

const tx = {
  fr: {
    notReady: "Cet espace n'est pas encore activé.", notReadyD: "Il sera ouvert dès que le cabinet aura confirmé sa mise en service. D'ici là, écrivez-nous ou appelez-nous.",
    email: "Votre courriel", send: "Recevoir mon lien de connexion", sending: "Envoi…", sent: "Vérifiez vos courriels : nous venons de vous envoyer un lien de connexion. Il est valide quelques minutes.",
    error: "L'envoi n'a pas fonctionné. Réessayez dans un instant.", noPwd: "Pas de mot de passe à retenir : vous recevez un lien sécurisé par courriel.", logout: "Se déconnecter", back: "Retour au site",
    docs: "Documents", noDocs: "Aucun document pour l'instant.", upload: "Déposer un document", uploading: "Dépôt en cours…", uploadHelp: "PDF, photo, Excel ou Word. 25 Mo maximum par fichier.",
    uploadErr: "Le dépôt n'a pas fonctionné. Vérifiez le type et la taille du fichier.", fromClient: "Client", fromFirm: "Cabinet", open: "Ouvrir", remove: "Supprimer",
    msgs: "Messages", noMsgs: "Aucun message pour l'instant.", write: "Votre message", sendMsg: "Envoyer", you: "Vous",
  },
  en: {
    notReady: "This space is not active yet.", notReadyD: "It will open as soon as the firm confirms its launch. Until then, write or call us.",
    email: "Your email", send: "Email me a sign-in link", sending: "Sending…", sent: "Check your inbox: we just sent you a sign-in link. It is valid for a few minutes.",
    error: "That did not work. Please try again in a moment.", noPwd: "No password to remember: you receive a secure link by email.", logout: "Sign out", back: "Back to the website",
    docs: "Documents", noDocs: "No documents yet.", upload: "Upload a document", uploading: "Uploading…", uploadHelp: "PDF, photo, Excel or Word. 25 MB maximum per file.",
    uploadErr: "The upload failed. Check the file type and size.", fromClient: "Client", fromFirm: "Firm", open: "Open", remove: "Delete",
    msgs: "Messages", noMsgs: "No messages yet.", write: "Your message", sendMsg: "Send", you: "You",
  },
};

/** Session de l'application : vraie (courriel vérifié) ou démonstration (code 232323, données fictives). */
export type AppSession = { email: string; demo: boolean };

/* ───────────── Messages de confirmation (toasts) ───────────── */
type Toast = { id: number; text: string; kind: "ok" | "error"; undo?: () => void };
let pushToast: (t: Omit<Toast, "id">) => void = () => {};
/** Affiche une confirmation ou une erreur en bas de l'écran. `undo` ajoute un bouton « Annuler ». */
export const toast = (text: string, kind: "ok" | "error" = "ok", undo?: () => void) => pushToast({ text, kind, undo });
const FAIL = { fr: "Non enregistré. Vérifiez votre connexion et réessayez.", en: "Not saved. Check your connection and try again." };
/**
 * Exécute une écriture et dit toujours ce qui s'est passé. Renvoie true si elle a réussi ;
 * sinon affiche l'erreur et appelle `rollback` pour remettre l'écran dans son état précédent.
 */
export async function save(q: PromiseLike<{ error: unknown }>, o: { ok?: string; rollback?: () => void; undo?: () => void; lang?: Lang } = {}): Promise<boolean> {
  let failed = false;
  try { failed = Boolean((await q).error); } catch { failed = true; }
  if (failed) { o.rollback?.(); toast(FAIL[o.lang ?? "fr"], "error"); return false; }
  if (o.ok) toast(o.ok, "ok", o.undo);
  return true;
}

function Toaster({ lang }: { lang: Lang }) {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => {
    let n = 0;
    pushToast = (t) => {
      const id = ++n;
      setList((l) => [...l.slice(-2), { ...t, id }]);
      window.setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), t.undo ? 15000 : 3500);
    };
    return () => { pushToast = () => {}; };
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4 sm:top-auto sm:bottom-6">
      {list.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex max-w-md items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium shadow-[0_18px_50px_-20px_rgba(23,23,58,.6)] ${t.kind === "ok" ? "bg-navy text-white" : "bg-[#7a1c16] text-white"}`}>
          <span>{t.text}</span>
          {t.undo && <button type="button" className="shrink-0 font-semibold underline underline-offset-4" onClick={() => { t.undo!(); setList((l) => l.filter((x) => x.id !== t.id)); }}>{lang === "fr" ? "Annuler" : "Undo"}</button>}
        </div>
      ))}
    </div>
  );
}

/** Blocs gris animés pendant un chargement (au lieu de « … »). */
export function Skeleton({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-[#e3e8f1] motion-reduce:animate-none" />)}
    </div>
  );
}

/** Erreur de chargement, distincte d'une liste vide. */
export function LoadError({ lang, retry }: { lang: Lang; retry: () => void }) {
  return (
    <div role="alert" className="max-w-xl rounded-3xl border border-[#e9c7a0] bg-[#fff4e5] p-6 text-[#6b3d00]">
      <p className="font-display text-lg font-semibold">{lang === "fr" ? "Impossible de charger les données." : "We could not load the data."}</p>
      <p className="mt-1 text-sm">{lang === "fr" ? "Vos renseignements sont en sécurité. Vérifiez votre connexion, puis réessayez." : "Your information is safe. Check your connection, then try again."}</p>
      <button type="button" onClick={retry} className="btn-secondary mt-4 min-h-11">{lang === "fr" ? "Réessayer" : "Try again"}</button>
    </div>
  );
}

/* ───────────── Notifications : cloche, pastille, alertes du navigateur ───────────── */
type Notice = { id: string; text: string; at: string; hash?: string };
const SEEN = (role: Role | "cabinet" | "client") => `ocpa-notif-seen-${role}`;
const readSeen = (role: string) => { try { return localStorage.getItem(SEEN(role as Role)) ?? ""; } catch { return ""; } };

async function fetchNotices(role: "cabinet" | "client", lang: Lang): Promise<Notice[]> {
  const fr = lang === "fr";
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const db = supabase();
  const get = async <T,>(q: PromiseLike<{ data: unknown; error: unknown }>) => { const r = await q; return r.error ? [] : ((r.data as T[]) ?? []); };
  if (role === "cabinet") {
    const [acts, leads] = await Promise.all([
      get<{ id: number; created_at: string; kind: string; detail: string; actor_role: string }>(db.from("activity").select("*").eq("actor_role", "client").gte("created_at", since).order("created_at", { ascending: false }).limit(20)),
      get<{ id: string; created_at: string; name: string; topic: string | null; source: string }>(db.from("leads").select("*").eq("status", "nouveau").gte("created_at", since).order("created_at", { ascending: false }).limit(20)),
    ]);
    return [
      ...acts.map((a) => ({ id: `a${a.id}`, at: a.created_at, hash: "#dossiers", text: a.kind === "message" ? `Nouveau message d'un client : « ${a.detail} »` : a.kind === "document_depose" ? `Un client a déposé un document : ${a.detail}` : `Activité d'un client : ${a.detail}` })),
      ...leads.map((l) => ({ id: `l${l.id}`, at: l.created_at, hash: "#demandes", text: `Nouvelle demande${l.source === "clara" ? " (Clara)" : ""} : ${l.name}${l.topic ? `, ${l.topic}` : ""}` })),
    ].sort((a, b) => b.at.localeCompare(a.at));
  }
  const [msgs, docs, invs] = await Promise.all([
    get<Message>(db.from("messages").select("*").eq("author_role", "cabinet").gte("created_at", since).order("created_at", { ascending: false }).limit(20)),
    get<Doc>(db.from("documents").select("*").eq("uploader_role", "cabinet").gte("created_at", since).order("created_at", { ascending: false }).limit(20)),
    get<{ id: string; created_at: string; label: string }>(db.from("invoices").select("*").eq("status", "a_payer").gte("created_at", since).order("created_at", { ascending: false }).limit(20)),
  ]);
  return [
    ...msgs.map((m) => ({ id: `m${m.id}`, at: m.created_at, text: fr ? `Nouveau message du cabinet : « ${m.body.slice(0, 90)} »` : `New message from the firm: "${m.body.slice(0, 90)}"` })),
    ...docs.map((d) => ({ id: `d${d.id}`, at: d.created_at, text: fr ? `Le cabinet vous a envoyé un document : ${d.name}` : `The firm sent you a document: ${d.name}` })),
    ...invs.map((i) => ({ id: `i${i.id}`, at: i.created_at, text: fr ? `Honoraires à régler : ${i.label}` : `Fees to pay: ${i.label}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

function Bell({ role, lang }: { role: "cabinet" | "client"; lang: Lang }) {
  const fr = lang === "fr";
  const [items, setItems] = useState<Notice[]>([]);
  const [seen, setSeen] = useState("");
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  const known = useRef<Set<string> | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeen(readSeen(role));
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    let stop = false;
    const tick = async () => {
      const list = await fetchNotices(role, lang).catch(() => [] as Notice[]);
      if (stop) return;
      // Une alerte seulement pour ce qui arrive pendant que l'application est ouverte.
      if (known.current) {
        const fresh = list.filter((n) => !known.current!.has(n.id));
        if (fresh.length) {
          toast(fresh[0].text.slice(0, 120));
          if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(role === "cabinet" ? "Othmani CPA · Gestion" : "Pilote Fiscal", { body: fresh[0].text, icon: "/icons/icon-192.png", tag: fresh[0].id }); } catch { /* alerte indisponible */ }
          }
        }
      }
      known.current = new Set(list.map((n) => n.id));
      setItems(list);
    };
    tick();
    const id = window.setInterval(tick, 45_000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => { stop = true; window.clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [role, lang]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const unread = items.filter((n) => n.at > seen).length;
  const markRead = () => { const now = new Date().toISOString(); try { localStorage.setItem(SEEN(role), now); } catch { /* stockage indisponible */ } setSeen(now); };
  const enable = async () => { try { setPerm(await Notification.requestPermission()); } catch { setPerm("denied"); } };

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={fr ? `Notifications${unread ? `, ${unread} nouvelle${unread > 1 ? "s" : ""}` : ""}` : `Notifications${unread ? `, ${unread} new` : ""}`} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white/70 text-navy transition-shadow hover:shadow-[0_0_24px_-6px_rgba(111,193,216,.9)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></svg>
        {unread > 0 && <span className="fx-dot absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c0392b] px-1 text-[0.68rem] font-bold text-white" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white bg-white shadow-[0_40px_90px_-40px_rgba(23,23,58,.7)]">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <p className="font-display font-semibold text-navy">Notifications</p>
            {unread > 0 && <button type="button" onClick={markRead} className="text-sm font-semibold text-navy underline underline-offset-4">{fr ? "Tout marquer comme lu" : "Mark all as read"}</button>}
          </div>
          {items.length === 0 ? <p className="px-5 py-6 text-sm text-muted">{fr ? "Rien de nouveau pour l'instant." : "Nothing new for now."}</p> : (
            <ul className="max-h-[22rem] divide-y divide-line overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <a href={n.hash ?? "#"} onClick={(e) => { if (!n.hash) e.preventDefault(); setOpen(false); markRead(); }} className="flex gap-3 px-5 py-3 text-sm hover:bg-[#f3f7fc]">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.at > seen ? "bg-[#3fa9c9]" : "bg-transparent"}`} aria-hidden="true" />
                    <span><span className={`block leading-snug ${n.at > seen ? "font-semibold text-ink" : "text-ink/80"}`}>{n.text}</span><span className="mt-0.5 block text-xs text-muted">{fmtDate(n.at, lang, true)}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {perm === "default" && (
            <div className="border-t border-line bg-[#f3f7fc] px-5 py-3.5">
              <button type="button" onClick={enable} className="btn-secondary min-h-10 w-full px-4 py-2 text-sm">{fr ? "Activer les alertes sur cet appareil" : "Turn on alerts on this device"}</button>
              <p className="mt-2 text-xs text-muted">{fr ? "Vous serez averti quand l'application est ouverte en arrière-plan." : "You will be alerted while the app is open in the background."}</p>
            </div>
          )}
          {perm === "denied" && <p className="border-t border-line bg-[#f3f7fc] px-5 py-3 text-xs text-muted">{fr ? "Les alertes sont bloquées dans les réglages de votre navigateur." : "Alerts are blocked in your browser settings."}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Cadre commun : en-tête vitré, connexion, puis contenu.
 * Connexion réelle : courriel, puis code à 6 chiffres reçu par courriel (ou lien du même courriel).
 * Code 232323 : mode démonstration, données fictives seulement (voir lib/demo.ts).
 */
export function AppFrame({ lang, title, subtitle, demo, wide = false, children }: { lang: Lang; title: string; subtitle: string; demo: DemoRole; wide?: boolean; children: (s: AppSession) => ReactNode }) {
  const t = tx[lang];
  const fr = lang === "fr";
  const [session, setSession] = useState<AppSession | null | undefined>(undefined);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "badcode">("idle");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"email" | "code">("email");

  useEffect(() => {
    if (demoRole() === demo) { setSession({ email: DEMO_EMAIL[demo], demo: true }); return; }
    if (demoRole()) setDemo(null);
    if (!backendReady) { setSession(null); return; }
    real().auth.getSession().then(({ data }) => setSession(data.session?.user.email ? { email: data.session.user.email, demo: false } : null));
    const { data } = real().auth.onAuthStateChange((_e, s) => { if (!demoRole()) setSession(s?.user.email ? { email: s.user.email, demo: false } : null); });
    return () => data.subscription.unsubscribe();
  }, [demo]);

  const enterDemo = () => { setDemo(demo); setSession({ email: DEMO_EMAIL[demo], demo: true }); };
  const logout = async () => {
    if (session?.demo) { setDemo(null); setSession(null); setState("idle"); return; }
    await real().auth.signOut();
  };
  const sendCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (v === DEMO_CODE) { enterDemo(); return; }
    if (!backendReady) { setState("error"); return; }
    setEmail(v);
    setState("sending");
    const { error } = await real().auth.signInWithOtp({ email: v, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
    setState(error ? "error" : "sent");
  };
  const verify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s/g, "");
    if (code === DEMO_CODE) { enterDemo(); return; }
    const { error } = await real().auth.verifyOtp({ email, token: code, type: "email" });
    if (error) setState("badcode");
  };
  const msg = state === "error" ? t.error : state === "badcode" ? (fr ? "Ce code n'est pas valide ou a expiré. Demandez-en un nouveau." : "This code is invalid or has expired. Request a new one.") : "";

  return (
    <div className="app-fx min-h-svh" data-auth={session ? "" : undefined}>
      <header className={`glass sticky top-0 z-40 border-b border-white/70 pt-[env(safe-area-inset-top)] ${session ? "" : "hidden"}`}>
        <div className={`${wide ? "mx-auto max-w-[96rem] px-4 sm:px-6" : "container-site"} flex items-center justify-between gap-4 py-3`}>
          <a href={fr ? "/" : "/en/"} className="flex items-center gap-2.5 text-navy" aria-label={`${site.name}, ${t.back}`}>
            <LogoMark className="h-8 w-auto" />
            <span className="font-display text-base font-bold tracking-tight whitespace-nowrap sm:text-lg">{subtitle}</span>
          </a>
          {session ? (
            <div className="flex items-center gap-3 text-sm">
              <Bell role={demo} lang={lang} />
              <span className="hidden text-ink/80 md:inline">{session.email}</span>
              <button type="button" onClick={logout} className="rounded-full px-2 py-2 text-sm font-medium whitespace-nowrap text-navy underline underline-offset-4">{session.demo ? (fr ? "Quitter" : "Exit") : t.logout}</button>
            </div>
          ) : (
            <a href={fr ? "/" : "/en/"} className="text-sm font-medium text-navy underline underline-offset-4">{t.back}</a>
          )}
        </div>
        {session?.demo && <p className="bg-navy px-4 py-1.5 text-center text-xs font-medium text-white">{fr ? "Mode démonstration : données fictives, rien n'est enregistré." : "Demo mode: fictional data, nothing is saved."}</p>}
      </header>
      <main id="contenu" className={`${wide ? "mx-auto max-w-[96rem] px-4 sm:px-6" : "container-site"} ${session === null ? "flex min-h-svh items-center py-6 [&>*]:w-full" : "py-6 sm:py-10"}`}>
        {session === undefined ? (
          <Skeleton label={fr ? "Chargement" : "Loading"} />
        ) : session === null ? (
          <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_120px_-50px_rgba(23,23,58,.55)] lg:grid-cols-[1.05fr_1fr]">
            {/* Volet de marque */}
            <div className="mesh-dark on-dark relative flex flex-col justify-between gap-10 overflow-hidden p-7 text-white sm:p-10 lg:min-h-[36rem]">
              <img src="/images/consultation-700.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[35%_40%] opacity-25 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/30" aria-hidden="true" />
              <div className="relative flex items-center gap-3">
                <LogoMark className="h-10 w-auto" light />
                <span className="font-display text-lg font-bold tracking-tight">{site.name}</span>
              </div>
              <div className="relative">
                <p className="text-xs font-semibold tracking-[0.18em] text-sky uppercase">{subtitle}</p>
                <h1 className="mt-3 font-display text-[2rem] leading-[1.08] font-semibold tracking-[-0.02em] !text-white sm:text-[2.6rem]">{title}</h1>
                <p className="mt-4 max-w-sm leading-relaxed text-white/85">{demo === "client" ? (fr ? "Suivez votre dossier, déposez vos documents et écrivez à votre équipe, en toute confidentialité." : "Follow your file, upload your documents and message your team, in full confidentiality.") : "Demandes, dossiers, documents et honoraires du cabinet, au même endroit."}</p>
                <ul className="mt-7 hidden space-y-3 text-sm text-white/90 sm:block">
                  {(fr ? ["Données hébergées au Canada", "Protégé par le secret professionnel", "Connexion sans mot de passe"] : ["Data hosted in Canada", "Protected by professional secrecy", "Password-free sign-in"]).map((x) => (
                    <li key={x} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky/25 text-sky" aria-hidden="true"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Connexion */}
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy">{fr ? "Connexion" : "Sign in"}</h2>
              <div className="mt-5 grid grid-cols-2 rounded-full bg-[#eef1f7] p-1 text-sm font-semibold">
                {([["email", fr ? "Courriel" : "Email"], ["code", fr ? "Code d'accès" : "Access code"]] as const).map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={mode === k} onClick={() => { setMode(k); setState("idle"); }} className="rounded-full px-4 py-2.5 text-ink/75 transition-colors aria-pressed:bg-navy aria-pressed:text-white">{l}</button>
                ))}
              </div>

              {mode === "code" ? (
                <form onSubmit={(e) => { e.preventDefault(); if (String(new FormData(e.currentTarget).get("access") ?? "").trim() === DEMO_CODE) enterDemo(); else setState("badcode"); }} className="mt-7">
                  <label htmlFor="app-access" className="label">{fr ? "Votre code d'accès" : "Your access code"}</label>
                  <input id="app-access" name="access" type="password" inputMode="numeric" autoComplete="off" required maxLength={8} autoFocus className="field py-4 text-center font-display text-3xl tracking-[0.6em]" />
                  <button type="submit" className="btn-primary mt-5 w-full">{fr ? "Entrer" : "Enter"}</button>
                </form>
              ) : state === "sent" || state === "badcode" ? (
                <form onSubmit={verify} className="mt-7">
                  <p className="leading-relaxed text-ink">{fr ? <>Nous avons envoyé un code à <strong>{email}</strong>. Entrez-le ici, ou ouvrez le lien du courriel.</> : <>We sent a code to <strong>{email}</strong>. Enter it here, or open the link in the email.</>}</p>
                  <label htmlFor="app-code" className="label mt-5">{fr ? "Code reçu par courriel" : "Code from the email"}</label>
                  <input id="app-code" name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={10} autoFocus className="field py-4 text-center font-display text-3xl tracking-[0.4em]" />
                  <button type="submit" className="btn-primary mt-5 w-full">{fr ? "Entrer" : "Sign in"}</button>
                  <p className="mt-4 text-sm text-muted">{fr ? "Rien reçu ? Vérifiez vos indésirables, ou " : "Nothing received? Check your spam folder, or "}<button type="button" className="font-semibold text-navy underline underline-offset-4" onClick={() => setState("idle")}>{fr ? "recommencez" : "start over"}</button>.</p>
                </form>
              ) : (
                <form onSubmit={sendCode} className="mt-7">
                  <label htmlFor="app-email" className="label">{fr ? "Votre courriel" : "Your email"}</label>
                  <input id="app-email" name="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder={fr ? "nom@exemple.ca" : "name@example.ca"} className="field py-3.5" />
                  <button type="submit" disabled={state === "sending"} className="btn-primary mt-5 w-full">{state === "sending" ? t.sending : (fr ? "Recevoir mon code" : "Send my code")}</button>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{fr ? "Pas de mot de passe à retenir : vous recevez un code par courriel, valide quelques minutes." : "No password to remember: you receive a code by email, valid for a few minutes."}</p>
                </form>
              )}
              <p role="alert" className={msg ? "mt-5 rounded-2xl bg-[#fff4e5] px-4 py-3 text-sm text-[#6b3d00]" : "sr-only"}>{msg}</p>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm">
                <span className="text-ink/80">{fr ? "Besoin d'aide ? " : "Need help? "}<a className="font-semibold text-navy underline underline-offset-4" href={`tel:${site.phone.tel}`}>{site.phone.display}</a></span>
                <a href={fr ? "/" : "/en/"} className="font-medium text-navy underline underline-offset-4">{t.back}</a>
              </div>
            </div>
          </div>
        ) : (
          children(session)
        )}
      </main>
      <Toaster lang={lang} />
    </div>
  );
}

export function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Documents d'un dossier : liste, ouverture par lien temporaire, dépôt. */
export function Documents({ dossierId, role, lang }: { dossierId: string; role: Role; lang: Lang }) {
  const t = tx[lang];
  const [docs, setDocs] = useState<Doc[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase().from("documents").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false });
    setDocs((data as Doc[]) ?? []);
  }, [dossierId]);
  useEffect(() => { load(); }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setState("busy");
    let failed = false;
    for (const f of Array.from(files)) {
      const safe = f.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
      const path = `${dossierId}/${crypto.randomUUID()}-${safe}`;
      const up = await supabase().storage.from("documents").upload(path, f, { contentType: f.type || undefined });
      if (up.error) { failed = true; continue; }
      const ins = await supabase().from("documents").insert({ dossier_id: dossierId, uploader_role: role, path, name: f.name.slice(0, 200), size: f.size });
      if (ins.error) failed = true;
    }
    if (input.current) input.current.value = "";
    setState(failed ? "error" : "idle");
    if (!failed) toast(lang === "fr" ? "Document déposé." : "Document uploaded.");
    load();
  };

  const open = async (d: Doc) => {
    // Fenêtre ouverte tout de suite (sinon Safari la bloque), adresse fixée après la réponse.
    const w = window.open("", "_blank");
    const { data } = await supabase().storage.from("documents").createSignedUrl(d.path, 120);
    if (!data?.signedUrl) { w?.close(); toast(lang === "fr" ? "Ce document ne peut pas être ouvert pour l'instant." : "This document cannot be opened right now.", "error"); return; }
    if (w) { w.opener = null; w.location.href = data.signedUrl; } else window.location.href = data.signedUrl;
  };
  const remove = async (d: Doc) => {
    if (!window.confirm(`${t.remove} « ${d.name} » ?`)) return;
    if (await save(supabase().from("documents").delete().eq("id", d.id), { ok: lang === "fr" ? "Document supprimé." : "Document deleted.", lang })) await supabase().storage.from("documents").remove([d.path]);
    load();
  };

  return (
    <Card title={t.docs}>
      {docs.length === 0 ? <p className="text-sm text-muted">{t.noDocs}</p> : (
        <ul className="divide-y divide-line">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{d.name}</p>
                <p className="text-xs text-muted">{d.uploader_role === "client" ? t.fromClient : t.fromFirm} · {fmtDate(d.created_at, lang)} · {fmtSize(d.size)}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <button type="button" onClick={() => open(d)} className="font-semibold text-navy underline underline-offset-4">{t.open}</button>
                {role === "cabinet" && <button type="button" onClick={() => remove(d)} className="text-[#a3261f] underline underline-offset-4">{t.remove}</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <label className="btn-secondary min-h-11 cursor-pointer">
          {state === "busy" ? t.uploading : t.upload}
          <input ref={input} type="file" multiple className="sr-only" disabled={state === "busy"} accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.csv,.xls,.xlsx,.docx" onChange={(e) => upload(e.target.files)} />
        </label>
        <p className="mt-2 text-xs text-muted">{t.uploadHelp}</p>
        <p role="status" aria-live="polite" className={state === "error" ? "mt-2 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{state === "error" ? t.uploadErr : ""}</p>
      </div>
    </Card>
  );
}

/** Fil de messages d'un dossier. */
export function Messages({ dossierId, role, lang, authorName, onSent, aiDraft }: { dossierId: string; role: Role; lang: Lang; authorName: string; onSent?: () => void; aiDraft?: () => Promise<string | null> }) {
  const [thinking, setThinking] = useState(false);
  const t = tx[lang];
  const [list, setList] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase().from("messages").select("*").eq("dossier_id", dossierId).order("created_at");
    setList((data as Message[]) ?? []);
  }, [dossierId]);
  useEffect(() => {
    load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const ok = await save(supabase().from("messages").insert({ dossier_id: dossierId, author_role: role, author_name: authorName.slice(0, 160), body: text.slice(0, 4000) }), { ok: lang === "fr" ? "Message envoyé." : "Message sent.", lang });
    setBusy(false);
    if (ok) { setBody(""); load(); onSent?.(); }
  };

  return (
    <Card title={t.msgs}>
      {list.length === 0 ? <p className="text-sm text-muted">{t.noMsgs}</p> : (
        <ul className="space-y-3">
          {list.map((m) => {
            const mine = m.author_role === role;
            return (
              <li key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.93rem] leading-relaxed ${mine ? "bg-navy text-white" : "border border-line bg-[#f5f7fb] text-ink"}`}>
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className={`mt-1 text-xs ${mine ? "text-white/75" : "text-muted"}`}>{mine ? t.you : m.author_name || (m.author_role === "cabinet" ? site.name : t.fromClient)} · {fmtDate(m.created_at, lang, true)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={send} className="mt-4">
        <label htmlFor={`msg-${dossierId}`} className="label">{t.write}</label>
        <textarea id={`msg-${dossierId}`} value={body} onChange={(e) => setBody(e.target.value)} rows={body.length > 120 ? 8 : 3} maxLength={4000} className="field resize-y" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={busy || !body.trim()} className="btn-primary min-h-11">{t.sendMsg}</button>
          {aiDraft && (
            <button type="button" disabled={thinking} onClick={async () => { setThinking(true); const d = await aiDraft(); setThinking(false); if (d) setBody(d); }} className="btn-secondary min-h-11 px-4">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 5.6L19.5 9l-5.7 1.4L12 16l-1.8-5.6L4.5 9l5.7-1.4L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" /></svg>
              {thinking ? "Rédaction…" : "Rédiger avec l'IA"}
            </button>
          )}
        </div>
        {aiDraft && <p className="mt-2 text-xs text-muted">Brouillon proposé par l'IA : relisez-le avant d'envoyer. Rien ne part sans vous.</p>}
      </form>
    </Card>
  );
}

/* ───────────── Présentation Pilote Fiscal : 5 étapes visibles, météo fiscale, types partagés ───────────── */
/** Les 7 étapes internes sont montrées au client en 5 étapes, comme un suivi de colis. */
export const STEPS5 = [
  { key: "recus", fr: "Documents", en: "Documents", of: ["ouvert", "documents_attendus"] },
  { key: "preparation", fr: "En préparation", en: "In preparation", of: ["en_preparation"] },
  { key: "revision", fr: "Révision du CPA", en: "CPA review", of: ["en_revision"] },
  { key: "signer", fr: "Prêt à signer", en: "Ready to sign", of: ["a_signer"] },
  { key: "transmis", fr: "Transmis", en: "Filed", of: ["transmis", "ferme"] },
] as const;
export const step5 = (status: string) => Math.max(0, STEPS5.findIndex((s) => (s.of as readonly string[]).includes(status)));
export const WEATHER: Record<string, { fr: string; en: string }> = {
  degage: { fr: "ciel dégagé", en: "clear skies" },
  nuageux: { fr: "nuage à l'horizon", en: "clouds ahead" },
  orage: { fr: "à régler rapidement", en: "needs attention" },
};
export type Appointment = { id: string; dossier_id: string; created_at: string; preference: string; mode: "bureau" | "telephone" | "video"; status: "demande" | "confirme" | "annule"; confirmed_at: string | null; staff_note: string; assignee?: string; duration_min?: number; wished_date?: string | null; wished_part?: "matin" | "apres_midi" | "indifferent" | null };
/** Heures d'ouverture du bureau pour l'agenda (heure de Montréal). Provisoire : à confirmer par le cabinet. */
export const OFFICE_HOURS = { days: [1, 2, 3, 4, 5], open: 9, close: 17, slotMin: 30 } as const;
export type Signature = { id: string; dossier_id: string; created_at: string; title: string; body: string; status: "a_signer" | "signe" | "annule"; signed_at: string | null; signed_name: string | null };
export type Invoice = { id: string; dossier_id: string; created_at: string; label: string; amount_cents: number; status: "brouillon" | "a_payer" | "payee" | "annulee"; pay_url: string | null; paid_at: string | null };
export const cad = (cents: number, lang: Lang = "fr") => new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
