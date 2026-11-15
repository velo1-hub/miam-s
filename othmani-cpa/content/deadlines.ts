/**
 * Dates fiscales générales (Québec et fédéral).
 * Quand une date tombe un samedi, un dimanche ou un jour férié, l'échéance est reportée
 * au jour ouvrable suivant : les dates ci-dessous tiennent déjà compte de ce report.
 * ⚠️ À mettre à jour chaque année (ajoutez les dates de l'année suivante en novembre).
 */
export type Deadline = {
  date: string; // AAAA-MM-JJ
  audience: "individuals" | "businesses" | "both";
  fr: { title: string; detail: string };
  en: { title: string; detail: string };
};

export const deadlines: Deadline[] = [
  {
    date: "2026-12-15",
    audience: "both",
    fr: { title: "Acompte provisionnel de décembre", detail: "Dernier versement de l'année pour les particuliers qui paient par acomptes (travailleurs autonomes, retraités, investisseurs)." },
    en: { title: "December tax instalment", detail: "Last instalment of the year for individuals who pay by instalments (self-employed, retirees, investors)." },
  },
  {
    date: "2026-12-31",
    audience: "individuals",
    fr: { title: "Dons, CELIAPP et dépenses de 2026", detail: "Dernier jour pour faire un don, cotiser au CELIAPP ou payer des frais médicaux qui compteront pour l'année 2026." },
    en: { title: "Donations, FHSA and 2026 expenses", detail: "Last day to make a donation, contribute to your FHSA or pay medical expenses that count for 2026." },
  },
  {
    date: "2027-02-01",
    audience: "businesses",
    fr: { title: "TPS/TVQ : déclaration du 4e trimestre", detail: "Pour les entreprises qui produisent par trimestre civil (octobre à décembre 2026). Échéance du 31 janvier reportée au lundi." },
    en: { title: "GST/QST: 4th quarter return", detail: "For businesses filing by calendar quarter (October to December 2026). January 31 deadline moved to Monday." },
  },
  {
    date: "2027-03-01",
    audience: "both",
    fr: { title: "REER 2026 et feuillets T4 / Relevé 1", detail: "Date limite pour cotiser à un REER déductible en 2026. Les employeurs doivent aussi remettre les T4 et Relevés 1 à leurs employés." },
    en: { title: "2026 RRSP and T4 / RL-1 slips", detail: "Deadline for RRSP contributions deductible for 2026. Employers must also issue T4 and RL-1 slips to employees." },
  },
  {
    date: "2027-03-15",
    audience: "both",
    fr: { title: "Acompte provisionnel de mars", detail: "Premier versement de l'année 2027 pour les particuliers qui paient par acomptes." },
    en: { title: "March tax instalment", detail: "First 2027 instalment for individuals who pay by instalments." },
  },
  {
    date: "2027-04-30",
    audience: "individuals",
    fr: { title: "Déclarations de revenus 2026", detail: "Date limite pour produire vos déclarations fédérale et provinciale et pour payer tout solde dû, y compris pour les travailleurs autonomes." },
    en: { title: "2026 income tax returns", detail: "Deadline to file your federal and Quebec returns and to pay any balance owing, including for self-employed people." },
  },
  {
    date: "2027-04-30",
    audience: "businesses",
    fr: { title: "TPS/TVQ : déclaration du 1er trimestre", detail: "Pour les entreprises qui produisent par trimestre civil (janvier à mars 2027)." },
    en: { title: "GST/QST: 1st quarter return", detail: "For businesses filing by calendar quarter (January to March 2027)." },
  },
  {
    date: "2027-06-15",
    audience: "both",
    fr: { title: "Travailleurs autonomes et acompte de juin", detail: "Date limite de production pour les travailleurs autonomes et leur conjoint. C'est aussi la date du deuxième acompte provisionnel." },
    en: { title: "Self-employed returns and June instalment", detail: "Filing deadline for self-employed people and their spouses. Also the date of the second tax instalment." },
  },
  {
    date: "2027-08-02",
    audience: "businesses",
    fr: { title: "TPS/TVQ : déclaration du 2e trimestre", detail: "Pour les entreprises qui produisent par trimestre civil (avril à juin 2027). Échéance du 31 juillet reportée au lundi." },
    en: { title: "GST/QST: 2nd quarter return", detail: "For businesses filing by calendar quarter (April to June 2027). July 31 deadline moved to Monday." },
  },
  {
    date: "2027-09-15",
    audience: "both",
    fr: { title: "Acompte provisionnel de septembre", detail: "Troisième versement de l'année pour les particuliers qui paient par acomptes." },
    en: { title: "September tax instalment", detail: "Third instalment of the year for individuals who pay by instalments." },
  },
  {
    date: "2027-11-01",
    audience: "businesses",
    fr: { title: "TPS/TVQ : déclaration du 3e trimestre", detail: "Pour les entreprises qui produisent par trimestre civil (juillet à septembre 2027). Échéance du 31 octobre reportée au lundi." },
    en: { title: "GST/QST: 3rd quarter return", detail: "For businesses filing by calendar quarter (July to September 2027). October 31 deadline moved to Monday." },
  },
  {
    date: "2027-12-15",
    audience: "both",
    fr: { title: "Acompte provisionnel de décembre", detail: "Dernier versement de l'année 2027 pour les particuliers qui paient par acomptes." },
    en: { title: "December tax instalment", detail: "Last 2027 instalment for individuals who pay by instalments." },
  },
];
