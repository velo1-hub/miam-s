"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { Chip } from "@/components/ui/chip";
import { track } from "@/lib/analytics/track";
import { formatKm, formatPrice, type Locale } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";
import { BODY_TYPES, CONDITIONS, DRIVETRAINS, FUEL_TYPES, INVENTORY_FEATURE_FILTERS, TRANSMISSIONS, type VehicleFacets } from "@/lib/vehicles/types";
import { useInventoryParams } from "./use-inventory-params";

interface Props {
  facets: VehicleFacets;
  className?: string;
}

const stepRange = (min: number, max: number, step: number) => {
  const out: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= Math.ceil(max / step) * step; v += step) out.push(v);
  return out;
};

/** Filter panel — brief §7. Desktop: sticky glass-2 sidebar. Mobile: rendered inside a sheet. */
export function Filters({ facets, className }: Props) {
  const t = useTranslations("inventory.filter");
  const te = useTranslations("enums");
  const tf = useTranslations("features");
  const locale = useLocale() as Locale;
  const [p, setP] = useInventoryParams();
  const id = useId();
  const set = (patch: Parameters<typeof setP>[0]) => {
    track("filter_applied");
    return setP({ ...patch, page: 1 });
  };
  const toggleIn = <T extends string>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  const count = <T extends string>(arr: { value: T; count: number }[], v: T) => arr.find((x) => x.value === v)?.count ?? 0;

  const prices = stepRange(facets.priceRange.min, facets.priceRange.max, 500);
  const kms = stepRange(5_000, Math.max(5_000, facets.kmMax), 5_000);
  const years = stepRange(facets.yearRange.min, facets.yearRange.max, 1);
  const models = facets.model;

  const sel = "no-red h-11 w-full rounded-input border border-line bg-surface px-3 text-small text-text outline-none focus:border-text";

  return (
    <div className={cn("flex flex-col gap-7", className)}>
      <Group label={t("condition")}>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button key={c} type="button" aria-pressed={p.condition.includes(c)} onClick={() => set({ condition: toggleIn(p.condition, c) })} className="rounded-chip">
              <Chip active={p.condition.includes(c)}>
                {te(`condition.${c}`)} <span className="tabular text-text-3">{count(facets.condition, c)}</span>
              </Chip>
            </button>
          ))}
        </div>
      </Group>

      <Group label={t("make")}>
        <ul className="flex flex-col gap-1.5">
          {facets.make.map((m) => (
            <li key={m.value}>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-small text-text-2 hover:text-text">
                <span className="flex items-center gap-2.5">
                  <input type="checkbox" checked={p.make.includes(m.value)} onChange={() => set({ make: toggleIn(p.make, m.value), model: [] })} className="no-red size-4 accent-white" />
                  {m.value}
                </span>
                <span className="tabular text-text-3">{m.count}</span>
              </label>
            </li>
          ))}
        </ul>
      </Group>

      {p.make.length > 0 && models.length > 0 && (
        <Group label={t("model")}>
          <ul className="flex flex-col gap-1.5">
            {models.map((m) => (
              <li key={m.value}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-small text-text-2 hover:text-text">
                  <span className="flex items-center gap-2.5">
                    <input type="checkbox" checked={p.model.includes(m.value)} onChange={() => set({ model: toggleIn(p.model, m.value) })} className="no-red size-4 accent-white" />
                    {m.value}
                  </span>
                  <span className="tabular text-text-3">{m.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </Group>
      )}

      <Group label={t("price")}>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${id}-pmin`}>{t("priceMin")}</label>
          <select id={`${id}-pmin`} value={p.price_min ?? ""} onChange={(e) => set({ price_min: e.target.value ? Number(e.target.value) : null })} className={sel}>
            <option value="">{t("priceMin")}</option>
            {prices.map((v) => <option key={v} value={v}>{formatPrice(v, locale)}</option>)}
          </select>
          <label className="sr-only" htmlFor={`${id}-pmax`}>{t("priceMax")}</label>
          <select id={`${id}-pmax`} value={p.price_max ?? ""} onChange={(e) => set({ price_max: e.target.value ? Number(e.target.value) : null })} className={sel}>
            <option value="">{t("priceMax")}</option>
            {prices.map((v) => <option key={v} value={v}>{formatPrice(v, locale)}</option>)}
          </select>
        </div>
      </Group>

      <Group label={t("km")}>
        <label className="sr-only" htmlFor={`${id}-km`}>{t("km")}</label>
        <select id={`${id}-km`} value={p.km_max ?? ""} onChange={(e) => set({ km_max: e.target.value ? Number(e.target.value) : null })} className={sel}>
          <option value="">{t("any")}</option>
          {kms.map((v) => <option key={v} value={v}>{t("upTo", { value: formatKm(v, locale) })}</option>)}
        </select>
      </Group>

      <Group label={t("year")}>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${id}-ymin`}>{t("yearMin")}</label>
          <select id={`${id}-ymin`} value={p.year_min ?? ""} onChange={(e) => set({ year_min: e.target.value ? Number(e.target.value) : null })} className={sel}>
            <option value="">{t("yearMin")}</option>
            {years.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <label className="sr-only" htmlFor={`${id}-ymax`}>{t("yearMax")}</label>
          <select id={`${id}-ymax`} value={p.year_max ?? ""} onChange={(e) => set({ year_max: e.target.value ? Number(e.target.value) : null })} className={sel}>
            <option value="">{t("yearMax")}</option>
            {years.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </Group>

      <Group label={t("bodyType")}>
        <div className="flex flex-wrap gap-2">
          {BODY_TYPES.filter((b) => count(facets.bodyType, b) > 0 || p.body.includes(b)).map((b) => (
            <button key={b} type="button" aria-pressed={p.body.includes(b)} onClick={() => set({ body: toggleIn(p.body, b) })} className="rounded-chip">
              <Chip active={p.body.includes(b)}>
                {te(`bodyType.${b}`)} <span className="tabular text-text-3">{count(facets.bodyType, b)}</span>
              </Chip>
            </button>
          ))}
        </div>
      </Group>

      <Group label={t("drivetrain")}>
        <div className="flex flex-wrap gap-2">
          {DRIVETRAINS.map((d) => (
            <button key={d} type="button" aria-pressed={p.drive.includes(d)} onClick={() => set({ drive: toggleIn(p.drive, d) })} className="rounded-chip">
              <Chip active={p.drive.includes(d)}>{te(`drivetrain.${d}`)}</Chip>
            </button>
          ))}
        </div>
      </Group>

      <Group label={t("fuel")}>
        <div className="flex flex-wrap gap-2">
          {FUEL_TYPES.map((f) => (
            <button key={f} type="button" aria-pressed={p.fuel.includes(f)} onClick={() => set({ fuel: toggleIn(p.fuel, f) })} className="rounded-chip">
              <Chip active={p.fuel.includes(f)}>
                {te(`fuel.${f}`)} <span className="tabular text-text-3">{count(facets.fuel, f)}</span>
              </Chip>
            </button>
          ))}
        </div>
      </Group>

      <Group label={t("transmission")}>
        <div className="flex flex-wrap gap-2">
          {TRANSMISSIONS.map((x) => (
            <button key={x} type="button" aria-pressed={p.trans.includes(x)} onClick={() => set({ trans: toggleIn(p.trans, x) })} className="rounded-chip">
              <Chip active={p.trans.includes(x)}>{te(`transmission.${x}`)}</Chip>
            </button>
          ))}
        </div>
      </Group>

      {facets.color.length > 0 && (
        <Group label={t("color")}>
          <div className="flex flex-wrap gap-2">
            {facets.color.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={p.color.includes(c.value)}
                aria-label={`${c.value} (${c.count})`}
                title={c.value}
                onClick={() => set({ color: toggleIn(p.color, c.value) })}
                className={cn("size-8 rounded-pill border-2 transition-transform hover:scale-110", p.color.includes(c.value) ? "border-text" : "border-line-strong")}
                style={{ background: facets.colorHex[c.value] ?? "#555" }}
              />
            ))}
          </div>
        </Group>
      )}

      <Group label={t("seats")}>
        <label className="sr-only" htmlFor={`${id}-seats`}>{t("seats")}</label>
        <select id={`${id}-seats`} value={p.seats ?? ""} onChange={(e) => set({ seats: e.target.value ? Number(e.target.value) : null })} className={sel}>
          <option value="">{t("any")}</option>
          {[2, 4, 5, 6, 7, 8].map((v) => <option key={v} value={v}>{t("atLeast", { value: v })}</option>)}
        </select>
      </Group>

      <Group label={t("features")}>
        <ul className="flex flex-col gap-1.5">
          {INVENTORY_FEATURE_FILTERS.map((f) => (
            <li key={f}>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-small text-text-2 hover:text-text">
                <span className="flex items-center gap-2.5">
                  <input type="checkbox" checked={p.features.includes(f)} onChange={() => set({ features: toggleIn(p.features, f) })} className="no-red size-4 accent-white" />
                  {tf(f)}
                </span>
                <span className="tabular text-text-3">{count(facets.features, f)}</span>
              </label>
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-caption font-medium uppercase tracking-[0.08em] text-text-3">{label}</legend>
      {children}
    </fieldset>
  );
}
