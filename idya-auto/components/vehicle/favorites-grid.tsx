"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { favorites } from "@/lib/favorites/store";
import { compare } from "@/lib/compare/store";
import type { VehicleCardData } from "@/lib/vehicles/card";
import { VehicleCard } from "./vehicle-card";

export function FavoritesGrid() {
  const t = useTranslations("favoritesPage");
  const ids = favorites.useList();
  const key = ids.join(",");
  const [fetched, setFetched] = useState<{ key: string; items: VehicleCardData[] } | null>(null);
  const items: VehicleCardData[] | null = !key ? [] : fetched && fetched.key === key ? fetched.items : fetched ? fetched.items.filter((v) => ids.includes(v.id)) : null;
  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/vehicles?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { items: VehicleCardData[] }) => setFetched({ key, items: j.items }))
      .catch(() => setFetched({ key, items: [] }));
    return () => ctrl.abort();
  }, [key]);

  if (items === null) return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-card" />)}</div>;
  if (items.length === 0)
    return (
      <div className="glass-lite flex flex-col items-start gap-5 rounded-card p-8">
        <p className="text-text-2">{t("empty")}</p>
        <Button asChild variant="light" size="md"><Link href="/inventory">{t("browse")}</Link></Button>
      </div>
    );
  return (
    <div>
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((v) => <li key={v.id}><VehicleCard vehicle={v} /></li>)}
      </ul>
      {items.length >= 2 && (
        <Button asChild variant="secondary" size="md" className="mt-8" onClick={() => { compare.clear(); items.slice(0, 3).forEach((v) => compare.add(v.id)); }}>
          <Link href="/compare">{t("compareSelected")}</Link>
        </Button>
      )}
    </div>
  );
}
