"use client";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Documents, KINDS, Messages, fmtDate, save, statusLabel, toast, type Dossier } from "../shared";
import { Box, Eyebrow, Icon, Loadable, askAi, box, chip, clientTags, empty, groupClients, initials, link, mailto, money, pill, rows, smallBtn, telto, useLoad, type Client, type Invoice, type Lead, type OpenDossier, type Req } from "./common";
import { ACT, actDetail, type Act } from "./detail";
import { DossierInvoices, sumCents } from "./invoices";

export const CLIENT_TABS = [["apercu", "Aperçu"], ["documents", "Documents"], ["messages", "Messages"], ["facturation", "Facturation"]] as const;
export type ClientTab = (typeof CLIENT_TABS)[number][0];
export type ClientUi = { email: string | null; tab: ClientTab };

const ACT_ICON: Record<string, "document" | "message" | "invoice" | "check" | "dossier"> = {
  document_depose: "document", document_supprime: "document", document_recu: "check", message: "message", facture_creee: "invoice", facture_statut: "invoice", signature: "check",
};
/** Dossier de travail par défaut : le plus récent encore ouvert, sinon le plus récent. */
const mainDossier = (c: Client) => c.dossiers.find((d) => d.status !== "ferme") ?? c.dossiers[0];

function DossierPicker({ id, label, dossiers, value, onChange }: { id: string; label: string; dossiers: Dossier[]; value: string; onChange: (id: string) => void }) {
  if (dossiers.length < 2) return null;
  return (
    <div className="mb-3">
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field min-h-11 py-2 text-sm">
        {dossiers.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
      </select>
    </div>
  );
}

/** Résumé d'un dossier du client par l'assistant : un brouillon à relire, jamais envoyé au client. */
function Summary({ c }: { c: Client }) {
  const [id, setId] = useState(mainDossier(c).id);
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const d = c.dossiers.find((x) => x.id === id) ?? mainDossier(c);
  return (
    <section className="rounded-2xl border border-[#dcd6fb] bg-[#f5f3ff] p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="pf-clara flex h-7 w-7 items-center justify-center rounded-full" aria-hidden="true"><Icon name="spark" className="h-4 w-4" /></span>
        <Eyebrow className="!text-[#4a3fa8]">Résumé</Eyebrow>
      </div>
      <DossierPicker id="cs-dossier" label="Dossier à résumer" dossiers={c.dossiers} value={d.id} onChange={(v) => { setId(v); setText(null); }} />
      {text && !busy ? (
        <>
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink">{text}</p>
          <button type="button" className={`${link} mt-2 text-sm`} onClick={async () => { try { await navigator.clipboard.writeText(text); toast("Texte copié."); } catch { toast("Copie impossible sur cet appareil.", "error"); } }}>Copier</button>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-ink">{busy ? "L'assistant rédige…" : `Demandez à l'assistant un résumé du dossier « ${d.title} » avant un appel.`}</p>
      )}
      <button type="button" disabled={busy} className={`${smallBtn} mt-3`} onClick={async () => { setBusy(true); setText(await askAi(d.id, "summary")); setBusy(false); }}>{text ? "Refaire le résumé" : "Résumer le dossier"}</button>
      <p className="mt-2 text-xs text-ink/80">Brouillon à relire. Les fichiers et les coordonnées du client ne sont jamais transmis à l'IA.</p>
    </section>
  );
}

/** Activité des dossiers du client, tirée du journal tenu par la base. Une requête par dossier (12 dossiers au plus). */
function Activity({ c }: { c: Client }) {
  const ids = c.dossiers.slice(0, 12).map((d) => d.id);
  const load = useLoad(async () => (await Promise.all(ids.map((id) => rows<Act & { dossier_id: string }>(supabase().from("activity").select("*").eq("dossier_id", id).order("created_at", { ascending: false }).limit(8))))).flat().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8), ids.join());
  const title = (id: string) => c.dossiers.find((d) => d.id === id)?.title ?? "";
  return (
    <Box title="Activité récente">
      <Loadable load={load} label="Chargement de l'activité" rows={1}>
        {(acts) => (acts.length === 0 ? <p className="text-sm text-muted">Aucune activité enregistrée pour ce client.</p> : (
          <ol className="divide-y divide-line">
            {acts.map((a) => (
              <li key={`${a.dossier_id}-${a.id}`} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-navy" aria-hidden="true"><Icon name={ACT_ICON[a.kind] ?? "dossier"} className="h-4 w-4" /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{ACT[a.kind] ?? a.kind}{a.detail ? <span className="font-normal"> : {actDetail(a)}</span> : null}</span>
                  <span className="block text-xs text-muted">{fmtDate(a.created_at, "fr", true)} · {a.actor_role === "client" ? "client" : a.actor}{c.dossiers.length > 1 ? ` · ${title(a.dossier_id)}` : ""}</span>
                </span>
              </li>
            ))}
          </ol>
        ))}
      </Loadable>
    </Box>
  );
}

/** Documents demandés pour les dossiers en cours du client ; cocher marque le document comme reçu. */
function YearDocs({ c }: { c: Client }) {
  const open = c.dossiers.filter((d) => d.status !== "ferme");
  const ids = (open.length ? open : c.dossiers).slice(0, 12).map((d) => d.id);
  const load = useLoad(async () => (await Promise.all(ids.map((id) => rows<Req>(supabase().from("document_requests").select("*").eq("dossier_id", id).order("created_at"))))).flat(), ids.join());
  const setReceived = (r: Req, received: boolean) => {
    const apply = (v: boolean) => load.set((l) => l?.map((x) => (x.id === r.id ? { ...x, received: v } : x)) ?? null);
    apply(received);
    save(supabase().from("document_requests").update({ received }).eq("id", r.id), { ok: received ? "Marqué reçu." : "Marqué non reçu.", rollback: () => apply(r.received) });
  };
  return (
    <Box title="Documents de l'année">
      <Loadable load={load} label="Chargement des documents demandés" rows={1}>
        {(reqs) => (reqs.length === 0 ? <p className="text-sm text-muted">Aucun document demandé pour les dossiers en cours.</p> : (
          <>
            <ul className="divide-y divide-line">
              {reqs.map((r) => (
                <li key={r.id}>
                  <label className="flex min-h-11 items-center gap-3 py-1.5 text-sm text-ink">
                    <input type="checkbox" checked={r.received} onChange={(e) => setReceived(r, e.target.checked)} className="h-5 w-5 shrink-0 accent-[#1c8a63]" />
                    <span>{r.label}{r.received ? <span className="sr-only"> (reçu)</span> : null}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">{reqs.filter((r) => r.received).length} reçu(s) sur {reqs.length}, pour les dossiers en cours.</p>
          </>
        ))}
      </Loadable>
    </Box>
  );
}

function Overview({ c, invoices }: { c: Client; invoices: Invoice[] }) {
  const billed = invoices.filter((x) => x.status === "a_payer" || x.status === "payee");
  const paid = invoices.filter((x) => x.status === "payee");
  const kinds = [...new Set(c.dossiers.map((d) => KINDS[d.kind]?.fr ?? d.kind))];
  const owners = [...new Set(c.dossiers.map((d) => d.assignee ?? "").filter(Boolean))];
  const fiche: [string, React.ReactNode][] = [
    ["Courriel", <a key="e" href={mailto(c.email)} className={`${link} break-all`}>{c.email}</a>],
    ...(c.lead?.phone ? [["Téléphone", <span key="t"><a href={telto(c.lead.phone)} className={link}>{c.lead.phone}</a> <span className="font-normal text-muted">(non vérifié)</span></span>] as [string, React.ReactNode]] : []),
    ["Services", kinds.join(", ")],
    ["Responsable", owners.join(", ") || "Non attribué"],
    ...(c.lead ? [["Provenance", ({ contact: "Formulaire du site", clara: "Clara", telephone: "Téléphone", autre: "Autre" } as Record<string, string>)[c.lead.source] ?? c.lead.source] as [string, React.ReactNode]] : []),
  ];
  return (
    <div className="grid gap-4 xl:grid-cols-3 xl:items-start">
      <div className="space-y-4">
        <Summary c={c} />
        <Box title="Fiche">
          <dl className="divide-y divide-line text-sm">
            {fiche.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0"><dt className="shrink-0 text-ink/80">{k}</dt><dd className="min-w-0 text-right font-semibold text-ink">{v}</dd></div>
            ))}
          </dl>
        </Box>
      </div>
      <Activity c={c} />
      <div className="space-y-4">
        <YearDocs c={c} />
        <Box title="Honoraires">
          <dl className="divide-y divide-dashed divide-line text-sm">
            <div className="flex items-baseline justify-between gap-4 py-2 first:pt-0"><dt className="text-ink/80">Facturé</dt><dd className="font-display text-base font-bold text-ink">{money.format(sumCents(billed) / 100)}</dd></div>
            <div className="flex items-baseline justify-between gap-4 py-2 last:pb-0"><dt className="text-ink/80">Payé</dt><dd className="font-display text-base font-bold text-[#1e5b2e]">{money.format(sumCents(paid) / 100)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-muted">{billed.length === 0 ? "Aucune facture envoyée à ce client." : `${billed.length} facture${billed.length > 1 ? "s" : ""}, hors brouillons et factures annulées.`}</p>
        </Box>
      </div>
    </div>
  );
}

function ClientRecord({ c, tab, setTab, invoices, staffName, openDossier, onBack, onInvoices, onSent }: {
  c: Client; tab: ClientTab; setTab: (t: ClientTab) => void; invoices: Invoice[]; staffName: string; openDossier: OpenDossier; onBack: () => void;
  onInvoices: (dossierId: string, list: Invoice[]) => void; onSent: (dossierId: string) => void;
}) {
  const main = mainDossier(c);
  const [thread, setThread] = useState(main.id);
  const threadId = c.dossiers.some((d) => d.id === thread) ? thread : main.id;
  const tags = clientTags(c);
  const active = c.dossiers.filter((d) => d.status !== "ferme").length;
  const act = "btn-secondary min-h-11 gap-2 px-4 py-2 text-sm";
  return (
    <div>
      <button type="button" onClick={onBack} className={`${link} mb-4 inline-flex min-h-11 items-center text-sm`}>← Tous les clients</button>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden="true" className="pf-navy flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-bold">{initials(c.name)}</span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{c.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5">
              {tags.map((t) => <span key={t} className={`${pill} bg-[#e9e8f7] text-navy`}>{t}</span>)}
              <span className={`${pill} bg-sky-100 text-navy`}>{active} dossier{active > 1 ? "s" : ""} en cours</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTab("messages")} className={act}><Icon name="message" className="h-4 w-4" />Message</button>
          <button type="button" onClick={() => openDossier(main.id, "rdv")} className={act}><Icon name="calendar" className="h-4 w-4" />Rendez-vous</button>
          <button type="button" onClick={() => setTab("facturation")} className="btn-primary min-h-11 gap-2 px-4 py-2 text-sm"><Icon name="invoice" className="h-4 w-4" />Facturer</button>
        </div>
      </header>

      <div role="tablist" aria-label={`Fiche de ${c.name}`} className="mt-5 mb-5 flex gap-1 overflow-x-auto border-b border-line pb-2">
        {CLIENT_TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" id={`ct-${k}`} aria-selected={tab === k} aria-controls="ct-panel" onClick={() => setTab(k)} className="min-h-11 shrink-0 rounded-xl border border-transparent px-4 text-sm font-medium text-ink/80 hover:text-ink aria-selected:border-[#e6e8f2] aria-selected:bg-white aria-selected:font-semibold aria-selected:text-ink">{l}</button>
        ))}
      </div>

      <div role="tabpanel" id="ct-panel" aria-labelledby={`ct-${tab}`}>
        {tab === "apercu" ? (
          <>
            <Overview c={c} invoices={invoices} />
            <Box title="Dossiers" className="mt-4">
              <ul className="divide-y divide-line">
                {c.dossiers.map((d) => (
                  <li key={d.id}>
                    <button type="button" onClick={() => openDossier(d.id)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left text-sm hover:bg-sky-50">
                      <span className="min-w-0"><span className="block truncate font-semibold text-navy underline underline-offset-4">{d.title}</span><span className="block text-xs text-muted">{KINDS[d.kind]?.fr ?? d.kind}{d.due_date ? ` · échéance ${fmtDate(d.due_date, "fr")}` : ""}</span></span>
                      <span className={`${pill} shrink-0 bg-[#eef0f6] text-ink`}>{statusLabel[d.status]?.fr ?? d.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Box>
          </>
        ) : tab === "documents" ? (
          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            {c.dossiers.map((d) => (
              <div key={d.id}>
                <p className="mb-2 text-sm font-semibold text-ink">{d.title} <button type="button" onClick={() => openDossier(d.id, "documents")} className={`${link} ml-2 font-medium`}>Ouvrir le dossier</button></p>
                <Documents dossierId={d.id} role="cabinet" lang="fr" />
              </div>
            ))}
          </div>
        ) : tab === "messages" ? (
          <div className="max-w-3xl">
            <DossierPicker id="cm-dossier" label="Conversation du dossier" dossiers={c.dossiers} value={threadId} onChange={setThread} />
            <Messages key={threadId} dossierId={threadId} role="cabinet" lang="fr" authorName={staffName} onSent={() => onSent(threadId)} aiDraft={() => askAi(threadId, "reply")} />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            {c.dossiers.map((d) => <DossierInvoices key={d.id} dossierId={d.id} title={c.dossiers.length > 1 ? `Honoraires : ${d.title}` : "Honoraires"} onList={onInvoices} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/** Clients : la liste, puis la fiche complète d'un client (aperçu, documents, messages, facturation). */
export function Clients({ dossiers, leads, invoices, ui, setUi, staffName, onShow, openDossier, onInvoices, onSent }: {
  dossiers: Dossier[]; leads: Lead[]; invoices: Invoice[]; ui: ClientUi; setUi: (u: ClientUi) => void; staffName: string; onShow: (email: string) => void; openDossier: OpenDossier;
  onInvoices: (dossierId: string, list: Invoice[]) => void; onSent: (dossierId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const list = useMemo(() => groupClients(dossiers, leads), [dossiers, leads]);
  const current = list.find((r) => r.email === ui.email);
  if (current) {
    const ids = new Set(current.dossiers.map((d) => d.id));
    return <ClientRecord key={current.email} c={current} tab={ui.tab} setTab={(tab) => setUi({ ...ui, tab })} invoices={invoices.filter((x) => ids.has(x.dossier_id))} staffName={staffName} openDossier={openDossier} onBack={() => setUi({ email: null, tab: "apercu" })} onInvoices={onInvoices} onSent={onSent} />;
  }
  const n = q.trim().toLowerCase();
  const shown = list.filter((r) => (!n || `${r.name} ${r.email}`.toLowerCase().includes(n)) && (!tag || clientTags(r).includes(tag)));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 basis-64 sm:max-w-md">
          <label htmlFor="cl-q" className="sr-only">Chercher un client</label>
          <input id="cl-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un client" className="field min-h-11 py-2" />
        </div>
        <div role="group" aria-label="Type de client" className="flex gap-1">
          {([["", "Tous"], ["Particulier", "Particuliers"], ["Entreprise", "Entreprises"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={tag === k} onClick={() => setTag(k)} className={chip}>{l}</button>)}
        </div>
      </div>
      {shown.length === 0 ? <p className={empty}>{n || tag ? "Aucun client ne correspond à cette recherche." : "Aucun client. Un client apparaît ici dès qu'un dossier est ouvert à son nom."}</p> : (
        <ul className="grid gap-4 md:grid-cols-2">
          {shown.map((r) => {
            const active = r.dossiers.filter((d) => d.status !== "ferme").length;
            const closed = r.dossiers.length - active;
            return (
              <li key={r.email} className={box}>
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="pf-navy flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold">{initials(r.name)}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold text-ink"><button type="button" data-client={r.email} onClick={() => setUi({ email: r.email, tab: "apercu" })} className="rounded text-left underline-offset-4 hover:underline">{r.name}</button></h2>
                    <p className="mt-0.5 text-sm"><a href={mailto(r.email)} className={`${link} break-all`}>{r.email}</a></p>
                  </div>
                  <span className="flex shrink-0 flex-wrap justify-end gap-1">{clientTags(r).map((t) => <span key={t} className={`${pill} bg-[#e9e8f7] text-navy`}>{t}</span>)}</span>
                </div>
                {r.lead?.phone && <p className="mt-2 text-sm text-muted"><a href={telto(r.lead.phone)} className={link}>{r.lead.phone}</a> · non vérifié (demande du {fmtDate(r.lead.created_at, "fr")})</p>}
                <p className="mt-3 text-sm text-muted">{active} dossier{active > 1 ? "s" : ""} en cours · {closed} fermé{closed > 1 ? "s" : ""} · dernière activité {fmtDate(r.dossiers[0].updated_at, "fr")}</p>
                <ul className="mt-3 space-y-1">
                  {r.dossiers.slice(0, 4).map((d) => (
                    <li key={d.id}>
                      <button type="button" onClick={() => openDossier(d.id)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-sm hover:bg-sky-50">
                        <span className="truncate font-medium text-navy underline underline-offset-4">{d.title}</span>
                        <span className={`${pill} shrink-0 bg-[#eef0f6] text-ink`}>{statusLabel[d.status]?.fr ?? d.status}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setUi({ email: r.email, tab: "apercu" })} className={smallBtn}>Ouvrir la fiche</button>
                  {r.dossiers.length > 4 && <button type="button" onClick={() => onShow(r.email)} className={smallBtn}>Voir ses {r.dossiers.length} dossiers</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
