import { Calendar, Cog, Fuel, Gauge, Route, Zap } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { formatKm, type Locale } from "@/lib/format/number";
import type { Vehicle } from "@/lib/vehicles/types";

/** Key specs row — brief §8.4: Année · Kilométrage · Transmission · Moteur · Traction · Carburant. */
export async function KeySpecs({ v }: { v: Vehicle }) {
  const t = await getTranslations("vehicle.specs");
  const te = await getTranslations("enums");
  const locale = (await getLocale()) as Locale;
  const items = [
    { icon: Calendar, label: t("year"), value: String(v.year) },
    { icon: Gauge, label: t("km"), value: formatKm(v.odometerKm, locale) },
    { icon: Cog, label: t("transmission"), value: v.transmission ? te(`transmission.${v.transmission}`) : "—" },
    { icon: Zap, label: t("engine"), value: v.engine ?? "—" },
    { icon: Route, label: t("drivetrain"), value: v.drivetrain ? te(`drivetrain.${v.drivetrain}`) : "—" },
    { icon: Fuel, label: t("fuel"), value: v.fuelType ? te(`fuel.${v.fuelType}`) : "—" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map((s) => (
        <li key={s.label} className="glass-lite rounded-card-sm p-4">
          <s.icon className="mb-3 size-5 text-titanium" strokeWidth={1.5} aria-hidden />
          <p className="text-caption text-text-3">{s.label}</p>
          <p className="tabular text-small font-medium text-text">{s.value}</p>
        </li>
      ))}
    </ul>
  );
}

export async function SpecTable({ v }: { v: Vehicle }) {
  const t = await getTranslations("vehicle.specs");
  const te = await getTranslations("enums");
  const locale = (await getLocale()) as Locale;
  const rows: [string, string | null][] = [
    [t("year"), String(v.year)],
    [t("bodyType"), te(`bodyType.${v.bodyType}`)],
    [t("condition"), te(`condition.${v.condition}`)],
    [t("km"), formatKm(v.odometerKm, locale)],
    [t("engine"), v.engine],
    [t("horsepower"), v.horsepower ? t("hp", { value: v.horsepower }) : null],
    [t("range"), v.electricRangeKm ? formatKm(v.electricRangeKm, locale) : null],
    [t("transmission"), v.transmission ? te(`transmission.${v.transmission}`) : null],
    [t("drivetrain"), v.drivetrain ? te(`drivetrain.${v.drivetrain}`) : null],
    [t("fuel"), v.fuelType ? te(`fuel.${v.fuelType}`) : null],
    [t("exteriorColor"), v.exteriorColor],
    [t("interiorColor"), v.interiorColor],
    [t("doors"), v.doors ? String(v.doors) : null],
    [t("seats"), v.seats ? String(v.seats) : null],
    [t("stock"), v.stockNumber],
    [t("vin"), v.vin],
  ];
  return (
    <dl className="grid gap-x-8 gap-y-2 text-small md:grid-cols-2">
      {rows.filter(([, val]) => val).map(([k, val]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-line py-2">
          <dt className="text-text-2">{k}</dt>
          <dd className="tabular text-right text-text">{val}</dd>
        </div>
      ))}
    </dl>
  );
}
