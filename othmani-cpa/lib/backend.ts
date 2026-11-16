/**
 * Accès serveur à la base (Supabase) par la clé publique : seules les deux fonctions
 * `submit_lead` et `subscribe_reminder` sont ouvertes au public (voir supabase/migrations).
 * Aucune clé secrète de base de données n'est utilisée par le site.
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const backendOn = () => Boolean(URL_ && KEY);

export async function rpc(fn: string, args: Record<string, unknown>): Promise<{ ok: boolean; code?: string; data?: unknown }> {
  if (!backendOn()) return { ok: false, code: "off" };
  try {
    const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (res.ok) return { ok: true, data: await res.json().catch(() => null) };
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, code: body.message ?? String(res.status) };
  } catch {
    return { ok: false, code: "network" };
  }
}

export type LeadInput = {
  source: "contact" | "clara";
  lang: string;
  name: string;
  email?: string;
  phone?: string;
  audience?: string;
  topic?: string;
  message?: string;
};

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function saveLead(l: LeadInput) {
  const r = await rpc("submit_lead", {
    p_source: l.source,
    p_lang: l.lang === "en" ? "en" : "fr",
    p_name: clip(l.name, 120),
    p_email: clip(l.email, 200),
    p_phone: clip(l.phone, 40),
    p_audience: clip(l.audience, 20),
    p_topic: clip(l.topic, 120),
    p_message: clip(l.message, 4000),
  });
  if (r.ok) await notify(l);
  return r;
}

/** Avis par courriel au cabinet (facultatif) : actif si RESEND_API_KEY et LEADS_NOTIFY_EMAIL sont définis. */
async function notify(l: LeadInput) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_NOTIFY_EMAIL;
  if (!key || !to) return;
  const from = process.env.LEADS_FROM_EMAIL || "Othmani CPA <onboarding@resend.dev>";
  const lines = [
    `Source : ${l.source === "clara" ? "Clara (assistante)" : "Formulaire de contact"}`,
    `Nom : ${clip(l.name, 120)}`,
    `Courriel : ${clip(l.email, 200) || "—"}`,
    `Téléphone : ${clip(l.phone, 40) || "—"}`,
    `Pour : ${clip(l.audience, 20) || "—"}`,
    `Sujet : ${clip(l.topic, 120) || "—"}`,
    "",
    clip(l.message, 4000),
    "",
    "Ouvrir le tableau de bord : /gestion/",
  ];
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject: `Nouvelle demande : ${clip(l.name, 60)}`, text: lines.join("\n"), ...(l.email ? { reply_to: clip(l.email, 200) } : {}) }),
    });
  } catch {
    /* l'avis est un plus : la demande est déjà enregistrée */
  }
}

/** Champs d'un formulaire HTML ou d'un corps JSON. */
export async function readBody(req: Request): Promise<Record<string, string>> {
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const j = (await req.json()) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, typeof v === "string" ? v : ""]));
    }
    const fd = await req.formData();
    return Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  } catch {
    return {};
  }
}

export const errorStatus = (code?: string) => (code === "off" ? 503 : code === "rate_limited" ? 429 : code === "network" ? 502 : 400);
