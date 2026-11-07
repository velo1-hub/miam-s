"use client";

import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useLeadDialog } from "@/components/forms/lead-dialog-context";
import { useInventoryParams } from "./use-inventory-params";

/** Empty state — brief §7: reset + « M'avertir quand un véhicule correspondant arrive » (inventory alert lead). */
export function EmptyState() {
  const t = useTranslations("inventory");
  const [p, setP] = useInventoryParams();
  const { openLead } = useLeadDialog();
  return (
    <div className="glass-lite flex flex-col items-center gap-5 rounded-card px-6 py-16 text-center">
      <SearchX className="size-8 text-titanium" strokeWidth={1.5} aria-hidden />
      <div>
        <h2 className="text-h3">{t("emptyTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-small text-text-2">{t("emptyBody")}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" size="md" onClick={() => setP(null)}>{t("emptyReset")}</Button>
        <Button variant="light" size="md" onClick={() => openLead("inventory_alert", { filters: JSON.stringify(p) })}>{t("emptyAlert")}</Button>
      </div>
    </div>
  );
}
