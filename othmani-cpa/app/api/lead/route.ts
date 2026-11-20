import { errorStatus, foreignOrigin, readBody, tooMany, saveLead } from "@/lib/backend";

export const dynamic = "force-dynamic";

/** Réception du formulaire de contact. */
export async function POST(req: Request) {
  if (foreignOrigin(req)) return Response.json({ ok: false, code: "forbidden" }, { status: 403 });
  if (tooMany(req, 8)) return Response.json({ ok: false, code: "rate_limited" }, { status: 429 });
  const b = await readBody(req);
  if (b._gotcha) return Response.json({ ok: true }); // piège à robots : on ne dit rien
  if (b.consentement !== "oui") return Response.json({ ok: false, code: "consent_required" }, { status: 400 });
  const r = await saveLead({ source: "contact", lang: b.langue, name: b.nom, email: b.courriel, phone: b.telephone, audience: b.pour, message: b.message });
  return Response.json({ ok: r.ok, code: r.ok ? undefined : r.code }, { status: r.ok ? 200 : errorStatus(r.code) });
}
