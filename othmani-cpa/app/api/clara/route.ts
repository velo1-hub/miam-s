import Anthropic from "@anthropic-ai/sdk";
import { backendOn, saveLead } from "@/lib/backend";
import { claraSystem, leadTool } from "@/lib/claraPrompt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Clara, version agent. ÉTEINTE par défaut : elle ne répond que si
 *   NEXT_PUBLIC_CLARA_AGENT=on  ET  ANTHROPIC_API_KEY  sont définis dans Vercel.
 * Sinon le site garde la Clara locale (recherche dans les pages, aucun serveur).
 */
const agentOn = () => process.env.NEXT_PUBLIC_CLARA_AGENT === "on" && Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = process.env.CLARA_MODEL || "claude-opus-5-5";

// Frein simple par adresse IP (au mieux : la mémoire d'une fonction sans serveur n'est pas partagée).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 30;
}

type Turn = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!agentOn()) return Response.json({ off: true }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  if (limited(ip)) return Response.json({ error: "rate_limited" }, { status: 429 });

  let body: { messages?: unknown; lang?: string; leadSaved?: boolean };
  try { body = await req.json(); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }
  const lang = body.lang === "en" ? "en" : "fr";
  const turns: Turn[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m): m is Turn => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() !== "")
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return Response.json({ error: "bad_request" }, { status: 400 });

  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = turns;
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: claraSystem(), cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text:
        `Langue de l'interface : ${lang === "en" ? "anglais" : "français"}.` +
        (backendOn() ? "" : " L'enregistrement des demandes n'est pas encore branché : invitez plutôt la personne à utiliser la page contact ou à téléphoner.") +
        (body.leadSaved ? " Une demande a déjà été enregistrée dans cette conversation : ne la réenregistrez pas, sauf si la personne donne de nouveaux renseignements." : ""),
    },
  ];
  let lead = false;

  try {
    for (let i = 0; i < 4; i++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system,
        tools: backendOn() ? [leadTool] : [],
        messages,
      });
      if (res.stop_reason === "refusal") break;
      const uses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (res.stop_reason !== "tool_use" || uses.length === 0) {
        const reply = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
        if (reply) return Response.json({ reply, lead });
        break;
      }
      messages.push({ role: "assistant", content: res.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const u of uses) {
        const a = (u.input ?? {}) as Record<string, unknown>;
        const s = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
        let out: string;
        let bad = false;
        if (u.name !== leadTool.name) { out = "Outil inconnu."; bad = true; }
        else if (a.accord !== true) { out = "Refusé : il faut l'accord explicite de la personne avant d'enregistrer."; bad = true; }
        else if (!s("nom") || (!s("courriel") && !s("telephone"))) { out = "Refusé : il manque le nom, ou un courriel ou un téléphone."; bad = true; }
        else {
          const r = await saveLead({ source: "clara", lang, name: s("nom"), email: s("courriel"), phone: s("telephone"), audience: s("pour"), topic: s("sujet"), message: s("resume") });
          if (r.ok) { lead = true; out = "Demande enregistrée. Confirmez à la personne que l'équipe la contactera pour convenir d'un moment. Ne donnez aucune date ni heure."; }
          else { bad = true; out = r.code === "email_invalid" ? "Le courriel semble invalide : redemandez-le." : "L'enregistrement a échoué. Invitez la personne à écrire par la page contact ou à téléphoner au cabinet."; }
        }
        results.push({ type: "tool_result", tool_use_id: u.id, content: out, is_error: bad });
      }
      messages.push({ role: "user", content: results });
    }
  } catch (e) {
    const status = e instanceof Anthropic.APIError ? e.status ?? 500 : 500;
    return Response.json({ error: "upstream" }, { status: status === 429 ? 429 : 502 });
  }
  return Response.json({ error: "no_reply" }, { status: 502 });
}
