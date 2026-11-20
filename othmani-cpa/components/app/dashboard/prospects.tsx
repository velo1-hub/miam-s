"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { fmtDate } from "../shared";
import { Avatar, LEAD_FILTERS, LEAD_STATUS, SOURCE, SavedAt, chip, empty, isOpenLead, leadMatches, link, mailto, newId, panel, pill, smallBtn, telto, type Lead, type PatchLead } from "./common";

/** Refus d'un prospect : on fait confirmer, puis le message propose « Annuler » pendant quelques secondes. */
export function refuseLead(l: Lead, patch: PatchLead) {
  if (!window.confirm(`Refuser le prospect ${l.name} ?\nIl sera classé dans « Refusés ou fermés ». Rien n'est envoyé à cette personne.`)) return;
  const prev = l.status;
  patch(l.id, { status: "ferme" }, { ok: `${l.name} : prospect refusé.`, undo: () => { patch(l.id, { status: prev }, { ok: "Prospect rétabli." }); } });
}
/* ───────────── Demandes ───────────── */
export function LeadForm({ onAdd, onDone }: { onAdd: (l: Lead) => Promise<boolean>; onDone: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    if (!v("email") && !v("phone")) { setErr("Indiquez un courriel ou un téléphone."); return; }
    setErr(""); setBusy(true);
    const ok = await onAdd({ id: newId(), created_at: new Date().toISOString(), source: "telephone", lang: "fr", name: v("name"), email: v("email").toLowerCase() || null, phone: v("phone") || null, audience: v("audience"), topic: v("topic") || null, message: v("message"), status: "nouveau", notes: "" });
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <form onSubmit={submit} className={`${panel} mb-4 space-y-4`}>
      <h2 className="font-display text-xl font-semibold text-navy">Nouveau prospect (appel, visite, référence)</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label htmlFor="nl-name" className="label">Nom</label><input id="nl-name" name="name" required maxLength={120} className="field" /></div>
        <div><label htmlFor="nl-email" className="label">Courriel</label><input id="nl-email" name="email" type="email" maxLength={200} className="field" /></div>
        <div><label htmlFor="nl-phone" className="label">Téléphone</label><input id="nl-phone" name="phone" type="tel" maxLength={40} className="field" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <div><label htmlFor="nl-aud" className="label">Pour</label><select id="nl-aud" name="audience" className="field"><option value="moi">Particulier</option><option value="entreprise">Entreprise</option></select></div>
        <div><label htmlFor="nl-topic" className="label">Sujet</label><input id="nl-topic" name="topic" maxLength={120} className="field" /></div>
      </div>
      <div><label htmlFor="nl-msg" className="label">Besoin</label><textarea id="nl-msg" name="message" rows={3} maxLength={4000} className="field resize-y" /></div>
      <button type="submit" disabled={busy} className="btn-primary min-h-11">{busy ? "Enregistrement…" : "Enregistrer"}</button>
      <p role="alert" className={err ? "rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{err}</p>
    </form>
  );
}

export function LeadCard({ l, focused, patch, onCreateDossier }: { l: Lead; focused: boolean; patch: PatchLead; onCreateDossier: (l: Lead) => void }) {
  const [saved, setSaved] = useState<Date | null>(null);
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => { if (focused) { ref.current?.scrollIntoView({ block: "center" }); ref.current?.focus(); } }, [focused]);
  const setStatus = (status: string) => {
    const prev = l.status;
    patch(l.id, { status }, { ok: `${l.name} : ${LEAD_STATUS[status] ?? status}`, undo: () => { patch(l.id, { status: prev }, { ok: "Statut rétabli." }); } });
  };
  const addEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (v) patch(l.id, { email: v }, { ok: "Courriel ajouté." });
  };
  const open = isOpenLead(l);
  const who = l.audience === "entreprise" ? "Entreprise" : l.audience === "moi" ? "Particulier" : null;
  return (
    <li ref={ref} tabIndex={-1} className={`${panel} ${focused ? "border-navy ring-2 ring-navy" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={l.name} className="h-11 w-11 text-sm" />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink">{l.name}</h2>
            <p className="mt-0.5 text-sm text-muted">Reçu le {fmtDate(l.created_at, "fr", true)} · {l.lang.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`st-${l.id}`}>Statut du prospect {l.name}</label>
          <select id={`st-${l.id}`} value={l.status} onChange={(e) => setStatus(e.target.value)} className="field min-h-11 w-auto py-1.5 text-sm">
            {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <p className="mt-3 flex flex-wrap gap-1.5">
        {who && <span className={`${pill} bg-[#eef0f6] text-ink`}>{who}</span>}
        <span className={`${pill} ${l.source === "clara" ? "bg-sky-100 text-navy" : "bg-[#eef0f6] text-ink"}`}>Source : {SOURCE[l.source] ?? l.source}</span>
        {l.topic && <span className={`${pill} bg-sky-100 text-navy`}>{l.topic}</span>}
      </p>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <dt className="pf-eyebrow">Besoin</dt>
          <dd className="mt-1 leading-relaxed whitespace-pre-line text-ink">{l.message || l.topic || "Aucun détail fourni."}</dd>
        </div>
        <div>
          <dt className="pf-eyebrow">Contact</dt>
          <dd className="mt-1 flex flex-col items-start gap-1 text-sm">
            {l.email && <a href={mailto(l.email)} className={`${link} break-all`}>{l.email}</a>}
            {l.phone && <a href={telto(l.phone)} className={link}>{l.phone}</a>}
            {!l.email && !l.phone && <span className="text-muted">Aucune coordonnée.</span>}
          </dd>
        </div>
      </dl>
      <label htmlFor={`n-${l.id}`} className="label mt-4">Notes internes</label>
      <textarea id={`n-${l.id}`} defaultValue={l.notes} rows={2} maxLength={4000} className="field resize-y" onBlur={async (e) => { if (e.target.value !== l.notes && (await patch(l.id, { notes: e.target.value }))) setSaved(new Date()); }} />
      <SavedAt at={saved} />
      {!l.email && open && (
        <form onSubmit={addEmail} className="mb-3 flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <label htmlFor={`em-${l.id}`} className="label">Courriel du client</label>
            <input id={`em-${l.id}`} name="email" type="email" required maxLength={200} autoCapitalize="none" className="field min-h-11 py-2" />
          </div>
          <button type="submit" className={smallBtn}>Ajouter le courriel</button>
        </form>
      )}
      {open ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <button type="button" onClick={() => refuseLead(l, patch)} className="btn-secondary min-h-11 px-5 py-2 text-sm !text-[#a3261f]">Refuser</button>
          <button type="button" disabled={!l.email} aria-describedby={l.email ? undefined : `emh-${l.id}`} onClick={() => onCreateDossier(l)} className="btn-primary min-h-11 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Accepter</button>
          <p id={`emh-${l.id}`} className="basis-full text-sm text-muted">{l.email ? "Accepter ouvre la création du dossier : vous relisez le courriel avant de confirmer." : "Ajoutez un courriel pour accepter ce prospect et ouvrir son dossier."}</p>
        </div>
      ) : (
        <p className="mt-2 border-t border-line pt-4 text-sm text-muted">{l.status === "client" ? "Prospect accepté : son dossier est ouvert." : "Prospect refusé ou fermé. Changez son statut pour le rouvrir."}</p>
      )}
    </li>
  );
}

export function Leads({ leads, filter, setFilter, focusId, patch, onAdd, onCreateDossier }: {
  leads: Lead[]; filter: string; setFilter: (f: string) => void; focusId: string | null; patch: PatchLead; onAdd: (l: Lead) => Promise<boolean>; onCreateDossier: (l: Lead) => void;
}) {
  const [adding, setAdding] = useState(false);
  const shown = leads.filter((l) => leadMatches(l, filter) || l.id === focusId);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {LEAD_FILTERS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} className={chip}>{l} ({leads.filter((x) => leadMatches(x, k)).length})</button>
        ))}
        <button type="button" onClick={() => setAdding((a) => !a)} className={`${adding ? "btn-secondary" : "btn-primary"} ml-auto min-h-11 px-4 py-2 text-sm`}>{adding ? "Fermer le formulaire" : "Ajouter un prospect"}</button>
      </div>
      {adding && <LeadForm onAdd={onAdd} onDone={() => setAdding(false)} />}
      {shown.length === 0 ? <p className={empty}>Aucun prospect dans cette vue.</p> : (
        <ul className="space-y-4">
          {shown.map((l) => <LeadCard key={l.id} l={l} focused={l.id === focusId} patch={patch} onCreateDossier={onCreateDossier} />)}
        </ul>
      )}
    </div>
  );
}
