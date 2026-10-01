// Supabase Edge Function: the website assistant ("Félix").
// Secrets (Dashboard → Edge Functions → Secrets): ANTHROPIC_API_KEY (required for live answers);
// optional ASSISTANT_MODEL, ASSISTANT_EFFORT, ASSISTANT_FALLBACKS=off, RESEND_API_KEY, NOTIFY_TO, NOTIFY_FROM, DASHBOARD_URL, ALLOWED_ORIGINS.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
// Allowed website origins can also be managed in the settings table (key 'site', value {"allowed_origins": [...]}).
// Deployed with verify_jwt = false: the public website calls it without a user session (abuse limited in http.ts).
import Anthropic from "npm:@anthropic-ai/sdk";
import { createHandler } from "../_shared/http.ts";
import { SupabaseRepo } from "../_shared/repo_supabase.ts";
import { makeNotifier } from "../_shared/notify.ts";

const env = (k: string) => Deno.env.get(k) || undefined;
const useFallbacks = env("ASSISTANT_FALLBACKS") !== "off";
let client: Anthropic | null = null; // created on first use so a missing key degrades to a polite message, not a crash

const repo = new SupabaseRepo(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!);
const { data: site } = await repo.db.from("settings").select("value").eq("key", "site").maybeSingle();
const origins = [
  ...(env("ALLOWED_ORIGINS") ?? "https://proferforge.ca").split(","),
  ...((site?.value as { allowed_origins?: string[] } | null)?.allowed_origins ?? []),
].map((s) => s.trim()).filter(Boolean);

const handler = createHandler({
  repo,
  model: env("ASSISTANT_MODEL") ?? "claude-opus-5-5",
  effort: env("ASSISTANT_EFFORT") ?? "low",
  llm: {
    create: (params) => {
      if (!env("ANTHROPIC_API_KEY")) throw new Error("ANTHROPIC_API_KEY is not set");
      client ??= new Anthropic();
      // Server-side refusal fallback ("default" routing) is on by default; ASSISTANT_FALLBACKS=off disables it.
      return useFallbacks
        ? client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as any)
        : client.messages.create(params as any);
    },
  },
  notify: makeNotifier({ RESEND_API_KEY: env("RESEND_API_KEY"), NOTIFY_TO: env("NOTIFY_TO"), NOTIFY_FROM: env("NOTIFY_FROM"), DASHBOARD_URL: env("DASHBOARD_URL") }),
}, { allowedOrigins: origins });

Deno.serve(handler);
