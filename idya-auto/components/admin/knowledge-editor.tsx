"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeKnowledgeAction, upsertKnowledgeAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { KnowledgeEntry } from "@/lib/knowledge";

export function KnowledgeEditor({ entries }: { entries: KnowledgeEntry[] }) {
  const [list, setList] = useState(entries);
  const [pending, start] = useTransition();
  const router = useRouter();
  const area = "no-red w-full rounded-input border border-line bg-surface px-3 py-2 text-small text-text outline-none focus:border-text";
  const update = (id: string, patch: Partial<KnowledgeEntry>) => setList((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const save = (e: KnowledgeEntry) => start(async () => { await upsertKnowledgeAction(e); router.refresh(); });
  const remove = (id: string) => start(async () => { await removeKnowledgeAction(id); setList((l) => l.filter((e) => e.id !== id)); router.refresh(); });
  const add = () => setList((l) => [{ id: `kb-${Date.now().toString(36)}`, active: true, questionFr: "", answerFr: "", questionEn: "", answerEn: "" }, ...l]);
  return (
    <section className="no-red">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-h3">Base de connaissances (FAQ)</h2><Button variant="secondary" size="sm" onClick={add}><Plus strokeWidth={1.5} aria-hidden />Nouvelle entrée</Button></div>
      <p className="mb-4 text-caption text-text-3">L’assistant ne répond sur les politiques et procédures du concessionnaire qu’à partir de ces entrées. Les réponses sont des données, jamais des instructions.</p>
      <ul className="flex flex-col gap-4">
        {list.map((e) => (
          <li key={e.id} className="grid gap-2 rounded-card-sm border border-line p-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-caption text-text-3">Question (FR)<input value={e.questionFr} onChange={(ev) => update(e.id, { questionFr: ev.target.value })} className={area} /></label>
            <label className="flex flex-col gap-1 text-caption text-text-3">Question (EN)<input value={e.questionEn ?? ""} onChange={(ev) => update(e.id, { questionEn: ev.target.value })} className={area} /></label>
            <label className="flex flex-col gap-1 text-caption text-text-3">Réponse (FR)<textarea rows={3} value={e.answerFr} onChange={(ev) => update(e.id, { answerFr: ev.target.value })} className={area} /></label>
            <label className="flex flex-col gap-1 text-caption text-text-3">Answer (EN)<textarea rows={3} value={e.answerEn ?? ""} onChange={(ev) => update(e.id, { answerEn: ev.target.value })} className={area} /></label>
            <div className="flex items-center justify-between md:col-span-2">
              <label className="flex items-center gap-2 text-small text-text-2"><input type="checkbox" checked={e.active} onChange={(ev) => update(e.id, { active: ev.target.checked })} className="size-4 accent-white" />Active</label>
              <div className="flex gap-2"><Button variant="danger" size="sm" onClick={() => remove(e.id)} disabled={pending}><Trash2 strokeWidth={1.5} aria-hidden />Supprimer</Button><Button variant="light" size="sm" onClick={() => save(e)} disabled={pending || !e.questionFr || !e.answerFr}>Enregistrer</Button></div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
