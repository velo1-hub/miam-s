import type { FacetCount, Vehicle, VehicleFacets } from "./types";
import { FEATURE_KEYS } from "./types";

/** Counts a dimension over a vehicle set, most frequent first then alphabetical. */
export function countFacet<T extends string>(items: Vehicle[], pick: (v: Vehicle) => T | null | undefined): FacetCount<T>[] {
  const m = new Map<T, number>();
  for (const v of items) {
    const k = pick(v);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
}

const range = (values: number[]): { min: number; max: number } =>
  values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 0 };

/**
 * Inventory facets (brief §7). `all` = every listable vehicle (ranges), `scoped` = the result set
 * minus the make/model dimension so counts stay useful while narrowing. Same semantics as the seed
 * repository; shared by the Supabase repository which computes facets in JS from a filtered fetch.
 */
export function buildFacets(all: Vehicle[], scoped: Vehicle[]): VehicleFacets {
  const features = new Map<string, number>();
  for (const v of scoped) for (const f of v.features) features.set(f, (features.get(f) ?? 0) + 1);
  return {
    condition: countFacet(scoped, (v) => v.condition),
    make: countFacet(scoped, (v) => v.make),
    model: countFacet(scoped, (v) => v.model),
    bodyType: countFacet(scoped, (v) => v.bodyType),
    drivetrain: countFacet(scoped, (v) => v.drivetrain),
    transmission: countFacet(scoped, (v) => v.transmission),
    fuel: countFacet(scoped, (v) => v.fuelType),
    color: countFacet(scoped, (v) => v.exteriorColor),
    colorHex: Object.fromEntries(
      scoped.filter((v) => v.exteriorColor && v.exteriorColorHex).map((v) => [v.exteriorColor as string, v.exteriorColorHex as string]),
    ),
    features: FEATURE_KEYS.filter((k) => features.has(k)).map((k) => ({ value: k, count: features.get(k) ?? 0 })),
    priceRange: range(all.map((v) => v.priceCad)),
    yearRange: range(all.map((v) => v.year)),
    kmMax: all.length ? Math.max(...all.map((v) => v.odometerKm)) : 0,
  };
}
