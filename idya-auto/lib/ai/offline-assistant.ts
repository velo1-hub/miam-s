import "server-only";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { ChatStore } from "./chat-store";
import { parseSearchWithRules } from "./search-parse";
import type { AssistantContext } from "./prompts/assistant";
import type { AssistantTools } from "./tools";
import type { Settings } from "@/lib/settings/types";

interface Args {
  text: string | null;
  lastText?: string;
  tools?: AssistantTools;
  ctx?: AssistantContext;
  settings?: Settings;
  sessionId: string;
  store: ChatStore;
}

type ToolName = keyof AssistantTools;

/**
 * Deterministic fallback assistant used when no ANTHROPIC_API_KEY is configured (pitch without
 * credentials) and for guardrail replies. It runs the *same* tools and emits the same UI parts
 * (tool outputs → rich cards), so the interface behaves identically. It never invents facts.
 */
export function offlineAssistantResponse(args: Args): Response {
  const { sessionId, store } = args;
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      let finalText = args.text ?? "";
      const say = (text: string) => {
        const id = `t-${Date.now()}`;
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: text });
        writer.write({ type: "text-end", id });
        finalText = text;
      };
      const callTool = async <N extends ToolName>(name: N, input: Parameters<NonNullable<AssistantTools[N]["execute"]>>[0]) => {
        const t = args.tools?.[name];
        if (!t?.execute) return null;
        const toolCallId = `call-${name}-${Date.now()}`;
        writer.write({ type: "tool-input-available", toolCallId, toolName: name, input });
        // execute signature: (input, options) — options unused by our tools
        const output = await (t.execute as (i: unknown, o: unknown) => Promise<unknown>)(input, { toolCallId, messages: [] });
        writer.write({ type: "tool-output-available", toolCallId, output });
        return output;
      };

      if (args.text) {
        say(args.text);
      } else if (args.tools && args.ctx && args.settings) {
        const fr = args.ctx.locale === "fr";
        const q = (args.lastText ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        const human = /\b(humain|conseiller|personne|human|advisor|someone|quelqu ?un)/.test(q);
        const hours = /\b(heure|ouvert|ferm|adresse|telephone|appeler|hours|open|closed|address|phone|call)/.test(q);
        const payment = /\b(paiement|financ|mensualit|payment|per month|par mois|aux deux semaines)/.test(q);
        const availability = /\b(disponible|encore|toujours|available|still)/.test(q) && args.ctx.vehicle;
        const booking = /\b(essai|reserv|test drive|book)/.test(q);
        const compare = /\b(compar)/.test(q);
        if (human) {
          const r = (await callTool("request_human", { reason: args.lastText })) as { phone: string; openNow: boolean } | null;
          say(fr ? `C'est noté : un conseiller prendra le relais. Vous pouvez aussi nous appeler au ${r?.phone ?? ""}.` : `Noted: an advisor will take over. You can also call us at ${r?.phone ?? ""}.`);
        } else if (hours) {
          await callTool("get_dealer_info", { topic: "all" });
          say(fr ? "Voici nos coordonnées et nos heures. Voulez-vous réserver un essai routier ?" : "Here are our details and hours. Would you like to book a test drive?");
        } else if (availability && args.ctx.vehicle) {
          const r = (await callTool("get_vehicle", { idOrSlugOrStock: args.ctx.vehicle.id })) as { found: boolean; vehicle?: { status: string; priceCad: number; title: string } } | null;
          const v = r?.vehicle;
          say(v ? (fr ? `${v.title} est ${v.status === "available" ? "toujours disponible" : v.status === "pending" ? "réservé pour le moment" : "vendu"}. Souhaitez-vous réserver un essai routier ?` : `${v.title} is ${v.status === "available" ? "still available" : v.status === "pending" ? "reserved for now" : "sold"}. Would you like to book a test drive?`) : fr ? "Je n'ai pas trouvé ce véhicule." : "I could not find that vehicle.");
        } else if (payment && args.ctx.vehicle) {
          await callTool("estimate_payment", { priceCad: args.ctx.vehicle.priceCad, downPaymentCad: 0, tradeInCad: 0, termMonths: args.settings.finance.defaultTerm, frequency: "biweekly" });
          say(fr ? "Voici une estimation avec le taux par défaut, sans mise de fonds. Un conseiller peut préparer une proposition adaptée à votre dossier." : "Here is an estimate at the default rate with no down payment. An advisor can prepare a proposal tailored to your file.");
        } else if (booking) {
          await callTool("get_available_slots", {});
          say(fr ? "Voici les prochaines disponibilités. Choisissez un créneau et je préparerai la réservation, ou utilisez le bouton « Réserver un essai »." : "Here are the next available slots. Pick one and I will prepare the booking, or use the “Book a test drive” button.");
        } else if (compare && args.ctx.favorites.length >= 2) {
          await callTool("compare_vehicles", { ids: args.ctx.favorites.slice(0, 3) });
          say(fr ? "Voici vos favoris côte à côte. Lequel aimeriez-vous essayer ?" : "Here are your favorites side by side. Which one would you like to try?");
        } else {
          const parsed = parseSearchWithRules(args.lastText ?? "");
          const hasFilters = Object.keys(parsed.filters).length > 0;
          const residual = parsed.residual.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\b(avez|vous|quel|quels|quelle|quelles|est|ce|que|qu|il|y|vos|votre|do|you|have|any|which|what|is|there)\b/g, " ").replace(/\s+/g, " ").trim();
          const r = (await callTool("search_inventory", { q: !hasFilters && residual ? residual : undefined, bodyType: parsed.filters.bodyType, fuel: parsed.filters.fuel, drivetrain: parsed.filters.drivetrain, priceMax: parsed.filters.priceMax, kmMax: parsed.filters.kmMax, seatsMin: parsed.filters.seatsMin, features: parsed.filters.features, limit: 4 })) as { total: number } | null;
          const total = r?.total ?? 0;
          say(
            total > 0
              ? fr
                ? `J'ai trouvé ${total} véhicule${total > 1 ? "s" : ""} qui correspondent. Prix tout inclus, taxes en sus. Voulez-vous en voir un en détail ou réserver un essai ?`
                : `I found ${total} matching vehicle${total > 1 ? "s" : ""}. All-in prices, taxes extra. Want to see one in detail or book a test drive?`
              : fr
                ? "Je n'ai rien trouvé avec ces critères dans l'inventaire actuel. Un conseiller peut vous avertir dès qu'un véhicule correspondant arrive."
                : "I found nothing matching those criteria in the current inventory. An advisor can notify you as soon as a matching vehicle arrives.",
          );
        }
      }
      await store.appendMessages(sessionId, [{ role: "assistant", content: finalText, tokensIn: null, tokensOut: null }]);
    },
  });
  return createUIMessageStreamResponse({ stream });
}
