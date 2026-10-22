// Paiement Bitcoin : facture figée en sats, vérification sur une blockchain simulée (fetch remplacé), accès au 1er versement.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "academy-btc-"));
process.env.ACADEMY_DB = join(dir, "test.db");
process.env.ADMIN_PASSWORD = "AdminTest-123";
process.env.BTC_MIN_CONFIRMATIONS = "1";
delete process.env.STRIPE_SECRET_KEY; delete process.env.DATABASE_URL;

const ADDR = "bc1qtestaddress0000000000000000000000000000";
const chain = { txs: [], tip: 900000 };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes("mempool.space")) {
    if (u.endsWith("/v1/prices")) return new Response(JSON.stringify({ USD: 100000 }), { status: 200, headers: { "content-type": "application/json" } });
    if (u.endsWith("/blocks/tip/height")) return new Response(String(chain.tip), { status: 200 });
    if (u.includes("/address/")) return new Response(JSON.stringify(chain.txs), { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(url, opts);
};

const { createApp } = await import("../server.mjs");
const { seed } = await import("../src/seed.mjs");
const { closeDb, setSetting } = await import("../src/db.mjs");

let server, base; const jars = {};
async function call(who, method, path, body) {
  const headers = { "X-Requested-With": "the1percent" };
  if (jars[who]) headers.Cookie = jars[who];
  const opts = { method, headers };
  if (body !== undefined) { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  const res = await realFetch(base + path, opts);
  const sc = res.headers.get("set-cookie"); if (sc) jars[who] = sc.split(";")[0];
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
before(async () => {
  await seed({ log: () => {} });
  await setSetting("btc_address", ADDR);
  await setSetting("payment_methods", "bitcoin,card");
  server = createApp(); await new Promise((r) => server.listen(0, r)); base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise((r) => server.close(r)); await closeDb(); rmSync(dir, { recursive: true, force: true }); });

test("la configuration expose Bitcoin comme moyen de paiement", async () => {
  const r = await call("anon", "GET", "/api/config");
  assert.equal(r.data.bitcoin, true);
  assert.deepEqual(r.data.methods, ["bitcoin", "card"]);
});

let orderId, invoice;
test("inscription en 3 versements payée en Bitcoin : facture figée au taux", async () => {
  await call("zoe", "POST", "/api/auth/register", { name: "Zoé Martin", email: "zoe@example.com", password: "Secret-123" });
  const flag = (await call("zoe", "GET", "/api/courses")).data.find((c) => c.slug === "the-1-percent");
  let r = await call("zoe", "POST", "/api/checkout", { course_id: flag.id, plan: "3x", method: "bitcoin" });
  assert.equal(r.status, 200);
  assert.ok(r.data.url.startsWith("/paiement/bitcoin?order="));
  orderId = r.data.order_id;
  r = await call("zoe", "GET", `/api/orders/${orderId}/btc/1`);
  assert.equal(r.status, 200);
  assert.equal(r.data.paid, false);
  invoice = r.data.invoice;
  assert.equal(invoice.address, ADDR);
  assert.equal(invoice.sats, 5000000); // 5 000 $ à 100 000 $/BTC = 0,05 BTC
  assert.equal(invoice.btc, "0.05000000");
  assert.ok(invoice.uri.startsWith(`bitcoin:${ADDR}?amount=0.05000000`));
  const again = await call("zoe", "GET", `/api/orders/${orderId}/btc/1`);
  assert.equal(again.data.invoice.id, invoice.id, "la facture est réutilisée tant qu'elle est valide");
});

test("vérification : rien, puis transaction insuffisante, puis paiement détecté et confirmé", async () => {
  let r = await call("zoe", "POST", `/api/btc/invoices/${invoice.id}/check`);
  assert.equal(r.data.status, "pending");
  chain.txs.push({ txid: "aa11", status: { confirmed: true, block_height: 899999, block_time: Math.floor(Date.now() / 1000) }, vout: [{ scriptpubkey_address: ADDR, value: 1000000 }] });
  r = await call("zoe", "POST", `/api/btc/invoices/${invoice.id}/check`);
  assert.equal(r.data.status, "pending", "montant insuffisant ignoré");
  chain.txs.push({ txid: "bb22", status: { confirmed: false }, vout: [{ scriptpubkey_address: ADDR, value: 4970000 }, { scriptpubkey_address: "bc1qchange", value: 50000 }] });
  r = await call("zoe", "POST", `/api/btc/invoices/${invoice.id}/check`);
  assert.equal(r.data.status, "seen", "0 confirmation : détectée mais pas encore payée (tolérance 1 % acceptée)");
  assert.equal((await call("zoe", "GET", "/api/courses/the-1-percent")).data.enrolled, false);
  chain.txs[1].status = { confirmed: true, block_height: 900000, block_time: Math.floor(Date.now() / 1000) };
  r = await call("zoe", "POST", `/api/btc/invoices/${invoice.id}/check`);
  assert.equal(r.data.status, "paid");
  assert.equal(r.data.txid, "bb22");
  assert.ok(r.data.redirect.startsWith("/apprendre/"));
  const c = (await call("zoe", "GET", "/api/courses/the-1-percent")).data;
  assert.equal(c.enrolled, true);
  assert.deepEqual(c.order.installments.map((i) => i.status), ["paid", "pending", "pending"]);
});

test("une transaction déjà utilisée ne paie pas un second versement ; facture du 2e versement", async () => {
  const r = await call("zoe", "GET", `/api/orders/${orderId}/btc/2`);
  assert.equal(r.data.invoice.sats, 5000000);
  const chk = await call("zoe", "POST", `/api/btc/invoices/${r.data.invoice.id}/check`);
  assert.equal(chk.data.status, "pending", "bb22 est déjà associée à la facture 1");
  const admin = await call("admin", "POST", "/api/auth/login", { email: "admin@the1percent.academy", password: "AdminTest-123" });
  assert.equal(admin.status, 200);
  const stats = (await call("admin", "GET", "/api/admin/stats")).data;
  assert.equal(stats.btc_pending.length, 1);
  assert.equal(stats.revenue_cents, 500000);
});

test("un autre utilisateur ne peut pas consulter la facture", async () => {
  await call("bob", "POST", "/api/auth/register", { name: "Bob Roy", email: "bob@example.com", password: "Secret-123" });
  assert.equal((await call("bob", "GET", `/api/orders/${orderId}/btc/2`)).status, 404);
  assert.equal((await call("bob", "POST", `/api/btc/invoices/${invoice.id}/check`)).status, 404);
});
