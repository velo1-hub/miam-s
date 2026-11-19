"use client";
import { useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { KINDS, STATUSES, STEPS5, fmtDate, save, statusLabel, step5, type Dossier } from "../shared";
import { DEFAULT_REQUESTS, Drawer, NO_FILTER, SOON_DAYS, chip, dueInfo, empty, isLate, isSoon, latePill, link, panel, smallBtn, warnPill, type DFilter, type DossierUi, type Focus, type Invoice, type Lead, type PatchDossier, type Store } from "./common";
import { DossierDetail } from "./detail";
/* ───────────── Dossiers ───────────── */
export function NewDossier({ draft, onCreate }: { draft: Lead | null; onCreate: (row: Record<string, unknown>) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("client_email")).trim().toLowerCase();
    // Une faute de frappe donnerait accès au dossier à la mauvaise personne : on fait relire le courriel.
    if (!window.confirm(`Ce courriel donnera accès au dossier :\n\n${email}\n\nConfirmer ?`)) return;
    setBusy(true);
    await onCreate({ client_name: String(f.get("client_name")).trim(), client_email: email, title: String(f.get("title")).trim(), kind: String(f.get("kind")), tax_year: f.get("tax_year") ? Number(f.get("tax_year")) : null, lead_id: draft?.id ?? null });
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className={`${panel} space-y-4`}>
      <h2 className="font-display text-2xl font-bold tracking-tight text-navy">{draft ? `Accepter ${draft.name} : nouveau dossier` : "Nouveau dossier"}</h2>
      {draft && <p className="-mt-2 text-sm text-muted">Le prospect devient client à la création du dossier. Vérifiez son courriel : il donne accès à l'espace client.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="c-name" className="label">Nom du client</label><input id="c-name" name="client_name" required maxLength={160} defaultValue={draft?.name ?? ""} className="field" /></div>
        <div><label htmlFor="c-email" className="label">Courriel du client</label><input id="c-email" name="client_email" type="email" required maxLength={200} defaultValue={draft?.email ?? ""} aria-describedby="c-email-h" autoCapitalize="none" className="field" /><p id="c-email-h" className="mt-1.5 text-xs text-muted">Le client se connecte à son espace avec ce courriel. Vérifiez-le bien.</p></div>
      </div>
      <div><label htmlFor="c-title" className="label">Titre du dossier</label><input id="c-title" name="title" required maxLength={160} defaultValue={draft?.topic ?? ""} placeholder="Ex. Déclarations de revenus 2026" className="field" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="c-kind" className="label">Type de mandat</label><select id="c-kind" name="kind" aria-describedby="c-kind-h" className="field">{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v.fr}</option>)}</select><p id="c-kind-h" className="mt-1.5 text-xs text-muted">La liste des documents à demander est préremplie selon le type.</p></div>
        <div><label htmlFor="c-year" className="label">Année visée (facultatif)</label><input id="c-year" name="tax_year" type="number" min={2000} max={2100} className="field" /></div>
      </div>
      <button type="submit" disabled={busy} className="btn-primary">{busy ? "Création…" : "Créer le dossier"}</button>
    </form>
  );
}

export function DossierFlags({ d, waiting }: { d: Dossier; waiting: boolean }) {
  return (
    <>
      {waiting && <span className={warnPill}>Message à lire</span>}
      {isLate(d) && <span className={latePill}>{dueInfo(d.due_date!).text}</span>}
    </>
  );
}

export function StageBoard({ shown, waiting, hidesClosed, onOpen, onMove }: { shown: Dossier[]; waiting: Set<string>; hidesClosed: boolean; onOpen: (id: string) => void; onMove: (id: string, status: string) => void }) {
  const [over, setOver] = useState<string | null>(null);
  return (
    <div>
      <p className="mb-3 text-sm text-muted">Glissez un dossier d'une colonne à l'autre, ou changez son étape dans le menu de la carte. Le client voit la nouvelle étape dans son espace.</p>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {STATUSES.map((st, i) => {
          const col = shown.filter((x) => x.status === st);
          return (
            <section key={st} aria-label={statusLabel[st].fr} className={`w-64 shrink-0 rounded-2xl border border-[#e6e8f2] bg-[#eceef6] p-2.5 transition-shadow motion-reduce:transition-none ${over === st ? "ring-4 ring-navy" : ""}`}
              onDragOver={(e) => { e.preventDefault(); if (over !== st) setOver(st); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null); }}
              onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) onMove(id, st); }}>
              <h2 className="flex items-center justify-between px-1.5 pb-2 font-display text-sm font-semibold text-navy"><span>{i + 1}. {statusLabel[st].fr}</span><span className="text-ink/80">{col.length}</span></h2>
              <p className="px-1.5 pb-2 text-xs text-ink/80">Client : {STEPS5[step5(st)].fr}</p>
              {over === st && <p className="mb-2 rounded-lg bg-navy px-2 py-1.5 text-center text-xs font-semibold text-white">Déposer ici</p>}
              <ul className="min-h-16 space-y-2">
                {col.map((x) => (
                  <li key={x.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", x.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setOver(null)} className="cursor-grab rounded-xl border border-line bg-white p-3 active:cursor-grabbing">
                    <button type="button" data-card={x.id} onClick={() => onOpen(x.id)} className="block w-full rounded-lg text-left hover:underline">
                      <span className="block font-display font-semibold text-ink">{x.client_name}</span>
                      <span className="block text-sm text-ink/80">{x.title}</span>
                    </button>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <span>{x.assignee || "Non attribué"}</span>
                      {x.due_date && !isLate(x) && <span>· {fmtDate(x.due_date, "fr")}</span>}
                      <DossierFlags d={x} waiting={waiting.has(x.id)} />
                    </span>
                    <label className="sr-only" htmlFor={`mv-${x.id}`}>Étape du dossier de {x.client_name}</label>
                    <select id={`mv-${x.id}`} value={x.status} onChange={(e) => onMove(x.id, e.target.value)} className="field mt-2 min-h-11 py-1.5 text-sm">
                      {STATUSES.map((s2, j) => <option key={s2} value={s2}>{j + 1}. {statusLabel[s2].fr}</option>)}
                    </select>
                  </li>
                ))}
                {st === "ferme" && hidesClosed && <li className="px-1.5 text-xs text-ink/80">Les dossiers fermés sont masqués. Choisissez « Fermés » ou « Tous » pour les voir.</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function Dossiers({ store, ui, setUi, staffName, draft, clearDraft, patch, move, onCreated, onTouch, focus, onFocused, onInvoices }: {
  onFocused: () => void; onInvoices: (dossierId: string, list: Invoice[]) => void; focus: { what: Focus; n: number } | null; store: Store; ui: DossierUi; setUi: (f: (u: DossierUi) => DossierUi) => void; staffName: string; draft: Lead | null; clearDraft: () => void;
  patch: PatchDossier; move: (id: string, status: string) => void; onCreated: (d: Dossier, lead: Lead | null) => void; onTouch: () => void;
}) {
  const { filter: f, view, current, creating } = ui;
  const waiting = useMemo(() => new Set(store.waiting), [store.waiting]);
  const setFilter = (p: Partial<DFilter>) => setUi((u) => ({ ...u, filter: { ...u.filter, ...p } }));
  const owners = useMemo(() => [...new Set([...store.team, ...store.dossiers.map((d) => d.assignee ?? "")].filter(Boolean))], [store.team, store.dossiers]);

  const shown = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const rank = (d: Dossier) => (d.status === "ferme" ? 4 : waiting.has(d.id) ? 0 : isLate(d) ? 1 : isSoon(d) ? 2 : 3);
    return store.dossiers
      .filter((d) => (f.scope === "tous" ? true : f.scope === "fermes" ? d.status === "ferme" : d.status !== "ferme"))
      .filter((d) => !f.stage || d.status === f.stage)
      .filter((d) => !f.owner || (f.owner === "__aucun" ? !d.assignee : d.assignee === f.owner))
      .filter((d) => (f.signal === "retard" ? isLate(d) : f.signal === "bientot" ? isSoon(d) : f.signal === "messages" ? waiting.has(d.id) : true))
      .filter((d) => !n || `${d.client_name} ${d.client_email} ${d.title}`.toLowerCase().includes(n))
      .sort((a, b) => rank(a) - rank(b) || (rank(a) === 1 || rank(a) === 2 ? a.due_date!.localeCompare(b.due_date!) : 0) || b.updated_at.localeCompare(a.updated_at));
  }, [store.dossiers, f, waiting]);

  const d = store.dossiers.find((x) => x.id === current);
  const filtered = JSON.stringify(f) !== JSON.stringify(NO_FILTER);
  const detailOpen = view === "liste" && (creating || !!d);
  const closeDetail = () => { setUi((u) => ({ ...u, current: null, creating: false })); clearDraft(); };

  const create = async (row: Record<string, unknown>) => {
    let created: Dossier | null = null;
    const ok = await save(supabase().from("dossiers").insert(row).select().single().then((r) => { created = r.data as Dossier | null; return r; }), { ok: "Dossier créé." });
    const made = created as Dossier | null;
    if (!ok || !made) return false;
    const reqs = DEFAULT_REQUESTS[String(row.kind)] ?? [];
    if (reqs.length) await save(supabase().from("document_requests").insert(reqs.map((label) => ({ dossier_id: made.id, label }))));
    onCreated(made, draft);
    return true;
  };
  const detail = (x: Dossier, railTop: string) => <DossierDetail key={x.id} d={x} staffName={staffName} team={store.team} railTop={railTop} focus={focus} onFocused={onFocused} onInvoices={onInvoices} onPatch={(p, o) => patch(x.id, p, o)} onMove={(s) => move(x.id, s)} onTouch={onTouch} />;

  return (
    <div>
      <div className={`mb-5 rounded-2xl border border-[#e6e8f2] bg-white p-3 ${detailOpen ? "hidden min-[1400px]:block" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Affichage" className="flex gap-1">
            {([["liste", "Liste"], ["tableau", "Tableau par étape"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setUi((u) => ({ ...u, view: k, creating: false, current: k === "tableau" ? null : u.current }))} aria-pressed={view === k} className={chip}>{l}</button>
            ))}
          </div>
          <div role="group" aria-label="Dossiers affichés" className="flex gap-1 sm:ml-3">
            {([["a_faire", "À faire"], ["fermes", "Fermés"], ["tous", "Tous"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setFilter({ scope: k })} aria-pressed={f.scope === k} className={chip}>{l}</button>
            ))}
          </div>
          <button type="button" onClick={() => setUi((u) => ({ ...u, view: "liste", creating: true, current: null }))} className="btn-primary ml-auto min-h-11 px-5 py-2 text-sm">Nouveau dossier</button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div><label htmlFor="d-q" className="sr-only">Chercher un dossier</label><input id="d-q" type="search" value={f.q} onChange={(e) => setFilter({ q: e.target.value })} placeholder="Chercher un client, un dossier" className="field min-h-11 py-2 text-sm" /></div>
          <div><label htmlFor="f-stage" className="sr-only">Filtrer par étape</label><select id="f-stage" value={f.stage} onChange={(e) => setFilter({ stage: e.target.value })} className="field min-h-11 py-2 text-sm"><option value="">Toutes les étapes</option>{STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s].fr}</option>)}</select></div>
          <div><label htmlFor="f-owner" className="sr-only">Filtrer par responsable</label><select id="f-owner" value={f.owner} onChange={(e) => setFilter({ owner: e.target.value })} className="field min-h-11 py-2 text-sm"><option value="">Tous les responsables</option>{owners.includes(staffName) && <option value={staffName}>Mes dossiers</option>}{owners.filter((n) => n !== staffName).map((n) => <option key={n} value={n}>{n}</option>)}<option value="__aucun">Non attribué</option></select></div>
          <div><label htmlFor="f-signal" className="sr-only">Filtrer par urgence</label><select id="f-signal" value={f.signal} onChange={(e) => setFilter({ signal: e.target.value as DFilter["signal"] })} className="field min-h-11 py-2 text-sm"><option value="">Toutes les urgences</option><option value="messages">Message à lire</option><option value="retard">En retard</option><option value="bientot">Échéance d'ici {SOON_DAYS} jours</option></select></div>
          {filtered && <button type="button" onClick={() => setFilter(NO_FILTER)} className={`${link} min-h-11 px-2 text-sm`}>Réinitialiser</button>}
        </div>
        <p role="status" aria-live="polite" className="mt-2 px-1 text-xs text-ink/80">{shown.length} dossier{shown.length > 1 ? "s" : ""} affiché{shown.length > 1 ? "s" : ""}, les plus urgents d'abord.</p>
      </div>

      {view === "tableau" ? (
        <>
          <StageBoard shown={shown} waiting={waiting} hidesClosed={f.scope === "a_faire"} onOpen={(id) => setUi((u) => ({ ...u, current: id }))} onMove={move} />
          {d && <Drawer label={`Dossier de ${d.client_name}`} returnTo={`[data-card="${d.id}"]`} onClose={() => setUi((u) => ({ ...u, current: null }))}>{detail(d, "@[50rem]:top-20")}</Drawer>}
        </>
      ) : (
        <div className="grid gap-6 min-[1400px]:grid-cols-[17rem_minmax(0,1fr)] min-[1400px]:items-start">
          <ul aria-label="Dossiers" className={`space-y-2 ${detailOpen ? "hidden min-[1400px]:block" : ""}`}>
            {shown.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => setUi((u) => ({ ...u, current: x.id, creating: false }))} aria-current={x.id === current ? "true" : undefined} className="w-full rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-sky-50 aria-[current=true]:shadow-[inset_4px_0_0_var(--color-navy)]">
                  <span className="block font-display font-semibold text-ink">{x.client_name}</span>
                  <span className="block text-sm text-ink/80">{x.title}</span>
                  <span className="mt-1 block text-xs text-muted">{statusLabel[x.status]?.fr ?? x.status}{x.due_date && !isLate(x) ? ` · ${dueInfo(x.due_date).text.toLowerCase()}` : ""}{x.assignee ? ` · ${x.assignee}` : ""}</span>
                  {(waiting.has(x.id) || isLate(x)) && <span className="mt-2 flex flex-wrap gap-1.5"><DossierFlags d={x} waiting={waiting.has(x.id)} /></span>}
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">{filtered ? "Aucun dossier ne correspond à ces filtres." : "Aucun dossier en cours. Créez-en un avec « Nouveau dossier »."}</li>}
          </ul>
          <div className={`min-w-0 ${detailOpen ? "" : "hidden min-[1400px]:block"}`}>
            {detailOpen && <button type="button" onClick={closeDetail} className={`${smallBtn} mb-4 min-[1400px]:hidden`}>← Dossiers</button>}
            {creating ? <NewDossier key={draft?.id ?? "nouveau"} draft={draft} onCreate={create} /> : d ? detail(d, "@[50rem]:top-24") : <p className={empty}>Choisissez un dossier dans la liste, ou créez-en un.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
