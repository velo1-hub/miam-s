import "server-only";
import type { AdminVehicleRepository } from "./admin-repository";

/** Implemented with the Supabase schema (backend task). */
export const supabaseAdminVehicleRepository: AdminVehicleRepository = new Proxy({} as AdminVehicleRepository, {
  get() {
    throw new Error("Supabase admin vehicle repository is not available yet — run in DEMO_MODE.");
  },
});
