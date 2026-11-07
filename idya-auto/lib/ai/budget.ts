import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICING } from "./client";
import { demoFile } from "@/lib/utils/demo-dir";

/**
 * Hard daily AI spend cap — brief §27.1 (`AI_DAILY_BUDGET_USD`, default 15). Spend is estimated from
 * token usage × list price. Demo: process memory + .cache file. Production (DEMO_MODE=false with a
 * service-role key): the same in-memory ledger plus the `ai_usage_daily` table (C4.4), so every
 * serverless instance shares one cap. The public API stays synchronous: writes are fire-and-forget
 * and the table total is refreshed in the background at most once a minute.
 */
interface Usage {
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
}

interface DayTotals {
  usd: number;
  calls: number;
}

const FILE = demoFile("ai-usage.json");
const REMOTE_TTL_MS = 60_000;
let state: Record<string, DayTotals> | null = null;

/** Last known table totals for `remote.day`, refreshed at most every REMOTE_TTL_MS. */
let remote: { day: string; usd: number; calls: number; fetchedAt: number } | null = null;
let refreshing = false;

const today = () => new Date().toISOString().slice(0, 10);
const remoteEnabled = () => process.env.DEMO_MODE === "false" && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

function load() {
  if (state) return state;
  try {
    state = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as typeof state) : {};
  } catch {
    state = {};
  }
  return state ?? {};
}
function persist() {
  try {
    mkdirSync(path.dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(state));
  } catch {
    /* read-only fs */
  }
}

export function costUsd(model: string, usage: Usage): number {
  const p = PRICING[model] ?? PRICING["claude-sonnet-5-5"];
  const cached = usage.cachedInputTokens ?? 0;
  const input = Math.max(0, (usage.inputTokens ?? 0) - cached);
  return (input * p.input + cached * p.cacheRead + (usage.outputTokens ?? 0) * p.output) / 1_000_000;
}

/** Atomic increment in ai_usage_daily (SQL function record_ai_usage); the returned row refreshes the cache. */
async function persistRemote(day: string, usd: number): Promise<void> {
  try {
    const { data } = await createAdminClient().rpc("record_ai_usage", { p_day: day, p_usd: usd, p_calls: 1 });
    const row = data?.[0];
    if (row) remote = { day, usd: Number(row.usd), calls: row.calls, fetchedAt: Date.now() };
  } catch {
    // The in-memory ledger still counts this call; the next successful upsert catches up.
  }
}

/** Background read of today's table totals, at most once per minute. */
async function refreshRemote(day: string): Promise<void> {
  if (refreshing) return;
  if (remote && remote.day === day && Date.now() - remote.fetchedAt < REMOTE_TTL_MS) return;
  refreshing = true;
  try {
    const { data } = await createAdminClient().from("ai_usage_daily").select("usd, calls").eq("day", day).maybeSingle();
    remote = { day, usd: Number(data?.usd ?? 0), calls: data?.calls ?? 0, fetchedAt: Date.now() };
  } catch {
    // Keep the previous snapshot.
  } finally {
    refreshing = false;
  }
}

export function recordUsage(model: string, usage: Usage): void {
  const s = load();
  const d = today();
  const usd = costUsd(model, usage);
  s[d] = { usd: (s[d]?.usd ?? 0) + usd, calls: (s[d]?.calls ?? 0) + 1 };
  persist();
  if (remoteEnabled()) void persistRemote(d, usd);
}

export function dailySpend(): { usd: number; calls: number; limit: number } {
  const s = load();
  const d = today();
  const limit = Number(process.env.AI_DAILY_BUDGET_USD ?? "15");
  const local: DayTotals = s[d] ?? { usd: 0, calls: 0 };
  if (!remoteEnabled()) return { ...local, limit };
  void refreshRemote(d);
  // The table already includes this instance's persisted calls; the max covers the window
  // between a local record and its upsert without double counting.
  const shared = remote && remote.day === d ? remote : { usd: 0, calls: 0 };
  return { usd: Math.max(local.usd, shared.usd), calls: Math.max(local.calls, shared.calls), limit };
}

export function budgetExceeded(): boolean {
  const { usd, limit } = dailySpend();
  return usd >= limit;
}
