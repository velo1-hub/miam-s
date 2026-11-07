import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defaultSettings } from "./defaults";
import type { Settings } from "./types";

const FILE = path.join(process.cwd(), ".cache", "demo-settings.json");
let overlay: Partial<Settings> | null = null;

function loadOverlay(): Partial<Settings> {
  if (overlay) return overlay;
  try {
    overlay = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as Partial<Settings>) : {};
  } catch {
    overlay = {};
  }
  return overlay;
}

/**
 * Settings access. Demo mode: defaults merged with admin edits persisted to .cache. With Supabase
 * the singleton row (id = 1) is merged over the defaults so new keys always have a value.
 */
export async function getSettings(): Promise<Settings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DEMO_MODE !== "false") {
    return { ...defaultSettings, ...loadOverlay() };
  }
  try {
    const { loadSettingsFromSupabase } = await import("@/lib/supabase/settings");
    const row = await loadSettingsFromSupabase();
    return row ? { ...defaultSettings, ...row } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

/** Admin write — demo overlay or Supabase settings row. */
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DEMO_MODE !== "false") {
    overlay = { ...loadOverlay(), ...patch };
    try {
      mkdirSync(path.dirname(FILE), { recursive: true });
      writeFileSync(FILE, JSON.stringify(overlay, null, 2));
    } catch {
      /* read-only fs */
    }
    return { ...defaultSettings, ...overlay };
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const current = await getSettings();
  const next = { ...current, ...patch };
  await createAdminClient().from("settings").upsert({ id: 1, data: next });
  return next;
}

export type { Settings } from "./types";
