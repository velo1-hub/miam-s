import { test } from "node:test";
import assert from "node:assert/strict";
import { computeQuote, withTax } from "../src/lib/pricing";

test("residential 4½ one-time lands in the published range", () => {
  const q = computeQuote({ service: "residential", homeType: "4half", frequency: "once" });
  assert.equal(q.kind, "firm"); assert.ok(q.min >= 115 && q.min <= 150, String(q.min));
});
test("weekly discount is 15%", () => {
  const once = computeQuote({ service: "residential", homeType: "3half" }).min;
  const weekly = computeQuote({ service: "residential", homeType: "3half", frequency: "weekly" }).min;
  assert.equal(weekly, Math.round(once * 0.85));
});
test("minimums apply", () => {
  assert.ok(computeQuote({ service: "deep", homeType: "studio" }).min >= 190);
  assert.ok(computeQuote({ service: "move", homeType: "studio" }).min >= 240);
  assert.equal(computeQuote({ service: "postconstruction", sqft: 200 }).min, 300);
});
test("airbnb by bedrooms with linens", () => {
  const q = computeQuote({ service: "airbnb", bedrooms: 2, addons: ["linens"] });
  assert.equal(q.min, 145 + 25); assert.equal(q.unit, "turnover");
});
test("office is a monthly range with walkthrough note", () => {
  const q = computeQuote({ service: "office", sqft: 2000, visitsPerWeek: 3 });
  assert.equal(q.unit, "month"); assert.ok(q.min < q.max); assert.ok(q.notes.includes("walkthrough_required"));
  assert.ok(q.min >= 450 * 0.85);
});
test("large post-construction requires a site visit", () => {
  assert.equal(computeQuote({ service: "postconstruction", sqft: 5000 }).kind, "quote");
});
test("tax math", () => {
  const t = withTax(100); assert.equal(t.gst, 5); assert.equal(t.qst, 9.98); assert.equal(t.total, 114.98);
});
