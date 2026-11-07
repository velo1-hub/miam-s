import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, type ChatMessageRow, type ChatSessionRow, type Json } from "@/lib/supabase/database.types";

export interface ChatSession {
  id: string;
  locale: "fr" | "en";
  pageUrl: string | null;
  vehicleId: string | null;
  leadId: string | null;
  startedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
}

export interface ChatMessageRecord {
  sessionId: string;
  role: "user" | "assistant" | "tool";
  content: unknown;
  tokensIn: number | null;
  tokensOut: number | null;
  createdAt: string;
}

export interface ChatStore {
  touchSession(id: string, meta: Pick<ChatSession, "locale" | "pageUrl" | "vehicleId">): Promise<ChatSession>;
  appendMessages(sessionId: string, messages: Omit<ChatMessageRecord, "sessionId" | "createdAt">[]): Promise<void>;
  transcript(sessionId: string): Promise<ChatMessageRecord[]>;
  listSessions(limit?: number): Promise<ChatSession[]>;
  linkLead(sessionId: string, leadId: string): Promise<void>;
  /** Questions the assistant could not answer (flagged by a tool-less reply containing the unknown marker) */
  stats(): Promise<{ sessions7d: number; messages7d: number; topQuestions: { text: string; count: number }[] }>;
}

interface State {
  sessions: ChatSession[];
  messages: ChatMessageRecord[];
}
const FILE = path.join(process.cwd(), ".cache", "demo-chat.json");
let state: State | null = null;
const load = (): State => {
  if (state) return state;
  try {
    state = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as State) : { sessions: [], messages: [] };
  } catch {
    state = { sessions: [], messages: [] };
  }
  return state;
};
const persist = () => {
  try {
    mkdirSync(path.dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

export const demoChatStore: ChatStore = {
  async touchSession(id, meta) {
    const s = load();
    let session = s.sessions.find((x) => x.id === id);
    if (!session) {
      session = { id, ...meta, leadId: null, startedAt: new Date().toISOString(), lastMessageAt: null, messageCount: 0 };
      s.sessions.push(session);
    } else {
      session.pageUrl = meta.pageUrl;
      session.vehicleId = meta.vehicleId;
    }
    persist();
    return session;
  },
  async appendMessages(sessionId, messages) {
    const s = load();
    const now = new Date().toISOString();
    for (const m of messages) s.messages.push({ ...m, sessionId, createdAt: now });
    const session = s.sessions.find((x) => x.id === sessionId);
    if (session) {
      session.lastMessageAt = now;
      session.messageCount += messages.filter((m) => m.role !== "tool").length;
    }
    if (s.messages.length > 20_000) s.messages.splice(0, s.messages.length - 20_000);
    persist();
  },
  async transcript(sessionId) {
    return load().messages.filter((m) => m.sessionId === sessionId);
  },
  async listSessions(limit = 50) {
    return [...load().sessions].sort((a, b) => (b.lastMessageAt ?? b.startedAt).localeCompare(a.lastMessageAt ?? a.startedAt)).slice(0, limit);
  },
  async linkLead(sessionId, leadId) {
    const s = load();
    const session = s.sessions.find((x) => x.id === sessionId);
    if (session) session.leadId = leadId;
    persist();
  },
  async stats() {
    const s = load();
    const cutoff = Date.now() - 7 * 86_400_000;
    const recent = s.messages.filter((m) => new Date(m.createdAt).getTime() > cutoff);
    const counts = new Map<string, number>();
    for (const m of recent) {
      if (m.role !== "user" || typeof m.content !== "string") continue;
      const key = m.content.trim().toLowerCase().slice(0, 80);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return {
      sessions7d: s.sessions.filter((x) => new Date(x.startedAt).getTime() > cutoff).length,
      messages7d: recent.length,
      topQuestions: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([text, count]) => ({ text, count })),
    };
  },
};

// ---------------------------------------------------------------------------------------------
// Supabase store — tables chat_sessions / chat_messages (brief §16, §27.1). Service role only:
// RLS makes both tables staff-read-only. Session counters are maintained by a database trigger.
// ---------------------------------------------------------------------------------------------

const uuidOrNull = (value: string | null) => (value && isUuid(value) ? value : null);
const iso = (value: string) => new Date(value).toISOString();

function mapSession(r: ChatSessionRow): ChatSession {
  return {
    id: r.id,
    locale: r.locale === "en" ? "en" : "fr",
    pageUrl: r.page_url,
    vehicleId: r.vehicle_id,
    leadId: r.lead_id,
    startedAt: iso(r.started_at),
    lastMessageAt: r.last_message_at ? iso(r.last_message_at) : null,
    messageCount: r.message_count,
  };
}

function mapMessage(r: ChatMessageRow): ChatMessageRecord {
  return {
    sessionId: r.session_id,
    role: r.role === "assistant" || r.role === "tool" ? r.role : "user",
    content: r.content,
    tokensIn: r.tokens_in,
    tokensOut: r.tokens_out,
    createdAt: iso(r.created_at),
  };
}

function fail(scope: string, error: { message: string }): never {
  throw new Error(`[chat-store/supabase] ${scope}: ${error.message}`);
}

export const supabaseChatStore: ChatStore = {
  async touchSession(id, meta) {
    const db = createAdminClient();
    const sessionId = id.slice(0, 64);
    const { data, error } = await db
      .from("chat_sessions")
      .upsert({ id: sessionId, locale: meta.locale, page_url: meta.pageUrl, vehicle_id: uuidOrNull(meta.vehicleId) }, { onConflict: "id" })
      .select("*")
      .single();
    if (error || !data) fail("touchSession", error ?? { message: "no row returned" });
    return mapSession(data);
  },

  async appendMessages(sessionId, messages) {
    if (messages.length === 0) return;
    const db = createAdminClient();
    const { error } = await db.from("chat_messages").insert(
      messages.map((m) => ({
        session_id: sessionId.slice(0, 64),
        role: m.role,
        content: (m.content ?? null) as Json,
        tokens_in: m.tokensIn,
        tokens_out: m.tokensOut,
      })),
    );
    if (error) fail("appendMessages", error);
  },

  async transcript(sessionId) {
    const { data, error } = await createAdminClient()
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId.slice(0, 64))
      .order("created_at")
      .order("id");
    if (error) fail("transcript", error);
    return (data ?? []).map(mapMessage);
  },

  async listSessions(limit = 50) {
    const { data, error } = await createAdminClient()
      .from("chat_sessions")
      .select("*")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) fail("listSessions", error);
    return (data ?? []).map(mapSession);
  },

  async linkLead(sessionId, leadId) {
    const { error } = await createAdminClient().from("chat_sessions").update({ lead_id: uuidOrNull(leadId) }).eq("id", sessionId.slice(0, 64));
    if (error) fail("linkLead", error);
  },

  async stats() {
    const db = createAdminClient();
    const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const [sessions, messages, questions] = await Promise.all([
      db.from("chat_sessions").select("id", { count: "exact", head: true }).gte("started_at", cutoff),
      db.from("chat_messages").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
      db.from("chat_messages").select("content").eq("role", "user").gte("created_at", cutoff).limit(5000),
    ]);
    const counts = new Map<string, number>();
    for (const m of questions.data ?? []) {
      if (typeof m.content !== "string") continue;
      const key = m.content.trim().toLowerCase().slice(0, 80);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return {
      sessions7d: sessions.count ?? 0,
      messages7d: messages.count ?? 0,
      topQuestions: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([text, count]) => ({ text, count })),
    };
  },
};

/** Demo store unless DEMO_MODE=false and the service role key is configured. */
export async function getChatStore(): Promise<ChatStore> {
  const useSupabase = process.env.DEMO_MODE === "false" && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return useSupabase ? supabaseChatStore : demoChatStore;
}
