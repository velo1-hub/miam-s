/** Contenu des outils interactifs (FR + EN). Aucune donnée n'est envoyée : tout reste dans le navigateur. */

export type Situation = {
  id: string;
  fr: string;
  en: string;
  docs: { fr: string; en: string }[];
};

/** Documents toujours utiles */
export const baseDocs = [
  { fr: "Votre dernier avis de cotisation (fédéral et Québec), si vous êtes un nouveau client", en: "Your latest notice of assessment (federal and Quebec), if you are a new client" },
  { fr: "Tout changement dans votre situation : adresse, état civil, compte bancaire", en: "Any change in your situation: address, marital status, bank account" },
  { fr: "Les lettres reçues de Revenu Québec ou de l'ARC pendant l'année", en: "Any letters received from Revenu Québec or the CRA during the year" },
];

export const situations: Situation[] = [
  {
    id: "employee",
    fr: "Je suis salarié",
    en: "I'm an employee",
    docs: [
      { fr: "Feuillet T4 et Relevé 1 de chaque employeur", en: "T4 slip and RL-1 from each employer" },
      { fr: "Formulaires T2200 et TP-64.3 signés par l'employeur, si vous travaillez de la maison ou avez des frais d'emploi", en: "T2200 and TP-64.3 forms signed by your employer, if you work from home or have employment expenses" },
      { fr: "Relevés d'assurance-emploi ou du RQAP (T4E, Relevé 6), s'il y a lieu", en: "Employment insurance or QPIP slips (T4E, RL-6), if any" },
    ],
  },
  {
    id: "selfEmployed",
    fr: "Je travaille à mon compte",
    en: "I'm self-employed",
    docs: [
      { fr: "Le total de vos ventes ou honoraires de l'année (factures)", en: "Total sales or fees for the year (invoices)" },
      { fr: "Vos reçus de dépenses d'entreprise, classés par catégorie", en: "Business expense receipts, sorted by category" },
      { fr: "Votre registre de kilométrage, si vous utilisez votre véhicule", en: "Your mileage log, if you use your vehicle" },
      { fr: "Vos déclarations de TPS/TVQ de l'année, si vous êtes inscrit", en: "Your GST/QST returns for the year, if registered" },
      { fr: "Les acomptes provisionnels versés pendant l'année", en: "Tax instalments paid during the year" },
    ],
  },
  {
    id: "renter",
    fr: "Je suis locataire",
    en: "I rent my home",
    docs: [{ fr: "Relevé 31 remis par votre propriétaire", en: "RL-31 slip from your landlord" }],
  },
  {
    id: "landlord",
    fr: "J'ai des revenus de location",
    en: "I have rental income",
    docs: [
      { fr: "Le total des loyers reçus, par logement", en: "Total rent received, by unit" },
      { fr: "Vos dépenses : taxes municipales et scolaires, assurances, intérêts hypothécaires, réparations, électricité", en: "Your expenses: municipal and school taxes, insurance, mortgage interest, repairs, electricity" },
      { fr: "Les factures de rénovations importantes", en: "Invoices for major renovations" },
    ],
  },
  {
    id: "parent",
    fr: "J'ai des enfants",
    en: "I have children",
    docs: [
      { fr: "Reçus de frais de garde et Relevé 24", en: "Childcare receipts and RL-24" },
      { fr: "Montants de pension alimentaire versés ou reçus, avec le jugement ou l'entente", en: "Support payments made or received, with the judgment or agreement" },
      { fr: "Relevé 8 et T2202 des enfants aux études postsecondaires", en: "RL-8 and T2202 for children in post-secondary studies" },
    ],
  },
  {
    id: "retiree",
    fr: "Je suis retraité",
    en: "I'm retired",
    docs: [
      { fr: "Feuillets de pension : T4A(P), T4A(OAS), Relevé 2, T4A", en: "Pension slips: T4A(P), T4A(OAS), RL-2, T4A" },
      { fr: "Feuillets de FERR ou de rentes (T4RIF, Relevé 2)", en: "RRIF or annuity slips (T4RIF, RL-2)" },
      { fr: "Factures de maintien à domicile, si vous avez 70 ans ou plus", en: "Home-support invoices, if you are 70 or older" },
    ],
  },
  {
    id: "investor",
    fr: "J'ai des placements",
    en: "I have investments",
    docs: [
      { fr: "Feuillets T5, Relevé 3, T3 et Relevé 16", en: "T5, RL-3, T3 and RL-16 slips" },
      { fr: "Feuillets T5008 et Relevé 18, ou le relevé de gains et pertes de votre courtier", en: "T5008 and RL-18 slips, or your broker's gains and losses statement" },
      { fr: "Reçus de cotisations REER et CELIAPP", en: "RRSP and FHSA contribution receipts" },
    ],
  },
  {
    id: "homebuyer",
    fr: "J'ai acheté une maison",
    en: "I bought a home",
    docs: [
      { fr: "L'acte d'achat ou la date de prise de possession", en: "The deed of sale or possession date" },
      { fr: "Les retraits faits du RAP ou du CELIAPP", en: "Withdrawals made from the HBP or FHSA" },
    ],
  },
  {
    id: "credits",
    fr: "Dons et frais médicaux",
    en: "Donations and medical expenses",
    docs: [
      { fr: "Reçus de dons de bienfaisance et politiques", en: "Charitable and political donation receipts" },
      { fr: "Reçus de frais médicaux et de médicaments, pour toute la famille", en: "Medical and prescription receipts, for the whole family" },
      { fr: "Montant payé pour l'assurance médicaments, si vous êtes au régime public", en: "Amount paid for prescription drug insurance, if you're on the public plan" },
    ],
  },
  {
    id: "student",
    fr: "Je suis aux études",
    en: "I'm a student",
    docs: [
      { fr: "Relevé 8 et T2202 (frais de scolarité)", en: "RL-8 and T2202 (tuition)" },
      { fr: "Relevé des intérêts payés sur un prêt étudiant", en: "Statement of interest paid on a student loan" },
    ],
  },
];

export const toolsText = {
  fr: {
    title: "Outils fiscaux gratuits : TPS/TVQ, documents | CPA",
    description: "Calculatrice TPS/TVQ, vérification du seuil de 30 000 $ et liste personnalisée des documents pour vos impôts. Gratuit, sans inscription.",
    h1: "Des outils simples pour avancer",
    intro: "Gratuits, sans inscription. Rien de ce que vous saisissez ne quitte votre appareil.",
    checklist: {
      h2: "Ma liste de documents pour les impôts",
      intro: "Cochez ce qui vous ressemble. Votre liste se construit toute seule. Imprimez-la ou gardez-la sur votre téléphone.",
      pick: "Ma situation",
      list: "Ma liste",
      base: "Pour tout le monde",
      progress: (d: number, t: number) => `${d} sur ${t} documents rassemblés`,
      print: "Imprimer",
      copy: "Copier la liste",
      copied: "Liste copiée",
      reset: "Recommencer",
      saved: "Vos coches sont gardées sur cet appareil seulement.",
      next: "Tout est prêt ? Déposez vos documents dans votre espace client.",
    },
    calc: {
      h2: "Calculatrice TPS/TVQ",
      intro: "Ajoutez ou retirez les taxes du Québec en un instant.",
      add: "Ajouter les taxes",
      remove: "Retirer les taxes",
      amountAdd: "Montant avant taxes",
      amountRemove: "Montant taxes incluses",
      before: "Avant taxes",
      gst: "TPS (5 %)",
      qst: "TVQ (9,975 %)",
      total: "Total",
      note: "TPS 5 % et TVQ 9,975 %, taux en vigueur au Québec. Les montants sont arrondis au cent.",
    },
    threshold: {
      h2: "Dois-je m'inscrire à la TPS/TVQ ?",
      intro: "Entrez vos ventes taxables des quatre derniers trimestres.",
      q: (n: number) => `Trimestre ${n}`,
      total: "Total des 4 trimestres",
      over: "Vous dépassez le seuil de 30 000 $. L'inscription à la TPS et à la TVQ est obligatoire.",
      under: (left: string) => `Vous êtes sous le seuil. Il vous reste ${left} avant l'inscription obligatoire.`,
      empty: "Entrez vos montants pour voir le résultat.",
      note: "Le calcul exact peut inclure les ventes de sociétés associées et certaines exclusions. Validez avec un CPA.",
      cta: "Parler de mes taxes avec un CPA",
    },
  },
  en: {
    title: "Free tax tools: GST/QST, documents | CPA",
    description: "GST/QST calculator, $30,000 threshold check and a personalized list of documents for your taxes. Free, no sign-up.",
    h1: "Simple tools to help you move forward",
    intro: "Free, no sign-up. Nothing you enter leaves your device.",
    checklist: {
      h2: "My tax document checklist",
      intro: "Check what applies to you. Your list builds itself. Print it or keep it on your phone.",
      pick: "My situation",
      list: "My list",
      base: "For everyone",
      progress: (d: number, t: number) => `${d} of ${t} documents gathered`,
      print: "Print",
      copy: "Copy the list",
      copied: "List copied",
      reset: "Start over",
      saved: "Your checkmarks are kept on this device only.",
      next: "All set? Upload your documents to your client portal.",
    },
    calc: {
      h2: "GST/QST calculator",
      intro: "Add or remove Quebec sales taxes in a second.",
      add: "Add taxes",
      remove: "Remove taxes",
      amountAdd: "Amount before taxes",
      amountRemove: "Amount including taxes",
      before: "Before taxes",
      gst: "GST (5%)",
      qst: "QST (9.975%)",
      total: "Total",
      note: "GST 5% and QST 9.975%, current Quebec rates. Amounts are rounded to the cent.",
    },
    threshold: {
      h2: "Do I need to register for GST/QST?",
      intro: "Enter your taxable sales for the last four quarters.",
      q: (n: number) => `Quarter ${n}`,
      total: "Total for 4 quarters",
      over: "You are over the $30,000 threshold. GST and QST registration is mandatory.",
      under: (left: string) => `You are under the threshold. You have ${left} left before registration becomes mandatory.`,
      empty: "Enter your amounts to see the result.",
      note: "The exact calculation may include sales of associated corporations and certain exclusions. Confirm with a CPA.",
      cta: "Talk to a CPA about my sales tax",
    },
  },
};
