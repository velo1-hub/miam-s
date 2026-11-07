import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database, StaffRoleDb } from "./database.types";

export type ServerSupabase = SupabaseClient<Database>;

/**
 * Cookie-based client for the signed-in staff member (admin, brief §15). Uses the anon key: every
 * query runs under RLS as that user. A new client per request — never cache it. Next.js 16:
 * `cookies()` is async.
 */
export async function createServerSupabase(): Promise<ServerSupabase> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  const cookieStore = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there. proxy.ts refreshes the
          // session on the next request, so the write can be skipped safely.
        }
      },
    },
  });
}

export interface StaffSession {
  userId: string;
  email: string | null;
  role: StaffRoleDb;
}

/**
 * The staff member behind the current request, or null when anonymous / not in `staff`.
 * `staff_role()` is the security-definer helper of the RLS migration.
 */
export async function getStaffSession(supabase?: ServerSupabase): Promise<StaffSession | null> {
  try {
    const client = supabase ?? (await createServerSupabase());
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return null;
    const { data: role, error } = await client.rpc("staff_role");
    if (error || !role) return null;
    return { userId: user.id, email: user.email ?? null, role };
  } catch {
    return null;
  }
}
