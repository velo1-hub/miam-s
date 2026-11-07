import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type BrowserSupabase = SupabaseClient<Database>;

let client: BrowserSupabase | null = null;

/**
 * Browser client for the admin (sign-in, resumable uploads to the private `originals` bucket,
 * brief §10.2 step 1). Public variables only; RLS applies to every call.
 */
export function createBrowserSupabase(): BrowserSupabase {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
