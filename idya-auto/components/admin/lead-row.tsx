import Link from "next/link";
import { formatDateTime } from "@/lib/format/date";
import { formatKm, formatPrice } from "@/lib/format/number";
import type { Lead, LeadAiBrief } from "@/lib/leads/types";
import { cn } from "@/lib/utils/cn";

export const LEAD_TYPE_FR: Record<Lead["type"], string> = { test_drive: "Essai routier", question: "Question", financing: "Financement", trade_in: "Échange", sell_car: "Vente directe", contact: "Contact", inventory_alert: "Alerte inventaire" };
export const LEAD_STATUS_FR: Record<Lead["status"], string> = { new: "Nouveau", contacted: "Contacté", qualified: "Qualifié", won: "Gagné", lost: "Perdu", spam: "Pourriel" };

/** For a « Vendre mon auto » lead: the offered vehicle and the owner's asking price, from the payload. */
export function sellOffer(lead: Lead): { title: string; km: string | null; price: string | null; flexibility: string | null; timeline: string | null } | null {
  if (lead.type !== "sell_car") return null;
  const p = lead.payload as Record<string, unknown>;
  const title = [p.year, p.make, p.model, p.trim].filter((x) => x !== undefined && x !== "").join(" ");
  const flex: Record<string, string> = { firm: "prix ferme", negotiable: "négociable" };
  const when: Record<string, string> = { asap: "dès que possible", month: "d'ici un mois", exploring: "s'informe" };
  return {
    title: title || "Véhicule",
    km: typeof p.km === "number" ? formatKm(p.km, "fr") : null,
    price: typeof p.askingPrice === "number" ? formatPrice(p.askingPrice, "fr") : null,
    flexibility: typeof p.flexibility === "string" ? (flex[p.flexibility] ?? p.flexibility) : null,
    timeline: typeof p.timeline === "string" ? (when[p.timeline] ?? p.timeline) : null,
  };
}

export function IntentBadge({ brief }: { brief: LeadAiBrief | null }) {
  if (!brief) return null;
  const map = { hot: ["Chaud", "text-red-text"], warm: ["Tiède", "text-warning"], cold: ["Froid", "text-text-3"] } as const;
  const [label, cls] = map[brief.intent];
  return <span className={cn("tabular text-caption font-medium", cls)} title={brief.reasons.join(" · ")}>{label} · {brief.score}</span>;
}

export function LeadRow({ lead, brief, vehicleTitle }: { lead: Lead; brief: LeadAiBrief | null; vehicleTitle: string | null }) {
  const offer = sellOffer(lead);
  return (
    <li>
      <Link href={`/admin/leads/${lead.id}`} className="grid gap-1 px-4 py-3 hover:bg-white/[0.04] md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center md:gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email || "—"}</p>
          <p className="truncate text-caption text-text-3">{brief?.summary ?? lead.message ?? ""}</p>
        </div>
        <p className="min-w-0 truncate text-small text-text-2">
          {LEAD_TYPE_FR[lead.type]}
          {offer ? ` · ${offer.title}${offer.price ? ` · ${offer.price}` : ""}` : vehicleTitle ? ` · ${vehicleTitle}` : ""}
        </p>
        <div className="flex items-center justify-between gap-3 md:contents">
          <p className="text-caption text-text-3">{formatDateTime(lead.createdAt, "fr")}</p>
          <div className="flex shrink-0 items-center gap-3">
            <IntentBadge brief={brief} />
            <span className={cn("rounded-pill border px-2 py-0.5 text-caption", lead.status === "new" ? "border-text text-text" : "border-line text-text-2")}>{LEAD_STATUS_FR[lead.status]}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
