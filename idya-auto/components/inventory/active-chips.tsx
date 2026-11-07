"use client";

import { useLocale, useTranslations } from "next-intl";
import { Chip } from "@/components/ui/chip";
import { formatKm, formatPrice, type Locale } from "@/lib/format/number";
import { activeFilterCount } from "@/lib/vehicles/search-params";
import { useInventoryParams } from "./use-inventory-params";

interface Props {
  /** Filters that came from natural-language interpretation (shown with a hint) */
  interpreted?: boolean;
}

/** Active filter chips with × to remove and « Tout effacer » — brief §7 and §27.2. */
export function ActiveChips({ interpreted }: Props) {
  const t = useTranslations("inventory");
  const tf = useTranslations("inventory.filter");
  const te = useTranslations("enums");
  const tfeat = useTranslations("features");
  const locale = useLocale() as Locale;
  const [p, setP] = useInventoryParams();
  const n = activeFilterCount(p);
  if (n === 0) return null;
  const rm = (label: string, patch: Parameters<typeof setP>[0], key: string) => (
    <Chip key={key} onRemove={() => setP({ ...patch, page: 1 })} removeLabel={tf("removeFilter", { label })}>
      {label}
    </Chip>
  );
  const chips: React.ReactNode[] = [];
  if (p.q) chips.push(rm(`« ${p.q} »`, { q: "", ai: false }, "q"));
  p.condition.forEach((c) => chips.push(rm(te(`condition.${c}`), { condition: p.condition.filter((x) => x !== c) }, `c-${c}`)));
  p.make.forEach((m) => chips.push(rm(m, { make: p.make.filter((x) => x !== m), model: [] }, `m-${m}`)));
  p.model.forEach((m) => chips.push(rm(m, { model: p.model.filter((x) => x !== m) }, `mo-${m}`)));
  p.body.forEach((b) => chips.push(rm(te(`bodyType.${b}`), { body: p.body.filter((x) => x !== b) }, `b-${b}`)));
  p.drive.forEach((d) => chips.push(rm(te(`drivetrain.${d}`), { drive: p.drive.filter((x) => x !== d) }, `d-${d}`)));
  p.trans.forEach((x) => chips.push(rm(te(`transmission.${x}`), { trans: p.trans.filter((y) => y !== x) }, `t-${x}`)));
  p.fuel.forEach((f) => chips.push(rm(te(`fuel.${f}`), { fuel: p.fuel.filter((x) => x !== f) }, `f-${f}`)));
  p.color.forEach((c) => chips.push(rm(c, { color: p.color.filter((x) => x !== c) }, `col-${c}`)));
  p.features.forEach((f) => chips.push(rm(tfeat(f), { features: p.features.filter((x) => x !== f) }, `feat-${f}`)));
  if (p.price_min !== null) chips.push(rm(`≥ ${formatPrice(p.price_min, locale)}`, { price_min: null }, "pmin"));
  if (p.price_max !== null) chips.push(rm(`≤ ${formatPrice(p.price_max, locale)}`, { price_max: null }, "pmax"));
  if (p.km_max !== null) chips.push(rm(`≤ ${formatKm(p.km_max, locale)}`, { km_max: null }, "km"));
  if (p.year_min !== null) chips.push(rm(`≥ ${p.year_min}`, { year_min: null }, "ymin"));
  if (p.year_max !== null) chips.push(rm(`≤ ${p.year_max}`, { year_max: null }, "ymax"));
  if (p.seats !== null) chips.push(rm(tf("atLeast", { value: `${p.seats} ${locale === "fr" ? "places" : "seats"}` }), { seats: null }, "seats"));

  return (
    <div className="flex flex-col gap-2">
      {interpreted && (
        <p className="text-small text-text-2">
          {t("interpreted")} <span className="text-text-3">{t("interpretedHint")}</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {chips}
        <button type="button" onClick={() => setP(null)} className="ml-1 text-small text-text-2 underline-offset-4 hover:text-text hover:underline">
          {t("clearAll")}
        </button>
      </div>
    </div>
  );
}
