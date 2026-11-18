"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Lang } from "@/lib/site";
import { AppFrame, Card, Documents, Messages, KINDS, STATUSES, fmtDate, statusLabel, type DocRequest, type Dossier } from "./shared";

const tx = {
  fr: {
    title: "Mon espace client", sub: "Pilote Fiscal", none: "Aucun dossier n'est encore lié à ce courriel.",
    noneD: "Si vous êtes déjà client, vérifiez que vous utilisez le courriel donné au cabinet, ou écrivez-nous.",
    mine: "Mes dossiers", progress: "Où en est votre dossier", next: "Prochaine étape", due: "Échéance", year: "Année",
    toProvide: "Documents à fournir", received: "Reçu", waiting: "À fournir", allGood: "Rien à fournir pour l'instant.", updated: "Mis à jour le",
  },
  en: {
    title: "My client portal", sub: "Pilote Fiscal", none: "No file is linked to this email yet.",
    noneD: "If you are already a client, make sure you are using the email you gave the firm, or write to us.",
    mine: "My files", progress: "Where your file stands", next: "Next step", due: "Deadline", year: "Year",
    toProvide: "Documents to provide", received: "Received", waiting: "To provide", allGood: "Nothing to provide for now.", updated: "Updated on",
  },
};

function View({ lang, email }: { lang: Lang; email: string }) {
  const t = tx[lang];
  const [dossiers, setDossiers] = useState<Dossier[] | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [reqs, setReqs] = useState<DocRequest[]>([]);

  useEffect(() => {
    supabase().from("dossiers").select("*").order("updated_at", { ascending: false }).then(({ data }) => {
      const list = (data as Dossier[]) ?? [];
      setDossiers(list);
      setCurrent((c) => c ?? list[0]?.id ?? null);
    });
  }, []);
  useEffect(() => {
    if (!current) return;
    supabase().from("document_requests").select("*").eq("dossier_id", current).order("created_at").then(({ data }) => setReqs((data as DocRequest[]) ?? []));
  }, [current]);

  if (!dossiers) return <p className="text-muted" role="status">…</p>;
  if (dossiers.length === 0)
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-white p-7">
        <p className="font-display text-xl font-semibold text-ink">{t.none}</p>
        <p className="mt-2 leading-relaxed text-muted">{t.noneD}</p>
      </div>
    );
  const d = dossiers.find((x) => x.id === current) ?? dossiers[0];
  const step = STATUSES.indexOf(d.status as (typeof STATUSES)[number]);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <nav aria-label={t.mine}>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.14em] text-navy/70 uppercase">{t.mine}</h2>
        <ul className="space-y-2">
          {dossiers.map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => setCurrent(x.id)} aria-current={x.id === d.id ? "true" : undefined} className="w-full rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-sky-50">
                <span className="block font-display font-semibold text-ink">{x.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{statusLabel[x.status]?.[lang] ?? x.status}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-6">
        <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-navy">{d.title}</h2>
          <p className="mt-1 text-sm text-muted">{KINDS[d.kind]?.[lang] ?? d.kind}{d.tax_year ? ` · ${t.year} ${d.tax_year}` : ""} · {t.updated} {fmtDate(d.updated_at, lang)}</p>
          <h3 className="mt-5 text-xs font-semibold tracking-[0.14em] text-navy/70 uppercase">{t.progress}</h3>
          <ol className="mt-3 grid gap-2 sm:grid-cols-7">
            {STATUSES.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined} className={`rounded-xl border px-3 py-2 text-sm leading-snug ${i < step ? "border-sky bg-sky-50 text-navy" : i === step ? "border-navy bg-navy font-semibold text-white" : "border-line text-muted"}`}>
                <span className="block text-xs opacity-80">{i + 1}</span>
                {statusLabel[s][lang]}
              </li>
            ))}
          </ol>
          {(d.next_step || d.due_date) && (
            <dl className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
              {d.next_step && <div><dt className="text-xs font-semibold tracking-[0.14em] text-navy/70 uppercase">{t.next}</dt><dd className="mt-1 leading-relaxed whitespace-pre-line text-ink">{d.next_step}</dd></div>}
              {d.due_date && <div><dt className="text-xs font-semibold tracking-[0.14em] text-navy/70 uppercase">{t.due}</dt><dd className="mt-1 font-display font-semibold text-ink">{fmtDate(d.due_date, lang)}</dd></div>}
            </dl>
          )}
        </section>
        <Card title={t.toProvide}>
          {reqs.length === 0 ? <p className="text-sm text-muted">{t.allGood}</p> : (
            <ul className="space-y-2">
              {reqs.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                  <span className={r.received ? "text-muted line-through" : "text-ink"}>{r.label}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${r.received ? "bg-sky-50 text-navy" : "bg-[#fff4e5] text-[#6b3d00]"}`}>{r.received ? t.received : t.waiting}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Documents key={`d-${d.id}`} dossierId={d.id} role="client" lang={lang} />
        <Messages key={`m-${d.id}`} dossierId={d.id} role="client" lang={lang} authorName={d.client_name || email} />
      </div>
    </div>
  );
}

export function Portal({ lang }: { lang: Lang }) {
  const t = tx[lang];
  return <AppFrame lang={lang} title={t.title} subtitle={t.sub} demo="client">{(s) => <View lang={lang} email={s.email} />}</AppFrame>;
}
