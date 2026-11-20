"use client";
import { supabase } from "@/lib/supabase";
import type { Lang } from "@/lib/site";
import { fmtDate, toast, type Doc, type DocRequest, type Dossier } from "../shared";
import { Ico } from "./icons";
import { QuestEntry } from "./Situation";
import type { T } from "./text";
import { Box, Eyebrow, FilePick, PageTitle, Pill, Tile, useDrop } from "./ui";
import { fmtSize, hasQuest, type Go, type Questionnaire, type Upload, type UploadFn } from "./util";

/** Une ligne de la liste : reçue (cochée) ou à fournir (avec les boutons d'envoi). On peut y déposer un fichier. */
function Row({ r, busy, onUpload, t, compact }: { r: DocRequest; busy: boolean; onUpload: UploadFn; t: T; compact: boolean }) {
  const [over, drop] = useDrop((f) => onUpload(f, r.id), busy || r.received);
  if (r.received)
    return (
      <li className="flex items-center gap-3 py-3">
        {compact ? <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#0d7a5a] text-white"><Ico name="check" className="h-3.5 w-3.5" strokeWidth={3} /></span> : <Tile icon="file" tone="slate" />}
        <span className="min-w-0 flex-1 font-medium break-words text-ink">{r.label}</span>
        <Pill tone="green" icon="check">{t.received}</Pill>
      </li>
    );
  return (
    <li {...drop} className={`py-3 ${over ? "rounded-2xl bg-[#e4f4f9] outline-2 outline-offset-4 outline-dashed outline-[#3fa9c9]" : ""}`}>
      <div className="flex items-center gap-3">
        {compact ? <span className="h-5 w-5 shrink-0 rounded-md border-2 border-[#8a8ea3] bg-white" aria-hidden="true" /> : <Tile icon="file" tone="amber" />}
        <span className="min-w-0 flex-1 font-medium break-words text-ink">{r.label}</span>
        <Pill tone="amber">{t.toProvide}</Pill>
      </div>
      <div className={`mt-3 flex flex-col gap-2 min-[26rem]:flex-row ${compact ? "pl-8" : ""}`}>
        {!compact && (
          <FilePick camera aria={`${t.photo} : ${r.label}`} disabled={busy} onFiles={(f) => onUpload(f, r.id)} className="btn-primary min-h-12 flex-1 px-4">
            <Ico name="camera" /><span>{t.photo}</span>
          </FilePick>
        )}
        <FilePick aria={`${t.pick} : ${r.label}`} disabled={busy} onFiles={(f) => onUpload(f, r.id)} className={`btn-secondary px-4 ${compact ? "min-h-11" : "min-h-12 flex-1"}`}>
          <span>{t.pick}</span>
        </FilePick>
      </div>
    </li>
  );
}

/** La liste qui se coche toute seule : chaque document envoyé pour une ligne la marque « Reçu ». */
export function Checklist({ reqs, busy, onUpload, t, compact = false }: { reqs: DocRequest[]; busy: boolean; onUpload: UploadFn; t: T; compact?: boolean }) {
  if (reqs.length === 0) return <p className="py-2 text-[0.95rem] text-muted">{t.noReqs}</p>;
  const sorted = [...reqs.filter((r) => !r.received), ...reqs.filter((r) => r.received)];
  return <ul className="divide-y divide-line">{(compact ? reqs : sorted).map((r) => <Row key={r.id} r={r} busy={busy} onUpload={onUpload} t={t} compact={compact} />)}</ul>;
}

/** Zone de dépôt (grand écran). Les fichiers déposés ici partent sans être liés à une ligne de la liste. */
export function DropZone({ busy, onUpload, t, hint }: { busy: boolean; onUpload: UploadFn; t: T; hint: boolean }) {
  const [over, drop] = useDrop((f) => onUpload(f, null), busy);
  return (
    <div>
      <div {...drop} className={`hidden flex-col items-center rounded-2xl border-2 border-dashed px-4 py-6 text-center lg:flex ${over ? "border-[#1d7f9e] bg-[#d8eef5]" : "border-[#8fcfe0] bg-[#eef8fb]"}`}>
        <Ico name="cloudUp" className="h-7 w-7 text-[#175f77]" />
        <p className="mt-1.5 font-semibold text-[#175f77]">{t.dropHere}</p>
        <p className="text-sm text-muted">{t.dropOr}</p>
        <FilePick aria={t.other} disabled={busy} onFiles={(f) => onUpload(f, null)} className="btn-secondary mt-3 min-h-11 px-5"><span>{t.pick}</span></FilePick>
      </div>
      <div className="flex lg:hidden">
        <FilePick aria={t.other} disabled={busy} onFiles={(f) => onUpload(f, null)} className="btn-secondary min-h-12 flex-1 px-4"><Ico name="cloudUp" /><span>{t.other}</span></FilePick>
      </div>
      <p className="mt-2 text-sm text-muted">{hint && <span className="hidden lg:inline">{t.dropRow} </span>}{t.formats}</p>
    </div>
  );
}

export function UploadStatus({ uploads, t }: { uploads: Upload[]; t: T }) {
  if (uploads.length === 0) return null;
  return (
    <Box>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink">{t.upTitle}</h2>
      <ul className="space-y-2" role="status" aria-live="polite">
        {uploads.map((u) => (
          <li key={u.key} className="flex items-start justify-between gap-3 text-[0.95rem]">
            <span className="min-w-0 break-words text-ink">{u.name}{u.note && <span className="block text-sm text-[#8a1f18]">{u.note}</span>}</span>
            <Pill tone={u.state === "ok" ? "green" : u.state === "error" ? "red" : "slate"}>{u.state === "ok" ? t.upOk : u.state === "error" ? t.upFail : t.upBusy}</Pill>
          </li>
        ))}
      </ul>
    </Box>
  );
}

function DocRows({ docs, lang, t }: { docs: Doc[]; lang: Lang; t: T }) {
  // Les navigateurs bloquent une fenêtre ouverte après une attente : on l'ouvre tout de suite, puis on y charge le lien.
  const open = async (doc: Doc) => {
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    let url: string | undefined;
    try { url = (await supabase().storage.from("documents").createSignedUrl(doc.path, 120)).data?.signedUrl; } catch { url = undefined; }
    if (!url) { win?.close(); toast(t.openErr, "error"); return; }
    if (win && !win.closed) win.location.href = url; else window.location.href = url;
  };
  return (
    <ul className="divide-y divide-line">
      {docs.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 py-2">
          <Tile icon="file" tone="slate" className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{doc.name}</p>
            <p className="text-sm text-muted">{fmtDate(doc.created_at, lang)} · {fmtSize(doc.size, lang)}</p>
          </div>
          <button type="button" onClick={() => open(doc)} aria-label={`${t.open} ${doc.name}`} className="min-h-11 shrink-0 rounded-full px-3 font-semibold text-navy underline underline-offset-4">{t.open}</button>
        </li>
      ))}
    </ul>
  );
}

/** Documents d'un côté (envoyés ou reçus), rangés par année : celle du dossier, sinon celle de l'envoi. */
function Vault({ title, docs, dossiers, empty, lang, t }: { title: string; docs: Doc[]; dossiers: Dossier[]; empty: string; lang: Lang; t: T }) {
  const yearOf = (doc: Doc) => dossiers.find((x) => x.id === doc.dossier_id)?.tax_year ?? (new Date(doc.created_at).getFullYear() || 0);
  const years = [...new Set(docs.map(yearOf))].sort((a, b) => b - a);
  return (
    <Box>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {docs.length === 0 ? <p className="mt-2 text-[0.95rem] text-muted">{empty}</p> : years.map((y) => (
        <div key={y} className="mt-4 first:mt-3">
          <h3 className="flex items-center gap-2"><Ico name="lock" className="h-4 w-4 text-[#565a75]" /><span className="pf-eyebrow !text-[#565a75]">{y || "—"}</span></h3>
          <DocRows docs={docs.filter((x) => yearOf(x) === y)} lang={lang} t={t} />
        </div>
      ))}
    </Box>
  );
}

export function DocsScreen({ d, quests, reqs, docs, dossiers, uploads, busy, onUpload, lang, t, sub, go }: { d: Dossier; quests: Questionnaire[] | null; reqs: DocRequest[]; docs: Doc[]; dossiers: Dossier[]; uploads: Upload[]; busy: boolean; onUpload: UploadFn; lang: Lang; t: T; sub?: string; go: Go }) {
  const got = reqs.filter((r) => r.received).length;
  return (
    <div className="space-y-4">
      <PageTitle sub={sub} aside={reqs.length > 0 ? <p className="pb-1 text-[0.95rem] font-semibold whitespace-nowrap text-[#175f77]">{t.count(got, reqs.length)}</p> : undefined}>{t.myDocs}</PageTitle>
      <UploadStatus uploads={uploads} t={t} />
      {hasQuest(d) && <QuestEntry quest={quests?.find((q) => q.dossier_id === d.id)} lang={lang} t={t} go={go} />}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Box className="!py-3">
          <Checklist reqs={reqs} busy={busy} onUpload={onUpload} t={t} />
          {reqs.length > 0 && got === reqs.length && <p className="border-t border-line pt-3 pb-1 text-[0.95rem] text-muted">{t.allDocs}</p>}
        </Box>
        <Box><DropZone busy={busy} onUpload={onUpload} t={t} hint={got < reqs.length} /></Box>
      </div>
      <Eyebrow className="px-1 pt-2">{t.vault}</Eyebrow>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Vault title={t.sent} docs={docs.filter((x) => x.uploader_role === "client")} dossiers={dossiers} empty={t.noSent} lang={lang} t={t} />
        <Vault title={t.fromFirm} docs={docs.filter((x) => x.uploader_role === "cabinet")} dossiers={dossiers} empty={t.noFirm} lang={lang} t={t} />
      </div>
    </div>
  );
}
