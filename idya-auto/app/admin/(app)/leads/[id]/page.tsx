import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadActions } from "@/components/admin/lead-actions";
import { IntentBadge, LEAD_STATUS_FR, LEAD_TYPE_FR } from "@/components/admin/lead-row";
import { getChatStore } from "@/lib/ai/chat-store";
import { formatDateTime } from "@/lib/format/date";
import { formatPhone } from "@/lib/format/phone";
import { getLeadRepository } from "@/lib/leads";
import { getAdminVehicleRepository } from "@/lib/vehicles/admin-repository";
import { vehicleFullTitle } from "@/lib/vehicles/types";

/** Lead detail — brief §15: AI brief, chat transcript when it came from the assistant, notes timeline, quick reply, assignment. */
async function AdminLeadPageContent({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const { id } = await params;
  const repo = await getLeadRepository();
  const lead = await repo.getLead(id);
  if (!lead) notFound();
  const [brief, notes, vrepo, chat] = await Promise.all([repo.getAiBrief(id), repo.listNotes(id), getAdminVehicleRepository(), getChatStore()]);
  const vehicle = lead.vehicleId ? await vrepo.get(lead.vehicleId) : null;
  const transcript = lead.chatSessionId ? await chat.transcript(lead.chatSessionId) : [];
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email || "—";
  const payload = Object.entries(lead.payload).filter(([k]) => !["kind", "source", "sessionId"].includes(k));
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-caption text-text-3"><Link href="/admin/leads" className="hover:text-text">Leads</Link> › {LEAD_TYPE_FR[lead.type]}</p>
          <h1 className="text-h2">{name}</h1>
          <p className="text-small text-text-2">{formatDateTime(lead.createdAt, "fr")} · {LEAD_STATUS_FR[lead.status]} · {lead.locale.toUpperCase()}{lead.preferredContact ? ` · contact ${lead.preferredContact}` : ""}</p>
        </div>
        <dl className="grid gap-x-6 gap-y-1 text-small sm:grid-cols-2">
          {lead.email && <><dt className="text-text-3">Courriel</dt><dd><a href={`mailto:${lead.email}`} className="text-text hover:underline">{lead.email}</a></dd></>}
          {lead.phone && <><dt className="text-text-3">Téléphone</dt><dd><a href={`tel:${lead.phone}`} className="text-text hover:underline">{formatPhone(lead.phone)}</a></dd></>}
          {vehicle && <><dt className="text-text-3">Véhicule</dt><dd><Link href={`/admin/vehicules/${vehicle.id}`} className="text-text hover:underline">{vehicleFullTitle(vehicle)}</Link></dd></>}
          {payload.map(([k, v]) => <div key={k} className="contents"><dt className="text-text-3">{k}</dt><dd className="text-text">{String(v)}</dd></div>)}
        </dl>
        {lead.message && <div className="glass-lite whitespace-pre-wrap rounded-card-sm p-4 text-small text-text">{lead.message}</div>}
        <p className="text-caption text-text-3">Consentement ({formatDateTime(lead.consentAt, "fr")}) : « {lead.consentText} »</p>
        {transcript.length > 0 && (
          <section>
            <h2 className="mb-2 text-h3">Conversation avec l’assistant</h2>
            <ol className="flex flex-col gap-2 rounded-card-sm border border-line p-4 text-small">
              {transcript.filter((m) => m.role !== "tool").map((m, i) => (
                <li key={i} className={m.role === "user" ? "text-text" : "text-text-2"}><span className="text-caption uppercase text-text-3">{m.role === "user" ? "Visiteur" : "Assistant"}</span> {typeof m.content === "string" ? m.content : JSON.stringify(m.content)}</li>
              ))}
            </ol>
          </section>
        )}
        <section>
          <h2 className="mb-2 text-h3">Notes</h2>
          <ol className="flex flex-col gap-2">
            {notes.map((n) => <li key={n.id} className="rounded-card-sm border border-line p-3 text-small"><span className="text-caption text-text-3">{n.author ?? "—"} · {formatDateTime(n.createdAt, "fr")}</span><p className="text-text">{n.body}</p></li>)}
          </ol>
        </section>
      </div>
      <aside className="flex flex-col gap-6">
        {brief && (
          <section className="glass-lite rounded-card-sm p-4">
            <div className="flex items-center justify-between"><h2 className="text-small font-semibold text-text">Brief IA</h2><IntentBadge brief={brief} /></div>
            <p className="mt-2 text-small text-text">{brief.summary}</p>
            <ul className="mt-2 list-disc pl-4 text-caption text-text-2">{brief.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            <p className="mt-3 text-caption text-text-3">Réponse suggérée ({lead.locale.toUpperCase()}) — à relire avant envoi</p>
            <p className="mt-1 whitespace-pre-wrap text-small text-text-2">{lead.locale === "en" ? brief.suggestedReplyEn : brief.suggestedReplyFr}</p>
            {lead.email && <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Idya Auto")}&body=${encodeURIComponent(lead.locale === "en" ? brief.suggestedReplyEn : brief.suggestedReplyFr)}`} className="mt-3 inline-block text-small text-text underline-offset-2 hover:underline">Répondre par courriel →</a>}
            <p className="mt-2 text-caption text-text-3">Modèle : {brief.model}</p>
          </section>
        )}
        <LeadActions lead={lead} />
      </aside>
    </div>
  );
}

export default function AdminLeadPage(props: { params: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminLeadPageContent params={props.params as never} />
    </Suspense>
  );
}
