import type { QuoteResult } from "../pricing";
import type { SlotKind } from "../availability";

export type LeadType = "quote" | "contact" | "career" | "assistant" | "booking";
export interface Lead {
  id: string; created_at: string; locale: "fr" | "en"; type: LeadType;
  name: string; email: string; phone?: string | null; message?: string | null;
  service?: string | null; segment?: string | null; source?: string | null;
  quote?: QuoteResult | null; meta?: Record<string, unknown> | null;
  status: "new" | "contacted" | "won" | "lost";
}
export interface Booking {
  id: string; ref: string; created_at: string; lead_id?: string | null; locale: "fr" | "en";
  kind: SlotKind; service: string; date: string; slot_start: string; slot_end: string;
  name: string; email: string; phone: string; address: string; notes?: string | null;
  price_min?: number | null; price_max?: number | null; quote?: QuoteResult | null;
  status: "confirmed" | "cancelled" | "completed";
}
export interface Review { id: string; author: string; rating: number; text: string; source: string; date: string; locale: "fr" | "en" | "both"; url?: string | null }

export interface DB {
  createLead(l: Omit<Lead, "id" | "created_at" | "status">): Promise<Lead>;
  listLeads(limit?: number): Promise<Lead[]>;
  createBooking(b: Omit<Booking, "id" | "created_at">): Promise<Booking>;
  listBookings(opts?: { from?: string; to?: string; limit?: number }): Promise<Booking[]>;
  findBooking(ref: string, email: string): Promise<Booking | null>;
  cancelBooking(ref: string, email: string): Promise<Booking | null>;
  listReviews(): Promise<Review[]>;
}
