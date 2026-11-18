import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/schema";
import { getDB } from "@/lib/db";
import { notifyLead } from "@/lib/email";
import { computeQuote } from "@/lib/pricing";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const body = await req.json().catch(() => null); const p = leadSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  if (p.data.website) return NextResponse.json({ ok: true }); // honeypot
  const { consent: _c, website: _w, quote, ...rest } = p.data; void _c; void _w;
  const lead = await getDB().createLead({ ...rest, phone: rest.phone ?? null, message: rest.message ?? null, service: rest.service ?? null, segment: rest.segment ?? null, source: rest.source ?? null, meta: rest.meta ?? null, quote: quote ? computeQuote(quote) : null });
  void notifyLead(lead);
  return NextResponse.json({ ok: true, id: lead.id });
}
