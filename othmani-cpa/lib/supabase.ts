"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { demoClient, demoRole } from "./demo";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Vrai quand la base est branchée (variables définies dans Vercel). */
export const backendReady = Boolean(url && key);

let client: SupabaseClient | null = null;
/** En mode démonstration (code 211221), renvoie un faux client en mémoire : la vraie base n'est jamais touchée. */
export function supabase(): SupabaseClient {
  const demo = demoRole();
  if (demo) return demoClient(demo) as unknown as SupabaseClient;
  return real();
}
/** Toujours la vraie base (connexion par courriel). */
export function real(): SupabaseClient {
  if (!client) client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
