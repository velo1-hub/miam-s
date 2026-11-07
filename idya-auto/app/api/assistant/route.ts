import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { budgetExceeded, recordUsage } from "@/lib/ai/budget";
import { getChatStore } from "@/lib/ai/chat-store";
import { aiEnabled, anthropic, MODELS } from "@/lib/ai/client";
import { detectSensitiveData, LIMITS, sanitizeUserText } from "@/lib/ai/guardrails";
import { offlineAssistantResponse } from "@/lib/ai/offline-assistant";
import { assistantSystemPrompt, type AssistantContext } from "@/lib/ai/prompts/assistant";
import { assistantTools } from "@/lib/ai/tools";
import { formatHoursLabel } from "@/lib/format/date";
import { openStatus } from "@/lib/hours/status";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { getSettings } from "@/lib/settings";
import { getVehicleRepository } from "@/lib/vehicles";
import { vehicleFullTitle } from "@/lib/vehicles/types";

export const maxDuration = 60;

interface Body {
  messages: UIMessage[];
  sessionId: string;
  turnstileToken?: string;
  context: { locale: "fr" | "en"; page: string | null; vehicleId: string | null; filters: Record<string, string> | null; favorites: string[] };
}

const err = (code: string, status = 400) => NextResponse.json({ error: code }, { status });

/**
 * Assistant endpoint — brief §27.1 engineering: streamText with the Anthropic provider,
 * up to 5 tool steps, max 600 output tokens, prompt caching on the system prompt, limits
 * (30 msgs/session, 60/IP/h), Turnstile on the first message, hard daily budget, graceful failure.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return err("bad_request");
  }
  const settings = await getSettings();
  if (!settings.assistant.enabled) return err("disabled", 503);
  const sessionId = String(body.sessionId ?? "").slice(0, 64);
  if (!sessionId || !Array.isArray(body.messages)) return err("bad_request");
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!rateLimit(`assistant:${ip}`, LIMITS.messagesPerIpPerHour).ok) return err("rate_limited", 429);
  const userCount = body.messages.filter((m) => m.role === "user").length;
  if (userCount > LIMITS.messagesPerSession) return err("session_limit", 429);
  if (userCount === 1 && !(await verifyTurnstile(body.turnstileToken, ip))) return err("spam", 403);
  if (budgetExceeded()) return err("budget", 503);

  const locale = body.context?.locale === "en" ? "en" : "fr";
  const messages = body.messages.slice(-LIMITS.maxHistory).map((m) =>
    m.role === "user" ? { ...m, parts: m.parts.map((p) => (p.type === "text" ? { ...p, text: sanitizeUserText(p.text) } : p)) } : m,
  );
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastText = lastUser?.parts.filter((p) => p.type === "text").map((p) => p.text).join("\n") ?? "";
  const store = await getChatStore();
  await store.touchSession(sessionId, { locale, pageUrl: body.context?.page ?? null, vehicleId: body.context?.vehicleId ?? null });
  await store.appendMessages(sessionId, [{ role: "user", content: lastText, tokensIn: null, tokensOut: null }]);

  const vehicles = await getVehicleRepository();
  const vehicle = body.context?.vehicleId ? await vehicles.getById(body.context.vehicleId) : null;
  const status = openStatus(settings);
  const ctx: AssistantContext = {
    locale,
    page: body.context?.page ?? null,
    vehicle: vehicle ? { id: vehicle.id, title: vehicleFullTitle(vehicle), slug: vehicle.slug, stockNumber: vehicle.stockNumber, priceCad: vehicle.priceCad, status: vehicle.status } : null,
    filters: body.context?.filters ?? null,
    favorites: (body.context?.favorites ?? []).slice(0, 10),
    openNow: status.open,
    nextOpening: status.nextChange ? formatHoursLabel(status.nextChange, locale) : null,
  };
  const tools = assistantTools({ settings, locale, sessionId, vehicleId: vehicle?.id ?? null });

  // Sensitive-data guard: answer without calling the model
  const sensitive = detectSensitiveData(lastText, locale);
  if (sensitive) return offlineAssistantResponse({ text: sensitive, sessionId, store });

  // No API key (pitch without credentials): deterministic assistant over the same tools
  if (!aiEnabled()) return offlineAssistantResponse({ text: null, lastText, tools, ctx, settings, sessionId, store });

  const { stable, dynamic } = assistantSystemPrompt(settings, ctx);
  try {
    const result = streamText({
      model: anthropic()(MODELS.assistant),
      system: stable,
      messages: [
        { role: "system", content: dynamic },
        ...(await convertToModelMessages(messages)),
      ],
      tools,
      stopWhen: stepCountIs(5),
      maxOutputTokens: 600,
      providerOptions: { anthropic: { effort: "low", cacheControl: { type: "ephemeral" } } },
      onFinish: async ({ text, usage, steps }) => {
        recordUsage(MODELS.assistant, { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, cachedInputTokens: usage.inputTokenDetails?.cacheReadTokens });
        const toolNames = steps.flatMap((s) => s.toolCalls.map((c) => c.toolName));
        await store.appendMessages(sessionId, [
          ...(toolNames.length ? [{ role: "tool" as const, content: toolNames, tokensIn: null, tokensOut: null }] : []),
          { role: "assistant" as const, content: text, tokensIn: usage.inputTokens ?? null, tokensOut: usage.outputTokens ?? null },
        ]);
      },
      onError: ({ error }) => console.error("[assistant]", error),
    });
    return result.toUIMessageStreamResponse({
      onError: () => (locale === "fr" ? "Désolé, une erreur est survenue." : "Sorry, something went wrong."),
    });
  } catch (e) {
    console.error("[assistant] failed", e);
    return err("model_error", 502);
  }
}
