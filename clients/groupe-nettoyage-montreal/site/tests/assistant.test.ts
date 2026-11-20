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

test("chips are split off the reply and never streamed", () => {
  assert.deepEqual(splitChips("Prix : 125 $.\n[[Oui | Non | Autre]]"), { reply: "Prix : 125 $.", chips: ["Oui", "Non", "Autre"] });
  assert.deepEqual(splitChips("Pas de choix ici."), { reply: "Pas de choix ici.", chips: [] });
});

test("price + availability in one turn, streamed, chips returned separately", async () => {
  const db = memDB(); const events: AssistantEvent[] = []; const seen: unknown[][] = [];
  const client = fakeClient([
    { tools: [{ id: "t1", name: "estimate_price", input: { service: "residential", homeType: "4half", frequency: "biweekly" } }, { id: "t2", name: "get_availability", input: { kind: "cleaning" } }] },
    { text: "Pour un 4½ aux deux semaines, c'est 125 $ par visite avant taxes. Je peux passer mardi 10:30 ou mercredi 08:00.\n[[mardi 10:30 | mercredi 08:00 | Autre date]]" },
  ], seen);
  const out = await runAssistant({ locale: "fr", history: [{ role: "user", content: "Prix pour un 4½ aux deux semaines" }], state: {}, client, db, onEvent: (e) => events.push(e) });
  assert.equal(out.chips.length, 3);
  assert.ok(out.reply.startsWith("Pour un 4½"));
  assert.ok(!out.reply.includes("[["));
  assert.equal(out.state.quote?.service, "residential");
  const streamed = events.filter((e): e is Extract<AssistantEvent, { t: "delta" }> => e.t === "delta").map((e) => e.text).join("");
  assert.ok(!streamed.includes("[["), "chip marker leaked into the stream: " + streamed);
  assert.equal(streamed.trim(), out.reply);
  assert.deepEqual(events.filter((e) => e.t === "status").map((e) => (e as { key: string }).key), ["pricing", "availability"]);
  // Both tool results went back in a single user message, and the session note is a system message after the history.
  const second = seen[1] as { role: string; content: unknown }[];
  assert.equal(second[1].role, "system");
  const results = second[second.length - 1]; assert.equal(results.role, "user"); assert.equal((results.content as unknown[]).length, 2);
});

test("booking is created only through the tool and the card comes back", async () => {
  const db = memDB(); const day = (await nextAvailableDays(db, "cleaning", 1))[0]; const slot = day.slots[0].start;
  const client = fakeClient([
    { tools: [{ id: "b1", name: "book_appointment", input: { kind: "cleaning", service: "residential", date: day.date, slot_start: slot, name: "Marie Tremblay", email: "marie@example.com", phone: "5145550199", address: "123 rue Saint-Denis, Montréal" } }] },
    { text: "C'est confirmé! Votre référence est en route par courriel.\n[[Merci]]" },
  ]);
  const out = await runAssistant({ locale: "fr", history: [{ role: "user", content: "oui je confirme" }], state: { quote: { service: "residential", homeType: "4half", frequency: "biweekly" } }, client, db });
  assert.ok(out.booking); assert.equal(out.booking?.date, day.date); assert.equal(out.booking?.price_min, out.booking?.price_max);
  assert.deepEqual(out.chips, [], "no quick replies after a confirmed booking");
  assert.equal(out.state.email, "marie@example.com");
  assert.equal((await db.listBookings()).length, 1);
});

test("a taken slot is refused with alternatives instead of double-booking", async () => {
  const db = memDB(); const day = (await nextAvailableDays(db, "walkthrough", 1))[0]; const slot = day.slots[0].start;
  const input = { kind: "walkthrough", service: "office", date: day.date, slot_start: slot, name: "Ali Ben", email: "ali@example.com", phone: "5145550100", address: "1 Place Ville-Marie, Montréal" };
  await runAssistant({ locale: "en", history: [{ role: "user", content: "yes" }], state: {}, client: fakeClient([{ tools: [{ id: "x", name: "book_appointment", input }] }, { text: "Done." }]), db });
  const seen: unknown[][] = [];
  const out = await runAssistant({ locale: "en", history: [{ role: "user", content: "yes" }], state: {}, client: fakeClient([{ tools: [{ id: "y", name: "book_appointment", input }] }, { text: "That slot just went; here are others.\n[[11:00 | 14:00]]" }], seen), db });
  assert.equal(out.booking, null);
  const result = JSON.parse(((seen[1] as { content: { content: string }[] }[]).at(-1)!.content[0]).content);
  assert.equal(result.error, "slot_unavailable"); assert.ok(Array.isArray(result.alternatives));
  assert.equal((await db.listBookings()).length, 1);
});

test("wizard quote in context seeds the state and the note", async () => {
  const seen: unknown[][] = [];
  const out = await runAssistant({ locale: "en", history: [{ role: "user", content: "when can you come?" }], state: {}, context: { page: "/en/quote", quote: { service: "airbnb", bedrooms: 1 } }, client: fakeClient([{ text: "Tomorrow at 08:00 or 10:30.\n[[08:00 | 10:30]]" }], seen), db: memDB() });
  assert.equal(out.state.quote?.service, "airbnb");
  const note = (seen[0] as { role: string; content: string }[]).find((m) => m.role === "system")!.content;
  assert.ok(note.includes("/en/quote") && note.includes("airbnb"));
});
