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
    const known = ["rate_limited", "email_invalid", "name_required", "contact_required"];
    return { ok: false, code: known.includes(body.message ?? "") ? body.message : "error" };
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
    p_phone: e164(clip(l.phone, 40)) ?? clip(l.phone, 40),
    p_audience: clip(l.audience, 20),
    p_topic: clip(l.topic, 120),
    p_message: clip(l.message, 4000),
  });
  if (r.ok) await Promise.allSettled([notify(l), confirmToClient(l)]);
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

/**
 * Automatisation : dès qu'une demande est enregistrée, la personne reçoit en même temps un courriel
 * et un texto qui confirment qu'un membre du bureau va l'appeler. Aucune date ni heure n'est promise.
 * Actif seulement si les services sont configurés dans Vercel :
 *   courriel : RESEND_API_KEY (+ LEADS_FROM_EMAIL, une adresse du domaine du cabinet)
 *   texto    : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (numéro ou service d'envoi)
 */
const PHONE = "514 448-0924";
const confirmText = {
  fr: () => ({
    subject: "Othmani CPA : nous avons bien reçu votre demande",
    sms: `Othmani CPA : nous avons bien reçu votre demande. Un membre de notre bureau vous appellera. Pour nous joindre : ${PHONE}.`,
    body: `Bonjour,\n\nNous avons bien reçu votre demande. Un membre de notre bureau vous appellera pour en discuter et convenir de la suite.\n\nD'ici là, vous n'avez rien à faire. Si votre situation est urgente (par exemple une lettre de l'impôt avec une date limite), appelez-nous au ${PHONE}.\n\nPar sécurité, n'envoyez jamais votre numéro d'assurance sociale ni vos renseignements bancaires par courriel.\n\nL'équipe d'Othmani CPA Inc.\n8065, boul. Viau, bureau 204, Saint-Léonard (Québec) H1R 2T2`,
  }),
  en: () => ({
    subject: "Othmani CPA: we have received your request",
    sms: `Othmani CPA: we have received your request. A member of our office will call you. To reach us: ${PHONE}.`,
    body: `Hello,\n\nWe have received your request. A member of our office will call you to discuss it and agree on next steps.\n\nUntil then, there is nothing you need to do. If your situation is urgent (for example a tax letter with a deadline), call us at ${PHONE}.\n\nFor your security, never send your social insurance number or banking details by email.\n\nThe Othmani CPA Inc. team\n8065 Viau Blvd., Suite 204, Saint-Léonard, Quebec H1R 2T2`,
  }),
};

const BLOCKED_AREA = new Set("900 976 242 246 264 268 284 340 345 441 473 649 658 664 670 671 684 721 758 767 784 787 809 829 849 868 869 876 939".split(" "));

/** Numéro nord-américain au format international, sinon null (on n'envoie rien). */
export function e164(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  const n = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  // Canada et États-Unis seulement : pas d'indicatifs surtaxés (900, 976) ni des Caraïbes.
  if (n.length !== 10 || !/^[2-9]\d{2}[2-9]/.test(n) || BLOCKED_AREA.has(n.slice(0, 3))) return null;
  return `+1${n}`;
}

async function confirmToClient(l: LeadInput) {
  // Texte fixe : rien de ce que la personne a saisi ne part sous le nom du cabinet.
  const t = confirmText[l.lang === "en" ? "en" : "fr"]();
  const jobs: Promise<unknown>[] = [];
  const email = clip(l.email, 200);
  const resend = process.env.RESEND_API_KEY;
  if (resend && email) {
    jobs.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.LEADS_FROM_EMAIL || "Othmani CPA <onboarding@resend.dev>", to: [email], subject: t.subject, text: t.body }),
    }));
  }
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
  const to = e164(clip(l.phone, 40));
  if (sid && token && from && to && l.source === "contact") {
    const body = new URLSearchParams({ To: to, Body: t.sms });
    body.set(from.startsWith("MG") ? "MessagingServiceSid" : "From", from);
    jobs.push(fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }));
  }
  await Promise.allSettled(jobs); // la demande est déjà enregistrée : un envoi raté ne bloque rien
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

/** Frein par adresse IP (au mieux : la mémoire d'une fonction sans serveur n'est pas partagée). */
const seen = new Map<string, number[]>();
export function tooMany(req: Request, max: number, windowMs = 10 * 60_000) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const now = Date.now();
  const list = (seen.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  seen.set(ip, list);
  if (seen.size > 5000) seen.clear();
  return list.length > max;
}

/** Refuse les appels venant d'un autre site (un navigateur envoie toujours Origin sur un POST). */
export function foreignOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host !== (req.headers.get("x-forwarded-host") ?? req.headers.get("host")); } catch { return true; }
}
