// Unit tests for the assistant core. Run: node --test proferforge/backend/tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { sanitizePatch, mergeDossier, missingFields, canBook } from "../supabase/functions/_shared/dossier.ts";
import { scoreLead } from "../supabase/functions/_shared/scoring.ts";
import { availableSlots, zonedInstant } from "../supabase/functions/_shared/slots.ts";
import { buildQuote, recalc, renderQuoteHtml } from "../supabase/functions/_shared/quote.ts";
import { suggestActions } from "../supabase/functions/_shared/suggestions.ts";
import { buildIcs } from "../supabase/functions/_shared/ics.ts";
import { DEFAULT_RATE_CARD } from "../supabase/functions/_shared/repo.ts";

const condo = {
  contact: { name: "Marie Tremblay", phone: "+15145551234", email: "marie@example.com" },
  org: { client_type: "condo", role: "board_member", is_decision_maker: true, approval_status: "approved" },
  site: { address: "1234 rue Rachel E", city: "Montréal", postal: "H2J 2J5" },
  project: { work_type: "both", structures: [{ type: "service_stair", qty: 2, storeys: 3 }, { type: "balcony", qty: 6 }], condition: "rust_through" },
  timing: { urgency: "asap" },
};

test("sanitizePatch drops invalid values and unknown keys, normalizes phone/postal", () => {
  const p = sanitizePatch({ contact: { name: " Ana ", phone: "(514) 555-1234", email: "bad" }, site: { postal: "h2j2j5" }, evil: { $where: 1 },
    project: { work_type: "nuke", structures: [{ type: "rocket", qty: 9999 }] }, timing: { urgency: "asap" } });
  assert.deepEqual(p.contact, { name: "Ana", phone: "+15145551234" });
  assert.equal(p.site.postal, "H2J 2J5");
  assert.equal(p.evil, undefined);
  assert.equal(p.project.work_type, undefined);
  assert.deepEqual(p.project.structures, [{ type: "other", qty: 1 }]);
});

test("mergeDossier keeps earlier facts; missingFields orders the next questions", () => {
  let d = mergeDossier({}, sanitizePatch({ org: { client_type: "condo" } }));
  d = mergeDossier(d, sanitizePatch({ contact: { name: "Ana" } }));
  assert.equal(d.org.client_type, "condo");
  assert.equal(missingFields(d)[0], "project.work_type");
  assert.ok(missingFields(d).includes("org.approval_status"));
  assert.equal(canBook(d), false);
  assert.equal(canBook(condo), true);
});

test("scoring: approved condo, rust-through, asap, Montréal → hot", () => {
  const s = scoreLead(condo, { visitBooked: true });
  assert.equal(s.temperature, "hot");
  assert.ok(s.score >= 70, String(s.score));
  assert.ok(s.reasons.every((r) => r.fr && r.en));
});

test("scoring: single balcony homeowner planning → cold, flagged below minimum; outside area forces cold", () => {
  const s = scoreLead({ org: { client_type: "homeowner" }, project: { work_type: "paint", structures: [{ type: "balcony", qty: 1 }] }, timing: { urgency: "planning" }, contact: { email: "a@b.ca" } });
  assert.equal(s.temperature, "cold");
  assert.ok(s.flags.includes("may_be_below_minimum"));
  const far = scoreLead({ ...condo, site: { postal: "G1R 4P5" } });
  assert.equal(far.temperature, "cold");
  assert.ok(far.flags.includes("outside_area"));
});

test("scoring: hot requires a way to reach the client", () => {
  const s = scoreLead({ ...condo, contact: { name: "X" } });
  assert.notEqual(s.temperature, "hot");
  assert.ok(s.flags.includes("no_contact"));
});

test("slots: Montréal time across DST, lead time, booked and blackouts respected", () => {
  // 2026-11-01 is the DST change in Montréal: 10:00 local = 14:00Z before, 15:00Z after
  assert.equal(new Date(zonedInstant(2026, 10, 30, 10, 0, "America/Montreal")).toISOString(), "2026-10-30T14:00:00.000Z");
  assert.equal(new Date(zonedInstant(2026, 11, 2, 10, 0, "America/Montreal")).toISOString(), "2026-11-02T15:00:00.000Z");
  const now = Date.parse("2026-10-05T12:00:00Z"); // Monday 08:00 Montréal
  const rules = [1, 2, 3, 4, 5].map((wd) => ({ weekday: wd, start_time: "09:00", end_time: "12:00" }));
  const all = availableSlots({ now, rules, maxSlots: 50, maxPerDay: 10 });
  assert.ok(all.every((s) => Date.parse(s.start) >= now + 24 * 3600e3), "lead time");
  assert.equal(all[0].start, "2026-10-06T13:00:00.000Z"); // Tuesday 09:00 EDT
  assert.match(all[0].label_fr, /mardi/);
  const booked = availableSlots({ now, rules, booked: [all[0].start], blackouts: ["2026-10-07"], maxSlots: 50, maxPerDay: 10 });
  assert.ok(!booked.some((s) => s.start === all[0].start));
  assert.ok(!booked.some((s) => s.start.startsWith("2026-10-07")));
  assert.equal(availableSlots({ now, rules: [] }).length, 0);
});

test("quote: no invented prices; priced rate card computes GST/QST; recalc after edits", () => {
  const blank = buildQuote(condo, DEFAULT_RATE_CARD, {}, "fr");
  assert.ok(blank.lines.length >= 4);
  assert.ok(blank.lines.every((l) => l.unit_price === null && l.amount === null));
  assert.equal(blank.total, 0);
  assert.equal(blank.complete, false);
  assert.ok(blank.warnings.some((w) => /RBQ/.test(w)));
  const priced = DEFAULT_RATE_CARD.map((r) => ({ ...r, unit_price: 100 }));
  const q = buildQuote({ ...condo, project: { ...condo.project, work_type: "paint", condition: "flaking" } }, priced, { rbq: "1234" }, "en");
  // 2 stairs × 3 storeys = 6, 6 balconies, + protection 1 → 13 × 100
  assert.equal(q.subtotal, 1300);
  assert.equal(q.gst, 65);
  assert.equal(q.qst, 129.68);
  assert.equal(q.total, 1494.68);
  assert.ok(q.warnings.some((w) => /minimum/i.test(w)));
  const edited = recalc({ ...q, lines: q.lines.map((l, i) => (i === 0 ? { ...l, unit_price: 1000 } : l)) }, {});
  assert.equal(edited.subtotal, 1300 - 600 + 6000);
  const html = renderQuoteHtml(blank, { name: "Pro Fer Forgé" }, { number: "S-1" });
  assert.match(html, /BROUILLON/);
  assert.ok(!/<script/i.test(renderQuoteHtml({ ...blank, client: { name: "<script>x</script>" } }, {})));
});

test("suggestions: safety and hot leads come first, cold leads get nurture", () => {
  const s = scoreLead({ ...condo, project: { ...condo.project, safety_concern: true } });
  const a = suggestActions(condo, s, {});
  assert.equal(a[0].priority, 1);
  assert.ok(a.some((x) => x.id === "safety_call"));
  const cold = suggestActions({}, { score: 10, temperature: "cold", reasons: [], flags: [] }, {});
  assert.ok(cold.some((x) => x.id === "nurture"));
});

test("ics is valid-looking and escapes text", () => {
  const ics = buildIcs({ uid: "u1", start: "2026-10-06T13:00:00.000Z", end: "2026-10-06T14:00:00.000Z", summary: "Visite; test, ok", now: "2026-10-01T00:00:00.000Z" });
  assert.match(ics, /DTSTART:20261006T130000Z/);
  assert.ok(ics.includes("SUMMARY:Visite\\; test\\, ok\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("quote: address parts are not repeated; stale 'price to complete' note clears once priced", async () => {
  const { joinAddress } = await import("../supabase/functions/_shared/quote.ts");
  assert.equal(joinAddress("1234 rue Rachel E, H2J 2J5", "Montréal", "H2J 2J5"), "1234 rue Rachel E, H2J 2J5, Montréal");
  const q = buildQuote(condo, DEFAULT_RATE_CARD, {}, "fr");
  const r = recalc({ ...q, lines: q.lines.map((l) => ({ ...l, unit_price: 10 })) }, {});
  assert.ok(r.lines.every((l) => !/Prix à compléter/.test(l.note ?? "")));
});
