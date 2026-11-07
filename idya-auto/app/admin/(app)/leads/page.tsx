import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import Link from "next/link";
import { LEAD_STATUS_FR, LEAD_TYPE_FR, LeadRow } from "@/components/admin/lead-row";
import { Button } from "@/components/ui/button";
import { getLeadRepository } from "@/lib/leads";
import { LEAD_STATUSES, LEAD_TYPES, type LeadStatus, type LeadType } from "@/lib/leads/types";
import { getAdminVehicleRepository } from "@/lib/vehicles/admin-repository";
import { vehicleFullTitle } from "@/lib/vehicles/types";

/** Leads inbox — brief §15/§27.4: by type and status, hot leads first, CSV export. */
async function AdminLeadsContent({ searchParams }: { searchParams: Promise<{ type?: string; status?: string }> }) {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const { type = "", status = "" } = await searchParams;
  const [repo, vrepo] = await Promise.all([getLeadRepository(), getAdminVehicleRepository()]);
  const leads = await repo.listLeads({ type: (type || undefined) as LeadType | undefined, status: (status || undefined) as LeadStatus | undefined, limit: 500 });
  const briefs = new Map((await Promise.all(leads.map(async (l) => [l.id, await repo.getAiBrief(l.id)] as const))));
  const vehicles = new Map((await vrepo.listAll()).map((v) => [v.id, vehicleFullTitle(v)]));
  const score = (id: string) => briefs.get(id)?.score ?? -1;
  const sorted = [...leads].sort((a, b) => (a.status === "new" ? 0 : 1) - (b.status === "new" ? 0 : 1) || score(b.id) - score(a.id) || b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2">Leads <span className="tabular text-text-3">{sorted.length}</span></h1>
        <Button asChild variant="secondary" size="md"><Link href={`/api/admin/leads.csv?type=${type}&status=${status}`}>Exporter CSV</Link></Button>
      </div>
      <form method="get" className="no-red flex flex-wrap gap-2">
        <select name="type" defaultValue={type} className="h-10 rounded-pill border border-line bg-surface px-3 text-small text-text outline-none"><option value="">Tous les types</option>{LEAD_TYPES.map((t) => <option key={t} value={t}>{LEAD_TYPE_FR[t]}</option>)}</select>
        <select name="status" defaultValue={status} className="h-10 rounded-pill border border-line bg-surface px-3 text-small text-text outline-none"><option value="">Tous les statuts</option>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_FR[s]}</option>)}</select>
        <Button type="submit" variant="secondary" size="md">Filtrer</Button>
      </form>
      <ul className="divide-y divide-line rounded-card-sm border border-line">
        {sorted.map((l) => <LeadRow key={l.id} lead={l} brief={briefs.get(l.id) ?? null} vehicleTitle={l.vehicleId ? (vehicles.get(l.vehicleId) ?? null) : null} />)}
        {sorted.length === 0 && <li className="px-4 py-8 text-center text-small text-text-3">Aucun lead.</li>}
      </ul>
    </div>
  );
}

export default function AdminLeads(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminLeadsContent searchParams={props.searchParams as never} />
    </Suspense>
  );
}
