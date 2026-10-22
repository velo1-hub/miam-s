// Paiement en Bitcoin : facture à montant fixe en BTC, vérification sur la blockchain via l'API publique mempool.space
// (aucune clé requise). L'adresse de réception est configurée dans l'admin (réglage btc_address).
//   - Taux : mempool.space/api/v1/prices (USD), mis en cache 2 minutes.
//   - Vérification : transactions reçues par l'adresse ; une sortie ≥ montant attendu (tolérance 1 %) après la création
//     de la facture valide le versement (0 confirmation acceptée si MIN_CONF = 0, sinon attend N confirmations).
import { q, getSetting } from "./db.mjs";

const API = process.env.MEMPOOL_API || "https://mempool.space/api";
const MIN_CONF = Number(process.env.BTC_MIN_CONFIRMATIONS ?? 1);
const TOLERANCE = 0.01;
let priceCache = { usd: 0, at: 0 };

export async function btcAddress() { return (await getSetting("btc_address", "")) || process.env.BTC_ADDRESS || ""; }
export async function btcEnabled() { return Boolean(await btcAddress()); }

export async function btcPriceUsd() {
  if (Date.now() - priceCache.at < 120e3 && priceCache.usd) return priceCache.usd;
  let usd = 0;
  try { const res = await fetch(`${API}/v1/prices`); if (res.ok) usd = Number((await res.json()).USD) || 0; } catch {}
  if (!usd) { try { const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"); if (res.ok) usd = Number((await res.json()).bitcoin?.usd) || 0; } catch {} }
  if (!usd) throw new Error("Taux BTC indisponible pour le moment, réessayez dans une minute");
  priceCache = { usd, at: Date.now() };
  return usd;
}

// Montant en satoshis pour un montant en cents (USD). Les autres devises sont converties par le taux saisi dans l'admin (usd_rate_<DEV>), sinon 1:1.
export async function satsFor(amountCents, currency = "USD") {
  let usd = amountCents / 100;
  if (currency !== "USD") { const r = Number(await getSetting(`usd_rate_${currency}`, "1")) || 1; usd = usd * r; }
  const price = await btcPriceUsd();
  return Math.ceil((usd / price) * 1e8);
}

// Crée (ou renvoie) la facture BTC d'un versement : montant figé en sats au moment de la demande, valable 1 h puis recalculé.
export async function btcInvoice(installment) {
  const address = await btcAddress();
  if (!address) throw Object.assign(new Error("Paiement Bitcoin non configuré"), { status: 400 });
  const order = await q.get("SELECT * FROM orders WHERE id = ?", installment.order_id);
  let inv = await q.get("SELECT * FROM btc_invoices WHERE installment_id = ? ORDER BY id DESC LIMIT 1", installment.id);
  const stale = !inv || (inv.status === "pending" && Date.now() - new Date(inv.created_at instanceof Date ? inv.created_at : String(inv.created_at).replace(" ", "T") + (String(inv.created_at).endsWith("Z") ? "" : "Z")).getTime() > 3600e3);
  if (stale) {
    const sats = await satsFor(installment.amount_cents, order.currency);
    const r = await q.run("INSERT INTO btc_invoices(installment_id,address,sats,status) VALUES(?,?,?,'pending')", installment.id, address, sats);
    inv = await q.get("SELECT * FROM btc_invoices WHERE id = ?", r.lastInsertRowid);
  }
  return { id: inv.id, address: inv.address, sats: inv.sats, btc: (inv.sats / 1e8).toFixed(8), status: inv.status, txid: inv.txid, confirmations: inv.confirmations, created_at: inv.created_at, uri: `bitcoin:${inv.address}?amount=${(inv.sats / 1e8).toFixed(8)}&label=${encodeURIComponent("The 1%")}` };
}

// Vérifie une facture : cherche une transaction vers l'adresse, postérieure à la facture, d'un montant suffisant.
export async function checkInvoice(invoiceId, fetchImpl = fetch) {
  const inv = await q.get("SELECT * FROM btc_invoices WHERE id = ?", invoiceId);
  if (!inv) return null;
  if (inv.status === "paid") return inv;
  const res = await fetchImpl(`${API}/address/${inv.address}/txs`);
  if (!res.ok) throw new Error(`Blockchain indisponible (${res.status})`);
  const txs = await res.json();
  const tip = await (await fetchImpl(`${API}/blocks/tip/height`)).text().then(Number).catch(() => 0);
  const createdMs = new Date(inv.created_at instanceof Date ? inv.created_at : String(inv.created_at).replace(" ", "T") + (String(inv.created_at).endsWith("Z") ? "" : "Z")).getTime();
  const minSats = Math.floor(inv.sats * (1 - TOLERANCE));
  for (const tx of txs) {
    const received = (tx.vout || []).filter((o) => o.scriptpubkey_address === inv.address).reduce((s, o) => s + Number(o.value || 0), 0);
    if (received < minSats) continue;
    const seenMs = tx.status?.block_time ? tx.status.block_time * 1000 : Date.now();
    if (seenMs < createdMs - 600e3) continue; // transaction antérieure à la facture
    if (await q.get("SELECT 1 FROM btc_invoices WHERE txid = ? AND id != ?", tx.txid, inv.id)) continue; // déjà utilisée
    const conf = tx.status?.confirmed && tip ? tip - tx.status.block_height + 1 : 0;
    await q.run("UPDATE btc_invoices SET txid = ?, confirmations = ?, status = ? WHERE id = ?", tx.txid, conf, conf >= MIN_CONF ? "paid" : "seen", inv.id);
    return q.get("SELECT * FROM btc_invoices WHERE id = ?", inv.id);
  }
  return inv;
}
