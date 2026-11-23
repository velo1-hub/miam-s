export const dynamic = "force-dynamic";

/**
 * Crée un lien de paiement Stripe pour une facture (carte, Apple Pay, Google Pay selon l'appareil).
 * Réservé à l'équipe : l'appelant envoie son jeton de session, et c'est la base (règles RLS) qui
 * confirme qu'il fait partie de l'équipe et qu'il voit la facture. ÉTEINT tant que STRIPE_SECRET_KEY
 * n'est pas défini dans Vercel. Le montant vient toujours de la base, jamais du navigateur.
 */
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function stripe(path: string, body: Record<string, string>, key: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`stripe_${res.status}`);
  return (await res.json()) as { id: string; url?: string };
}

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !SB || !ANON) return Response.json({ off: true }, { status: 503 });
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  let id = "";
  try { id = String(((await req.json()) as { invoice_id?: unknown }).invoice_id ?? ""); } catch { /* corps invalide */ }
  if (!token || !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "bad_request" }, { status: 400 });

  const h = { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  try {
    const staff = await fetch(`${SB}/rest/v1/rpc/is_staff`, { method: "POST", headers: h, body: "{}", cache: "no-store" });
    if (!staff.ok || (await staff.json()) !== true) return Response.json({ error: "forbidden" }, { status: 403 });
    const inv = await fetch(`${SB}/rest/v1/invoices?id=eq.${id}&select=id,label,amount_cents,status`, { headers: h, cache: "no-store" });
    const row = ((await inv.json()) as { id: string; label: string; amount_cents: number; status: string }[])[0];
    if (!row) return Response.json({ error: "not_found" }, { status: 404 });
    if (row.status === "payee" || row.status === "annulee") return Response.json({ error: "closed" }, { status: 409 });

    const price = await stripe("prices", { currency: "cad", unit_amount: String(row.amount_cents), "product_data[name]": `Othmani CPA : ${row.label}`.slice(0, 240) }, key);
    const link = await stripe("payment_links", {
      "line_items[0][price]": price.id,
      "line_items[0][quantity]": "1",
      "metadata[invoice_id]": row.id,
      "restrictions[completed_sessions][limit]": "1",
    }, key);
    if (!link.url) throw new Error("no_url");
    return Response.json({ url: link.url });
  } catch {
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
