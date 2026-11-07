import type { Settings } from "./types";

/**
 * Defaults used in demo mode and as the initial Settings row. Every value tagged [CLIENT: …]
 * is a placeholder listed in docs/client-todo.md and must be replaced before launch.
 */
export const defaultSettings: Settings = {
  business: {
    legalName: "[CLIENT: nom légal] Idya Auto",
    displayName: "Idya Auto",
    city: "[CLIENT: ville]",
    addressLine1: "[CLIENT: adresse]",
    postalCode: "[CLIENT: code postal]",
    province: "Québec",
    phone: "+15145550123", // [CLIENT: téléphone] — demo number
    email: "info@idya-auto.example", // [CLIENT: courriel]
    leadsEmail: "ventes@idya-auto.example", // [CLIENT: courriel des leads]
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Idya+Auto",
    googleBusinessUrl: null,
    socials: {},
    lat: null,
    lng: null,
  },
  // [CLIENT: heures d'ouverture] — demo hours
  hours: {
    0: { open: null, close: null },
    1: { open: "09:00", close: "20:00" },
    2: { open: "09:00", close: "20:00" },
    3: { open: "09:00", close: "20:00" },
    4: { open: "09:00", close: "20:00" },
    5: { open: "09:00", close: "18:00" },
    6: { open: "10:00", close: "16:00" },
  },
  closures: [
    { day: "2026-12-25", reason: "Noël" },
    { day: "2026-12-26", reason: "Lendemain de Noël" },
    { day: "2027-01-01", reason: "Jour de l'An" },
  ],
  booking: { slotMinutes: 30, capacityPerSlot: 2, minLeadHours: 2, horizonDays: 21 },
  finance: {
    defaultRatePct: 7.99, // [CLIENT: taux par défaut]
    terms: [36, 48, 60, 72, 84, 96],
    defaultTerm: 72,
    creditFees: [], // [CLIENT: frais de crédit obligatoires]
    gstPct: 5,
    qstPct: 9.975,
    disclaimerFr:
      "Estimation à titre indicatif seulement, sous réserve de l'approbation du crédit. Le taux offert dépend de votre dossier.",
    disclaimerEn:
      "Estimate for information purposes only, subject to credit approval. The rate offered depends on your file.",
  },
  warranty: {
    A: {
      fr: "Garantie légale de bon fonctionnement de catégorie A : 6 mois ou 10 000 km, selon la première éventualité.",
      en: "Class A legal warranty of good working order: 6 months or 10,000 km, whichever comes first.",
    },
    B: {
      fr: "Garantie légale de bon fonctionnement de catégorie B : 3 mois ou 5 000 km, selon la première éventualité.",
      en: "Class B legal warranty of good working order: 3 months or 5,000 km, whichever comes first.",
    },
    C: {
      fr: "Garantie légale de bon fonctionnement de catégorie C : 1 mois ou 1 700 km, selon la première éventualité.",
      en: "Class C legal warranty of good working order: 1 month or 1,700 km, whichever comes first.",
    },
    D: {
      fr: "Véhicule de catégorie D : aucune garantie légale de bon fonctionnement ne s'applique. La garantie légale générale de la Loi sur la protection du consommateur demeure.",
      en: "Class D vehicle: no legal warranty of good working order applies. The general legal warranty of the Consumer Protection Act still applies.",
    },
  },
  privacyOfficer: {
    name: "[CLIENT: responsable de la protection des renseignements personnels]",
    title: "[CLIENT: titre]",
    email: "confidentialite@idya-auto.example",
    phone: null,
  },
  retention: { leadsMonths: 24, chatDays: 90 },
  assistant: {
    name: "Assistant Idya",
    enabled: true,
    afterHoursNote: {
      fr: "Notre équipe vous répondra dès la réouverture.",
      en: "Our team will get back to you when we reopen.",
    },
  },
  featuredVehicleId: null,
  hero: { posterUrl: null, posterMobileUrl: null, av1Url: null, h264Url: null, mobileUrl: null },
  whyUs: [
    {
      key: "all_in_price",
      enabled: true,
      fr: { title: "Prix tout inclus, sans surprise", body: "Le prix affiché comprend tous les frais. Seules la TPS et la TVQ s'ajoutent." },
      en: { title: "All-in price, no surprises", body: "The displayed price includes every fee. Only GST and QST are added." },
    },
    {
      key: "inspection",
      enabled: false,
      fr: { title: "[CLIENT: inspection]", body: "[CLIENT: description de l'inspection]" },
      en: { title: "[CLIENT: inspection]", body: "[CLIENT: inspection description]" },
    },
    {
      key: "financing",
      enabled: false,
      fr: { title: "[CLIENT: financement]", body: "[CLIENT: promesse de financement à confirmer]" },
      en: { title: "[CLIENT: financing]", body: "[CLIENT: financing claim to confirm]" },
    },
    {
      key: "trade_in",
      enabled: false,
      fr: { title: "[CLIENT: échange]", body: "[CLIENT: délai d'évaluation à confirmer]" },
      en: { title: "[CLIENT: trade-in]", body: "[CLIENT: valuation delay to confirm]" },
    },
  ],
};
