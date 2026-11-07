"use client";

import type { UIMessage } from "ai";
import { Phone } from "lucide-react";
import { track } from "@/lib/analytics/track";
import type { FinancingDisclosure } from "@/lib/finance/disclosure";
import type { VehicleCardData } from "@/lib/vehicles/card";
import { BookingConfirmCard, CompareMini, DealerCard, LeadConfirmCard, PaymentBlock, SlotPicker, VehicleMiniCards } from "./cards";

/** Light markdown: **bold**, bullet lists, line breaks. No raw HTML. */
export function LightMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      nodes.push(<ul key={`ul-${nodes.length}`} className="my-1 list-disc pl-4">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
      list = [];
    }
  };
  lines.forEach((line, i) => {
    const m = /^\s*[-•*]\s+(.*)$/.exec(line);
    if (m) list.push(m[1]);
    else {
      flush();
      if (line.trim()) nodes.push(<p key={`p-${i}`} className="my-1 first:mt-0 last:mb-0">{inline(line)}</p>);
    }
  });
  flush();
  return <>{nodes}</>;
}

function inline(s: string): React.ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((seg, i) => (seg.startsWith("**") && seg.endsWith("**") ? <strong key={i}>{seg.slice(2, -2)}</strong> : <span key={i}>{seg}</span>));
}

type ToolPart = { type: string; state?: string; output?: unknown; toolName?: string };

/** Renders text parts and tool outputs as rich cards (brief §27.1). Unknown tools render nothing. */
export function MessageParts({ message, onPickSlot }: { message: UIMessage; onPickSlot: (label: string) => void }) {
  return (
    <>
      {message.parts.map((part, i) => {
        if (part.type === "text") return <LightMarkdown key={i} text={part.text} />;
        if (!part.type.startsWith("tool-")) return null;
        const tp = part as ToolPart;
        if (tp.state !== "output-available" || tp.output === undefined) return null;
        const name = part.type.slice(5);
        track("assistant_tool_used", { tool: name });
        const out = tp.output as Record<string, unknown>;
        switch (name) {
          case "search_inventory":
            return <VehicleMiniCards key={i} cards={(out.cards as VehicleCardData[]) ?? []} />;
          case "get_vehicle":
            return out.card ? <VehicleMiniCards key={i} cards={[out.card as VehicleCardData]} /> : null;
          case "compare_vehicles":
            return <CompareMini key={i} cards={(out.cards as VehicleCardData[]) ?? []} />;
          case "estimate_payment":
            return <PaymentBlock key={i} d={out.disclosure as FinancingDisclosure} disclaimer={String(out.disclaimer ?? "")} />;
          case "get_dealer_info":
            return <DealerCard key={i} info={out as unknown as Parameters<typeof DealerCard>[0]["info"]} />;
          case "get_available_slots":
            return <SlotPicker key={i} days={(out.days as Parameters<typeof SlotPicker>[0]["days"]) ?? []} onPick={(_s, label) => onPickSlot(label)} />;
          case "book_test_drive":
            return out.prepared ? <BookingConfirmCard key={i} booking={out.booking as Parameters<typeof BookingConfirmCard>[0]["booking"]} /> : null;
          case "create_lead":
            return out.prepared ? <LeadConfirmCard key={i} lead={out.lead as Parameters<typeof LeadConfirmCard>[0]["lead"]} /> : null;
          case "request_human": {
            const r = out as { phone: string; phoneTel: string; openNow: boolean; note: string };
            return (
              <p key={i} className="glass-lite mt-1 rounded-card-sm p-3 text-caption text-text">
                <a href={`tel:${r.phoneTel}`} className="inline-flex items-center gap-1.5 font-semibold hover:underline"><Phone className="size-3.5" strokeWidth={1.5} aria-hidden />{r.phone}</a>
                {!r.openNow && <span className="block text-text-2">{r.note}</span>}
              </p>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
