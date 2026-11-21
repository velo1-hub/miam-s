import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SERVICES, serviceById, type ServiceId } from "@/content/services";
import { FAQ } from "@/content/faq";
import { BIZ } from "@/content/business";
import { getSlots, nextAvailableDays, isBookableDate, addMinutes, SCHEDULE, makeRef, todayISO, dayOfWeek } from "@/lib/availability";
import { getDB, type Booking, type DB } from "@/lib/db";
import { notifyBooking, notifyLead } from "@/lib/email";
import type { Locale } from "@/i18n/config";

export const MODEL = "claude-opus-5-5";
export type ChatMsg = { role: "user" | "assistant"; content: string };
/** Facts gathered during the session; replayed each turn so the model never asks twice. */
export type AssistantState = { company?: string; service?: ServiceId; sqft?: number; units?: number; frequency?: string; schedule?: string; name?: string; email?: string; phone?: string; address?: string };
export type AssistantContext = { page?: string; service?: ServiceId };
export type StatusKey = "availability" | "booking" | "lead";
export type AssistantEvent = { t: "delta"; text: string } | { t: "status"; key: StatusKey };
export type AssistantResult = { reply: string; chips: string[]; state: AssistantState; booking: Booking | null };

/** The slice of the SDK client the engine uses; tests pass a scripted fake. */
export type ModelClient = { beta: { messages: { stream: Anthropic["beta"]["messages"]["stream"] } } };

const serviceIds = SERVICES.map((s) => s.id) as [ServiceId, ...ServiceId[]];
const tools: Anthropic.Beta.BetaToolUnion[] = [
  { name: "save_details", description: "Record what the visitor has told you about their premises and themselves, so the quote team has it and you never ask twice. Call it as soon as you learn a new fact; partial input is fine.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: [], properties: { company: { type: "string" }, service: { type: "string", enum: serviceIds }, sqft: { type: "integer" }, units: { type: "integer" }, frequency: { type: "string", description: "e.g. '3 evenings a week', 'daily', 'per turnover', 'one-off'" }, schedule: { type: "string", description: "when the work should happen, e.g. 'after 6 p.m.', 'nights after close'" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, address: { type: "string" } } } },
  { name: "get_availability", description: "List open slots for the free 20-minute walkthrough (weekdays, 09:00 to 18:30). Pass a date (YYYY-MM-DD) for one day, or omit it for the next days with openings.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: [], properties: { date: { type: "string" } } } },
  { name: "book_walkthrough", description: "Confirm the free walkthrough. Only call after the visitor has explicitly confirmed the date, time slot, company, premises address, name, email and phone. Returns the reference.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["service", "date", "slot_start", "company", "name", "email", "phone", "address"], properties: { service: { type: "string", enum: serviceIds }, date: { type: "string" }, slot_start: { type: "string" }, company: { type: "string" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, address: { type: "string" }, notes: { type: "string" } } } },
  { name: "create_lead", description: "Save a callback request when the visitor cannot or does not want to pick a slot now (large portfolio, custom needs, outside the service area, prefers a call). Requires name and email or phone.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["name", "message"], properties: { name: { type: "string" }, company: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, service: { type: "string", enum: serviceIds }, message: { type: "string" } } } },
];
const STATUS_OF: Record<string, StatusKey> = { get_availability: "availability", book_walkthrough: "booking", create_lead: "lead" };

const detailsSchema = z.object({ company: z.string().optional(), service: z.enum(serviceIds).optional(), sqft: z.number().int().optional(), units: z.number().int().optional(), frequency: z.string().optional(), schedule: z.string().optional(), name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), address: z.string().optional() });
const bookSchema = z.object({ service: z.enum(serviceIds), date: z.string(), slot_start: z.string(), company: z.string().min(1), name: z.string().min(2), email: z.string().email(), phone: z.string().min(7), address: z.string().min(5), notes: z.string().optional() });
const leadSchema = z.object({ name: z.string().min(2), company: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), service: z.enum(serviceIds).optional(), message: z.string().min(1) });

const DAY = { fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] };
function catalog(locale: Locale) {
  return SERVICES.map((s) => `- ${s.id}: ${s.name[locale]} · ${s.format[locale]}`).join("\n");
}

/** Stable part of the prompt: no dates, no per-request data, so it caches across every visitor. */
function systemPrompt(locale: Locale) {
  const fr = locale === "fr";
  return `You are the assistant of ${BIZ.name}, a commercial cleaning company serving Montréal, Laval, Longueuil, Brossard and the West Island. Reply in ${fr ? "French (Québec, vouvoiement)" : "English (Canadian)"} only.

Who we serve: businesses and managers only. Offices and shops, restaurants, property managers and condo boards, short-term rental operators, contractors and developers, landlords with units between tenants. We do NOT clean private homes for individuals. If someone asks for house, condo or apartment cleaning for themselves, say in one friendly sentence that we only work with businesses and building managers, and do not offer alternatives or referrals.

Prices: we never state, estimate or hint at a price, rate, range or minimum, not even "roughly" or "it depends but usually". Every price comes in a written quote within 24 hours after a free 20-minute walkthrough. If asked for a number, say exactly that in one sentence and move on to scheduling the walkthrough.

Goal: qualify the visitor and get the free walkthrough on the calendar in as few messages as possible, four or fewer when they cooperate. Be fast, warm and concrete.

Flow: (1) identify the type of space and roughly its size and frequency, (2) call save_details with what you learned, (3) call get_availability and propose at most 3 concrete slots, (4) ask for company, contact name, email, phone and the premises address in one message, (5) read back a one-line summary and ask for an explicit yes, (6) call book_walkthrough, then give the reference and say the written quote follows within 24 hours of the visit. Never invent slots or references: always use the tools. Never claim a walkthrough exists unless book_walkthrough returned ok.

Speed rules:
- Use every detail the visitor already gave and the known context; never ask for something you already have.
- Ask at most two questions per message. Prefer offering choices over open questions.
- When the visitor is ready for a time, call get_availability in the same turn as save_details.
- Keep each reply under 70 words, plain sentences, no markdown, no headings, no bullet lists longer than 3 items.
- Quick replies: when the next step is a choice (type of space, frequency, a slot, confirmation), end your message with one final line of the exact form [[choice 1 | choice 2 | choice 3]] with 2 to 4 short options (under 30 characters each). Slot options use the form "mardi 25 nov. 11:00". Never add quick replies when you need free text (company, address, email) or after a confirmed walkthrough.

Business rules:
- The walkthrough is free, 20 minutes, weekdays only, tomorrow at the earliest. The quote is written, detailed per visit and per month, valid 30 days. Agreements are month to month, 30 days' notice, no minimum term.
- Products, equipment, consumables, insured dedicated team, photo report every visit and the 24-hour fix guarantee are included in every agreement.
- Same-day emergencies: tell them to call ${BIZ.phoneDisplay}. Phone hours ${BIZ.hours.opens}–${BIZ.hours.closes}, 7 days.
- Outside the service area, portfolios above 50 buildings, or anything you cannot handle: offer create_lead so an account manager calls back within 24 business hours.
- If the visitor asks something unrelated to commercial cleaning, answer in one sentence and steer back.

Services (ids for tools):
${catalog(locale)}

Company FAQ:
${FAQ[locale].map((f) => `Q: ${f.q} A: ${f.a}`).join("\n")}`;
}

/** Volatile part, appended as an in-conversation system message so the cached prefix survives. */
function sessionNote(locale: Locale, state: AssistantState, context: AssistantContext) {
  const today = todayISO();
  const parts = [`Today is ${DAY[locale][dayOfWeek(today)]} ${today} (America/Toronto).`];
  if (context.page) parts.push(`The visitor is currently on the page ${context.page}; infer the type of space from it when obvious.`);
  if (context.service) parts.push(`They opened the chat from the ${context.service} service page.`);
  if (Object.keys(state).length) parts.push(`Known from earlier in this session (do not ask again unless missing): ${JSON.stringify(state)}.`);
  return parts.join(" ");
}

const CHIP_RE = /\[\[([^\]]*)\]\]\s*$/;
export function splitChips(text: string): { reply: string; chips: string[] } {
  const m = text.match(CHIP_RE);
  if (!m) return { reply: text.trim(), chips: [] };
  const chips = m[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  return { reply: text.slice(0, m.index).trim(), chips };
}

export async function runAssistant(opts: { locale: Locale; history: ChatMsg[]; state: AssistantState; context?: AssistantContext; client?: ModelClient; db?: DB; onEvent?: (e: AssistantEvent) => void }): Promise<AssistantResult> {
  const { locale, history, onEvent } = opts;
  const client = opts.client ?? new Anthropic({ maxRetries: 1, timeout: 45_000 });
  const db = opts.db ?? getDB();
  const context = opts.context ?? {};
  let booking: Booking | null = null;
  const newState: AssistantState = { ...opts.state };
  if (!newState.service && context.service) newState.service = context.service;

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  messages.push({ role: "system", content: sessionNote(locale, opts.state, context) });

  async function exec(name: string, input: unknown): Promise<string> {
    switch (name) {
      case "save_details": {
        const p = detailsSchema.safeParse(input); if (!p.success) return JSON.stringify({ error: "invalid_input" });
        for (const [k, v] of Object.entries(p.data)) if (v !== undefined && v !== "") (newState as Record<string, unknown>)[k] = v;
        return JSON.stringify({ ok: true, known: newState });
      }
      case "get_availability": {
        const { date } = (input ?? {}) as { date?: string };
        if (date) { if (!isBookableDate(date)) return JSON.stringify({ date, slots: [], reason: "date_not_bookable", note: "weekdays only, from tomorrow" }); return JSON.stringify({ date, slots: (await getSlots(db, date)).filter((s) => s.remaining > 0).map((s) => s.start) }); }
        const days = await nextAvailableDays(db, 4);
        return JSON.stringify({ days: days.map((d) => ({ date: d.date, weekday: DAY[locale][dayOfWeek(d.date)], starts: d.slots.filter((s) => s.remaining > 0).map((s) => s.start) })) });
      }
      case "book_walkthrough": {
        const p = bookSchema.safeParse(input); if (!p.success) return JSON.stringify({ error: "invalid_input", issues: p.error.issues.map((i) => i.path.join(".")) });
        const b = p.data; const svc = serviceById(b.service);
        const slots = await getSlots(db, b.date); const slot = slots.find((s) => s.start === b.slot_start);
        if (!slot || slot.remaining <= 0) return JSON.stringify({ error: "slot_unavailable", alternatives: slots.filter((s) => s.remaining > 0).map((s) => s.start) });
        const notes = [`${locale === "fr" ? "Entreprise" : "Company"} : ${b.company}`, newState.sqft ? `${newState.sqft} sq ft` : "", newState.units ? `${newState.units} units` : "", newState.frequency ?? "", newState.schedule ?? "", b.notes ?? ""].filter(Boolean).join("\n");
        booking = await db.createBooking({ ref: makeRef(), locale, kind: "walkthrough", service: b.service, date: b.date, slot_start: b.slot_start, slot_end: addMinutes(b.slot_start, SCHEDULE.walkthrough.durationH * 60), name: b.name, email: b.email, phone: b.phone, address: b.address, company: b.company, notes, price_min: null, price_max: null, quote: null, status: "confirmed", lead_id: null });
        Object.assign(newState, { company: b.company, service: b.service, name: b.name, email: b.email, phone: b.phone, address: b.address });
        void notifyBooking(booking, svc.name[locale]).catch((e) => console.error("[assistant] notify", e));
        return JSON.stringify({ ok: true, ref: booking.ref, date: booking.date, slot: `${booking.slot_start}-${booking.slot_end}` });
      }
      case "create_lead": {
        const p = leadSchema.safeParse(input); if (!p.success || (!p.data.email && !p.data.phone)) return JSON.stringify({ error: "need_email_or_phone" });
        const lead = await db.createLead({ locale, type: "assistant", name: p.data.name, email: p.data.email ?? "", phone: p.data.phone ?? null, message: p.data.message, service: p.data.service ?? newState.service ?? null, segment: "commercial", source: "assistant", quote: null, meta: { ...newState, company: p.data.company ?? newState.company, history_tail: history.slice(-6) } });
        void notifyLead(lead).catch((e) => console.error("[assistant] notify", e)); return JSON.stringify({ ok: true, id: lead.id });
      }
      default: return JSON.stringify({ error: "unknown_tool" });
    }
  }

  // Everything the visitor sees this turn, across tool iterations. Chips are
  // held back from the live stream and returned separately once the turn ends.
  let visible = ""; let pending = ""; let needSep = false;
  const flush = (force: boolean) => {
    // Hold back anything that could be the start of a [[...]] chip line, so
    // the browser never sees half a chip marker.
    let cut = pending.length;
    if (!force) {
      const open = pending.indexOf("[[");
      if (open >= 0 && !pending.slice(open).includes("]]")) cut = open;
      else if (open < 0 && pending.endsWith("[")) cut = pending.length - 1;
    }
    let out = pending.slice(0, cut); pending = pending.slice(cut);
    if (!out) return;
    if (needSep) { out = "\n\n" + out; needSep = false; }
    visible += out;
    const shown = out.replace(/\[\[[^\]]*\]\]/g, "");
    if (shown) onEvent?.({ t: "delta", text: shown });
  };

  for (let i = 0; i < 6; i++) {
    const stream = client.beta.messages.stream({
      model: MODEL, max_tokens: 1500,
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: systemPrompt(locale), cache_control: { type: "ephemeral" } }],
      tools, messages,
    });
    if (i > 0 && visible) needSep = true;
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") { pending += ev.delta.text; flush(false); }
      else if (ev.type === "content_block_start" && ev.content_block.type === "tool_use") { const key = STATUS_OF[ev.content_block.name]; if (key) onEvent?.({ t: "status", key }); }
    }
    const res = await stream.finalMessage();
    const uses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (res.stop_reason === "refusal") {
      if (!visible.trim()) { const text = locale === "fr" ? "Je ne peux pas aider avec cette demande. Pour tout ce qui concerne l'entretien de vos locaux, je suis là." : "I can't help with that request. For anything about cleaning your premises, I'm here."; pending += text; }
      flush(true); break;
    }
    if (uses.length === 0 || res.stop_reason !== "tool_use") { flush(true); break; }
    // Parked text before a tool call is a progress note; show it, then keep going.
    flush(true);
    messages.push({ role: "assistant", content: res.content });
    const results = await Promise.all(uses.map(async (u): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
      let out: string; try { out = await exec(u.name, u.input); } catch (e) { out = JSON.stringify({ error: "tool_failed", detail: String((e as Error).message) }); }
      return { type: "tool_result", tool_use_id: u.id, content: out };
    }));
    messages.push({ role: "user", content: results });
  }
  const { reply, chips } = splitChips(visible);
  return { reply, chips: booking ? [] : chips, state: newState, booking };
}
