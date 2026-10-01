// Local preview: serves the built site (proferforge/dist) and the assistant API at /api/assistant on one origin.
//   node proferforge/build.mjs with PF_ASSISTANT_URL=/api/assistant PF_ASSISTANT_DEMO=1, then:
//   node proferforge/backend/dev-server.mjs [port]
// With ANTHROPIC_API_KEY set and @anthropic-ai/sdk installed, the real model answers (claude-opus-5-5 by default).
// Otherwise a scripted DEMO brain walks through the intake so the widget, booking and dossier can be tried offline.
// Data lives in memory only.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { createHandler } from "./supabase/functions/_shared/http.ts";
import { MemoryRepo } from "./supabase/functions/_shared/repo.ts";

const DIST = new URL("../dist/", import.meta.url).pathname;
const PORT = +(process.argv[2] || process.env.PORT || 4321);
const rules = [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_time: "08:00", end_time: "16:00" })); // demo hours only
export const repo = new MemoryRepo({ rules });

async function makeLLM() {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();
      console.log("assistant: live Claude API");
      return { create: (p) => client.beta.messages.create({ ...p, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }) };
    } catch { console.log("assistant: @anthropic-ai/sdk not installed, using DEMO brain"); }
  }
  return demoLLM();
}

// ---------- DEMO brain (no AI): asks for the first missing field reported by update_dossier ----------
const Q = {
  "org.client_type": ["Pour quel type de bâtiment ?", ["Copropriété", "Coopérative", "Immeuble locatif", "Maison"]],
  "project.work_type": ["Il s’agit de peinture, de soudure, ou des deux ?", ["Peinture", "Soudure", "Les deux"]],
  "project.structures": ["Quelles structures et combien ? Par exemple : 2 escaliers de service de 3 étages et 6 balcons.", []],
  "project.condition": ["Dans quel état est le métal ?", ["Peinture écaillée", "Rouillé", "Rouille qui perce", "Bon état"]],
  "site.address_or_postal": ["Quelle est l’adresse des travaux (ou au moins le code postal) ?", []],
  "timing.urgency": ["Quand souhaitez-vous faire les travaux ?", ["Dès que possible", "D’ici 1 à 3 mois", "Cette saison", "Je planifie"]],
  "org.approval_status": ["Les travaux sont-ils déjà approuvés par le conseil ou l’assemblée ?", ["Oui, approuvés", "Conseil à venir", "Assemblée à venir"]],
  "org.is_decision_maker": ["Êtes-vous la personne qui décide pour ce projet ?", ["Oui", "Non"]],
  "contact.name": ["À quel nom dois-je ouvrir votre dossier ?", []],
  "contact.phone_or_email": ["Quel est le meilleur numéro de téléphone ou courriel pour vous joindre ?", []],
};
const has = (t, re) => re.test(t.toLowerCase());
function patchFor(field, t) {
  const phone = t.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0], email = t.match(/[^\s@]+@[^\s@]+\.[a-z]{2,}/i)?.[0];
  const postal = t.match(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/)?.[0];
  switch (field) {
    case "org.client_type": return { org: { client_type: has(t, /copro|condo|syndic/) ? "condo" : has(t, /coop/) ? "coop" : has(t, /immeuble|locatif|building/) ? "building_owner" : has(t, /maison|home/) ? "homeowner" : "other" } };
    case "project.work_type": return { project: { work_type: has(t, /deux|both/) ? "both" : has(t, /soud|répar|repar|weld/) ? "weld" : "paint" } };
    case "project.structures": {
      const s = [], num = (re) => +(t.toLowerCase().match(re)?.[1] ?? 1);
      if (has(t, /escalier.{0,12}service|service stair/)) s.push({ type: "service_stair", qty: num(/(\d+)\s*escaliers?/), storeys: num(/(\d+)\s*étages?/) });
      if (has(t, /balcon/)) s.push({ type: "balcony", qty: num(/(\d+)\s*balcons?/) });
      if (has(t, /colima|spiral/)) s.push({ type: "spiral", qty: 1 });
      if (has(t, /façade|facade/)) s.push({ type: "facade_stair", qty: 1 });
      if (has(t, /garde|rampe|railing/)) s.push({ type: "railing", qty: 1, linear_m: num(/(\d+)\s*m/) * 1 || 10 });
      if (has(t, /clôture|cloture|fence/)) s.push({ type: "fence", qty: 1, linear_m: 20 });
      return { project: { structures: s.length ? s : [{ type: "balcony", qty: 1 }], description: t } };
    }
    case "project.condition": return { project: { condition: has(t, /perc|trou|through/) ? "rust_through" : has(t, /rouill|rust/) ? "rusted" : has(t, /écaill|ecaill|flak/) ? "flaking" : has(t, /bon|good/) ? "good" : "unknown", safety_concern: has(t, /bouge|danger|branl/) } };
    case "site.address_or_postal": return { site: { address: t.slice(0, 120), postal, city: has(t, /laval/) ? "Laval" : has(t, /longueuil/) ? "Longueuil" : "Montréal" } };
    case "timing.urgency": return { timing: { urgency: has(t, /possible|vite|asap|urgent/) ? "asap" : has(t, /mois|month/) ? "1_3_months" : has(t, /saison|été|automne|season/) ? "this_season" : "planning" } };
    case "org.approval_status": return { org: { approval_status: has(t, /oui|approuv|yes/) ? "approved" : has(t, /assembl/) ? "pending_agm" : has(t, /conseil|board/) ? "pending_board" : "unknown" } };
    case "org.is_decision_maker": return { org: { is_decision_maker: has(t, /^\s*(oui|yes)/) } };
    case "contact.name": return { contact: { name: t.replace(/[,;].*$/, "").slice(0, 80), phone, email } };
    case "contact.phone_or_email": return { contact: { phone, email } };
    default: return { notes: t };
  }
}
function demoLLM() {
  let n = 0;
  const id = () => `demo_${++n}`;
  const tool = (name, input) => ({ content: [{ type: "tool_use", id: id(), name, input }], stop_reason: "tool_use" });
  const say = (text, opts = []) => ({ content: [{ type: "text", text: opts.length ? `${text}\n[[options: ${opts.join(" | ")}]]` : text }], stop_reason: "end_turn" });
  const resultOf = (m) => (m?.role === "user" && m.content[0]?.type === "tool_result" ? JSON.parse(m.content[0].content) : null);
  return {
    async create(p) {
      const msgs = p.messages, last = msgs.at(-1), r = resultOf(last);
      const prevTool = [...msgs].reverse().find((m) => m.role === "assistant" && m.content.some((b) => b.type === "tool_use"));
      const prevName = prevTool?.content.find((b) => b.type === "tool_use")?.name;
      if (!r) {
        const text = last.content.filter((b) => b.type === "text").at(-1)?.text ?? "";
        const slot = text.match(/slot_id chosen in the widget: ([^\]\s]+)/)?.[1];
        if (slot) return tool("book_visit", { slot_id: slot });
        const lastMissing = [...msgs].reverse().map(resultOf).find((x) => x?.missing)?.missing;
        const field = lastMissing ? lastMissing[0] : "project.work_type";
        return tool("update_dossier", patchFor(field, text.split("\n")[0]));
      }
      if (prevName === "update_dossier") {
        if (r.missing?.length) { const [q, o] = Q[r.missing[0]] ?? ["Pouvez-vous préciser ?", []]; return say(q, o); }
        return tool("get_available_slots", {});
      }
      if (prevName === "get_available_slots") return r.available ? say("Merci, votre dossier est complet ! Choisissez une plage pour la visite gratuite sur place :") : tool("complete_intake", { summary_for_owner: "Dossier complété par l’assistant (mode démo)." });
      if (prevName === "book_visit") return r.booked ? tool("complete_intake", { summary_for_owner: "Dossier complété et visite demandée par l’assistant (mode démo)." }) : say("Ce créneau vient d’être pris, en voici d’autres.");
      if (prevName === "complete_intake") return say("C’est noté ! L’équipe confirmera votre visite et vous enverra une soumission. Vous pouvez aussi nous envoyer des photos par le formulaire de soumission.");
      return say("Merci !");
    },
  };
}

const handle = createHandler({ repo, llm: await makeLLM(), model: process.env.ASSISTANT_MODEL || "claude-opus-5-5", effort: process.env.ASSISTANT_EFFORT || "low",
  notify: async (e) => console.log(`[notify] ${e.type}: ${e.lead.contact_name ?? "?"} ${e.lead.temperature} ${e.lead.score ?? ""}`) }, { allowedOrigins: ["*"] });

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".mp4": "video/mp4", ".webm": "video/webm", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain" };
createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith("/api/assistant")) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await handle(new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : Buffer.concat(chunks) }));
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(Buffer.from(await r.arrayBuffer()));
  }
  if (url.pathname === "/api/debug/leads") { res.writeHead(200, { "content-type": "application/json" }); const messages = Object.fromEntries([...repo.messages].map(([id, ms]) => [id, ms.filter((m) => m.display_text).map((m) => ({ role: m.role, display_text: m.display_text }))])); res.end(JSON.stringify({ leads: [...repo.leads.values()], appointments: repo.appointments, quotes: repo.quotes, messages, rate_card: await repo.getRateCard() }, null, 2)); return; }
  let p = join(DIST, decodeURIComponent(url.pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) { res.writeHead(404, { "content-type": "text/html" }); return res.end(readFileSync(join(DIST, "404.html"))); }
  res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); res.end(readFileSync(p));
}).listen(PORT, () => console.log(`Preview: http://localhost:${PORT}  (assistant API at /api/assistant, debug data at /api/debug/leads)`));
