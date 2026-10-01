// Supabase Edge Function: the website assistant.
// Secrets (supabase secrets set …): ANTHROPIC_API_KEY, ALLOWED_ORIGINS, optional ASSISTANT_MODEL, ASSISTANT_EFFORT,
// ASSISTANT_FALLBACKS=off, RESEND_API_KEY, NOTIFY_TO, NOTIFY_FROM, DASHBOARD_URL.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
// Deploy with --no-verify-jwt: the public website calls it without a user session (abuse is limited in http.ts).
import Anthropic from "npm:@anthropic-ai/sdk";
import { createHandler } from "../_shared/http.ts";
import { SupabaseRepo } from "../_shared/repo_supabase.ts";
import { makeNotifier } from "../_shared/notify.ts";

const env = (k: string) => Deno.env.get(k) ?? undefined;
const client = new Anthropic(); // reads ANTHROPIC_API_KEY
const useFallbacks = env("ASSISTANT_FALLBACKS") !== "off";

const handler = createHandler({
  repo: new SupabaseRepo(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!),
  model: env("ASSISTANT_MODEL") ?? "claude-opus-5-5",
  effort: env("ASSISTANT_EFFORT") ?? "low",
  llm: {
    // Server-side refusal fallback ("default" routing) is on by default; set ASSISTANT_FALLBACKS=off to disable.
    create: (params) => useFallbacks
      ? client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as any)
      : client.messages.create(params as any),
  },
  notify: makeNotifier({ RESEND_API_KEY: env("RESEND_API_KEY"), NOTIFY_TO: env("NOTIFY_TO"), NOTIFY_FROM: env("NOTIFY_FROM"), DASHBOARD_URL: env("DASHBOARD_URL") }),
}, { allowedOrigins: (env("ALLOWED_ORIGINS") ?? "https://proferforge.ca").split(",").map((s) => s.trim()) });

Deno.serve(handler);
