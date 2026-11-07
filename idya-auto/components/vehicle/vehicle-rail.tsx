"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils/cn";
import type { VehicleCardData } from "@/lib/vehicles/card";
import { VehicleCard } from "./vehicle-card";

/** Horizontal scroll-snap rail with desktop arrows — brief §6.4 */
export function VehicleRail({ vehicles, className }: { vehicles: VehicleCardData[]; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const t = useTranslations("common");
  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    const w = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * w * 2, behavior: "smooth" });
  };
  return (
    <div className={cn("relative", className)}>
      <ul
        ref={ref}
        className="hide-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] pb-2 [scroll-padding-inline:var(--gutter)]"
      >
        {vehicles.map((v) => (
          <li key={v.id} className="w-[82vw] shrink-0 snap-start sm:w-[360px] xl:w-[400px]">
            <VehicleCard vehicle={v} sizes="(min-width: 1280px) 400px, (min-width: 640px) 360px, 82vw" />
          </li>
        ))}
      </ul>
      <div className="mt-6 hidden justify-end gap-2 md:flex">
        <IconButton label={t("previous")} onClick={() => scrollBy(-1)}>
          <ChevronLeft strokeWidth={1.5} />
        </IconButton>
        <IconButton label={t("next")} onClick={() => scrollBy(1)}>
          <ChevronRight strokeWidth={1.5} />
        </IconButton>
      </div>
    </div>
  );
}
