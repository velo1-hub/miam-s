import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildVehicleSlug } from "./slug";
import type { Vehicle, VehicleStatus } from "./types";

/** Admin-side vehicle access (drafts included) with writes. Demo: overlay persisted to .cache; Supabase: table writes. */
export interface AdminVehicleRepository {
  listAll(): Promise<Vehicle[]>;
  get(id: string): Promise<Vehicle | null>;
  upsert(vehicle: Vehicle): Promise<Vehicle>;
  setStatus(ids: string[], status: VehicleStatus): Promise<void>;
  remove(id: string): Promise<void>;
  create(partial: Partial<Vehicle>): Promise<Vehicle>;
}

const FILE = path.join(process.cwd(), ".cache", "demo-vehicles.json");
let overlay: Record<string, Vehicle | null> | null = null;
const load = () => {
  if (overlay) return overlay;
  try {
    overlay = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as Record<string, Vehicle | null>) : {};
  } catch {
    overlay = {};
  }
  return overlay;
};
const persist = () => {
  try {
    mkdirSync(path.dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(overlay));
  } catch {
    /* ignore */
  }
};

export function emptyVehicle(id: string): Vehicle {
  const now = new Date().toISOString();
  return {
    id, slug: "", stockNumber: "", vin: null, status: "draft", condition: "used", year: new Date().getFullYear(), make: "", model: "", trim: null, bodyType: "suv",
    drivetrain: null, transmission: null, fuelType: null, engine: null, horsepower: null, electricRangeKm: null, odometerKm: 0, exteriorColor: null, exteriorColorHex: null,
    interiorColor: null, doors: null, seats: null, priceCad: 0, previousPriceCad: null, descriptionFr: "", descriptionEn: null, features: [], carfaxUrl: null, accidentFree: null,
    ownersCount: null, warrantyClass: null, manufacturerWarrantyFr: null, manufacturerWarrantyEn: null, featured: false, spin: null, media: [], publishedAt: null, soldAt: null,
    createdAt: now, updatedAt: now, demo: false,
  };
}

export const demoAdminVehicleRepository: AdminVehicleRepository = {
  async listAll() {
    const { allSeedVehicles } = await import("./seed-repository");
    const o = load();
    const base = allSeedVehicles().filter((v) => o[v.id] !== null).map((v) => o[v.id] ?? v);
    const extra = Object.values(o).filter((v): v is Vehicle => Boolean(v) && !allSeedVehicles().some((s) => s.id === (v as Vehicle).id));
    return [...extra, ...base].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id) {
    return (await this.listAll()).find((v) => v.id === id) ?? null;
  },
  async upsert(vehicle) {
    const o = load();
    const v: Vehicle = { ...vehicle, slug: vehicle.make && vehicle.model ? buildVehicleSlug(vehicle) : vehicle.slug, updatedAt: new Date().toISOString() };
    o[v.id] = v;
    persist();
    return v;
  },
  async setStatus(ids, status) {
    for (const id of ids) {
      const v = await this.get(id);
      if (v) await this.upsert({ ...v, status, soldAt: status === "sold" && !v.soldAt ? new Date().toISOString() : v.soldAt });
    }
  },
  async remove(id) {
    const o = load();
    o[id] = null;
    persist();
  },
  async create(partial) {
    const id = `v-${Date.now().toString(36)}`;
    return this.upsert({ ...emptyVehicle(id), ...partial, id });
  },
};

export async function getAdminVehicleRepository(): Promise<AdminVehicleRepository> {
  const demo = process.env.DEMO_MODE !== "false" || !process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (demo) return demoAdminVehicleRepository;
  const { supabaseAdminVehicleRepository } = await import("./supabase-admin-repository");
  return supabaseAdminVehicleRepository;
}

/** Publish validation — brief §15: VIN, price, km, FR description and ≥ 24 spin frames or ≥ 8 photos. */
export function publishProblems(v: Vehicle): string[] {
  const p: string[] = [];
  if (!v.vin || v.vin.length !== 17) p.push("NIV (17 caractères)");
  if (!v.priceCad || v.priceCad <= 0) p.push("Prix tout inclus");
  if (v.odometerKm === null || v.odometerKm < 0) p.push("Kilométrage");
  if (!v.descriptionFr.trim()) p.push("Description en français");
  if (!v.make || !v.model || !v.stockNumber) p.push("Marque, modèle et numéro de stock");
  const frames = v.spin?.frameCount ?? 0;
  const photos = v.media.filter((m) => m.kind !== "panorama").length;
  if (frames < 24 && photos < 8) p.push("Au moins 24 images 360° ou 8 photos");
  return p;
}
