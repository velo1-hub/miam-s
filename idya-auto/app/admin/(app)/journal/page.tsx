import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { listAudit } from "@/lib/admin/audit";
import { formatDateTime } from "@/lib/format/date";

/** Journal — brief §15: who changed what, when. */
async function AdminJournalContent() {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const entries = await listAudit(300);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2">Journal</h1>
      <div className="overflow-x-auto rounded-card-sm border border-line">
        <table className="w-full min-w-[700px] text-small">
          <thead className="text-left text-caption text-text-3"><tr><th className="px-3 py-2">Quand</th><th className="px-3 py-2">Qui</th><th className="px-3 py-2">Table</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Changements</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-line align-top">
                <td className="tabular whitespace-nowrap px-3 py-2 text-text-2">{formatDateTime(e.createdAt, "fr")}</td>
                <td className="px-3 py-2 text-text">{e.actorName}</td>
                <td className="px-3 py-2 text-text-2">{e.table} · <span className="tabular">{e.rowId}</span></td>
                <td className="px-3 py-2 text-text-2">{e.action}</td>
                <td className="px-3 py-2 text-caption text-text-2">{Object.entries(e.diff).map(([k, d]) => <div key={k}><span className="text-text">{k}</span> : {JSON.stringify(d.from)} → {JSON.stringify(d.to)}</div>)}</td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-text-3">Aucune modification enregistrée.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminJournal() {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminJournalContent />
    </Suspense>
  );
}
