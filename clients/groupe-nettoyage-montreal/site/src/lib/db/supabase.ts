import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { DB } from "./types";

export function supabaseDB(url: string, key: string): DB {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };
  return {
    async createLead(l) { const row = { ...l, id: randomUUID(), status: "new" }; const { data, error } = await sb.from("leads").insert(row).select().single(); fail(error); return data; },
    async listLeads(limit = 200) { const { data, error } = await sb.from("leads").select("*").order("created_at", { ascending: false }).limit(limit); fail(error); return data ?? []; },
    async createBooking(b) { const { data, error } = await sb.from("bookings").insert({ ...b, id: randomUUID() }).select().single(); fail(error); return data; },
    async listBookings({ from, to, limit = 500 } = {}) {
      let q = sb.from("bookings").select("*").order("date").limit(limit);
      if (from) q = q.gte("date", from); if (to) q = q.lte("date", to);
      const { data, error } = await q; fail(error); return data ?? [];
    },
    async findBooking(ref, email) { const { data } = await sb.from("bookings").select("*").eq("ref", ref.toUpperCase()).ilike("email", email).maybeSingle(); return data ?? null; },
    async cancelBooking(ref, email) { const { data } = await sb.from("bookings").update({ status: "cancelled" }).eq("ref", ref.toUpperCase()).ilike("email", email).select().maybeSingle(); return data ?? null; },
    async listReviews() { const { data } = await sb.from("reviews").select("*").eq("published", true).order("date", { ascending: false }); return data ?? []; },
  };
}
