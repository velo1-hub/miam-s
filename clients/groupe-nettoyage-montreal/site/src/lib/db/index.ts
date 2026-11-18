import type { DB } from "./types";
import { fileDB } from "./file";
import { supabaseDB } from "./supabase";
export type { DB, Lead, Booking, Review } from "./types";

let db: DB | null = null;
export function getDB(): DB {
  if (db) return db;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  db = url && key ? supabaseDB(url, key) : fileDB;
  return db;
}
