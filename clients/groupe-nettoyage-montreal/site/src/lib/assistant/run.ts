import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SERVICES, serviceById, type ServiceId } from "@/content/services";
import { ZONES } from "@/content/zones";
import { FAQ } from "@/content/faq";
import { BIZ } from "@/content/business";
import { computeQuote, withTax, type QuoteInput } from "@/lib/pricing";
import { getSlots, nextAvailableDays, isBookableDate, addMinutes, SCHEDULE, makeRef, todayISO, dayOfWeek } from "@/lib/availability";
import { getDB, type Booking, type DB } from "@/lib/db";
import { notifyBooking, notifyLead } from "@/lib/email";
import { quoteInputSchema } from "@/lib/schema";
import type { Locale } from "@/i18n/config";

export const MODEL = "claude-opus-5-5";
export type ChatMsg = { role: "user" | "assistant"; content: string };
export type AssistantState = { quote?: QuoteInput & { zone?: string }; name?: string; email?: string; phone?: string; address?: string };
export type AssistantContext = { page?: string; quote?: QuoteInput & { zone?: string } };
export type StatusKey = "pricing" | "availability" | "booking" | "lead";
export type AssistantEvent = { t: "delta"; text: string } | { t: "status"; key: StatusKey };
export type AssistantResult = { reply: string; chips: string[]; state: AssistantState; booking: Booking | null };

/** The slice of the SDK client the engine uses; tests pass a scripted fake. */
export type ModelClient = { beta: { messages: { stream: Anthropic["beta"]["messages"]["stream"] } } };

const serviceIds = SERVICES.map((s) => s.id) as [ServiceId, ...ServiceId[]];
const tools: Anthropic.Beta.BetaToolUnion[] = [
  { name: "estimate_price", description: "Compute the price for a cleaning service from the structured details. Residential, deep, move, airbnb and small post-construction return a firm price or range; office, restaurant and property return a monthly range or 'quote' and require a free walkthrough. Call it as soon as you know the service and the size: it is cheap and instant.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["service"], properties: { service: { type: "string", enum: serviceIds }, homeType: { type: "string", enum: ["studio", "3half", "4half", "5half", "house"] }, bedrooms: { type: "integer" }, bathrooms: { type: "integer" }, floors: { type: "integer" }, sqft: { type: "integer" }, frequency: { type: "string", enum: ["once", "weekly", "biweekly", "monthly"] }, visitsPerWeek: { type: "integer" }, addons: { type: "array", items: { type: "string", enum: ["oven", "fridge", "windows", "pets", "laundry", "linens", "carpet", "balcony"] } }, zone: { type: "string", enum: ZONES.map((z) => z.id) } } } },
  { name: "get_availability", description: "List open appointment slots. kind=cleaning for a bookable cleaning, kind=walkthrough for the free 20-minute commercial visit. Pass a date (YYYY-MM-DD) for one day, or omit it for the next days with openings. Call it in the same turn as estimate_price when the user is ready to pick a time.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["kind"], properties: { kind: { type: "string", enum: ["cleaning", "walkthrough"] }, date: { type: "string" } } } },
  { name: "book_appointment", description: "Create a confirmed booking. Only call after the user has explicitly confirmed the date, time slot, service, full address, name, email and phone. Returns the reference.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["kind", "service", "date", "slot_start", "name", "email", "phone", "address"], properties: { kind: { type: "string", enum: ["cleaning", "walkthrough"] }, service: { type: "string", enum: serviceIds }, date: { type: "string" }, slot_start: { type: "string" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, address: { type: "string" }, notes: { type: "string" } } } },
  { name: "create_lead", description: "Save a callback/quote request when the user cannot or does not want to book now (e.g. property management, restaurant, out-of-area, custom needs). Requires name and email or phone.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["name", "message"], properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, service: { type: "string", enum: serviceIds }, message: { type: "string" } } } },
];
const STATUS_OF: Record<string, StatusKey> = { estimate_price: "pricing", get_availability: "availability", book_appointment: "booking", create_lead: "lead" };

const bookSchema = z.object({ kind: z.enum(["cleaning", "walkthrough"]), service: z.enum(serviceIds), date: z.string(), slot_start: z.string(), name: z.string().min(2), email: z.string().email(), phone: z.string().min(7), address: z.string().min(5), notes: z.string().optional() });
const leadSchema = z.object({ name: z.string().min(2), email: z.string().email().optional(), phone: z.string().optional(), service: z.enum(serviceIds).optional(), message: z.string().min(1) });

const DAY = { fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] };
function catalog(locale: Locale) {
  return SERVICES.map((s) => `- ${s.id}: ${s.name[locale]} · ${s.priceHint[locale]} · ${s.bookable ? "bookable online (kind=cleaning)" : "quote after free walkthrough (kind=walkthrough)"}`).join("\n");
}

/** Stable part of the prompt: no dates, no per-request data, so it caches across every visitor. */
function systemPrompt(locale: Locale) {
  const fr = locale === "fr";
  return `You are the booking assistant of ${BIZ.name}, a cleaning company serving Montréal, Laval, Longueuil, Brossard and the West Island. Reply in ${fr ? "French (Québec, vouvoiement)" : "English (Canadian)"} only.

Goal: get the visitor a price and a confirmed appointment in as few messages as possible, four or fewer when they cooperate. Be fast, warm and concrete.

Flow: (1) identify the service and the size of the space, (2) call estimate_price, (3) call get_availability and propose at most 3 concrete slots, (4) ask for name, email, phone and full address in one message, (5) read back a one-line summary and ask for an explicit yes, (6) call book_appointment, then give the reference. Never invent prices, slots or references: always use the tools. Never claim a booking exists unless book_appointment returned ok.

Speed rules:
- Use every detail the user already gave and the known context; never ask for something you already have.
- Apply sensible defaults instead of asking (4½ = 2 bedrooms 1 bathroom, biweekly is most popular, no add-ons) and state the assumption in half a sentence.
- When you have the service and size, call estimate_price and get_availability in the same turn.
- Ask at most two questions per message. Prefer offering choices over open questions.
- Keep each reply under 70 words, plain sentences, no markdown, no headings, no bullet lists longer than 3 items. Prices as "145 $" (fr) or "$145" (en).
- Quick replies: when the next step is a choice (service, home size, frequency, a slot, confirmation), end your message with one final line of the exact form [[choice 1 | choice 2 | choice 3]] with 2 to 4 short options (under 30 characters each). Slot options use the form "mardi 25 nov. 10:30". Never add quick replies when you need free text (address, name, email) or after a booking is confirmed.

Business rules:
- Residential (residential, deep, move, airbnb, postconstruction under 2,500 sq ft) get a firm price and are booked as kind=cleaning, tomorrow at the earliest.
- Office, restaurant, property management and large post-construction get a range or a quote and are booked as kind=walkthrough (free 20-minute visit, weekdays only). Mention the written quote arrives within 24 hours.
- Prices are before tax (GST 5% + QST 9.975%); products, equipment, insured dedicated team, photo report and the 24-hour fix guarantee are included.
- Same-day emergencies: tell them to call ${BIZ.phoneDisplay}. Hours ${BIZ.hours.opens}–${BIZ.hours.closes}, 7 days.
- Outside the service area or for anything you cannot handle, offer create_lead so a human calls back within 24 business hours.
- If the user asks something unrelated to cleaning services, answer in one sentence and steer back.

Services (ids for tools):
${catalog(locale)}

Company FAQ:
${FAQ[locale].map((f) => `Q: ${f.q} A: ${f.a}`).join("\n")}`;
}

/** Volatile part, appended as an in-conversation system message so the cached prefix survives. */
function sessionNote(locale: Locale, state: AssistantState, context: AssistantContext) {
  const today = todayISO();
  const parts = [`Today is ${DAY[locale][dayOfWeek(today)]} ${today} (America/Toronto).`];
  if (context.page) parts.push(`The visitor is currently on the page ${context.page}; infer the service from it when obvious.`);
  if (context.quote) parts.push(`They just computed this quote in the pricing tool, start from it: ${JSON.stringify(context.quote)}.`);
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
  if (!newState.quote && context.quote) newState.quote = context.quote;

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  messages.push({ role: "system", content: sessionNote(locale, opts.state, context) });

  async function exec(name: string, input: unknown): Promise<string> {
    switch (name) {
      case "estimate_price": {
        const p = quoteInputSchema.safeParse(input); if (!p.success) return JSON.stringify({ error: "invalid_input" });
        const zone = ZONES.find((z) => z.id === p.data.zone); const q = computeQuote({ ...p.data, travelFee: zone?.travelFee ?? 0 });
        newState.quote = p.data; return JSON.stringify({ ...q, tax_example: withTax(q.min), currency: "CAD", before_tax: true });
      }
      case "get_availability": {
        const { kind, date } = input as { kind: "cleaning" | "walkthrough"; date?: string };
        if (date) { if (!isBookableDate(date, kind)) return JSON.stringify({ date, slots: [], reason: "date_not_bookable", min_lead_days: SCHEDULE.minLeadDays }); return JSON.stringify({ date, slots: (await getSlots(db, date, kind)).filter((s) => s.remaining > 0) }); }
        const days = await nextAvailableDays(db, kind, 4);
        return JSON.stringify({ days: days.map((d) => ({ date: d.date, weekday: DAY[locale][dayOfWeek(d.date)], starts: d.slots.filter((s) => s.remaining > 0).map((s) => s.start) })) });
      }
      case "book_appointment": {
        const p = bookSchema.safeParse(input); if (!p.success) return JSON.stringify({ error: "invalid_input", issues: p.error.issues.map((i) => i.path.join(".")) });
        const b = p.data; const svc = serviceById(b.service);
        const slots = await getSlots(db, b.date, b.kind); const slot = slots.find((s) => s.start === b.slot_start);
        if (!slot || slot.remaining <= 0) return JSON.stringify({ error: "slot_unavailable", alternatives: slots.filter((s) => s.remaining > 0).map((s) => s.start) });
        const q = b.kind === "cleaning" && newState.quote?.service === b.service ? computeQuote({ ...newState.quote, travelFee: ZONES.find((z) => z.id === newState.quote?.zone)?.travelFee ?? 0 }) : null;
        booking = await db.createBooking({ ref: makeRef(), locale, kind: b.kind, service: b.service, date: b.date, slot_start: b.slot_start, slot_end: addMinutes(b.slot_start, SCHEDULE[b.kind].durationH * 60), name: b.name, email: b.email, phone: b.phone, address: b.address, notes: b.notes ?? null, price_min: q?.min ?? null, price_max: q?.max ?? null, quote: q, status: "confirmed", lead_id: null });
        Object.assign(newState, { name: b.name, email: b.email, phone: b.phone, address: b.address });
        void notifyBooking(booking, svc.name[locale]).catch((e) => console.error("[assistant] notify", e));
        return JSON.stringify({ ok: true, ref: booking.ref, date: booking.date, slot: `${booking.slot_start}-${booking.slot_end}`, price_min: booking.price_min, price_max: booking.price_max });
      }
      case "create_lead": {
        const p = leadSchema.safeParse(input); if (!p.success || (!p.data.email && !p.data.phone)) return JSON.stringify({ error: "need_email_or_phone" });
        const lead = await db.createLead({ locale, type: "assistant", name: p.data.name, email: p.data.email ?? "", phone: p.data.phone ?? null, message: p.data.message, service: p.data.service ?? null, source: "assistant", quote: newState.quote ? computeQuote(newState.quote) : null, meta: { history_tail: history.slice(-6) } });
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
      if (!visible.trim()) { const text = locale === "fr" ? "Je ne peux pas aider avec cette demande. Pour tout ce qui concerne le nettoyage, je suis là." : "I can't help with that request. For anything about cleaning, I'm here."; pending += text; }
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
