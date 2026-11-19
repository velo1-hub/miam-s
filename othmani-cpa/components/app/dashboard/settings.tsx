"use client";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Card, fmtDate, save } from "../shared";
import { Loadable, link, pill, removeBtn, rows, smallBtn, useLoad, type Member, type Sub } from "./common";
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
