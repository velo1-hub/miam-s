"use client";
import { useState, type ReactNode } from "react";
import type { Lang } from "@/lib/site";
import { STEPS5, WEATHER, cad, fmtDate, step5, type DocRequest, type Dossier } from "../shared";
import { Deadlines } from "./Deadlines";
import { Checklist, DropZone, UploadStatus } from "./Docs";
import { FeedbackCard } from "./Extras";
import { Ico } from "./icons";
import { QuestEntry } from "./Situation";
import type { T } from "./text";
import { Box, Eyebrow, FilePick, PageTitle, Pill, Tile, type Tone } from "./ui";
import { dossierLabel, feedbackTarget, firstName, hasQuest, hasSavings, initials, isClosed, safePayUrl, type Go, type PortalData, type Upload, type UploadFn } from "./util";

/** Où en est le dossier, sur les 5 étapes visibles. `complete` : tout est fait (transmis ou fermé). */
export const stepState = (d: Dossier) => ({ idx: step5(d.status), complete: d.status === "transmis" || d.status === "ferme" });
const GOV_KINDS = ["impot_particulier", "travailleur_autonome", "impot_societe", "taxes"];
const upcoming = (key: string, d: Dossier, t: T) => (key === "signer" ? t.stSign : key === "transmis" && GOV_KINDS.includes(d.kind) ? t.stGov : t.stNext);

function WeatherPill({ d, lang, t }: { d: Dossier; lang: Lang; t: T }) {
  const w = d.weather ? WEATHER[d.weather] : undefined;
  if (!d.weather || !w) return null;
  const look = { degage: ["sun", "text-[#b86e00]"], nuageux: ["cloud", "text-[#4a4e66]"], orage: ["bolt", "text-[#a3261f]"] }[d.weather];
  return (
    <div className="order-3 w-full lg:w-auto lg:max-w-sm lg:text-right">
      <p className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-ink">
        <Ico name={look[0]} className={`h-[1.15rem] w-[1.15rem] ${look[1]}`} strokeWidth={2} />
        <span>{t.weather} : <strong className="font-semibold">{w[lang]}</strong></span>
      </p>
      {d.weather_note && <p className="mt-1.5 px-1 text-sm leading-snug text-muted">{d.weather_note}</p>}
    </div>
  );
}

/** Carte marine : dossier, étape en cours, progression en 5 segments, « Suivre ». */
function Hero({ d, lang, t, go }: { d: Dossier; lang: Lang; t: T; go: Go }) {
  const { idx, complete } = stepState(d);
  return (
    <div className="pf-navy on-dark rounded-3xl p-5 shadow-[0_22px_44px_-28px_rgba(23,23,58,.9)]">
      <p className="pf-eyebrow !text-[#b4e1ee]">{dossierLabel(d)}</p>
      <h2 className="mt-2 font-display text-[1.45rem] leading-tight font-semibold text-white">{STEPS5[idx][lang]}</h2>
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {STEPS5.map((s, i) => (
          <span key={s.key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
            <span className={`block h-full rounded-full bg-[#8fd3e6] ${i < idx || complete ? "w-full" : i === idx ? "w-1/2" : "w-0"}`} />
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="text-sm text-white/90">{t.stepOf(idx + 1)}</p>
        <button type="button" onClick={() => go("track")} aria-label={t.followAria} className="-mr-2 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-sm font-semibold text-white">
          {t.follow}<Ico name="chevron" className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function Savings({ d, lang, t, navy }: { d: Dossier; lang: Lang; t: T; navy?: boolean }) {
  if (!hasSavings(d)) return null;
  const amount = cad(d.savings_cents as number, lang);
  if (navy)
    return (
      <div className="pf-navy rounded-3xl p-5">
        <p className="pf-eyebrow !text-[#b4e1ee]">{t.savedEyebrow}</p>
        <p className="mt-2 font-display text-[2rem] leading-none font-bold text-white">{amount}</p>
        <p className="mt-2 text-sm text-white/90">{t.savedD}</p>
      </div>
    );
  return (
    <Box className="flex items-center gap-3.5 !py-4">
      <Tile icon="piggy" tone="green" />
      <div>
        <p className="text-sm text-muted">{t.saved}</p>
        <p className="font-display text-xl leading-tight font-bold text-ink">{amount}</p>
      </div>
    </Box>
  );
}

function Quick({ icon, tone, label, onClick, href, extra }: { icon: string; tone: Tone; label: string; onClick?: () => void; href?: string; extra?: Record<string, string | boolean | undefined> }) {
  const inner = (
    <>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(23,23,58,.04)]"><Tile icon={icon} tone={tone} className="h-9 w-9 !rounded-xl" /></span>
      <span className="text-[0.8rem] font-medium text-ink">{label}</span>
    </>
  );
  const cls = "flex w-full flex-col items-center gap-1.5 rounded-2xl py-1";
  return <li>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a> : <button type="button" onClick={onClick} className={cls} {...extra}>{inner}</button>}</li>;
}

function MiniCard({ eyebrow, icon, tone, text, children }: { eyebrow: string; icon: string; tone: Tone; text: string; children?: ReactNode }) {
  return (
    <Box className="!py-4">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-2 flex items-center gap-3">
        <Tile icon={icon} tone={tone} className="h-10 w-10" />
        <p className="min-w-0 flex-1 font-medium break-words text-ink">{text}</p>
        {children}
      </div>
    </Box>
  );
}
const miniBtn = "inline-flex min-h-11 shrink-0 items-center rounded-xl border border-navy/25 bg-white px-4 text-sm font-semibold text-navy hover:border-navy";
const miniBtnDark = "btn-primary min-h-11 shrink-0 !rounded-xl px-4 text-sm";

export function Home({ d, dossiers, data, uploads, busy, onUpload, openClara, claraOpen, refresh, refreshing, reload, lang, t, go }: { d: Dossier; dossiers: Dossier[]; data: PortalData; uploads: Upload[]; busy: boolean; onUpload: UploadFn; openClara: (el: HTMLElement) => void; claraOpen: boolean; refresh: () => void; refreshing: boolean; reload: () => void; lang: Lang; t: T; go: Go }) {
  const name = firstName(d.client_name);
  const missing = data.reqs.filter((r) => !r.received);
  const got = data.reqs.length - missing.length;
  const next = missing[0];
  const pending = (data.sigs ?? []).filter((s) => s.status === "a_signer");
  const dueInv = (data.invoices ?? []).filter((i) => i.status === "a_payer");
  const { idx, complete } = stepState(d);
  // Questionnaire : proposé tant qu'il n'est pas rempli. Lecture échouée (`null`) : on ne propose rien.
  const askQuest = hasQuest(d) && !isClosed(d) && data.quests !== null && !data.quests.some((q) => q.dossier_id === d.id);
  const fbTarget = feedbackTarget(dossiers, d, data.feedback);
  const [fbSent, setFbSent] = useState(false);

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 id="portal-title" tabIndex={-1} className="order-1 font-display leading-tight font-bold tracking-tight text-ink outline-none">
          <span className="block text-[0.95rem] font-normal tracking-normal text-muted lg:inline lg:text-[1.6rem] lg:font-bold lg:tracking-tight lg:text-ink">{t.hello}<span className="lg:hidden">,</span> </span>
          <span className="text-[1.9rem] lg:text-[1.6rem]">{name}</span>
        </h1>
        <div className="order-2 flex items-center gap-2">
          <button type="button" onClick={refresh} disabled={refreshing} aria-busy={refreshing} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-navy/25 bg-white px-3.5 text-sm font-semibold text-navy hover:border-navy disabled:text-[#565a75]">
            <Ico name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} strokeWidth={2} />{refreshing ? t.refreshing : t.refresh}
          </button>
          <button type="button" onClick={() => go("profile")} aria-label={t.myProfile} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbe3d2] text-sm font-bold text-[#7a3a12] lg:hidden">{initials(d.client_name) || <Ico name="user" />}</button>
        </div>
        <WeatherPill d={d} lang={lang} t={t} />
      </header>

      {/* Téléphone : l'accueil de la présentation */}
      <div className="space-y-4 lg:hidden">
        <Hero d={d} lang={lang} t={t} go={go} />
        <UploadStatus uploads={uploads} t={t} />
        {next ? (
          <Box className="flex items-center gap-3.5 !py-4">
            <Tile icon="file" tone="amber" />
            <button type="button" onClick={() => go("docs")} className="min-w-0 flex-1 rounded-lg text-left">
              <span className="block font-display font-semibold break-words text-ink">{next.label}</span>
              <span className="block text-sm text-muted">{t.toProvide}{missing.length > 1 ? ` · ${t.count(got, data.reqs.length)}` : ""}</span>
            </button>
            <FilePick camera aria={t.photoFor(next.label)} disabled={busy} onFiles={(f) => onUpload(f, next.id)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#8fd3e6] text-navy-950">
              <Ico name="camera" />
            </FilePick>
          </Box>
        ) : data.reqs.length > 0 ? (
          <Box className="flex items-center gap-3.5 !py-4">
            <Tile icon="check" tone="green" />
            <p className="min-w-0 flex-1 font-medium text-ink">{t.allDocs}</p>
          </Box>
        ) : null}

        {askQuest && <QuestEntry quest={undefined} card lang={lang} t={t} go={go} />}

        <nav aria-label={t.quickTitle}>
          <ul className="grid grid-cols-4 gap-1">
            <Quick icon="camera" tone="slate" label={t.quick.send} onClick={() => go("docs")} />
            <li>
              <button type="button" onClick={(e) => openClara(e.currentTarget)} aria-expanded={claraOpen} className="flex w-full flex-col items-center gap-1.5 rounded-2xl py-1">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(23,23,58,.04)]"><Tile icon="sparkle" tone="violet" className="h-9 w-9 !rounded-xl" /></span>
                <span className="text-[0.8rem] font-medium text-ink">{t.quick.clara}</span>
              </button>
            </li>
            <Quick icon="calendar" tone="sky" label={t.quick.agenda} onClick={() => go("appt")} />
            <Quick icon="card" tone="green" label={t.quick.pay} onClick={() => go("pay")} />
          </ul>
        </nav>

        {pending.length > 0 && (
          <MiniCard eyebrow={t.toSign} icon="sign" tone="violet" text={pending[0].title}>
            <button type="button" onClick={() => go("sign")} className={miniBtnDark}>{t.signCta}</button>
          </MiniCard>
        )}
        <Deadlines d={d} appts={data.appts} compact lang={lang} t={t} go={go} />
        <Savings d={d} lang={lang} t={t} />
      </div>

      {/* Ordinateur : le portail web de la présentation */}
      <div className="hidden space-y-4 lg:block">
        <Box>
          <Eyebrow>{dossierLabel(d)}</Eyebrow>
          <ol className="mt-4 flex items-start">
            {STEPS5.map((s, i) => {
              const done = i < idx || complete;
              const now = i === idx && !complete;
              return (
                <li key={s.key} aria-current={now ? "step" : undefined} className="relative flex flex-1 flex-col items-center text-center">
                  {i > 0 && <span className={`absolute top-[1.15rem] right-1/2 h-[3px] w-full -translate-y-1/2 rounded-full ${i <= idx || complete ? "bg-[#0d7a5a]" : "bg-[#dfe2ee]"}`} style={{ width: "calc(100% - 3.5rem)", marginRight: "1.75rem" }} aria-hidden="true" />}
                  <span className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${done ? "bg-[#0d7a5a] text-white" : now ? "bg-[#3f5fa0] text-white ring-4 ring-[#dfe7f5]" : "bg-[#e9ebf3] text-[#565a75]"}`}>
                    {done ? <Ico name="check" className="h-4.5 w-4.5" strokeWidth={2.6} /> : now ? <Ico name="clock" className="h-4.5 w-4.5" strokeWidth={2} /> : i + 1}
                  </span>
                  <span className={`mt-2 text-sm ${now ? "font-bold text-ink" : "text-muted"}`}>{s[lang]}</span>
                  <span className="sr-only">{done ? t.stDone : now ? t.stNow : t.stNext}</span>
                </li>
              );
            })}
          </ol>
          {(d.next_step || d.due_date) && (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-line pt-3.5 text-[0.95rem]">
              {d.next_step && <p className="min-w-0 flex-1 leading-relaxed whitespace-pre-line text-ink">{d.next_step}</p>}
              {d.due_date && <p className="text-muted">{t.due} : <span className="font-semibold text-ink">{fmtDate(d.due_date, lang)}</span></p>}
            </div>
          )}
        </Box>

        <UploadStatus uploads={uploads} t={t} />
        {askQuest && <QuestEntry quest={undefined} card lang={lang} t={t} go={go} />}
        <div className="grid grid-cols-[1.2fr_1fr] items-start gap-4">
          <div className="space-y-4">
          <Box>
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>{t.myDocs}{d.tax_year ? ` ${d.tax_year}` : ""}</Eyebrow>
              {data.reqs.length > 0 && <p className="text-sm font-semibold text-[#175f77]">{t.count(got, data.reqs.length)}</p>}
            </div>
            <div className="mt-1"><Checklist reqs={data.reqs} busy={busy} onUpload={onUpload} t={t} compact /></div>
            <div className="mt-3"><DropZone busy={busy} onUpload={onUpload} t={t} hint={missing.length > 0} /></div>
          </Box>
          <Deadlines d={d} appts={data.appts} compact lang={lang} t={t} go={go} />
          </div>
          <div className="space-y-4">
            <Savings d={d} lang={lang} t={t} navy />
            {data.sigs && (
              <MiniCard eyebrow={t.toSign} icon="sign" tone="violet" text={pending[0]?.title ?? t.noSign}>
                {pending.length > 0 && <button type="button" onClick={() => go("sign")} className={miniBtnDark}>{t.signCta}</button>}
              </MiniCard>
            )}
            <MiniCard eyebrow={t.apptCard} icon="calendar" tone="sky" text={t.apptWith}>
              <button type="button" onClick={() => go("appt")} className={miniBtn}>{t.apptCta}</button>
            </MiniCard>
            {dueInv.length > 0 && (
              <MiniCard eyebrow={t.toPayCard} icon="card" tone="green" text={`${dueInv[0].label} · ${cad(dueInv[0].amount_cents, lang)}`}>
                {safePayUrl(dueInv[0].pay_url) && dueInv.length === 1
                  ? <a href={safePayUrl(dueInv[0].pay_url)!} target="_blank" rel="noopener noreferrer" className={miniBtn}>{t.payCta}</a>
                  : <button type="button" onClick={() => go("pay")} className={miniBtn}>{t.see}</button>}
              </MiniCard>
            )}
          </div>
        </div>
      </div>

      {/* Une seule fois pour les deux mises en page : le formulaire garde son état. */}
      {(fbTarget || fbSent) && <div className="mt-4 max-w-2xl"><FeedbackCard target={fbTarget} many={dossiers.length > 1} onSent={() => setFbSent(true)} reload={reload} lang={lang} t={t} /></div>}
    </div>
  );
}

/** Suivi « comme un colis » : anneau d'avancement, les 5 étapes, puis la liste des documents. */
export function Track({ d, reqs, lang, t, go }: { d: Dossier; reqs: DocRequest[]; lang: Lang; t: T; go: Go }) {
  const { idx, complete } = stepState(d);
  const pct = complete ? 100 : Math.round(((idx + 1) / STEPS5.length) * 100);
  const R = 30, C = 2 * Math.PI * R;
  const got = reqs.filter((r) => r.received).length;
  return (
    <div className="mx-auto max-w-2xl space-y-4 lg:mx-0">
      <PageTitle back={t.back} go={go}>{dossierLabel(d)}</PageTitle>
      <Box className="flex items-center gap-4">
        <div className="relative h-[5.25rem] w-[5.25rem] shrink-0" role="img" aria-label={`${t.progress} : ${t.stepOf(idx + 1)}`}>
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="36" cy="36" r={R} fill="none" stroke="#e4e7f1" strokeWidth="7" />
            <circle cx="36" cy="36" r={R} fill="none" stroke="#3f5fa0" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(pct / 100) * C} ${C}`} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-[1.05rem] font-bold text-ink" aria-hidden="true">{pct} %</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg leading-tight font-semibold text-ink">{STEPS5[idx][lang]}</h2>
          <p className="mt-0.5 text-sm text-muted">{t.stepOf(idx + 1)}</p>
          {d.assignee && <p className="mt-1.5 text-sm text-muted">{t.followedBy} <span className="font-medium text-ink">{d.assignee}</span></p>}
        </div>
      </Box>
      {(d.next_step || d.due_date) && (
        <Box className="!py-4">
          {d.next_step && <><Eyebrow>{t.firmNote}</Eyebrow><p className="mt-1.5 leading-relaxed whitespace-pre-line text-ink">{d.next_step}</p></>}
          {d.due_date && <p className={`text-[0.95rem] text-muted ${d.next_step ? "mt-3 border-t border-line pt-3" : ""}`}>{t.due} : <span className="font-semibold text-ink">{fmtDate(d.due_date, lang)}</span></p>}
        </Box>
      )}

      <h2 className="px-1 pt-1 font-display text-lg font-semibold text-ink">{t.steps}</h2>
      <Box>
        <ol>
          {STEPS5.map((s, i) => {
            const done = i < idx || complete;
            const now = i === idx && !complete;
            const last = i === STEPS5.length - 1;
            return (
              <li key={s.key} aria-current={now ? "step" : undefined} className={`relative flex gap-3 ${last ? "" : "pb-5"}`}>
                {!last && <span className={`absolute top-7 bottom-0 left-[0.8rem] w-0.5 -translate-x-1/2 ${done ? "bg-[#0d7a5a]" : "bg-[#dfe2ee]"}`} aria-hidden="true" />}
                <span className={`relative flex h-[1.6rem] w-[1.6rem] shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-[#0d7a5a] text-white" : now ? "border-2 border-[#2b8fb0] bg-[#e4f4f9] text-[#175f77]" : "border-2 border-[#b9bdd0] bg-white text-[#565a75]"}`}>
                  {done ? <Ico name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : now ? <Ico name="clock" className="h-3.5 w-3.5" strokeWidth={2.2} /> : i + 1}
                </span>
                <span className="-mt-0.5">
                  <span className={`block font-display font-semibold ${done || now ? "text-ink" : "text-[#565a75]"}`}>{s[lang]}</span>
                  <span className={`block text-sm ${now ? "font-semibold text-[#175f77]" : "text-muted"}`}>{done ? t.stDone : now ? t.stNow : upcoming(s.key, d, t)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </Box>

      <div className="flex items-baseline justify-between gap-3 px-1 pt-1">
        <h2 className="font-display text-lg font-semibold text-ink">{t.myDocs}</h2>
        {reqs.length > 0 && <p className="text-sm font-semibold text-[#175f77]">{t.count(got, reqs.length)}</p>}
      </div>
      <Box className="!py-2">
        {reqs.length === 0 ? <p className="py-2 text-[0.95rem] text-muted">{t.noReqs}</p> : (
          <ul className="divide-y divide-line">
            {reqs.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <Tile icon="file" tone={r.received ? "slate" : "amber"} className="h-10 w-10" />
                <span className="min-w-0 flex-1 font-medium break-words text-ink">{r.label}</span>
                {r.received ? <Pill tone="green" icon="check">{t.received}</Pill> : <button type="button" onClick={() => go("docs")} aria-label={`${t.add} : ${r.label}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-[#8fd3e6] px-4 text-sm font-semibold text-navy-950">{t.add}</button>}
              </li>
            ))}
          </ul>
        )}
      </Box>
    </div>
  );
}
