// Supabase (Postgres) implementation of Repo. Runs inside the Edge Function with the service-role key,
// which bypasses RLS: never expose this key to the browser.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { Appointment, BusinessSettings, Lead, Repo, StoredMessage } from "./repo.ts";
import type { RateItem } from "./quote.ts";
import type { Rule } from "./slots.ts";

const must = <T>(r: { data: T | null; error: { message: string; code?: string } | null }): T => {
  if (r.error) throw new Error(`db: ${r.error.message}`);
  return r.data as T;
};

export class SupabaseRepo implements Repo {
  db: SupabaseClient;
  constructor(url: string, serviceKey: string) {
    this.db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  async getLeadBySession(s: string) { return must(await this.db.from("leads").select("*").eq("session_id", s).maybeSingle()) as Lead | null; }
  async createLead(i: { session_id: string; lang: "fr" | "en"; source: Record<string, unknown>; consent_at: string }) {
    return must(await this.db.from("leads").insert(i).select("*").single()) as Lead;
  }
  async updateLead(id: string, patch: Partial<Lead>) { return must(await this.db.from("leads").update(patch).eq("id", id).select("*").single()) as Lead; }
  async listMessages(id: string) {
    return must(await this.db.from("conversation_messages").select("role, content, display_text, created_at").eq("lead_id", id).order("id")) as StoredMessage[];
  }
  async appendMessage(lead_id: string, role: "user" | "assistant", content: unknown, display_text: string | null) {
    must(await this.db.from("conversation_messages").insert({ lead_id, role, content, display_text }));
  }
  async countUserMessages(id: string) {
    const r = await this.db.from("conversation_messages").select("id", { count: "exact", head: true }).eq("lead_id", id).eq("role", "user").not("display_text", "is", null);
    if (r.error) throw new Error(r.error.message);
    return r.count ?? 0;
  }
  async addEvent(lead_id: string, type: string, payload: Record<string, unknown> = {}) { must(await this.db.from("lead_events").insert({ lead_id, type, payload })); }
  async getSettings() {
    const row = must(await this.db.from("settings").select("value").eq("key", "business").maybeSingle()) as { value: BusinessSettings } | null;
    return row?.value ?? {};
  }
  async getRateCard() { return must(await this.db.from("rate_card").select("*").eq("active", true)) as RateItem[]; }
  async getAvailability() {
    const rules = must(await this.db.from("availability_rules").select("weekday, start_time, end_time, active").eq("active", true)) as Rule[];
    const black = must(await this.db.from("availability_blackouts").select("day").gte("day", new Date().toISOString().slice(0, 10))) as { day: string }[];
    return { rules, blackouts: black.map((b) => b.day) };
  }
  async bookedStarts(from: string) {
    const rows = must(await this.db.from("appointments").select("starts_at").in("status", ["requested", "confirmed"]).gte("starts_at", from)) as { starts_at: string }[];
    return rows.map((r) => new Date(r.starts_at).toISOString());
  }
  async createAppointment(a: { lead_id: string; starts_at: string; ends_at: string; address: string | null }) {
    const r = await this.db.from("appointments").insert(a).select("*").single();
    if (r.error?.code === "23505") return "conflict" as const; // unique slot index
    return must(r) as Appointment;
  }
  async getActiveAppointment(id: string) {
    return must(await this.db.from("appointments").select("*").eq("lead_id", id).in("status", ["requested", "confirmed"]).order("starts_at").limit(1).maybeSingle()) as Appointment | null;
  }
  async saveQuoteDraft(lead_id: string, lang: "fr" | "en", data: unknown) {
    const last = must(await this.db.from("quote_drafts").select("version").eq("lead_id", lead_id).order("version", { ascending: false }).limit(1).maybeSingle()) as { version: number } | null;
    return must(await this.db.from("quote_drafts").insert({ lead_id, lang, data, version: (last?.version ?? 0) + 1 }).select("id, version").single()) as { id: string; version: number };
  }
}
