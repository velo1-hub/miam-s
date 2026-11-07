"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addLeadNoteAction, updateLeadAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { LEAD_STATUS_FR } from "@/components/admin/lead-row";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/leads/types";

export function LeadActions({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [assigned, setAssigned] = useState(lead.assignedTo ?? "");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const save = () => start(async () => { await updateLeadAction(lead.id, { status, assignedTo: assigned || null }); router.refresh(); });
  const addNote = () => start(async () => { await addLeadNoteAction(lead.id, note); setNote(""); router.refresh(); });
  const field = "no-red h-10 w-full rounded-input border border-line bg-surface px-3 text-small text-text outline-none focus:border-text";
  return (
    <section className="no-red flex flex-col gap-3 rounded-card-sm border border-line p-4">
      <label className="flex flex-col gap-1 text-caption text-text-3">Statut
        <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className={field}>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_FR[s]}</option>)}</select>
      </label>
      <label className="flex flex-col gap-1 text-caption text-text-3">Assigné à (vendeur)
        <input value={assigned} onChange={(e) => setAssigned(e.target.value)} placeholder="Nom ou identifiant" className={field} />
      </label>
      <Button variant="light" size="md" onClick={save} disabled={pending}>Enregistrer</Button>
      <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
        <label className="flex flex-col gap-1 text-caption text-text-3">Ajouter une note
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="no-red w-full rounded-input border border-line bg-surface px-3 py-2 text-small text-text outline-none focus:border-text" />
        </label>
        <Button variant="secondary" size="sm" onClick={addNote} disabled={pending || !note.trim()}>Ajouter</Button>
      </div>
      <div className="flex gap-3 border-t border-line pt-3 text-small">
        {lead.email && <a href={`mailto:${lead.email}`} className="text-text hover:underline">Courriel</a>}
        {lead.phone && <a href={`tel:${lead.phone}`} className="text-text hover:underline">Appeler</a>}
      </div>
    </section>
  );
}
