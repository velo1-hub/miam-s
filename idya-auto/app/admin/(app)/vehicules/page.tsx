import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createVehicleAction } from "@/app/admin/actions";
import { BulkStatus } from "@/components/admin/bulk-status";
import { Button } from "@/components/ui/button";
import { formatKm, formatPrice } from "@/lib/format/number";
import { getLeadRepository } from "@/lib/leads";
import { nowMs } from "@/lib/utils/time";
import { getAdminVehicleRepository } from "@/lib/vehicles/admin-repository";
import { coverImage } from "@/lib/vehicles/media";
import { vehicleFullTitle, type VehicleStatus } from "@/lib/vehicles/types";

const STATUS_FR: Record<VehicleStatus, string> = { draft: "Brouillon", available: "Disponible", pending: "Réservé", sold: "Vendu", archived: "Archivé" };

/** Véhicules — brief §15: table with thumbnail, stock #, year/make/model, price, km, status, days in stock, leads count; search, filters, bulk status. */
async function AdminVehiclesContent({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const { q = "", status = "" } = await searchParams;
  const [repo, leadsRepo] = await Promise.all([getAdminVehicleRepository(), getLeadRepository()]);
  const leads = await leadsRepo.listLeads({ limit: 1000 });
  const leadCount = new Map<string, number>();
  for (const l of leads) if (l.vehicleId) leadCount.set(l.vehicleId, (leadCount.get(l.vehicleId) ?? 0) + 1);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const all = await repo.listAll();
  const list = all.filter((v) => (!status || v.status === status) && (!q || norm(`${v.year} ${v.make} ${v.model} ${v.trim ?? ""} ${v.stockNumber} ${v.vin ?? ""}`).includes(norm(q))));
  const now = nowMs();
  const rows = list.map((v) => ({ v, cover: coverImage(v), days: Math.round((now - new Date(v.publishedAt ?? v.createdAt).getTime()) / 86_400_000), leads: leadCount.get(v.id) ?? 0, title: vehicleFullTitle(v) || "(sans titre)" }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2">Véhicules <span className="tabular text-text-3">{list.length}</span></h1>
        <form action={createVehicleAction}><Button type="submit" variant="light" size="md">Ajouter un véhicule</Button></form>
      </div>
      <form className="no-red flex flex-wrap gap-2" method="get">
        <input name="q" type="search" defaultValue={q} placeholder="Recherche : stock, NIV, marque, modèle" className="h-10 min-w-0 flex-1 basis-full sm:basis-auto rounded-pill border border-line bg-surface px-4 text-small text-text outline-none focus:border-text" />
        <select name="status" defaultValue={status} className="h-10 rounded-pill border border-line bg-surface px-3 text-small text-text outline-none">
          <option value="">Tous les statuts</option>
          {(Object.keys(STATUS_FR) as VehicleStatus[]).map((s) => <option key={s} value={s}>{STATUS_FR[s]}</option>)}
        </select>
        <Button type="submit" variant="secondary" size="md">Filtrer</Button>
      </form>
      <BulkStatus>
        {/* Phones: one card per vehicle (no horizontal scrolling); the table below takes over from md */}
        <ul className="divide-y divide-line rounded-card-sm border border-line md:hidden">
          {rows.map(({ v, cover, days, leads: n, title }) => (
            <li key={v.id} className="flex items-start gap-3 px-3 py-3">
              <input type="checkbox" name="ids" value={v.id} aria-label={`Sélectionner ${title}`} className="mt-3.5 size-5 shrink-0 accent-white" />
              <Link href={`/admin/vehicules/${v.id}`} className="flex min-w-0 flex-1 items-start gap-3 rounded-card-sm active:bg-white/[0.04]">
                <span className="relative mt-0.5 block h-12 w-16 shrink-0 overflow-hidden rounded-chip bg-studio-bottom">{cover && <Image src={cover.src} alt="" width={128} height={96} sizes="64px" className="h-full w-full object-cover" />}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-small font-medium text-text">{title}</span>
                  <span className="tabular truncate text-caption text-text-3">{v.stockNumber || "—"} · {formatKm(v.odometerKm, "fr")} · {days} j · {n} lead{n > 1 ? "s" : ""}</span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="tabular text-small text-text">{v.priceCad ? formatPrice(v.priceCad, "fr") : "—"}</span>
                    <span className="rounded-pill border border-line px-2 py-0.5 text-caption text-text-2">{STATUS_FR[v.status]}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-8 text-center text-small text-text-3">Aucun véhicule.</li>}
        </ul>
        <div className="hidden overflow-x-auto rounded-card-sm border border-line md:block">
          <table className="w-full min-w-[900px] text-small">
            <thead className="text-left text-caption text-text-3">
              <tr>
                <th className="px-3 py-2"><span className="sr-only">Sélection</span></th>
                <th className="px-3 py-2">Véhicule</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2 text-right">Prix</th>
                <th className="px-3 py-2 text-right">km</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2 text-right">Jours</th>
                <th className="px-3 py-2 text-right">Leads</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ v, cover, days, leads: n, title }) => {
                return (
                  <tr key={v.id} className="border-t border-line hover:bg-white/[0.03]">
                    <td className="px-3 py-2"><input type="checkbox" name="ids" value={v.id} aria-label={`Sélectionner ${title}`} className="size-4 accent-white" /></td>
                    <td className="px-3 py-2">
                      <Link href={`/admin/vehicules/${v.id}`} className="flex items-center gap-3 hover:underline">
                        <span className="relative block h-10 w-14 overflow-hidden rounded-chip bg-studio-bottom">{cover && <Image src={cover.src} alt="" width={112} height={80} sizes="56px" className="h-full w-full object-cover" />}</span>
                        <span className="font-medium text-text">{title}</span>
                      </Link>
                    </td>
                    <td className="tabular px-3 py-2 text-text-2">{v.stockNumber || "—"}</td>
                    <td className="tabular px-3 py-2 text-right text-text">{v.priceCad ? formatPrice(v.priceCad, "fr") : "—"}</td>
                    <td className="tabular px-3 py-2 text-right text-text-2">{formatKm(v.odometerKm, "fr")}</td>
                    <td className="px-3 py-2"><span className="rounded-pill border border-line px-2 py-0.5 text-caption text-text-2">{STATUS_FR[v.status]}</span></td>
                    <td className="tabular px-3 py-2 text-right text-text-2">{days}</td>
                    <td className="tabular px-3 py-2 text-right text-text-2">{n}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </BulkStatus>
    </div>
  );
}

export default function AdminVehicles(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminVehiclesContent searchParams={props.searchParams as never} />
    </Suspense>
  );
}
