"use client";
import { useEffect, useState } from "react";
import type { Booking, Lead } from "@/lib/db/types";
export default function Admin() {
  const [pw, setPw] = useState(""); const [data, setData] = useState<{ leads: Lead[]; bookings: Booking[] } | null>(null); const [err, setErr] = useState(""); const [tab, setTab] = useState<"bookings" | "leads">("bookings");
  useEffect(() => { const s = sessionStorage.getItem("gnm-admin"); if (s) { setPw(s); load(s); } }, []);
  async function load(p: string) { setErr(""); const r = await fetch("/api/admin", { headers: { "x-admin-password": p } }); if (!r.ok) { setErr("Mot de passe refusé"); return; } sessionStorage.setItem("gnm-admin", p); setData(await r.json()); }
  const csv = (rows: Record<string, unknown>[], name: string) => { const keys = Object.keys(rows[0] ?? {}); const body = [keys.join(","), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))].join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" })); a.download = `${name}.csv`; a.click(); };
  if (!data) return (
    <main className="mx-auto max-w-sm p-8"><h1 className="text-xl font-semibold text-navy-950">Tableau de bord</h1>
      <form onSubmit={(e) => { e.preventDefault(); load(pw); }} className="mt-4 space-y-3"><input type="password" className="field" placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} /><button className="btn btn-dark w-full">Entrer</button>{err && <p className="text-sm text-red-700">{err}</p>}</form></main>
  );
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-navy-950">Tableau de bord</h1>
        <div className="flex gap-2"><button className={`chip ${tab === "bookings" ? "chip-on" : ""}`} onClick={() => setTab("bookings")}>Réservations ({data.bookings.length})</button><button className={`chip ${tab === "leads" ? "chip-on" : ""}`} onClick={() => setTab("leads")}>Demandes ({data.leads.length})</button><button className="chip" onClick={() => csv(data[tab] as never, tab)}>Exporter CSV</button><button className="chip" onClick={() => load(pw)}>Rafraîchir</button></div></div>
      <div className="card mt-6 overflow-x-auto">
        {tab === "bookings" ? (
          <table className="w-full text-left text-[13.5px]"><thead className="bg-sand-100 text-ink-600"><tr>{["Réf.", "Date", "Heure", "Type", "Service", "Client", "Téléphone", "Courriel", "Adresse", "Statut", "Notes"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{data.bookings.map((b) => <tr key={b.id} className="border-t border-line align-top"><td className="px-3 py-2 font-mono">{b.ref}</td><td className="px-3 py-2">{b.date}</td><td className="px-3 py-2">{b.slot_start}–{b.slot_end}</td><td className="px-3 py-2">{b.kind}</td><td className="px-3 py-2">{b.service}</td><td className="px-3 py-2">{b.name}</td><td className="px-3 py-2">{b.phone}</td><td className="px-3 py-2">{b.email}</td><td className="px-3 py-2">{b.address}</td><td className="px-3 py-2">{b.price_min != null ? (b.price_min === b.price_max ? `${b.price_min} $` : `${b.price_min}–${b.price_max} $`) : "—"}</td><td className="px-3 py-2">{b.status}</td><td className="px-3 py-2 max-w-xs">{b.notes}</td></tr>)}</tbody></table>
        ) : (
          <table className="w-full text-left text-[13.5px]"><thead className="bg-sand-100 text-ink-600"><tr>{["Date", "Type", "Nom", "Courriel", "Téléphone", "Service", "Message", "Détails", "Source"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{data.leads.map((l) => <tr key={l.id} className="border-t border-line align-top"><td className="px-3 py-2 whitespace-nowrap">{l.created_at.slice(0, 16).replace("T", " ")}</td><td className="px-3 py-2">{l.type}</td><td className="px-3 py-2">{l.name}</td><td className="px-3 py-2">{l.email}</td><td className="px-3 py-2">{l.phone}</td><td className="px-3 py-2">{l.service}</td><td className="px-3 py-2 max-w-md">{l.message}</td><td className="px-3 py-2 text-[12px] text-ink-600">{l.meta ? Object.entries(l.meta).filter(([k]) => k !== "history_tail").map(([k, v]) => `${k}: ${String(v)}`).join(" · ") : "—"}</td><td className="px-3 py-2">{l.source}</td></tr>)}</tbody></table>
        )}
      </div>
    </main>
  );
}
