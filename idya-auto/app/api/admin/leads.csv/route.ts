import { getAdminSession } from "@/lib/admin/auth";
import { getLeadRepository } from "@/lib/leads";
import type { LeadStatus, LeadType } from "@/lib/leads/types";

/** CSV export — brief §15. */
export async function GET(req: Request) {
  if (!(await getAdminSession())) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const repo = await getLeadRepository();
  const leads = await repo.listLeads({ type: (url.searchParams.get("type") || undefined) as LeadType | undefined, status: (url.searchParams.get("status") || undefined) as LeadStatus | undefined, limit: 5000 });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["id", "date", "type", "statut", "prenom", "nom", "courriel", "telephone", "langue", "vehicule", "message", "consentement"].join(",")];
  for (const l of leads) rows.push([l.id, l.createdAt, l.type, l.status, l.firstName, l.lastName, l.email, l.phone, l.locale, l.vehicleId, l.message, l.consentAt].map(esc).join(","));
  return new Response(`﻿${rows.join("\r\n")}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
