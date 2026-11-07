import "server-only";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import { isUuid, type LeadAiRow, type LeadNoteRow, type LeadRow, type TestDriveBookingRow } from "@/lib/supabase/database.types";
import type { Booking, BookingStatus, Lead, LeadAiBrief, LeadNote, LeadRepository, NewLead } from "./types";
import { BOOKING_STATUSES } from "./types";

/**
 * Production lead repository — brief §12, §13, §15, §27.4. Tables leads, test_drive_bookings,
 * lead_notes, lead_ai. Writes use the service role (Server Actions insert after Turnstile; RLS has
 * no anonymous policy on these tables). Reads throw on database errors: the admin must see them.
 */

const iso = (value: string) => new Date(value).toISOString();
const uuidOrNull = (value: string | null | undefined) => (value && isUuid(value) ? value : null);
const isBookingStatus = (s: string): s is BookingStatus => (BOOKING_STATUSES as readonly string[]).includes(s);
const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

function fail(scope: string, error: { message: string }): never {
  throw new Error(`[leads/supabase] ${scope}: ${error.message}`);
}

export function mapLead(r: LeadRow): Lead {
  const utm = r.utm ? asRecord(r.utm) : null;
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    vehicleId: r.vehicle_id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    locale: r.locale === "en" ? "en" : "fr",
    preferredContact: r.preferred_contact === "email" || r.preferred_contact === "phone" || r.preferred_contact === "sms" ? r.preferred_contact : null,
    message: r.message,
    payload: asRecord(r.payload),
    consentText: r.consent_text,
    consentAt: iso(r.consent_at),
    assignedTo: r.assigned_to,
    utm: utm ? Object.fromEntries(Object.entries(utm).filter((e): e is [string, string] => typeof e[1] === "string")) : null,
    chatSessionId: r.chat_session_id,
    createdAt: iso(r.created_at),
  };
}

export function mapBooking(r: TestDriveBookingRow): Booking {
  return {
    id: r.id,
    leadId: r.lead_id,
    vehicleId: r.vehicle_id,
    startsAt: iso(r.starts_at),
    status: isBookingStatus(r.status) ? r.status : "new",
    createdAt: iso(r.created_at),
  };
}

function mapNote(r: LeadNoteRow): LeadNote {
  return { id: r.id, leadId: r.lead_id ?? "", author: r.author, body: r.body, createdAt: r.created_at ? iso(r.created_at) : new Date().toISOString() };
}

function mapBrief(r: LeadAiRow): LeadAiBrief {
  return {
    leadId: r.lead_id,
    summary: r.summary ?? "",
    intent: r.intent === "hot" || r.intent === "warm" || r.intent === "cold" ? r.intent : "cold",
    score: r.score ?? 0,
    reasons: r.reasons ?? [],
    vehiclesOfInterest: r.vehicles_of_interest ?? [],
    suggestedReplyFr: r.suggested_reply_fr ?? "",
    suggestedReplyEn: r.suggested_reply_en ?? "",
    model: r.model ?? "",
    createdAt: iso(r.created_at),
  };
}

/** Monday 00:00 → next Monday 00:00 in server time (mirrors the demo repository's week). */
function currentWeek(now = new Date()): { from: string; to: string } {
  const day = 86_400_000;
  const start = new Date(now.getTime() - ((now.getDay() + 6) % 7) * day);
  start.setHours(0, 0, 0, 0);
  return { from: start.toISOString(), to: new Date(start.getTime() + 7 * day).toISOString() };
}

type CountTable = "leads" | "test_drive_bookings";
const selectCount = <T extends CountTable>(db: AdminClient, table: T) => db.from(table).select("id", { count: "exact", head: true });
type CountQuery<T extends CountTable> = ReturnType<typeof selectCount<T>>;

async function countWhere<T extends CountTable>(db: AdminClient, table: T, apply: (q: CountQuery<T>) => CountQuery<T>): Promise<number> {
  const { count, error } = await apply(selectCount(db, table));
  if (error) fail(`count:${table}`, error);
  return count ?? 0;
}

export const supabaseLeadRepository: LeadRepository = {
  async createLead(input: NewLead) {
    const db = createAdminClient();
    const { data, error } = await db
      .from("leads")
      .insert({
        type: input.type,
        vehicle_id: uuidOrNull(input.vehicleId),
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        locale: input.locale,
        preferred_contact: input.preferredContact,
        message: input.message,
        payload: input.payload as LeadRow["payload"],
        consent_text: input.consentText,
        consent_at: input.consentAt,
        utm: input.utm,
        chat_session_id: input.chatSessionId,
      })
      .select("*")
      .single();
    if (error || !data) fail("createLead", error ?? { message: "no row returned" });
    return mapLead(data);
  },

  async createBooking(leadId, vehicleId, startsAt) {
    const db = createAdminClient();
    const { data, error } = await db
      .from("test_drive_bookings")
      .insert({ lead_id: leadId, vehicle_id: uuidOrNull(vehicleId), starts_at: startsAt })
      .select("*")
      .single();
    if (error || !data) fail("createBooking", error ?? { message: "no row returned" });
    return mapBooking(data);
  },

  async getBooking(id) {
    if (!isUuid(id)) return null;
    const db = createAdminClient();
    const { data: booking, error } = await db.from("test_drive_bookings").select("*").eq("id", id).maybeSingle();
    if (error) fail("getBooking", error);
    if (!booking) return null;
    const { data: lead, error: leadError } = await db.from("leads").select("*").eq("id", booking.lead_id).maybeSingle();
    if (leadError) fail("getBooking:lead", leadError);
    return lead ? { ...mapBooking(booking), lead: mapLead(lead) } : null;
  },

  async bookingsBetween(fromIso, toIso) {
    const db = createAdminClient();
    const { data, error } = await db
      .from("test_drive_bookings")
      .select("*")
      .neq("status", "cancelled")
      .gte("starts_at", fromIso)
      .lt("starts_at", toIso)
      .order("starts_at");
    if (error) fail("bookingsBetween", error);
    return (data ?? []).map(mapBooking);
  },

  async countBookingsAt(startsAtIso) {
    return countWhere(createAdminClient(), "test_drive_bookings", (q) => q.neq("status", "cancelled").eq("starts_at", startsAtIso));
  },

  async listLeads(opts = {}) {
    const db = createAdminClient();
    let q = db.from("leads").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 200);
    if (opts.type) q = q.eq("type", opts.type);
    if (opts.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) fail("listLeads", error);
    return (data ?? []).map(mapLead);
  },

  async getLead(id) {
    if (!isUuid(id)) return null;
    const { data, error } = await createAdminClient().from("leads").select("*").eq("id", id).maybeSingle();
    if (error) fail("getLead", error);
    return data ? mapLead(data) : null;
  },

  async updateLead(id, patch) {
    if (!isUuid(id)) return null;
    const update: Partial<Pick<LeadRow, "status" | "assigned_to">> = {};
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo;
    const { data, error } = await createAdminClient().from("leads").update(update).eq("id", id).select("*").maybeSingle();
    if (error) fail("updateLead", error);
    return data ? mapLead(data) : null;
  },

  async updateBooking(id, patch) {
    if (!isUuid(id)) return null;
    const update: Partial<Pick<TestDriveBookingRow, "status">> = {};
    if (patch.status !== undefined) update.status = patch.status;
    const { data, error } = await createAdminClient().from("test_drive_bookings").update(update).eq("id", id).select("*").maybeSingle();
    if (error) fail("updateBooking", error);
    return data ? mapBooking(data) : null;
  },

  async addNote(leadId, author, body) {
    const { data, error } = await createAdminClient()
      .from("lead_notes")
      .insert({ lead_id: leadId, author: uuidOrNull(author), body })
      .select("*")
      .single();
    if (error || !data) fail("addNote", error ?? { message: "no row returned" });
    return mapNote(data);
  },

  async listNotes(leadId) {
    if (!isUuid(leadId)) return [];
    const { data, error } = await createAdminClient().from("lead_notes").select("*").eq("lead_id", leadId).order("created_at");
    if (error) fail("listNotes", error);
    return (data ?? []).map(mapNote);
  },

  async saveAiBrief(brief) {
    const { error } = await createAdminClient()
      .from("lead_ai")
      .upsert(
        {
          lead_id: brief.leadId,
          summary: brief.summary,
          intent: brief.intent,
          score: brief.score,
          reasons: brief.reasons,
          vehicles_of_interest: brief.vehiclesOfInterest,
          suggested_reply_fr: brief.suggestedReplyFr,
          suggested_reply_en: brief.suggestedReplyEn,
          model: brief.model,
          created_at: brief.createdAt,
        },
        { onConflict: "lead_id" },
      );
    if (error) fail("saveAiBrief", error);
  },

  async getAiBrief(leadId) {
    if (!isUuid(leadId)) return null;
    const { data, error } = await createAdminClient().from("lead_ai").select("*").eq("lead_id", leadId).maybeSingle();
    if (error) fail("getAiBrief", error);
    return data ? mapBrief(data) : null;
  },

  async stats() {
    const db = createAdminClient();
    const now = Date.now();
    const day = 86_400_000;
    const week = currentWeek(new Date(now));
    const [newToday, newWeek, bookingsThisWeek] = await Promise.all([
      countWhere(db, "leads", (q) => q.gte("created_at", new Date(now - day).toISOString())),
      countWhere(db, "leads", (q) => q.gte("created_at", new Date(now - 7 * day).toISOString())),
      countWhere(db, "test_drive_bookings", (q) => q.neq("status", "cancelled").gte("starts_at", week.from).lt("starts_at", week.to)),
    ]);
    return { newToday, newWeek, bookingsThisWeek };
  },
};
