import type { BodyType, Drivetrain, FeatureKey, FuelType, VehicleFilters } from "@/lib/vehicles/types";

/**
 * Deterministic natural-language parser used (a) as the always-available fallback when the model
 * call fails or exceeds 1.5 s and (b) as the baseline the model refines — brief §27.2. It handles
 * Québec expressions (« char », « pick-up », « 4 roues motrices ») and never invents a filter.
 */
export interface ParsedSearch {
  filters: VehicleFilters;
  /** Terms that could not be mapped; kept for keyword fallback */
  residual: string;
  source: "rules" | "model";
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/×/g, "x");

const BODY: [RegExp, BodyType][] = [
  [/\b(vus|suv|utilitaire|crossover|multisegment)s?\b/, "suv"],
  [/\b(berline|sedan)s?\b/, "sedan"],
  [/\b(camionnette|camion|pick[- ]?up|pickup|truck)s?\b/, "truck"],
  [/\b(coupe)s?\b/, "coupe"],
  [/\b(hatchback|hayon|a hayon|5 portes|cinq portes)\b/, "hatchback"],
  [/\b(familiale|wagon)s?\b/, "wagon"],
  [/\b(fourgonnette|minivan|mini[- ]?fourgonnette|van familiale)s?\b/, "minivan"],
  [/\b(cabriolet|decapotable|convertible)s?\b/, "convertible"],
  [/\b(fourgon|cargo van)s?\b/, "van"],
];
const FUEL: [RegExp, FuelType][] = [
  [/\b(hybride rechargeable|plug[- ]?in|phev|branchable)\b/, "plug_in_hybrid"],
  [/\b(hybride|hybrid)s?\b/, "hybrid"],
  [/\b(electrique|electric|ev|100 ?%|zero emission|ve)\b/, "electric"],
  [/\b(diesel)\b/, "diesel"],
  [/\b(essence|gasoline|gas)\b/, "gasoline"],
];
const DRIVE: [RegExp, Drivetrain][] = [
  [/\b(integrale|awd|all[- ]wheel|traction integrale|quatre roues motrices|4 roues motrices)\b/, "awd"],
  [/\b(4 ?x ?4|4wd|hors[- ]route|off[- ]?road)\b/, "4wd"],
  [/\b(propulsion|rwd|rear[- ]wheel)\b/, "rwd"],
  [/\b(traction avant|fwd|front[- ]wheel)\b/, "fwd"],
];
const FEATURES: [RegExp, FeatureKey][] = [
  [/\b(demarreur a distance|demarrage a distance|remote start)\b/, "remote_start"],
  [/\b(sieges? chauffants?|heated seats?)\b/, "heated_seats"],
  [/\b(volant chauffant|heated steering)\b/, "heated_steering"],
  [/\b(sieges? ventiles?|ventilated seats?)\b/, "ventilated_seats"],
  [/\b(toit ouvrant|toit panoramique|sunroof|moonroof)\b/, "sunroof"],
  [/\b(carplay|android auto)\b/, "carplay_android"],
  [/\b(camera de recul|backup camera|rear camera)\b/, "backup_camera"],
  [/\b(pneus? d hiver|pneus? hiver|winter tires?)\b/, "winter_tires"],
  [/\b(angles? morts?|blind[- ]spot)\b/, "blind_spot"],
  [/\b(regulateur adaptatif|adaptive cruise)\b/, "adaptive_cruise"],
  [/\b(cuir|leather)\b/, "leather"],
  [/\b(navigation|gps)\b/, "navigation"],
  [/\b(troisieme rangee|3e rangee|third row)\b/, "third_row"],
  [/\b(remorquage|attache[- ]remorque|tow(ing)?( package)?|hitch)\b/, "tow_package"],
  [/\b(hayon electrique|power tailgate|power liftgate)\b/, "power_tailgate"],
];

const money = (s: string) => Math.round(Number(s.replace(/[\s,]/g, "").replace(/k$/i, "000")));

export function parseSearchWithRules(query: string, known?: { makes: string[]; models: string[] }): ParsedSearch {
  const q = norm(query);
  const filters: VehicleFilters = {};
  let residual = q;
  const take = (re: RegExp) => {
    residual = residual.replace(re, " ");
  };

  for (const [re, v] of BODY) if (re.test(q)) { filters.bodyType = [...(filters.bodyType ?? []), v]; take(re); }
  for (const [re, v] of FUEL) if (re.test(q) && !filters.fuel?.includes(v)) { filters.fuel = [...(filters.fuel ?? []), v]; take(re); }
  for (const [re, v] of DRIVE) if (re.test(q)) { filters.drivetrain = [...(filters.drivetrain ?? []), v]; take(re); break; }
  for (const [re, v] of FEATURES) if (re.test(q)) { filters.features = [...(filters.features ?? []), v]; take(re); }
  if (/\b(neuf|neuve|neufs|new)\b/.test(q)) { filters.condition = ["new"]; take(/\b(neuf|neuve|neufs|new)\b/); }
  else if (/\b(occasion|usage|usagee|used|pre[- ]owned)\b/.test(q)) { filters.condition = ["used", "certified"]; take(/\b(occasion|usage|usagee|used|pre[- ]owned)\b/); }
  if (/\b(certifie|certified)\b/.test(q)) { filters.condition = ["certified"]; take(/\b(certifie|certified)\b/); }

  // Km first so « moins de 80 000 km » is never read as a price
  const km = q.match(/\b(?:moins de|sous|max(?:imum)?|under|below|less than)?\s*([\d][\d\s,]*k?)\s*km\b/);
  if (km) { filters.kmMax = money(km[1]); residual = residual.replace(km[0], " "); }
  const qNoKm = km ? q.replace(km[0], " ") : q;
  // Price: « sous 35 000 $ », « moins de 30k », « under $40,000 », « max 25 000 », « entre 20 000 et 30 000 »
  const between = qNoKm.match(/\b(entre|between)\s*\$?\s*([\d\s,]+k?)\s*\$?\s*(et|and|-)\s*\$?\s*([\d\s,]+k?)\s*\$?/);
  if (between) {
    filters.priceMin = money(between[2]);
    filters.priceMax = money(between[4]);
    residual = residual.replace(between[0], " ");
  } else {
    const max = qNoKm.match(/\b(sous|moins de|en dessous de|max(?:imum)?|jusqu a|under|below|less than|up to)\s*\$?\s*([\d][\d\s,]*k?)\s*\$?/);
    if (max) { filters.priceMax = money(max[2]); residual = residual.replace(max[0], " "); }
    const dollars = qNoKm.match(/\$?\s*([\d][\d\s,]*)\s*\$/);
    if (!max && dollars) { filters.priceMax = money(dollars[1]); residual = residual.replace(dollars[0], " "); }
  }
  // Seats: « 7 places », « 7 passagers », « 7-seat »
  const seats = q.match(/\b([5-9])\s*(?:places|passagers|sieges|seats?|passengers?|-seat)\b/);
  if (seats) { filters.seatsMin = Number(seats[1]); residual = residual.replace(seats[0], " "); }
  // Year: « 2020 et plus », « depuis 2021 », « 2022+ »
  const yearMin = q.match(/\b(?:depuis|a partir de|from|since)\s*(20\d\d)\b|\b(20\d\d)\s*(?:et plus|\+|or newer)/);
  if (yearMin) { filters.yearMin = Number(yearMin[1] ?? yearMin[2]); residual = residual.replace(yearMin[0], " "); }

  // Makes / models from the live inventory
  if (known) {
    for (const make of known.makes) {
      const re = new RegExp(`\\b${norm(make).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(q)) { filters.make = [...(filters.make ?? []), make]; take(re); }
    }
    for (const model of known.models) {
      const re = new RegExp(`\\b${norm(model).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(q)) { filters.model = [...(filters.model ?? []), model]; take(re); }
    }
  }

  residual = residual
    .replace(/\b(un|une|des|le|la|les|de|du|d|avec|et|a|pour|je|cherche|veux|voudrais|char|auto|voiture|vehicule|car|i|want|need|looking|for|with|the|an?)\b/g, " ")
    .replace(/[,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { filters, residual, source: "rules" };
}
