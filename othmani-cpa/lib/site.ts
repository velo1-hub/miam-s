/**
 * Configuration centrale du cabinet.
 * ⚠️ Les valeurs marquées « À COMPLÉTER » doivent être remplies avant la mise en ligne.
 * Tant qu'un champ est vide, le site affiche un texte neutre et l'omet du balisage Schema.org.
 */
export const site = {
  name: "Othmani CPA Inc.",
  owner: "Zouhaier Othmani",
  ownerTitle: { fr: "CPA auditeur", en: "CPA auditor" },
  /** Domaine définitif, sans barre oblique finale. À COMPLÉTER si différent. */
  url: "https://www.othmanicpa.com",
  address: {
    street: "8065, boul. Viau, suite 204",
    streetEn: "8065 Viau Blvd., Suite 204",
    city: "Saint-Léonard",
    region: "QC",
    postalCode: "H1R 2T2",
    country: "CA",
  },
  geo: { lat: 45.5856, lng: -73.6038 },
  /** À COMPLÉTER : ex. { display: "514 555-1234", tel: "+15145551234" } */
  phone: { display: "514 448-0924", tel: "+15144480924" },
  /** Cellulaire de Zouhaier (carte professionnelle) */
  mobile: { display: "514 299-2592", tel: "+15142992592" },
  /** À COMPLÉTER : ex. "info@othmanicpa.ca" */
  email: "zouhaier@othmanicpa.com",
  /** Heures d'ouverture — À CONFIRMER par le cabinet. */
  hours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "17:00" },
  ],
  hoursLabel: {
    fr: [
      ["Lundi au vendredi", "9 h à 17 h"],
      ["Samedi et dimanche", "Sur rendez-vous"],
    ],
    en: [
      ["Monday to Friday", "9 a.m. to 5 p.m."],
      ["Saturday and Sunday", "By appointment"],
    ],
  },
  /**
   * Vidéo du héros (boucle, sans son). Déposez les fichiers compressés dans /public/media/
   * puis indiquez leurs chemins ici. Elle n'est jamais chargée sur téléphone ni si
   * l'utilisateur préfère réduire les animations : l'image fixe est affichée à la place.
   */
  heroVideo: { webm: "", mp4: "" },
  /**
   * Espace client Pilote Fiscal. Il est construit (/espace-client/ et /en/client-portal/) mais
   * tant que `portalEnabled` vaut false, le site n'en parle nulle part (boutons, section, textes).
   * Passez à true le jour du lancement, une fois la base de données branchée (voir README).
   */
  portalEnabled: false,
  /** Laisser vide pour l'espace client intégré au site ; sinon, lien vers un portail externe. */
  clientPortalUrl: "",
  /** Fiche Google Business : lien public et lien « Laisser un avis ». À COMPLÉTER. */
  googleReviewsUrl: "",
  googleWriteReviewUrl: "",
  /**
   * Point de réception des formulaires (ex. Formspree, Basin, Netlify Forms, fonction serverless).
   * Le site est statique : sans ce lien, les formulaires affichent un message de repli.
   */
  formEndpoint: "",
  areaServed: ["Montréal", "Saint-Léonard", "Anjou", "Saint-Michel", "Montréal-Nord", "Rivière-des-Prairies", "Laval", "Longueuil", "Canada"],
  /**
   * Chiffres clés fournis par le cabinet. ⚠️ Règles de publicité de l'Ordre des CPA du Québec :
   * ces chiffres doivent rester exacts et vérifiables. Mettez-les à jour au besoin.
   */
  stats: { clients: 1000, businesses: 300 },
};

export type Lang = "fr" | "en";

export const hasPhone = () => Boolean(site.phone.tel);
export const hasEmail = () => Boolean(site.email);
export const portalOn = () => site.portalEnabled;
export const portalHref = (lang: Lang) =>
  site.clientPortalUrl || (lang === "fr" ? "/espace-client/" : "/en/client-portal/");
export const abs = (path: string) => site.url + path;

/**
 * Adresse réellement en ligne, pour les images de partage (aperçu du lien dans Messages, WhatsApp…).
 * Sur Vercel : le domaine de production du projet (le domaine personnalisé dès qu'il est branché).
 */
export const liveUrl = (path: string) =>
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : site.url) + path;
export const SHARE_IMAGE = "/images/othmani-cpa-partage.png";
