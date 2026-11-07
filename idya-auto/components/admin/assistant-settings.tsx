"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { Settings } from "@/lib/settings/types";

export function AssistantSettings({ settings }: { settings: Settings }) {
  const [a, setA] = useState(settings.assistant);
  const [pending, start] = useTransition();
  const router = useRouter();
  const field = "no-red h-10 w-full rounded-input border border-line bg-surface px-3 text-small text-text outline-none focus:border-text";
  return (
    <section className="no-red glass-lite grid gap-4 rounded-card-sm p-4 md:grid-cols-4 md:items-end">
      <label className="flex items-center gap-2 text-small text-text"><input type="checkbox" checked={a.enabled} onChange={(e) => setA({ ...a, enabled: e.target.checked })} className="size-4 accent-white" />Assistant activé sur le site</label>
      <label className="flex flex-col gap-1 text-caption text-text-3">Nom<input value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} className={field} /></label>
      <label className="flex flex-col gap-1 text-caption text-text-3">Message hors heures (FR)<input value={a.afterHoursNote.fr} onChange={(e) => setA({ ...a, afterHoursNote: { ...a.afterHoursNote, fr: e.target.value } })} className={field} /></label>
      <Button variant="light" size="md" disabled={pending} onClick={() => start(async () => { await saveSettingsAction({ assistant: a }); router.refresh(); })}>Enregistrer</Button>
    </section>
  );
}
