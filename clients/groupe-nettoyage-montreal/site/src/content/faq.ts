import type { Locale } from "@/i18n/config";
export type QA = { q: string; a: string };
export const FAQ: Record<Locale, QA[]> = {
  fr: [
    { q: "Êtes-vous assurés?", a: "Oui. Responsabilité civile commerciale et employés déclarés à la CNESST. Le certificat d'assurance est envoyé sur demande, avant le premier passage si vous le souhaitez." },
    { q: "Comment fonctionne la tarification?", a: "Le prix dépend de la superficie, du type d'espace et de la fréquence. Pour le résidentiel et l'Airbnb, vous obtenez un prix ferme en ligne en deux minutes. Pour le commercial, une fourchette immédiate puis une soumission écrite après une visite de 20 minutes." },
    { q: "Dois-je signer un contrat?", a: "Non. Les services récurrents s'annulent en tout temps avec un préavis de 7 jours. Les contrats commerciaux sont mensuels, sans durée minimale." },
    { q: "Est-ce toujours la même équipe?", a: "Oui. Une équipe attitrée connaît vos lieux, vos consignes d'accès et vos priorités. En cas d'absence, un remplaçant formé reçoit votre fiche complète avant la visite." },
    { q: "Que se passe-t-il si quelque chose a été oublié?", a: "Vous nous le signalez dans les 24 heures, par le portail, par texto ou par téléphone. Nous revenons corriger sans frais. Si vous n'êtes toujours pas satisfait, la visite est remboursée." },
    { q: "Apportez-vous le matériel et les produits?", a: "Oui, tout est inclus. Nous utilisons des produits certifiés écologiques, sécuritaires pour les enfants, les animaux et les surfaces alimentaires. Nous pouvons utiliser vos produits si vous le préférez." },
    { q: "Pouvez-vous intervenir rapidement?", a: "Les créneaux en ligne commencent le lendemain. Pour une urgence le jour même, appelez le (514) 260-5194 et nous confirmons la disponibilité en quelques minutes." },
    { q: "Quelles zones desservez-vous?", a: "L'île de Montréal, Laval, Longueuil, Brossard et l'Ouest-de-l'Île. Les secteurs voisins sont évalués au cas par cas, sans frais de déplacement surprise." },
  ],
  en: [
    { q: "Are you insured?", a: "Yes. Commercial general liability and CNESST-registered employees. We send the insurance certificate on request, before the first visit if you prefer." },
    { q: "How does pricing work?", a: "Price depends on size, type of space and frequency. Residential and Airbnb get a firm price online in two minutes. Commercial gets an instant range, then a written quote after a 20-minute walkthrough." },
    { q: "Do I have to sign a contract?", a: "No. Recurring service can be cancelled any time with 7 days' notice. Commercial agreements are month to month, with no minimum term." },
    { q: "Is it always the same team?", a: "Yes. A dedicated team knows your space, access instructions and priorities. If someone is away, a trained replacement receives your full file before the visit." },
    { q: "What if something was missed?", a: "Tell us within 24 hours, through the portal, by text or by phone. We come back and fix it at no charge. If you are still not satisfied, the visit is refunded." },
    { q: "Do you bring supplies and equipment?", a: "Yes, everything is included. We use certified eco-friendly products that are safe for children, pets and food surfaces. We can use your products if you prefer." },
    { q: "How fast can you come?", a: "Online slots start the next day. For a same-day emergency, call (514) 260-5194 and we confirm availability within minutes." },
    { q: "Which areas do you serve?", a: "The island of Montréal, Laval, Longueuil, Brossard and the West Island. Neighbouring areas are assessed case by case, with no surprise travel fees." },
  ],
};
