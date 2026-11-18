import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDB } from "@/lib/db";
export const dynamic = "force-dynamic";
function authed(req: Request) {
  const want = process.env.ADMIN_PASSWORD; const got = req.headers.get("x-admin-password") ?? "";
  if (!want || want === "change-me" && process.env.NODE_ENV === "production") return false;
  const a = Buffer.from(got), b = Buffer.from(want); return a.length === b.length && timingSafeEqual(a, b);
}
export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDB(); const [leads, bookings] = await Promise.all([db.listLeads(300), db.listBookings({ limit: 500 })]);
  return NextResponse.json({ leads, bookings });
}
