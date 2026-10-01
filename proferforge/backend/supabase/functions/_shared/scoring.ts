// Lead scoring: transparent, rule-based, explainable. The model never decides the score itself.
import type { Dossier } from "./dossier.ts";

export type Temperature = "hot" | "warm" | "cold";
export type ScoreResult = { score: number; temperature: Temperature; reasons: { points: number; fr: string; en: string }[]; flags: string[] };

// Postal-code prefixes: H = Montréal island and Laval; J3/J4 = South Shore (Longueuil, Brossard…); J5/J6/J7 = wider ring.
const AREA = { core: /^H/, near: /^J[34]/, ring: /^J[5-7]/ };

export function structureUnits(d: Dossier): number {
  return (d.project?.structures ?? []).reduce((n, s) => {
    if (s.type === "railing" || s.type === "fence") return n + Math.max(1, Math.round((s.linear_m ?? 10) / 10)); // ~10 m ≈ one unit of work
    return n + (s.qty ?? 1) * (s.type === "service_stair" ? Math.max(1, s.storeys ?? 1) : 1);
  }, 0);
}

/**
 * @param estimatedSubtotal optional subtotal from the rate card (only when the owner has set prices)
 * @param minimum the business minimum project amount (3000 $)
 */
export function scoreLead(d: Dossier, opts: { estimatedSubtotal?: number | null; minimum?: number; visitBooked?: boolean } = {}): ScoreResult {
  const reasons: ScoreResult["reasons"] = [];
  const flags: string[] = [];
  const add = (points: number, fr: string, en: string) => reasons.push({ points, fr, en });
  const minimum = opts.minimum ?? 3000;

  // Fit: target clients are condos, co-ops and building owners
  const ct = d.org?.client_type;
  if (ct === "condo" || ct === "coop") add(20, "Copropriété ou coopérative : client cible", "Condo or co-op: target client");
  else if (ct === "building_owner") add(18, "Propriétaire d’immeuble : client cible", "Building owner: target client");
  else if (ct === "homeowner") add(8, "Propriétaire résidentiel", "Homeowner");
  else if (ct === "other") add(3, "Autre type de client", "Other client type");

  // Area
  const postal = d.site?.postal?.replace(/\s/g, "") ?? "";
  const city = (d.site?.city ?? "").toLowerCase();
  if (AREA.core.test(postal) || /montr[ée]al|laval/.test(city)) add(10, "Dans la zone desservie", "Inside the service area");
  else if (AREA.near.test(postal) || /longueuil|brossard|saint-lambert/.test(city)) add(7, "Rive-Sud proche", "Nearby South Shore");
  else if (AREA.ring.test(postal)) { add(0, "Couronne : déplacement à confirmer", "Outer ring: travel to confirm"); flags.push("travel_to_confirm"); }
  else if (postal) { add(-15, "Hors zone desservie", "Outside the service area"); flags.push("outside_area"); }

  // Size
  const units = structureUnits(d);
  if (units >= 6) add(20, "Projet d’envergure (6 structures ou plus)", "Large project (6+ structures)");
  else if (units >= 3) add(15, "Projet moyen (3 à 5 structures)", "Medium project (3–5 structures)");
  else if (units === 2) add(9, "Deux structures", "Two structures");
  else if (units === 1) add(4, "Une seule structure", "Single structure");
  if (opts.estimatedSubtotal != null) {
    if (opts.estimatedSubtotal < minimum) { add(-20, "Estimation sous le minimum de 3 000 $", "Estimate below the $3,000 minimum"); flags.push("below_minimum"); }
    else add(5, "Estimation au-dessus du minimum", "Estimate above the minimum");
  } else if (units === 1 && d.project?.work_type === "paint") flags.push("may_be_below_minimum");

  // Condition / work type: rust-through and welding needs mean real, necessary work
  const cond = d.project?.condition;
  if (cond === "rust_through") add(10, "Rouille perforante : travaux nécessaires", "Rust-through: work is necessary");
  else if (cond === "rusted") add(7, "Structure rouillée", "Rusted structure");
  else if (cond === "flaking") add(4, "Peinture écaillée", "Flaking paint");
  if (d.project?.work_type === "both" || d.project?.work_type === "weld") add(5, "Soudure requise : mandat plus complet", "Welding needed: fuller scope");
  if (d.project?.safety_concern) { add(10, "Enjeu de sécurité signalé", "Safety concern reported"); flags.push("safety"); }

  // Timing
  const u = d.timing?.urgency;
  if (u === "asap") add(15, "Veut commencer dès que possible", "Wants to start as soon as possible");
  else if (u === "1_3_months") add(10, "Travaux d’ici 1 à 3 mois", "Work within 1–3 months");
  else if (u === "this_season") add(7, "Travaux cette saison", "Work this season");
  else if (u === "planning") add(2, "En planification", "Planning stage");

  // Authority & approval
  if (d.org?.is_decision_maker === true) add(10, "Interlocuteur décisionnaire", "Talking to a decision maker");
  else if (d.org?.is_decision_maker === false) add(2, "Doit consulter un décideur", "Needs to consult a decision maker");
  if (d.org?.approval_status === "approved") add(12, "Budget ou travaux déjà approuvés", "Budget or work already approved");
  else if (d.org?.approval_status === "pending_board" || d.org?.approval_status === "pending_agm") add(3, "Approbation à venir", "Approval pending");

  // Engagement & reachability
  const reachable = !!(d.contact?.phone || d.contact?.email);
  if (reachable) add(5, "Coordonnées fournies", "Contact details provided"); else flags.push("no_contact");
  if (d.project?.photos_promised) add(3, "Photos promises", "Photos promised");
  if (opts.visitBooked) add(10, "Visite réservée", "Visit booked");
  if (d.budget?.has_competing_quotes) { add(0, "Compare d’autres soumissions : répondre vite", "Comparing other quotes: respond fast"); flags.push("competing_quotes"); }

  let score = Math.max(0, Math.min(100, reasons.reduce((n, r) => n + r.points, 0)));
  let temperature: Temperature = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  if (temperature === "hot" && !reachable) temperature = "warm"; // can't be hot if we can't reach them
  if (flags.includes("outside_area")) temperature = "cold";
  return { score, temperature, reasons, flags };
}
