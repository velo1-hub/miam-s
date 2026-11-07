import type { VehicleMediaRow, VehicleRow } from "@/lib/supabase/database.types";
import type { FeatureKey, ImageFormat, SpinSet, SpinSize, Vehicle, VehicleMedia } from "./types";
import { FEATURE_KEYS, IMAGE_FORMATS, SPIN_SIZES } from "./types";

/** Pure row → domain mapping (brief §16 ↔ lib/vehicles/types.ts). Kept free of server-only imports so it is unit-testable. */

const FRAME_COUNTS = [24, 36, 48, 72] as const;
type FrameCount = (typeof FRAME_COUNTS)[number];

const isFrameCount = (n: number | null): n is FrameCount => n !== null && (FRAME_COUNTS as readonly number[]).includes(n);
const isFeature = (f: string): f is FeatureKey => (FEATURE_KEYS as readonly string[]).includes(f);

interface SpinMeta {
  sizes?: unknown;
  formats?: unknown;
  lqip?: unknown;
  width?: unknown;
  height?: unknown;
}

function pickList<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(raw)) return [...allowed];
  const out = allowed.filter((a) => raw.includes(a));
  return out.length ? out : [...allowed];
}

/**
 * Builds the SpinSet from the vehicle columns (frame layout) and `spin_meta` (delivery details
 * written by the image pipeline: sizes, formats, lqip, width, height). Null until a set is processed.
 */
export function mapSpin(row: VehicleRow, baseUrl: string): SpinSet | null {
  if (!isFrameCount(row.spin_frame_count)) return null;
  const meta: SpinMeta = row.spin_meta && typeof row.spin_meta === "object" && !Array.isArray(row.spin_meta) ? (row.spin_meta as SpinMeta) : {};
  const width = typeof meta.width === "number" && meta.width > 0 ? meta.width : 1600;
  const height = typeof meta.height === "number" && meta.height > 0 ? meta.height : Math.round((width * 9) / 16);
  return {
    frameCount: row.spin_frame_count,
    coverFrame: row.spin_cover_frame,
    reverse: row.spin_reverse,
    version: row.spin_version,
    sizes: pickList<SpinSize>(meta.sizes, SPIN_SIZES),
    formats: pickList<ImageFormat>(meta.formats, IMAGE_FORMATS),
    baseUrl,
    lqip: typeof meta.lqip === "string" ? meta.lqip : "",
    width,
    height,
  };
}

/** vehicle_media rows (kind <> 'spin') → VehicleMedia. `toSrc` resolves the bucket path to a public URL. */
export function mapMedia(rows: VehicleMediaRow[], toSrc: (path: string) => string): VehicleMedia[] {
  return rows
    .filter((m): m is VehicleMediaRow & { kind: Exclude<VehicleMediaRow["kind"], "spin"> } => m.kind !== "spin")
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      kind: m.kind,
      position: m.position,
      src: /^https?:\/\//.test(m.path) ? m.path : toSrc(m.path),
      width: m.width ?? 1600,
      height: m.height ?? 900,
      lqip: m.lqip ?? undefined,
      altFr: m.alt_fr ?? "",
      altEn: m.alt_en ?? "",
    }));
}

export interface MapVehicleOptions {
  /** Public folder of the vehicle's media, e.g. https://…/storage/v1/object/public/vehicles/vehicles/{id} */
  baseUrl: string;
  media: VehicleMediaRow[];
  toMediaSrc: (path: string) => string;
}

/**
 * Database row → Vehicle. Draft rows may have null price / km / body type / condition (C4.1); the
 * public repository only serves published rows, so the fallbacks below are for admin views of drafts.
 */
export function mapVehicleRow(row: VehicleRow, opts: MapVehicleOptions): Vehicle {
  return {
    id: row.id,
    slug: row.slug,
    stockNumber: row.stock_number,
    vin: row.vin,
    status: row.status,
    condition: row.condition ?? "used",
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim_level,
    bodyType: row.body_type ?? "sedan",
    drivetrain: row.drivetrain,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    engine: row.engine,
    horsepower: row.horsepower,
    electricRangeKm: row.electric_range_km,
    odometerKm: row.odometer_km ?? 0,
    exteriorColor: row.exterior_color,
    exteriorColorHex: row.exterior_color_hex,
    interiorColor: row.interior_color,
    doors: row.doors,
    seats: row.seats,
    priceCad: row.price_cad ?? 0,
    previousPriceCad: row.previous_price_cad,
    descriptionFr: row.description_fr,
    descriptionEn: row.description_en,
    features: row.features.filter(isFeature),
    carfaxUrl: row.carfax_url,
    accidentFree: row.accident_free,
    ownersCount: row.owners_count,
    warrantyClass: row.warranty_class,
    manufacturerWarrantyFr: row.manufacturer_warranty_fr,
    manufacturerWarrantyEn: row.manufacturer_warranty_en,
    featured: row.featured,
    spin: mapSpin(row, opts.baseUrl),
    media: mapMedia(opts.media, opts.toMediaSrc),
    publishedAt: row.published_at,
    soldAt: row.sold_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    demo: row.demo,
  };
}
