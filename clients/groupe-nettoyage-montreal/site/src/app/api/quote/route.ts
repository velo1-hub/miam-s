import { NextResponse } from "next/server";
import { quoteInputSchema } from "@/lib/schema";
import { computeQuote, withTax } from "@/lib/pricing";
import { ZONES } from "@/content/zones";
import { serviceById } from "@/content/services";
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const p = quoteInputSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ ok: false, error: "invalid_input", issues: p.error.issues }, { status: 400 });
  const zone = ZONES.find((z) => z.id === p.data.zone);
  const quote = computeQuote({ ...p.data, travelFee: zone?.travelFee ?? 0 });
  const s = serviceById(p.data.service);
  return NextResponse.json({ ok: true, quote, tax: withTax(quote.min), service: { id: s.id, bookable: s.bookable } });
}
