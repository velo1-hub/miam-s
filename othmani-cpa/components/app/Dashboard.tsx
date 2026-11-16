"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { AppFrame, Card, Documents, Messages, KINDS, STATUSES, fmtDate, statusLabel, type DocRequest, type Dossier } from "./shared";

type Lead = {
  id: string; created_at: string; source: string; lang: string; name: string; email: string | null; phone: string | null;
  audience: string | null; topic: string | null; message: string; status: string; notes: string;
};
type Note = { id: string; created_at: string; author: string; body: string };
type Sub = { id: string; email: string; lang: string; consent_at: string; unsubscribed_at: string | null };

const LEAD_STATUS: Record<string, string> = { nouveau: "Nouveau", contacte: "Contacté", rdv_a_confirmer: "Rendez-vous à confirmer", client: "Devenu client", ferme: "Fermé" };
const SOURCE: Record<string, string> = { contact: "Formulaire", clara: "Clara", telephone: "Téléphone", autre: "Autre" };
const pill = "rounded-full px-2.5 py-1 text-xs font-semibold";

function Leads({ onCreateDossier }: { onCreateDossier: (l: Lead) => void }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState("ouverts");
  const load = useCallback(async () => {
    const { data } = await supabase().from("leads").select("*").order("created_at", { ascending: false }).limit(300);
    setLeads((data as Lead[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const patch = async (id: string, p: Partial<Lead>) => {
    setLeads((l) => l?.map((x) => (x.id === id ? { ...x, ...p } : x)) ?? null);
    await supabase().from("leads").update(p).eq("id", id);
  };
  const shown = (leads ?? []).filter((l) => (filter === "tous" ? true : filter === "ouverts" ? !["client", "ferme"].includes(l.status) : l.status === filter));
  if (!leads) return <p className="text-muted" role="status">…</p>;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[["ouverts", "À traiter"], ["nouveau", "Nouveaux"], ["rdv_a_confirmer", "RDV à confirmer"], ["client", "Clients"], ["tous", "Tous"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white">
            {l} <span className="opacity-70">({leads.filter((x) => (k === "tous" ? true : k === "ouverts" ? !["client", "ferme"].includes(x.status) : x.status === k)).length})</span>
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto text-sm font-medium text-navy underline underline-offset-4">Actualiser</button>
      </div>
      {shown.length === 0 ? <p className="rounded-3xl border border-line bg-white p-6 text-muted">Aucune demande ici.</p> : (
        <ul className="space-y-4">
          {shown.map((l) => (
            <li key={l.id} className="rounded-3xl border border-line bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{l.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{fmtDate(l.created_at, "fr", true)} · {l.audience === "entreprise" ? "Entreprise" : l.audience === "moi" ? "Particulier" : "—"} · {l.lang.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${pill} ${l.source === "clara" ? "bg-sky-50 text-navy" : "bg-[#eef0f6] text-ink"}`}>{SOURCE[l.source] ?? l.source}</span>
                  <label className="sr-only" htmlFor={`st-${l.id}`}>Statut</label>
                  <select id={`st-${l.id}`} value={l.status} onChange={(e) => patch(l.id, { status: e.target.value })} className="field min-h-10 w-auto py-1.5 text-sm">
                    {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {l.email && <a href={`mailto:${l.email}`} className="font-semibold text-navy underline underline-offset-4">{l.email}</a>}
                {l.phone && <a href={`tel:${l.phone}`} className="font-semibold text-navy underline underline-offset-4">{l.phone}</a>}
              </p>
              {l.topic && <p className="mt-3 text-sm font-semibold text-ink">{l.topic}</p>}
              {l.message && <p className="mt-1 leading-relaxed whitespace-pre-line text-ink">{l.message}</p>}
              <label htmlFor={`n-${l.id}`} className="label mt-4">Notes internes</label>
              <textarea id={`n-${l.id}`} defaultValue={l.notes} rows={2} className="field resize-y" onBlur={(e) => e.target.value !== l.notes && patch(l.id, { notes: e.target.value })} />
              {l.email && <button type="button" onClick={() => onCreateDossier(l)} className="btn-secondary mt-3 min-h-10 px-4 py-2 text-sm">Ouvrir un dossier pour ce client</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DossierDetail({ d, staffName, onChange }: { d: Dossier; staffName: string; onChange: (p: Partial<Dossier>) => void }) {
  const [reqs, setReqs] = useState<DocRequest[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const load = useCallback(async () => {
    const [r, n] = await Promise.all([
      supabase().from("document_requests").select("*").eq("dossier_id", d.id).order("created_at"),
      supabase().from("dossier_notes").select("*").eq("dossier_id", d.id).order("created_at", { ascending: false }),
    ]);
    setReqs((r.data as DocRequest[]) ?? []);
    setNotes((n.data as Note[]) ?? []);
  }, [d.id]);
  useEffect(() => { load(); }, [load]);

  const add = async (e: FormEvent<HTMLFormElement>, table: "document_requests" | "dossier_notes") => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = String(new FormData(form).get("v") ?? "").trim();
    if (!v) return;
    await supabase().from(table).insert(table === "document_requests" ? { dossier_id: d.id, label: v.slice(0, 200) } : { dossier_id: d.id, body: v.slice(0, 4000), author: staffName });
    form.reset();
    load();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-navy">{d.title}</h2>
        <p className="mt-1 text-sm text-muted">{d.client_name} · <a className="text-navy underline underline-offset-4" href={`mailto:${d.client_email}`}>{d.client_email}</a> · {KINDS[d.kind]?.fr ?? d.kind}{d.tax_year ? ` · ${d.tax_year}` : ""}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="d-status" className="label">Étape (visible par le client)</label>
            <select id="d-status" value={d.status} onChange={(e) => onChange({ status: e.target.value })} className="field">
              {STATUSES.map((s, i) => <option key={s} value={s}>{i + 1}. {statusLabel[s].fr}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="d-due" className="label">Échéance</label>
            <input id="d-due" type="date" defaultValue={d.due_date ?? ""} className="field" onBlur={(e) => (e.target.value || null) !== d.due_date && onChange({ due_date: e.target.value || null })} />
          </div>
        </div>
        <label htmlFor="d-next" className="label mt-4">Prochaine étape (visible par le client)</label>
        <textarea id="d-next" key={d.id} defaultValue={d.next_step} rows={2} maxLength={500} className="field resize-y" onBlur={(e) => e.target.value !== d.next_step && onChange({ next_step: e.target.value })} />
      </section>

      <Card title="Documents demandés au client">
        <ul className="space-y-2">
          {reqs.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
              <label className="flex items-center gap-3 text-ink">
                <input type="checkbox" checked={r.received} className="h-5 w-5 accent-navy" onChange={async (e) => { await supabase().from("document_requests").update({ received: e.target.checked }).eq("id", r.id); load(); }} />
                <span className={r.received ? "text-muted line-through" : ""}>{r.label}</span>
              </label>
              <button type="button" className="text-sm text-[#a3261f] underline underline-offset-4" onClick={async () => { await supabase().from("document_requests").delete().eq("id", r.id); load(); }}>Retirer</button>
            </li>
          ))}
        </ul>
        <form onSubmit={(e) => add(e, "document_requests")} className="mt-3 flex gap-2">
          <label htmlFor="req-new" className="sr-only">Document à demander</label>
          <input id="req-new" name="v" placeholder="Ex. Relevé 1 et T4 de l'employeur" maxLength={200} className="field min-h-11 flex-1 py-2" />
          <button type="submit" className="btn-secondary min-h-11 px-4">Ajouter</button>
        </form>
      </Card>

      <Documents key={`d-${d.id}`} dossierId={d.id} role="cabinet" lang="fr" />
      <Messages key={`m-${d.id}`} dossierId={d.id} role="cabinet" lang="fr" authorName={staffName} />

      <Card title="Notes internes (jamais visibles par le client)">
        <form onSubmit={(e) => add(e, "dossier_notes")}>
          <label htmlFor="note-new" className="sr-only">Nouvelle note</label>
          <textarea id="note-new" name="v" rows={2} maxLength={4000} className="field resize-y" />
          <button type="submit" className="btn-secondary mt-2 min-h-10 px-4 py-2 text-sm">Ajouter la note</button>
        </form>
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-[#f5f7fb] px-4 py-3">
              <p className="leading-relaxed whitespace-pre-line text-ink">{n.body}</p>
              <p className="mt-1 text-xs text-muted">{n.author} · {fmtDate(n.created_at, "fr", true)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Dossiers({ staffName, draft, clearDraft }: { staffName: string; draft: Lead | null; clearDraft: () => void }) {
  const [list, setList] = useState<Dossier[] | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    const { data } = await supabase().from("dossiers").select("*").order("updated_at", { ascending: false }).limit(500);
    setList((data as Dossier[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (draft) setCreating(true); }, [draft]);

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const row = {
      client_name: String(f.get("client_name")).trim(), client_email: String(f.get("client_email")).trim().toLowerCase(), title: String(f.get("title")).trim(),
      kind: String(f.get("kind")), tax_year: f.get("tax_year") ? Number(f.get("tax_year")) : null, lead_id: draft?.id ?? null,
    };
    const { data, error } = await supabase().from("dossiers").insert(row).select().single();
    if (error) { setErr("Le dossier n'a pas pu être créé. Vérifiez les champs."); return; }
    if (draft) await supabase().from("leads").update({ status: "client" }).eq("id", draft.id);
    setErr(""); setCreating(false); clearDraft();
    await load();
    setCurrent((data as Dossier).id);
  };
  const patch = async (id: string, p: Partial<Dossier>) => {
    setList((l) => l?.map((x) => (x.id === id ? { ...x, ...p } : x)) ?? null);
    await supabase().from("dossiers").update(p).eq("id", id);
  };

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (list ?? []).filter((d) => !n || `${d.client_name} ${d.client_email} ${d.title}`.toLowerCase().includes(n));
  }, [list, q]);
  if (!list) return <p className="text-muted" role="status">…</p>;
  const d = list.find((x) => x.id === current);

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <div>
        <button type="button" onClick={() => { setCreating((c) => !c); if (creating) clearDraft(); }} className="btn-primary min-h-11 w-full">{creating ? "Annuler" : "Nouveau dossier"}</button>
        <label htmlFor="d-q" className="sr-only">Chercher un dossier</label>
        <input id="d-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un client, un dossier…" className="field mt-3 min-h-11 py-2" />
        <ul className="mt-3 space-y-2">
          {shown.map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => { setCurrent(x.id); setCreating(false); }} aria-current={x.id === current ? "true" : undefined} className="w-full rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-sky-50">
                <span className="block font-display font-semibold text-ink">{x.client_name}</span>
                <span className="block text-sm text-ink/80">{x.title}</span>
                <span className="mt-1 block text-xs text-muted">{statusLabel[x.status]?.fr ?? x.status}{x.due_date ? ` · échéance ${fmtDate(x.due_date, "fr")}` : ""}</span>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">Aucun dossier.</li>}
        </ul>
      </div>
      <div>
        {creating ? (
          <form onSubmit={create} key={draft?.id ?? "new"} className="space-y-4 rounded-3xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-navy">Nouveau dossier</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="c-name" className="label">Nom du client</label><input id="c-name" name="client_name" required maxLength={160} defaultValue={draft?.name ?? ""} className="field" /></div>
              <div><label htmlFor="c-email" className="label">Courriel du client</label><input id="c-email" name="client_email" type="email" required maxLength={200} defaultValue={draft?.email ?? ""} aria-describedby="c-email-h" className="field" /><p id="c-email-h" className="mt-1.5 text-xs text-muted">Le client se connecte à son espace avec ce courriel.</p></div>
            </div>
            <div><label htmlFor="c-title" className="label">Titre du dossier</label><input id="c-title" name="title" required maxLength={160} defaultValue={draft?.topic ?? ""} placeholder="Ex. Déclarations de revenus 2026" className="field" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="c-kind" className="label">Type de mandat</label><select id="c-kind" name="kind" className="field">{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v.fr}</option>)}</select></div>
              <div><label htmlFor="c-year" className="label">Année visée (facultatif)</label><input id="c-year" name="tax_year" type="number" min={2000} max={2100} className="field" /></div>
            </div>
            <button type="submit" className="btn-primary">Créer le dossier</button>
            <p role="status" aria-live="polite" className={err ? "rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{err}</p>
          </form>
        ) : d ? (
          <DossierDetail key={d.id} d={d} staffName={staffName} onChange={(p) => patch(d.id, p)} />
        ) : (
          <p className="rounded-3xl border border-line bg-white p-6 text-muted">Choisissez un dossier dans la liste, ou créez-en un.</p>
        )}
      </div>
    </div>
  );
}

function Reminders() {
  const [subs, setSubs] = useState<Sub[] | null>(null);
  useEffect(() => {
    supabase().from("reminder_subscribers").select("*").order("consent_at", { ascending: false }).then(({ data }) => setSubs((data as Sub[]) ?? []));
  }, []);
  if (!subs) return <p className="text-muted" role="status">…</p>;
  const active = subs.filter((s) => !s.unsubscribed_at);
  const csv = () => {
    const blob = new Blob(["courriel,langue,consentement\n" + active.map((s) => `${s.email},${s.lang},${s.consent_at}`).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "rappels-fiscaux.csv"; a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Card title={`Inscrits aux rappels fiscaux (${active.length})`} aside={active.length > 0 && <button type="button" onClick={csv} className="btn-secondary min-h-10 px-4 py-2 text-sm">Exporter (CSV)</button>}>
      <p className="mb-3 text-sm text-muted">Ces personnes ont donné leur consentement explicite pour recevoir les rappels d'échéances. Retirez sans délai toute personne qui le demande.</p>
      {subs.length === 0 ? <p className="text-sm text-muted">Aucune inscription pour l'instant.</p> : (
        <ul className="divide-y divide-line">
          {subs.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <span className={s.unsubscribed_at ? "text-muted line-through" : "font-medium text-ink"}>{s.email}</span>
              <span className="flex items-center gap-3 text-muted">
                {s.lang.toUpperCase()} · {fmtDate(s.consent_at, "fr")}
                {!s.unsubscribed_at && <button type="button" className="text-[#a3261f] underline underline-offset-4" onClick={async () => { const now = new Date().toISOString(); await supabase().from("reminder_subscribers").update({ unsubscribed_at: now }).eq("id", s.id); setSubs((l) => l?.map((x) => (x.id === s.id ? { ...x, unsubscribed_at: now } : x)) ?? null); }}>Désinscrire</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Board({ email }: { email: string }) {
  const [staff, setStaff] = useState<{ name: string } | null | undefined>(undefined);
  const [tab, setTab] = useState<"leads" | "dossiers" | "rappels">("leads");
  const [draft, setDraft] = useState<Lead | null>(null);
  useEffect(() => {
    supabase().from("staff").select("name").eq("email", email.toLowerCase()).maybeSingle().then(({ data }) => setStaff((data as { name: string } | null) ?? null));
  }, [email]);
  if (staff === undefined) return <p className="text-muted" role="status">…</p>;
  if (staff === null)
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-white p-7">
        <p className="font-display text-xl font-semibold text-ink">Accès réservé à l'équipe du cabinet.</p>
        <p className="mt-2 leading-relaxed text-muted">Le courriel {email} n'est pas dans la liste de l'équipe. Si vous êtes client, votre espace est ici : <a className="font-semibold text-navy underline underline-offset-4" href="/espace-client/">Mon espace client</a>.</p>
      </div>
    );
  const staffName = staff.name || email;
  return (
    <div>
      <div role="tablist" aria-label="Sections" className="mb-6 inline-flex rounded-full border border-line bg-white p-1">
        {([["leads", "Demandes"], ["dossiers", "Dossiers"], ["rappels", "Rappels"]] as const).map(([k, l]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className="rounded-full px-5 py-2 text-sm font-semibold text-ink aria-selected:bg-navy aria-selected:text-white">{l}</button>
        ))}
      </div>
      {tab === "leads" && <Leads onCreateDossier={(l) => { setDraft(l); setTab("dossiers"); }} />}
      {tab === "dossiers" && <Dossiers staffName={staffName} draft={draft} clearDraft={() => setDraft(null)} />}
      {tab === "rappels" && <Reminders />}
    </div>
  );
}

export function Dashboard() {
  return <AppFrame lang="fr" title="Tableau de bord" subtitle="Gestion du cabinet">{(s) => <Board email={s.user.email ?? ""} />}</AppFrame>;
}
