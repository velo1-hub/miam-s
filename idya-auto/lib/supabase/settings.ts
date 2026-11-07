import "server-only";
import type { Settings } from "@/lib/settings/types";
import { createAdminClient } from "./admin";

/** Loads the singleton settings row (id = 1). Returns null when the table is empty. */
export async function loadSettingsFromSupabase(): Promise<Partial<Settings> | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("settings").select("data").eq("id", 1).maybeSingle();
  if (error || !data) return null;
  // The row is validated by the admin settings form (Zod) before it is written.
  return data.data as Partial<Settings>;
}
