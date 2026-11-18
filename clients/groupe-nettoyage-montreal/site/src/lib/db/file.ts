import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DB, Lead, Booking, Review } from "./types";

interface Data { leads: Lead[]; bookings: Booking[]; reviews: Review[] }
// On Vercel the project directory is read-only; fall back to /tmp (ephemeral). Set SUPABASE_* for real persistence.
const FILE = process.env.VERCEL ? path.join("/tmp", "gnm-db.json") : path.join(process.cwd(), ".data", "db.json");
let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<Data> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")) as Data; } catch { return { leads: [], bookings: [], reviews: [] }; }
}
async function write(d: Data) { await fs.mkdir(path.dirname(FILE), { recursive: true }); await fs.writeFile(FILE, JSON.stringify(d, null, 2)); }
function tx<T>(fn: (d: Data) => Promise<T> | T): Promise<T> {
  const p = queue.then(async () => { const d = await read(); const r = await fn(d); await write(d); return r; });
  queue = p.catch(() => undefined); return p;
}

export const fileDB: DB = {
  async createLead(l) { return tx((d) => { const lead: Lead = { ...l, id: randomUUID(), created_at: new Date().toISOString(), status: "new" }; d.leads.unshift(lead); return lead; }); },
  async listLeads(limit = 200) { return (await read()).leads.slice(0, limit); },
  async createBooking(b) { return tx((d) => { const bk: Booking = { ...b, id: randomUUID(), created_at: new Date().toISOString() }; d.bookings.unshift(bk); return bk; }); },
  async listBookings({ from, to, limit = 500 } = {}) {
    return (await read()).bookings.filter((b) => (!from || b.date >= from) && (!to || b.date <= to)).slice(0, limit);
  },
  async findBooking(ref, email) { return (await read()).bookings.find((b) => b.ref === ref.toUpperCase() && b.email.toLowerCase() === email.toLowerCase()) ?? null; },
  async cancelBooking(ref, email) {
    return tx((d) => { const b = d.bookings.find((x) => x.ref === ref.toUpperCase() && x.email.toLowerCase() === email.toLowerCase()); if (!b) return null; b.status = "cancelled"; return b; });
  },
  async listReviews() { return (await read()).reviews; },
};
