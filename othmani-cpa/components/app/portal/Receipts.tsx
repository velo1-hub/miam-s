"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { demoRole } from "@/lib/demo";
import { real, supabase } from "@/lib/supabase";
import type { Lang } from "@/lib/site";
import { LoadError, Skeleton, VERDICT, cad, fmtDate, toast, type Dossier, type Receipt } from "../shared";
import { Ico } from "./icons";
import { Scanner } from "./Scanner";
import { scanStamp } from "./scanmath";
import { scanTx, type ST } from "./scantext";
import type { T } from "./text";
import { Box, Empty, PageTitle, Pill } from "./ui";
import { dossierLabel, todayMtl, uuid, type Go } from "./util";

type View = "tous" | "a_verifier" | "valide";
type Draft = { file: File; url: string };
/** Où en est l'envoi d'un reçu : un nouvel essai reprend à l'étape qui a échoué, sans rien renvoyer en double. */
type Progress = { dossier: string; path: string; uploaded: boolean; listed: boolean; tried: boolean };

const yearOf = (r: Receipt) => Number((r.receipt_date ?? "").slice(0, 4)) || new Date(r.created_at).getFullYear();
const nameOf = (r: Receipt, lang: Lang, s: ST) => r.vendor || s.rReceiptOf(fmtDate(r.receipt_date ?? r.created_at, lang));

async function byPath(path: string): Promise<Receipt | null> {
  try {
    const r = await supabase().from("receipts").select("*").eq("path", path).limit(1);
    return r.error ? null : ((r.data as Receipt[] | null)?.[0] ?? null);
  } catch { return null; }
}

/** Décision du cabinet, quand elle existe. */
function Decision({ r, s }: { r: Receipt; s: ST }) {
  if (r.status === "valide") return <Pill tone="green" icon="check">{s.rOk}</Pill>;
  if (r.status === "refuse") return <Pill tone="red">{s.rNo}</Pill>;
  return null;
}

/**
 * Carte de résultat. Aucune valeur n'est inventée : ce qui n'a pas été lu est écrit « Non lu ».
 * `read` faux : le reçu est envoyé, sans lecture automatique.
 */
function ReceiptCard({ r, read, lang, s }: { r: Receipt; read: boolean; lang: Lang; s: ST }) {
  const money = (c: number | null) => (c === null || c === undefined ? null : cad(c, lang));
  const rows: [string, string | null][] = [
    [s.rVendor, r.vendor], [s.rDate, r.receipt_date ? fmtDate(r.receipt_date, lang) : null], [s.rTotal, money(r.total_cents)],
    [s.rGst, money(r.gst_cents)], [s.rQst, money(r.qst_cents)], [s.rCategory, r.category],
  ];
  return (
    <div className="space-y-3">
      {read ? (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.95rem]">
            {rows.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className={`break-words ${v ? "font-semibold text-ink" : "text-muted"}`}>{v ?? s.rNotRead}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-2xl bg-[#f4f5fa] p-3.5">
            <p className="text-sm text-muted">{s.rIndication}</p>
            <p className="mt-1 font-display font-semibold text-ink">{VERDICT[r.ai_verdict ?? "a_verifier"]?.[lang] ?? VERDICT.a_verifier[lang]}</p>
            {r.ai_note && <p className="mt-1 text-[0.95rem] leading-relaxed whitespace-pre-line text-ink">{r.ai_note}</p>}
          </div>
        </>
      ) : (
        <p className="rounded-2xl bg-[#e3f5ee] p-3.5 font-medium text-[#0b6248]">{s.rUnread}</p>
      )}
      {r.question && <p className="text-[0.95rem] text-ink"><span className="block text-sm text-muted">{s.rYourQ}</span>{r.question}</p>}
      {r.status !== "a_verifier" && (
        <div className="rounded-2xl border border-line p-3.5">
          <p className="text-sm text-muted">{s.rFirm}</p>
          <p className="mt-1.5"><Decision r={r} s={s} /></p>
          {r.staff_note && <p className="mt-2 text-[0.95rem] leading-relaxed whitespace-pre-line text-ink"><span className="block text-sm text-muted">{s.rFirmNote}</span>{r.staff_note}</p>}
        </div>
      )}
      <p className="flex items-start gap-2 text-sm leading-snug text-muted"><Ico name="shield" className="mt-0.5 h-4 w-4 shrink-0" />{s.rDisclaimer}</p>
    </div>
  );
}

function Thumb({ url, alt, s, className }: { url: string | null | undefined; alt: string; s: ST; className: string }) {
  const [bad, setBad] = useState(false);
  if (!url || bad)
    return <span role="img" aria-label={s.rNoThumb} className={`flex shrink-0 items-center justify-center rounded-xl bg-[#eef0f7] text-navy ${className}`}><Ico name="receipt" /></span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" onError={() => setBad(true)} className={`shrink-0 rounded-xl border border-line bg-white object-cover ${className}`} />;
}

/** « Mes reçus » : photographier un reçu du quotidien, poser une question, puis suivre la décision du cabinet. */
export function ReceiptsScreen({ d, dossiers, reload, lang, t, go }: { d: Dossier; dossiers: Dossier[]; reload: () => void; lang: Lang; t: T; go: Go }) {
  const s = scanTx[lang];
  const id = useId();
  const [list, setList] = useState<Receipt[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [view, setView] = useState<View>("tous");
  const [open, setOpen] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [question, setQuestion] = useState("");
  const [dossier, setDossier] = useState(d.id);
  const [phase, setPhase] = useState<"" | "up" | "read">("");
  const [sendErr, setSendErr] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<{ receipt: Receipt; read: boolean; url: string } | null>(null);
  const [online, setOnline] = useState(true);
  const progress = useRef<Progress | null>(null);
  const asked = useRef(new Set<string>());
  const urls = useRef(new Set<string>());
  const alive = useRef(true);
  const resultHead = useRef<HTMLHeadingElement>(null);
  const many = dossiers.length > 1;
  const resultId = result?.receipt.id;
  // Le résultat est annoncé dès qu'il arrive.
  useEffect(() => { if (resultId) resultHead.current?.focus({ preventScroll: true }); }, [resultId]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setFailed(false);
    let rows: Receipt[] | null = null;
    try {
      const r = await supabase().from("receipts").select("*").order("created_at", { ascending: false }).limit(300);
      rows = r.error ? null : ((r.data as Receipt[] | null) ?? []);
    } catch { rows = null; }
    if (!alive.current) return;
    if (rows) setList(rows); else if (!quiet) setFailed(true);
  }, []);
  useEffect(() => {
    alive.current = true;
    load();
    const held = urls.current;
    return () => { alive.current = false; held.forEach((u) => URL.revokeObjectURL(u)); };
  }, [load]);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine !== false);
    sync();
    window.addEventListener("online", sync); window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  // Vignettes : un lien signé par reçu, demandé une seule fois. Sans lien, une tuile neutre est affichée.
  useEffect(() => {
    const todo = (list ?? []).filter((r) => !asked.current.has(r.path)).slice(0, 60);
    if (!todo.length) return;
    todo.forEach((r) => asked.current.add(r.path));
    Promise.all(todo.map(async (r) => {
      try { return [r.path, (await supabase().storage.from("documents").createSignedUrl(r.path, 3600)).data?.signedUrl ?? null] as const; } catch { return [r.path, null] as const; }
    })).then((pairs) => { if (alive.current) setThumbs((m) => ({ ...m, ...Object.fromEntries(pairs) })); });
  }, [list]);

  const dropDraft = () => { setDraft(null); setQuestion(""); setSendErr(false); setLocked(false); progress.current = null; };
  const onScanned = (file: File) => {
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    progress.current = null;
    setDraft({ file, url }); setSendErr(false); setLocked(false); setResult(null); setScanning(false);
    if (!dossiers.some((x) => x.id === dossier)) setDossier(d.id);
  };

  const send = async () => {
    if (!draft || phase) return;
    if (!online) { toast(s.offline, "error"); return; }
    setSendErr(false); setLocked(true);
    const st = (progress.current ??= { dossier, path: `${dossier}/${uuid()}-recu-${scanStamp(new Date())}.jpg`, uploaded: false, listed: false, tried: false });
    const db = supabase();
    let receipt: Receipt | null = null, read = false;
    try {
      setPhase("up");
      if (!st.uploaded) {
        const up = await db.storage.from("documents").upload(st.path, draft.file, { contentType: "image/jpeg" });
        if (up.error) throw new Error("upload");
        st.uploaded = true;
      }
      if (!st.listed) {
        const ins = await db.from("documents").insert({ dossier_id: st.dossier, uploader_role: "client", path: st.path, name: draft.file.name.slice(0, 200), size: draft.file.size });
        if (ins.error) throw new Error("document");
        st.listed = true;
      }
      setPhase("read");
      const q = question.trim().slice(0, 500);
      if (demoRole()) {
        // Démonstration : aucun appel au serveur. Un résultat d'exemple, sans aucune valeur inventée.
        const r = await db.from("receipts").insert({ dossier_id: st.dossier, path: st.path, question: q, vendor: null, receipt_date: null, total_cents: null, gst_cents: null, qst_cents: null, category: null, ai_verdict: "a_verifier", ai_note: s.rDemoNote, status: "a_verifier", staff_note: "" }).select().single();
        if (r.error || !r.data) throw new Error("receipt");
        receipt = r.data as Receipt; read = true;
      } else {
        // Un essai précédent a pu enregistrer le reçu sans que la réponse nous parvienne.
        if (st.tried) receipt = await byPath(st.path);
        if (!receipt) {
          st.tried = true;
          let status = 0;
          try {
            const { data } = await real().auth.getSession();
            const res = await fetch("/api/receipt/", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ dossier_id: st.dossier, path: st.path, question: q, lang }) });
            status = res.status;
            if (res.ok) { const j = (await res.json()) as { receipt?: Receipt; read?: boolean }; receipt = j.receipt ?? null; read = Boolean(j.read); }
          } catch { status = 0; }
          if (!receipt && status === 503) {
            // Lecture automatique non configurée : le reçu est tout de même enregistré pour le cabinet.
            const r = await db.from("receipts").insert({ dossier_id: st.dossier, path: st.path, question: q }).select().single();
            if (!r.error && r.data) receipt = r.data as Receipt;
          }
          if (!receipt) receipt = await byPath(st.path);
        }
        if (!receipt) throw new Error("receipt");
        read = read || receipt.ai_verdict != null;
      }
    } catch { receipt = null; }
    if (!alive.current) return;
    setPhase("");
    if (!receipt) { setSendErr(true); toast(s.rSendErr, "error"); if (st.listed) reload(); return; }
    toast(s.rSent);
    setResult({ receipt, read, url: draft.url });
    setThumbs((m) => ({ ...m, [receipt.path]: m[receipt.path] ?? draft.url }));
    asked.current.add(receipt.path);
    setDraft(null); setQuestion(""); setLocked(false); progress.current = null;
    setList((l) => (l ? [receipt, ...l.filter((x) => x.id !== receipt.id)] : l));
    load(true); reload();
  };

  if (failed && !list) return <div className="max-w-2xl"><PageTitle back={t.back} go={go}>{s.rTitle}</PageTitle><LoadError lang={lang} retry={() => load()} /></div>;

  const shown = (list ?? []).filter((r) => view === "tous" || r.status === view);
  const confirmed = (list ?? []).filter((r) => r.status === "valide");
  const thisYear = Number(todayMtl().slice(0, 4));
  const years = [...new Set([thisYear, ...confirmed.map(yearOf)])].sort((a, b) => b - a).slice(0, 2).filter((y) => y === thisYear || confirmed.some((r) => yearOf(r) === y));
  const views: [View, string, number][] = [["tous", s.rAll, (list ?? []).length], ["a_verifier", s.rToCheck, (list ?? []).filter((r) => r.status === "a_verifier").length], ["valide", s.rConfirmed, confirmed.length]];

  return (
    <div className="max-w-2xl space-y-4">
      <PageTitle back={t.back} go={go} sub={s.rIntro}>{s.rTitle}</PageTitle>

      {!draft && !result && (
        <button type="button" onClick={() => setScanning(true)} className="btn-primary min-h-13 w-full px-5 py-3.5 text-base"><Ico name="camera" />{s.rAdd}</button>
      )}

      {draft && (
        <Box label={s.rCompose}>
          <h2 className="font-display text-lg font-semibold text-ink">{s.rCompose}</h2>
          <div className="mt-3 flex flex-col gap-4 min-[30rem]:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.url} alt={s.rImgAlt} className="mx-auto max-h-64 w-auto max-w-full rounded-2xl border border-line bg-white object-contain min-[30rem]:mx-0 min-[30rem]:max-w-[11rem]" />
            <div className="min-w-0 flex-1">
              <label htmlFor={`${id}-q`} className="label">{s.rQuestion}</label>
              <textarea id={`${id}-q`} value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} maxLength={500} placeholder={s.rQuestionPh} disabled={Boolean(phase)} className="field resize-y" />
              {many && (
                <div className="mt-3">
                  <label htmlFor={`${id}-d`} className="label">{s.rDossier}</label>
                  <select id={`${id}-d`} value={dossier} onChange={(e) => setDossier(e.target.value)} disabled={locked} className="field">
                    {dossiers.map((x) => <option key={x.id} value={x.id}>{dossierLabel(x)}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div role="status" aria-live="polite" className="mt-3 min-h-5 text-sm font-medium text-[#175f77]">{phase === "up" ? s.rStepUp : phase === "read" ? s.rStepRead : ""}</div>
          {sendErr && <p role="alert" className="mb-3 rounded-2xl border border-[#e9c7a0] bg-[#fff4e5] px-4 py-3 text-[0.95rem] font-medium text-[#6b3d00]">{s.rSendErr}</p>}
          {!online && <p className="mb-3 flex items-start gap-2 text-[0.95rem] font-medium text-[#6b3d00]"><Ico name="wifiOff" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />{s.offline}</p>}
          <div className="flex flex-col gap-2 min-[30rem]:flex-row-reverse">
            <button type="button" onClick={send} disabled={Boolean(phase) || !online} aria-busy={Boolean(phase)} className="btn-primary min-h-12 flex-1 px-5 disabled:opacity-60"><Ico name="send" strokeWidth={2.2} />{phase ? s.rSending : sendErr ? s.rRetry : s.rSend}</button>
            {!locked && <button type="button" onClick={() => setScanning(true)} disabled={Boolean(phase)} className="btn-secondary min-h-12 px-5">{s.rRedo}</button>}
            <button type="button" onClick={dropDraft} disabled={Boolean(phase)} className="min-h-12 rounded-full px-4 font-semibold text-navy underline underline-offset-4 disabled:opacity-60">{s.rCancel}</button>
          </div>
        </Box>
      )}

      {result && (
        <Box label={s.rResult}>
          <div className="flex items-start gap-3.5">
            <Thumb url={result.url} alt={s.rImgAlt} s={s} className="h-20 w-16" />
            <div className="min-w-0 flex-1">
              <h2 tabIndex={-1} ref={resultHead} className="font-display text-lg font-semibold text-ink outline-none">{s.rResult}</h2>
              <p className="text-sm text-muted">{s.rSentOn(fmtDate(result.receipt.created_at, lang))}{many ? ` · ${dossierLabel(dossiers.find((x) => x.id === result.receipt.dossier_id) ?? d)}` : ""}</p>
            </div>
          </div>
          <div className="mt-4"><ReceiptCard r={result.receipt} read={result.read} lang={lang} s={s} /></div>
          <div className="mt-4 flex flex-col gap-2 min-[30rem]:flex-row">
            <button type="button" onClick={() => { setResult(null); setScanning(true); }} className="btn-primary min-h-12 flex-1 px-5"><Ico name="camera" />{s.rAnother}</button>
            <button type="button" onClick={() => setResult(null)} className="btn-secondary min-h-12 flex-1 px-5">{s.rDone}</button>
          </div>
        </Box>
      )}

      {!list ? <Skeleton rows={3} label={t.loading} /> : (
        <>
          {years.map((y) => {
            const mine = confirmed.filter((r) => yearOf(r) === y);
            const sum = mine.reduce((a, r) => a + (r.total_cents ?? 0), 0);
            const missing = mine.filter((r) => r.total_cents == null).length;
            return (
              <Box key={y} className="!py-4">
                <p className="pf-eyebrow !text-[#565a75]">{s.rYear(y)}</p>
                <p className="mt-1.5 font-display text-[1.6rem] leading-none font-bold text-ink">{cad(sum, lang)}</p>
                <p className="mt-1.5 text-sm text-muted">{s.rYearCount(mine.length)}. {s.rYearNote}{missing ? ` ${s.rYearMissing(missing)}` : ""}</p>
              </Box>
            );
          })}

          <div className="flex items-center justify-between gap-3 px-1 pt-1">
            <h2 className="font-display text-lg font-semibold text-ink">{s.rList}</h2>
          </div>
          {list.length === 0 ? <Empty icon="receipt" title={s.rEmpty}>{s.rEmptyD}</Empty> : (
            <>
              <div role="group" aria-label={s.rFilter} className="flex flex-wrap gap-2">
                {views.map(([v, label, n]) => (
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${view === v ? "border-navy bg-navy text-white" : "border-navy/25 bg-white text-navy hover:border-navy"}`}>
                    {label}<span className={view === v ? "text-white/85" : "text-muted"}>{n}</span>
                  </button>
                ))}
              </div>
              {shown.length === 0 ? <p className="px-1 py-2 text-[0.95rem] text-muted">{s.rEmptyFilter}</p> : (
                <ul className="space-y-3">
                  {shown.map((r) => {
                    const isOpen = open === r.id;
                    const name = nameOf(r, lang, s);
                    return (
                      <li key={r.id} className="rounded-3xl border border-line bg-white p-4">
                        <div className="flex items-start gap-3.5">
                          <Thumb url={thumbs[r.path]} alt={s.rThumbAlt(name)} s={s} className="h-[4.5rem] w-14" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="min-w-0 font-display font-semibold break-words text-ink">{name}</h3>
                              <p className={`shrink-0 text-right ${r.total_cents == null ? "text-sm text-muted" : "font-display font-bold text-ink"}`}>{r.total_cents == null ? s.rNoAmount : cad(r.total_cents, lang)}</p>
                            </div>
                            <p className="text-sm text-muted">{fmtDate(r.receipt_date ?? r.created_at, lang)}{r.category ? ` · ${r.category}` : ""}{many ? ` · ${dossierLabel(dossiers.find((x) => x.id === r.dossier_id) ?? d)}` : ""}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {r.status === "a_verifier" ? <Pill tone="amber">{s.rPending}</Pill> : <Decision r={r} s={s} />}
                              </div>
                            {r.ai_verdict && r.ai_verdict !== "a_verifier" && <p className="mt-1.5 text-sm text-muted">{s.rIndication} : <span className="font-medium text-ink">{VERDICT[r.ai_verdict]?.[lang]}</span></p>}
                            {r.status !== "a_verifier" && r.staff_note && <p className="mt-2 text-[0.95rem] leading-snug text-ink"><span className="text-muted">{s.rFirmNote} : </span>{r.staff_note}</p>}
                          </div>
                        </div>
                        <button type="button" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen} aria-controls={`${id}-r-${r.id}`} aria-label={`${isOpen ? s.rHide : s.rDetails} : ${name}`} className="mt-2 -mb-1 inline-flex min-h-11 items-center gap-1 rounded-full px-1 text-sm font-semibold text-[#175f77]">
                          {isOpen ? s.rHide : s.rDetails}<Ico name={isOpen ? "up" : "down"} className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                        <div id={`${id}-r-${r.id}`} hidden={!isOpen} className="mt-2 border-t border-line pt-3">
                          {isOpen && <ReceiptCard r={r} read={r.ai_verdict != null} lang={lang} s={s} />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </>
      )}

      {scanning && <Scanner lang={lang} title={s.rScanTitle} single prefix="recu" onFile={onScanned} onClose={() => setScanning(false)} />}
    </div>
  );
}
