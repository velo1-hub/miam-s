import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AuditEntry } from "./types";
import { demoFile } from "@/lib/utils/demo-dir";

const FILE = demoFile("demo-audit.json");
let entries: AuditEntry[] | null = null;
const load = () => {
  if (entries) return entries;
  try {
    entries = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as AuditEntry[]) : [];
  } catch {
    entries = [];
  }
  return entries;
};

/** Journal — brief §15: who changed what, when (prices and statuses above all). Supabase mode uses the audit_log table trigger + this app-level log. */
export async function audit(entry: Omit<AuditEntry, "id" | "createdAt">): Promise<void> {
  const list = load();
  list.unshift({ ...entry, id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() });
  if (list.length > 2000) list.length = 2000;
  try {
    mkdirSync(path.dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export async function listAudit(limit = 200): Promise<AuditEntry[]> {
  return load().slice(0, limit);
}

export function diffOf<T extends object>(before: T, after: T, keys: (keyof T)[]): Record<string, { from: unknown; to: unknown }> {
  const d: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of keys) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) d[String(k)] = { from: before[k], to: after[k] };
  return d;
}
