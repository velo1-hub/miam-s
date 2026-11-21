"use client";
import { useMemo, type ReactNode } from "react";
import { STEPS5, fmtDate, step5 } from "../shared";
import { Avatar, Box, Eyebrow, Icon, STAGE_INK, STAGE_TONE, WAIT_RULE, box, daySentence, daysUntil, docsToCheck, dueInfo, isLate, isSoon, link, money, plural, receiptsToCheck, smallBtn, waitOf, type DFilter, type Lead, type OpenDossier, type Section, type ShowReceipts, type Store, type Task } from "./common";
import { paidThisMonth, sumCents } from "./invoices";

type Tone = "review" | "info" | "warn" | "late";
const TONE: Record<Tone, string> = { review: "text-[#5140b8]", info: "text-[#0d6474]", warn: "text-[#8a4b00]", late: "text-[#a3261f]" };
type Priority = { key: string; name: string; label: string; tone: Tone; onClick: () => void; action?: ReactNode; wait?: { text: string; late: boolean } };

/** Les vrais décomptes du jour : servent aux tuiles, à la phrase du jour et à l'écran du téléphone. */
export function useCounts(store: Store) {
  return useMemo(() => {
    const open = store.dossiers.filter((d) => d.status !== "ferme");
    const paid = paidThisMonth(store.invoices);
    return {
      open, review: open.filter((d) => d.status === "en_revision"), fresh: store.leads.filter((l) => l.status === "nouveau"), paid,
      paidCents: sumCents(paid), unpaid: store.invoices.filter((x) => x.status === "a_payer"), late: open.filter(isLate), toRead: store.dossiers.filter((d) => store.waiting.includes(d.id)), receipts: receiptsToCheck(store),
    };
  }, [store]);
}
export const sentenceOf = (c: ReturnType<typeof useCounts>) => daySentence({ review: c.review.length, prospects: c.fresh.length, unpaid: c.unpaid.length, late: c.late.length, toRead: c.toRead.length, receipts: c.receipts.length });

function Kpi({ label, value, note, tone = "text-ink", onClick }: { label: string; value: string; note: string; tone?: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={`${box} block h-full w-full text-left hover:border-[#b9dfeb]`}>
        <span className="block text-sm text-ink/80">{label}</span>
        <span className={`mt-1 block font-display text-[1.7rem] leading-tight font-bold ${tone}`}>{value}</span>
        <span className="mt-2 inline-block rounded-full bg-[#eef0f6] px-2.5 py-0.5 text-xs font-medium text-ink">{note}</span>
      </button>
    </li>
  );
}

/** Dossiers en cours répartis sur les 5 étapes vues par le client. Les dossiers fermés ne sont pas comptés. */
function StageChart({ store }: { store: Store }) {
  const counts = STEPS5.map((_, i) => store.dossiers.filter((d) => d.status !== "ferme" && step5(d.status) === i).length);
  const max = Math.max(1, ...counts);
  return (
    <Box title="Dossiers par étape" className="lg:col-span-2">
      <ul className="grid grid-cols-5 items-start gap-2 sm:gap-5" aria-label="Nombre de dossiers en cours à chaque étape">
        {STEPS5.map((s, i) => (
          <li key={s.key} className="flex flex-col items-center text-center">
            <span className="font-display text-xl font-bold text-ink">{counts[i]}<span className="sr-only"> {counts[i] > 1 ? "dossiers" : "dossier"} : </span></span>
            <span className="mt-1 flex h-28 w-full max-w-16 items-end" aria-hidden="true">
              <span className="block w-full rounded-t-lg rounded-b-sm" style={{ height: counts[i] ? `${Math.max(12, (counts[i] / max) * 100)}%` : "4px", background: counts[i] ? STAGE_TONE[i] : "#e6e8f2", color: STAGE_INK[i] }} />
            </span>
            <span className="mt-2 text-xs leading-tight text-ink/80">{s.fr}</span>
          </li>
        ))}
      </ul>
    </Box>
  );
}

function PriorityList({ items, more }: { items: Priority[]; more: () => void }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h2 className="font-display text-lg font-semibold text-ink">Priorités</h2>
        <button type="button" onClick={more} className={`${link} inline-flex min-h-11 items-center text-sm`}>Tout voir</button>
      </div>
      {items.length === 0 ? <p className={`${box} text-sm text-muted`}>Rien d'urgent : aucun retard, aucun message, document ni reçu en attente.</p> : (
        <ul className={`${box} divide-y divide-line !py-1`}>
          {items.map((p) => (
            <li key={p.key} className="flex items-center gap-1">
              <button type="button" onClick={p.onClick} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left hover:bg-sky-50">
                <Avatar name={p.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{p.name}</span>
                  <span className={`block truncate text-sm font-medium ${TONE[p.tone]}`}><span aria-hidden="true">● </span>{p.label}</span>
                </span>
                {p.wait && <span data-wait={p.wait.late ? "late" : "ok"} title={WAIT_RULE} className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${p.wait.late ? "bg-[#fff4e5] text-[#6b3d00]" : "bg-[#eef0f6] text-ink"}`}>{p.wait.late ? "Délai de réponse dépassé" : "Dans le délai de réponse"}</span>}
                {!p.action && <span className="shrink-0 text-xl text-ink/50" aria-hidden="true">›</span>}
              </button>
              {p.action}
            </li>
          ))}
        </ul>
      )}
      {items.some((p) => p.wait) && <p className="mt-2 px-1 text-xs text-muted">Réponse promise en un jour ouvrable. {WAIT_RULE}</p>}
    </section>
  );
}

/** Charge de travail : pour chaque personne, ses dossiers en cours et ses tâches ouvertes, avec la part en retard. */
function Workload({ store, showDossiers }: { store: Store; showDossiers: (f: Partial<DFilter>) => void }) {
  const list = useMemo(() => {
    const open = store.dossiers.filter((d) => d.status !== "ferme");
    const known = new Set(store.dossiers.map((d) => d.id));
    const tasks = store.tasks.filter((t) => !t.done && known.has(t.dossier_id));
    const names = [...new Set([...store.team, ...open.map((d) => d.assignee ?? ""), ...tasks.map((t) => t.assignee)].filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
    const row = (name: string, owner: string, mine: (who: string | undefined) => boolean) => {
      const ds = open.filter((d) => mine(d.assignee)), ts = tasks.filter((t) => mine(t.assignee));
      return { name, owner, dossiers: ds.length, lateDossiers: ds.filter(isLate).length, tasks: ts.length, lateTasks: ts.filter((t) => t.due_date && daysUntil(t.due_date) < 0).length };
    };
    return [...names.map((n) => row(n, n, (who) => who === n)), row("Non attribué", "__aucun", (who) => !who)];
  }, [store]);
  const maxD = Math.max(1, ...list.map((r) => r.dossiers)), maxT = Math.max(1, ...list.map((r) => r.tasks));
  const bar = (n: number, late: number, max: number) => (
    <span className="mt-1 flex h-2.5 w-full overflow-hidden rounded-full bg-[#eef0f6]" aria-hidden="true">
      <span className="h-full bg-[#a3261f]" style={{ width: `${(late / max) * 100}%` }} />
      <span className="h-full bg-[#4a6db0]" style={{ width: `${((n - late) / max) * 100}%` }} />
    </span>
  );
  return (
    <Box title="Charge de travail" id="charge">
      <ul className="divide-y divide-line" aria-label="Charge de travail par personne">
        {list.map((r) => (
          <li key={r.owner}>
            <button type="button" data-owner={r.owner} onClick={() => showDossiers({ owner: r.owner })} aria-label={`${r.name} : ${plural(r.dossiers, "dossier en cours", "dossiers en cours")} dont ${r.lateDossiers} en retard, ${plural(r.tasks, "tâche ouverte", "tâches ouvertes")} dont ${r.lateTasks} en retard. Voir ses dossiers.`} className="grid w-full gap-x-5 gap-y-2 rounded-xl py-3 text-left hover:bg-sky-50 sm:grid-cols-[13rem_1fr_1fr] sm:items-center">
              <span className="flex min-w-0 items-center gap-3">{r.owner === "__aucun" ? <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-[#9aa0b8] text-xs text-muted">?</span> : <Avatar name={r.name} className="h-9 w-9 text-xs" />}<span className="truncate font-semibold text-ink">{r.name}</span></span>
              <span className="block min-w-0 text-sm text-ink">
                <span className="block">{plural(r.dossiers, "dossier en cours", "dossiers en cours")}{r.lateDossiers > 0 && <span className="font-semibold text-[#a3261f]"> · {r.lateDossiers} en retard</span>}</span>
                {bar(r.dossiers, r.lateDossiers, maxD)}
              </span>
              <span className="block min-w-0 text-sm text-ink">
                <span className="block">{plural(r.tasks, "tâche ouverte", "tâches ouvertes")}{r.lateTasks > 0 && <span className="font-semibold text-[#a3261f]"> · {r.lateTasks} en retard</span>}</span>
                {bar(r.tasks, r.lateTasks, maxT)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-xs text-muted">Dossiers non fermés et tâches non terminées. En rouge : la part dont l'échéance est passée. Choisissez une ligne pour voir les dossiers de cette personne.</p>
    </Box>
  );
}

export function Today({ store, staffName, firstName, demo, refresh, openDossier, openLead, acceptLead, showDossiers, showLeads, showReceipts, go, completeTask, markReceived }: {
  store: Store; staffName: string; firstName: string; demo: boolean; refresh: ReactNode; openDossier: OpenDossier; openLead: (id: string) => void; acceptLead: (l: Lead) => void;
  showDossiers: (f: Partial<DFilter>) => void; showLeads: (f: string) => void; showReceipts: ShowReceipts; go: (s: Section) => void; completeTask: (t: Task) => void; markReceived: (requestId: string) => void;
}) {
  const c = useCounts(store);
  const sentence = sentenceOf(c);
  const byId = useMemo(() => new Map(store.dossiers.map((d) => [d.id, d])), [store.dossiers]);
  const name = (id: string) => byId.get(id)?.client_name ?? "Dossier";
  const mine = store.tasks.filter((t) => !t.done && t.assignee === staffName).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  const toCheck = docsToCheck(store);
  // Reçus à vérifier, regroupés par dossier : une ligne par dossier, le plus ancien envoi d'abord.
  const receiptGroups = useMemo(() => {
    const groups = new Map<string, typeof c.receipts>();
    for (const r of c.receipts) groups.set(r.dossier_id, [...(groups.get(r.dossier_id) ?? []), r]);
    const oldest = (l: typeof c.receipts) => l.reduce((min, r) => (r.created_at < min ? r.created_at : min), l[0].created_at);
    return [...groups.entries()].sort((a, b) => oldest(a[1]).localeCompare(oldest(b[1])));
  }, [c.receipts]);

  // Une ligne par dossier, la raison la plus pressante d'abord ; puis les documents à vérifier et les prospects.
  const seen = new Set<string>();
  const once = (list: Priority[]) => list.filter((p) => !seen.has(p.key) && seen.add(p.key));
  const priorities: Priority[] = [
    // Un dossier en retard qui attend aussi une réponse garde sa ligne « en retard », avec l'attente du client en plus.
    ...once(c.late.map((d) => { const w = waitOf(store, d.id); return { key: d.id, name: d.client_name, label: `${dueInfo(d.due_date!).text} · ${d.title}${w ? ` · message en attente depuis ${w.text}` : ""}`, tone: "late" as const, onClick: () => openDossier(d.id), wait: w ?? undefined }; })),
    // Messages à lire : la plus longue attente d'abord ; en ambre seulement au-delà d'un jour ouvrable.
    ...once(c.toRead.map((d) => ({ d, w: waitOf(store, d.id) })).sort((a, b) => (b.w?.hours ?? -1) - (a.w?.hours ?? -1)).map(({ d, w }) => ({ key: d.id, name: d.client_name, label: w ? `Message à lire · attend depuis ${w.text}` : "Message à lire", tone: w?.late ? ("warn" as const) : ("info" as const), onClick: () => openDossier(d.id, "messages"), wait: w ?? undefined }))),
    ...once(c.review.map((d) => ({ key: d.id, name: d.client_name, label: `À réviser · ${d.title}`, tone: "review" as const, onClick: () => openDossier(d.id) }))),
    ...toCheck.map((f) => ({ key: `f-${f.id}`, name: name(f.dossier_id), label: `Document à vérifier · ${f.name}`, tone: "info" as const, onClick: () => openDossier(f.dossier_id, "documents"), action: f.request_id ? <button type="button" onClick={() => markReceived(f.request_id!)} className={`${smallBtn} shrink-0`}>Marquer reçu</button> : undefined })),
    ...receiptGroups.map(([id, list]) => ({ key: `rc-${id}`, name: name(id), label: list.length > 1 ? `${list.length} reçus à vérifier` : `Reçu à vérifier · ${list[0].vendor?.trim() || "commerçant non lu"}`, tone: "info" as const, onClick: () => showReceipts({ dossier: id }) })),
    ...c.fresh.map((l) => ({ key: `l-${l.id}`, name: l.name, label: "Prospect à approuver", tone: "warn" as const, onClick: () => openLead(l.id) })),
    ...once(c.open.filter(isSoon).sort((a, b) => a.due_date!.localeCompare(b.due_date!)).map((d) => ({ key: d.id, name: d.client_name, label: `Échéance ${dueInfo(d.due_date!).text.toLowerCase()} · ${d.title}`, tone: "info" as const, onClick: () => openDossier(d.id) }))),
  ];
  const day = new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Montreal" }).format(new Date());

  return (
    <div className="flex flex-col gap-4">
      {/* Téléphone : salutation, phrase du jour, trois compteurs (page « le cabinet dans sa poche »). */}
      <div className="lg:hidden">
        <div className="pf-navy -mx-4 -mt-5 px-4 pt-6 pb-14 sm:-mx-6 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/85 first-letter:uppercase">{day}</p>
              <h1 className="font-display text-2xl font-bold tracking-tight !text-white">{firstName ? `Bonjour ${firstName}` : "Bonjour"}</h1>
            </div>
            <Avatar name={staffName} className="h-10 w-10 text-sm ring-2 ring-white/40" />
          </div>
          <p className="mt-4 flex gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-3 text-sm leading-snug text-white"><Icon name="spark" className="mt-0.5 h-4 w-4" />{sentence}</p>
        </div>
        <ul className="-mt-9 grid grid-cols-3 gap-2.5" aria-label="Compteurs du jour">
          {([
            [c.review.length, "À réviser", "text-[#5140b8]", () => showDossiers({ stage: "en_revision" })],
            [c.fresh.length, "Prospects", "text-[#8a4b00]", () => showLeads("nouveau")],
            [c.paid.length, c.paid.length > 1 ? "Payées ce mois" : "Payée ce mois", "text-[#1e5b2e]", () => go("facturation")],
          ] as const).map(([n, l, tone, onClick]) => (
            <li key={l}><button type="button" onClick={onClick} className="block h-full w-full rounded-2xl border border-[#e6e8f2] bg-white px-3 py-2.5 text-left"><span className={`block font-display text-2xl font-bold ${tone}`}>{n}</span><span className="block text-xs text-ink/80">{l}</span></button></li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between gap-2">{demo ? <span className="rounded-full bg-[#eef0f6] px-3 py-1 text-xs font-medium text-ink">Données d'exemple</span> : <span />}{refresh}</div>
      </div>

      <ul className="hidden gap-4 lg:grid lg:grid-cols-3 xl:grid-cols-5" aria-label="Chiffres du jour">
        <Kpi label="Dossiers en cours" value={String(c.open.length)} note={c.late.length ? `dont ${c.late.length} en retard` : "aucun en retard"} onClick={() => showDossiers({})} />
        <Kpi label="Prêts à réviser" value={String(c.review.length)} tone="text-[#5140b8]" note="étape Révision par un CPA" onClick={() => showDossiers({ stage: "en_revision" })} />
        <Kpi label="Prospects à approuver" value={String(c.fresh.length)} tone="text-[#8a4b00]" note={c.fresh.length > 1 ? "nouveaux" : c.fresh.length ? "nouveau" : "aucun en attente"} onClick={() => showLeads("nouveau")} />
        <Kpi label="Reçus à vérifier" value={store.receiptsOk ? String(c.receipts.length) : "?"} tone="text-[#0d6474]" note={!store.receiptsOk ? "lecture impossible" : c.receipts.length ? "décision à prendre" : "aucun en attente"} onClick={() => showReceipts()} />
        <Kpi label="Payé ce mois-ci" value={money.format(c.paidCents / 100)} tone="text-[#1e5b2e]" note={plural(c.paid.length, "facture payée", "factures payées")} onClick={() => go("facturation")} />
      </ul>

      <div className="order-3 grid gap-4 lg:order-none lg:grid-cols-3 [&>*]:min-w-0">
        <StageChart store={store} />
        <Box title="Prospects à approuver">
          {c.fresh.length === 0 ? <p className="text-sm text-muted">Aucun nouveau prospect.</p> : (
            <ul className="divide-y divide-line">
              {c.fresh.map((l) => (
                <li key={l.id} className="flex items-center gap-2 py-2.5 first:pt-0">
                  <button type="button" onClick={() => openLead(l.id)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:bg-sky-50">
                    <Avatar name={l.name} className="h-9 w-9 text-xs" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{l.name}</span>
                      <span className="block truncate text-xs text-muted">{[l.audience === "entreprise" ? "Entreprise" : l.audience === "moi" ? "Particulier" : "", l.topic ?? ""].filter(Boolean).join(" · ") || fmtDate(l.created_at, "fr")}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => acceptLead(l)} aria-label={`Accepter ${l.name}`} className="btn-primary min-h-11 shrink-0 px-4 py-2 text-sm">Accepter</button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-line pt-3 text-xs text-muted">Rien n'est confirmé sans le cabinet. <button type="button" onClick={() => showLeads("ouverts")} className={link}>Voir tous les prospects</button></p>
        </Box>
      </div>

      <div className="order-4 grid gap-4 lg:order-none lg:grid-cols-2 [&>*]:min-w-0">
        <Box title="À faire aujourd'hui">
          {mine.length === 0 ? <p className="text-sm text-muted">Aucune tâche ouverte à votre nom.</p> : (
            <ul className="divide-y divide-line">
              {mine.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <input type="checkbox" aria-label={`Terminer : ${t.label}`} checked={false} onChange={() => completeTask(t)} className="h-5 w-5 shrink-0 accent-navy" />
                  <button type="button" onClick={() => openDossier(t.dossier_id)} className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg py-1.5 text-left hover:bg-sky-50">
                    <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{t.label}</span><span className="block truncate text-xs text-muted">{name(t.dossier_id)}</span></span>
                    {t.due_date && <span className={`shrink-0 text-xs ${daysUntil(t.due_date) < 0 ? "font-semibold text-[#a3261f]" : "text-muted"}`}>{dueInfo(t.due_date).text}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Box>
        <section className="hidden rounded-2xl border border-[#dcd6fb] bg-[#f5f3ff] p-4 sm:p-5 lg:block">
          <div className="mb-3 flex items-center gap-2">
            <span className="pf-clara flex h-7 w-7 items-center justify-center rounded-full" aria-hidden="true"><Icon name="spark" className="h-4 w-4" /></span>
            <Eyebrow className="!text-[#4a3fa8]">Résumé du jour</Eyebrow>
          </div>
          <p className="leading-relaxed text-ink">{sentence}</p>
          <p className="mt-3 text-xs text-ink/80">Phrase composée à partir des décomptes réels du cabinet, sans IA.</p>
        </section>
      </div>

      <div className="order-5 lg:order-none"><Workload store={store} showDossiers={showDossiers} /></div>

      <div className="order-2 lg:order-none"><PriorityList items={priorities} more={() => showDossiers({})} /></div>
    </div>
  );
}
