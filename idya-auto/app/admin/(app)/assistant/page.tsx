import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { KnowledgeEditor } from "@/components/admin/knowledge-editor";
import { AssistantSettings } from "@/components/admin/assistant-settings";
import { dailySpend } from "@/lib/ai/budget";
import { getChatStore } from "@/lib/ai/chat-store";
import { env } from "@/lib/env";
import { getKnowledgeRepository } from "@/lib/knowledge";
import { getSettings } from "@/lib/settings";

/** Assistant — brief §15: conversation viewer, top questions, knowledge base editor, on/off switch, after-hours behaviour, budget. */
async function AdminAssistantContent({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const { session } = await searchParams;
  const [store, kb, settings] = await Promise.all([getChatStore(), getKnowledgeRepository(), getSettings()]);
  const [sessions, stats, entries] = await Promise.all([store.listSessions(30), store.stats(), kb.list()]);
  const transcript = session ? await store.transcript(session) : [];
  const spend = dailySpend();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h2">Assistant Idya</h1>
      <div className="grid gap-3 md:grid-cols-4">
        {[["Conversations (7 j)", stats.sessions7d], ["Messages (7 j)", stats.messages7d], ["Dépense IA aujourd'hui", `${spend.usd.toFixed(2)} $ / ${spend.limit} $`], ["Modèle", env.hasAnthropic ? "claude-sonnet-5-5" : "hors ligne (sans clé)"]].map(([k, v]) => (
          <div key={String(k)} className="glass-lite rounded-card-sm p-4"><p className="text-caption text-text-3">{k}</p><p className="tabular mt-1 text-[22px] font-semibold text-text">{v}</p></div>
        ))}
      </div>
      <AssistantSettings settings={settings} />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-h3">Questions fréquentes cette semaine</h2>
          <ol className="flex flex-col gap-1 text-small">{stats.topQuestions.map((q) => <li key={q.text} className="flex justify-between gap-3 border-b border-line py-1.5"><span className="text-text">{q.text}</span><span className="tabular text-text-3">{q.count}</span></li>)}{stats.topQuestions.length === 0 && <li className="text-text-3">Aucune conversation encore.</li>}</ol>
        </section>
        <section>
          <h2 className="mb-3 text-h3">Conversations récentes</h2>
          <ul className="flex flex-col gap-1 text-small">
            {sessions.map((s) => <li key={s.id}><a href={`/admin/assistant?session=${s.id}`} className="flex justify-between gap-3 border-b border-line py-1.5 hover:text-text"><span className="text-text-2">{s.id.slice(0, 14)} · {s.locale.toUpperCase()} · {s.pageUrl ?? "/"}</span><span className="tabular text-text-3">{s.messageCount} msg{s.leadId ? " · lead" : ""}</span></a></li>)}
          </ul>
          {transcript.length > 0 && (
            <ol className="mt-4 flex flex-col gap-2 rounded-card-sm border border-line p-4 text-small">
              {transcript.map((m, i) => <li key={i} className={m.role === "user" ? "text-text" : m.role === "tool" ? "text-caption text-text-3" : "text-text-2"}><span className="text-caption uppercase text-text-3">{m.role}</span> {typeof m.content === "string" ? m.content : JSON.stringify(m.content)}</li>)}
            </ol>
          )}
        </section>
      </div>
      <KnowledgeEditor entries={entries} />
    </div>
  );
}

export default function AdminAssistant(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminAssistantContent searchParams={props.searchParams as never} />
    </Suspense>
  );
}
