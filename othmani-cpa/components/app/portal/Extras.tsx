"use client";
import { useEffect, useId, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { site, type Lang } from "@/lib/site";
import { save, toast } from "../shared";
import { Ico } from "./icons";
import type { T } from "./text";
import { Box, Tile } from "./ui";
import { dossierLabel, downloadFile, mailHref, todayMtl, type Dossier } from "./util";

const btnOff = "disabled:cursor-not-allowed disabled:!bg-none disabled:!bg-[#5d6079]";

/** Bandeau hors ligne : prévient que les envois échoueront tant que la connexion n'est pas revenue. */
export function OfflineBanner({ t }: { t: T }) {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const sync = () => setOff(navigator.onLine === false);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  return (
    <div role="status" aria-live="polite">
      {off && (
        <p className="mb-4 flex items-start gap-3 rounded-2xl border border-[#e9c7a0] bg-[#fff4e5] px-4 py-3 text-[0.95rem] leading-snug font-medium text-[#6b3d00]">
          <Ico name="wifiOff" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} /><span>{t.offline}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Avis de fin de dossier. Privé : il est envoyé au cabinet et n'est jamais réaffiché dans l'application.
 * Le dossier est figé au montage, pour que le remerciement reste à l'écran après l'envoi.
 */
export function FeedbackCard({ target, many, onSent, reload, lang, t }: { target: Dossier | null; many: boolean; onSent: () => void; reload: () => void; lang: Lang; t: T }) {
  const [d] = useState(target);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [warn, setWarn] = useState(false);
  const id = useId();
  if (!d) return null;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!rating) { setWarn(true); document.getElementById(`${id}-1`)?.focus(); return; }
    setBusy(true);
    const ok = await save(supabase().from("feedback").insert({ dossier_id: d.id, rating, comment: comment.trim().slice(0, 1500) }), { lang });
    setBusy(false);
    if (ok) { setDone(true); onSent(); reload(); }
  };
  if (done)
    return (
      <Box className="flex items-start gap-3.5" label={t.fbTitle}>
        <Tile icon="heart" tone="green" />
        <div role="status">
          <p className="font-display text-[1.05rem] font-semibold text-ink">{t.fbThanks}</p>
          <p className="mt-0.5 leading-relaxed text-muted">{t.fbThanksD}</p>
        </div>
      </Box>
    );
  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-ink">{t.fbTitle}</h2>
      {many && <p className="mt-0.5 text-sm break-words text-muted">{dossierLabel(d)}</p>}
      <fieldset className="mt-3">
        <legend className="label">{t.fbLegend}</legend>
        <div className="grid gap-2 sm:grid-cols-5">
          {t.fbLevels.map((label, i) => {
            const n = i + 1;
            const on = rating === n;
            return (
              <label key={n} className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy sm:flex-col sm:justify-center sm:gap-1 sm:px-2 sm:text-center sm:text-sm ${on ? "border-navy bg-[#eef0f7] text-navy" : "border-[#8a8ea3] bg-white text-ink"}`}>
                <input type="radio" id={`${id}-${n}`} name={`${id}-rating`} value={n} checked={on} onChange={() => { setRating(n); setWarn(false); }} className="sr-only" />
                <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${on ? "bg-navy text-white" : "bg-[#eef0f7] text-navy"}`}>{n}</span>
                <span className="flex-1 sm:flex-none">{label}</span>
                {on && <Ico name="check" className="h-4 w-4 sm:hidden" strokeWidth={2.6} />}
              </label>
            );
          })}
        </div>
      </fieldset>
      {warn && !rating && <p role="alert" className="mt-3 rounded-xl bg-[#fff1dc] px-3.5 py-2.5 text-[0.95rem] font-medium text-[#6b3d00]">{t.fbPick}</p>}
      <div className="mt-4">
        <label htmlFor={`${id}-c`} className="label">{t.fbComment}</label>
        <textarea id={`${id}-c`} value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1500} className="field resize-y" />
      </div>
      <button type="submit" disabled={busy} className={`btn-primary mt-4 w-full sm:w-auto ${btnOff}`}>{busy ? t.fbBusy : t.fbSend}</button>
      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted"><Ico name="lock" className="mt-0.5 h-4 w-4 shrink-0" /><span>{t.fbPrivate}</span></p>
    </form>
  );
}

/** Lit tout ce que le client peut lire, sans filtre d'écran. Lève une erreur si une lecture échoue. */
async function readAll(table: string, by: string) {
  const r = await supabase().from(table).select("*").order(by);
  if (r.error) throw new Error(table);
  return (r.data as Record<string, unknown>[] | null) ?? [];
}

/** « Mes données » (Loi 25 : accès et portabilité) : un fichier JSON construit dans le navigateur. */
export function MyData({ email, lang, t }: { email: string; lang: Lang; t: T }) {
  const [busy, setBusy] = useState(false);
  const row = "flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left text-ink";
  const build = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const [dossiers, liste, documents, messages, factures, signatures, rendezVous, questionnaires] = await Promise.all([
        readAll("dossiers", "created_at"), readAll("document_requests", "created_at"), readAll("documents", "created_at"), readAll("messages", "created_at"),
        readAll("invoices", "created_at"), readAll("signatures", "created_at"), readAll("appointment_requests", "created_at"), readAll("questionnaires", "submitted_at"),
      ]);
      const today = todayMtl();
      const out = {
        format: "pilote-fiscal-mes-donnees", version: 1, exporte_le: new Date().toISOString(), cabinet: site.name, courriel: email,
        note: "Copie de vos renseignements. Les fichiers de vos documents ne sont pas inclus : seule leur description l'est.",
        dossiers, liste_de_documents: liste,
        // Description des documents seulement : ni le fichier, ni son emplacement de stockage.
        documents: documents.map(({ path: _path, ...rest }) => rest),
        messages, factures, signatures, demandes_de_rendez_vous: rendezVous, questionnaires,
      };
      downloadFile(JSON.stringify(out, null, 2), "application/json", `pilote-fiscal-mes-donnees-${today}.json`);
      toast(t.dataOk);
    } catch { toast(t.dataErr, "error"); }
    setBusy(false);
  };
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white">
      <h2 className="px-5 pt-5 pb-1 font-display text-lg font-semibold text-ink">{t.dataTitle}</h2>
      <div className="px-5 pb-4">
        <p className="mt-1 leading-relaxed text-ink">{t.dataD}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.dataWhat}</p>
        <button type="button" onClick={build} disabled={busy} className={`btn-primary mt-4 min-h-12 w-full sm:w-auto ${btnOff}`}><Ico name="download" strokeWidth={2} />{busy ? t.dataBusy : t.dataBtn}</button>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        <li><a href={t.privacyHref} className={row}><Ico name="shield" className="h-5 w-5 shrink-0 text-navy" /><span className="flex-1 font-semibold text-navy">{t.privacy}</span><Ico name="chevron" className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} /></a></li>
        {site.email && (
          <li>
            <a href={mailHref(site.email, t.delSubject, t.delBody(email))} className={row}><Ico name="close" className="h-5 w-5 shrink-0 text-[#8a1f18]" /><span className="flex-1 font-semibold text-[#8a1f18]">{t.del}</span></a>
            <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{t.delNote}</p>
          </li>
        )}
      </ul>
    </section>
  );
}
