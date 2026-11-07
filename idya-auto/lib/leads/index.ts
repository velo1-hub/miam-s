import "server-only";
import type { LeadRepository } from "./types";

export async function getLeadRepository(): Promise<LeadRepository> {
  const demo = process.env.DEMO_MODE !== "false" || !process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (demo) {
    const { demoLeadRepository } = await import("./demo-repository");
    return demoLeadRepository;
  }
  const { supabaseLeadRepository } = await import("./supabase-repository");
  return supabaseLeadRepository;
}

export * from "./types";
