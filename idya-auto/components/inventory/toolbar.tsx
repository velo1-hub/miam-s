"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { track } from "@/lib/analytics/track";
import { activeFilterCount } from "@/lib/vehicles/search-params";
import { SORTS, type VehicleFacets, type VehicleSort } from "@/lib/vehicles/types";
import { Filters } from "./filters";
import { useInventoryParams } from "./use-inventory-params";

export function InventoryToolbar({ facets, total }: { facets: VehicleFacets; total: number }) {
  const t = useTranslations("inventory");
  const te = useTranslations("enums");
  const tc = useTranslations("common");
  const [p, setP] = useInventoryParams();
  const [q, setQ] = useState(p.q);
  const [open, setOpen] = useState(false);
  const n = activeFilterCount(p);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    track("ai_search_submitted", { length: q.length });
    void setP({ q: q.trim(), ai: true, page: 1 });
  };
  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} role="search" className="glass-2 flex h-14 items-center gap-3 rounded-pill pl-5 pr-2">
        <Search className="size-5 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
        <label htmlFor="inventory-q" className="sr-only">{tc("search")}</label>
        <input
          id="inventory-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("aiSearchPlaceholder")}
          enterKeyHint="search"
          autoComplete="off"
          className="no-red min-w-0 flex-1 bg-transparent text-body text-text placeholder:text-text-3 outline-none"
        />
        <Button type="submit" variant="light" size="md" className="shrink-0 px-5">{tc("search")}</Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="tabular text-small text-text-2">{t("count", { count: total })}</p>
        <div className="flex items-center gap-2">
          <label htmlFor="inventory-sort" className="sr-only">{t("sortBy")}</label>
          <select
            id="inventory-sort"
            value={p.sort}
            onChange={(e) => void setP({ sort: e.target.value as VehicleSort, page: 1 })}
            className="no-red h-10 min-w-0 max-w-[52vw] rounded-pill border border-line bg-surface px-3 text-small text-text outline-none focus:border-text lg:max-w-none"
          >
            {SORTS.map((s) => <option key={s} value={s}>{te(`sort.${s}`)}</option>)}
          </select>
          <Button variant="secondary" size="md" className="lg:hidden" onClick={() => setOpen(true)} aria-expanded={open}>
            <SlidersHorizontal strokeWidth={1.5} aria-hidden />
            {n > 0 ? t("filtersCount", { count: n }) : t("filters")}
          </Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen} title={t("filters")} closeLabel={tc("close")} mode="sheet">
        <Filters facets={facets} />
        <div className="sticky bottom-0 -mx-6 mt-6 border-t border-line bg-bg/90 px-6 py-4 backdrop-blur-xl">
          <Button variant="light" size="lg" className="w-full" onClick={() => setOpen(false)}>{t("count", { count: total })}</Button>
        </div>
      </Dialog>
    </div>
  );
}
