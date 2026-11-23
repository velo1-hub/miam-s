"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Lang } from "@/lib/site";
import { QGROUPS, QUESTIONS, type QKey } from "@/lib/questionnaire";
import { fmtDate, save, toast, type DocRequest, type Dossier } from "../shared";
import { Ico } from "./icons";
import type { T } from "./text";
import { Box, Eyebrow, PageTitle, Pill, SectionError, Tile } from "./ui";
import { dossierLabel, type Go, type Questionnaire } from "./util";

type Answers = Partial<Record<QKey, "true" | "false">>;
const GROUPS = Object.keys(QGROUPS);
const NOTE = GROUPS.length;       // étape « Autre chose à nous dire ? »
const REVIEW = GROUPS.length + 1; // étape de vérification
const TOTAL = GROUPS.length + 2;
const NOTE_MAX = 1000;
const fromSaved = (q?: Questionnaire): Answers => {
  const out: Answers = {};
  for (const x of QUESTIONS) { const v = q?.answers?.[x.key]; if (v === "true" || v === "false") out[x.key] = v; }
  return out;
};
const btnOff = "disabled:cursor-not-allowed disabled:!bg-none disabled:!bg-[#5d6079]";

/** Entrée du questionnaire : carte d'accueil (`card`) ou ligne dans Documents. */
export function QuestEntry({ quest, card = false, lang, t, go }: { quest: Questionnaire | undefined; card?: boolean; lang: Lang; t: T; go: Go }) {
  return (
    <Box className="flex items-center gap-3.5 !py-4">
      <Tile icon="list" tone="violet" />
      <div className="min-w-0 flex-1">
        <h2 className="font-display font-semibold text-ink">{t.qTitle}</h2>
        <p className="text-sm text-muted">{quest ? t.qRowDone(fmtDate(quest.submitted_at, lang)) : card ? t.qCardD : t.qRowD}</p>
      </div>
      <button type="button" onClick={() => go("quest")} aria-label={`${quest ? t.qSee : t.qStart} : ${t.qTitle}`} className={quest ? "inline-flex min-h-11 shrink-0 items-center rounded-xl border border-navy/25 bg-white px-4 text-sm font-semibold text-navy hover:border-navy" : "btn-primary min-h-11 shrink-0 !rounded-xl px-4 text-sm"}>
        {quest ? t.qSee : t.qStart}
      </button>
    </Box>
  );
}

/** Réponses déjà envoyées, en lecture seule. */
function Summary({ quest, lang, t, edit }: { quest: Questionnaire; lang: Lang; t: T; edit: () => void }) {
  const saved = fromSaved(quest);
  return (
    <div className="space-y-4">
      <Box>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 className="font-display text-lg font-semibold text-ink">{t.qAnswers}</h2>
          <p className="text-sm text-muted">{t.qSentOn(fmtDate(quest.submitted_at, lang))}</p>
        </div>
        {GROUPS.map((g) => (
          <div key={g} className="mt-4">
            <Eyebrow>{QGROUPS[g][lang]}</Eyebrow>
            <ul className="mt-1 divide-y divide-line">
              {QUESTIONS.filter((q) => q.group === g).map((q) => (
                <li key={q.key} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 break-words text-ink">{q[lang]}</span>
                  {saved[q.key] === "true" ? <Pill tone="green" icon="check">{t.yes}</Pill> : saved[q.key] === "false" ? <Pill tone="slate">{t.no}</Pill> : <Pill tone="amber">{t.qNoAnswer}</Pill>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {quest.note && (
          <div className="mt-4 border-t border-line pt-4">
            <Eyebrow>{t.qNote}</Eyebrow>
            <p className="mt-1.5 leading-relaxed break-words whitespace-pre-line text-ink">{quest.note}</p>
          </div>
        )}
        <button type="button" onClick={edit} className="btn-secondary mt-5 min-h-12 w-full sm:w-auto">{t.qEdit}</button>
      </Box>
      <p className="px-1 text-sm leading-relaxed text-muted">{t.qFirm}</p>
    </div>
  );
}

/** « Ma situation cette année » : un groupe de questions par étape, une note, puis la vérification avant l'envoi. */
export function QuestScreen({ d, quests, reqs, reload, retry, lang, t, go }: { d: Dossier; quests: Questionnaire[] | null; reqs: DocRequest[]; reload: () => Promise<unknown> | void; retry: () => void; lang: Lang; t: T; go: Go }) {
  const quest = quests?.find((q) => q.dossier_id === d.id);
  // Pré-rempli une seule fois : un rafraîchissement discret ne doit pas effacer des réponses en cours.
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [note, setNote] = useState("");
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const head = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    window.scrollTo(0, 0);
    head.current?.focus({ preventScroll: true });
  }, [step, editing]);

  const title = <PageTitle back={t.qBackDocs} to="docs" go={go} sub={dossierLabel(d)}>{t.qTitle}</PageTitle>;
  if (!quests) return <div className="max-w-2xl">{title}<SectionError text={t.sectionErr} retryLabel={t.retry} retry={retry} /></div>;

  const start = () => { moved.current = true; setAnswers(fromSaved(quest)); setNote(quest?.note ?? ""); setStep(0); setMissing(false); setEditing(true); };
  if (quest && !editing) return <div className="max-w-2xl">{title}<Summary quest={quest} lang={lang} t={t} edit={start} /></div>;

  const goTo = (n: number) => { moved.current = true; setMissing(false); setStep(n); };
  const group = GROUPS[step];
  const items = QUESTIONS.filter((q) => q.group === group);
  const next = () => {
    const first = items.find((q) => !answers[q.key]);
    if (first) { setMissing(true); document.getElementById(`q-${first.key}-true`)?.focus(); return; }
    goTo(step + 1);
  };
  const yes = QUESTIONS.filter((q) => answers[q.key] === "true");
  const onList = (label: string) => reqs.some((r) => r.label === label);
  const toAdd = yes.filter((q) => !onList(q.doc));
  const already = yes.filter((q) => onList(q.doc));
  const send = async () => {
    if (busy) return;
    setBusy(true);
    const payload: Record<string, string> = {};
    for (const q of QUESTIONS) payload[q.key] = answers[q.key] === "true" ? "true" : "false";
    let added = 0;
    const call = Promise.resolve(supabase().rpc("submit_questionnaire", { p_dossier: d.id, p_answers: payload, p_note: note.trim().slice(0, NOTE_MAX) }))
      .then((r) => { added = typeof r.data === "number" ? r.data : 0; return r; });
    const ok = await save(call, { lang });
    if (!ok) { setBusy(false); return; }
    toast(t.qDone(added));
    await reload();
    setBusy(false);
    go("docs");
  };
  const stepTitle = step < NOTE ? QGROUPS[group][lang] : step === NOTE ? t.qNoteTitle : t.qReview;
  const radio = "flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy";

  return (
    <div className="max-w-2xl">
      {title}
      <div className="rounded-3xl border border-line bg-white p-5">
        <p className="text-sm font-semibold text-[#175f77]">{t.qStep(step + 1, TOTAL)}</p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: TOTAL }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#2b8fb0]" : "bg-[#dfe2ee]"}`} />)}
        </div>
        <h2 ref={head} tabIndex={-1} className="mt-4 font-display text-xl leading-tight font-semibold text-ink outline-none">{stepTitle}</h2>

        {step < NOTE && (
          <>
            {step === 0 && <p className="mt-1.5 leading-relaxed text-muted">{t.qIntro} {t.qFirm}</p>}
            <div className="mt-2 divide-y divide-line">
              {items.map((q) => (
                <fieldset key={q.key} className="py-4">
                  <legend className="font-medium text-ink">{q[lang]}</legend>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                    {(["true", "false"] as const).map((v) => {
                      const on = answers[q.key] === v;
                      return (
                        <label key={v} className={`${radio} ${on ? "border-navy bg-[#eef0f7] text-navy" : "border-[#8a8ea3] bg-white text-ink"}`}>
                          <input type="radio" id={`q-${q.key}-${v}`} name={`q-${q.key}`} value={v} checked={on} onChange={() => setAnswers((a) => ({ ...a, [q.key]: v }))} className="sr-only" />
                          {on && <Ico name="check" className="h-5 w-5" strokeWidth={2.6} />}
                          <span>{v === "true" ? t.yes : t.no}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            {missing && items.some((q) => !answers[q.key]) && <p role="alert" className="mb-3 rounded-xl bg-[#fff1dc] px-3.5 py-2.5 text-[0.95rem] font-medium text-[#6b3d00]">{t.qMissing}</p>}
          </>
        )}

        {step === NOTE && (
          <div className="mt-3">
            <label htmlFor="q-note" className="label">{t.qNoteL}</label>
            <textarea id="q-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={NOTE_MAX} aria-describedby="q-note-help" className="field resize-y" />
            <p id="q-note-help" className="mt-1.5 text-sm text-muted">{t.qNoteHelp}</p>
          </div>
        )}

        {step === REVIEW && (
          <div className="mt-3 space-y-4">
            <div>
              <h3 className="font-semibold text-ink">{t.qWillAdd}</h3>
              {toAdd.length === 0 ? <p className="mt-1.5 text-[0.95rem] text-muted">{t.qNoneAdd}</p> : (
                <ul className="mt-1 divide-y divide-line">
                  {toAdd.map((q) => (
                    <li key={q.key} className="flex items-center gap-3 py-2.5">
                      <Tile icon="file" tone="amber" className="h-10 w-10" />
                      <span className="min-w-0 flex-1 font-medium break-words text-ink">{lang === "fr" ? q.doc : q.docEn}</span>
                    </li>
                  ))}
                </ul>
              )}
              {toAdd.length > 0 && t.qLabelNote && <p className="mt-1.5 text-sm text-muted">{t.qLabelNote}</p>}
            </div>
            {already.length > 0 && (
              <div>
                <h3 className="font-semibold text-ink">{t.qAlready}</h3>
                <ul className="mt-1 divide-y divide-line">
                  {already.map((q) => (
                    <li key={q.key} className="flex items-center gap-3 py-2.5">
                      <Tile icon="check" tone="green" className="h-10 w-10" />
                      <span className="min-w-0 flex-1 break-words text-ink">{lang === "fr" ? q.doc : q.docEn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {note.trim() && (
              <div>
                <h3 className="font-semibold text-ink">{t.qNote}</h3>
                <p className="mt-1.5 rounded-2xl bg-[#f4f5fa] p-4 leading-relaxed break-words whitespace-pre-line text-ink">{note.trim()}</p>
              </div>
            )}
            <p className="rounded-2xl bg-[#e4f4f9] px-4 py-3 text-[0.95rem] leading-relaxed text-[#134e62]">{t.qFirm}{quest ? ` ${t.qKeep}` : ""}</p>
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-line pt-4 min-[26rem]:flex-row min-[26rem]:justify-between">
          {step === 0
            ? <button type="button" onClick={() => (quest ? setEditing(false) : go("docs"))} className="btn-secondary min-h-12 px-5">{t.qCancel}</button>
            : <button type="button" onClick={() => goTo(step - 1)} disabled={busy} className="btn-secondary min-h-12 px-5">{t.qPrev}</button>}
          {step === REVIEW
            ? <button type="button" onClick={send} disabled={busy} className={`btn-primary min-h-12 px-6 ${btnOff}`}>{busy ? t.qBusy : t.qSend}</button>
            : <button type="button" onClick={step < NOTE ? next : () => goTo(step + 1)} className="btn-primary min-h-12 px-6">{step === NOTE ? t.qToReview : t.qNext}</button>}
        </div>
      </div>
    </div>
  );
}
