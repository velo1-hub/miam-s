// HTTP layer (Web Fetch API): used by the Supabase Edge Function and by the local dev server.
//   POST {base}           { session_id, message, lang, page?, consent?, slot_id? } → TurnResult
//   GET  {base}?session_id=…        → { messages: [{ role, text }] }   (chat history for the widget)
//   GET  {base}/ics?session_id=…    → text/calendar for the booked visit
import { ConsentRequired, icsForAppointment, runTurn, type Deps } from "./agent.ts";

const SESSION_RE = /^[A-Za-z0-9_-]{16,80}$/;
const hits = new Map<string, number[]>(); // per-instance rate limit (best effort; isolates are short-lived)

function limited(key: string, max: number, windowMs: number, now: number) {
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

export function createHandler(deps: Deps, opts: { allowedOrigins: string[] }) {
  const cors = (req: Request): Record<string, string> => {
    const origin = req.headers.get("origin") ?? "";
    // Entries may be exact origins or "https://*.example.com" (any subdomain, e.g. Vercel preview URLs).
    const ok = opts.allowedOrigins.some((a) => a === "*" || a === origin || (a.startsWith("https://*.") && origin.startsWith("https://") && origin.endsWith(a.slice(9))));
    return { ...(ok && origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
      "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type, authorization, apikey, x-client-info", "access-control-max-age": "86400" };
  };
  const json = (req: Request, status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors(req) } });

  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    const now = (deps.now ?? Date.now)();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if (limited(`ip:${ip}`, 60, 10 * 60e3, now)) return json(req, 429, { error: "rate_limited" });

    if (req.method === "GET") {
      const sid = url.searchParams.get("session_id") ?? "";
      if (!SESSION_RE.test(sid)) return json(req, 400, { error: "bad_session" });
      const lead = await deps.repo.getLeadBySession(sid);
      if (url.pathname.endsWith("/ics")) {
        const appt = lead && (await deps.repo.getActiveAppointment(lead.id));
        if (!lead || !appt) return json(req, 404, { error: "no_visit" });
        return new Response(icsForAppointment(lead, appt), { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="visite-pro-fer-forge.ics"', ...cors(req) } });
      }
      if (!lead) return json(req, 200, { messages: [] });
      const msgs = (await deps.repo.listMessages(lead.id)).filter((m) => m.display_text).map((m) => ({ role: m.role, text: m.display_text }));
      return json(req, 200, { messages: msgs });
    }
    if (req.method !== "POST") return json(req, 405, { error: "method" });

    let body: any;
    try { body = await req.json(); } catch { return json(req, 400, { error: "bad_json" }); }
    const sid = String(body?.session_id ?? "");
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const lang = body?.lang === "en" ? "en" : "fr";
    if (!SESSION_RE.test(sid)) return json(req, 400, { error: "bad_session" });
    if (!message || message.length > 1500) return json(req, 400, { error: "bad_message" });
    if (limited(`s:${sid}`, 12, 60e3, now)) return json(req, 429, { error: "rate_limited" });
    try {
      const out = await runTurn(deps, { sessionId: sid, text: message, lang, page: typeof body.page === "string" ? body.page : undefined,
        consent: body.consent === true, slotId: typeof body.slot_id === "string" ? body.slot_id.slice(0, 40) : undefined });
      return json(req, 200, out);
    } catch (err) {
      if (err instanceof ConsentRequired) return json(req, 400, { error: "consent_required" });
      console.error("turn failed", err);
      return json(req, 500, { error: "server_error" });
    }
  };
}
