import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { runAssistant } from "@/lib/assistant/run";
import { serviceIdSchema } from "@/lib/schema";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  locale: z.enum(["fr", "en"]),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(30),
  state: z.record(z.string(), z.unknown()).optional(),
  context: z.object({ page: z.string().max(200).optional(), service: serviceIdSchema.optional() }).optional(),
});
const hits = new Map<string, { n: number; t: number }>();

function errorCode(e: unknown) {
  if (e instanceof Anthropic.RateLimitError) return "upstream_rate_limited";
  if (e instanceof Anthropic.AuthenticationError) return "assistant_not_configured";
  if (e instanceof Anthropic.APIError) { console.error("[assistant] api error", e.status, e.message); return "upstream_error"; }
  console.error("[assistant]", e); return "internal";
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "assistant_not_configured" }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"; const now = Date.now(); const h = hits.get(ip);
  if (h && now - h.t < 60_000 && h.n >= 30) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  hits.set(ip, h && now - h.t < 60_000 ? { n: h.n + 1, t: h.t } : { n: 1, t: now });
  if (hits.size > 5000) hits.clear();
  const body = await req.json().catch(() => null); const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  // Ensure the transcript starts with a user turn.
  const msgs = p.data.messages; while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { locale, state, context } = p.data;

  // Newline-delimited JSON: {t:"delta"|"status"|"done"|"error"}. The first
  // bytes reach the browser as soon as the model starts writing.
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const send = (o: unknown) => { try { ctrl.enqueue(enc.encode(JSON.stringify(o) + "\n")); } catch { /* client went away */ } };
      try {
        const out = await runAssistant({ locale, history: msgs, state: (state ?? {}) as never, context, onEvent: send });
        send({ t: "done", ...out });
      } catch (e) {
        send({ t: "error", code: errorCode(e) });
      } finally { try { ctrl.close(); } catch { /* already closed */ } }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
