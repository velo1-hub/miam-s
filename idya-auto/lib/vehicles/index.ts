import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { VehicleRepository } from "./types";

async function pick(): Promise<VehicleRepository> {
  const demo = process.env.DEMO_MODE !== "false" || !process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (demo) {
    const { seedVehicleRepository } = await import("./seed-repository");
    return seedVehicleRepository;
  }
  const { supabaseVehicleRepository } = await import("./supabase-repository");
  return supabaseVehicleRepository;
}

/**
 * Cached façade over the repository — brief §19 "static generation + on-demand revalidation".
 * Every read is tagged `vehicles` (plus `vehicle:{slug}`) so admin saves call updateTag/revalidateTag.
 * Reading the clock for "published_at <= now" and the 60-day sold window happens inside the cache.
 */
export const vehicles: VehicleRepository = {
  async list(filters, sort, page, perPage) {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).list(filters, sort, page, perPage);
  },
  async getBySlug(slug) {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles", `vehicle:${slug}`);
    return (await pick()).getBySlug(slug);
  },
  async getById(id) {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).getById(id);
  },
  async getByStockNumber(stock) {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).getByStockNumber(stock);
  },
  async getMany(ids) {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).getMany(ids);
  },
  async countPublished() {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).countPublished();
  },
  async countByBodyType() {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).countByBodyType();
  },
  async featured() {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).featured();
  },
  async recent(limit) {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).recent(limit);
  },
  async similar(vehicle, limit) {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).similar(vehicle, limit);
  },
  async publishedSlugs() {
    "use cache";
    cacheLife("minutes");
    cacheTag("vehicles");
    return (await pick()).publishedSlugs();
  },
};

/** Uncached access for Server Actions and AI tools that must see the latest data. */
export const getVehicleRepository = pick;

export * from "./types";
