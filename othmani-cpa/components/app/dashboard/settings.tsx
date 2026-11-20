"use client";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Card, fmtDate, save } from "../shared";
import { Loadable, link, pill, plural, removeBtn, rows, smallBtn, useLoad, type Member, type OpenDossier, type Sub } from "./common";
/* ───────────── Réglages : équipe et rappels ───────────── */
export function Team({ me }: { me: string }) {
  const load = useLoad(() => rows<Member>(supabase().from("staff").select("email,name,is_admin").order("name")));
  const [err, setErr] = useState("");
  const admin = Boolean(load.data?.find((m) => m.email === me)?.is_admin);
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const m: Member = { email: String(f.get("email")).trim().toLowerCase(), name: String(f.get("name")).trim(), is_admin: false };
    if (load.data?.some((x) => x.email === m.email)) { setErr("Ce courriel est déjà dans l'équipe."); return; }
    setErr("");
    load.set((l) => [...(l ?? []), m]);
    if (await save(supabase().from("staff").insert({ email: m.email, name: m.name }), { ok: `${m.name} fait maintenant partie de l'équipe.`, rollback: () => load.set((l) => l?.filter((x) => x.email !== m.email) ?? null) })) form.reset();
  };
  const remove = (m: Member) => {
    if (!window.confirm(`Retirer ${m.name || m.email} de l'équipe ?\nCette personne n'aura plus accès au tableau de bord.`)) return;
    load.set((l) => l?.filter((x) => x.email !== m.email) ?? null);
    save(supabase().from("staff").delete().eq("email", m.email), { ok: `${m.name || m.email} retiré de l'équipe.`, rollback: () => load.set((l) => [...(l ?? []), m]) });
  };
  return (
    <Card title={`Équipe${load.data ? ` (${load.data.length})` : ""}`}>
      <p className="mb-3 text-sm text-muted">Ces personnes voient tous les prospects, tous les dossiers et tous les documents. Retirez sans délai toute personne qui quitte le cabinet.</p>
      <Loadable load={load} label="Chargement de l'équipe" rows={1}>
        {(list) => (
          <>
            <ul className="divide-y divide-line">
              {list.map((m) => (
                <li key={m.email} className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-1.5">
                  <span className="min-w-0"><span className="font-medium text-ink">{m.name || m.email}</span> <span className="text-sm break-all text-muted">· {m.email}</span></span>
                  <span className="flex items-center gap-2">
                    {m.is_admin && <span className={`${pill} bg-sky-100 text-navy`}>Administrateur</span>}
                    {m.email === me ? <span className="px-2 text-sm text-muted">Vous</span> : admin && !m.is_admin ? <button type="button" className={removeBtn} aria-label={`Retirer ${m.name || m.email} de l'équipe`} onClick={() => remove(m)}>Retirer</button> : null}
                  </span>
                </li>
              ))}
            </ul>
            {admin ? (
              <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div><label htmlFor="tm-name" className="label">Nom</label><input id="tm-name" name="name" required maxLength={120} className="field" /></div>
                <div><label htmlFor="tm-email" className="label">Courriel</label><input id="tm-email" name="email" type="email" required maxLength={200} autoCapitalize="none" className="field" /></div>
                <button type="submit" className="btn-primary min-h-12">Ajouter</button>
              </form>
            ) : <p className="mt-4 rounded-xl bg-[#f5f7fb] px-4 py-3 text-sm text-ink">Seul l'administrateur peut modifier l'équipe.</p>}
            <p role="alert" className={err ? "mt-3 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#6b3d00]" : "sr-only"}>{err}</p>
          </>
        )}
      </Loadable>
    </Card>
  );
}

export function Reminders() {
  const load = useLoad(() => rows<Sub>(supabase().from("reminder_subscribers").select("*").order("consent_at", { ascending: false })));
  const setOff = (s: Sub, at: string | null, ok: string, undo?: () => void) => {
    load.set((l) => l?.map((x) => (x.id === s.id ? { ...x, unsubscribed_at: at } : x)) ?? null);
    save(supabase().from("reminder_subscribers").update({ unsubscribed_at: at }).eq("id", s.id), { ok, undo, rollback: () => load.set((l) => l?.map((x) => (x.id === s.id ? { ...x, unsubscribed_at: s.unsubscribed_at } : x)) ?? null) });
  };
  const unsubscribe = (s: Sub) => {
    const at = new Date().toISOString();
    setOff(s, at, `${s.email} désinscrit.`, () => setOff({ ...s, unsubscribed_at: at }, null, `${s.email} réinscrit.`));
  };
  const resubscribe = (s: Sub) => { if (window.confirm(`Réinscrire ${s.email} aux rappels ?\nFaites-le seulement si cette personne l'a demandé.`)) setOff(s, null, `${s.email} réinscrit.`); };
  const active = (load.data ?? []).filter((s) => !s.unsubscribed_at);
  const csv = () => {
    // Chaque champ est entre guillemets, et un début de formule (=, +, -, @) est neutralisé pour les tableurs.
    const q = (s: string) => `"${(/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"`;
    const blob = new Blob(["courriel,langue,consentement\n" + active.map((s) => [s.email, s.lang, s.consent_at].map(q).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "rappels-fiscaux.csv"; a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Card title={`Inscrits aux rappels fiscaux${load.data ? ` (${active.length})` : ""}`} aside={active.length > 0 && <button type="button" onClick={csv} className={smallBtn}>Exporter (CSV)</button>}>
      <p className="mb-3 text-sm text-muted">Ces personnes ont donné leur consentement explicite pour recevoir les rappels d'échéances. Désinscrivez sans délai toute personne qui le demande.</p>
      <Loadable load={load} label="Chargement des inscriptions" rows={1}>
        {(subs) => (subs.length === 0 ? <p className="text-sm text-muted">Aucune inscription pour l'instant.</p> : (
          <ul className="divide-y divide-line">
            {subs.map((s) => (
              <li key={s.id} className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                <span className={`break-all ${s.unsubscribed_at ? "text-muted line-through" : "font-medium text-ink"}`}>{s.email}</span>
                <span className="flex items-center gap-2 text-muted">
                  {s.lang.toUpperCase()} · {s.unsubscribed_at ? "désinscrit" : fmtDate(s.consent_at, "fr")}
                  {s.unsubscribed_at
                    ? <button type="button" className={`${link} inline-flex min-h-11 items-center px-3 text-sm`} onClick={() => resubscribe(s)}>Réinscrire</button>
                    : <button type="button" className={removeBtn} aria-label={`Désinscrire ${s.email}`} onClick={() => unsubscribe(s)}>Désinscrire</button>}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </Loadable>
    </Card>
  );
}

/* ───────────── Avis des clients : privés, jamais publiés ───────────── */
type Avis = { id: string; dossier_id: string; created_at: string; rating: number; comment: string };
const oneDecimal = new Intl.NumberFormat("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function RatingBar({ value }: { value: number }) {
  return <span className="block h-2 w-28 overflow-hidden rounded-full bg-[#e6e8f2]" aria-hidden="true"><span className="block h-full rounded-full bg-navy" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></span>;
}
/** Avis laissés par les clients à la fin d'un dossier. Lecture seule : le cabinet ne peut ni en ajouter ni les modifier. */
export function Feedback({ openDossier }: { openDossier?: OpenDossier }) {
  // Les noms viennent d'une lecture à part : cette page s'affiche même avant le chargement du tableau de bord.
  const load = useLoad(async () => {
    const db = supabase();
    const [list, dossiers] = await Promise.all([
      rows<Avis>(db.from("feedback").select("*").order("created_at", { ascending: false }).limit(500)),
      rows<{ id: string; client_name: string; title: string }>(db.from("dossiers").select("id,client_name,title").limit(2000)),
    ]);
    return { list, names: new Map(dossiers.map((d) => [d.id, d])) };
  });
  const list = load.data?.list ?? [];
  const average = list.length ? list.reduce((n, x) => n + x.rating, 0) / list.length : 0;
  return (
    <Card title={`Avis des clients${load.data ? ` (${list.length})` : ""}`} aside={<span className={`${pill} bg-[#eef0f6] text-ink`}>Privé</span>}>
      <p className="mb-4 rounded-xl bg-[#fff4e5] px-4 py-3 text-sm text-[#6b3d00]">Ces avis sont privés. Ils servent à améliorer le service du cabinet. Ne les publiez pas comme témoignages, ni sur le site ni ailleurs : les règles de l'Ordre des CPA l'interdisent.</p>
      <Loadable load={load} label="Chargement des avis" rows={1}>
        {({ names }) => (list.length === 0 ? <p className="text-sm text-muted">Aucun avis pour l'instant. Le client peut en laisser un dans son espace, à la fin de son dossier.</p> : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="font-display text-2xl font-bold text-ink" data-avis-moyenne>{oneDecimal.format(average)} sur 5</p>
              <RatingBar value={average} />
              <p className="text-sm text-muted">Moyenne de {plural(list.length, "avis", "avis")}.</p>
            </div>
            <ul className="divide-y divide-line">
              {list.map((x) => {
                const d = names.get(x.dossier_id);
                return (
                  <li key={x.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-semibold text-ink">{x.rating} sur 5</p>
                      <RatingBar value={x.rating} />
                      <p className="text-xs text-muted">{fmtDate(x.created_at, "fr")}</p>
                    </div>
                    {x.comment.trim() ? <p className="mt-1.5 leading-relaxed whitespace-pre-line text-ink">{x.comment}</p> : <p className="mt-1.5 text-sm text-muted">Sans commentaire.</p>}
                    <p className="mt-1 text-sm text-muted">{d ? <>{d.client_name} · {openDossier ? <button type="button" onClick={() => openDossier(d.id)} className={link}>{d.title}</button> : d.title}</> : "Dossier introuvable"}</p>
                  </li>
                );
              })}
            </ul>
          </>
        ))}
      </Loadable>
    </Card>
  );
}
