import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ActiveChips } from "@/components/inventory/active-chips";
import { EmptyState } from "@/components/inventory/empty-state";
import { Filters } from "@/components/inventory/filters";
import { InventoryResults } from "@/components/inventory/results";
import { InventoryToolbar } from "@/components/inventory/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLocale } from "@/i18n/server";
import { parseSearch } from "@/lib/ai/search";
import { vehicles } from "@/lib/vehicles";
import { toCardData } from "@/lib/vehicles/card";
import { loadInventoryParams, mergeFilters, paramsToFilters, PER_PAGE, type InventoryParams } from "@/lib/vehicles/search-params";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "inventory" });
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: { canonical: locale === "fr" ? "/fr/inventaire" : "/en/inventory", languages: { "fr-CA": "/fr/inventaire", "en-CA": "/en/inventory", "x-default": "/fr/inventaire" } },
  };
}

async function Listing({ searchParams }: { searchParams: SP }) {
  const raw = loadInventoryParams(await searchParams);
  let params: InventoryParams = raw;
  let interpreted = false;
  if (raw.ai && raw.q) {
    const parsed = await parseSearch(raw.q);
    params = mergeFilters({ ...raw, q: parsed.residual }, parsed.filters);
    interpreted = Object.keys(parsed.filters).length > 0;
  }
  const res = await vehicles.list(paramsToFilters(params), params.sort, params.page, PER_PAGE);
  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <aside className="hidden lg:block">
        <div className="glass-2 sticky top-24 max-h-[calc(100svh-120px)] overflow-y-auto rounded-card p-6">
          <Filters facets={res.facets} />
        </div>
      </aside>
      <div className="flex flex-col gap-6">
        <InventoryToolbar facets={res.facets} total={res.total} />
        <ActiveChips interpreted={interpreted} />
        {res.items.length === 0 ? <EmptyState /> : <InventoryResults key={JSON.stringify(params)} initial={res.items.map(toCardData)} total={res.total} params={params} />}
      </div>
    </div>
  );
}

export default async function InventoryPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }) {
  await resolveLocale(params);
  const t = await getTranslations("inventory");
  return (
    <div className="container-content pb-24 pt-32 md:pt-40">
      <h1 className="text-h1">{t("title")}</h1>
      <div className="mt-8">
        <Suspense
          fallback={
            <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
              <Skeleton className="hidden h-[600px] rounded-card lg:block" />
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-card" />)}</div>
            </div>
          }
        >
          <Listing searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
