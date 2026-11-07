import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import Link from "next/link";
import { BookingStatusSelect } from "@/components/admin/booking-status";
import { TZDate } from "@date-fns/tz";
import { formatTime, weekdayName } from "@/lib/format/date";
import { getLeadRepository } from "@/lib/leads";
import { getAdminVehicleRepository } from "@/lib/vehicles/admin-repository";
import { vehicleTitle } from "@/lib/vehicles/types";

/** Essais routiers — brief §15: week calendar of bookings. ?week=YYYY-MM-DD selects a Monday. */
async function AdminBookingsContent({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const { week } = await searchParams;
  const now = new TZDate(new Date(), "America/Toronto");
  const monday = week ? new TZDate(`${week}T00:00:00`, "America/Toronto") : new TZDate(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7), "America/Toronto");
  const days = Array.from({ length: 7 }, (_, i) => new TZDate(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, "America/Toronto"));
  const from = new Date(days[0].getTime()).toISOString();
  const to = new Date(days[6].getTime() + 86_400_000).toISOString();
  const [repo, vrepo] = await Promise.all([getLeadRepository(), getAdminVehicleRepository()]);
  const bookings = (await repo.bookingsBetween(from, to)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const leads = new Map(await Promise.all(bookings.map(async (b) => [b.id, await repo.getLead(b.leadId)] as const)));
  const vehicles = new Map((await vrepo.listAll()).map((v) => [v.id, vehicleTitle(v)]));
  const iso = (d: TZDate) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const prev = new TZDate(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7, "America/Toronto");
  const next = new TZDate(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7, "America/Toronto");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2">Essais routiers</h1>
        <nav className="flex items-center gap-2 text-small"><Link href={`/admin/essais?week=${iso(prev)}`} className="rounded-pill border border-line px-3 py-1.5 text-text-2 hover:text-text">← Semaine précédente</Link><Link href="/admin/essais" className="rounded-pill border border-line px-3 py-1.5 text-text-2 hover:text-text">Cette semaine</Link><Link href={`/admin/essais?week=${iso(next)}`} className="rounded-pill border border-line px-3 py-1.5 text-text-2 hover:text-text">Semaine suivante →</Link></nav>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((d) => {
          const key = iso(d);
          const list = bookings.filter((b) => iso(new TZDate(b.startsAt, "America/Toronto")) === key);
          return (
            <section key={key} className="rounded-card-sm border border-line p-3">
              <h2 className="mb-2 text-caption uppercase tracking-[0.08em] text-text-3">{weekdayName(d.getDay(), "fr", "short")} {d.getDate()}</h2>
              <ul className="flex flex-col gap-2">
                {list.map((b) => {
                  const l = leads.get(b.id);
                  return (
                    <li key={b.id} className="rounded-chip bg-white/[0.04] p-2 text-caption">
                      <p className="tabular font-semibold text-text">{formatTime(b.startsAt, "fr")}</p>
                      {l && <Link href={`/admin/leads/${l.id}`} className="block text-text hover:underline">{[l.firstName, l.lastName].filter(Boolean).join(" ")}</Link>}
                      <p className="text-text-2">{b.vehicleId ? vehicles.get(b.vehicleId) : "—"}</p>
                      <BookingStatusSelect id={b.id} status={b.status} />
                    </li>
                  );
                })}
                {list.length === 0 && <li className="text-caption text-text-3">—</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminBookings(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminBookingsContent searchParams={props.searchParams as never} />
    </Suspense>
  );
}
