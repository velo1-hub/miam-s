import type { Vehicle, VehicleFilters, VehicleSort } from "./types";

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Pure predicate shared by the seed repository and tests. The Supabase repository mirrors it in SQL. */
export function matchesFilters(v: Vehicle, f: VehicleFilters): boolean {
  if (f.condition?.length && !f.condition.includes(v.condition)) return false;
  if (f.make?.length && !f.make.map(normalize).includes(normalize(v.make))) return false;
  if (f.model?.length && !f.model.map(normalize).includes(normalize(v.model))) return false;
  if (f.yearMin !== undefined && v.year < f.yearMin) return false;
  if (f.yearMax !== undefined && v.year > f.yearMax) return false;
  if (f.priceMin !== undefined && v.priceCad < f.priceMin) return false;
  if (f.priceMax !== undefined && v.priceCad > f.priceMax) return false;
  if (f.kmMax !== undefined && v.odometerKm > f.kmMax) return false;
  if (f.bodyType?.length && !f.bodyType.includes(v.bodyType)) return false;
  if (f.drivetrain?.length && (!v.drivetrain || !f.drivetrain.includes(v.drivetrain))) return false;
  if (f.transmission?.length && (!v.transmission || !f.transmission.includes(v.transmission))) return false;
  if (f.fuel?.length && (!v.fuelType || !f.fuel.includes(v.fuelType))) return false;
  if (f.color?.length && (!v.exteriorColor || !f.color.map(normalize).includes(normalize(v.exteriorColor)))) return false;
  if (f.seatsMin !== undefined && (v.seats ?? 0) < f.seatsMin) return false;
  if (f.features?.length && !f.features.every((k) => v.features.includes(k))) return false;
  if (f.featured !== undefined && v.featured !== f.featured) return false;
  if (!f.includeSold && v.status === "sold") return false;
  if (f.q) {
    const hay = normalize([v.year, v.make, v.model, v.trim ?? "", v.stockNumber, v.vin ?? "", v.exteriorColor ?? ""].join(" "));
    const terms = normalize(f.q).split(/\s+/).filter(Boolean);
    if (!terms.every((t) => hay.includes(t))) return false;
  }
  return true;
}

export function sortVehicles(items: Vehicle[], sort: VehicleSort): Vehicle[] {
  const copy = [...items];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.priceCad - b.priceCad);
    case "price_desc":
      return copy.sort((a, b) => b.priceCad - a.priceCad);
    case "km_asc":
      return copy.sort((a, b) => a.odometerKm - b.odometerKm);
    case "year_desc":
      return copy.sort((a, b) => b.year - a.year || a.odometerKm - b.odometerKm);
    case "newest":
    default:
      return copy.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  }
}

/** Similarity score — brief §27.3: body type, price ±20 %, fuel, km proximity. */
export function similarityScore(ref: Vehicle, other: Vehicle): number {
  let score = 0;
  if (other.bodyType === ref.bodyType) score += 4;
  const priceDelta = Math.abs(other.priceCad - ref.priceCad) / ref.priceCad;
  if (priceDelta <= 0.2) score += 3 - priceDelta * 5;
  if (other.fuelType && other.fuelType === ref.fuelType) score += 1.5;
  const kmDelta = Math.abs(other.odometerKm - ref.odometerKm);
  score += Math.max(0, 1.5 - kmDelta / 60_000);
  if (other.make === ref.make) score += 0.5;
  return score;
}

export function isEmptyFilters(f: VehicleFilters): boolean {
  return Object.entries(f).every(([k, v]) => {
    if (k === "includeSold") return true;
    if (Array.isArray(v)) return v.length === 0;
    return v === undefined || v === "" || v === null;
  });
}
