// "What should we do next?" Rule-based next-best actions for the owner, per lead. Deterministic and explainable.
import type { Dossier } from "./dossier.ts";
import type { ScoreResult } from "./scoring.ts";
import { structureUnits } from "./scoring.ts";

export type Suggestion = { id: string; priority: 1 | 2 | 3; fr: string; en: string };

export function suggestActions(d: Dossier, s: ScoreResult, ctx: { visitBooked?: boolean; quoteComplete?: boolean; hasAvailability?: boolean } = {}): Suggestion[] {
  const out: Suggestion[] = [];
  const add = (id: string, priority: 1 | 2 | 3, fr: string, en: string) => out.push({ id, priority, fr, en });
  const f = new Set(s.flags);

  if (f.has("safety")) add("safety_call", 1, "Appeler aujourd’hui : le client signale un enjeu de sécurité. Conseiller de limiter l’usage de la structure en attendant l’inspection.", "Call today: the client reports a safety concern. Advise limiting use of the structure until inspected.");
  if (s.temperature === "hot") add("call_fast", 1, "Lead chaud : appeler dans l’heure pour confirmer la visite et garder l’avance.", "Hot lead: call within the hour to confirm the visit and keep the lead.");
  if (f.has("competing_quotes")) add("speed", 1, "Le client compare des soumissions : envoyer la soumission dans les 24 h suivant la visite.", "The client is comparing quotes: send the quote within 24 h of the visit.");
  if (!ctx.visitBooked && !f.has("outside_area")) add("book_visit", s.temperature === "cold" ? 3 : 1, ctx.hasAvailability ? "Proposer deux plages de visite par téléphone." : "Aucune disponibilité configurée : appeler pour fixer la visite, puis ajouter vos plages horaires dans le tableau de bord.", ctx.hasAvailability ? "Offer two visit slots by phone." : "No availability set: call to schedule the visit, then add your hours in the dashboard.");
  if (ctx.visitBooked) add("confirm_visit", 1, "Confirmer la visite par texto la veille et préparer la liste de questions de visite.", "Confirm the visit by text the day before and bring the visit question list.");
  if (d.org?.approval_status === "pending_agm" || d.org?.approval_status === "pending_board") add("board_timing", 2, `Demander la date de la réunion du conseil${d.org.decision_date ? ` (${d.org.decision_date})` : ""} et envoyer la soumission au moins une semaine avant.`, `Ask for the board meeting date${d.org.decision_date ? ` (${d.org.decision_date})` : ""} and send the quote at least a week before.`);
  if (d.org?.is_decision_maker === false) add("decision_maker", 2, "Obtenir le nom et le courriel du décideur (président du syndicat ou gestionnaire) pour le mettre en copie.", "Get the decision maker's name and email (board president or property manager) to copy them.");
  if (f.has("below_minimum") || f.has("may_be_below_minimum")) add("bundle", 2, "Projet possiblement sous le minimum de 3 000 $ : proposer de regrouper d’autres structures (garde-corps, clôture, autres balcons).", "Project may be under the $3,000 minimum: suggest bundling other structures (railings, fence, other balconies).");
  if (d.project?.condition === "rust_through" && d.project?.work_type === "paint") add("upsell_weld", 2, "Rouille perforante mais seulement la peinture demandée : expliquer pourquoi la soudure préventive doit précéder la peinture.", "Rust-through but only painting requested: explain why preventive welding must come before paint.");
  if (structureUnits(d) >= 6) add("phasing", 3, "Gros mandat : proposer un phasage (par façade ou par saison) pour faciliter l’approbation du budget.", "Large job: offer phasing (by façade or season) to ease budget approval.");
  if (!d.project?.photos_promised) add("photos", 3, "Demander 3 à 5 photos (vue d’ensemble, base des poteaux, marches) pour préparer la visite.", "Ask for 3–5 photos (overview, post bases, treads) to prepare the visit.");
  if (!ctx.quoteComplete) add("rate_card", 3, "Compléter la grille tarifaire pour que les brouillons de soumission soient chiffrés automatiquement.", "Complete the rate card so quote drafts are priced automatically.");
  if (s.temperature === "cold") add("nurture", 3, "Lead froid : envoyer le guide « Repeindre ou restaurer » et relancer dans 30 jours.", "Cold lead: send the 'Repaint or restore' guide and follow up in 30 days.");
  if (f.has("outside_area")) add("decline", 2, "Hors zone : répondre poliment et, si possible, référer à un partenaire.", "Outside the area: reply politely and refer to a partner if possible.");
  add("follow_up", 3, "Relances : J+2 après l’envoi de la soumission, puis J+7. Après les travaux, demander un avis Google.", "Follow-ups: day 2 after sending the quote, then day 7. After the job, ask for a Google review.");
  return out.sort((a, b) => a.priority - b.priority);
}

/** Questions to bring to the site visit, from what the online chat could not establish. */
export function visitQuestions(d: Dossier, lang: "fr" | "en"): string[] {
  const q: [string, string][] = [];
  q.push(["Mesurer les longueurs de garde-corps et compter les marches par étage.", "Measure railing lengths and count treads per storey."]);
  if (d.project?.condition !== "good") q.push(["Vérifier l’épaisseur restante du métal à la base des poteaux et aux limons.", "Check remaining metal thickness at post bases and stringers."]);
  if (!d.site?.access_notes) q.push(["Valider l’accès (ruelle, cour, hauteur) et l’espace pour l’équipement.", "Confirm access (lane, yard, height) and room for equipment."]);
  if (d.org?.approval_status !== "approved") q.push(["Comprendre le processus d’approbation et le budget disponible.", "Understand the approval process and available budget."]);
  q.push(["Confirmer la couleur et le fini souhaités.", "Confirm the desired colour and finish."]);
  return q.map((x) => (lang === "fr" ? x[0] : x[1]));
}
