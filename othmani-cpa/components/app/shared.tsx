"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { backendReady, supabase } from "@/lib/supabase";
import { site, type Lang } from "@/lib/site";
import { LogoMark } from "../Logo";

export type Role = "client" | "cabinet";
export type Dossier = {
  id: string; created_at: string; updated_at: string; client_email: string; client_name: string; title: string;
  kind: string; tax_year: number | null; status: string; next_step: string; due_date: string | null; lead_id: string | null;
};
export type Doc = { id: string; dossier_id: string; created_at: string; uploader_role: Role; path: string; name: string; size: number };
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

/** Cadre commun : en-tête sobre, connexion par lien courriel, puis contenu. */
export function AppFrame({ lang, title, subtitle, children }: { lang: Lang; title: string; subtitle: string; children: (s: Session) => ReactNode }) {
  const t = tx[lang];
  const [session, setSession] = useState<Session | null | undefined>(backendReady ? undefined : null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (!backendReady) return;
    supabase().auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    setState("sending");
    const { error } = await supabase().auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
    setState(error ? "error" : "sent");
  };

  return (
    <div className="min-h-svh bg-[#f5f7fb]">
      <header className="border-b border-line bg-white">
        <div className="container-site flex items-center justify-between gap-4 py-4">
          <a href={lang === "fr" ? "/" : "/en/"} className="flex items-center gap-2.5 text-navy" aria-label={`${site.name}, ${t.back}`}>
            <LogoMark className="h-9 w-auto" />
            <span className="font-display text-lg font-bold tracking-tight">{site.name}</span>
          </a>
          {session ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-muted sm:inline">{session.user.email}</span>
              <button type="button" onClick={() => supabase().auth.signOut()} className="btn-secondary min-h-10 px-4 py-2 text-sm">{t.logout}</button>
            </div>
          ) : (
            <a href={lang === "fr" ? "/" : "/en/"} className="text-sm font-medium text-navy underline underline-offset-4">{t.back}</a>
          )}
        </div>
      </header>
      <main id="contenu" className="container-site py-10 sm:py-14">
        <p className="text-xs font-semibold tracking-[0.14em] text-navy/70 uppercase">{subtitle}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">{title}</h1>
        {!backendReady ? (
          <div className="mt-8 max-w-xl rounded-3xl border border-line bg-white p-7">
            <p className="font-display text-xl font-semibold text-ink">{t.notReady}</p>
            <p className="mt-2 leading-relaxed text-muted">{t.notReadyD}</p>
            <p className="mt-4 text-ink"><a className="font-semibold text-navy underline underline-offset-4" href={`tel:${site.phone.tel}`}>{site.phone.display}</a> · <a className="font-semibold text-navy underline underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a></p>
          </div>
        ) : session === undefined ? (
          <p className="mt-8 text-muted" role="status">…</p>
        ) : session === null ? (
          <form onSubmit={login} className="mt-8 max-w-md rounded-3xl border border-line bg-white p-7">
            <label htmlFor="app-email" className="label">{t.email}</label>
            <input id="app-email" name="email" type="email" required autoComplete="email" className="field" />
            <button type="submit" disabled={state === "sending"} className="btn-primary mt-4 w-full">{state === "sending" ? t.sending : t.send}</button>
            <p className="mt-3 text-sm text-muted">{t.noPwd}</p>
            <p role="status" aria-live="polite" className={state === "sent" || state === "error" ? `mt-4 rounded-2xl px-4 py-3 text-sm ${state === "sent" ? "bg-sky-50 text-navy" : "bg-[#fff4e5] text-[#6b3d00]"}` : "sr-only"}>
              {state === "sent" ? t.sent : state === "error" ? t.error : ""}
            </p>
          </form>
        ) : (
          <div className="mt-8">{children(session)}</div>
        )}
      </main>
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
