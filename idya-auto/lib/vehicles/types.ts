export const VEHICLE_STATUSES = ["draft", "available", "pending", "sold", "archived"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const CONDITIONS = ["new", "used", "certified"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const BODY_TYPES = ["suv", "sedan", "truck", "coupe", "hatchback", "wagon", "minivan", "convertible", "van"] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const DRIVETRAINS = ["fwd", "rwd", "awd", "4wd"] as const;
export type Drivetrain = (typeof DRIVETRAINS)[number];

export const TRANSMISSIONS = ["automatic", "manual", "cvt", "dct"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const FUEL_TYPES = ["gasoline", "hybrid", "plug_in_hybrid", "electric", "diesel"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const WARRANTY_CLASSES = ["A", "B", "C", "D"] as const;
export type WarrantyClass = (typeof WARRANTY_CLASSES)[number];

export const SPIN_SIZES = ["sm", "md", "lg", "xl"] as const;
export type SpinSize = (typeof SPIN_SIZES)[number];
export const SPIN_WIDTHS: Record<SpinSize, number> = { sm: 960, md: 1600, lg: 2400, xl: 3200 };

export const IMAGE_FORMATS = ["avif", "webp"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export const MEDIA_KINDS = ["spin", "interior", "gallery", "panorama"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** Feature catalog keys — labels live in messages/{fr,en}.json under "features". Brief §15. */
export const FEATURE_KEYS = [
  "remote_start",
  "heated_seats",
  "heated_steering",
  "ventilated_seats",
  "sunroof",
  "carplay_android",
  "backup_camera",
  "winter_tires",
  "blind_spot",
  "adaptive_cruise",
  "lane_keep",
  "leather",
  "navigation",
  "third_row",
  "tow_package",
  "keyless",
  "wireless_charging",
  "premium_audio",
  "led_headlights",
  "power_tailgate",
  "parking_sensors",
  "heads_up_display",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_GROUPS: Record<"comfort" | "tech" | "safety" | "utility", readonly FeatureKey[]> = {
  comfort: ["heated_seats", "heated_steering", "ventilated_seats", "leather", "sunroof", "remote_start", "keyless"],
  tech: ["carplay_android", "navigation", "wireless_charging", "premium_audio", "heads_up_display", "led_headlights"],
  safety: ["backup_camera", "blind_spot", "adaptive_cruise", "lane_keep", "parking_sensors"],
  utility: ["third_row", "tow_package", "power_tailgate", "winter_tires"],
};

/** Filters surfaced in the inventory (brief §7) and in the inventory filter chips of the AI search */
export const INVENTORY_FEATURE_FILTERS: readonly FeatureKey[] = [
  "remote_start",
  "heated_seats",
  "heated_steering",
  "sunroof",
  "carplay_android",
  "backup_camera",
  "winter_tires",
];

export interface SpinSet {
  frameCount: 24 | 36 | 48 | 72;
  coverFrame: number;
  reverse: boolean;
  version: number;
  /** Sizes actually available (demo sets may ship fewer than the full four). */
  sizes: SpinSize[];
  formats: ImageFormat[];
  /** Base URL of the vehicle's media folder, e.g. /demo/vehicles/v01 or https://…/vehicles/{id} */
  baseUrl: string;
  /** base64 data URI of the 32 px cover LQIP */
  lqip: string;
  width: number;
  height: number;
}

export interface VehicleMedia {
  kind: Exclude<MediaKind, "spin">;
  position: number;
  /** Absolute or site-relative URL */
  src: string;
  width: number;
  height: number;
  lqip?: string;
  altFr: string;
  altEn: string;
}

export interface Vehicle {
  id: string;
  slug: string;
  stockNumber: string;
  vin: string | null;
  status: VehicleStatus;
  condition: Condition;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  bodyType: BodyType;
  drivetrain: Drivetrain | null;
  transmission: Transmission | null;
  fuelType: FuelType | null;
  engine: string | null;
  horsepower: number | null;
  electricRangeKm: number | null;
  odometerKm: number;
  exteriorColor: string | null;
  exteriorColorHex: string | null;
  interiorColor: string | null;
  doors: number | null;
  seats: number | null;
  /** All-in price, taxes excluded, whole dollars (brief §17.1) */
  priceCad: number;
  previousPriceCad: number | null;
  descriptionFr: string;
  descriptionEn: string | null;
  features: FeatureKey[];
  carfaxUrl: string | null;
  accidentFree: boolean | null;
  ownersCount: number | null;
  warrantyClass: WarrantyClass | null;
  manufacturerWarrantyFr: string | null;
  manufacturerWarrantyEn: string | null;
  featured: boolean;
  spin: SpinSet | null;
  media: VehicleMedia[];
  publishedAt: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
  demo: boolean;
}

export const SORTS = ["newest", "price_asc", "price_desc", "km_asc", "year_desc"] as const;
export type VehicleSort = (typeof SORTS)[number];

export interface VehicleFilters {
  q?: string;
  condition?: Condition[];
  make?: string[];
  model?: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  kmMax?: number;
  bodyType?: BodyType[];
  drivetrain?: Drivetrain[];
  transmission?: Transmission[];
  fuel?: FuelType[];
  color?: string[];
  seatsMin?: number;
  features?: FeatureKey[];
  /** Include sold vehicles (vehicle pages stay live 60 days). Default false in listings. */
  includeSold?: boolean;
  featured?: boolean;
}

export interface FacetCount<T extends string = string> {
  value: T;
  count: number;
}

export interface VehicleFacets {
  condition: FacetCount<Condition>[];
  make: FacetCount[];
  model: FacetCount[];
  bodyType: FacetCount<BodyType>[];
  drivetrain: FacetCount<Drivetrain>[];
  transmission: FacetCount<Transmission>[];
  fuel: FacetCount<FuelType>[];
  color: FacetCount[];
  /** Exterior colour name → hex swatch */
  colorHex: Record<string, string>;
  features: FacetCount<FeatureKey>[];
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
  kmMax: number;
}

export interface VehicleListResult {
  items: Vehicle[];
  total: number;
  page: number;
  perPage: number;
  facets: VehicleFacets;
}

export interface VehicleRepository {
  list(filters: VehicleFilters, sort: VehicleSort, page: number, perPage: number): Promise<VehicleListResult>;
  getBySlug(slug: string): Promise<Vehicle | null>;
  getById(id: string): Promise<Vehicle | null>;
  getByStockNumber(stockNumber: string): Promise<Vehicle | null>;
  getMany(ids: string[]): Promise<Vehicle[]>;
  countPublished(): Promise<number>;
  countByBodyType(): Promise<FacetCount<BodyType>[]>;
  featured(): Promise<Vehicle | null>;
  recent(limit: number): Promise<Vehicle[]>;
  similar(vehicle: Vehicle, limit: number): Promise<Vehicle[]>;
  /** Published slugs with last update, for the sitemap */
  publishedSlugs(): Promise<{ slug: string; updatedAt: string }[]>;
}

export function vehicleTitle(v: Pick<Vehicle, "year" | "make" | "model">): string {
  return `${v.year} ${v.make} ${v.model}`;
}

export function vehicleFullTitle(v: Pick<Vehicle, "year" | "make" | "model" | "trim">): string {
  return v.trim ? `${vehicleTitle(v)} ${v.trim}` : vehicleTitle(v);
}

export function isPubliclyVisible(v: Vehicle, now = new Date()): boolean {
  if (!["available", "pending", "sold"].includes(v.status)) return false;
  if (!v.publishedAt || new Date(v.publishedAt) > now) return false;
  if (v.status === "sold" && v.soldAt) {
    const soldDays = (now.getTime() - new Date(v.soldAt).getTime()) / 86_400_000;
    if (soldDays > 60) return false;
  }
  return true;
}
