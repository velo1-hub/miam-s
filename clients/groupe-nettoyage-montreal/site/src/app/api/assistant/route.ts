import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { runAssistant } from "@/lib/assistant/run";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  locale: z.enum(["fr", "en"]),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(30),
  state: z.record(z.string(), z.unknown()).optional(),
});
const hits = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "assistant_not_configured" }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"; const now = Date.now(); const h = hits.get(ip);
  if (h && now - h.t < 60_000 && h.n >= 30) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  hits.set(ip, h && now - h.t < 60_000 ? { n: h.n + 1, t: h.t } : { n: 1, t: now });
  const body = await req.json().catch(() => null); const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  // Ensure the transcript starts with a user turn and alternates sensibly.
  const msgs = p.data.messages; while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  try {
    const out = await runAssistant(p.data.locale, msgs, (p.data.state ?? {}) as never);
    return NextResponse.json(out);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "upstream_rate_limited" }, { status: 503 });
    if (e instanceof Anthropic.AuthenticationError) return NextResponse.json({ error: "assistant_not_configured" }, { status: 503 });
    if (e instanceof Anthropic.APIError) { console.error("[assistant] api error", e.status, e.message); return NextResponse.json({ error: "upstream_error" }, { status: 502 }); }
    console.error("[assistant]", e); return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
