/**
 * Questionnaire annuel du client : chaque « oui » ajoute un document à sa liste.
 * Les libellés des documents doivent rester identiques à ceux de la fonction SQL submit_questionnaire
 * (supabase/migrations/0008_pilote_fiscal_vague2.sql), qui fait foi.
 * ⚠️ Contenu fiscal général : à faire valider par le cabinet.
 */
export type QKey = "emploi" | "autonome" | "garde" | "etudes" | "reer" | "celiapp" | "achat_maison" | "vente_immeuble" | "locatif" | "placements" | "medicaux" | "dons" | "teletravail" | "demenagement" | "pension" | "etranger";

export const QUESTIONS: { key: QKey; group: "revenus" | "famille" | "logement" | "epargne" | "autres"; fr: string; en: string; doc: string; docEn: string }[] = [
  { key: "emploi", group: "revenus", fr: "Avez-vous eu un emploi salarié ?", en: "Did you have employment income?", doc: "Feuillets T4 et Relevé 1 de chaque employeur", docEn: "T4 and RL-1 slips from each employer" },
  { key: "autonome", group: "revenus", fr: "Avez-vous travaillé à votre compte ?", en: "Were you self-employed?", doc: "Revenus et dépenses de travail autonome, avec les reçus", docEn: "Self-employment income and expenses, with receipts" },
  { key: "pension", group: "revenus", fr: "Avez-vous reçu une pension ou une rente de retraite ?", en: "Did you receive a pension or retirement income?", doc: "Feuillets de pension et de retraite (T4A, T4A(P), T4A(OAS), Relevé 2)", docEn: "Pension and retirement slips (T4A, T4A(P), T4A(OAS), RL-2)" },
  { key: "placements", group: "revenus", fr: "Avez-vous des placements hors REER ou CELI ?", en: "Do you hold investments outside an RRSP or TFSA?", doc: "Feuillets de placements (T5, T3, Relevés 3 et 16)", docEn: "Investment slips (T5, T3, RL-3 and RL-16)" },
  { key: "locatif", group: "revenus", fr: "Louez-vous un logement ou un immeuble à quelqu'un ?", en: "Do you rent out a property?", doc: "Revenus et dépenses de location, avec les reçus", docEn: "Rental income and expenses, with receipts" },
  { key: "garde", group: "famille", fr: "Avez-vous payé des frais de garde d'enfants ?", en: "Did you pay childcare expenses?", doc: "Reçus de frais de garde (Relevé 24)", docEn: "Childcare receipts (RL-24)" },
  { key: "etudes", group: "famille", fr: "Vous ou un enfant avez-vous payé des frais de scolarité ?", en: "Did you or a child pay tuition fees?", doc: "Frais de scolarité (T2202 et Relevé 8)", docEn: "Tuition fees (T2202 and RL-8)" },
  { key: "medicaux", group: "famille", fr: "Avez-vous eu des frais médicaux importants ?", en: "Did you have significant medical expenses?", doc: "Reçus de frais médicaux", docEn: "Medical expense receipts" },
  { key: "achat_maison", group: "logement", fr: "Avez-vous acheté une habitation cette année ?", en: "Did you buy a home this year?", doc: "Acte d'achat et état des débours du notaire", docEn: "Deed of purchase and notary's statement of disbursements" },
  { key: "vente_immeuble", group: "logement", fr: "Avez-vous vendu un immeuble ou un terrain ?", en: "Did you sell a building or land?", doc: "Documents de la vente de l'immeuble", docEn: "Documents for the sale of the property" },
  { key: "demenagement", group: "logement", fr: "Avez-vous déménagé pour le travail ou les études ?", en: "Did you move for work or school?", doc: "Reçus de frais de déménagement", docEn: "Moving expense receipts" },
  { key: "teletravail", group: "logement", fr: "Avez-vous travaillé de la maison pour votre employeur ?", en: "Did you work from home for your employer?", doc: "Formulaires T2200 et TP-64.3 signés par l'employeur", docEn: "Forms T2200 and TP-64.3 signed by the employer" },
  { key: "reer", group: "epargne", fr: "Avez-vous cotisé à un REER ?", en: "Did you contribute to an RRSP?", doc: "Reçus de cotisations REER", docEn: "RRSP contribution receipts" },
  { key: "celiapp", group: "epargne", fr: "Avez-vous cotisé à un CELIAPP ?", en: "Did you contribute to an FHSA?", doc: "Feuillet du CELIAPP (T4FHSA)", docEn: "FHSA slip (T4FHSA)" },
  { key: "dons", group: "autres", fr: "Avez-vous fait des dons de bienfaisance ?", en: "Did you make charitable donations?", doc: "Reçus de dons de bienfaisance", docEn: "Charitable donation receipts" },
  { key: "etranger", group: "autres", fr: "Avez-vous des biens ou des revenus à l'étranger ?", en: "Do you have foreign property or income?", doc: "Relevés des biens ou des revenus à l'étranger", docEn: "Statements of foreign property or income" },
];

export const QGROUPS: Record<string, { fr: string; en: string }> = {
  revenus: { fr: "Vos revenus", en: "Your income" },
  famille: { fr: "Votre famille", en: "Your family" },
  logement: { fr: "Votre logement", en: "Your home" },
  epargne: { fr: "Votre épargne", en: "Your savings" },
  autres: { fr: "Autres situations", en: "Other situations" },
};
