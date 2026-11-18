import type { ServiceId } from "@/content/services";

export type Frequency = "once" | "weekly" | "biweekly" | "monthly";
export type HomeType = "studio" | "3half" | "4half" | "5half" | "house";
export type Addon = "oven" | "fridge" | "windows" | "pets" | "laundry" | "linens" | "carpet" | "balcony";

export interface QuoteInput {
  service: ServiceId;
  homeType?: HomeType;
  bedrooms?: number;      // airbnb / house
  bathrooms?: number;
  floors?: number;        // house extra floors
  sqft?: number;          // office / post-construction / restaurant
  frequency?: Frequency;  // residential / office
  visitsPerWeek?: number; // office 1-5
  addons?: Addon[];
  windows?: number;       // count for windows addon
  travelFee?: number;     // from zone
}

export interface QuoteLine { label: string; amount: number }
export interface QuoteResult {
  service: ServiceId;
  kind: "firm" | "range" | "quote";
  min: number; max: number;           // CAD before tax, per visit (or per month for office)
  unit: "visit" | "turnover" | "month" | "project";
  lines: QuoteLine[];
  durationHours?: number;
  notes: string[];
}

/** Editable defaults. In production these live in the pricing_rules table and are loaded by getRules(). */
export const DEFAULT_RULES = {
  tax: { gst: 0.05, qst: 0.09975 },
  residential: {
    base: 55, perRoom: 22, perBath: 18, perExtraFloor: 25, minimum: 95,
    rooms: { studio: 1, "3half": 2, "4half": 3, "5half": 4, house: 5 } as Record<HomeType, number>,
    baths: { studio: 1, "3half": 1, "4half": 1, "5half": 2, house: 2 } as Record<HomeType, number>,
    frequencyDiscount: { once: 0, weekly: 0.15, biweekly: 0.1, monthly: 0 } as Record<Frequency, number>,
    hoursPerRoom: 0.6,
  },
  deep: { multiplier: 2.2, minimum: 190 },
  move: { multiplier: 2.5, minimum: 240 },
  postconstruction: { perSqft: 0.45, perSqftMax: 0.7, minimum: 300, siteVisitAbove: 2500 },
  airbnb: { studio: 95, b1: 115, b2: 145, b3: 185, perExtraBed: 35, linens: 25, restockMarkup: 0.15 },
  office: { perSqftMonthMin: 0.1, perSqftMonthMax: 0.3, minimumMonth: 450, hourly: 50 },
  restaurant: { hourlyMin: 55, hourlyMax: 65 },
  addons: { oven: 35, fridge: 35, windows: 6, pets: 15, laundry: 25, linens: 25, carpet: 60, balcony: 20 } as Record<Addon, number>,
};
export type Rules = typeof DEFAULT_RULES;

const r0 = (n: number) => Math.round(n);

function residentialBase(input: QuoteInput, rules: Rules, lines: QuoteLine[]) {
  const R = rules.residential;
  const type = input.homeType ?? "4half";
  const rooms = input.bedrooms != null && type === "house" ? input.bedrooms + 2 : R.rooms[type];
  const baths = input.bathrooms ?? R.baths[type];
  let amount = R.base + rooms * R.perRoom + baths * R.perBath;
  lines.push({ label: "base", amount: R.base }, { label: `rooms:${rooms}`, amount: rooms * R.perRoom }, { label: `baths:${baths}`, amount: baths * R.perBath });
  if (type === "house" && (input.floors ?? 1) > 1) {
    const extra = ((input.floors ?? 1) - 1) * R.perExtraFloor;
    amount += extra; lines.push({ label: "extra_floors", amount: extra });
  }
  const hours = Math.max(2, rooms * R.hoursPerRoom + baths * 0.5);
  return { amount: Math.max(amount, R.minimum), hours };
}

function addons(input: QuoteInput, rules: Rules, lines: QuoteLine[]) {
  let total = 0;
  for (const a of input.addons ?? []) {
    const unit = rules.addons[a];
    const qty = a === "windows" ? Math.max(1, input.windows ?? 4) : 1;
    total += unit * qty; lines.push({ label: `addon:${a}${qty > 1 ? `x${qty}` : ""}`, amount: unit * qty });
  }
  return total;
}

export function computeQuote(input: QuoteInput, rules: Rules = DEFAULT_RULES): QuoteResult {
  const lines: QuoteLine[] = [];
  const notes: string[] = [];
  const travel = input.travelFee ?? 0;
  switch (input.service) {
    case "residential": {
      const { amount, hours } = residentialBase(input, rules, lines);
      const disc = rules.residential.frequencyDiscount[input.frequency ?? "once"];
      let total = amount * (1 - disc);
      if (disc) lines.push({ label: `frequency:${input.frequency}`, amount: -r0(amount * disc) });
      total += addons(input, rules, lines) + travel;
      if (travel) lines.push({ label: "travel", amount: travel });
      return { service: input.service, kind: "firm", min: r0(total), max: r0(total), unit: "visit", lines, durationHours: hours, notes };
    }
    case "deep":
    case "move": {
      const { amount, hours } = residentialBase(input, rules, lines);
      const cfg = rules[input.service];
      let total = Math.max(amount * cfg.multiplier, cfg.minimum);
      lines.push({ label: `multiplier:${cfg.multiplier}`, amount: r0(total - amount) });
      total += addons(input, rules, lines) + travel;
      if (travel) lines.push({ label: "travel", amount: travel });
      if (input.service === "move") notes.push("empty_home");
      return { service: input.service, kind: "firm", min: r0(total), max: r0(total), unit: "visit", lines, durationHours: hours * cfg.multiplier * 0.8, notes };
    }
    case "postconstruction": {
      const sqft = Math.max(200, input.sqft ?? 800);
      const cfg = rules.postconstruction;
      const min = Math.max(sqft * cfg.perSqft, cfg.minimum);
      const max = Math.max(sqft * cfg.perSqftMax, cfg.minimum);
      lines.push({ label: `sqft:${sqft}`, amount: r0(min) });
      if (sqft > cfg.siteVisitAbove) { notes.push("site_visit_required"); return { service: input.service, kind: "quote", min: r0(min), max: r0(max), unit: "project", lines, notes }; }
      return { service: input.service, kind: "range", min: r0(min + travel), max: r0(max + travel), unit: "project", lines, durationHours: sqft / 250, notes };
    }
    case "airbnb": {
      const b = input.bedrooms ?? 1; const cfg = rules.airbnb;
      let base = b <= 0 ? cfg.studio : b === 1 ? cfg.b1 : b === 2 ? cfg.b2 : cfg.b3 + Math.max(0, b - 3) * cfg.perExtraBed;
      lines.push({ label: `bedrooms:${b}`, amount: base });
      base += addons(input, rules, lines) + travel;
      return { service: input.service, kind: "firm", min: r0(base), max: r0(base), unit: "turnover", lines, durationHours: 1.5 + b * 0.5, notes };
    }
    case "office": {
      const sqft = Math.max(300, input.sqft ?? 2000); const v = Math.min(5, Math.max(1, input.visitsPerWeek ?? 3)); const cfg = rules.office;
      const f = (v - 1) / 4; // 0..1
      const perSqft = cfg.perSqftMonthMin + (cfg.perSqftMonthMax - cfg.perSqftMonthMin) * f;
      const month = Math.max(sqft * perSqft, cfg.minimumMonth);
      lines.push({ label: `sqft:${sqft}`, amount: r0(month) }, { label: `visits_per_week:${v}`, amount: 0 });
      notes.push("walkthrough_required");
      return { service: input.service, kind: "range", min: r0(month * 0.85), max: r0(month * 1.15), unit: "month", lines, notes };
    }
    case "restaurant": {
      const cfg = rules.restaurant; const hours = Math.max(2, (input.sqft ?? 1500) / 500);
      lines.push({ label: `hours:${hours.toFixed(1)}`, amount: r0(hours * cfg.hourlyMin) });
      notes.push("walkthrough_required");
      return { service: input.service, kind: "quote", min: r0(hours * cfg.hourlyMin), max: r0(hours * cfg.hourlyMax), unit: "visit", lines, notes };
    }
    case "property":
      notes.push("walkthrough_required");
      return { service: input.service, kind: "quote", min: 0, max: 0, unit: "month", lines, notes };
  }
}

export function withTax(amount: number, rules: Rules = DEFAULT_RULES) {
  const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
  const gst = round2(amount * rules.tax.gst), qst = round2(amount * rules.tax.qst);
  return { subtotal: amount, gst, qst, total: round2(amount + gst + qst) };
}

export const fmtCAD = (n: number, locale: "fr" | "en") =>
  new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
