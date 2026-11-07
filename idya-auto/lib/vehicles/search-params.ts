import { createLoader, createSerializer, parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, parseAsStringEnum, type inferParserType } from "nuqs/server";
import {
  BODY_TYPES,
  CONDITIONS,
  DRIVETRAINS,
  FEATURE_KEYS,
  FUEL_TYPES,
  SORTS,
  TRANSMISSIONS,
  type BodyType,
  type Condition,
  type Drivetrain,
  type FeatureKey,
  type FuelType,
  type Transmission,
  type VehicleFilters,
  type VehicleSort,
} from "./types";

/** URL state for the inventory — brief §7: every filter lives in the URL, shareable and crawlable. */
export const inventoryParsers = {
  q: parseAsString.withDefault(""),
  ai: parseAsBoolean.withDefault(false),
  condition: parseAsArrayOf(parseAsStringEnum<Condition>([...CONDITIONS])).withDefault([]),
  make: parseAsArrayOf(parseAsString).withDefault([]),
  model: parseAsArrayOf(parseAsString).withDefault([]),
  year_min: parseAsInteger,
  year_max: parseAsInteger,
  price_min: parseAsInteger,
  price_max: parseAsInteger,
  km_max: parseAsInteger,
  body: parseAsArrayOf(parseAsStringEnum<BodyType>([...BODY_TYPES])).withDefault([]),
  drive: parseAsArrayOf(parseAsStringEnum<Drivetrain>([...DRIVETRAINS])).withDefault([]),
  trans: parseAsArrayOf(parseAsStringEnum<Transmission>([...TRANSMISSIONS])).withDefault([]),
  fuel: parseAsArrayOf(parseAsStringEnum<FuelType>([...FUEL_TYPES])).withDefault([]),
  color: parseAsArrayOf(parseAsString).withDefault([]),
  seats: parseAsInteger,
  features: parseAsArrayOf(parseAsStringEnum<FeatureKey>([...FEATURE_KEYS])).withDefault([]),
  sort: parseAsStringEnum<VehicleSort>([...SORTS]).withDefault("newest"),
  page: parseAsInteger.withDefault(1),
};

export type InventoryParams = inferParserType<typeof inventoryParsers>;
export const loadInventoryParams = createLoader(inventoryParsers);
export const serializeInventoryParams = createSerializer(inventoryParsers);

export const PER_PAGE = 24;

export function paramsToFilters(p: InventoryParams, opts?: { ignoreQuery?: boolean }): VehicleFilters {
  return {
    q: opts?.ignoreQuery ? undefined : p.q || undefined,
    condition: p.condition.length ? p.condition : undefined,
    make: p.make.length ? p.make : undefined,
    model: p.model.length ? p.model : undefined,
    yearMin: p.year_min ?? undefined,
    yearMax: p.year_max ?? undefined,
    priceMin: p.price_min ?? undefined,
    priceMax: p.price_max ?? undefined,
    kmMax: p.km_max ?? undefined,
    bodyType: p.body.length ? p.body : undefined,
    drivetrain: p.drive.length ? p.drive : undefined,
    transmission: p.trans.length ? p.trans : undefined,
    fuel: p.fuel.length ? p.fuel : undefined,
    color: p.color.length ? p.color : undefined,
    seatsMin: p.seats ?? undefined,
    features: p.features.length ? p.features : undefined,
  };
}

/** Merges filters parsed from a natural-language query into URL params (URL values win). */
export function mergeFilters(p: InventoryParams, f: VehicleFilters): InventoryParams {
  return {
    ...p,
    condition: p.condition.length ? p.condition : (f.condition ?? []),
    make: p.make.length ? p.make : (f.make ?? []),
    model: p.model.length ? p.model : (f.model ?? []),
    year_min: p.year_min ?? f.yearMin ?? null,
    year_max: p.year_max ?? f.yearMax ?? null,
    price_min: p.price_min ?? f.priceMin ?? null,
    price_max: p.price_max ?? f.priceMax ?? null,
    km_max: p.km_max ?? f.kmMax ?? null,
    body: p.body.length ? p.body : (f.bodyType ?? []),
    drive: p.drive.length ? p.drive : (f.drivetrain ?? []),
    trans: p.trans.length ? p.trans : (f.transmission ?? []),
    fuel: p.fuel.length ? p.fuel : (f.fuel ?? []),
    color: p.color.length ? p.color : (f.color ?? []),
    seats: p.seats ?? f.seatsMin ?? null,
    features: p.features.length ? p.features : (f.features ?? []),
  };
}

export function activeFilterCount(p: InventoryParams): number {
  let n = 0;
  n += p.condition.length + p.make.length + p.model.length + p.body.length + p.drive.length + p.trans.length + p.fuel.length + p.color.length + p.features.length;
  for (const k of ["year_min", "year_max", "price_min", "price_max", "km_max", "seats"] as const) if (p[k] !== null && p[k] !== undefined) n++;
  if (p.q) n++;
  return n;
}
