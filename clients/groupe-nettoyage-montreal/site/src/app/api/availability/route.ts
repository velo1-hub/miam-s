import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getSlots, nextAvailableDays, isValidISODate } from "@/lib/availability";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = new URL(req.url); const kind = u.searchParams.get("kind") === "walkthrough" ? "walkthrough" : "cleaning";
  const date = u.searchParams.get("date"); const from = u.searchParams.get("from") ?? undefined;
  const db = getDB();
  if (date) { if (!isValidISODate(date)) return NextResponse.json({ error: "bad_date" }, { status: 400 }); return NextResponse.json({ date, kind, slots: await getSlots(db, date, kind) }); }
  return NextResponse.json({ kind, days: await nextAvailableDays(db, kind, 7, from) });
}
