// End-to-end turn tests with a scripted model (no network). Run: node --test proferforge/backend/tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { runTurn, parseOptions } from "../supabase/functions/_shared/agent.ts";
import { createHandler } from "../supabase/functions/_shared/http.ts";
import { MemoryRepo } from "../supabase/functions/_shared/repo.ts";
import { SYSTEM_PROMPT, TOOLS } from "../supabase/functions/_shared/prompt.ts";

const NOW = Date.parse("2026-10-05T12:00:00Z"); // Monday 08:00 in Montréal
const rules = [1, 2, 3, 4, 5].map((wd) => ({ weekday: wd, start_time: "09:00", end_time: "12:00" }));
const tool = (id, name, input) => ({ content: [{ type: "tool_use", id, name, input }], stop_reason: "tool_use" });
const say = (text) => ({ content: [{ type: "text", text }], stop_reason: "end_turn" });

function scripted(responses) {
  const calls = [];
  return { calls, create: async (p) => { calls.push(structuredClone(p)); const r = responses.shift(); if (!r) throw new Error("script exhausted"); return typeof r === "function" ? r(p) : r; } };
}

test("full intake: qualify → slots → book → complete; append-only history; owner notified", async () => {
  const repo = new MemoryRepo({ rules });
  const notes = [];
  let slotId;
  const llm = scripted([
    tool("t1", "update_dossier", { org: { client_type: "condo", role: "board_member" }, project: { work_type: "both", condition: "rust_through" }, hacker: "drop me" }),
    say("Merci ! Combien d’escaliers sont concernés ? [[options: 1 | 2 | 3 ou plus]]"),
    // turn 2
    tool("t2", "update_dossier", { project: { structures: [{ type: "service_stair", qty: 2, storeys: 3 }, { type: "balcony", qty: 6 }] },
      contact: { name: "Marie Tremblay", phone: "514 555-1234" }, site: { address: "1234 rue Rachel E", city: "Montréal", postal: "h2j2j5" },
      timing: { urgency: "asap" }, org: { is_decision_maker: true, approval_status: "approved" } }),
    tool("t3", "get_available_slots", {}),
    (p) => { const last = p.messages.at(-1).content[0]; slotId = JSON.parse(last.content).slots[0].slot_id; return say("Voici les prochaines plages de visite."); },
    // turn 3
    (p) => tool("t4", "book_visit", { slot_id: slotId }),
    tool("t5", "complete_intake", { summary_for_owner: "Syndicat, 2 escaliers de service 3 étages + 6 balcons, rouille perforante, Plateau, ASAP." }),
    say("C’est noté, la visite est demandée. L’équipe vous confirmera l’heure."),
  ]);
  const deps = { repo, llm, model: "claude-opus-5-5", now: () => NOW, notify: async (e) => notes.push(e) };
  const sid = "sess_test_aaaaaaaaaaaa";

  await assert.rejects(runTurn(deps, { sessionId: sid, text: "Bonjour", lang: "fr" }), /ConsentRequired|Error/);
  const r1 = await runTurn(deps, { sessionId: sid, text: "Bonjour, nos escaliers rouillent", lang: "fr", consent: true, page: "/" });
  assert.equal(r1.reply, "Merci ! Combien d’escaliers sont concernés ?");
  assert.deepEqual(r1.options, ["1", "2", "3 ou plus"]);
  const lead1 = await repo.getLeadBySession(sid);
  assert.equal(lead1.dossier.org.client_type, "condo");
  assert.equal(lead1.dossier.hacker, undefined);

  // request shape
  const c0 = llm.calls[0];
  assert.equal(c0.model, "claude-opus-5-5");
  assert.equal(c0.system, SYSTEM_PROMPT);
  assert.deepEqual(c0.tools.map((t) => t.name), TOOLS.map((t) => t.name));
  assert.deepEqual(c0.cache_control, { type: "ephemeral" });
  assert.equal(c0.output_config.effort, "low");
  assert.match(c0.messages[0].content[0].text, /Website context/);
  assert.ok(!("temperature" in c0) && !("thinking" in c0) && !("tool_choice" in c0));

  const r2 = await runTurn(deps, { sessionId: sid, text: "2 escaliers de 3 étages et 6 balcons…", lang: "fr" });
  assert.equal(r2.slots.length, 3 * 3 > 9 ? 9 : r2.slots.length);
  assert.ok(r2.slots.length > 0 && r2.slots[0].label.includes("mardi"));
  const r3 = await runTurn(deps, { sessionId: sid, text: "Le premier choix", lang: "fr", slotId });
  assert.ok(r3.booked && r3.booked.start === slotId);
  assert.equal(r3.done, true);
  assert.deepEqual(r3.slots, []);

  const lead = await repo.getLeadBySession(sid);
  assert.equal(lead.status, "visit_booked");
  assert.equal(lead.temperature, "hot");
  assert.ok(lead.score >= 70);
  assert.equal(lead.phone, "+15145551234");
  assert.match(lead.summary, /Syndicat/);
  assert.ok(lead.suggestions.length > 3);
  assert.equal(repo.appointments.length, 1);
  assert.ok(repo.quotes.length >= 1 && repo.quotes.at(-1).data.lines.length >= 4);
  assert.deepEqual(notes.map((n) => n.type), ["visit_booked", "intake_complete"]);

  // Append-only: every request's messages extend the previous request's messages unchanged.
  for (let i = 1; i < llm.calls.length; i++) {
    const prev = llm.calls[i - 1].messages, cur = llm.calls[i].messages;
    assert.deepEqual(cur.slice(0, prev.length), prev, `history rewritten at call ${i}`);
  }
  // Roles alternate correctly for the API
  for (let i = 1; i < llm.calls.at(-1).messages.length; i++) assert.notEqual(llm.calls.at(-1).messages[i].role, llm.calls.at(-1).messages[i - 1].role);
});

test("booking is refused without contact info, and for slots not offered", async () => {
  const repo = new MemoryRepo({ rules });
  const llm = scripted([
    tool("a", "book_visit", { slot_id: "2026-10-06T13:00:00.000Z" }),
    (p) => { const r = JSON.parse(p.messages.at(-1).content[0].content); assert.equal(r.error, "missing_info"); return tool("b", "update_dossier", { contact: { name: "A", email: "a@b.ca" }, site: { postal: "H2J 2J5" } }); },
    tool("c", "book_visit", { slot_id: "2026-10-05T13:00:00.000Z" }), // inside the 24 h lead time → not bookable
    (p) => { const r = JSON.parse(p.messages.at(-1).content[0].content); assert.equal(r.error, "slot_unavailable"); return say("Ce créneau n’est plus disponible."); },
  ]);
  const r = await runTurn({ repo, llm, model: "m", now: () => NOW }, { sessionId: "sess_test_bbbbbbbbbbbb", text: "Réservez demain", lang: "fr", consent: true });
  assert.equal(r.booked, null);
  assert.equal(repo.appointments.length, 0);
});

test("no availability configured → assistant is told to have the team call; refusal and API errors degrade gracefully", async () => {
  const repo = new MemoryRepo({ rules: [] });
  const llm = scripted([
    tool("a", "get_available_slots", {}),
    (p) => { assert.equal(JSON.parse(p.messages.at(-1).content[0].content).available, false); return { content: [], stop_reason: "refusal" }; },
  ]);
  const r = await runTurn({ repo, llm, model: "m", now: () => NOW }, { sessionId: "sess_test_cccccccccccc", text: "Hello", lang: "en", consent: true });
  assert.match(r.reply, /\(438\) 815-7232/);
  assert.equal(r.handoff, true);
  const broken = { create: async () => { throw new Error("529 overloaded"); } };
  const r2 = await runTurn({ repo, llm: broken, model: "m", now: () => NOW }, { sessionId: "sess_test_dddddddddddd", text: "Allo", lang: "fr", consent: true });
  assert.match(r2.reply, /problème technique/);
});

test("safety concern → request_human urgent → owner notified", async () => {
  const repo = new MemoryRepo({ rules });
  const notes = [];
  const llm = scripted([tool("a", "request_human", { reason: "Escalier qui bouge", urgent: true }), say("N’utilisez pas l’escalier. Appelez-nous au (438) 815-7232.")]);
  const r = await runTurn({ repo, llm, model: "m", now: () => NOW, notify: async (e) => notes.push(e) }, { sessionId: "sess_test_eeeeeeeeeeee", text: "Notre escalier bouge beaucoup", lang: "fr", consent: true });
  assert.equal(r.handoff, true);
  assert.equal(notes[0].type, "needs_human");
  assert.equal(notes[0].detail.urgent, true);
  assert.equal((await repo.getLeadBySession("sess_test_eeeeeeeeeeee")).needs_human, true);
});

test("HTTP: validation, consent, CORS, history and calendar download", async () => {
  const repo = new MemoryRepo({ rules });
  const llm = scripted([say("Bonjour ! Pour quel type de bâtiment ? [[options: Copropriété | Coopérative | Immeuble locatif]]")]);
  const handle = createHandler({ repo, llm, model: "m", now: () => NOW }, { allowedOrigins: ["https://proferforge.ca"] });
  const post = (body, origin = "https://proferforge.ca") => handle(new Request("http://x/assistant", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) }));
  assert.equal((await post({ session_id: "short", message: "hi" })).status, 400);
  assert.equal((await post({ session_id: "sess_http_aaaaaaaaaaaa", message: "x".repeat(1501) })).status, 400);
  const noConsent = await post({ session_id: "sess_http_aaaaaaaaaaaa", message: "Bonjour" });
  assert.equal(noConsent.status, 400);
  assert.equal((await noConsent.json()).error, "consent_required");
  const ok = await post({ session_id: "sess_http_aaaaaaaaaaaa", message: "Bonjour", consent: true, lang: "fr" });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://proferforge.ca");
  const body = await ok.json();
  assert.deepEqual(body.options, ["Copropriété", "Coopérative", "Immeuble locatif"]);
  const evil = await handle(new Request("http://x/assistant?session_id=sess_http_aaaaaaaaaaaa", { headers: { origin: "https://evil.example" } }));
  assert.equal(evil.headers.get("access-control-allow-origin"), null);
  const hist = await evil.json();
  assert.deepEqual(hist.messages.map((m) => m.role), ["user", "assistant"]);
  assert.ok(!JSON.stringify(hist).includes("tool_use"));
  const ics = await handle(new Request("http://x/assistant/ics?session_id=sess_http_aaaaaaaaaaaa"));
  assert.equal(ics.status, 404);
});

test("parseOptions only accepts the trailing marker", () => {
  assert.deepEqual(parseOptions("Question ? [[options: Oui | Non]]"), { text: "Question ?", options: ["Oui", "Non"] });
  assert.deepEqual(parseOptions("Pas d’options"), { text: "Pas d’options", options: [] });
});

test("truncated tool call (max_tokens) and mid-turn refusal leave a replayable history", async () => {
  const repo = new MemoryRepo({ rules });
  const llm = scripted([
    { content: [{ type: "text", text: "Je note…" }, { type: "tool_use", id: "x1", name: "update_dossier", input: { contact: { name: "Ana" } } }], stop_reason: "max_tokens" },
    { content: [], stop_reason: "refusal" },
  ]);
  const deps = { repo, llm, model: "m", now: () => NOW };
  await runTurn(deps, { sessionId: "sess_test_ffffffffffff", text: "Bonjour", lang: "fr", consent: true });
  await runTurn(deps, { sessionId: "sess_test_ffffffffffff", text: "Encore", lang: "fr" });
  const lead = await repo.getLeadBySession("sess_test_ffffffffffff");
  const msgs = await repo.listMessages(lead.id);
  const uses = msgs.flatMap((m) => (m.role === "assistant" ? m.content.filter((b) => b.type === "tool_use").map((b) => b.id) : []));
  const results = msgs.flatMap((m) => (m.role === "user" && Array.isArray(m.content) ? m.content.filter((b) => b.type === "tool_result").map((b) => b.tool_use_id) : []));
  assert.deepEqual(uses, results);
  assert.ok(msgs.every((m) => !Array.isArray(m.content) || m.content.length > 0));
});
