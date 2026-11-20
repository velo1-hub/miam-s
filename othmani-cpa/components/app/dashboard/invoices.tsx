"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { real, supabase } from "@/lib/supabase";
import { demoRole } from "@/lib/demo";
import { Card, fmtDate, save, toast, type Dossier } from "../shared";
import { INVOICE_STATUS, Loadable, PAY_OFF, SavedAt, box, chip, dayFmt, empty, link, money, newId, panel, rows, smallBtn, todayISO, useLoad, type Invoice, type OpenDossier, type PatchOpts } from "./common";

/** Factures payées pendant le mois courant (heure de Montréal). */
export const paidThisMonth = (list: Invoice[]) => { const month = todayISO().slice(0, 7); return list.filter((x) => x.status === "payee" && x.paid_at && dayFmt.format(new Date(x.paid_at)).slice(0, 7) === month); };
export const sumCents = (l: Invoice[]) => l.reduce((n, x) => n + x.amount_cents, 0);
/* ───────────── Honoraires ───────────── */
export function useInvoiceActions(set: (u: SetStateAction<Invoice[] | null>) => void) {
  const apply = useCallback((id: string, p: Partial<Invoice>) => set((l) => l?.map((x) => (x.id === id ? { ...x, ...p } : x)) ?? null), [set]);
  const patch = useCallback((inv: Invoice, p: Partial<Invoice>, o: PatchOpts = {}) => {
    const back = Object.fromEntries(Object.keys(p).map((k) => [k, inv[k as keyof Invoice]])) as Partial<Invoice>;
    apply(inv.id, p);
    return save(supabase().from("invoices").update(p).eq("id", inv.id), { ...o, rollback: () => apply(inv.id, back) });
  }, [apply]);
  const setStatus = useCallback((inv: Invoice, status: string) => {
    const prev = { status: inv.status, paid_at: inv.paid_at };
    patch(inv, { status, paid_at: status === "payee" ? new Date().toISOString() : null }, { ok: `${inv.label} → ${INVOICE_STATUS[status] ?? status}`, undo: () => { patch({ ...inv, status }, prev, { ok: "Statut rétabli." }); } });
  }, [patch]);
  const setLink = useCallback(async (inv: Invoice, raw: string) => {
    const v = raw.trim();
    if (v === (inv.pay_url ?? "")) return false;
    if (v && !/^https:\/\/\S+$/.test(v)) { toast("Le lien doit commencer par https://", "error"); return false; }
    return patch(inv, { pay_url: v || null });
  }, [patch]);
  /** Demande un lien de paiement au serveur. Rien n'est envoyé au client automatiquement. */
  const createLink = useCallback(async (inv: Invoice) => {
    if (demoRole()) { toast(PAY_OFF, "error"); return; }
    try {
      const { data } = await real().auth.getSession();
      const res = await fetch("/api/pay/", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ invoice_id: inv.id }) });
      const json = res.ok ? ((await res.json()) as { url?: unknown }) : null;
      if (typeof json?.url !== "string" || !json.url.startsWith("https://")) throw new Error("indisponible");
      await patch(inv, { pay_url: json.url }, { ok: "Lien de paiement créé." });
    } catch { toast(PAY_OFF, "error"); }
  }, [patch]);
  return { setStatus, setLink, createLink };
}

export function InvoiceItem({ inv, context, actions }: { inv: Invoice; context?: ReactNode; actions: ReturnType<typeof useInvoiceActions> }) {
  const [saved, setSaved] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{inv.label}</p>
          <p className="text-sm text-muted">{context}{context ? " · " : ""}{fmtDate(inv.created_at, "fr")}{inv.paid_at ? ` · payée le ${fmtDate(inv.paid_at, "fr")}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold text-navy">{money.format(inv.amount_cents / 100)}</span>
          <label className="sr-only" htmlFor={`is-${inv.id}`}>Statut de la facture {inv.label}</label>
          <select id={`is-${inv.id}`} value={inv.status} onChange={(e) => actions.setStatus(inv, e.target.value)} className="field min-h-11 w-auto py-1.5 text-sm">
            {Object.entries(INVOICE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor={`ip-${inv.id}`} className="label">Lien de paiement (facultatif)</label>
          <input id={`ip-${inv.id}`} key={inv.pay_url ?? ""} type="url" inputMode="url" defaultValue={inv.pay_url ?? ""} maxLength={600} placeholder="https://" className="field min-h-11 py-2 text-sm" onBlur={async (e) => { if (await actions.setLink(inv, e.target.value)) setSaved(new Date()); }} />
        </div>
        {inv.pay_url && <a href={inv.pay_url} target="_blank" rel="noopener noreferrer" className={smallBtn}>Ouvrir le lien</a>}
        {!inv.pay_url && inv.status === "a_payer" && (
          <button type="button" disabled={busy} onClick={async () => { setBusy(true); await actions.createLink(inv); setBusy(false); }} className={smallBtn}>{busy ? "Création…" : "Créer un lien de paiement"}</button>
        )}
      </div>
      <SavedAt at={saved} />
    </li>
  );
}

/** `onList` reçoit la liste à chaque changement : le tableau de bord garde ainsi ses totaux à jour. */
export function DossierInvoices({ dossierId, title = "Honoraires", onList }: { dossierId: string; title?: string; onList?: (dossierId: string, list: Invoice[]) => void }) {
  const load = useLoad(() => rows<Invoice>(supabase().from("invoices").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false })), dossierId);
  const actions = useInvoiceActions(load.set);
  const sync = useRef(onList);
  sync.current = onList;
  useEffect(() => { if (load.data) sync.current?.(dossierId, load.data); }, [load.data, dossierId]);
  const [err, setErr] = useState("");
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const label = String(f.get("label") ?? "").trim();
    const cents = Math.round(Number(String(f.get("amount") ?? "").replace(/\s|\$/g, "").replace(",", ".")) * 100);
    if (!label) { setErr("Indiquez une description."); return; }
    if (!Number.isFinite(cents) || cents < 1 || cents > 100000000) { setErr("Indiquez un montant en dollars, par exemple 287,44."); return; }
    setErr("");
    const row: Invoice = { id: newId(), dossier_id: dossierId, created_at: new Date().toISOString(), label: label.slice(0, 200), amount_cents: cents, status: String(f.get("status") ?? "a_payer"), pay_url: null, paid_at: null };
    load.set((l) => [row, ...(l ?? [])]);
    const { created_at: _local, ...payload } = row;
    void _local;
    if (await save(supabase().from("invoices").insert(payload), { ok: "Facture ajoutée.", rollback: () => load.set((l) => l?.filter((x) => x.id !== row.id) ?? null) })) form.reset();
  };
  return (
    <Card title={title}>
      <Loadable load={load} label="Chargement des honoraires" rows={1}>
        {(list) => (list.length === 0 ? <p className="text-sm text-muted">Aucune facture pour ce dossier.</p> : <ul className="divide-y divide-line">{list.map((inv) => <InvoiceItem key={inv.id} inv={inv} actions={actions} />)}</ul>)}
      </Loadable>
      <form onSubmit={add} className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_9rem]">
        <div><label htmlFor={`inv-label-${dossierId}`} className="label">Description</label><input id={`inv-label-${dossierId}`} name="label" maxLength={200} placeholder="Ex. Déclarations de revenus" className="field min-h-11 py-2" /></div>
        <div><label htmlFor={`inv-amount-${dossierId}`} className="label">Montant ($)</label><input id={`inv-amount-${dossierId}`} name="amount" inputMode="decimal" placeholder="287,44" className="field min-h-11 py-2" /></div>
        <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
          <div><label htmlFor={`inv-status-${dossierId}`} className="label">Statut</label><select id={`inv-status-${dossierId}`} name="status" defaultValue="a_payer" className="field min-h-11 w-auto py-2"><option value="brouillon">Brouillon (invisible pour le client)</option><option value="a_payer">À payer</option></select></div>
          <button type="submit" className={smallBtn}>Ajouter la facture</button>
        </div>
        <p role="alert" className={err ? "rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00] sm:col-span-2" : "sr-only"}>{err}</p>
      </form>
    </Card>
  );
}

export function Fees({ dossiers, invoices, setInvoices, openDossier }: { dossiers: Dossier[]; invoices: Invoice[]; setInvoices: (u: SetStateAction<Invoice[] | null>) => void; openDossier: OpenDossier }) {
  const actions = useInvoiceActions(setInvoices);
  const [filter, setFilter] = useState("toutes");
  const byId = useMemo(() => new Map(dossiers.map((d) => [d.id, d])), [dossiers]);
  return (
    ((list: Invoice[]) => {
        const sum = (l: Invoice[]) => money.format(sumCents(l) / 100);
        const due = list.filter((x) => x.status === "a_payer");
        const paid = paidThisMonth(list);
        const drafts = list.filter((x) => x.status === "brouillon");
        const shown = list.filter((x) => filter === "toutes" || x.status === filter);
        return (
          <div>
            <dl className="mb-6 grid gap-3 sm:grid-cols-3">
              {([["À payer", due], ["Payé ce mois-ci", paid], ["Brouillons", drafts]] as const).map(([l, v]) => (
                <div key={l} className={box}>
                  <dt className="text-sm font-medium text-ink/80">{l}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-navy">{sum(v)}</dd>
                  <dd className="text-xs text-ink/80">{v.length} facture{v.length > 1 ? "s" : ""}</dd>
                </div>
              ))}
            </dl>
            <div className="mb-4 flex flex-wrap gap-2">
              {[["toutes", "Toutes"], ...Object.entries(INVOICE_STATUS)].map(([k, l]) => (
                <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={chip}>{l} ({list.filter((x) => k === "toutes" || x.status === k).length})</button>
              ))}
            </div>
            {shown.length === 0 ? <p className={empty}>Aucune facture dans cette vue. Les factures s'ajoutent dans chaque dossier.</p> : (
              <ul className={`${panel} divide-y divide-line`}>
                {shown.map((inv) => {
                  const d = byId.get(inv.dossier_id);
                  return <InvoiceItem key={inv.id} inv={inv} actions={actions} context={d ? <button type="button" onClick={() => openDossier(d.id, "facture")} className={link}>{d.client_name}, {d.title}</button> : "Dossier introuvable"} />;
                })}
              </ul>
            )}
          </div>
        );
      })(invoices)
  );
}
