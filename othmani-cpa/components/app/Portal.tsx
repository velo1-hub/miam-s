"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { site, type Lang } from "@/lib/site";
import { Icon } from "../Icon";
import { AppFrame, KINDS, LoadError, STATUSES, Skeleton, fmtDate, save, statusLabel, toast, type Doc, type DocRequest, type Dossier, type Message } from "./shared";

/* ───────────── Textes ───────────── */
const tx = {
  fr: {
    title: "Mon espace client", sub: "Pilote Fiscal", loading: "Chargement",
    tabs: { home: "Accueil", docs: "Documents", messages: "Messages", profile: "Profil" },
    nav: "Sections de votre espace", newMsg: "nouveau message",
    hello: "Bonjour", change: "Changer", file: "Dossier", year: "Année",
    none: "Aucun dossier n'est encore lié à ce courriel.",
    noneD: "Si vous êtes déjà client, vérifiez que vous utilisez le courriel donné au cabinet. Sinon, appelez-nous ou écrivez-nous : nous réglerons cela rapidement.",
    call: "Appeler le cabinet", write: "Écrire au cabinet",
    missing: (n: number) => (n === 1 ? "Il nous manque 1 document" : `Il nous manque ${n} documents`),
    missingD: "Une photo prise avec votre téléphone suffit.", missingCta: "Fournir mes documents",
    pay: "Honoraires à régler", payCta: (a: string) => `Payer ${a}`, payHow: "Page de paiement sécurisée. Apple Pay, Google Pay et carte acceptés.",
    payLater: "Le cabinet vous enverra les instructions de paiement.", seeFees: "Voir mes honoraires",
    nothing: "Rien à faire pour l'instant", nothingD: "Nous nous occupons de votre dossier. Nous vous écrirons si nous avons besoin de vous.",
    step: (i: number, n: number) => `Étape ${i} de ${n}`, steps: "Voir toutes les étapes", done: "Terminé", stepDone: "fait", stepNow: "en cours",
    progress: "Avancement", due: "Échéance", lastMsg: "Dernier message du cabinet", reply: "Lire et répondre",
    toProvide: "À fournir", allGood: "Rien à fournir pour l'instant.", photo: "Prendre une photo", pick: "Choisir un fichier",
    sentCheck: "Envoyé, en vérification", received: "Reçu", addMore: "Ajouter un autre document",
    sent: "Envoyés", noSent: "Vous n'avez encore envoyé aucun document.", fromFirm: "Reçus du cabinet", noFirm: "Le cabinet ne vous a encore rien envoyé.",
    other: "Envoyer un autre document", otherD: "PDF, photo, Excel ou Word. 25 Mo maximum par fichier.",
    open: "Ouvrir", openErr: "Ce document ne peut pas être ouvert pour l'instant. Réessayez.",
    upTitle: "Envoi de vos documents", upBusy: "Envoi en cours…", upOk: "Envoyé", upFail: "Non envoyé",
    tooBig: (n: string) => `« ${n} » dépasse 25 Mo. Choisissez un fichier plus léger.`,
    upErr: (n: string) => `« ${n} » n'a pas pu être envoyé. Vérifiez votre connexion et réessayez.`,
    upDone: (n: number) => (n === 1 ? "1 document envoyé. Merci !" : `${n} documents envoyés. Merci !`),
    noMsgs: "Aucun message pour l'instant.", noMsgsD: "Une question ? Écrivez-nous ici. Nous répondons pendant les heures de bureau.",
    yourMsg: "Votre message", send: "Envoyer", you: "Vous", firm: "Cabinet",
    myFiles: "Mes dossiers", lang: "Langue", otherLang: "Continue in English", account: "Mon compte", emailL: "Courriel de connexion",
    fees: "Honoraires", noFees: "Aucune facture pour l'instant.", toPay: "À payer", paid: "Payée", paidOn: "Payée le",
    del: "Demander la suppression de mon compte", delSubject: "Demande de suppression de mon compte",
    delBody: (e: string) => `Bonjour,\n\nJe demande la suppression de mon compte de l'espace client.\n\nCourriel du compte : ${e}\n\nMerci.`,
    delNote: "Le cabinet vous confirmera la suppression par courriel. Les documents qu'il doit garder selon la loi sont conservés pendant la durée légale, puis détruits.",
    feesErr: "Vos honoraires n'ont pas pu être chargés.", retry: "Réessayer", help: "Besoin d'aide ?",
  },
  en: {
    title: "My client portal", sub: "Pilote Fiscal", loading: "Loading",
    tabs: { home: "Home", docs: "Documents", messages: "Messages", profile: "Profile" },
    nav: "Sections of your portal", newMsg: "new message",
    hello: "Hello", change: "Change", file: "File", year: "Year",
    none: "No file is linked to this email yet.",
    noneD: "If you are already a client, make sure you are using the email you gave the firm. Otherwise, call or write to us: we will sort it out quickly.",
    call: "Call the firm", write: "Email the firm",
    missing: (n: number) => (n === 1 ? "We are missing 1 document" : `We are missing ${n} documents`),
    missingD: "A photo taken with your phone is enough.", missingCta: "Provide my documents",
    pay: "Fees to pay", payCta: (a: string) => `Pay ${a}`, payHow: "Secure payment page. Apple Pay, Google Pay and cards accepted.",
    payLater: "The firm will send you payment instructions.", seeFees: "See my fees",
    nothing: "Nothing to do for now", nothingD: "We are taking care of your file. We will write to you if we need anything.",
    step: (i: number, n: number) => `Step ${i} of ${n}`, steps: "See all steps", done: "Completed", stepDone: "done", stepNow: "in progress",
    progress: "Progress", due: "Deadline", lastMsg: "Latest message from the firm", reply: "Read and reply",
    toProvide: "To provide", allGood: "Nothing to provide for now.", photo: "Take a photo", pick: "Choose a file",
    sentCheck: "Sent, being reviewed", received: "Received", addMore: "Add another document",
    sent: "Sent", noSent: "You have not sent any documents yet.", fromFirm: "Received from the firm", noFirm: "The firm has not sent you anything yet.",
    other: "Send another document", otherD: "PDF, photo, Excel or Word. 25 MB maximum per file.",
    open: "Open", openErr: "This document cannot be opened right now. Please try again.",
    upTitle: "Sending your documents", upBusy: "Sending…", upOk: "Sent", upFail: "Not sent",
    tooBig: (n: string) => `"${n}" is over 25 MB. Please choose a smaller file.`,
    upErr: (n: string) => `"${n}" could not be sent. Check your connection and try again.`,
    upDone: (n: number) => (n === 1 ? "1 document sent. Thank you!" : `${n} documents sent. Thank you!`),
    noMsgs: "No messages yet.", noMsgsD: "A question? Write to us here. We reply during office hours.",
    yourMsg: "Your message", send: "Send", you: "You", firm: "Firm",
    myFiles: "My files", lang: "Language", otherLang: "Continuer en français", account: "My account", emailL: "Sign-in email",
    fees: "Fees", noFees: "No invoices yet.", toPay: "To pay", paid: "Paid", paidOn: "Paid on",
    del: "Request deletion of my account", delSubject: "Request to delete my account",
    delBody: (e: string) => `Hello,\n\nI am requesting the deletion of my client portal account.\n\nAccount email: ${e}\n\nThank you.`,
    delNote: "The firm will confirm the deletion by email. Documents it must keep by law are retained for the legal period, then destroyed.",
    feesErr: "Your fees could not be loaded.", retry: "Try again", help: "Need help?",
  },
};
type T = (typeof tx)["fr"];

/* ───────────── Types et petits outils ───────────── */
type Tab = "home" | "docs" | "messages" | "profile";
type PDoc = Doc & { request_id?: string | null };
type Invoice = { id: string; dossier_id: string; created_at: string; label: string; amount_cents: number; status: string; pay_url: string | null; paid_at: string | null };
type DossierData = { id: string; reqs: DocRequest[]; docs: PDoc[]; msgs: Message[] };
type Upload = { key: string; name: string; state: "busy" | "ok" | "error"; note?: string };

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.csv,.xls,.xlsx,.docx";
const TABS: { id: Tab; icon: string }[] = [{ id: "home", icon: "home" }, { id: "docs", icon: "receipt" }, { id: "messages", icon: "chat" }, { id: "profile", icon: "user" }];

const money = (cents: number, lang: Lang) => new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
const fmtSize = (n: number, lang: Lang) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} ${lang === "fr" ? "Mo" : "MB"}` : `${Math.max(1, Math.round(n / 1024))} ${lang === "fr" ? "ko" : "KB"}`);
const safeName = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${String(Math.random()).slice(2)}`);
const time = (iso: string | undefined | null) => (iso ? Date.parse(iso) || 0 : 0);
const safePayUrl = (u: string | null) => (u && u.startsWith("https://") ? u : null);
/** Liens construits à partir de données : téléphone réduit aux chiffres, courriel et champs encodés. */
const telHref = (n: string) => `tel:${n.trim().startsWith("+") ? "+" : ""}${n.replace(/\D/g, "")}`;
const mailHref = (to: string, subject?: string, body?: string) =>
  `mailto:${encodeURIComponent(to.trim()).replace(/%40/g, "@")}${subject ? `?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}` : ""}`;
/** Prénom pour la salutation ; les noms d'entreprise sont gardés entiers. */
const firstName = (name: string) => {
  const n = name.trim();
  if (!n) return "";
  return /\d|\b(inc|lt[ée]e|ltd|enr|corp|llc|senc)\b/i.test(n) ? n : n.split(/\s+/)[0];
};
const store = {
  get: (k: string) => { try { return window.localStorage.getItem(k) ?? ""; } catch { return ""; } },
  set: (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};
const SEEN = (id: string) => `ocpa-portal-seen-${id}`;
const CURRENT = "ocpa-portal-dossier";
const clientStatus = (s: string, lang: Lang, t: T) => (s === "ferme" ? t.done : statusLabel[s]?.[lang] ?? s);

/* ───────────── Briques visuelles ───────────── */
const eyebrow = "text-xs font-semibold tracking-[0.14em] text-navy/80 uppercase";

function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-white p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-3 font-display text-lg font-semibold text-navy">{title}</h2>}
      {children}
    </section>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-5">
      <h1 id="portal-title" tabIndex={-1} className="font-display text-[1.75rem] leading-tight font-bold tracking-tight text-navy outline-none sm:text-3xl">{children}</h1>
      {sub}
    </header>
  );
}

/** Rappel du dossier affiché, avec un raccourci pour en changer s'il y en a plusieurs. */
function DossierLine({ d, many, lang, t, go }: { d: Dossier; many: boolean; lang: Lang; t: T; go: (tab: Tab) => void }) {
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.95rem] text-muted">
      <span>{d.title}{d.tax_year && !d.title.includes(String(d.tax_year)) ? ` · ${t.year} ${d.tax_year}` : ""}</span>
      {many && <button type="button" onClick={() => go("profile")} className="-my-2 min-h-11 rounded-full px-2 font-semibold text-navy underline underline-offset-4">{t.change}</button>}
    </p>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true" focusable="false">
      <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4V8z" /><circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

/** Bouton qui ouvre l'appareil photo ou le sélecteur de fichiers. */
function FileButton({ label, aria, onFiles, disabled, camera = false, primary = false, children }: { label: string; aria: string; onFiles: (f: File[]) => void; disabled: boolean; camera?: boolean; primary?: boolean; children?: ReactNode }) {
  return (
    <label className={`${primary ? "btn-primary" : "btn-secondary"} relative min-h-12 flex-1 cursor-pointer px-4 text-center has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-navy ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      {children}
      <span>{label}</span>
      <input
        type="file" className="sr-only" disabled={disabled} aria-label={aria}
        {...(camera ? { accept: "image/*", capture: "environment" as const } : { accept: ACCEPT, multiple: true })}
        onChange={(e) => { const list = Array.from(e.target.files ?? []); e.target.value = ""; if (list.length) onFiles(list); }}
      />
    </label>
  );
}

/* ───────────── Accueil ───────────── */
function Home({ d, data, invoices, many, lang, t, go }: { d: Dossier; data: DossierData; invoices: Invoice[]; many: boolean; lang: Lang; t: T; go: (tab: Tab) => void }) {
  const missing = data.reqs.filter((r) => !r.received && !data.docs.some((x) => x.request_id === r.id)).length;
  const due = invoices.filter((i) => i.status === "a_payer");
  const invoice = due.find((i) => i.dossier_id === d.id) ?? due[0];
  const step = STATUSES.indexOf(d.status as (typeof STATUSES)[number]);
  const last = [...data.msgs].reverse().find((m) => m.author_role === "cabinet");
  const name = firstName(d.client_name);
  const payUrl = invoice ? safePayUrl(invoice.pay_url) : null;

  return (
    <div className="space-y-4">
      <Title sub={<DossierLine d={d} many={many} lang={lang} t={t} go={go} />}>{t.hello}{name ? ` ${name}` : ""}</Title>

      {missing > 0 ? (
        <section className="on-dark rounded-3xl bg-navy p-6 text-white">
          <h2 className="font-display text-2xl leading-snug font-bold text-white">{t.missing(missing)}</h2>
          <p className="mt-1.5 text-white/90">{t.missingD}</p>
          <button type="button" onClick={() => go("docs")} className="btn-light mt-5 w-full sm:w-auto">{t.missingCta}<Icon name="arrow" className="h-5 w-5" /></button>
        </section>
      ) : invoice ? (
        <section className="on-dark rounded-3xl bg-navy p-6 text-white">
          <p className="text-sm font-semibold tracking-wide text-white/90 uppercase">{t.pay}</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">{money(invoice.amount_cents, lang)}</h2>
          <p className="mt-1 text-white/90">{invoice.label}</p>
          {payUrl ? (
            <>
              <a href={payUrl} target="_blank" rel="noopener noreferrer" className="btn-light mt-5 w-full sm:w-auto">{t.payCta(money(invoice.amount_cents, lang))}</a>
              <p className="mt-3 text-sm text-white/90">{t.payHow}</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-white/90">{t.payLater}</p>
              <button type="button" onClick={() => go("profile")} className="btn-ghost-light mt-4 w-full sm:w-auto">{t.seeFees}</button>
            </>
          )}
        </section>
      ) : (
        <Panel>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-navy"><Icon name="check" className="h-5 w-5" strokeWidth={2} /></span>
            <div>
              <h2 className="font-display text-xl font-semibold text-navy">{t.nothing}</h2>
              <p className="mt-1 leading-relaxed whitespace-pre-line text-ink">{d.next_step || t.nothingD}</p>
            </div>
          </div>
        </Panel>
      )}

      <Panel>
        <h2 className={eyebrow}>{t.progress}</h2>
        {step < 0 ? (
          <p className="mt-2 font-display text-lg font-semibold text-ink">{clientStatus(d.status, lang, t)}</p>
        ) : (
          <>
            <p className="mt-2 font-display text-lg font-semibold text-ink">{t.step(step + 1, STATUSES.length)} · {clientStatus(d.status, lang, t)}</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-sky-100" aria-hidden="true">
              <div className="h-full rounded-full bg-navy transition-[width] duration-500" style={{ width: `${((step + 1) / STATUSES.length) * 100}%` }} />
            </div>
            <details className="group mt-2">
              <summary className="-mx-2 flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-2 text-[0.95rem] font-semibold text-navy [&::-webkit-details-marker]:hidden">
                {t.steps}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </summary>
              <ol className="mt-1 space-y-1">
                {STATUSES.map((s, i) => (
                  <li key={s} aria-current={i === step ? "step" : undefined} className={`flex items-center gap-3 rounded-xl px-2 py-2 text-[0.95rem] ${i === step ? "bg-sky-50 font-semibold text-navy" : i < step ? "text-ink" : "text-muted"}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i < step ? "bg-navy text-white" : i === step ? "border-2 border-navy text-navy" : "border border-[#8a8ea3] text-muted"}`}>
                      {i < step ? <Icon name="check" className="h-4 w-4" strokeWidth={2.4} /> : i + 1}
                    </span>
                    <span>{clientStatus(s, lang, t)}</span>
                    {i <= step && <span className="sr-only">({i < step ? t.stepDone : t.stepNow})</span>}
                  </li>
                ))}
              </ol>
            </details>
          </>
        )}
        {missing > 0 && d.next_step && <p className="mt-2 border-t border-line pt-4 leading-relaxed whitespace-pre-line text-ink">{d.next_step}</p>}
      </Panel>

      {d.due_date && (
        <Panel>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-navy"><Icon name="calendar" className="h-5 w-5" /></span>
            <div>
              <h2 className={eyebrow}>{t.due}</h2>
              <p className="mt-0.5 font-display text-lg font-semibold text-ink">{fmtDate(d.due_date, lang)}</p>
            </div>
          </div>
        </Panel>
      )}

      {last && (
        <Panel>
          <h2 className={eyebrow}>{t.lastMsg}</h2>
          <p className="mt-2 line-clamp-3 leading-relaxed whitespace-pre-line text-ink">{last.body}</p>
          <p className="mt-1.5 text-sm text-muted">{last.author_name || site.name} · {fmtDate(last.created_at, lang, true)}</p>
          <button type="button" onClick={() => go("messages")} className="btn-secondary mt-4 w-full sm:w-auto">{t.reply}</button>
        </Panel>
      )}
    </div>
  );
}

/* ───────────── Documents ───────────── */
function DocList({ docs, lang, t, empty }: { docs: PDoc[]; lang: Lang; t: T; empty: string }) {
  // iOS bloque les fenêtres ouvertes après une attente : on l'ouvre tout de suite, puis on y charge le lien.
  const open = async (doc: PDoc) => {
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    let url: string | undefined;
    try { url = (await supabase().storage.from("documents").createSignedUrl(doc.path, 120)).data?.signedUrl; } catch { url = undefined; }
    if (!url) { win?.close(); toast(t.openErr, "error"); return; }
    if (win && !win.closed) win.location.href = url; else window.location.href = url;
  };
  if (docs.length === 0) return <p className="text-[0.95rem] text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {docs.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{doc.name}</p>
            <p className="text-sm text-muted">{fmtDate(doc.created_at, lang)} · {fmtSize(doc.size, lang)}</p>
          </div>
          <button type="button" onClick={() => open(doc)} aria-label={`${t.open} ${doc.name}`} className="min-h-12 shrink-0 rounded-full px-3 font-semibold text-navy underline underline-offset-4">{t.open}</button>
        </li>
      ))}
    </ul>
  );
}

function Docs({ d, data, many, uploads, busy, onUpload, lang, t, go }: { d: Dossier; data: DossierData; many: boolean; uploads: Upload[]; busy: boolean; onUpload: (files: File[], requestId: string | null) => void; lang: Lang; t: T; go: (tab: Tab) => void }) {
  const sentFor = (r: DocRequest) => data.docs.filter((x) => x.request_id === r.id).length;
  const open = data.reqs.filter((r) => !r.received);
  const done = data.reqs.filter((r) => r.received);
  return (
    <div className="space-y-4">
      <Title sub={<DossierLine d={d} many={many} lang={lang} t={t} go={go} />}>{t.tabs.docs}</Title>

      {uploads.length > 0 && (
        <Panel title={t.upTitle}>
          <ul className="space-y-2" role="status" aria-live="polite">
            {uploads.map((u) => (
              <li key={u.key} className="flex items-start justify-between gap-3 text-[0.95rem]">
                <span className="min-w-0 break-words text-ink">{u.name}{u.note && <span className="block text-sm text-[#8a1f18]">{u.note}</span>}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${u.state === "ok" ? "bg-sky-100 text-navy" : u.state === "error" ? "bg-[#fde8e6] text-[#8a1f18]" : "bg-[#eef0f6] text-ink"}`}>{u.state === "ok" ? t.upOk : u.state === "error" ? t.upFail : t.upBusy}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title={t.toProvide}>
        {data.reqs.length === 0 ? <p className="text-[0.95rem] text-muted">{t.allGood}</p> : (
          <ul className="space-y-3">
            {open.map((r) => {
              const n = sentFor(r);
              return (
                <li key={r.id} className={`rounded-2xl border p-4 ${n ? "border-line" : "border-[#e9c7a0] bg-[#fffaf2]"}`}>
                  <p className="font-display text-[1.05rem] leading-snug font-semibold text-ink">{r.label}</p>
                  {n > 0 ? (
                    <>
                      <p className="mt-2 flex items-center gap-2 text-[0.95rem] font-semibold text-navy"><Icon name="clock" className="h-5 w-5" />{t.sentCheck}</p>
                      <div className="mt-3 flex">
                        <FileButton label={t.addMore} aria={`${t.addMore} : ${r.label}`} disabled={busy} onFiles={(f) => onUpload(f, r.id)} />
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2 min-[26rem]:flex-row">
                      <FileButton primary camera label={t.photo} aria={`${t.photo} : ${r.label}`} disabled={busy} onFiles={(f) => onUpload(f, r.id)}><CameraIcon /></FileButton>
                      <FileButton label={t.pick} aria={`${t.pick} : ${r.label}`} disabled={busy} onFiles={(f) => onUpload(f, r.id)} />
                    </div>
                  )}
                </li>
              );
            })}
            {done.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                <span className="text-ink">{r.label}</span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-navy"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />{t.received}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t.fromFirm}>
        <DocList docs={data.docs.filter((x) => x.uploader_role === "cabinet")} lang={lang} t={t} empty={t.noFirm} />
      </Panel>

      <Panel title={t.sent}>
        <DocList docs={data.docs.filter((x) => x.uploader_role === "client")} lang={lang} t={t} empty={t.noSent} />
        <div className="mt-4 flex border-t border-line pt-4">
          <FileButton label={t.other} aria={t.other} disabled={busy} onFiles={(f) => onUpload(f, null)}><Icon name="upload" className="h-5 w-5" /></FileButton>
        </div>
        <p className="mt-2 text-sm text-muted">{t.otherD}</p>
      </Panel>
    </div>
  );
}

/* ───────────── Messages ───────────── */
function Chat({ d, data, many, author, reload, lang, t, go }: { d: Dossier; data: DossierData; many: boolean; author: string; reload: () => void; lang: Lang; t: T; go: (tab: Tab) => void }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const count = data.msgs.length;
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [count, d.id]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const ok = await save(supabase().from("messages").insert({ dossier_id: d.id, author_role: "client", author_name: author.slice(0, 160), body: text.slice(0, 4000) }), { lang });
    setBusy(false);
    if (ok) { setBody(""); reload(); }
  };

  return (
    <div className="flex min-h-[calc(100svh-17rem)] flex-col">
      <Title sub={<DossierLine d={d} many={many} lang={lang} t={t} go={go} />}>{t.tabs.messages}</Title>
      {count === 0 ? (
        <Panel>
          <p className="font-display text-lg font-semibold text-navy">{t.noMsgs}</p>
          <p className="mt-1 leading-relaxed text-muted">{t.noMsgsD}</p>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {data.msgs.map((m) => {
            const mine = m.author_role === "client";
            return (
              <li key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-3xl px-4 py-3 leading-relaxed ${mine ? "rounded-br-lg bg-navy text-white" : "rounded-bl-lg border border-line bg-white text-ink"}`}>
                  <p className="break-words whitespace-pre-line">{m.body}</p>
                  <p className={`mt-1 text-xs ${mine ? "text-white/85" : "text-muted"}`}>{mine ? t.you : m.author_name || site.name} · {fmtDate(m.created_at, lang, true)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={end} className="h-px scroll-mb-44 lg:scroll-mb-28" aria-hidden="true" />
      <form onSubmit={send} className="glass fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 px-4 py-2.5 lg:sticky lg:inset-x-auto lg:bottom-4 lg:mt-auto lg:rounded-3xl lg:px-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <label htmlFor="portal-msg" className="sr-only">{t.yourMsg}</label>
          <textarea id="portal-msg" value={body} onChange={(e) => setBody(e.target.value)} rows={1} maxLength={4000} placeholder={t.yourMsg} enterKeyHint="send" className="field max-h-32 min-h-12 resize-none rounded-3xl [field-sizing:content] placeholder:text-muted" />
          <button type="submit" disabled={busy || !body.trim()} aria-label={t.send} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-navy-700 disabled:bg-[#5d6079]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
}

/* ───────────── Profil ───────────── */
function Profile({ d, dossiers, invoices, invoicesFailed, retryInvoices, email, pick, lang, t }: { d: Dossier; dossiers: Dossier[]; invoices: Invoice[]; invoicesFailed: boolean; retryInvoices: () => void; email: string; pick: (id: string) => void; lang: Lang; t: T }) {
  const titleOf = (id: string) => dossiers.find((x) => x.id === id)?.title ?? "";
  const row = "flex min-h-14 items-center gap-3 px-5 py-3 text-ink";
  return (
    <div className="space-y-4">
      <Title>{t.tabs.profile}</Title>

      {dossiers.length > 1 && (
        <Panel title={t.myFiles}>
          <ul className="space-y-2">
            {dossiers.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => pick(x.id)} aria-current={x.id === d.id ? "true" : undefined} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-left transition-colors hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-sky-50">
                  <span>
                    <span className="block font-display font-semibold text-ink">{x.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{KINDS[x.kind]?.[lang] ?? x.kind} · {clientStatus(x.status, lang, t)}</span>
                  </span>
                  {x.id === d.id && <Icon name="check" className="h-5 w-5 shrink-0 text-navy" strokeWidth={2.2} />}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title={t.fees}>
        {invoicesFailed ? (
          <div role="alert" className="rounded-2xl bg-[#fff4e5] p-4 text-[#6b3d00]">
            <p>{t.feesErr}</p>
            <button type="button" onClick={retryInvoices} className="btn-secondary mt-3">{t.retry}</button>
          </div>
        ) : invoices.length === 0 ? <p className="text-[0.95rem] text-muted">{t.noFees}</p> : (
          <ul className="divide-y divide-line">
            {invoices.map((i) => {
              const url = safePayUrl(i.pay_url);
              const toPay = i.status === "a_payer";
              return (
                <li key={i.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{i.label}</p>
                      {dossiers.length > 1 && titleOf(i.dossier_id) && titleOf(i.dossier_id) !== i.label && <p className="text-sm text-muted">{titleOf(i.dossier_id)}</p>}
                    </div>
                    <p className="shrink-0 font-display font-semibold text-ink">{money(i.amount_cents, lang)}</p>
                  </div>
                  <p className="mt-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toPay ? "bg-[#fff4e5] text-[#6b3d00]" : "bg-sky-100 text-navy"}`}>
                      {toPay ? t.toPay : i.paid_at ? `${t.paidOn} ${fmtDate(i.paid_at, lang)}` : t.paid}
                    </span>
                  </p>
                  {toPay && (url ? (
                    <>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 w-full sm:w-auto">{t.payCta(money(i.amount_cents, lang))}</a>
                      <p className="mt-2 text-sm text-muted">{t.payHow}</p>
                    </>
                  ) : <p className="mt-2 text-[0.95rem] text-muted">{t.payLater}</p>)}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <section className="overflow-hidden rounded-3xl border border-line bg-white">
        <h2 className="px-5 pt-5 pb-1 font-display text-lg font-semibold text-navy">{t.help}</h2>
        <ul className="divide-y divide-line">
          <li><a href={telHref(site.phone.tel)} className={row}><Icon name="phone" className="h-5 w-5 shrink-0 text-navy" /><span className="flex-1 font-semibold text-navy">{t.call}</span><span className="text-muted">{site.phone.display}</span></a></li>
          {site.email && <li><a href={mailHref(site.email)} className={row}><Icon name="mail" className="h-5 w-5 shrink-0 text-navy" /><span className="flex-1 font-semibold text-navy">{t.write}</span></a></li>}
        </ul>
      </section>

      <section className="overflow-hidden rounded-3xl border border-line bg-white">
        <h2 className="px-5 pt-5 pb-1 font-display text-lg font-semibold text-navy">{t.account}</h2>
        <ul className="divide-y divide-line">
          <li className={row}><Icon name="user" className="h-5 w-5 shrink-0 text-navy" /><span className="min-w-0"><span className="block text-sm text-muted">{t.emailL}</span><span className="block break-all font-medium">{email}</span></span></li>
          <li><a href={lang === "fr" ? "/en/client-portal/" : "/espace-client/"} lang={lang === "fr" ? "en" : "fr"} hrefLang={lang === "fr" ? "en" : "fr"} className={row}><Icon name="globe" className="h-5 w-5 shrink-0 text-navy" /><span className="flex-1 font-semibold text-navy">{t.otherLang}</span><Icon name="arrow" className="h-5 w-5 shrink-0 text-navy" /></a></li>
          {site.email && (
            <li>
              <a href={mailHref(site.email, t.delSubject, t.delBody(email))} className={row}><Icon name="close" className="h-5 w-5 shrink-0 text-[#8a1f18]" /><span className="flex-1 font-semibold text-[#8a1f18]">{t.del}</span></a>
              <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{t.delNote}</p>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

/* ───────────── Vue principale ───────────── */
function View({ lang, email }: { lang: Lang; email: string }) {
  const t = tx[lang];
  const [tab, setTab] = useState<Tab>("home");
  const [dossiers, setDossiers] = useState<Dossier[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesFailed, setInvoicesFailed] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [data, setData] = useState<DossierData | null>(null);
  const [dataFailed, setDataFailed] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [seenMap, setSeenMap] = useState<Record<string, string>>({});
  const seq = useRef(0);
  const firstTab = useRef(true);

  const loadInvoices = useCallback(async () => {
    try {
      const r = await supabase().from("invoices").select("*").order("created_at", { ascending: false });
      if (r.error) throw r.error;
      setInvoices(((r.data as Invoice[]) ?? []).filter((i) => i.status === "a_payer" || i.status === "payee"));
      setInvoicesFailed(false);
    } catch { setInvoicesFailed(true); }
  }, []);

  const loadBase = useCallback(async () => {
    setFailed(false);
    try {
      const r = await supabase().from("dossiers").select("*").order("updated_at", { ascending: false });
      if (r.error) throw r.error;
      const list = (r.data as Dossier[]) ?? [];
      setDossiers(list);
      setCurrent((c) => { const want = c ?? store.get(CURRENT); return list.some((x) => x.id === want) ? want : list[0]?.id ?? null; });
    } catch { setFailed(true); }
    loadInvoices();
  }, [loadInvoices]);
  useEffect(() => { loadBase(); }, [loadBase]);

  /** Charge demandes, documents et messages du dossier. `quiet` : rafraîchissement discret, sans écran d'erreur. */
  const loadData = useCallback(async (id: string, quiet = false) => {
    const mine = ++seq.current;
    if (!quiet) setDataFailed(false);
    try {
      const [reqs, docs, msgs] = await Promise.all([
        supabase().from("document_requests").select("*").eq("dossier_id", id).order("created_at"),
        supabase().from("documents").select("*").eq("dossier_id", id).order("created_at", { ascending: false }),
        supabase().from("messages").select("*").eq("dossier_id", id).order("created_at"),
      ]);
      if (reqs.error || docs.error || msgs.error) throw new Error("load");
      if (mine !== seq.current) return;
      setData({ id, reqs: (reqs.data as DocRequest[]) ?? [], docs: (docs.data as PDoc[]) ?? [], msgs: (msgs.data as Message[]) ?? [] });
    } catch { if (mine === seq.current && !quiet) setDataFailed(true); }
  }, []);
  useEffect(() => {
    if (!current) return;
    loadData(current);
    const tick = () => { if (document.visibilityState === "visible") loadData(current, true); };
    const id = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [current, loadData]);

  // Changement d'onglet : haut de page et titre annoncé aux lecteurs d'écran.
  useEffect(() => {
    if (firstTab.current) { firstTab.current = false; return; }
    if (tab !== "messages") window.scrollTo(0, 0);
    document.getElementById("portal-title")?.focus({ preventScroll: true });
  }, [tab]);

  const ready = data && data.id === current ? data : null;
  const lastMsg = ready?.msgs[ready.msgs.length - 1];
  const seen = current ? seenMap[current] ?? store.get(SEEN(current)) : "";
  const unread = tab !== "messages" && lastMsg?.author_role === "cabinet" && time(lastMsg.created_at) > time(seen);
  useEffect(() => {
    if (tab !== "messages" || !current || !lastMsg || time(lastMsg.created_at) <= time(seen)) return;
    store.set(SEEN(current), lastMsg.created_at);
    setSeenMap((m) => ({ ...m, [current]: lastMsg.created_at }));
  }, [tab, current, lastMsg, seen]);

  const pick = (id: string) => {
    if (id === current) { setTab("home"); return; }
    store.set(CURRENT, id);
    setData(null);
    setUploads([]);
    setCurrent(id);
    setTab("home");
  };

  const upload = async (files: File[], requestId: string | null) => {
    if (!current || busy) return;
    const dossierId = current;
    const items = files.map((f) => ({ f, key: uuid() }));
    const mark = (key: string, state: Upload["state"], note?: string) => setUploads((l) => l.map((u) => (u.key === key ? { ...u, state, note } : u)));
    setUploads(items.map(({ f, key }) => ({ key, name: f.name, state: "busy" })));
    setBusy(true);
    let sent = 0;
    for (const { f, key } of items) {
      if (f.size > MAX_BYTES) { mark(key, "error", t.tooBig(f.name)); toast(t.tooBig(f.name), "error"); continue; }
      let ok = false;
      try {
        const path = `${dossierId}/${uuid()}-${safeName(f.name) || "document"}`;
        const up = await supabase().storage.from("documents").upload(path, f, { contentType: f.type || undefined });
        if (!up.error) {
          const ins = await supabase().from("documents").insert({ dossier_id: dossierId, uploader_role: "client", path, name: f.name.slice(0, 200), size: f.size, ...(requestId ? { request_id: requestId } : {}) });
          ok = !ins.error;
        }
      } catch { ok = false; }
      if (ok) { sent++; mark(key, "ok"); } else { mark(key, "error", t.upErr(f.name)); toast(t.upErr(f.name), "error"); }
    }
    setBusy(false);
    if (sent) toast(t.upDone(sent));
    await loadData(dossierId, true);
  };

  if (failed) return <LoadError lang={lang} retry={loadBase} />;
  if (!dossiers) return <div className="mx-auto max-w-2xl"><Skeleton rows={4} label={t.loading} /></div>;
  if (dossiers.length === 0)
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 sm:p-7">
        <h1 className="font-display text-xl font-semibold text-navy">{t.none}</h1>
        <p className="mt-2 leading-relaxed text-ink">{t.noneD}</p>
        <p className="mt-3 text-sm break-all text-muted">{t.emailL} : {email}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a href={telHref(site.phone.tel)} className="btn-primary"><Icon name="phone" className="h-5 w-5" />{site.phone.display}</a>
          {site.email && <a href={mailHref(site.email)} className="btn-secondary"><Icon name="mail" className="h-5 w-5" />{t.write}</a>}
        </div>
      </div>
    );

  const d = dossiers.find((x) => x.id === current) ?? dossiers[0];
  const many = dossiers.length > 1;

  return (
    <div className={`mx-auto max-w-2xl ${tab === "messages" ? "pb-40 lg:pb-0" : "pb-24 lg:pb-4"}`}>
      <nav aria-label={t.nav} className="glass fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] lg:static lg:mb-8 lg:rounded-full lg:p-1.5">
        <ul className="mx-auto grid max-w-2xl grid-cols-4 lg:gap-1">
          {TABS.map((x) => {
            const on = tab === x.id;
            const dot = x.id === "messages" && unread;
            return (
              <li key={x.id}>
                <button type="button" onClick={() => setTab(x.id)} aria-current={on ? "page" : undefined} className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs lg:min-h-12 lg:flex-row lg:gap-2 lg:rounded-full lg:text-sm ${on ? "font-semibold text-navy lg:bg-navy lg:text-white" : "font-medium text-muted hover:text-navy"}`}>
                  <span className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors lg:h-auto lg:w-auto ${on ? "bg-sky-100 lg:bg-transparent" : ""}`}>
                    <Icon name={x.icon} className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={on ? 2 : 1.6} />
                    {dot && <span className="absolute top-0 right-2.5 h-2.5 w-2.5 rounded-full bg-[#b3261e] ring-2 ring-white lg:-top-0.5 lg:-right-1.5" aria-hidden="true" />}
                  </span>
                  <span>{t.tabs[x.id]}{dot && <span className="sr-only"> ({t.newMsg})</span>}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {tab === "profile" ? (
        <Profile d={d} dossiers={dossiers} invoices={invoices} invoicesFailed={invoicesFailed} retryInvoices={loadInvoices} email={email} pick={pick} lang={lang} t={t} />
      ) : dataFailed && !ready ? (
        <LoadError lang={lang} retry={() => loadData(d.id)} />
      ) : !ready ? (
        <Skeleton rows={4} label={t.loading} />
      ) : tab === "home" ? (
        <Home d={d} data={ready} invoices={invoices} many={many} lang={lang} t={t} go={setTab} />
      ) : tab === "docs" ? (
        <Docs d={d} data={ready} many={many} uploads={uploads} busy={busy} onUpload={upload} lang={lang} t={t} go={setTab} />
      ) : (
        <Chat d={d} data={ready} many={many} author={d.client_name || email} reload={() => loadData(d.id, true)} lang={lang} t={t} go={setTab} />
      )}
    </div>
  );
}

export function Portal({ lang }: { lang: Lang }) {
  const t = tx[lang];
  return <AppFrame lang={lang} title={t.title} subtitle={t.sub} demo="client">{(s) => <View lang={lang} email={s.email} />}</AppFrame>;
}
