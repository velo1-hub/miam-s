import { NextResponse } from "next/server";
import { vehicles } from "@/lib/vehicles";
import { toCardData } from "@/lib/vehicles/card";
import { loadInventoryParams, paramsToFilters, PER_PAGE } from "@/lib/vehicles/search-params";

/** Paginated card data for « Charger plus » (same filters as the page). */
export async function GET(request: Request) {
  const params = loadInventoryParams(new URL(request.url).searchParams);
  const res = await vehicles.list(paramsToFilters(params), params.sort, params.page, PER_PAGE);
  return NextResponse.json({ items: res.items.map(toCardData), total: res.total, page: res.page }, { headers: { "Cache-Control": "public, max-age=60" } });
}
