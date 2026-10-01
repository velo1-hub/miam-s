// Owner notifications by email (Resend HTTP API). Without RESEND_API_KEY the message is only logged.
import type { NotifyEvent } from "./agent.ts";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const TEMP = { hot: "🔥 Chaud", warm: "🌤️ Tiède", cold: "❄️ Froid", unscored: "Non évalué" } as Record<string, string>;

export function ownerEmail(e: NotifyEvent, dashboardUrl: string) {
  const l = e.lead, d = l.dossier;
  const who = l.contact_name || "Client";
  const where = d.site?.city || d.site?.postal || "";
  const subject = e.type === "needs_human"
    ? `${e.detail?.urgent ? "URGENT · " : ""}Rappel demandé : ${who}`
    : e.type === "visit_booked" ? `Visite demandée : ${who}${where ? ` (${where})` : ""} · ${e.detail?.label ?? ""}`
    : `${TEMP[l.temperature] ?? ""} Nouveau lead : ${who}${where ? ` (${where})` : ""}${l.score != null ? ` · ${l.score}/100` : ""}`;
  const sugg = (l.suggestions as { fr: string }[]).slice(0, 5).map((s) => `<li>${esc(s.fr)}</li>`).join("");
  const html = `<div style="font:15px/1.5 system-ui,sans-serif;color:#14151C">
<h2 style="margin:0 0 8px">${esc(subject)}</h2>
${e.detail?.reason ? `<p><strong>Motif :</strong> ${esc(e.detail.reason)}</p>` : ""}
<p>${esc(l.summary ?? "")}</p>
<p><strong>${esc(who)}</strong>${d.org?.org_name ? ` · ${esc(d.org.org_name)}` : ""}<br>
${l.phone ? `<a href="tel:${esc(l.phone)}">${esc(l.phone)}</a><br>` : ""}${l.email ? `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a><br>` : ""}
${esc([d.site?.address, d.site?.city, d.site?.postal].filter(Boolean).join(", "))}</p>
${sugg ? `<p><strong>Suggestions :</strong></p><ul>${sugg}</ul>` : ""}
<p><a href="${esc(dashboardUrl)}#lead=${esc(l.id)}">Ouvrir le dossier dans le tableau de bord</a></p></div>`;
  return { subject, html };
}

export function makeNotifier(env: { RESEND_API_KEY?: string; NOTIFY_FROM?: string; NOTIFY_TO?: string; DASHBOARD_URL?: string }) {
  return async (e: NotifyEvent) => {
    const { subject, html } = ownerEmail(e, env.DASHBOARD_URL ?? "https://proferforge.ca/admin/");
    if (!env.RESEND_API_KEY || !env.NOTIFY_TO) { console.log("[notify]", subject); return; }
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from: env.NOTIFY_FROM ?? "Assistant Pro Fer Forgé <assistant@proferforge.ca>", to: env.NOTIFY_TO.split(","), subject, html }),
      });
      if (!r.ok) console.error("notify failed", r.status, await r.text());
    } catch (err) { console.error("notify error", err); }
  };
}
