import { errorStatus, readBody, rpc } from "@/lib/backend";

export const dynamic = "force-dynamic";

/** Inscription aux rappels fiscaux (consentement explicite). */
export async function POST(req: Request) {
  const b = await readBody(req);
  if (b._gotcha) return Response.json({ ok: true });
  if (b.consentement !== "oui") return Response.json({ ok: false, code: "consent_required" }, { status: 400 });
  const r = await rpc("subscribe_reminder", { p_email: (b.courriel ?? "").trim().slice(0, 200), p_lang: b.langue === "en" ? "en" : "fr" });
  return Response.json({ ok: r.ok, code: r.ok ? undefined : r.code }, { status: r.ok ? 200 : errorStatus(r.code) });
}
