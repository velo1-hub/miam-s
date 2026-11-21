import { test } from "node:test";
import assert from "node:assert/strict";
import { runAssistant, splitChips, type ModelClient, type AssistantEvent } from "../src/lib/assistant/run";
import type { DB, Booking, Lead } from "../src/lib/db/types";
import { nextAvailableDays } from "../src/lib/availability";

// In-memory DB so the test never touches .data or Supabase.
function memDB(): DB {
  const bookings: Booking[] = []; const leads: Lead[] = [];
  return {
    async createLead(l) { const lead = { ...l, id: `L${leads.length + 1}`, created_at: new Date().toISOString(), status: "new" as const }; leads.push(lead); return lead; },
    async listLeads() { return leads; },
    async createBooking(b) { const bk = { ...b, id: `B${bookings.length + 1}`, created_at: new Date().toISOString() }; bookings.push(bk); return bk; },
    async listBookings({ from, to } = {}) { return bookings.filter((b) => (!from || b.date >= from) && (!to || b.date <= to)); },
    async findBooking(ref, email) { return bookings.find((b) => b.ref === ref && b.email === email) ?? null; },
    async cancelBooking() { return null; },
    async listReviews() { return []; },
  };
}

type Turn = { text?: string; tools?: { id: string; name: string; input: unknown }[] };
/** Scripted stand-in for client.beta.messages.stream: replays one turn per call, streaming text in small chunks. */
function fakeClient(turns: Turn[], seen: unknown[][] = []): ModelClient {
  let n = 0;
  const stream = ((params: { messages: unknown[] }) => {
    seen.push(params.messages); const turn = turns[n++]; if (!turn) throw new Error("fake model: no more turns scripted");
    const content: unknown[] = [];
    if (turn.text) content.push({ type: "text", text: turn.text });
    for (const t of turn.tools ?? []) content.push({ type: "tool_use", id: t.id, name: t.name, input: t.input });
    const final = { content, stop_reason: turn.tools?.length ? "tool_use" : "end_turn", usage: {} };
    async function* events() {
      if (turn.text) for (let i = 0; i < turn.text.length; i += 7) yield { type: "content_block_delta", delta: { type: "text_delta", text: turn.text.slice(i, i + 7) } };
      for (const t of turn.tools ?? []) yield { type: "content_block_start", content_block: { type: "tool_use", id: t.id, name: t.name } };
    }
    const it = events();
    return Object.assign(it, { finalMessage: async () => final });
  }) as unknown as ModelClient["beta"]["messages"]["stream"];
  return { beta: { messages: { stream } } };
}
const lastToolResult = (seen: unknown[][]) => JSON.parse(((seen.at(-1) as { content: { content: string }[] }[]).at(-1)!.content[0]).content);

test("chips are split off the reply and never streamed", () => {
  assert.deepEqual(splitChips("Mardi ou mercredi?\n[[Mardi 11:00 | Mercredi 14:00 | Autre]]"), { reply: "Mardi ou mercredi?", chips: ["Mardi 11:00", "Mercredi 14:00", "Autre"] });
  assert.deepEqual(splitChips("Pas de choix ici."), { reply: "Pas de choix ici.", chips: [] });
});

test("details + availability in one turn, streamed, chips returned separately, no price anywhere", async () => {
  const db = memDB(); const events: AssistantEvent[] = []; const seen: unknown[][] = [];
  const client = fakeClient([
    { tools: [{ id: "t1", name: "save_details", input: { service: "office", sqft: 2000, frequency: "3 evenings a week" } }, { id: "t2", name: "get_availability", input: {} }] },
    { text: "Pour un bureau de 2 000 pi² trois soirs par semaine, je passe 20 minutes sur place et la soumission écrite suit en 24 h. Mardi 11:00 ou mercredi 14:00?\n[[mardi 11:00 | mercredi 14:00 | Autre date]]" },
  ], seen);
  const out = await runAssistant({ locale: "fr", history: [{ role: "user", content: "Bureau de 2 000 pi², 3 soirs/semaine" }], state: {}, client, db, onEvent: (e) => events.push(e) });
  assert.equal(out.chips.length, 3);
  assert.ok(out.reply.startsWith("Pour un bureau"));
  assert.ok(!out.reply.includes("[["));
  assert.equal(out.state.service, "office"); assert.equal(out.state.sqft, 2000);
  const streamed = events.filter((e): e is Extract<AssistantEvent, { t: "delta" }> => e.t === "delta").map((e) => e.text).join("");
  assert.ok(!streamed.includes("[["), "chip marker leaked into the stream: " + streamed);
  assert.equal(streamed.trim(), out.reply);
  assert.deepEqual(events.filter((e) => e.t === "status").map((e) => (e as { key: string }).key), ["availability"]);
  // Both tool results went back in a single user message, and the session note is a system message after the history.
  const second = seen[1] as { role: string; content: unknown }[];
  assert.equal(second[1].role, "system");
  const results = second[second.length - 1]; assert.equal(results.role, "user"); assert.equal((results.content as unknown[]).length, 2);
  // Availability only ever returns weekday walkthrough slots.
  const avail = JSON.parse((results.content as { content: string }[])[1].content) as { days: { date: string; starts: string[] }[] };
  assert.ok(avail.days.length > 0); for (const d of avail.days) { const dow = new Date(`${d.date}T12:00:00Z`).getUTCDay(); assert.ok(dow >= 1 && dow <= 5); assert.ok(d.starts.every((s) => ["09:00", "11:00", "14:00", "16:00", "18:00"].includes(s))); }
});

test("the walkthrough is created only through the tool and carries the company", async () => {
  const db = memDB(); const day = (await nextAvailableDays(db, 1))[0]; const slot = day.slots[0].start;
  const client = fakeClient([
    { tools: [{ id: "b1", name: "book_walkthrough", input: { service: "office", date: day.date, slot_start: slot, company: "Clinique Mont-Royal", name: "Marie Tremblay", email: "marie@example.com", phone: "5145550199", address: "123 rue Saint-Denis, Montréal" } }] },
    { text: "C'est confirmé! La soumission écrite suit dans les 24 h après la visite.\n[[Merci]]" },
  ]);
  const out = await runAssistant({ locale: "fr", history: [{ role: "user", content: "oui je confirme" }], state: { service: "office", sqft: 2000 }, client, db });
  assert.ok(out.booking); assert.equal(out.booking?.date, day.date); assert.equal(out.booking?.kind, "walkthrough"); assert.equal(out.booking?.company, "Clinique Mont-Royal");
  assert.equal(out.booking?.price_min, null);
  assert.deepEqual(out.chips, [], "no quick replies after a confirmed walkthrough");
  assert.equal(out.state.email, "marie@example.com");
  assert.equal((await db.listBookings()).length, 1);
});

test("a taken slot is refused with alternatives instead of double-booking", async () => {
  const db = memDB(); const day = (await nextAvailableDays(db, 1))[0]; const slot = day.slots[0].start;
  const input = { service: "restaurant", date: day.date, slot_start: slot, company: "Bistro Ali", name: "Ali Ben", email: "ali@example.com", phone: "5145550100", address: "1 Place Ville-Marie, Montréal" };
  await runAssistant({ locale: "en", history: [{ role: "user", content: "yes" }], state: {}, client: fakeClient([{ tools: [{ id: "x", name: "book_walkthrough", input }] }, { text: "Done." }]), db });
  const seen: unknown[][] = [];
  const out = await runAssistant({ locale: "en", history: [{ role: "user", content: "yes" }], state: {}, client: fakeClient([{ tools: [{ id: "y", name: "book_walkthrough", input }] }, { text: "That slot just went; here are others.\n[[11:00 | 14:00]]" }], seen), db });
  assert.equal(out.booking, null);
  const result = lastToolResult(seen);
  assert.equal(result.error, "slot_unavailable"); assert.ok(Array.isArray(result.alternatives));
  assert.equal((await db.listBookings()).length, 1);
});

test("context from a service page seeds the state and the session note", async () => {
  const seen: unknown[][] = [];
  const out = await runAssistant({ locale: "en", history: [{ role: "user", content: "when can you come?" }], state: {}, context: { page: "/en/services/restaurant-cleaning", service: "restaurant" }, client: fakeClient([{ text: "Tomorrow at 09:00 or 11:00.\n[[09:00 | 11:00]]" }], seen), db: memDB() });
  assert.equal(out.state.service, "restaurant");
  const note = (seen[0] as { role: string; content: string }[]).find((m) => m.role === "system")!.content;
  assert.ok(note.includes("restaurant-cleaning") && note.includes("restaurant"));
});

test("a callback lead keeps the gathered details for the account manager", async () => {
  const db = memDB(); const seen: unknown[][] = [];
  const out = await runAssistant({ locale: "fr", history: [{ role: "user", content: "rappelez-moi plutôt" }], state: { service: "property", units: 12, company: "Gestion Nord" }, client: fakeClient([{ tools: [{ id: "l1", name: "create_lead", input: { name: "Paul Roy", phone: "5145550111", message: "12 immeubles, préfère un appel" } }] }, { text: "Un gestionnaire de compte vous rappelle sous 24 h ouvrables." }], seen), db });
  assert.equal(lastToolResult(seen).ok, true);
  const lead = (await db.listLeads())[0];
  assert.equal(lead.service, "property"); assert.equal((lead.meta as { company: string }).company, "Gestion Nord"); assert.equal((lead.meta as { units: number }).units, 12);
  assert.equal(out.booking, null);
});
