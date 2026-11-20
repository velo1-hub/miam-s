import type { RouteKey } from "@/lib/routes";

/**
 * Une photo par préoccupation (640 × 800, WebP), affichée dans « Qu'est-ce qui vous préoccupe ? ».
 * Les photos ne s'affichent que lorsque les 8 sont présentes, pour garder un rendu uniforme.
 */
export const concernImages: Partial<Record<RouteKey, { src: string; fr: string; en: string }>> = {
  personalTaxes: { src: "/images/sujet-impots-particuliers.webp", fr: "Une personne trie ses feuillets d'impôt à la table de la cuisine, près d'un portable", en: "A person sorting tax slips at the kitchen table next to a laptop" },
  selfEmployed: { src: "/images/sujet-travailleur-autonome.webp", fr: "Une travailleuse autonome à son bureau à la maison, devant une fenêtre", en: "A self-employed worker at a home office desk by a window" },
  statements: { src: "/images/sujet-etats-financiers.webp", fr: "Une main pointe un chiffre sur des états financiers imprimés", en: "A hand pointing at a figure on printed financial statements" },
  taxLetter: { src: "/images/sujet-lettre-impot.webp", fr: "Des mains ouvrent une enveloppe blanche sur une console d'entrée", en: "Hands opening a white envelope on an entryway console" },
  lifeChanges: { src: "/images/sujet-grand-changement.webp", fr: "Un couple devant son nouveau duplex en brique, une poussette à côté", en: "A couple in front of their new brick duplex, a stroller beside them" },
  startBusiness: { src: "/images/sujet-demarrer-entreprise.webp", fr: "Une entrepreneure ouvre la porte vitrée de sa nouvelle boutique", en: "An entrepreneur unlocking the glass door of her new shop" },
  salesTax: { src: "/images/sujet-taxes-tps-tvq.webp", fr: "Une commerçante remet un reçu à une cliente près d'un terminal de paiement", en: "A shopkeeper handing a receipt to a customer next to a payment terminal" },
  multiCompanies: { src: "/images/sujet-plusieurs-entreprises.webp", fr: "Un entrepreneur regarde les immeubles du centre-ville depuis son bureau", en: "An entrepreneur looking at downtown buildings from his office" },
};

const NEEDED: RouteKey[] = ["personalTaxes", "taxLetter", "selfEmployed", "lifeChanges", "startBusiness", "salesTax", "statements", "multiCompanies"];
export const concernImagesReady = NEEDED.every((k) => concernImages[k]);
