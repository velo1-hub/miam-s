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
  url: "https://www.othmanicpa.ca",
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
  phone: { display: "", tel: "" },
  /** À COMPLÉTER : ex. "info@othmanicpa.ca" */
  email: "",
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
   * Espace client Pilote Fiscal. L'application n'est pas encore prête : tant que `portalEnabled`
   * vaut false, le site n'en parle nulle part (boutons, section, textes). Passez à true et
   * indiquez `clientPortalUrl` le jour du lancement.
   */
  portalEnabled: false,
  /** Lien vers l'espace client Pilote Fiscal. */
  clientPortalUrl: "",
  /** Fiche Google Business : lien public et lien « Laisser un avis ». À COMPLÉTER. */
  googleReviewsUrl: "",
  googleWriteReviewUrl: "",
  /**
   * Point de réception des formulaires (ex. Formspree, Basin, Netlify Forms, fonction serverless).
   * Le site est statique : sans ce lien, les formulaires affichent un message de repli.
   */
  formEndpoint: "",
  areaServed: ["Saint-Léonard", "Anjou", "Saint-Michel", "Montréal-Nord", "Rivière-des-Prairies", "Montréal"],
};

export type Lang = "fr" | "en";

export const hasPhone = () => Boolean(site.phone.tel);
export const hasEmail = () => Boolean(site.email);
export const portalOn = () => site.portalEnabled && Boolean(site.clientPortalUrl);
export const portalHref = (lang: Lang) =>
  site.clientPortalUrl || (lang === "fr" ? "/#pilote-fiscal" : "/en/#pilote-fiscal");
export const abs = (path: string) => site.url + path;
