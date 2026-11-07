import seed from "@/demo/seed.json";
import { matchesFilters, similarityScore, sortVehicles } from "./filters";
import type {
  BodyType,
  FacetCount,
  Vehicle,
  VehicleFacets,
  VehicleFilters,
  VehicleListResult,
  VehicleRepository,
  VehicleSort,
} from "./types";
import { isPubliclyVisible, FEATURE_KEYS } from "./types";
import { buildVehicleSlug } from "./slug";

type SeedVehicle = Omit<Vehicle, "slug" | "demo" | "spin" | "media"> & {
  render?: unknown;
  spin?: Vehicle["spin"];
  media?: Vehicle["media"];
};

function hydrate(raw: SeedVehicle): Vehicle {
  const { render: _render, ...rest } = raw;
  void _render;
  return {
    ...rest,
    slug: buildVehicleSlug(rest),
    spin: raw.spin ?? null,
    media: raw.media ?? [],
    demo: true,
  };
}

const ALL: Vehicle[] = (seed.vehicles as unknown as SeedVehicle[]).map(hydrate);

function visible(): Vehicle[] {
  const now = new Date();
  return ALL.filter((v) => isPubliclyVisible(v, now));
}

function count<T extends string>(items: Vehicle[], pick: (v: Vehicle) => T | null | undefined): FacetCount<T>[] {
  const m = new Map<T, number>();
  for (const v of items) {
    const k = pick(v);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
}

function facets(items: Vehicle[], scoped: Vehicle[]): VehicleFacets {
  const features = new Map<string, number>();
  for (const v of scoped) for (const f of v.features) features.set(f, (features.get(f) ?? 0) + 1);
  const prices = items.map((v) => v.priceCad);
  const years = items.map((v) => v.year);
  return {
    condition: count(scoped, (v) => v.condition),
    make: count(scoped, (v) => v.make),
    model: count(scoped, (v) => v.model),
    bodyType: count(scoped, (v) => v.bodyType),
    drivetrain: count(scoped, (v) => v.drivetrain),
    transmission: count(scoped, (v) => v.transmission),
    fuel: count(scoped, (v) => v.fuelType),
    color: count(scoped, (v) => v.exteriorColor),
    colorHex: Object.fromEntries(scoped.filter((v) => v.exteriorColor && v.exteriorColorHex).map((v) => [v.exteriorColor as string, v.exteriorColorHex as string])),
    features: FEATURE_KEYS.filter((k) => features.has(k)).map((k) => ({ value: k, count: features.get(k) ?? 0 })),
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    yearRange: { min: Math.min(...years), max: Math.max(...years) },
    kmMax: Math.max(...items.map((v) => v.odometerKm)),
  };
}

export const seedVehicleRepository: VehicleRepository = {
  async list(filters: VehicleFilters, sort: VehicleSort, page: number, perPage: number): Promise<VehicleListResult> {
    const all = visible().filter((v) => v.status !== "sold" || filters.includeSold);
    const matched = sortVehicles(all.filter((v) => matchesFilters(v, filters)), sort);
    // Facets are computed on the result set minus the make/model dimension so counts stay useful
    const { make: _m, model: _mo, ...rest } = filters;
    void _m;
    void _mo;
    const scoped = all.filter((v) => matchesFilters(v, rest));
    const start = (page - 1) * perPage;
    return { items: matched.slice(start, start + perPage), total: matched.length, page, perPage, facets: facets(all, scoped) };
  },
  async getBySlug(slug) {
    return visible().find((v) => v.slug === slug) ?? null;
  },
  async getById(id) {
    return visible().find((v) => v.id === id) ?? null;
  },
  async getByStockNumber(stockNumber) {
    const s = stockNumber.toLowerCase();
    return visible().find((v) => v.stockNumber.toLowerCase() === s) ?? null;
  },
  async getMany(ids) {
    const set = new Set(ids);
    return visible().filter((v) => set.has(v.id));
  },
  async countPublished() {
    return visible().filter((v) => v.status !== "sold").length;
  },
  async countByBodyType() {
    return count<BodyType>(visible().filter((v) => v.status !== "sold"), (v) => v.bodyType);
  },
  async featured() {
    const pool = visible().filter((v) => v.status === "available");
    return pool.find((v) => v.featured) ?? pool[0] ?? null;
  },
  async recent(limit) {
    return sortVehicles(visible().filter((v) => v.status !== "sold"), "newest").slice(0, limit);
  },
  async similar(vehicle, limit) {
    return visible()
      .filter((v) => v.id !== vehicle.id && v.status !== "sold")
      .map((v) => ({ v, s: similarityScore(vehicle, v) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.v);
  },
  async publishedSlugs() {
    return visible().map((v) => ({ slug: v.slug, updatedAt: v.updatedAt }));
  },
};

/** Admin-side access to every record including drafts (demo mode). */
export function allSeedVehicles(): Vehicle[] {
  return ALL;
}
