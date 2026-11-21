import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getSlots, nextAvailableDays, isValidISODate } from "@/lib/availability";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = new URL(req.url); const date = u.searchParams.get("date"); const from = u.searchParams.get("from") ?? undefined;
  const db = getDB();
  if (date) { if (!isValidISODate(date)) return NextResponse.json({ error: "bad_date" }, { status: 400 }); return NextResponse.json({ date, kind: "walkthrough", slots: await getSlots(db, date) }); }
  return NextResponse.json({ kind: "walkthrough", days: await nextAvailableDays(db, 7, from) });
}
