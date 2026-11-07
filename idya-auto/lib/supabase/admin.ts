import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type AdminClient = SupabaseClient<Database>;

let client: AdminClient | null = null;

/**
 * Service-role client for server-side reads and writes (repositories, leads, bookings, chat,
 * image pipeline). Bypasses RLS — never shipped to the browser, never used for staff auth.
 */
export function createAdminClient(): AdminClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Public URL of an object in a public bucket (`vehicles`, `demo`). Brief §10.2 step 6. */
export function publicStorageUrl(bucket: "vehicles" | "demo", path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path.replace(/^\/+/, "")}`;
}
