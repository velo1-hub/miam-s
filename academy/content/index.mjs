// Catalogue des formations de The 1 %. Les prix sont en cents.
import { MODULES_A } from "./program-a.mjs";
import { MODULES_B } from "./program-b.mjs";
import { MODULES_C, FINAL_EXAM } from "./program-c.mjs";

export const BRAND = {
  name: "The 1%",
  tagline: "L'académie e-commerce de ceux qui exécutent.",
  currency: "USD",
  supportEmail: "support@the1percent.academy",
};

export const COURSES = [
  {
    slug: "the-1-percent",
    title: "The 1% — Programme Élite E-commerce",
    subtitle: "12 semaines d'accompagnement intensif pour bâtir, lancer et faire croître une marque e-commerce rentable, avec coaching individuel jusqu'au résultat.",
    description: `Le programme complet, du choix du produit à la vente de la marque. 14 modules, 63 leçons, 14 quiz, un examen final et un certificat vérifiable.

Ce n'est pas un cours vidéo : c'est un système d'exécution. Chaque leçon se termine par un livrable révisé par un coach. Vous avancez par paliers (preuve, rentabilité, échelle) et vous ne passez au suivant que lorsque les chiffres le confirment.

Le prix est tout inclus : il n'y a aucun frais supplémentaire, ni abonnement, ni commission, ni module caché.`,
    audience: "Entrepreneurs, créateurs de contenu et professionnels qui veulent une marque e-commerce rentable en 12 semaines, avec 2 000 à 3 500 $ de capital de travail et 90 minutes par jour.",
    level: "Débutant à avancé",
    hours: 20,
    price_cents: 2000000,
    currency: "USD",
    accent: "#C9A227",
    featured: 1,
    sort: 1,
    outcomes: [
      "Un produit validé par un test publicitaire structuré (pas par une intuition)",
      "Un fournisseur sous contrat, un coût rendu calculé et une logistique 3PL en place",
      "Une boutique Shopify révisée point par point, qui convertit à 2 % et plus",
      "Un système publicitaire Meta et TikTok avec règles de test, de coupe et de scaling",
      "Les 7 automatisations courriel/SMS qui apportent 25 à 35 % des ventes sans publicité",
      "Un compte de résultat hebdomadaire, un plan de trésorerie et un CPA maximal connu",
      "Des opérations documentées, déléguées, et une marque prête à être vendue",
    ],
    includes: [
      { title: "14 modules, 63 leçons vidéo (20 h) et 18 h d'appels en direct", detail: "Accès à vie, mises à jour incluses. Chaque leçon a ses gabarits, calculateurs et listes de contrôle." },
      { title: "2 appels de coaching individuel par mois", detail: "12 semaines, 6 appels d'une heure avec un coach qui a opéré une marque à 7 chiffres. Révision de votre boutique, de vos publicités et de vos chiffres." },
      { title: "Appel de groupe hebdomadaire", detail: "Questions en direct, revue de cas, démonstrations. Enregistrements disponibles." },
      { title: "Révision de boutique et de campagne publicitaire", detail: "Liste de contrôle à 60 points avant lancement, puis diagnostic de votre première campagne de test." },
      { title: "Communauté privée The 1 %", detail: "Canaux par sujet, revue hebdomadaire des chiffres, réseau de fournisseurs, créateurs et 3PL partenaires." },
      { title: "Plus de 60 gabarits et calculateurs", detail: "Grille à 12 critères, coût rendu, P&L, trésorerie 13 semaines, scripts publicitaires, flux Klaviyo, procédures." },
      { title: "Annuaire de partenaires vérifiés", detail: "Agents de sourcing, 3PL, créateurs UGC, comptables e-commerce, avocats en marques, avec conditions préférentielles." },
      { title: "Certificat The 1 % vérifiable", detail: "Émis après les 14 quiz et l'examen final, avec une page de vérification publique." },
      { title: "Programme Alumni", detail: "Appel mensuel à vie et accès aux nouvelles versions du programme." },
      { title: "Garantie d'exécution", detail: "Si vous complétez les 14 modules, livrez chaque action et n'obtenez pas vos 10 premières ventes en 12 semaines, nous prolongeons le coaching gratuitement jusqu'à ce que vous les obteniez." },
    ],
    plan: {
      label: "Plan en 3 versements",
      installments: [
        { label: "1er versement — à l'inscription (accès immédiat)", amount_cents: 500000, days: 0 },
        { label: "2e versement — 30 jours après l'inscription", amount_cents: 500000, days: 30 },
        { label: "3e versement — 60 jours après l'inscription", amount_cents: 1000000, days: 60 },
      ],
    },
    modules: [...MODULES_A, ...MODULES_B, ...MODULES_C],
    finalExam: FINAL_EXAM,
  },
  {
    slug: "masterclass-7-piliers",
    title: "Masterclass gratuite — Les 7 piliers d'une boutique rentable",
    subtitle: "60 minutes pour comprendre pourquoi 99 % des boutiques échouent et ce que le 1 % fait différemment.",
    description: `Trois leçons gratuites, sans engagement, pour évaluer si The 1 % est fait pour vous. Vous y apprendrez la mathématique du profit par commande, la grille de sélection de produit et la structure d'un test publicitaire à 400 $.`,
    audience: "Toute personne qui envisage de lancer ou de relancer une boutique en ligne.",
    level: "Débutant",
    hours: 1,
    price_cents: 0,
    currency: "USD",
    accent: "#2563EB",
    featured: 0,
    sort: 2,
    outcomes: [
      "Calculer votre profit par commande avant de lancer",
      "Noter un produit sur la grille à 12 critères",
      "Comprendre la structure d'un test publicitaire à budget fixe",
    ],
    includes: [
      { title: "3 leçons vidéo", detail: "Accès immédiat après inscription gratuite." },
      { title: "Grille à 12 critères", detail: "La même que dans le programme complet." },
    ],
    plan: null,
    modules: [
      {
        title: "Les 7 piliers",
        summary: "La version condensée de la méthode The 1 %.",
        lessons: [
          { title: "Pilier 1 à 3 : produit, marge, offre", duration: 20, preview: 1, content: `## Le produit n'est pas le point de départ
Le point de départ, c'est le **profit par commande** : prix − coût rendu − livraison − frais de paiement − coût d'acquisition. Si ce chiffre est négatif, rien d'autre ne compte.

## Pilier 1 — Le produit
Un problème précis, une démonstration visuelle en 5 secondes, un prix entre 35 et 120 $, un multiplicateur d'au moins 3,5× entre le coût rendu et le prix de vente. Dans le programme, chaque produit est noté sur 12 critères avant un dollar de dépense.

## Pilier 2 — La marge
Un produit à 2× ne survivra pas à la publicité. Les marques qui scalent ont 60 à 75 % de marge brute **après** livraison. Le bundle par défaut porte le panier moyen à 1,3 à 1,5× le prix unitaire.

## Pilier 3 — L'offre
Le même objet se vend 3× plus cher avec un angle, une garantie, deux bonus numériques et une justification de prix. L'offre, pas le produit, décide de la conversion.

> **Action :** calculez le profit par commande de votre idée actuelle avec le calculateur fourni.`, resources: [["Calculateur de profit par commande", "#"]] },
          { title: "Pilier 4 à 5 : boutique et suivi", duration: 18, preview: 1, content: `## Pilier 4 — La page produit
80 % du trafic publicitaire arrive sur une seule page. Sept éléments au-dessus du pli (galerie, titre bénéfice, avis, prix et ancrage, bundle présélectionné, bouton, rassurance) décident de 8 % d'ajout au panier ou de 2 %.

## Pilier 5 — Le suivi
Sans Pixel, API Conversions et UTM corrects, les plateformes optimisent à l'aveugle. 30 % des « échecs publicitaires » sont des problèmes de suivi. L'indicateur de vérité est le MER : ventes réelles ÷ dépense totale.

> **Action :** vérifiez avec l'extension Meta Pixel Helper que vos 5 événements se déclenchent une seule fois.`, resources: [["Liste de contrôle du suivi", "#"]] },
          { title: "Pilier 6 à 7 : publicité et rétention", duration: 22, preview: 1, content: `## Pilier 6 — Le test publicitaire à budget fixe
Une campagne, trois angles, douze créatifs, 50 à 70 $ par jour, des règles de coupe écrites avant le lancement, une décision claire en 5 à 7 jours pour 300 à 500 $. Le créatif est le ciblage.

## Pilier 7 — La rétention
25 à 35 % des ventes d'une marque mature viennent du courriel et du SMS. Les 7 flux automatisés s'installent avant la première publicité. La valeur à vie permet de payer l'acquisition plus cher que n'importe quel concurrent mono-vente.

## La suite
Le programme The 1 % détaille chacun de ces piliers sur 14 modules, avec coaching individuel, révision de boutique et de campagne, et communauté. Consultez la page du programme pour l'offre complète et le plan en 3 versements.

> **Action :** notez votre produit sur la grille à 12 critères et décidez si vous le testez.`, resources: [["Grille à 12 critères", "#"]] },
        ],
        quiz: {
          title: "Quiz — Masterclass",
          questions: [
            { q: "Quel est le point de départ de la méthode The 1 % ?", options: ["Le logo", "Le profit par commande", "Le nombre d'abonnés", "Le choix du thème Shopify"], answer: 1, why: "Sans profit par commande positif, rien d'autre ne compte." },
            { q: "Quel multiplicateur minimal entre coût rendu et prix de vente ?", options: ["1,5×", "2×", "3,5×", "10×"], answer: 2, why: "C'est le seuil qui laisse la place à la publicité." },
            { q: "Quelle part des ventes d'une marque mature vient du courriel et du SMS ?", options: ["0 à 5 %", "25 à 35 %", "80 %", "100 %"], answer: 1, why: "C'est le rendement typique des 7 flux et des campagnes hebdomadaires." },
          ],
        },
      },
    ],
    finalExam: null,
  },
];
