"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { backendReady, real, supabase } from "@/lib/supabase";
import { DEMO_CODE, DEMO_EMAIL, demoRole, setDemo, type DemoRole } from "@/lib/demo";
import { site, type Lang } from "@/lib/site";
import { LogoMark } from "../Logo";

export type Role = "client" | "cabinet";
export type Dossier = {
  id: string; created_at: string; updated_at: string; client_email: string; client_name: string; title: string;
  kind: string; tax_year: number | null; status: string; next_step: string; due_date: string | null; lead_id: string | null; assignee?: string;
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

/** Session de l'application : vraie (courriel vérifié) ou démonstration (code 0000, données fictives). */
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
      window.setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), t.undo ? 7000 : 3500);
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
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-white/70" />)}
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

/**
 * Cadre commun : en-tête vitré, connexion, puis contenu.
 * Connexion réelle : courriel, puis code à 6 chiffres reçu par courriel (ou lien du même courriel).
 * Code 0000 : mode démonstration, données fictives seulement (voir lib/demo.ts).
 */
export function AppFrame({ lang, title, subtitle, demo, wide = false, children }: { lang: Lang; title: string; subtitle: string; demo: DemoRole; wide?: boolean; children: (s: AppSession) => ReactNode }) {
  const t = tx[lang];
  const fr = lang === "fr";
  const [session, setSession] = useState<AppSession | null | undefined>(undefined);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "badcode">("idle");
  const [email, setEmail] = useState("");

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
    <div className="mesh min-h-svh">
      <header className="glass sticky top-0 z-40 border-b border-white/70 pt-[env(safe-area-inset-top)]">
        <div className={`${wide ? "mx-auto max-w-[96rem] px-4 sm:px-6" : "container-site"} flex items-center justify-between gap-4 py-3`}>
          <a href={fr ? "/" : "/en/"} className="flex items-center gap-2.5 text-navy" aria-label={`${site.name}, ${t.back}`}>
            <LogoMark className="h-8 w-auto" />
            <span className="font-display text-base font-bold tracking-tight sm:text-lg">{subtitle}</span>
          </a>
          {session ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-ink/80 md:inline">{session.email}</span>
              <button type="button" onClick={logout} className="rounded-full px-3 py-2 text-sm font-medium text-navy underline underline-offset-4">{session.demo ? (fr ? "Quitter la démo" : "Exit demo") : t.logout}</button>
            </div>
          ) : (
            <a href={fr ? "/" : "/en/"} className="text-sm font-medium text-navy underline underline-offset-4">{t.back}</a>
          )}
        </div>
        {session?.demo && <p className="bg-navy px-4 py-1.5 text-center text-xs font-medium text-white">{fr ? "Mode démonstration : données fictives, rien n'est enregistré." : "Demo mode: fictional data, nothing is saved."}</p>}
      </header>
      <main id="contenu" className={`${wide ? "mx-auto max-w-[96rem] px-4 sm:px-6" : "container-site"} py-6 sm:py-10`}>
        {session === undefined ? (
          <Skeleton label={fr ? "Chargement" : "Loading"} />
        ) : session === null ? (
          <div className="mx-auto max-w-md pt-6">
            <h1 className="font-display text-3xl font-bold tracking-tight text-navy">{title}</h1>
            {state === "sent" || state === "badcode" ? (
              <form onSubmit={verify} className="mt-6 rounded-3xl border border-white bg-white p-6 shadow-[0_24px_60px_-40px_rgba(23,23,58,.5)]">
                <p className="leading-relaxed text-ink">{fr ? <>Nous avons envoyé un code à <strong>{email}</strong>. Entrez-le ici, ou ouvrez le lien du courriel.</> : <>We sent a code to <strong>{email}</strong>. Enter it here, or open the link in the email.</>}</p>
                <label htmlFor="app-code" className="label mt-4">{fr ? "Code reçu par courriel" : "Code from the email"}</label>
                <input id="app-code" name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={10} className="field text-center font-display text-2xl tracking-[0.4em]" />
                <button type="submit" className="btn-primary mt-4 w-full">{fr ? "Entrer" : "Sign in"}</button>
                <p className="mt-3 text-sm text-muted">{fr ? "Rien reçu ? Vérifiez vos indésirables, ou " : "Nothing received? Check your spam folder, or "}<button type="button" className="font-semibold text-navy underline underline-offset-4" onClick={() => setState("idle")}>{fr ? "recommencez" : "start over"}</button>.</p>
                <p role="alert" className={msg ? "mt-4 rounded-2xl bg-[#fff4e5] px-4 py-3 text-sm text-[#6b3d00]" : "sr-only"}>{msg}</p>
              </form>
            ) : (
              <form onSubmit={sendCode} className="mt-6 rounded-3xl border border-white bg-white p-6 shadow-[0_24px_60px_-40px_rgba(23,23,58,.5)]">
                <label htmlFor="app-email" className="label">{fr ? "Votre courriel, ou votre code d'accès" : "Your email, or your access code"}</label>
                <input id="app-email" name="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} className="field" />
                <button type="submit" disabled={state === "sending"} className="btn-primary mt-4 w-full">{state === "sending" ? t.sending : (fr ? "Continuer" : "Continue")}</button>
                <p className="mt-3 text-sm text-muted">{fr ? "Pas de mot de passe : vous recevez un code par courriel. Pour une démonstration, entrez le code 0000." : "No password: you receive a code by email. For a demo, enter the code 0000."}</p>
                <p role="alert" className={msg ? "mt-4 rounded-2xl bg-[#fff4e5] px-4 py-3 text-sm text-[#6b3d00]" : "sr-only"}>{msg}</p>
              </form>
            )}
            <p className="mt-6 text-center text-sm text-ink/80">{fr ? "Besoin d'aide ? " : "Need help? "}<a className="font-semibold text-navy underline underline-offset-4" href={`tel:${site.phone.tel}`}>{site.phone.display}</a></p>
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
    load();
  };

  const open = async (d: Doc) => {
    const { data } = await supabase().storage.from("documents").createSignedUrl(d.path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };
  const remove = async (d: Doc) => {
    if (!window.confirm(`${t.remove} « ${d.name} » ?`)) return;
    await supabase().storage.from("documents").remove([d.path]);
    await supabase().from("documents").delete().eq("id", d.id);
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
export function Messages({ dossierId, role, lang, authorName }: { dossierId: string; role: Role; lang: Lang; authorName: string }) {
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
    const { error } = await supabase().from("messages").insert({ dossier_id: dossierId, author_role: role, author_name: authorName.slice(0, 160), body: text.slice(0, 4000) });
    setBusy(false);
    if (!error) { setBody(""); load(); }
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
        <textarea id={`msg-${dossierId}`} value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000} className="field resize-y" />
        <button type="submit" disabled={busy || !body.trim()} className="btn-primary mt-3 min-h-11">{t.sendMsg}</button>
      </form>
    </Card>
  );
}
