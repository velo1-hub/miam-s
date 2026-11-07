export const LEAD_TYPES = ["test_drive", "question", "financing", "trade_in", "contact", "inventory_alert"] as const;
export type LeadType = (typeof LEAD_TYPES)[number];
export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const BOOKING_STATUSES = ["new", "confirmed", "completed", "cancelled", "no_show"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface Lead {
  id: string;
  type: LeadType;
  status: LeadStatus;
  vehicleId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  locale: "fr" | "en";
  preferredContact: "email" | "phone" | "sms" | null;
  message: string | null;
  payload: Record<string, unknown>;
  consentText: string;
  consentAt: string;
  assignedTo: string | null;
  utm: Record<string, string> | null;
  /** Chat transcript when the lead came from the assistant */
  chatSessionId: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  leadId: string;
  vehicleId: string | null;
  startsAt: string;
  status: BookingStatus;
  createdAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  author: string | null;
  body: string;
  createdAt: string;
}

export interface LeadAiBrief {
  leadId: string;
  summary: string;
  intent: "hot" | "warm" | "cold";
  score: number;
  reasons: string[];
  vehiclesOfInterest: string[];
  suggestedReplyFr: string;
  suggestedReplyEn: string;
  model: string;
  createdAt: string;
}

export type NewLead = Omit<Lead, "id" | "status" | "assignedTo" | "createdAt">;

export interface LeadRepository {
  createLead(lead: NewLead): Promise<Lead>;
  createBooking(leadId: string, vehicleId: string | null, startsAt: string): Promise<Booking>;
  getBooking(id: string): Promise<(Booking & { lead: Lead }) | null>;
  /** Active bookings (not cancelled) in [from, to) */
  bookingsBetween(fromIso: string, toIso: string): Promise<Booking[]>;
  countBookingsAt(startsAtIso: string): Promise<number>;
  listLeads(opts?: { type?: LeadType; status?: LeadStatus; limit?: number }): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | null>;
  updateLead(id: string, patch: Partial<Pick<Lead, "status" | "assignedTo">>): Promise<Lead | null>;
  updateBooking(id: string, patch: Partial<Pick<Booking, "status">>): Promise<Booking | null>;
  addNote(leadId: string, author: string | null, body: string): Promise<LeadNote>;
  listNotes(leadId: string): Promise<LeadNote[]>;
  saveAiBrief(brief: LeadAiBrief): Promise<void>;
  getAiBrief(leadId: string): Promise<LeadAiBrief | null>;
  stats(): Promise<{ newToday: number; newWeek: number; bookingsThisWeek: number }>;
}
