// Storage interface used by the assistant, plus an in-memory implementation (local dev server and tests).
// The Supabase implementation lives in repo_supabase.ts and is only imported by the Edge Function.
import type { Dossier } from "./dossier.ts";
import type { RateItem, Settings } from "./quote.ts";
import type { Rule } from "./slots.ts";

export type BusinessSettings = Settings & {
  timezone?: string; visit_minutes?: number; booking_lead_hours?: number; booking_horizon_days?: number;
  response_time_text_fr?: string; response_time_text_en?: string; owner_email?: string;
};
export type Lead = {
  id: string; session_id: string; created_at: string; lang: "fr" | "en"; status: string;
  contact_name: string | null; phone: string | null; email: string | null; client_type: string | null;
  dossier: Dossier; temperature: string; score: number | null; score_reasons: unknown[]; flags: string[];
  summary: string | null; suggestions: unknown[]; visit_questions: string[]; needs_human: boolean;
  consent_at: string | null; source: Record<string, unknown>; last_message_at: string | null; owner_notified_at: string | null;
};
export type StoredMessage = { role: "user" | "assistant"; content: unknown; display_text: string | null; created_at: string };
export type Appointment = { id: string; lead_id: string; starts_at: string; ends_at: string; address: string | null; status: string };

export interface Repo {
  getLeadBySession(sessionId: string): Promise<Lead | null>;
  createLead(i: { session_id: string; lang: "fr" | "en"; source: Record<string, unknown>; consent_at: string }): Promise<Lead>;
  updateLead(id: string, patch: Partial<Lead>): Promise<Lead>;
  listMessages(leadId: string): Promise<StoredMessage[]>;
  appendMessage(leadId: string, role: "user" | "assistant", content: unknown, displayText: string | null): Promise<void>;
  countUserMessages(leadId: string): Promise<number>;
  addEvent(leadId: string, type: string, payload?: Record<string, unknown>): Promise<void>;
  getSettings(): Promise<BusinessSettings>;
  getRateCard(): Promise<RateItem[]>;
  getAvailability(): Promise<{ rules: Rule[]; blackouts: string[] }>;
  bookedStarts(fromIso: string): Promise<string[]>;
  createAppointment(a: { lead_id: string; starts_at: string; ends_at: string; address: string | null }): Promise<Appointment | "conflict">;
  getActiveAppointment(leadId: string): Promise<Appointment | null>;
  saveQuoteDraft(leadId: string, lang: "fr" | "en", data: unknown): Promise<{ id: string; version: number }>;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  name: "Pro Fer Forgé", timezone: "America/Montreal", minimum_project: 3000, quote_valid_days: 30, visit_minutes: 60,
  booking_lead_hours: 24, booking_horizon_days: 21, response_time_text_fr: "dès que possible", response_time_text_en: "as soon as possible",
  rbq: null, warranty_fr: null, warranty_en: null, payment_terms_fr: null, payment_terms_en: null, owner_email: "info@proferforge.ca",
  gst_rate: 0.05, qst_rate: 0.09975,
};
export const DEFAULT_RATE_CARD: RateItem[] = [
  { key: "paint_balcony", label_fr: "Peinture de balcon en fer forgé", label_en: "Wrought-iron balcony painting", unit: "unit", unit_price: null, applies_to: "paint", structure_type: "balcony" },
  { key: "paint_service_stair", label_fr: "Peinture d’escalier de service", label_en: "Service stair painting", unit: "storey", unit_price: null, applies_to: "paint", structure_type: "service_stair" },
  { key: "paint_spiral", label_fr: "Peinture d’escalier en colimaçon", label_en: "Spiral staircase painting", unit: "unit", unit_price: null, applies_to: "paint", structure_type: "spiral" },
  { key: "paint_facade_stair", label_fr: "Peinture d’escalier de façade", label_en: "Front-façade stair painting", unit: "unit", unit_price: null, applies_to: "paint", structure_type: "facade_stair" },
  { key: "paint_railing", label_fr: "Peinture de garde-corps / rampe", label_en: "Railing / handrail painting", unit: "linear_m", unit_price: null, applies_to: "paint", structure_type: "railing" },
  { key: "paint_fence", label_fr: "Peinture de clôture", label_en: "Fence painting", unit: "linear_m", unit_price: null, applies_to: "paint", structure_type: "fence" },
  { key: "weld_hour", label_fr: "Soudure de restauration (taux horaire)", label_en: "Restoration welding (hourly rate)", unit: "hour", unit_price: null, applies_to: "weld", structure_type: null },
  { key: "weld_material", label_fr: "Matériaux de soudure et pièces", label_en: "Welding materials and parts", unit: "lump_sum", unit_price: null, applies_to: "weld", structure_type: null },
  { key: "site_protection", label_fr: "Protection des lieux et mobilisation", label_en: "Site protection and mobilisation", unit: "lump_sum", unit_price: null, applies_to: "other", structure_type: null },
];

export class MemoryRepo implements Repo {
  leads = new Map<string, Lead>();
  messages = new Map<string, StoredMessage[]>();
  events: { lead_id: string; type: string; payload: Record<string, unknown> }[] = [];
  appointments: Appointment[] = [];
  quotes: { id: string; lead_id: string; version: number; lang: string; data: unknown }[] = [];
  opts: { settings?: Partial<BusinessSettings>; rateCard?: RateItem[]; rules?: Rule[]; blackouts?: string[] };
  constructor(opts: { settings?: Partial<BusinessSettings>; rateCard?: RateItem[]; rules?: Rule[]; blackouts?: string[] } = {}) { this.opts = opts; }
  private id() { return crypto.randomUUID(); }
  async getLeadBySession(s: string) { return [...this.leads.values()].find((l) => l.session_id === s) ?? null; }
  async createLead(i: { session_id: string; lang: "fr" | "en"; source: Record<string, unknown>; consent_at: string }) {
    const l: Lead = { id: this.id(), session_id: i.session_id, created_at: new Date().toISOString(), lang: i.lang, status: "qualifying", contact_name: null, phone: null, email: null, client_type: null, dossier: {}, temperature: "unscored", score: null, score_reasons: [], flags: [], summary: null, suggestions: [], visit_questions: [], needs_human: false, consent_at: i.consent_at, source: i.source, last_message_at: null, owner_notified_at: null };
    this.leads.set(l.id, l); this.messages.set(l.id, []); return structuredClone(l);
  }
  async updateLead(id: string, patch: Partial<Lead>) { const l = { ...this.leads.get(id)!, ...structuredClone(patch) }; this.leads.set(id, l); return structuredClone(l); }
  async listMessages(id: string) { return structuredClone(this.messages.get(id) ?? []); }
  async appendMessage(id: string, role: "user" | "assistant", content: unknown, display: string | null) { this.messages.get(id)!.push({ role, content: structuredClone(content), display_text: display, created_at: new Date().toISOString() }); }
  async countUserMessages(id: string) { return (this.messages.get(id) ?? []).filter((m) => m.role === "user" && m.display_text != null).length; }
  async addEvent(lead_id: string, type: string, payload: Record<string, unknown> = {}) { this.events.push({ lead_id, type, payload }); }
  async getSettings() { return { ...DEFAULT_SETTINGS, ...this.opts.settings }; }
  async getRateCard() { return structuredClone(this.opts.rateCard ?? DEFAULT_RATE_CARD); }
  async getAvailability() { return { rules: this.opts.rules ?? [], blackouts: this.opts.blackouts ?? [] }; }
  async bookedStarts(from: string) { return this.appointments.filter((a) => ["requested", "confirmed"].includes(a.status) && a.starts_at >= from).map((a) => a.starts_at); }
  async createAppointment(a: { lead_id: string; starts_at: string; ends_at: string; address: string | null }) {
    if (this.appointments.some((x) => x.starts_at === a.starts_at && ["requested", "confirmed"].includes(x.status))) return "conflict" as const;
    const appt: Appointment = { id: this.id(), status: "requested", ...a }; this.appointments.push(appt); return appt;
  }
  async getActiveAppointment(id: string) { return this.appointments.find((a) => a.lead_id === id && ["requested", "confirmed"].includes(a.status)) ?? null; }
  async saveQuoteDraft(lead_id: string, lang: "fr" | "en", data: unknown) {
    const version = this.quotes.filter((q) => q.lead_id === lead_id).length + 1;
    const q = { id: this.id(), lead_id, version, lang, data }; this.quotes.push(q); return { id: q.id, version };
  }
}
