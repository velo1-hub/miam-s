import { describe, expect, it } from "vitest";
import type { VehicleMediaRow, VehicleRow } from "@/lib/supabase/database.types";
import { mapMedia, mapSpin, mapVehicleRow } from "./supabase-mapper";

const row: VehicleRow = {
  id: "0b6c6f1e-7a2e-4d2e-9d6b-1f4c3a2b1c0d",
  slug: "2023-toyota-rav4-xle-ti-a2301",
  stock_number: "A2301",
  vin: "2T3P1RFV5PW000001",
  status: "available",
  condition: "used",
  year: 2023,
  make: "Toyota",
  model: "RAV4",
  trim_level: "XLE TI",
  body_type: "suv",
  drivetrain: "awd",
  transmission: "automatic",
  fuel_type: "gasoline",
  engine: "2,5 L",
  horsepower: 203,
  electric_range_km: null,
  odometer_km: 38400,
  exterior_color: "Blanc perle",
  exterior_color_hex: "#EDECE6",
  interior_color: "Noir",
  doors: 5,
  seats: 5,
  price_cad: 36495,
  previous_price_cad: 37495,
  description_fr: "VUS compact",
  description_en: null,
  features: ["heated_seats", "not_a_feature", "sunroof"],
  carfax_url: null,
  accident_free: true,
  owners_count: 1,
  warranty_class: "A",
  manufacturer_warranty_fr: null,
  manufacturer_warranty_en: null,
  featured: true,
  demo: false,
  spin_frame_count: 36,
  spin_cover_frame: 4,
  spin_reverse: false,
  spin_version: 2,
  spin_meta: { sizes: ["sm", "md"], formats: ["avif", "webp"], lqip: "data:image/webp;base64,AA==", width: 1600, height: 900 },
  published_at: "2026-11-04T14:00:00+00:00",
  sold_at: null,
  created_at: "2026-11-04T14:00:00+00:00",
  updated_at: "2026-11-05T09:00:00+00:00",
};

const media: VehicleMediaRow[] = [
  { id: "m2", vehicle_id: row.id, kind: "gallery", position: 2, path: "vehicles/x/gallery/02.webp", width: 1600, height: 900, lqip: null, alt_fr: "Arrière", alt_en: "Rear" },
  { id: "m1", vehicle_id: row.id, kind: "gallery", position: 1, path: "vehicles/x/gallery/01.webp", width: null, height: null, lqip: "data:l", alt_fr: "Avant", alt_en: null },
  { id: "m0", vehicle_id: row.id, kind: "spin", position: 1, path: "vehicles/x/spin/v2/md/01.webp", width: null, height: null, lqip: null, alt_fr: null, alt_en: null },
];

const toSrc = (p: string) => `https://cdn.example/${p}`;

describe("mapVehicleRow", () => {
  it("maps snake_case columns, trim_level and drops unknown features", () => {
    const v = mapVehicleRow(row, { baseUrl: "https://cdn.example/vehicles/x", media, toMediaSrc: toSrc });
    expect(v.trim).toBe("XLE TI");
    expect(v.stockNumber).toBe("A2301");
    expect(v.features).toEqual(["heated_seats", "sunroof"]);
    expect(v.priceCad).toBe(36495);
    expect(v.demo).toBe(false);
  });

  it("builds the spin set from columns + spin_meta", () => {
    const spin = mapSpin(row, "https://cdn.example/vehicles/x");
    expect(spin).toMatchObject({ frameCount: 36, coverFrame: 4, version: 2, sizes: ["sm", "md"], formats: ["avif", "webp"], width: 1600, height: 900 });
    expect(spin?.baseUrl).toBe("https://cdn.example/vehicles/x");
  });

  it("returns no spin set when frames are missing and falls back to every size when meta is absent", () => {
    expect(mapSpin({ ...row, spin_frame_count: null }, "b")).toBeNull();
    expect(mapSpin({ ...row, spin_meta: null }, "b")?.sizes).toEqual(["sm", "md", "lg", "xl"]);
  });

  it("maps media rows, skips spin frames and sorts by position", () => {
    const m = mapMedia(media, toSrc);
    expect(m.map((x) => x.position)).toEqual([1, 2]);
    expect(m[0]).toMatchObject({ kind: "gallery", src: "https://cdn.example/vehicles/x/gallery/01.webp", width: 1600, height: 900, lqip: "data:l", altFr: "Avant", altEn: "" });
  });
});
