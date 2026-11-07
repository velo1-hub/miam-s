import "server-only";
import { createAdminClient, publicStorageUrl, type AdminClient } from "@/lib/supabase/admin";
import { isUuid, type VehicleMediaRow, type VehicleRow } from "@/lib/supabase/database.types";
import { buildFacets, countFacet } from "./facets";
import { matchesFilters, similarityScore } from "./filters";
import { mapVehicleRow } from "./supabase-mapper";
import type { BodyType, Vehicle, VehicleFilters, VehicleListResult, VehicleRepository, VehicleSort } from "./types";
import { isPubliclyVisible } from "./types";

/**
 * Production vehicle repository — brief §16 schema, §7 filters, §27.3 similar vehicles.
 * Reads go through the service-role client (the public site has no Supabase session) and apply the
 * same visibility rule as RLS: status in (available, pending, sold) and published_at <= now(),
 * plus the 60-day window for sold vehicles (isPubliclyVisible). Filtering, sorting and paging run
 * in SQL; facets are computed in JS from a column-light fetch of the visible inventory (< 1000 rows).
 */

const PUBLIC_STATUSES = ["available", "pending", "sold"] as const;
const SOLD_WINDOW_DAYS = 60;
const FACET_FETCH_LIMIT = 1000;

const toMediaSrc = (path: string) => publicStorageUrl("vehicles", path);
const vehicleBaseUrl = (id: string) => publicStorageUrl("vehicles", `vehicles/${id}`);

/** PostgREST `.or()` filter strings are comma-separated: strip the characters that would break them. */
const safeTerm = (s: string) => s.replace(/[,()"\\%*]/g, " ").replace(/\s+/g, " ").trim();

/** `select *` on vehicles — the one shape every scope/filter helper below works on. */
const selectVehicles = (db: AdminClient, opts?: { count?: "exact"; head?: boolean }) => db.from("vehicles").select("*", opts);
type VehiclesQuery = ReturnType<typeof selectVehicles>;

/** Visible to the public right now (mirrors the anon RLS policy + 60-day sold window). */
function visibleScope(q: VehiclesQuery, now: Date): VehiclesQuery {
  const cutoff = new Date(now.getTime() - SOLD_WINDOW_DAYS * 86_400_000).toISOString();
  return q
    .in("status", [...PUBLIC_STATUSES])
    .lte("published_at", now.toISOString())
    .or(`status.neq.sold,sold_at.is.null,sold_at.gte.${cutoff}`);
}

/** SQL mirror of lib/vehicles/filters.ts matchesFilters (same semantics, minus accent folding). */
function applyFilters(q: VehiclesQuery, f: VehicleFilters): VehiclesQuery {
  if (f.condition?.length) q = q.in("condition", f.condition);
  if (f.make?.length) q = q.or(f.make.map((m) => `make.ilike.${safeTerm(m)}`).join(","));
  if (f.model?.length) q = q.or(f.model.map((m) => `model.ilike.${safeTerm(m)}`).join(","));
  if (f.yearMin !== undefined) q = q.gte("year", f.yearMin);
  if (f.yearMax !== undefined) q = q.lte("year", f.yearMax);
  if (f.priceMin !== undefined) q = q.gte("price_cad", f.priceMin);
  if (f.priceMax !== undefined) q = q.lte("price_cad", f.priceMax);
  if (f.kmMax !== undefined) q = q.lte("odometer_km", f.kmMax);
  if (f.bodyType?.length) q = q.in("body_type", f.bodyType);
  if (f.drivetrain?.length) q = q.in("drivetrain", f.drivetrain);
  if (f.transmission?.length) q = q.in("transmission", f.transmission);
  if (f.fuel?.length) q = q.in("fuel_type", f.fuel);
  if (f.color?.length) q = q.or(f.color.map((c) => `exterior_color.ilike.${safeTerm(c)}`).join(","));
  if (f.seatsMin !== undefined) q = q.gte("seats", f.seatsMin);
  if (f.features?.length) q = q.contains("features", f.features);
  if (f.featured !== undefined) q = q.eq("featured", f.featured);
  if (!f.includeSold) q = q.neq("status", "sold");
  if (f.q) {
    const term = safeTerm(f.q);
    if (term) {
      // Full text on the generated `search` column (websearch syntax, 'simple' config) with an
      // ilike fallback for partial words such as "rav" or a stock-number prefix.
      q = q.or(
        [
          `search.wfts(simple).${term}`,
          `make.ilike.*${term}*`,
          `model.ilike.*${term}*`,
          `trim_level.ilike.*${term}*`,
          `stock_number.ilike.*${term}*`,
        ].join(","),
      );
    }
  }
  return q;
}

function applySort(q: VehiclesQuery, sort: VehicleSort): VehiclesQuery {
  switch (sort) {
    case "price_asc":
      return q.order("price_cad", { ascending: true, nullsFirst: false });
    case "price_desc":
      return q.order("price_cad", { ascending: false, nullsFirst: false });
    case "km_asc":
      return q.order("odometer_km", { ascending: true, nullsFirst: false });
    case "year_desc":
      return q.order("year", { ascending: false }).order("odometer_km", { ascending: true, nullsFirst: false });
    case "newest":
    default:
      return q.order("published_at", { ascending: false, nullsFirst: false });
  }
}

function logError(scope: string, error: { message: string } | null): void {
  if (error) console.error(`[vehicles/supabase] ${scope}: ${error.message}`);
}

async function loadMedia(db: AdminClient, ids: string[]): Promise<Map<string, VehicleMediaRow[]>> {
  const byVehicle = new Map<string, VehicleMediaRow[]>();
  if (ids.length === 0) return byVehicle;
  const { data, error } = await db.from("vehicle_media").select("*").in("vehicle_id", ids).neq("kind", "spin").order("position");
  logError("media", error);
  for (const m of data ?? []) {
    const list = byVehicle.get(m.vehicle_id) ?? [];
    list.push(m);
    byVehicle.set(m.vehicle_id, list);
  }
  return byVehicle;
}

/** Rows → vehicles with their gallery / interior media (one extra query for the whole page). */
async function hydrate(db: AdminClient, rows: VehicleRow[], withMedia = true): Promise<Vehicle[]> {
  const media = withMedia ? await loadMedia(db, rows.map((r) => r.id)) : new Map<string, VehicleMediaRow[]>();
  return rows.map((r) => mapVehicleRow(r, { baseUrl: vehicleBaseUrl(r.id), media: media.get(r.id) ?? [], toMediaSrc }));
}

/** Every publicly visible vehicle, without media — for facets, counts, similar() and the sitemap. */
async function visibleRows(db: AdminClient, now: Date): Promise<VehicleRow[]> {
  const { data, error } = await visibleScope(selectVehicles(db), now).limit(FACET_FETCH_LIMIT);
  logError("visible", error);
  return (data ?? []).filter((r) => isPubliclyVisible(mapVehicleRow(r, { baseUrl: "", media: [], toMediaSrc }), now));
}

async function findOne(db: AdminClient, column: "slug" | "id" | "stock_number", value: string): Promise<Vehicle | null> {
  const now = new Date();
  let q = visibleScope(selectVehicles(db), now);
  q = column === "stock_number" ? q.ilike(column, safeTerm(value)) : q.eq(column, value);
  const { data, error } = await q.limit(1).maybeSingle();
  logError(`get:${column}`, error);
  if (!data) return null;
  const [vehicle] = await hydrate(db, [data]);
  return vehicle && isPubliclyVisible(vehicle, now) ? vehicle : null;
}

export const supabaseVehicleRepository: VehicleRepository = {
  async list(filters: VehicleFilters, sort: VehicleSort, page: number, perPage: number): Promise<VehicleListResult> {
    const db = createAdminClient();
    const now = new Date();
    const start = Math.max(0, (page - 1) * perPage);

    const pageQuery = applySort(applyFilters(visibleScope(selectVehicles(db, { count: "exact" }), now), filters), sort).range(
      start,
      start + perPage - 1,
    );
    const [{ data, error, count }, facetRows] = await Promise.all([pageQuery, visibleRows(db, now)]);
    logError("list", error);

    const items = await hydrate(db, data ?? []);
    // Facets: the listable set (sold excluded unless requested) and the result set minus make/model
    const all = facetRows
      .map((r) => mapVehicleRow(r, { baseUrl: vehicleBaseUrl(r.id), media: [], toMediaSrc }))
      .filter((v) => v.status !== "sold" || filters.includeSold);
    const { make: _m, model: _mo, ...rest } = filters;
    void _m;
    void _mo;
    const scoped = all.filter((v) => matchesFilters(v, rest));
    return { items, total: count ?? items.length, page, perPage, facets: buildFacets(all, scoped) };
  },

  async getBySlug(slug) {
    return findOne(createAdminClient(), "slug", slug);
  },

  async getById(id) {
    if (!isUuid(id)) return null;
    return findOne(createAdminClient(), "id", id);
  },

  async getByStockNumber(stockNumber) {
    return findOne(createAdminClient(), "stock_number", stockNumber);
  },

  async getMany(ids) {
    const valid = [...new Set(ids.filter(isUuid))];
    if (valid.length === 0) return [];
    const db = createAdminClient();
    const now = new Date();
    const { data, error } = await visibleScope(selectVehicles(db), now).in("id", valid);
    logError("getMany", error);
    const vehicles = await hydrate(db, data ?? []);
    return vehicles.filter((v) => isPubliclyVisible(v, now));
  },

  async countPublished() {
    const db = createAdminClient();
    const { count, error } = await visibleScope(selectVehicles(db, { count: "exact", head: true }), new Date()).neq("status", "sold");
    logError("countPublished", error);
    return count ?? 0;
  },

  async countByBodyType() {
    const db = createAdminClient();
    const rows = (await visibleRows(db, new Date())).filter((r) => r.status !== "sold");
    const vehicles = rows.map((r) => mapVehicleRow(r, { baseUrl: "", media: [], toMediaSrc }));
    return countFacet<BodyType>(vehicles, (v) => v.bodyType);
  },

  async featured() {
    const db = createAdminClient();
    const now = new Date();
    const { data, error } = await visibleScope(selectVehicles(db), now)
      .eq("status", "available")
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    logError("featured", error);
    if (!data) return null;
    const [vehicle] = await hydrate(db, [data]);
    return vehicle ?? null;
  },

  async recent(limit) {
    const db = createAdminClient();
    const now = new Date();
    const { data, error } = await visibleScope(selectVehicles(db), now)
      .neq("status", "sold")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    logError("recent", error);
    return hydrate(db, data ?? []);
  },

  async similar(vehicle, limit) {
    const db = createAdminClient();
    const rows = (await visibleRows(db, new Date())).filter((r) => r.id !== vehicle.id && r.status !== "sold");
    const ranked = rows
      .map((r) => mapVehicleRow(r, { baseUrl: vehicleBaseUrl(r.id), media: [], toMediaSrc }))
      .map((v) => ({ v, s: similarityScore(vehicle, v) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.v);
    // Re-hydrate the winners with their media (cards show the spin cover first, media is the fallback)
    const byId = new Map(rows.map((r) => [r.id, r]));
    return hydrate(
      db,
      ranked.map((v) => byId.get(v.id)).filter((r): r is VehicleRow => Boolean(r)),
    );
  },

  async publishedSlugs() {
    const db = createAdminClient();
    const rows = await visibleRows(db, new Date());
    return rows.map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
  },
};
