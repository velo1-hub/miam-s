"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { Link } from "@/i18n/navigation";
import type { VehicleCardData } from "@/lib/vehicles/card";
import { PER_PAGE, serializeInventoryParams, type InventoryParams } from "@/lib/vehicles/search-params";

interface Props {
  initial: VehicleCardData[];
  total: number;
  params: InventoryParams;
}

/** Results grid — 3 / 2 / 1 columns, « Charger plus » plus crawlable numbered links (brief §7). */
export function InventoryResults({ initial, total, params }: Props) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(params.page);
  const [loading, setLoading] = useState(false);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hasMore = page < pages;

  const loadMore = async () => {
    setLoading(true);
    try {
      const qs = serializeInventoryParams({ ...params, page: page + 1 });
      const res = await fetch(`/api/inventory${qs}`);
      const json = (await res.json()) as { items: VehicleCardData[] };
      setItems((prev) => [...prev, ...json.items]);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="sr-only">{t("resultsHeading")}</h2>
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((v, i) => (
          <li key={v.id}>
            <VehicleCard vehicle={v} priority={i < 3} />
          </li>
        ))}
        {loading && Array.from({ length: 3 }).map((_, i) => <li key={`s-${i}`}><Skeleton className="aspect-[4/5] rounded-card" /></li>)}
      </ul>
      <div className="mt-10 flex flex-col items-center gap-6">
        <p className="tabular text-small text-text-3">{t("showing", { shown: items.length, total })}</p>
        {hasMore && (
          <Button variant="light" size="lg" onClick={loadMore} disabled={loading}>
            {loading ? tc("loading") : t("loadMore")}
          </Button>
        )}
        {pages > 1 && (
          <nav aria-label={t("pagination")} className="flex flex-wrap items-center justify-center gap-1.5">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={{ pathname: "/inventory", query: Object.fromEntries(new URLSearchParams(serializeInventoryParams({ ...params, page: n }).slice(1))) }}
                aria-current={n === params.page ? "page" : undefined}
                className={`inline-flex size-10 items-center justify-center rounded-pill text-small tabular ${n === params.page ? "bg-text text-bg" : "text-text-2 hover:bg-white/8 hover:text-text"}`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
