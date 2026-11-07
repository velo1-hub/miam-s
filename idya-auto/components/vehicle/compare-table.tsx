"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { compare } from "@/lib/compare/store";
import { formatKm, formatPrice, type Locale } from "@/lib/format/number";
import type { VehicleCardData } from "@/lib/vehicles/card";
import { FEATURE_KEYS, vehicleTitle, type FeatureKey } from "@/lib/vehicles/types";

interface Full extends VehicleCardData {
  features?: FeatureKey[];
}

/** Compare — up to three vehicles side by side (brief §4, §27.1 comparison table). */
export function CompareTable() {
  const t = useTranslations("comparePage");
  const te = useTranslations("enums");
  const tf = useTranslations("features");
  const ts = useTranslations("vehicle.specs");
  const locale = useLocale() as Locale;
  const ids = compare.useList();
  const [fetched, setFetched] = useState<{ key: string; items: Full[] }>({ key: "", items: [] });
  const key = ids.join(",");
  const items = fetched.key === key ? fetched.items : fetched.items.filter((v) => ids.includes(v.id));
  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/vehicles?ids=${encodeURIComponent(key)}&full=1`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { items: Full[] }) => setFetched({ key, items: j.items }))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [key]);

  if (ids.length === 0 || items.length === 0) {
    return (
      <div className="glass-lite flex flex-col items-start gap-5 rounded-card p-8">
        <p className="text-text-2">{t("empty")}</p>
        <Button asChild variant="light" size="md">
          <Link href="/inventory">{t("addMore")}</Link>
        </Button>
      </div>
    );
  }

  const allFeatures = FEATURE_KEYS.filter((k) => items.some((v) => v.features?.includes(k)));
  const rows: { label: string; render: (v: Full) => string }[] = [
    { label: t("price"), render: (v) => formatPrice(v.priceCad, locale) },
    { label: ts("year"), render: (v) => String(v.year) },
    { label: ts("km"), render: (v) => formatKm(v.odometerKm, locale) },
    { label: ts("condition"), render: (v) => te(`condition.${v.condition}`) },
    { label: ts("bodyType"), render: (v) => te(`bodyType.${v.bodyType}`) },
    { label: ts("fuel"), render: (v) => (v.fuelType ? te(`fuel.${v.fuelType}`) : "—") },
    { label: ts("drivetrain"), render: (v) => (v.drivetrain ? te(`drivetrain.${v.drivetrain}`) : "—") },
    { label: ts("transmission"), render: (v) => (v.transmission ? te(`transmission.${v.transmission}`) : "—") },
    { label: ts("seats"), render: (v) => (v.seats ? String(v.seats) : "—") },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-small">
        <thead>
          <tr>
            <th className="w-40 text-left align-bottom text-caption font-medium text-text-3" />
            {items.map((v) => (
              <th key={v.id} className="px-3 pb-4 text-left align-bottom">
                <div className="relative overflow-hidden rounded-card-sm bg-studio-bottom">
                  {v.cover && <Image src={v.cover.src} alt="" width={v.cover.width} height={v.cover.height} sizes="300px" className="aspect-[4/3] w-full object-cover" />}
                  <button type="button" onClick={() => compare.remove(v.id)} aria-label={`${t("remove")} ${vehicleTitle(v)}`} className="press absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-pill glass-1 text-text">
                    <X className="size-4" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
                <Link href={{ pathname: "/inventory/[slug]", params: { slug: v.slug } }} className="mt-3 block text-[17px] font-semibold text-text hover:underline">
                  {vehicleTitle(v)}
                </Link>
                <p className="font-normal text-text-2">{v.trim}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="border-t border-line py-2.5 pr-3 text-left font-normal text-text-2">{r.label}</th>
              {items.map((v) => (
                <td key={v.id} className="tabular border-t border-line px-3 py-2.5 text-text">{r.render(v)}</td>
              ))}
            </tr>
          ))}
          {allFeatures.length > 0 && (
            <tr>
              <th scope="row" className="border-t border-line-strong pt-5 pb-1 text-left text-caption font-medium uppercase tracking-[0.08em] text-text-3" colSpan={items.length + 1}>{t("features")}</th>
            </tr>
          )}
          {allFeatures.map((k) => (
            <tr key={k}>
              <th scope="row" className="border-t border-line py-2 pr-3 text-left font-normal text-text-2">{tf(k)}</th>
              {items.map((v) => (
                <td key={v.id} className="border-t border-line px-3 py-2 text-text">{v.features?.includes(k) ? "✓" : <span className="text-text-3">—</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {ids.length < 3 && (
        <Button asChild variant="secondary" size="md" className="mt-6">
          <Link href="/inventory">{t("addMore")}</Link>
        </Button>
      )}
    </div>
  );
}
