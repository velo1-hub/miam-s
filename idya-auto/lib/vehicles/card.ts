import { coverImage } from "./media";
import type { Condition, SpinSet, Vehicle, VehicleStatus } from "./types";

/** Serializable subset of a vehicle for cards, rails, compare and the assistant's rich cards. */
export interface VehicleCardData {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  odometerKm: number;
  priceCad: number;
  previousPriceCad: number | null;
  condition: Condition;
  status: VehicleStatus;
  publishedAt: string | null;
  bodyType: Vehicle["bodyType"];
  fuelType: Vehicle["fuelType"];
  drivetrain: Vehicle["drivetrain"];
  transmission: Vehicle["transmission"];
  seats: number | null;
  exteriorColor: string | null;
  cover: { src: string; width: number; height: number; lqip?: string } | null;
  spin: SpinSet | null;
  demo: boolean;
}

export function toCardData(v: Vehicle): VehicleCardData {
  return {
    id: v.id,
    slug: v.slug,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim,
    odometerKm: v.odometerKm,
    priceCad: v.priceCad,
    previousPriceCad: v.previousPriceCad,
    condition: v.condition,
    status: v.status,
    publishedAt: v.publishedAt,
    bodyType: v.bodyType,
    fuelType: v.fuelType,
    drivetrain: v.drivetrain,
    transmission: v.transmission,
    seats: v.seats,
    exteriorColor: v.exteriorColor,
    cover: coverImage(v),
    spin: v.spin,
    demo: v.demo,
  };
}

/** "Nouvel arrivage" = published within the last 14 days (brief §3.2 red zones). */
export function isNewArrival(publishedAt: string | null, now: number): boolean {
  if (!publishedAt) return false;
  return now - new Date(publishedAt).getTime() < 14 * 86_400_000;
}
