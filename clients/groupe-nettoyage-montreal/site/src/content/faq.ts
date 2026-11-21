import type { Locale } from "@/i18n/config";
export type QA = { q: string; a: string };
export const FAQ: Record<Locale, QA[]> = {
  fr: [
    { q: "Faites-vous le ménage résidentiel?", a: "Non. Nous travaillons uniquement avec des entreprises et des gestionnaires : bureaux, commerces, restaurants, immeubles, locations court terme, chantiers. Pas de ménage de maison pour particuliers." },
    { q: "Comment obtenir un prix?", a: "Par une visite gratuite de 20 minutes sur place, en semaine. Vous recevez une soumission écrite et détaillée dans les 24 heures, par passage et par mois, avec la liste exacte de ce qui est fait. Nous n'affichons pas de grille publique : chaque local est différent." },
    { q: "Êtes-vous assurés?", a: "Oui. Responsabilité civile commerciale et employés déclarés à la CNESST. Le certificat d'assurance est envoyé avec la soumission, avant le premier passage." },
    { q: "Dois-je signer un contrat à long terme?", a: "Non. Les ententes sont mensuelles, résiliables avec 30 jours de préavis, sans durée minimale." },
    { q: "Est-ce toujours la même équipe?", a: "Oui. Une équipe attitrée connaît vos locaux, vos protocoles d'accès et vos priorités. En cas d'absence, un remplaçant formé reçoit la fiche complète de votre site avant le passage." },
    { q: "Que se passe-t-il si quelque chose a été oublié?", a: "Vous nous le signalez dans les 24 heures, par courriel, texto ou téléphone. Nous revenons corriger sans frais. Si vous n'êtes toujours pas satisfait, le passage est crédité." },
    { q: "Apportez-vous le matériel et les produits?", a: "Oui, tout est inclus, y compris les consommables de base. Nous utilisons des produits certifiés écologiques, sécuritaires pour les surfaces alimentaires. Nous pouvons utiliser vos produits si votre politique l'exige." },
    { q: "À quelle vitesse pouvez-vous commencer?", a: "La visite d'évaluation se fait généralement dans les 48 heures et le premier passage dans la semaine qui suit la signature. Pour une urgence le jour même, appelez le (514) 260-5194." },
    { q: "Quelles zones desservez-vous?", a: "L'île de Montréal, Laval, Longueuil, Brossard et l'Ouest-de-l'Île. Les secteurs voisins sont évalués au cas par cas." },
  ],
  en: [
    { q: "Do you clean homes?", a: "No. We work only with businesses and managers: offices, shops, restaurants, buildings, short-term rentals, construction sites. No house cleaning for private individuals." },
    { q: "How do I get a price?", a: "Through a free 20-minute on-site walkthrough, on weekdays. You receive a detailed written quote within 24 hours, per visit and per month, with the exact list of what gets done. We do not publish a public grid: every space is different." },
    { q: "Are you insured?", a: "Yes. Commercial general liability and CNESST-registered employees. The insurance certificate is sent with the quote, before the first visit." },
    { q: "Do I have to sign a long-term contract?", a: "No. Agreements are month to month, cancellable with 30 days' notice, with no minimum term." },
    { q: "Is it always the same team?", a: "Yes. A dedicated team knows your premises, access protocols and priorities. If someone is away, a trained replacement receives your full site file before the visit." },
    { q: "What if something was missed?", a: "Tell us within 24 hours, by email, text or phone. We come back and fix it at no charge. If you are still not satisfied, the visit is credited." },
    { q: "Do you bring supplies and equipment?", a: "Yes, everything is included, basic consumables too. We use certified eco-friendly products that are safe for food surfaces. We can use your products if your policy requires it." },
    { q: "How fast can you start?", a: "The walkthrough usually happens within 48 hours and the first visit within the week after signing. For a same-day emergency, call (514) 260-5194." },
    { q: "Which areas do you serve?", a: "The island of Montréal, Laval, Longueuil, Brossard and the West Island. Neighbouring areas are assessed case by case." },
  ],
};
