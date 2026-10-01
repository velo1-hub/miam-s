// The assistant turn: append-only conversation, manual tool loop, server-side validation of every tool call.
// The model client is injected (`llm.create` = Anthropic `messages.create`), so this file has no SDK import
// and runs unchanged in the Edge Function (Deno) and in Node tests.
import { canBook, canComplete, mergeDossier, missingFields, sanitizePatch, type Dossier } from "./dossier.ts";
import { areaOf, scoreLead } from "./scoring.ts";
import { availableSlots, labelSlot, type Slot } from "./slots.ts";
import { buildQuote, joinAddress } from "./quote.ts";
import { suggestActions, visitQuestions } from "./suggestions.ts";
import { buildIcs } from "./ics.ts";
import { SYSTEM_PROMPT, TOOLS } from "./prompt.ts";
import type { Lead, Repo } from "./repo.ts";

// deno-lint-ignore no-explicit-any
export type LLM = { create(params: Record<string, unknown>): Promise<any> };
export type NotifyEvent = { type: "intake_complete" | "visit_booked" | "needs_human"; lead: Lead; detail?: Record<string, unknown> };
export type Deps = { repo: Repo; llm: LLM; model: string; effort?: string; now?: () => number; notify?: (e: NotifyEvent) => Promise<void> };
export type TurnInput = { sessionId: string; text: string; lang: "fr" | "en"; page?: string; consent?: boolean; slotId?: string };
export type TurnResult = {
  reply: string; options: string[]; slots: { id: string; label: string }[];
  booked: { label: string; start: string; end: string } | null; done: boolean; handoff: boolean;
};

export const MAX_USER_TURNS = 40;
const MAX_STEPS = 8;
export class ConsentRequired extends Error {}

const FALLBACK = {
  fr: { refusal: "Je ne peux pas vous aider avec cette demande ici. Appelez-nous au (438) 815-7232, l’équipe vous répondra.", error: "Désolé, un problème technique m’empêche de continuer. Appelez-nous au (438) 815-7232 ou utilisez le formulaire de soumission.", limit: "Merci pour toutes ces informations ! Pour la suite, l’équipe vous contactera directement, ou appelez-nous au (438) 815-7232." },
  en: { refusal: "I can't help with that request here. Please call us at (438) 815-7232 and the team will answer.", error: "Sorry, a technical problem stops me from continuing. Please call (438) 815-7232 or use the quote form.", limit: "Thank you for all the details! The team will contact you directly, or call us at (438) 815-7232." },
};

export function parseOptions(text: string): { text: string; options: string[] } {
  const m = text.match(/\[\[options:\s*([^\]]+)\]\]\s*$/i);
  if (!m) return { text: text.trim(), options: [] };
  return { text: text.slice(0, m.index).trim(), options: m[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 4) };
}
const textOf = (content: unknown) =>
  Array.isArray(content) ? content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("\n\n").trim() : "";

/** Score, draft the quote, compute suggestions. Idempotent: safe to re-run whenever the dossier changes. */
export async function processLead(repo: Repo, lead: Lead, opts: { summary?: string; visitBooked?: boolean } = {}) {
  const [settings, rateCard, avail] = await Promise.all([repo.getSettings(), repo.getRateCard(), repo.getAvailability()]);
  const quote = buildQuote(lead.dossier, rateCard, settings, lead.lang);
  const s = scoreLead(lead.dossier, { estimatedSubtotal: quote.complete ? quote.subtotal : null, minimum: settings.minimum_project, visitBooked: opts.visitBooked });
  const suggestions = suggestActions(lead.dossier, s, { visitBooked: opts.visitBooked, quoteComplete: quote.complete, hasAvailability: avail.rules.length > 0 });
  const draft = quote.lines.length ? await repo.saveQuoteDraft(lead.id, lead.lang, quote) : null;
  const updated = await repo.updateLead(lead.id, {
    score: s.score, temperature: s.temperature, score_reasons: s.reasons, flags: s.flags, suggestions,
    visit_questions: visitQuestions(lead.dossier, "fr"), ...(opts.summary ? { summary: opts.summary } : {}),
    status: opts.visitBooked ? "visit_booked" : draft ? "quote_drafted" : "qualified",
  });
  await repo.addEvent(lead.id, "scored", { score: s.score, temperature: s.temperature, quote_version: draft?.version ?? null });
  return { lead: updated, score: s, quote, draft };
}

export async function runTurn(deps: Deps, input: TurnInput): Promise<TurnResult> {
  const { repo, llm } = deps;
  const now = deps.now ?? Date.now;
  const lang = input.lang;
  let lead = await repo.getLeadBySession(input.sessionId);
  if (!lead) {
    if (!input.consent) throw new ConsentRequired();
    lead = await repo.createLead({ session_id: input.sessionId, lang, source: { page: input.page ?? null }, consent_at: new Date(now()).toISOString() });
    await repo.addEvent(lead.id, "created", { page: input.page ?? null });
  }
  const result: TurnResult = { reply: "", options: [], slots: [], booked: null, done: false, handoff: false };
  if ((await repo.countUserMessages(lead.id)) >= MAX_USER_TURNS) return { ...result, reply: FALLBACK[lang].limit };

  const settings = await repo.getSettings();
  const tz = settings.timezone ?? "America/Montreal";
  const history = (await repo.listMessages(lead.id)).map((m) => ({ role: m.role, content: m.content }));
  const blocks: { type: "text"; text: string }[] = [];
  if (!history.length) {
    const today = new Intl.DateTimeFormat("fr-CA", { timeZone: tz, dateStyle: "full", timeStyle: "short" }).format(new Date(now()));
    blocks.push({ type: "text", text: `[Website context — not written by the client] Today: ${today} (Montréal). Client language: ${lang}. Page: ${(input.page ?? "/").slice(0, 120)}.` });
  }
  blocks.push({ type: "text", text: input.text + (input.slotId ? `\n[slot_id chosen in the widget: ${input.slotId}]` : "") });
  history.push({ role: "user", content: blocks });
  await repo.appendMessage(lead.id, "user", blocks, input.text);
  if (lead.lang !== lang || lead.last_message_at == null) lead = await repo.updateLead(lead.id, { lang, last_message_at: new Date(now()).toISOString() });
  else lead = await repo.updateLead(lead.id, { last_message_at: new Date(now()).toISOString() });

  const texts: string[] = [];
  let offered: Slot[] = [];
  for (let step = 0; step < MAX_STEPS; step++) {
    let res;
    try {
      res = await llm.create({
        model: deps.model, max_tokens: 4096, system: SYSTEM_PROMPT, tools: TOOLS, messages: history,
        cache_control: { type: "ephemeral" }, output_config: { effort: deps.effort ?? "low" },
      });
    } catch (err) {
      console.error("llm error", err);
      texts.push(FALLBACK[lang].error); result.handoff = true; break;
    }
    const content = Array.isArray(res.content) ? res.content : [];
    const calls = content.filter((b: any) => b.type === "tool_use");
    // An empty assistant turn (e.g. refusal before any output) is not stored: the API rejects empty content on replay.
    if (content.length) {
      history.push({ role: "assistant", content });
      const said = textOf(content);
      await repo.appendMessage(lead.id, "assistant", content, said || null);
      if (said) texts.push(said);
    }
    if (res.stop_reason === "refusal" || (res.stop_reason !== "tool_use" && calls.length)) {
      // Never leave a tool_use without its tool_result in the stored history (the next request would be rejected).
      if (calls.length) {
        const closing = calls.map((c: any) => ({ type: "tool_result", tool_use_id: c.id, content: JSON.stringify({ error: "not_executed" }), is_error: true }));
        history.push({ role: "user", content: closing });
        await repo.appendMessage(lead.id, "user", closing, null);
      }
      if (res.stop_reason === "refusal") texts.push(FALLBACK[lang].refusal); else texts.push(FALLBACK[lang].error);
      result.handoff = true; break;
    }
    if (res.stop_reason === "pause_turn") continue;
    if (res.stop_reason !== "tool_use" || !calls.length) break;

    const results = [];
    for (const call of calls) {
      let out: Record<string, unknown>;
      try { out = await execTool(call.name, call.input ?? {}); }
      catch (err) { console.error("tool error", call.name, err); out = { error: "internal_error" }; }
      results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(out), ...(out.error ? { is_error: true } : {}) });
    }
    history.push({ role: "user", content: results });
    await repo.appendMessage(lead.id, "user", results, null);
  }

  const parsed = parseOptions(texts.join("\n\n") || FALLBACK[lang].error);
  return { ...result, reply: parsed.text, options: parsed.options, slots: result.booked ? [] : offered.map((s) => ({ id: s.id, label: lang === "fr" ? s.label_fr : s.label_en })) };

  // ---------- tools (closures over this turn's lead) ----------
  async function execTool(name: string, args: any): Promise<Record<string, unknown>> {
    switch (name) {
      case "update_dossier": {
        const patch = sanitizePatch(args);
        const dossier: Dossier = mergeDossier(lead!.dossier, patch);
        lead = await repo.updateLead(lead!.id, {
          dossier, contact_name: dossier.contact?.name ?? null, phone: dossier.contact?.phone ?? null,
          email: dossier.contact?.email ?? null, client_type: dossier.org?.client_type ?? null,
        });
        const dropped = JSON.stringify(args).length > JSON.stringify(patch).length + 40;
        const area = areaOf(dossier);
        return { saved: true, missing: missingFields(dossier), can_book: canBook(dossier), can_complete: canComplete(dossier),
          service_area: { core: "inside the service area", near: "nearby South Shore: covered", ring: "outer ring: say the team will confirm travel", outside: "outside the service area: say so kindly, still take their details", unknown: "not known yet" }[area],
          ...(dropped ? { note: "Some values were not valid (e.g. phone, email or postal code format) and were not saved; ask again if needed." } : {}) };
      }
      case "get_available_slots": {
        const { rules, blackouts } = await repo.getAvailability();
        if (!rules.length) return { available: false, message: "Online booking hours are not configured. Tell the client the team will call to schedule the visit, and ask for the best time to reach them." };
        offered = availableSlots({ now: now(), rules, blackouts, booked: await repo.bookedStarts(new Date(now()).toISOString()), tz,
          visitMinutes: settings.visit_minutes, leadHours: settings.booking_lead_hours, horizonDays: settings.booking_horizon_days });
        if (!offered.length) return { available: false, message: "No free slot in the next weeks. Tell the client the team will call to schedule." };
        return { available: true, timezone: tz, slots: offered.map((s) => ({ slot_id: s.id, label: lang === "fr" ? s.label_fr : s.label_en })) };
      }
      case "book_visit": {
        if (!canBook(lead!.dossier)) return { error: "missing_info", missing: missingFields(lead!.dossier).filter((f) => f.startsWith("contact") || f.startsWith("site")) };
        if (await repo.getActiveAppointment(lead!.id)) return { error: "already_booked" };
        const { rules, blackouts } = await repo.getAvailability();
        const valid = availableSlots({ now: now(), rules, blackouts, booked: await repo.bookedStarts(new Date(now()).toISOString()), tz,
          visitMinutes: settings.visit_minutes, leadHours: settings.booking_lead_hours, horizonDays: settings.booking_horizon_days, maxSlots: 500, maxPerDay: 100 });
        const slot = valid.find((s) => s.id === String(args.slot_id));
        if (!slot) return { error: "slot_unavailable", message: "That time is no longer available. Call get_available_slots again." };
        const d = lead!.dossier;
        const address = joinAddress(d.site?.address, d.site?.city, d.site?.postal) ?? null;
        const appt = await repo.createAppointment({ lead_id: lead!.id, starts_at: slot.start, ends_at: slot.end, address });
        if (appt === "conflict") { offered = []; return { error: "slot_unavailable", message: "That time was just taken. Call get_available_slots again." }; }
        await repo.addEvent(lead!.id, "visit_booked", { starts_at: slot.start });
        const p = await processLead(repo, lead!, { visitBooked: true });
        lead = p.lead;
        const label = labelSlot(Date.parse(slot.start), tz)[lang === "fr" ? "fr" : "en"];
        result.booked = { label, start: slot.start, end: slot.end };
        offered = [];
        await deps.notify?.({ type: "visit_booked", lead: lead!, detail: { label: labelSlot(Date.parse(slot.start), tz).fr, address } });
        return { booked: true, when: label, address, note: "Tell the client the visit is requested and the team will confirm it; a calendar file is offered in the chat." };
      }
      case "complete_intake": {
        const summary = typeof args.summary_for_owner === "string" ? args.summary_for_owner.slice(0, 1500) : undefined;
        const p = await processLead(repo, lead!, { summary, visitBooked: !!(await repo.getActiveAppointment(lead!.id)) });
        lead = p.lead;
        result.done = true;
        await deps.notify?.({ type: "intake_complete", lead: lead!, detail: { quote_lines: p.quote.lines.length, quote_complete: p.quote.complete } });
        await repo.updateLead(lead!.id, { owner_notified_at: new Date(now()).toISOString() });
        return { done: true, response_time: lang === "fr" ? settings.response_time_text_fr : settings.response_time_text_en,
          note: "Thank the client, say the team will follow up within the response time, and remind them they can send photos through the quote form or by email." };
      }
      case "request_human": {
        lead = await repo.updateLead(lead!.id, { needs_human: true });
        await repo.addEvent(lead!.id, "needs_human", { reason: String(args.reason ?? "").slice(0, 300), urgent: !!args.urgent });
        result.handoff = true;
        await deps.notify?.({ type: "needs_human", lead: lead!, detail: { reason: String(args.reason ?? "").slice(0, 300), urgent: !!args.urgent } });
        return { flagged: true, phone: "(438) 815-7232" };
      }
      default:
        return { error: "unknown_tool" };
    }
  }
}

export function icsForAppointment(lead: Lead, a: { id: string; starts_at: string; ends_at: string; address: string | null }) {
  const fr = lead.lang === "fr";
  return buildIcs({
    uid: a.id, start: a.starts_at, end: a.ends_at, location: a.address ?? undefined,
    summary: fr ? "Visite Pro Fer Forgé (soumission gratuite)" : "Pro Fer Forgé visit (free quote)",
    description: fr ? "Visite demandée : l’équipe vous confirmera l’heure. (438) 815-7232" : "Visit requested: the team will confirm the time. (438) 815-7232",
  });
}
