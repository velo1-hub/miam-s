import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildDemoLeads } from "./demo-seed";
import type { Booking, Lead, LeadAiBrief, LeadNote, LeadRepository, NewLead } from "./types";
import { demoFile } from "@/lib/utils/demo-dir";

/**
 * Demo-mode lead store: in memory, seeded with 25 demo leads, persisted to .cache/demo-leads.json
 * when the filesystem is writable (local dev). On serverless hosts it lives for the instance's
 * lifetime — fine for the pitch, replaced by Supabase in production.
 */
interface State {
  leads: Lead[];
  bookings: Booking[];
  notes: LeadNote[];
  briefs: LeadAiBrief[];
}

const FILE = demoFile("demo-leads.json");
let state: State | null = null;

function load(): State {
  if (state) return state;
  try {
    if (existsSync(FILE)) {
      state = JSON.parse(readFileSync(FILE, "utf8")) as State;
      return state;
    }
  } catch {
    /* fall through to seed */
  }
  const seed = buildDemoLeads();
  state = { leads: seed.leads, bookings: seed.bookings, notes: [], briefs: seed.briefs };
  return state;
}

function persist() {
  if (!state) return;
  try {
    mkdirSync(path.dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(state, null, 2));
  } catch {
    /* read-only filesystem */
  }
}

const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const demoLeadRepository: LeadRepository = {
  async createLead(input: NewLead) {
    const s = load();
    const lead: Lead = { ...input, id: id("lead"), status: "new", assignedTo: null, createdAt: new Date().toISOString() };
    s.leads.unshift(lead);
    persist();
    return lead;
  },
  async createBooking(leadId, vehicleId, startsAt) {
    const s = load();
    const b: Booking = { id: id("booking"), leadId, vehicleId, startsAt, status: "new", createdAt: new Date().toISOString() };
    s.bookings.push(b);
    persist();
    return b;
  },
  async getBooking(bid) {
    const s = load();
    const b = s.bookings.find((x) => x.id === bid);
    const lead = b ? s.leads.find((l) => l.id === b.leadId) : undefined;
    return b && lead ? { ...b, lead } : null;
  },
  async bookingsBetween(from, to) {
    return load().bookings.filter((b) => b.status !== "cancelled" && b.startsAt >= from && b.startsAt < to);
  },
  async countBookingsAt(startsAt) {
    return load().bookings.filter((b) => b.status !== "cancelled" && b.startsAt === startsAt).length;
  },
  async listLeads(opts = {}) {
    let list = load().leads;
    if (opts.type) list = list.filter((l) => l.type === opts.type);
    if (opts.status) list = list.filter((l) => l.status === opts.status);
    return list.slice(0, opts.limit ?? 200);
  },
  async getLead(lid) {
    return load().leads.find((l) => l.id === lid) ?? null;
  },
  async updateLead(lid, patch) {
    const s = load();
    const l = s.leads.find((x) => x.id === lid);
    if (!l) return null;
    Object.assign(l, patch);
    persist();
    return l;
  },
  async updateBooking(bid, patch) {
    const s = load();
    const b = s.bookings.find((x) => x.id === bid);
    if (!b) return null;
    Object.assign(b, patch);
    persist();
    return b;
  },
  async addNote(leadId, author, body) {
    const s = load();
    const n: LeadNote = { id: id("note"), leadId, author, body, createdAt: new Date().toISOString() };
    s.notes.push(n);
    persist();
    return n;
  },
  async listNotes(leadId) {
    return load().notes.filter((n) => n.leadId === leadId);
  },
  async saveAiBrief(brief) {
    const s = load();
    s.briefs = s.briefs.filter((b) => b.leadId !== brief.leadId);
    s.briefs.push(brief);
    persist();
  },
  async getAiBrief(leadId) {
    return load().briefs.find((b) => b.leadId === leadId) ?? null;
  },
  async stats() {
    const s = load();
    const now = Date.now();
    const day = 86_400_000;
    const weekStart = new Date(now - ((new Date(now).getDay() + 6) % 7) * day);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart.getTime() + 7 * day);
    return {
      newToday: s.leads.filter((l) => now - new Date(l.createdAt).getTime() < day).length,
      newWeek: s.leads.filter((l) => now - new Date(l.createdAt).getTime() < 7 * day).length,
      bookingsThisWeek: s.bookings.filter((b) => b.status !== "cancelled" && b.startsAt >= weekStart.toISOString() && b.startsAt < weekEnd.toISOString()).length,
    };
  },
};
