"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Section } from "@/components/ui/section";
import { VehicleRail } from "@/components/vehicle/vehicle-rail";
import { viewHistory } from "@/lib/history/store";
import type { VehicleCardData } from "@/lib/vehicles/card";

/** « Choisis pour vous » — brief §27.3: based only on vehicles viewed in this browser. */
export function ForYouRail({ exclude = [] }: { exclude?: string[] }) {
  const t = useTranslations("home");
  const ids = viewHistory.useList().filter((id) => !exclude.includes(id)).slice(0, 8);
  const key = ids.join(",");
  const [items, setItems] = useState<VehicleCardData[]>([]);
  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/vehicles?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { items: VehicleCardData[] }) => setItems(j.items.filter((v) => v.status !== "sold")))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [key]);
  if (items.length === 0) return null;
  return (
    <Section eyebrow={t("forYouEyebrow")} title={t("forYouHeadline")}>
      <VehicleRail vehicles={items} />
    </Section>
  );
}
