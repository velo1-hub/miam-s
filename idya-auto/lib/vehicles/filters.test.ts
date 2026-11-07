import { describe, expect, it } from "vitest";
import { matchesFilters, similarityScore, sortVehicles } from "./filters";
import type { Vehicle } from "./types";

const base: Vehicle = {
  id: "1",
  slug: "2022-toyota-rav4-xle-a1",
  stockNumber: "A1",
  vin: "JTMW1RFV0ND000001",
  status: "available",
  condition: "used",
  year: 2022,
  make: "Toyota",
  model: "RAV4",
  trim: "XLE",
  bodyType: "suv",
  drivetrain: "awd",
  transmission: "automatic",
  fuelType: "gasoline",
  engine: "2.5 L 4 cyl.",
  horsepower: 203,
  electricRangeKm: null,
  odometerKm: 45_200,
  exteriorColor: "Blanc perle",
  exteriorColorHex: "#f2f2f0",
  interiorColor: "Noir",
  doors: 5,
  seats: 5,
  priceCad: 28_995,
  previousPriceCad: null,
  descriptionFr: "",
  descriptionEn: null,
  features: ["heated_seats", "carplay_android"],
  carfaxUrl: null,
  accidentFree: true,
  ownersCount: 1,
  warrantyClass: "B",
  manufacturerWarrantyFr: null,
  manufacturerWarrantyEn: null,
  featured: false,
  spin: null,
  media: [],
  publishedAt: "2026-10-01T00:00:00Z",
  soldAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  demo: true,
};

describe("matchesFilters", () => {
  it("matches on make case- and accent-insensitively", () => {
    expect(matchesFilters(base, { make: ["toyota"] })).toBe(true);
    expect(matchesFilters(base, { make: ["Honda"] })).toBe(false);
  });
  it("requires every requested feature", () => {
    expect(matchesFilters(base, { features: ["heated_seats"] })).toBe(true);
    expect(matchesFilters(base, { features: ["heated_seats", "sunroof"] })).toBe(false);
  });
  it("applies numeric bounds inclusively", () => {
    expect(matchesFilters(base, { priceMax: 28_995, kmMax: 45_200 })).toBe(true);
    expect(matchesFilters(base, { priceMax: 28_000 })).toBe(false);
  });
  it("excludes sold vehicles unless asked", () => {
    const sold = { ...base, status: "sold" as const };
    expect(matchesFilters(sold, {})).toBe(false);
    expect(matchesFilters(sold, { includeSold: true })).toBe(true);
  });
  it("full-text query matches stock number and VIN", () => {
    expect(matchesFilters(base, { q: "a1" })).toBe(true);
    expect(matchesFilters(base, { q: "ND000001" })).toBe(true);
    expect(matchesFilters(base, { q: "rav4 toyota 2022" })).toBe(true);
    expect(matchesFilters(base, { q: "civic" })).toBe(false);
  });
});

describe("sortVehicles", () => {
  const cheaper = { ...base, id: "2", priceCad: 20_000, odometerKm: 90_000, year: 2019, publishedAt: "2026-11-01T00:00:00Z" };
  it("sorts by price, km, year and recency", () => {
    expect(sortVehicles([base, cheaper], "price_asc")[0].id).toBe("2");
    expect(sortVehicles([base, cheaper], "price_desc")[0].id).toBe("1");
    expect(sortVehicles([base, cheaper], "km_asc")[0].id).toBe("1");
    expect(sortVehicles([base, cheaper], "year_desc")[0].id).toBe("1");
    expect(sortVehicles([base, cheaper], "newest")[0].id).toBe("2");
  });
});

describe("similarityScore", () => {
  it("prefers same body type within ±20 % price", () => {
    const twin = { ...base, id: "3", priceCad: 30_000 };
    const truck = { ...base, id: "4", bodyType: "truck" as const, priceCad: 55_000, fuelType: "diesel" as const };
    expect(similarityScore(base, twin)).toBeGreaterThan(similarityScore(base, truck));
  });
});
