// Paiements : Stripe Checkout (si STRIPE_SECRET_KEY est défini) ou mode simulation (développement / démo).
// Aucune donnée de carte ne transite par ce serveur : Stripe héberge la page de paiement.
import { createHmac, timingSafeEqual } from "node:crypto";
import { q } from "./db.mjs";

export const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const stripeEnabled = () => Boolean(STRIPE_KEY);

function form(obj, prefix = "") {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === "object") parts.push(form(v, key));
    else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return parts.filter(Boolean).join("&");
}
async function stripe(path, body) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST", headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Stripe ${res.status}`);
  return json;
}

// Crée une commande + ses versements. Retourne l'id de commande, le total et l'échéancier.
export async function createOrder({ user, course, plan, coupon }) {
  let total = course.price_cents;
  let couponRow = null;
  if (coupon) {
    couponRow = await q.get("SELECT * FROM coupons WHERE code = ? AND active = 1", coupon.toUpperCase());
    if (!couponRow) throw Object.assign(new Error("Code promo invalide"), { status: 400 });
    total = Math.round(total * (100 - couponRow.pct_off) / 100);
  }
  const planDef = plan === "3x" && course.plan_json ? JSON.parse(course.plan_json) : null;
  const r = await q.run(
    "INSERT INTO orders(user_id,course_id,amount_cents,currency,coupon,plan,provider,status) VALUES(?,?,?,?,?,?,?,'pending')",
    user.id, course.id, total, course.currency, couponRow ? couponRow.code : null, planDef ? "3x" : "full", stripeEnabled() ? "stripe" : "simulated"
  );
  const orderId = r.lastInsertRowid;
  const installments = [];
  if (planDef) {
    const base = planDef.installments.reduce((s, i) => s + i.amount_cents, 0);
    let allocated = 0;
    for (const [idx, inst] of planDef.installments.entries()) {
      const last = idx === planDef.installments.length - 1;
      const amount = last ? total - allocated : Math.round(total * inst.amount_cents / base);
      allocated += amount;
      const due = new Date(Date.now() + inst.days * 864e5).toISOString();
      await q.run("INSERT INTO installments(order_id,number,label,amount_cents,due_at) VALUES(?,?,?,?,?)", orderId, idx + 1, inst.label, amount, due);
      installments.push({ number: idx + 1, label: inst.label, amount_cents: amount, due_at: due });
    }
  } else {
    const now = new Date().toISOString();
    await q.run("INSERT INTO installments(order_id,number,label,amount_cents,due_at) VALUES(?,1,'Paiement intégral',?,?)", orderId, total, now);
    installments.push({ number: 1, label: "Paiement intégral", amount_cents: total, due_at: now });
  }
  if (couponRow) await q.run("UPDATE coupons SET uses = uses + 1 WHERE code = ?", couponRow.code);
  return { orderId, total, installments };
}

export async function checkoutUrl({ orderId, installmentNumber, course, user, baseUrl }) {
  const inst = await q.get("SELECT * FROM installments WHERE order_id = ? AND number = ?", orderId, installmentNumber);
  if (!inst) throw Object.assign(new Error("Versement introuvable"), { status: 404 });
  if (inst.status === "paid") throw Object.assign(new Error("Versement déjà payé"), { status: 400 });
  if (!stripeEnabled()) return { simulated: true, url: `${baseUrl}/paiement/simulation?order=${orderId}&n=${installmentNumber}` };
  const session = await stripe("checkout/sessions", {
    mode: "payment", customer_email: user.email, client_reference_id: `${orderId}:${installmentNumber}`,
    success_url: `${baseUrl}/paiement/succes?order=${orderId}&n=${installmentNumber}`, cancel_url: `${baseUrl}/formation/${course.slug}`,
    line_items: { 0: { quantity: 1, price_data: { currency: course.currency.toLowerCase(), unit_amount: inst.amount_cents, product_data: { name: `${course.title} — ${inst.label}` } } } },
    metadata: { order_id: orderId, installment: installmentNumber, user_id: user.id },
  });
  await q.run("UPDATE installments SET provider_ref = ? WHERE id = ?", session.id, inst.id);
  return { simulated: false, url: session.url };
}

// Marque un versement payé, met à jour la commande et ouvre l'accès (inscription) dès le 1er versement.
export async function markInstallmentPaid(orderId, number, providerRef = null) {
  const inst = await q.get("SELECT * FROM installments WHERE order_id = ? AND number = ?", orderId, number);
  if (!inst) return null;
  if (inst.status !== "paid") await q.run("UPDATE installments SET status = 'paid', paid_at = datetime('now'), provider_ref = COALESCE(?, provider_ref) WHERE id = ?", providerRef, inst.id);
  const order = await q.get("SELECT * FROM orders WHERE id = ?", orderId);
  const remaining = (await q.get("SELECT COUNT(*) n FROM installments WHERE order_id = ? AND status != 'paid'", orderId)).n;
  if (remaining === 0) await q.run("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?", orderId);
  else await q.run("UPDATE orders SET status = 'active' WHERE id = ?", orderId);
  await q.run("INSERT OR IGNORE INTO enrollments(user_id,course_id,source) VALUES(?,?,?)", order.user_id, order.course_id, order.plan === "3x" ? "plan_3x" : "purchase");
  return { order, remaining };
}

// Vérification de signature des webhooks Stripe (en-tête Stripe-Signature : t=...,v1=...).
export function verifyStripeSignature(rawBody, header) {
  if (!STRIPE_WEBHOOK_SECRET || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = createHmac("sha256", STRIPE_WEBHOOK_SECRET).update(`${parts.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
