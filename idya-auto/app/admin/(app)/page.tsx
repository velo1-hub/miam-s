import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import Link from "next/link";
import { getLeadRepository } from "@/lib/leads";
import { nowMs } from "@/lib/utils/time";
import { getAdminVehicleRepository } from "@/lib/vehicles/admin-repository";
import { vehicleFullTitle } from "@/lib/vehicles/types";
import { LeadRow } from "@/components/admin/lead-row";

/** Accueil — brief §15: vehicles in stock, average days in stock, new leads today / 7 days, test drives this week, latest leads. */
async function AdminHomeContent() {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const [vehiclesRepo, leadsRepo] = await Promise.all([getAdminVehicleRepository(), getLeadRepository()]);
  const vehicles = await vehiclesRepo.listAll();
  const inStock = vehicles.filter((v) => v.status === "available" || v.status === "pending");
  const now = nowMs();
  const avgDays = inStock.length ? Math.round(inStock.reduce((s, v) => s + (now - new Date(v.publishedAt ?? v.createdAt).getTime()) / 86_400_000, 0) / inStock.length) : 0;
  const stats = await leadsRepo.stats();
  const latest = await leadsRepo.listLeads({ limit: 8 });
  const briefs = await Promise.all(latest.map((l) => leadsRepo.getAiBrief(l.id)));
  const byId = new Map(vehicles.map((v) => [v.id, vehicleFullTitle(v)]));
  const tiles = [
    { label: "Véhicules en stock", value: inStock.length, href: "/admin/vehicules" },
    { label: "Jours en stock (moyenne)", value: avgDays, href: "/admin/vehicules" },
    { label: "Nouveaux leads aujourd'hui", value: stats.newToday, href: "/admin/leads" },
    { label: "Leads sur 7 jours", value: stats.newWeek, href: "/admin/leads" },
    { label: "Essais cette semaine", value: stats.bookingsThisWeek, href: "/admin/essais" },
  ];
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h2">Accueil</h1>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="glass-lite block rounded-card-sm p-4 hover:bg-white/[0.06]">
              <p className="text-caption text-text-3">{t.label}</p>
              <p className="tabular mt-1 text-[28px] font-semibold text-text">{t.value}</p>
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-h3">Derniers leads</h2>
          <Link href="/admin/leads" className="text-small text-text-2 hover:text-text">Tout voir →</Link>
        </div>
        <ul className="divide-y divide-line rounded-card-sm border border-line">
          {latest.map((l, i) => <LeadRow key={l.id} lead={l} brief={briefs[i]} vehicleTitle={l.vehicleId ? (byId.get(l.vehicleId) ?? null) : null} />)}
        </ul>
      </section>
    </div>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminHomeContent />
    </Suspense>
  );
}
