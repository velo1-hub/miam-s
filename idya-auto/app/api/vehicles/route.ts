import { NextResponse } from "next/server";
import { vehicles } from "@/lib/vehicles";
import { toCardData } from "@/lib/vehicles/card";

/** Card data for a list of ids (favorites, compare, « choisis pour vous »). Public, cached reads. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
  if (ids.length === 0) return NextResponse.json({ items: [] });
  const full = url.searchParams.get("full") === "1";
  const items = await vehicles.getMany(ids);
  const byId = new Map(items.map((v) => [v.id, full ? { ...toCardData(v), features: v.features } : toCardData(v)]));
  return NextResponse.json({ items: ids.map((id) => byId.get(id)).filter(Boolean) }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
