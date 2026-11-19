"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Documents, KINDS, Messages, STATUSES, STEPS5, WEATHER, fmtDate, save, statusLabel, step5, toast, type Appointment, type Dossier, type Signature } from "../shared";
import { Loadable, SavedAt, askAi, clockFmt, daysUntil, link, mailQuery, mailto, montrealISO, newId, origin, panel, pill, removeBtn, rows, smallBtn, todayISO, useLoad, warnPill, type FileDoc, type Focus, type Invoice, type Note, type PatchOpts, type Req, type Task } from "./common";
import { DossierInvoices } from "./invoices";
/* ───────────── Détail d'un dossier ───────────── */
export function DossierHeader({ d }: { d: Dossier }) {
  const text = `Bonjour,\n\nVotre dossier « ${d.title} » est ouvert chez Othmani CPA. Vous pouvez suivre son avancement, déposer vos documents et nous écrire dans votre espace client :\n\n${origin()}/espace-client/\n\nConnectez-vous avec ce courriel : ${d.client_email}. Vous recevrez un code de connexion, sans mot de passe.\n\nL'équipe d'Othmani CPA`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast("Invitation copiée."); } catch { toast("Copie impossible. Utilisez le lien courriel.", "error"); }
  };
  return (
    <header className={panel}>
      <h2 className="font-display text-2xl font-bold tracking-tight text-navy">{d.title}</h2>
      <p className="mt-1 text-sm text-muted">{d.client_name} · <a className={link} href={mailto(d.client_email)}>{d.client_email}</a> · {KINDS[d.kind]?.fr ?? d.kind}{d.tax_year ? ` · ${d.tax_year}` : ""}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={copy} className={smallBtn}>Copier l'invitation à l'espace client</button>
        <a href={mailto(d.client_email, mailQuery("Votre espace client Othmani CPA", text))} className={`${link} text-sm`}>L'envoyer par courriel</a>
      </div>
    </header>
  );
}

export function FollowUp({ d, team, onPatch, onMove }: { d: Dossier; team: string[]; onPatch: (p: Partial<Dossier>, o?: PatchOpts) => Promise<boolean>; onMove: (status: string) => void }) {
  const [saved, setSaved] = useState<{ due?: Date; next?: Date }>({});
  return (
    <Card title="Suivi">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="d-status" className="label">Étape (visible par le client)</label>
          <select id="d-status" aria-describedby="d-status-h" value={d.status} onChange={(e) => onMove(e.target.value)} className="field">
            {STATUSES.map((s, i) => <option key={s} value={s}>{i + 1}. {statusLabel[s].fr} · client : {STEPS5[step5(s)].fr} ({step5(s) + 1}/5)</option>)}
          </select>
          <p id="d-status-h" className="mt-1.5 text-xs text-muted">Le client voit 5 étapes. Celle-ci lui apparaît comme « {STEPS5[step5(d.status)].fr} » ({step5(d.status) + 1} sur 5).</p>
        </div>
        <div>
          <label htmlFor="d-assignee" className="label">Responsable au cabinet</label>
          <select id="d-assignee" value={d.assignee ?? ""} onChange={(e) => onPatch({ assignee: e.target.value }, { ok: "Enregistré" })} className="field">
            <option value="">Non attribué</option>
            {[...new Set([...team, d.assignee ?? ""].filter(Boolean))].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="d-due" className="label">Échéance</label>
          <input id="d-due" key={d.due_date ?? ""} type="date" defaultValue={d.due_date ?? ""} className="field" onBlur={async (e) => { const v = e.target.value || null; if (v !== d.due_date && (await onPatch({ due_date: v }))) setSaved((s) => ({ ...s, due: new Date() })); }} />
          <SavedAt at={saved.due ?? null} />
        </div>
      </div>
      <label htmlFor="d-next" className="label mt-2">Message au client sur la suite</label>
      <textarea id="d-next" defaultValue={d.next_step} rows={2} maxLength={500} aria-describedby="d-next-h" className="field resize-y" onBlur={async (e) => { if (e.target.value !== d.next_step && (await onPatch({ next_step: e.target.value }))) setSaved((s) => ({ ...s, next: new Date() })); }} />
      <p id="d-next-h" className="mt-1 text-xs text-muted">Le client lit ce texte dans son espace. Il s'enregistre quand vous quittez le champ.</p>
      <SavedAt at={saved.next ?? null} />
    </Card>
  );
}

export function Tasks({ d, team }: { d: Dossier; team: string[] }) {
  const load = useLoad(() => rows<Task>(supabase().from("tasks").select("*").eq("dossier_id", d.id).order("created_at")), d.id);
  const edit = (f: (l: Task[]) => Task[]) => load.set((l) => (l ? f(l) : l));
  const insert = (t: Task, ok: string, undo?: () => void) => {
    edit((l) => [...l.filter((x) => x.id !== t.id), t]);
    return save(supabase().from("tasks").insert(t), { ok, undo, rollback: () => edit((l) => l.filter((x) => x.id !== t.id)) });
  };
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const label = String(f.get("label") ?? "").trim();
    if (!label) return;
    if (await insert({ id: newId(), dossier_id: d.id, created_at: new Date().toISOString(), label: label.slice(0, 300), assignee: String(f.get("assignee") ?? ""), due_date: String(f.get("due") ?? "") || null, done: false }, "Tâche ajoutée.")) form.reset();
  };
  const toggle = (t: Task, done: boolean) => {
    edit((l) => l.map((x) => (x.id === t.id ? { ...x, done } : x)));
    save(supabase().from("tasks").update({ done }).eq("id", t.id), { rollback: () => edit((l) => l.map((x) => (x.id === t.id ? { ...x, done: t.done } : x))) });
  };
  const remove = (t: Task) => {
    edit((l) => l.filter((x) => x.id !== t.id));
    save(supabase().from("tasks").delete().eq("id", t.id), { ok: "Tâche retirée.", rollback: () => edit((l) => [...l, t]), undo: () => { insert(t, "Tâche rétablie."); } });
  };
  return (
    <Card title="Tâches internes">
      <Loadable load={load} label="Chargement des tâches" rows={1}>
        {(list) => {
          const sorted = [...list].sort((a, b) => Number(a.done) - Number(b.done) || a.created_at.localeCompare(b.created_at));
          return sorted.length === 0 ? <p className="text-sm text-muted">Aucune tâche pour ce dossier.</p> : (
            <ul className="space-y-2">
              {sorted.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-3 rounded-xl border border-line py-1 pr-1 pl-3">
                  <label className="flex min-h-11 min-w-0 flex-1 basis-56 items-center gap-3 text-ink">
                    <input type="checkbox" checked={t.done} className="h-5 w-5 shrink-0 accent-navy" onChange={(e) => toggle(t, e.target.checked)} />
                    <span className={t.done ? "text-muted line-through" : ""}>{t.label}</span>
                  </label>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                    {t.assignee && <span>{t.assignee}</span>}
                    {t.due_date && <span className={!t.done && daysUntil(t.due_date) < 0 ? "font-semibold text-[#a3261f]" : ""}>{fmtDate(t.due_date, "fr")}</span>}
                    <button type="button" className={removeBtn} aria-label={`Retirer la tâche : ${t.label}`} onClick={() => remove(t)}>Retirer</button>
                  </span>
                </li>
              ))}
            </ul>
          );
        }}
      </Loadable>
      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div className="sm:col-span-3"><label htmlFor="tk-label" className="sr-only">Nouvelle tâche</label><input id="tk-label" name="label" placeholder="Ex. Rappeler le client pour le Relevé 1" maxLength={300} className="field min-h-11 py-2" /></div>
        <div><label htmlFor="tk-who" className="sr-only">Responsable de la tâche</label><select id="tk-who" name="assignee" defaultValue={d.assignee ?? ""} className="field min-h-11 py-2"><option value="">Non attribuée</option>{team.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        <div><label htmlFor="tk-due" className="sr-only">Échéance de la tâche</label><input id="tk-due" name="due" type="date" className="field min-h-11 py-2" /></div>
        <button type="submit" className={smallBtn}>Ajouter la tâche</button>
      </form>
    </Card>
  );
}

export function Requests({ d, staffName }: { d: Dossier; staffName: string }) {
  const load = useLoad(async () => {
    const [reqs, files] = await Promise.all([
      rows<Req>(supabase().from("document_requests").select("*").eq("dossier_id", d.id).order("created_at")),
      rows<FileDoc>(supabase().from("documents").select("*").eq("dossier_id", d.id).order("created_at", { ascending: false })),
    ]);
    return { reqs, files };
  }, d.id);
  const edit = (f: (l: Req[]) => Req[]) => load.set((s) => (s ? { ...s, reqs: f(s.reqs) } : s));
  const linked = (id: string) => (load.data?.files ?? []).filter((x) => x.request_id === id && x.uploader_role === "client");
  const insert = (r: Req, ok: string) => {
    edit((l) => [...l.filter((x) => x.id !== r.id), r]);
    return save(supabase().from("document_requests").insert(r), { ok, rollback: () => edit((l) => l.filter((x) => x.id !== r.id)) });
  };
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = String(new FormData(form).get("v") ?? "").trim();
    if (!v) return;
    if (await insert({ id: newId(), dossier_id: d.id, created_at: new Date().toISOString(), label: v.slice(0, 200), received: false }, "Document demandé ajouté.")) form.reset();
  };
  const setReceived = (r: Req, received: boolean, ok?: string) => {
    edit((l) => l.map((x) => (x.id === r.id ? { ...x, received } : x)));
    save(supabase().from("document_requests").update({ received }).eq("id", r.id), { ok, rollback: () => edit((l) => l.map((x) => (x.id === r.id ? { ...x, received: r.received } : x))) });
  };
  const remove = (r: Req) => {
    const files = linked(r.id);
    edit((l) => l.filter((x) => x.id !== r.id));
    save(supabase().from("document_requests").delete().eq("id", r.id), {
      ok: "Document demandé retiré.", rollback: () => edit((l) => [...l, r]),
      undo: async () => {
        // La base détache les fichiers quand la demande disparaît : on les rattache après l'avoir recréée.
        if (await insert(r, "Document demandé rétabli.")) for (const f of files) await save(supabase().from("documents").update({ request_id: r.id }).eq("id", f.id));
      },
    });
  };
  const missing = (load.data?.reqs ?? []).filter((r) => !r.received);
  const reminder = `Bonjour ${d.client_name},\n\nPour avancer dans votre dossier « ${d.title} », il nous manque encore :\n\n${missing.map((r) => `- ${r.label}`).join("\n")}\n\nVous pouvez les déposer dans votre espace client (une photo suffit) :\n${origin()}/espace-client/\n\nMerci,\n${staffName}\nOthmani CPA`;
  const copyReminder = async () => {
    try { await navigator.clipboard.writeText(reminder); toast("Rappel copié. Collez-le dans votre courriel."); } catch { toast("Copie impossible. Utilisez le lien courriel.", "error"); }
  };
  return (
    <Card title="Documents demandés au client">
      <Loadable load={load} label="Chargement des documents demandés" rows={1}>
        {({ reqs }) => (
          <>
            {reqs.length === 0 ? <p className="text-sm text-muted">Aucun document demandé pour l'instant.</p> : (
              <ul className="space-y-2">
                {[...reqs].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")).map((r) => {
                  const files = linked(r.id);
                  return (
                    <li key={r.id} className="rounded-xl border border-line py-1 pr-1 pl-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex min-h-11 min-w-0 items-center gap-3 text-ink">
                          <input type="checkbox" checked={r.received} className="h-5 w-5 shrink-0 accent-navy" onChange={(e) => setReceived(r, e.target.checked)} />
                          <span className={r.received ? "text-muted line-through" : ""}>{r.label}</span>
                        </label>
                        <button type="button" className={removeBtn} aria-label={`Retirer le document demandé : ${r.label}`} onClick={() => remove(r)}>Retirer</button>
                      </div>
                      {files.length > 0 && (
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm">
                          <span className="min-w-0 text-ink">Déposé par le client : <strong className="font-semibold">{files.map((f) => f.name).join(", ")}</strong> ({fmtDate(files[0].created_at, "fr")})</span>
                          {r.received ? <span className={`${pill} bg-[#e6f4ea] text-[#1e5b2e]`}>Reçu</span> : <button type="button" onClick={() => setReceived(r, true, "Marqué reçu.")} className={smallBtn}>Marquer reçu</button>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={add} className="mt-4 flex flex-wrap gap-2">
              <label htmlFor="req-new" className="sr-only">Document à demander</label>
              <input id="req-new" name="v" placeholder="Ex. Relevé 1 et T4 de l'employeur" maxLength={200} className="field min-h-11 min-w-0 flex-1 basis-56 py-2" />
              <button type="submit" className={smallBtn}>Ajouter</button>
            </form>
            <div className="mt-5 border-t border-line pt-4">
              {missing.length === 0 ? <p className="text-sm text-muted">Rien à relancer : tout est reçu.</p> : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button type="button" onClick={copyReminder} className={smallBtn}>Relancer le client ({missing.length} manquant{missing.length > 1 ? "s" : ""})</button>
                  <a href={mailto(d.client_email, mailQuery(`Documents manquants : ${d.title}`, reminder))} className={`${link} text-sm`}>Ouvrir dans un courriel</a>
                  <p className="basis-full text-xs text-muted">Le rappel est copié. Rien n'est envoyé automatiquement.</p>
                </div>
              )}
            </div>
          </>
        )}
      </Loadable>
    </Card>
  );
}

export function AiSummary({ dossierId, title = "Assistant IA" }: { dossierId: string; title?: string }) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card title={title}>
      <p className="-mt-2 mb-3 text-xs text-muted">Résumé et brouillons à relire. Les fichiers et les coordonnées du client ne sont jamais transmis à l'IA.</p>
      <div className="flex flex-wrap gap-2">
        {([["summary", "Résumer le dossier"], ["relance", "Rédiger une relance"]] as const).map(([k, l]) => (
          <button key={k} type="button" disabled={busy} className={smallBtn} onClick={async () => { setBusy(true); setText(await askAi(dossierId, k)); setBusy(false); }}>{l}</button>
        ))}
      </div>
      {busy && <p className="mt-3 text-sm text-muted" role="status">L'assistant rédige…</p>}
      {text && !busy && (
        <div className="mt-3 rounded-xl bg-[#f3f7fc] px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink">{text}</p>
          <button type="button" className="mt-2 text-sm font-semibold text-navy underline underline-offset-4" onClick={async () => { try { await navigator.clipboard.writeText(text); toast("Texte copié."); } catch { toast("Copie impossible sur cet appareil.", "error"); } }}>Copier</button>
        </div>
      )}
    </Card>
  );
}

/** Journal d'activité : écrit par la base elle-même, il ne peut être ni modifié ni effacé depuis l'application. */
export type Act = { id: number; created_at: string; actor: string; actor_role: string; kind: string; detail: string };
export const ACT: Record<string, string> = {
  dossier_ouvert: "Dossier ouvert", etape: "Étape changée", responsable: "Responsable", echeance: "Échéance", message_suite: "Message au client sur la suite",
  courriel_client: "Courriel du client modifié", document_depose: "Document déposé", document_supprime: "Document supprimé", document_recu: "Document marqué reçu",
  message: "Message", facture_creee: "Facture créée", facture_statut: "Facture", signature: "Document signé",
};
export const actDetail = (a: Act) => (a.kind === "etape" || a.kind === "facture_statut" ? a.detail.replace(/\b[a-z_]+\b/g, (w) => statusLabel[w]?.fr ?? ({ brouillon: "Brouillon", a_payer: "À payer", payee: "Payée", annulee: "Annulée" } as Record<string, string>)[w] ?? w) : a.detail);

export function Journal({ dossierId }: { dossierId: string }) {
  const load = useLoad(() => rows<Act>(supabase().from("activity").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false }).limit(50)), dossierId);
  return (
    <Card title="Journal d'activité">
      <p className="-mt-2 mb-3 text-xs text-muted">Qui a fait quoi, et quand. Tenu automatiquement ; personne ne peut le modifier.</p>
      <Loadable load={load} label="Chargement du journal" rows={1}>
        {(acts) => acts.length === 0 ? <p className="text-sm text-muted">Aucune activité enregistrée pour ce dossier.</p> : (
          <ol className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
            {acts.map((a) => (
              <li key={a.id} className="border-l-2 border-line pl-3 text-sm">
                <p className="text-ink"><span className="font-semibold">{ACT[a.kind] ?? a.kind}</span>{a.detail ? <> : {actDetail(a)}</> : null}</p>
                <p className="text-xs text-muted">{a.actor_role === "client" ? "Client" : a.actor} · {fmtDate(a.created_at, "fr", true)}</p>
              </li>
            ))}
          </ol>
        )}
      </Loadable>
    </Card>
  );
}

export function Notes({ dossierId, staffName }: { dossierId: string; staffName: string }) {
  const load = useLoad(() => rows<Note>(supabase().from("dossier_notes").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false })), dossierId);
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = String(new FormData(form).get("v") ?? "").trim();
    if (!v) return;
    const n: Note = { id: newId(), dossier_id: dossierId, created_at: new Date().toISOString(), author: staffName, body: v.slice(0, 4000) };
    load.set((l) => [n, ...(l ?? [])]);
    if (await save(supabase().from("dossier_notes").insert({ id: n.id, dossier_id: n.dossier_id, author: n.author, body: n.body }), { ok: "Note ajoutée.", rollback: () => load.set((l) => l?.filter((x) => x.id !== n.id) ?? null) })) form.reset();
  };
  return (
    <Card title="Notes internes">
      <p className="-mt-2 mb-3 text-xs text-muted">Jamais visibles par le client.</p>
      <form onSubmit={add}>
        <label htmlFor="note-new" className="sr-only">Nouvelle note interne</label>
        <textarea id="note-new" name="v" rows={2} maxLength={4000} className="field resize-y" />
        <button type="submit" className={`${smallBtn} mt-2`}>Ajouter la note</button>
      </form>
      <div className="mt-4">
        <Loadable load={load} label="Chargement des notes" rows={1}>
          {(notes) => (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-[#f5f7fb] px-4 py-3">
                  <p className="leading-relaxed whitespace-pre-line text-ink">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">{n.author} · {fmtDate(n.created_at, "fr", true)}</p>
                </li>
              ))}
            </ul>
          )}
        </Loadable>
      </div>
    </Card>
  );
}

/** Valeurs saisies par le cabinet et montrées au client : économies réalisées et météo fiscale. Rien n'est calculé ni inventé. */
export function ClientValue({ d, onPatch }: { d: Dossier; onPatch: (p: Partial<Dossier>, o?: PatchOpts) => Promise<boolean> }) {
  const [saved, setSaved] = useState<{ savings?: Date; note?: Date }>({});
  const [err, setErr] = useState("");
  const saveSavings = async (raw: string) => {
    const txt = raw.replace(/\s|\$/g, "").replace(",", ".");
    const cents = txt === "" ? null : Math.round(Number(txt) * 100);
    if (cents !== null && (!Number.isFinite(cents) || cents < 0 || cents > 100000000)) { setErr("Indiquez un montant en dollars, par exemple 4200. Laissez vide pour ne rien afficher."); return; }
    setErr("");
    if (cents === (d.savings_cents ?? null)) return;
    if (await onPatch({ savings_cents: cents })) setSaved((x) => ({ ...x, savings: new Date() }));
  };
  return (
    <Card title="Ce que le client voit dans son espace">
      <p className="-mt-2 mb-4 text-xs text-muted">Ces valeurs sont saisies par le cabinet. Le client les voit telles quelles dans son espace ; laissez vide pour ne rien afficher.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="d-savings" className="label">Économies réalisées pour le client ($)</label>
          <input id="d-savings" key={d.savings_cents ?? ""} inputMode="decimal" defaultValue={d.savings_cents == null ? "" : (d.savings_cents / 100).toFixed(d.savings_cents % 100 ? 2 : 0).replace(".", ",")} placeholder="Ex. 4200" aria-describedby="d-savings-h" className="field" onBlur={(e) => saveSavings(e.target.value)} />
          <p id="d-savings-h" className="mt-1 text-xs text-muted">Montant constaté par le cabinet, en dollars.</p>
          <SavedAt at={saved.savings ?? null} />
        </div>
        <div>
          <label htmlFor="d-weather" className="label">Météo fiscale</label>
          <select id="d-weather" value={d.weather ?? ""} onChange={(e) => onPatch({ weather: (e.target.value || null) as Dossier["weather"] }, { ok: "Enregistré" })} className="field">
            <option value="">Aucune</option>
            {Object.entries(WEATHER).map(([k, v]) => <option key={k} value={k}>{v.fr[0].toUpperCase() + v.fr.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <label htmlFor="d-weather-note" className="label mt-1">Note sur la météo fiscale (courte)</label>
      <input id="d-weather-note" key={d.weather_note ?? ""} defaultValue={d.weather_note ?? ""} maxLength={200} placeholder="Ex. Tout est à jour. Prochaine échéance : votre acompte de mars." className="field" onBlur={async (e) => { if (e.target.value !== (d.weather_note ?? "") && (await onPatch({ weather_note: e.target.value }))) setSaved((x) => ({ ...x, note: new Date() })); }} />
      <SavedAt at={saved.note ?? null} />
      <p role="alert" className={err ? "rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{err}</p>
    </Card>
  );
}

/** Documents à faire approuver par le client. La signature elle-même se fait dans l'espace client ; elle est horodatée par la base. */
export function Signatures({ dossierId }: { dossierId: string }) {
  const load = useLoad(() => rows<Signature>(supabase().from("signatures").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false })), dossierId);
  const edit = (f: (l: Signature[]) => Signature[]) => load.set((l) => (l ? f(l) : l));
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const title = String(f.get("title") ?? "").trim().slice(0, 200);
    if (!title) return;
    const row: Signature = { id: newId(), dossier_id: dossierId, created_at: new Date().toISOString(), title, body: String(f.get("body") ?? "").trim().slice(0, 6000), status: "a_signer", signed_at: null, signed_name: null };
    edit((l) => [row, ...l]);
    if (await save(supabase().from("signatures").insert({ id: row.id, dossier_id: row.dossier_id, title: row.title, body: row.body, status: row.status }), { ok: "Document envoyé au client pour signature.", rollback: () => edit((l) => l.filter((x) => x.id !== row.id)) })) form.reset();
  };
  const setStatus = (sg: Signature, status: Signature["status"], ok: string, undo?: () => void) => {
    edit((l) => l.map((x) => (x.id === sg.id ? { ...x, status } : x)));
    save(supabase().from("signatures").update({ status }).eq("id", sg.id), { ok, undo, rollback: () => edit((l) => l.map((x) => (x.id === sg.id ? { ...x, status: sg.status } : x))) });
  };
  const cancel = (sg: Signature) => setStatus(sg, "annule", "Demande de signature annulée.", () => setStatus({ ...sg, status: "annule" }, "a_signer", "Demande de signature rétablie."));
  return (
    <Card title="À signer">
      <p className="-mt-2 mb-3 text-xs text-muted">Le client lit le texte dans son espace et l'approuve avec son nom. La date et le nom sont consignés au journal.</p>
      <Loadable load={load} label="Chargement des documents à signer" rows={1}>
        {(list) => (list.length === 0 ? <p className="text-sm text-muted">Aucun document à signer pour ce dossier.</p> : (
          <ul className="space-y-2">
            {list.map((sg) => (
              <li key={sg.id} className="rounded-xl border border-line px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`min-w-0 font-semibold ${sg.status === "annule" ? "text-muted line-through" : "text-ink"}`}>{sg.title}</p>
                  {sg.status === "signe" ? <span className={`${pill} bg-[#e6f4ea] text-[#1e5b2e]`}>Signé</span> : sg.status === "a_signer" ? <span className={warnPill}>En attente du client</span> : <span className={`${pill} bg-[#eef0f6] text-ink`}>Annulé</span>}
                </div>
                {sg.body && <p className="mt-1 line-clamp-2 text-sm text-ink/80">{sg.body}</p>}
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>{sg.status === "signe" && sg.signed_at ? `Signé le ${fmtDate(sg.signed_at, "fr", true)} par ${sg.signed_name || "le client"}` : `Envoyé le ${fmtDate(sg.created_at, "fr")}`}</span>
                  {sg.status === "a_signer" && <button type="button" className={removeBtn} aria-label={`Annuler la demande de signature : ${sg.title}`} onClick={() => cancel(sg)}>Annuler</button>}
                </div>
              </li>
            ))}
          </ul>
        ))}
      </Loadable>
      <form onSubmit={add} className="mt-4 space-y-3 border-t border-line pt-4">
        <div><label htmlFor="sg-title" className="label">Titre du document à approuver</label><input id="sg-title" name="title" required maxLength={200} placeholder="Ex. Lettre de mission" className="field min-h-11 py-2" /></div>
        <div><label htmlFor="sg-body" className="label">Texte que le client approuve</label><textarea id="sg-body" name="body" rows={3} maxLength={6000} placeholder="Ex. J'ai lu la lettre de mission et j'en accepte les conditions." className="field resize-y" /></div>
        <button type="submit" className={smallBtn}>Envoyer pour signature</button>
      </form>
    </Card>
  );
}

const APPT_MODE: Record<string, string> = { bureau: "Au bureau", telephone: "Par téléphone", video: "En visioconférence" };
/** Demandes de rendez-vous du client : rien n'est confirmé tant que le cabinet n'a pas choisi la date et l'heure. */
export function Appointments({ dossierId }: { dossierId: string }) {
  const load = useLoad(() => rows<Appointment>(supabase().from("appointment_requests").select("*").eq("dossier_id", dossierId).order("created_at", { ascending: false })), dossierId);
  const [err, setErr] = useState<Record<string, string>>({});
  const patch = (a: Appointment, p: Partial<Appointment>, ok: string, undo?: () => void) => {
    const back = Object.fromEntries(Object.keys(p).map((k) => [k, a[k as keyof Appointment]])) as Partial<Appointment>;
    load.set((l) => l?.map((x) => (x.id === a.id ? { ...x, ...p } : x)) ?? null);
    return save(supabase().from("appointment_requests").update(p).eq("id", a.id), { ok, undo, rollback: () => load.set((l) => l?.map((x) => (x.id === a.id ? { ...x, ...back } : x)) ?? null) });
  };
  const confirm = (a: Appointment) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const at = montrealISO(String(f.get("date") ?? ""), String(f.get("time") ?? ""));
    if (!at) { setErr((x) => ({ ...x, [a.id]: "Choisissez une date et une heure." })); return; }
    setErr((x) => ({ ...x, [a.id]: "" }));
    const p = { status: "confirme" as const, confirmed_at: at, staff_note: String(f.get("note") ?? "").trim().slice(0, 300) };
    patch(a, p, `Rendez-vous confirmé : ${fmtDate(at, "fr")} à ${clockFmt.format(new Date(at))}.`, () => { patch({ ...a, ...p }, { status: a.status, confirmed_at: a.confirmed_at, staff_note: a.staff_note }, "Confirmation annulée."); });
  };
  const cancel = (a: Appointment, note: string) => {
    const p = { status: "annule" as const, confirmed_at: null, staff_note: note.trim().slice(0, 300) || a.staff_note };
    patch(a, p, "Rendez-vous annulé.", () => { patch({ ...a, ...p }, { status: a.status, confirmed_at: a.confirmed_at, staff_note: a.staff_note }, "Rendez-vous rétabli."); });
  };
  return (
    <Card title="Rendez-vous">
      <p className="-mt-2 mb-3 text-xs text-muted">Le client propose une préférence ; le rendez-vous n'existe que lorsque vous le confirmez avec une date et une heure (heure de Montréal).</p>
      <Loadable load={load} label="Chargement des rendez-vous" rows={1}>
        {(list) => (list.length === 0 ? <p className="text-sm text-muted">Aucune demande de rendez-vous pour ce dossier. Le client peut en faire une depuis son espace.</p> : (
          <ul className="space-y-3">
            {list.map((a) => (
              <li key={a.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{APPT_MODE[a.mode] ?? a.mode}</p>
                  {a.status === "confirme" ? <span className={`${pill} bg-[#e6f4ea] text-[#1e5b2e]`}>Confirmé</span> : a.status === "demande" ? <span className={warnPill}>À confirmer</span> : <span className={`${pill} bg-[#eef0f6] text-ink`}>Annulé</span>}
                </div>
                <p className="mt-1 text-sm text-ink/80">Préférence du client : {a.preference || "non précisée"}</p>
                <p className="text-xs text-muted">Demandé le {fmtDate(a.created_at, "fr", true)}</p>
                {a.status === "confirme" && a.confirmed_at && <p className="mt-2 text-sm font-semibold text-navy">Le {fmtDate(a.confirmed_at, "fr")} à {clockFmt.format(new Date(a.confirmed_at))}</p>}
                {a.status !== "demande" && a.staff_note && <p className="mt-1 text-sm text-ink/80">Note au client : {a.staff_note}</p>}
                {a.status === "demande" && (
                  <form onSubmit={confirm(a)} className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div><label htmlFor={`ap-d-${a.id}`} className="label">Date</label><input id={`ap-d-${a.id}`} name="date" type="date" required min={todayISO()} className="field min-h-11 py-2" /></div>
                    <div><label htmlFor={`ap-t-${a.id}`} className="label">Heure</label><input id={`ap-t-${a.id}`} name="time" type="time" required step={300} className="field min-h-11 py-2" /></div>
                    <div className="sm:col-span-2"><label htmlFor={`ap-n-${a.id}`} className="label">Note au client (facultatif)</label><input id={`ap-n-${a.id}`} name="note" maxLength={300} placeholder="Ex. Nous vous appellerons au numéro du dossier." className="field min-h-11 py-2" /></div>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                      <button type="submit" className="btn-primary min-h-11 px-5 py-2 text-sm">Confirmer le rendez-vous</button>
                      <button type="button" className={removeBtn} onClick={(e) => cancel(a, (e.currentTarget.form?.elements.namedItem("note") as HTMLInputElement | null)?.value ?? "")}>Annuler la demande</button>
                    </div>
                    <p role="alert" className={err[a.id] ? "rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00] sm:col-span-2" : "sr-only"}>{err[a.id] ?? ""}</p>
                  </form>
                )}
                {a.status === "confirme" && <button type="button" className={`${removeBtn} mt-1`} aria-label="Annuler ce rendez-vous confirmé" onClick={() => cancel(a, "")}>Annuler le rendez-vous</button>}
              </li>
            ))}
          </ul>
        ))}
      </Loadable>
    </Card>
  );
}

/** Fiche d'un dossier : le travail à gauche, les échanges à droite (colonne fixe quand la place le permet). */
export function DossierDetail({ d, staffName, team, railTop, focus, onFocused, onPatch, onMove, onTouch, onInvoices }: {
  onFocused?: () => void; onInvoices?: (dossierId: string, list: Invoice[]) => void; d: Dossier; staffName: string; team: string[]; railTop: string; focus?: { what: Focus; n: number } | null; onPatch: (p: Partial<Dossier>, o?: PatchOpts) => Promise<boolean>; onMove: (status: string) => void; onTouch: () => void;
}) {
  useEffect(() => { onTouch(); }, [onTouch]);
  const rail = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(onFocused);
  done.current = onFocused;
  // Arrivée depuis une fiche client ou la recherche : on amène la bonne carte à l'écran et on y place le focus.
  useEffect(() => {
    if (!focus) return;
    const id = window.setTimeout(() => {
      const el = root.current?.querySelector<HTMLElement>(`[data-focus="${focus.what}"]`);
      if (!el) return;
      el.scrollIntoView({ block: "start" });
      (el.querySelector<HTMLElement>(focus.what === "facture" ? "input[name=label]" : focus.what === "messages" ? "textarea" : "[tabindex]") ?? el).focus({ preventScroll: true });
      // Une fois appliqué, le repère est effacé : ouvrir ensuite un autre dossier ne doit pas y ramener.
      done.current?.();
    }, 60);
    return () => window.clearTimeout(id);
  }, [focus]);
  return (
    <div ref={root} className="@container">
      <DossierHeader d={d} />
      <button type="button" onClick={() => { rail.current?.scrollIntoView({ block: "start" }); rail.current?.focus(); }} className={`${smallBtn} mt-4 @[50rem]:hidden`}>Aller aux messages et aux notes</button>
      <div className="mt-6 grid gap-6 @[50rem]:grid-cols-[minmax(0,1fr)_21rem] @[50rem]:items-start">
        <div className="min-w-0 space-y-6">
          <FollowUp d={d} team={team} onPatch={onPatch} onMove={onMove} />
          <Tasks d={d} team={team} />
          <Requests d={d} staffName={staffName} />
          <ClientValue d={d} onPatch={onPatch} />
          <div data-focus="documents" tabIndex={-1} className="scroll-mt-24"><Documents dossierId={d.id} role="cabinet" lang="fr" /></div>
          <Signatures dossierId={d.id} />
          <div data-focus="rdv" tabIndex={-1} className="scroll-mt-24"><Appointments dossierId={d.id} /></div>
          <div data-focus="facture" className="scroll-mt-24"><DossierInvoices dossierId={d.id} onList={onInvoices} /></div>
        </div>
        <aside ref={rail} tabIndex={-1} aria-label="Échanges et notes" className={`min-w-0 scroll-mt-28 space-y-6 @[50rem]:sticky @[50rem]:max-h-[calc(100svh-8.5rem)] @[50rem]:overflow-y-auto @[50rem]:rounded-3xl ${railTop}`}>
          <div data-focus="messages" className="scroll-mt-24"><Messages dossierId={d.id} role="cabinet" lang="fr" authorName={staffName} aiDraft={() => askAi(d.id, "reply")} /></div>
          <Notes dossierId={d.id} staffName={staffName} />
          <AiSummary dossierId={d.id} />
          <Journal dossierId={d.id} />
        </aside>
      </div>
    </div>
  );
}
