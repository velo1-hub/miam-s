"use client";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { KINDS, save, statusLabel, toast, type Dossier } from "../shared";
import { Dialog, Loadable, newId, plural, rows, smallBtn, useLoad, warnPill } from "./common";

/* ───────────── Reconduction annuelle : un nouveau dossier pour l'année suivante ───────────── */
const ROLL_STATUSES = ["transmis", "ferme"];
/** Titre de l'année suivante : l'année est remplacée si elle figure dans le titre, sinon ajoutée à la fin. */
export function rollTitle(title: string, year: number): string {
  const re = new RegExp(`\\b(${year}|${year + 1})\\b`, "g");
  if (!new RegExp(`\\b${year}\\b`).test(title)) return `${title.slice(0, 155).trimEnd()} ${year + 1}`;
  return title.replace(re, (y) => String(Number(y) + 1)).slice(0, 160);
}
const sameMandate = (a: Dossier, email: string, kind: string, year: number) => a.client_email === email && a.kind === kind && a.tax_year === year;

type Line = { src: Dossier; target: number; title: string; exists: Dossier | null; twin: boolean };
type Removed = (ids: string[]) => void;

/** Supprime les dossiers créés par une reconduction, avec leurs documents demandés. */
async function removeCreated(ids: string[], onRemoved: Removed, ok?: string) {
  const db = supabase();
  const done = await save(
    (async () => {
      for (const id of ids) {
        const a = await db.from("document_requests").delete().eq("dossier_id", id);
        if (a.error) return a;
        const b = await db.from("dossiers").delete().eq("id", id);
        if (b.error) return b;
      }
      return { error: null };
    })(),
    { ok },
  );
  if (done) onRemoved(ids);
  return done;
}

/**
 * `one` : reconduire ce dossier. Sans `one` : choisir une année, puis les dossiers transmis ou fermés à reconduire.
 * Rien n'est créé avant la confirmation ; un dossier déjà ouvert pour le même client, le même type et l'année visée n'est jamais recréé.
 */
export function RollForward({ dossiers, one, onClose, onCreated, onRemoved }: { dossiers: Dossier[]; one: Dossier | null; onClose: () => void; onCreated: (list: Dossier[]) => void; onRemoved: Removed }) {
  const years = useMemo(() => [...new Set(dossiers.filter((d) => ROLL_STATUSES.includes(d.status) && d.tax_year != null).map((d) => d.tax_year!))].sort((a, b) => b - a), [dossiers]);
  const [year, setYear] = useState<number | null>(one?.tax_year ?? years[0] ?? null);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  // Les erreurs s'affichent dans la fenêtre : les messages du bas de l'écran passent derrière elle.
  const [err, setErr] = useState("");

  const lines = useMemo<Line[]>(() => {
    const sources = one ? [one] : dossiers.filter((d) => ROLL_STATUSES.includes(d.status) && d.tax_year === year).sort((a, b) => a.client_name.localeCompare(b.client_name, "fr"));
    const seen = new Set<string>();
    return sources.filter((d) => d.tax_year != null).map((src) => {
      const target = src.tax_year! + 1;
      const key = `${src.client_email}|${src.kind}|${target}`;
      const twin = seen.has(key);
      seen.add(key);
      return { src, target, title: rollTitle(src.title, src.tax_year!), exists: dossiers.find((x) => sameMandate(x, src.client_email, src.kind, target)) ?? null, twin };
    });
  }, [dossiers, one, year]);
  const ids = lines.map((l) => l.src.id).join(",");
  // Les documents demandés de chaque dossier d'origine : seuls les libellés sont repris.
  const labels = useLoad(async () => {
    const lists = await Promise.all(lines.map((l) => rows<{ label: string }>(supabase().from("document_requests").select("label,created_at").eq("dossier_id", l.src.id).order("created_at"))));
    return Object.fromEntries(lines.map((l, i) => [l.src.id, [...new Set(lists[i].map((r) => r.label))]])) as Record<string, string[]>;
  }, ids);

  const ready = lines.filter((l) => !l.exists && !l.twin);
  const chosen = ready.filter((l) => !off.has(l.src.id));
  const skipped = lines.length - ready.length;
  const target = one ? (one.tax_year ?? 0) + 1 : (year ?? 0) + 1;

  const create = async (close: () => void) => {
    const map = labels.data;
    if (!map || !chosen.length || busy || !chosen.every((l) => l.src.id in map)) return;
    setBusy(true);
    setErr("");
    const stop = (m: string) => { setErr(m); setBusy(false); };
    const db = supabase();
    // Dernière vérification dans la base : la liste à l'écran ne contient que les dossiers chargés.
    const fresh: Line[] = [];
    let already = 0;
    try {
      for (const l of chosen) {
        const found = await rows<{ id: string }>(db.from("dossiers").select("id").eq("client_email", l.src.client_email).eq("kind", l.src.kind).eq("tax_year", l.target).limit(1));
        if (found.length) already++; else fresh.push(l);
      }
    } catch { stop("Vérification impossible. Rien n'a été créé. Vérifiez votre connexion."); return; }
    if (!fresh.length) { stop(`Rien n'a été créé : ${already > 1 ? "ces dossiers existent" : "ce dossier existe"} déjà pour ${target}.`); return; }

    const payload = fresh.map((l) => ({ id: newId(), client_email: l.src.client_email, client_name: l.src.client_name, kind: l.src.kind, title: l.title, tax_year: l.target, status: "ouvert", ...(l.src.assignee ? { assignee: l.src.assignee } : {}) }));
    const newIds = payload.map((p) => p.id);
    let made: Dossier[] = [];
    const ok = await save(db.from("dossiers").insert(payload).select().then((r) => { made = (r.data as Dossier[] | null) ?? []; return r; }));
    if (!ok) { stop("Les dossiers n'ont pas pu être créés. Vérifiez votre connexion et réessayez."); return; }
    const base = Date.now();
    const reqs = fresh.flatMap((l, i) => (map[l.src.id] ?? []).map((label, j) => ({ dossier_id: payload[i].id, label, received: false, created_at: new Date(base + j).toISOString() })));
    // Si la liste des documents ne peut pas être copiée, les dossiers créés sont retirés : pas de reconduction à moitié faite.
    if (reqs.length && !(await save(db.from("document_requests").insert(reqs), { rollback: () => { void removeCreated(newIds, () => {}); } }))) { stop("La liste des documents n'a pas pu être copiée. Les dossiers créés ont été retirés ; réessayez."); return; }
    const list = payload.map((p) => ({ next_step: "", due_date: null, lead_id: null, ...(made.find((m) => m.id === p.id) ?? { ...p, created_at: new Date(base).toISOString(), updated_at: new Date(base).toISOString() }) })) as Dossier[];
    onCreated(list);
    const what = list.length === 1 ? `Dossier ${target} créé pour ${list[0].client_name}` : `${list.length} dossiers ${target} créés`;
    toast(`${what}${reqs.length ? `, ${plural(reqs.length, "document à demander", "documents à demander")}` : ""}.${already ? ` ${plural(already, "dossier existait déjà : non recréé", "dossiers existaient déjà : non recréés")}.` : ""}`, "ok", () => { void removeCreated(newIds, onRemoved, list.length > 1 ? `Reconduction annulée : ${list.length} dossiers supprimés.` : "Reconduction annulée : dossier supprimé."); });
    setBusy(false);
    close();
  };

  return (
    <Dialog title={one ? `Reconduire pour ${target}` : "Reconduction annuelle"} onClose={onClose} wide>
      {(close) => (
        <>
          {!one && (
            years.length === 0 ? <p className="text-sm text-muted">Aucun dossier transmis ou fermé ne porte une année visée. Rien à reconduire pour l'instant.</p> : (
              <div className="mb-4">
                <label htmlFor="rf-year" className="label">Année à reconduire</label>
                <select id="rf-year" value={year ?? ""} onChange={(e) => { setYear(Number(e.target.value)); setOff(new Set()); }} aria-describedby="rf-year-h" className="field min-h-11 w-auto py-2">
                  {years.map((y) => <option key={y} value={y}>{y} vers {y + 1}</option>)}
                </select>
                <p id="rf-year-h" className="mt-1.5 text-xs text-muted">Seuls les dossiers transmis ou fermés de cette année sont proposés.</p>
              </div>
            )
          )}
          {lines.length > 0 && (
            <>
              <p className="mb-3 text-sm text-ink">Chaque nouveau dossier reprend le client, son courriel, le type de mandat et le responsable. Il s'ouvre à l'étape « {statusLabel.ouvert.fr} », avec la même liste de documents demandés, tous à recevoir. Le client le voit dans son espace.</p>
              <Loadable load={labels} label="Chargement des documents demandés" rows={2}>
                {(map) => (
                  <ul className="space-y-2">
                    {lines.map((l) => {
                      const blocked = !!l.exists || l.twin;
                      const docs = map[l.src.id] ?? [];
                      return (
                        <li key={l.src.id} className={`rounded-xl border border-line px-3 py-2.5 ${blocked ? "bg-[#f5f7fb]" : ""}`}>
                          <div className="flex items-start gap-3">
                            {!one && <input id={`rf-${l.src.id}`} type="checkbox" disabled={blocked} checked={!blocked && !off.has(l.src.id)} onChange={(e) => setOff((s) => { const n = new Set(s); if (e.target.checked) n.delete(l.src.id); else n.add(l.src.id); return n; })} className="mt-1 h-5 w-5 shrink-0 accent-navy" />}
                            <div className="min-w-0 flex-1">
                              <label htmlFor={one ? undefined : `rf-${l.src.id}`} className="block font-semibold text-ink">{l.src.client_name} <span className="font-normal text-muted">· {l.src.client_email}</span></label>
                              {blocked ? (
                                <p className="mt-1 text-sm text-ink"><span className={warnPill}>{l.exists ? "Existe déjà" : "En double"}</span> {l.exists ? `Le dossier « ${l.exists.title} » existe déjà pour ${l.target} (même client, même type de mandat). Il ne sera pas recréé.` : `Un autre dossier de cette liste donne déjà le dossier ${l.target} de ce client pour ce type de mandat.`}</p>
                              ) : (
                                <>
                                  <p className="mt-0.5 text-sm text-ink">À créer : « {l.title} » · {KINDS[l.src.kind]?.fr ?? l.src.kind} · {l.target} · {l.src.assignee || "Non attribué"}</p>
                                  <p className="text-xs text-muted">D'après « {l.src.title} » ({statusLabel[l.src.status]?.fr ?? l.src.status}).</p>
                                  {docs.length === 0 ? <p className="mt-1 text-xs text-muted">Aucun document demandé à reprendre.</p> : (
                                    <details open={!!one} className="mt-1 text-sm">
                                      <summary className="cursor-pointer rounded font-medium text-navy underline underline-offset-4">{plural(docs.length, "document à demander", "documents à demander")}</summary>
                                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink/80">{docs.map((x) => <li key={x}>{x}</li>)}</ul>
                                    </details>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Loadable>
            </>
          )}
          {!one && year != null && lines.length === 0 && <p className="text-sm text-muted">Aucun dossier transmis ou fermé pour {year}.</p>}
          <p role="status" aria-live="polite" className="mt-4 text-sm text-ink">
            {lines.length === 0 ? "" : chosen.length === 0 ? "Rien à créer." : `${plural(chosen.length, "dossier sera créé", "dossiers seront créés")} pour ${target}.`}{skipped > 0 ? ` ${plural(skipped, "dossier ne sera pas recréé", "dossiers ne seront pas recréés")}.` : ""}
          </p>
          <p role="alert" className={err ? "mt-3 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{err}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" disabled={busy || !labels.data || chosen.length === 0 || !chosen.every((l) => l.src.id in labels.data!)} onClick={() => create(close)} className="btn-primary min-h-11 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Création…" : chosen.length > 1 ? `Créer les ${chosen.length} dossiers` : "Créer le dossier"}</button>
            <button type="button" onClick={close} className={smallBtn}>Annuler</button>
          </div>
          <p className="mt-3 text-xs text-muted">Après la création, le message de confirmation offre « Annuler » : les dossiers créés sont alors supprimés.</p>
        </>
      )}
    </Dialog>
  );
}
