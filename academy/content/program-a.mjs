// The 1% — Programme Élite E-commerce : modules 1 à 7.
// Chaque leçon : titre, durée, vidéo (à téléverser plus tard via l'admin), contenu (markdown), ressources, aperçu gratuit ou non.
// Les quiz : 4 options, `answer` = index de la bonne réponse, `why` = explication affichée après la réponse.

export const MODULES_A = [
  {
    title: "Module 1 — Mentalité et fondations du 1 %",
    summary: "Pourquoi 99 % des boutiques échouent, comment pensent ceux qui réussissent, et les règles du jeu que vous allez suivre pendant 12 semaines.",
    lessons: [
      {
        title: "Bienvenue dans The 1 % : comment fonctionne le programme",
        duration: 12, preview: 1,
        content: `## Ce que vous venez d'acheter
Vous n'avez pas acheté des vidéos. Vous avez acheté un **système complet** pour bâtir une boutique en ligne rentable, avec un accompagnement humain jusqu'au résultat.

Le programme se déroule sur **12 semaines** (vous gardez l'accès à vie) :

| Semaine | Modules | Objectif |
|---|---|---|
| 1 | 1 et 2 | Mentalité, choix du marché et du produit |
| 2–3 | 3 et 4 | Fournisseur validé, marque définie |
| 4–5 | 5 et 6 | Boutique en ligne, offre et prix |
| 6–8 | 7, 8, 9 | Première vente, puis publicité rentable |
| 9–10 | 10 et 11 | Rétention, finances, rentabilité réelle |
| 11–12 | 12, 13, 14 | Opérations, scaling, vision de sortie |

## Vos obligations (oui, il y en a)
1. **Un bloc de 90 minutes par jour**, 5 jours par semaine, dans votre agenda. Non négociable.
2. **Une action par leçon.** Chaque leçon se termine par un livrable. Vous ne passez pas à la suivante sans l'avoir fait.
3. **Présence aux appels de groupe** (hebdomadaires) et aux **2 appels individuels** par mois inclus dans votre forfait.
4. **Transparence sur vos chiffres** dans la communauté : personne ne peut vous aider sur des données que vous cachez.

## Comment utiliser la plateforme
- La barre latérale liste les modules. Une leçon devient verte quand vous la marquez **terminée**.
- Chaque module se termine par un **quiz** (70 % requis). L'examen final débloque votre **certificat The 1 %**.
- L'onglet **Ressources** sous chaque vidéo contient les gabarits, feuilles de calcul et listes de contrôle.
- Les **questions** sous chaque leçon sont lues par l'équipe chaque jour ouvrable.

> **Action :** bloquez vos 90 minutes quotidiennes dans votre calendrier pour les 12 prochaines semaines, puis marquez cette leçon terminée.`,
        resources: [["Calendrier 12 semaines (PDF)", "#"], ["Charte d'engagement The 1 %", "#"]],
      },
      {
        title: "Pourquoi 99 % des boutiques ferment dans l'année",
        duration: 18, preview: 1,
        content: `## Les cinq causes réelles d'échec
Après avoir analysé des centaines de boutiques, les échecs se classent presque toujours dans une de ces catégories :

1. **Produit sans demande prouvée.** On vend ce qu'on aime au lieu de ce que le marché cherche déjà.
2. **Marges impossibles.** Un produit à 25 $ avec 11 $ de coût produit, 8 $ de livraison et 12 $ de coût publicitaire perd de l'argent à chaque vente.
3. **Aucune différenciation.** Même produit AliExpress, même page, même vidéo que 300 autres boutiques.
4. **Publicité lancée sans structure de test.** On brûle 2 000 $ en trois jours puis on conclut que « les pubs ne marchent pas ».
5. **Abandon à la semaine 3.** Le résultat arrive en général entre la semaine 6 et 10. La majorité part avant.

## Le modèle mental du 1 %
Les opérateurs qui réussissent ne cherchent pas « un produit gagnant ». Ils bâtissent une **machine de test** :

- une hypothèse de produit et d'audience,
- un budget de test fixe (nous utiliserons 300 à 500 $ par produit),
- des critères de décision écrits **avant** de lancer (coût par achat maximal, taux de clic minimal),
- une décision binaire à la fin : on double ou on coupe.

Un produit qui échoue n'est pas un échec : c'est une donnée. Dix tests structurés valent mieux qu'une « intuition » et un lancement unique.

## Les trois chiffres qui gouvernent tout
- **Marge brute unitaire** = prix de vente − coût produit − livraison − frais de paiement.
- **CPA** (coût par acquisition) = dépense publicitaire ÷ nombre de commandes.
- **Profit par commande** = marge brute − CPA.

Si le profit par commande est négatif, aucun volume ne vous sauvera. Tout le programme est construit pour rendre ce chiffre positif, puis le faire grandir.

> **Action :** notez dans votre journal The 1 % les deux dernières fois où vous avez abandonné un projet, et à quelle semaine. Vous reviendrez à cette note.`,
        resources: [["Journal The 1 % (gabarit Notion)", "#"]],
      },
      {
        title: "Objectifs chiffrés : de 0 à 10 000 $, puis 100 000 $ par mois",
        duration: 15,
        content: `## Travailler à rebours depuis le chiffre
Un objectif de « réussir en e-commerce » ne se mesure pas. Un objectif de **10 000 $ de ventes par mois à 25 % de marge nette** se décompose :

| Étape | Calcul | Résultat |
|---|---|---|
| Ventes mensuelles visées | — | 10 000 $ |
| Panier moyen | hypothèse | 65 $ |
| Commandes nécessaires | 10 000 ÷ 65 | ~154 |
| Taux de conversion visé | hypothèse | 2,5 % |
| Visiteurs nécessaires | 154 ÷ 0,025 | ~6 160 |
| CPC moyen | hypothèse | 0,90 $ |
| Budget publicitaire | 6 160 × 0,90 | ~5 544 $ |

Vous venez de découvrir que 10 000 $ de ventes à 65 $ de panier et 2,5 % de conversion exige ~5 500 $ de publicité. Reste 4 500 $ pour le produit, la livraison et le profit. D'où l'importance capitale du **panier moyen** et de la **marge** : ce sont les deux leviers que vous contrôlez le plus.

## Les trois paliers du programme
1. **Palier 1 — Preuve (semaines 1 à 6)** : 10 premières commandes payées par des inconnus. Pas vos amis.
2. **Palier 2 — Rentabilité (semaines 6 à 10)** : CPA inférieur à la marge brute pendant 14 jours consécutifs.
3. **Palier 3 — Échelle (semaines 10 à 12 et après)** : 10 000 $ puis 30 000 $ par mois avec un profit net positif.

Chaque palier a sa propre liste de contrôle dans les ressources. Vous ne passez pas au suivant tant que le précédent n'est pas coché.

> **Action :** remplissez le calculateur d'objectif avec vos propres hypothèses et publiez le résultat dans la communauté (canal #objectifs).`,
        resources: [["Calculateur d'objectif à rebours (Google Sheets)", "#"], ["Liste de contrôle des 3 paliers", "#"]],
      },
      {
        title: "Votre environnement de travail : outils, comptes et budget de départ",
        duration: 20,
        content: `## Budget réaliste pour démarrer (hors programme)
| Poste | Mensuel | Note |
|---|---|---|
| Shopify (forfait Basic) | ~39 $ | Essai gratuit 3 jours puis 1 $/mois le premier mois |
| Nom de domaine | ~15 $/an | Achetez-le chez un registraire, pas chez Shopify |
| Applications essentielles | 30 à 60 $ | Avis, upsell, courriels (versions gratuites au début) |
| Échantillons produits | 100 à 300 $ | Une fois |
| Budget de test publicitaire | 300 à 500 $ par produit | Prévoir 3 produits : 900 à 1 500 $ |
| Création de contenu (UGC) | 150 à 400 $ | Par produit testé |

Un lancement sérieux demande donc **2 000 à 3 500 $** de capital de travail en plus du programme. Si vous ne l'avez pas, le module 2 vous montre les modèles à faible capital (précommande, impression à la demande, produits numériques).

## Comptes à ouvrir cette semaine
- Shopify (adresse courriel professionnelle, pas Gmail personnel).
- Meta Business Manager + page Facebook + compte Instagram professionnel.
- TikTok for Business.
- Google Workspace ou Zoho Mail pour une adresse « contact@votremarque.com ».
- Compte Stripe ou Shopify Payments (vérification d'identité : préparez une pièce d'identité et un relevé bancaire).
- Un gestionnaire de mots de passe (1Password, Bitwarden). Non négociable : vous allez gérer 30 comptes.

## Structure juridique minimale
Au Canada, vous pouvez commencer en entreprise individuelle et vous enregistrer plus tard. Le module 12 couvre l'incorporation, les taxes (TPS/TVQ/TVH) et les obligations selon la province. Aux États-Unis, une LLC dans votre État de résidence suffit au départ.

> **Action :** ouvrez les 6 comptes ci-dessus et consignez-les dans votre gestionnaire de mots de passe. Capturez votre tableau de bord Shopify et déposez-le dans la communauté.`,
        resources: [["Liste des 30 outils du 1 % avec codes partenaires", "#"], ["Gabarit de budget de lancement", "#"]],
      },
    ],
    quiz: {
      title: "Quiz — Module 1",
      questions: [
        { q: "Quel chiffre détermine si un volume de ventes plus élevé vous sauvera ou vous coulera ?", options: ["Le nombre de visiteurs", "Le profit par commande (marge brute − CPA)", "Le nombre d'abonnés Instagram", "Le taux de rebond"], answer: 1, why: "Si le profit par commande est négatif, chaque vente supplémentaire augmente la perte." },
        { q: "Quel est le budget de test recommandé par produit dans le programme ?", options: ["50 à 100 $", "300 à 500 $", "2 000 $ minimum", "Il n'y a pas de budget fixe"], answer: 1, why: "Un budget fixe avec des critères écrits à l'avance transforme un test en donnée exploitable." },
        { q: "Entre quelles semaines arrivent généralement les premiers résultats significatifs ?", options: ["Semaine 1 à 2", "Semaine 3 à 4", "Semaine 6 à 10", "Après 12 mois"], answer: 2, why: "La majorité abandonne à la semaine 3, juste avant la fenêtre où les résultats apparaissent." },
        { q: "Quels sont les deux leviers que vous contrôlez le plus pour atteindre un objectif de ventes ?", options: ["Le CPC et l'algorithme", "Le panier moyen et la marge", "Le nombre de produits et la couleur du site", "La météo et la saison"], answer: 1, why: "Le CPC dépend du marché ; le panier moyen et la marge dépendent de votre offre." },
      ],
    },
  },

  {
    title: "Module 2 — Recherche de marché et sélection du produit gagnant",
    summary: "La méthode d'évaluation à 12 critères, les sources de données gratuites et payantes, et comment valider la demande avant de dépenser un dollar en publicité.",
    lessons: [
      {
        title: "Les 4 modèles e-commerce et lequel choisir selon votre capital",
        duration: 22,
        content: `## Vue d'ensemble
| Modèle | Capital de départ | Marge brute typique | Délai de livraison | Pour qui |
|---|---|---|---|---|
| Dropshipping (fournisseur expédie) | 1 500 à 3 000 $ | 55 à 70 % | 7 à 15 jours | Tester vite plusieurs produits |
| Marque privée (stock chez un 3PL) | 5 000 à 15 000 $ | 65 à 80 % | 2 à 5 jours | Bâtir un actif revendable |
| Impression à la demande | 500 à 1 000 $ | 35 à 50 % | 4 à 8 jours | Créateurs avec une audience |
| Produits numériques | 200 à 500 $ | 90 %+ | Instantané | Expertise, gabarits, formations |

## La trajectoire du 1 %
La majorité de nos membres suivent ce chemin : **dropshipping pour tester** (semaines 1 à 6) → le produit qui prouve une demande rentable passe en **marque privée** avec stock chez un entrepôt partenaire (3PL) à partir de la semaine 8 → la marque devient un actif qu'on peut vendre (module 14).

Le dropshipping n'est pas une destination. C'est un laboratoire bon marché.

## Les marchés que nous évitons
- Produits électroniques complexes (retours, garanties, batteries interdites en avion).
- Suppléments et cosmétiques ingérés sans licence (réglementation Santé Canada / FDA).
- Produits de marques déposées ou sous licence (Disney, NFL, etc.) : saisie et fermeture de compte garanties.
- Vêtements multi-tailles au départ (retours de 25 à 40 %).

## Les marchés que nous aimons
- Problème précis + solution visuelle démontrable en 5 secondes de vidéo.
- Prix de vente entre 35 et 120 $ (assez cher pour absorber la publicité, assez bas pour un achat impulsif).
- Achat répété possible ou extensions naturelles (accessoires, recharges, formats).
- Audience identifiable par un intérêt ou une étape de vie (nouveaux parents, propriétaires de chiens, cyclistes, télétravailleurs).

> **Action :** choisissez votre modèle de départ et justifiez-le en 5 lignes dans le journal.`,
        resources: [["Comparatif détaillé des 4 modèles (PDF)", "#"]],
      },
      {
        title: "La grille d'évaluation à 12 critères",
        duration: 25,
        content: `## Pourquoi une grille
L'intuition favorise ce qu'on connaît. La grille force une comparaison objective entre candidats. Chaque critère vaut de 1 à 5 ; un produit est **retenu pour test à partir de 42/60**.

| # | Critère | 1 point | 5 points |
|---|---|---|---|
| 1 | Problème résolu | Gadget | Douleur quotidienne claire |
| 2 | Effet « wow » en vidéo | Statique | Démonstration spectaculaire |
| 3 | Prix de vente possible | < 25 $ | 50 à 120 $ |
| 4 | Multiplicateur (prix ÷ coût rendu) | < 2× | ≥ 3,5× |
| 5 | Poids et fragilité | Lourd/fragile | < 500 g, robuste |
| 6 | Concurrence | 50+ boutiques identiques | Peu ou mal exécutées |
| 7 | Tendance (Google Trends 12 mois) | En chute | Stable ou en hausse |
| 8 | Saisonnalité | 2 mois par an | Toute l'année |
| 9 | Audience ciblable | Vague | Intérêt précis sur Meta/TikTok |
| 10 | Risque légal / sécurité | Élevé | Nul |
| 11 | Potentiel de répétition / gamme | Achat unique | Recharges, variantes, bundles |
| 12 | Disponibilité fournisseur | 1 seul fournisseur | 5+ fournisseurs, stock profond |

## Comment noter sans se mentir
- Notez **cinq produits en même temps**, jamais un seul. La comparaison corrige les biais.
- Pour le critère 4, calculez avec le **coût rendu** (produit + livraison jusqu'au client + emballage), pas le prix AliExpress affiché.
- Pour le critère 6, cherchez le produit sur TikTok, dans la bibliothèque publicitaire Meta et sur Amazon. Comptez les annonceurs **actifs depuis plus de 30 jours** : ce sont ceux qui gagnent de l'argent.

## Exemple noté
Un correcteur de posture : problème réel (5), démonstration moyenne (3), prix 40 $ (4), multiplicateur 4× (5), léger (5), **concurrence saturée (1)**, tendance stable (3), toute l'année (5), audience « télétravail » (4), risque faible (4), achat unique (2), fournisseurs nombreux (5) = **46/60**. Retenu, mais le critère 6 impose un angle différenciant (module 4).

> **Action :** notez 5 produits candidats dans la grille et déposez la feuille dans #produits pour révision par un coach.`,
        resources: [["Grille d'évaluation 12 critères (Google Sheets)", "#"], ["20 exemples de produits notés", "#"]],
      },
      {
        title: "Où trouver les produits : 9 sources, gratuites et payantes",
        duration: 24,
        content: `## Sources gratuites
1. **TikTok** : recherchez « TikTok made me buy it », « amazon finds », « #tiktokshop ». Triez par date. Notez les vidéos à plus de 500 k vues de moins de 30 jours.
2. **Bibliothèque publicitaire Meta** : filtrez par pays, « actif », mots-clés « 50 % de rabais », « livraison gratuite ». Un annonceur avec 20+ variantes d'annonce actives dépense sérieusement.
3. **Amazon Movers & Shakers** et « Nouveautés » par catégorie : la demande est prouvée, à vous de trouver un angle et un meilleur prix d'acquisition.
4. **Google Trends** : comparez 5 termes sur 5 ans. Cherchez une courbe en escalier montante, pas un pic isolé.
5. **Reddit** : subreddits de niche (r/BuyItForLife, r/dogs, r/HomeImprovement). Les plaintes récurrentes sont des produits.
6. **AliExpress Dropshipping Center** et **CJdropshipping** : classements de commandes par pays.

## Sources payantes (utiles à partir du palier 2)
7. **Minea / AdSpy / PiPiAds** (60 à 150 $/mois) : espionnage publicitaire TikTok et Meta avec métriques d'engagement.
8. **Helium 10 / Jungle Scout** (Amazon) : volume de ventes estimé par ASIN.
9. **Shophunter / Koala Inspector** : estimations de ventes de boutiques Shopify concurrentes.

## Le rituel de recherche (45 minutes, 3 fois par semaine)
- 15 min TikTok + bibliothèque Meta → noter 5 candidats.
- 15 min validation rapide : Trends, Amazon, nombre d'annonceurs.
- 15 min grille 12 critères.

En 3 semaines vous aurez 40 candidats notés et 5 à 8 au-dessus de 42/60. C'est votre pipeline de tests.

> **Action :** réalisez votre premier rituel de 45 minutes aujourd'hui et ajoutez 5 produits à la grille.`,
        resources: [["Liste des requêtes de recherche TikTok et Meta", "#"], ["Gabarit de pipeline de produits", "#"]],
      },
      {
        title: "Valider la demande avant de dépenser : les 4 tests à 0 $",
        duration: 17,
        content: `## Test 1 — Le test de la vidéo organique
Publiez 3 vidéos TikTok/Reels de 10 à 20 secondes montrant le produit (échantillon ou vidéo fournisseur remontée). Mesurez le taux de visionnage complet et les commentaires « où l'acheter ? ». Au-dessus de 3 % de commentaires d'intention d'achat, c'est très bon.

## Test 2 — Le test de la page
Montez une page produit complète (module 5) et envoyez 50 personnes de votre réseau **qui correspondent à la cible**. Ne demandez pas leur avis : regardez combien ajoutent au panier. L'opinion ment ; le clic ne ment pas.

## Test 3 — La précommande
Pour un produit à plus de 80 $, ouvrez une précommande avec livraison dans 3 à 4 semaines et un rabais de 20 %. Dix précommandes payées valent plus que cent sondages.

## Test 4 — Le test du concurrent
Commandez chez le concurrent le mieux établi. Chronométrez la livraison, photographiez l'emballage, lisez ses courriels post-achat, testez son service client. Chaque faiblesse observée devient une ligne de votre page « Pourquoi nous ».

## Le signal qu'on cherche
Aucun de ces tests ne remplace le test publicitaire payant (module 7). Mais ensemble, ils éliminent les produits que personne ne veut avant que vous ayez dépensé 400 $ pour l'apprendre.

> **Action :** réalisez les tests 1 et 4 sur votre meilleur candidat cette semaine.`,
        resources: [["Fiche d'observation concurrent", "#"]],
      },
      {
        title: "Étude de cas : trois produits, trois décisions",
        duration: 16,
        content: `## Produit A — La lampe de luminothérapie (retenu, mis à l'échelle)
Grille : 49/60. Tendance saisonnière (octobre à mars) compensée par une demande mondiale décalée (hémisphère sud). Coût rendu 14 $, vente 59 $, panier moyen 71 $ avec le bundle « lampe + guide de routine matinale ». CPA de test : 19 $. Profit par commande : ~24 $. Décision : marque privée dès la semaine 8, 3PL à Toronto, 38 000 $ de ventes le quatrième mois.

## Produit B — La brosse anti-poils pour animaux (retenu, puis coupé)
Grille : 44/60. Excellente vidéo, mais 60+ annonceurs actifs. Test de 450 $ : CTR 2,1 % (bon), CPA 31 $ pour une marge brute de 22 $. Deux angles créatifs supplémentaires testés : CPA 27 $. Décision : coupé au jour 9. Perte totale : 780 $. Donnée acquise : ce marché exige un prix d'acquisition qu'on ne peut pas se permettre sans gamme.

## Produit C — Le support de téléphone pour vélo (refusé avant test)
Grille : 37/60. Prix plafond 25 $, multiplicateur 2,2×, risque de casse et de réclamations. Pas de test. Temps gagné : 2 semaines.

## Ce que ces trois cas enseignent
- Le produit A n'avait pas la meilleure vidéo. Il avait la **meilleure marge et le meilleur bundle**.
- Le produit B montre pourquoi on décide des critères de coupe **avant** de lancer : sans règle écrite, on aurait dépensé 2 000 $ « pour voir ».
- Le produit C montre que **refuser vite** est une compétence.

> **Action :** classez vos 5 candidats en A, B ou C selon la logique ci-dessus et expliquez pourquoi dans #produits.`,
        resources: [["Études de cas complètes avec captures (PDF)", "#"]],
      },
    ],
    quiz: {
      title: "Quiz — Module 2",
      questions: [
        { q: "À partir de quel score sur la grille à 12 critères un produit est-il retenu pour test ?", options: ["30/60", "36/60", "42/60", "55/60"], answer: 2, why: "42/60 est le seuil ; en dessous, on refuse sans tester." },
        { q: "Quel multiplicateur (prix ÷ coût rendu) est visé pour 5 points ?", options: ["1,5×", "2×", "≥ 3,5×", "10×"], answer: 2, why: "En dessous de 3×, la publicité mange toute la marge." },
        { q: "Dans la bibliothèque publicitaire Meta, quel signal indique un concurrent rentable ?", options: ["Un logo soigné", "Des annonces actives depuis plus de 30 jours avec de nombreuses variantes", "Beaucoup de « J'aime » sur la page", "Un prix très bas"], answer: 1, why: "Personne ne maintient des annonces actives pendant 30 jours à perte." },
        { q: "Quel rôle joue le dropshipping dans la trajectoire du 1 % ?", options: ["La destination finale", "Un laboratoire de test bon marché avant la marque privée", "Un modèle à éviter absolument", "Une méthode réservée aux produits numériques"], answer: 1, why: "On teste en dropshipping, puis on passe le gagnant en marque privée avec stock." },
      ],
    },
  },

  {
    title: "Module 3 — Sourcing, fournisseurs et logistique",
    summary: "Trouver, négocier et sécuriser un fournisseur fiable ; échantillons, contrôle qualité, Incoterms, douanes, 3PL et livraison rapide au Canada, aux États-Unis et en Europe.",
    lessons: [
      {
        title: "Cartographie des fournisseurs : AliExpress, CJ, agents, Alibaba, 1688, locaux",
        duration: 23,
        content: `## Les six canaux
| Canal | Quantité minimale | Délai | Prix | Quand l'utiliser |
|---|---|---|---|---|
| AliExpress | 1 | 8 à 20 jours | Élevé | Les 10 premières commandes test |
| CJdropshipping / Zendrop | 1 | 6 à 12 jours | Moyen | Test et premiers 100 commandes |
| Agent de sourcing privé | 1 à 50 | 5 à 10 jours | Moyen − | À partir de 10 commandes/jour |
| Alibaba (usine) | 100 à 500 | 25 à 45 jours (mer) | Bas | Marque privée, stock 3PL |
| 1688.com (via agent) | 50 à 200 | 25 à 45 jours | Très bas | Quand Alibaba est trop cher |
| Fournisseurs locaux (Canada, É.-U., UE) | Variable | 2 à 7 jours | Élevé | Produits lourds, alimentaires, réglementés |

## Comment lire un profil Alibaba
- **Verified Supplier** + **Trade Assurance** obligatoires.
- Années sur la plateforme ≥ 3, taux de réponse ≥ 90 %.
- « Manufacturer » plutôt que « Trading company » (demandez des photos d'usine datées et une vidéo en direct sur WeChat).
- Cherchez le même produit chez 5 fournisseurs : l'écart de prix révèle les intermédiaires.

## Message de premier contact (gabarit)
Sujet clair, 6 lignes : qui vous êtes (marque, pays, volume prévu sur 6 mois), le produit exact avec capture, les 4 questions (prix par palier 100/500/1 000, MOQ, délai de production, options de personnalisation logo/emballage), la demande d'échantillon. Écrivez en anglais simple, numérotez vos questions : vous obtiendrez des réponses numérotées.

> **Action :** contactez 5 fournisseurs pour votre produit A avec le gabarit et consignez les réponses dans le tableau comparatif.`,
        resources: [["Gabarit de premier contact fournisseur (EN/FR)", "#"], ["Tableau comparatif fournisseurs", "#"], ["Liste de 12 agents de sourcing vérifiés par The 1 %", "#"]],
      },
      {
        title: "Échantillons, contrôle qualité et spécifications écrites",
        duration: 19,
        content: `## Commandez toujours 3 échantillons
Un du fournisseur retenu, deux des concurrents directs. Comparez poids, finition, emballage, notice, odeur (oui), temps de livraison réel. Filmez le déballage : ce sera votre premier contenu.

## La fiche de spécifications
Avant toute commande en volume, rédigez une fiche de 1 page que le fournisseur signe :
- Dimensions, poids, matériaux, couleurs (codes Pantone), tolérances.
- Emballage : type de boîte, impression, insert, protection.
- Marquages obligatoires : CE/UKCA, FCC, avertissements, pays d'origine.
- Critères de défaut majeur / mineur et taux acceptable (AQL 2,5 pour les mineurs, 0 pour les majeurs).

## Inspection avant expédition
À partir de 3 000 $ de commande, payez une inspection tierce (QIMA, V-Trust, ~250 à 350 $). Un rapport de 40 pages avec photos vaut infiniment moins cher qu'un conteneur de produits défectueux. Prévoyez l'inspection dans votre calcul de coût rendu.

## Paiement
- Échantillons : PayPal ou carte.
- Première commande : 30 % acompte, 70 % après inspection réussie, **par Trade Assurance** (Alibaba) jamais par virement direct.
- Jamais 100 % d'avance, quelle que soit l'explication.

> **Action :** commandez vos 3 échantillons aujourd'hui et créez la fiche de spécifications de votre produit A.`,
        resources: [["Fiche de spécifications (gabarit)", "#"], ["Liste de contrôle d'inspection AQL", "#"]],
      },
      {
        title: "Coût rendu réel : Incoterms, transport, douanes et taxes d'importation",
        duration: 26,
        content: `## Du prix usine au coût rendu
| Poste | Exemple (1 000 unités, 6 $ EXW) | Note |
|---|---|---|
| Prix usine (EXW) | 6 000 $ | Prix départ usine |
| Transport Chine → port (FOB) | +250 $ | Inclus si vous négociez FOB |
| Fret maritime LCL vers Vancouver/Montréal | +900 $ | ~30 à 40 jours |
| ou Fret aérien | +3 200 $ | 5 à 8 jours |
| Assurance | +60 $ | 0,5 à 1 % de la valeur |
| Douanes et courtage | +150 $ | Courtier ou transitaire |
| Droits d'importation | 0 à 18 % | Selon le code SH (voir plus bas) |
| TPS/TVH à l'import | 5 à 15 % | Récupérable si vous êtes inscrit |
| Réception 3PL | +250 $ | Par palette ou par unité |
| **Coût rendu** | **~8,10 $ / unité (maritime)** | Avant stockage et expédition au client |

## Incoterms, en une ligne chacun
- **EXW** : vous gérez tout depuis la porte de l'usine. À éviter au début.
- **FOB** : le fournisseur livre au port chinois. Le standard pour une marque privée.
- **DDP** : le fournisseur livre chez vous dédouané. Simple mais souvent 20 à 30 % plus cher.

## Le code SH (Système harmonisé)
Chaque produit a un code à 6 à 10 chiffres qui détermine les droits de douane. Trouvez-le sur le site de l'ASFC (Canada) ou de l'USITC (É.-U.). Un code mal choisi = pénalité et retard. Demandez le code au fournisseur, puis vérifiez-le.

## Règle du 1 %
Votre prix de vente doit être **au moins 3,5× le coût rendu**, sinon le produit ne passera pas le test publicitaire. Si le fret aérien casse le ratio, attendez le maritime : la trésorerie vous dira merci.

> **Action :** demandez un devis FOB à votre fournisseur retenu et calculez votre coût rendu complet dans le calculateur.`,
        resources: [["Calculateur de coût rendu (Google Sheets)", "#"], ["Guide des codes SH pour les 50 produits les plus courants", "#"], ["Liste de transitaires Canada / É.-U. / UE", "#"]],
      },
      {
        title: "3PL et expédition : livrer en 2 à 5 jours sans gérer un entrepôt",
        duration: 21,
        content: `## Qu'est-ce qu'un 3PL
Un entrepôt tiers qui reçoit votre stock, le range, emballe chaque commande Shopify automatiquement et l'expédie. Vous payez la réception, le stockage mensuel, la préparation (« pick & pack », 1,50 à 3 $) et le transport réel.

## Choisir son 3PL
- **Intégration Shopify native** (les commandes partent sans intervention).
- Tarifs d'expédition négociés affichés (Postes Canada, UPS, FedEx, USPS).
- Localisation proche de votre marché : Toronto/Montréal pour le Canada, un entrepôt Est + un Ouest pour les États-Unis dès 300 commandes/mois.
- Pas de minimum mensuel au début (ou faible).
- Délai de prise en charge ≤ 1 jour ouvrable.

## Promesse de livraison qui convertit
Affichez un délai **précis et tenu** : « Livré entre le 3 et le 5 novembre » convertit mieux que « 2 à 5 jours ouvrables ». Shopify affiche les estimations de livraison nativement si votre 3PL remonte les délais.

## Expédition gratuite ou payée ?
Le seuil de livraison gratuite est votre meilleur outil de panier moyen : placez-le **15 à 20 % au-dessus de votre panier moyen actuel**. Panier à 65 $ → livraison gratuite à partir de 79 $.

## Suivi et réclamations
Installez une page de suivi de marque (application de suivi) : elle réduit de 40 % les courriels « où est ma commande ». Prévoyez 1 à 2 % de colis perdus dans vos coûts et remplacez sans discuter : un remplacement coûte 8 $, un avis négatif coûte 100 ventes.

> **Action :** demandez une grille tarifaire à 2 3PL de la liste et calculez votre coût d'expédition moyen par commande.`,
        resources: [["Liste de 3PL recommandés (Canada, É.-U., UE)", "#"], ["Gabarit de demande de devis 3PL", "#"]],
      },
      {
        title: "Négociation : obtenir 15 à 30 % de moins sans perdre le fournisseur",
        duration: 14,
        content: `## Ce qui fait baisser le prix
1. **Volume engagé sur 6 mois** (même par commandes de 300) plutôt qu'une commande de 1 000.
2. **Paiement rapide** : proposer 50 % d'acompte contre une remise de 3 à 5 %.
3. **Simplification** : une couleur de moins, un emballage standard, une notice numérique via QR code.
4. **Concurrence transparente** : « le fournisseur B propose 5,40 $ FOB, pouvez-vous égaler ? » (vrai, et avec capture).
5. **Saison** : commandez en mars–avril et en août, hors pic du nouvel an chinois et de la rentrée.

## Ce qu'il ne faut jamais faire
- Mentir sur un volume. Le fournisseur le verra à la première commande et vous perdrez toute marge de négociation.
- Pousser sous le coût : la qualité baissera silencieusement.
- Changer de fournisseur pour 0,20 $. La fiabilité vaut plus.

## Script de négociation (3 messages)
1. Remerciement + reconnaissance de la qualité de l'échantillon + volume prévu sur 6 mois.
2. Demande de prix par paliers + options qui simplifient leur production.
3. Contre-offre unique, précise, avec la contrepartie (acompte, engagement, exclusivité régionale).

> **Action :** envoyez le message 1 à votre fournisseur retenu et notez le prix initial. Objectif : −15 % d'ici la commande en volume.`,
        resources: [["Scripts de négociation fournisseur", "#"]],
      },
    ],
    quiz: {
      title: "Quiz — Module 3",
      questions: [
        { q: "Quelle modalité de paiement est recommandée pour une première commande en volume ?", options: ["100 % d'avance par virement", "30 % d'acompte, 70 % après inspection, via Trade Assurance", "Paiement à la réception", "Carte de crédit uniquement"], answer: 1, why: "Trade Assurance protège votre paiement ; l'inspection protège la qualité." },
        { q: "Quel Incoterm est le standard pour une marque privée débutante ?", options: ["EXW", "FOB", "DDP", "CIF"], answer: 1, why: "FOB : le fournisseur gère jusqu'au port chinois, votre transitaire gère la suite." },
        { q: "Où placer le seuil de livraison gratuite ?", options: ["Égal au prix du produit", "15 à 20 % au-dessus du panier moyen actuel", "Le plus bas possible", "Il ne faut jamais offrir la livraison"], answer: 1, why: "Un seuil légèrement au-dessus du panier moyen pousse l'ajout d'un deuxième article." },
        { q: "Qu'est-ce qu'un code SH ?", options: ["Un code promo", "Le code de suivi du colis", "Le code douanier qui détermine les droits d'importation", "L'identifiant Shopify du produit"], answer: 2, why: "Le code SH (Système harmonisé) définit les droits et les règles à l'import." },
      ],
    },
  },

  {
    title: "Module 4 — Création de marque et positionnement",
    summary: "Transformer un produit en marque : angle, promesse, nom, identité visuelle, ton, et la page « Pourquoi nous » qui justifie un prix supérieur.",
    lessons: [
      {
        title: "L'angle : pourquoi le même produit vend 3× plus cher chez certains",
        duration: 18,
        content: `## Le produit n'est pas l'offre
Une gourde isotherme vaut 12 $ sur AliExpress. La même gourde vendue comme « la gourde des coureurs qui s'entraînent avant l'aube » avec une bouche conçue pour boire en courant, un guide d'hydratation et une communauté de coureurs vaut 48 $. L'objet n'a pas changé. **L'angle** a changé.

## Trouver l'angle en 4 questions
1. **Pour qui précisément ?** Pas « les gens actifs » : « les parents qui courent à 5 h avant que les enfants se lèvent ».
2. **Quel moment ?** L'instant exact où le problème fait mal (le réveil, le trajet, la douche à 22 h).
3. **Quelle transformation ?** Avant/après concret, visible, en une phrase.
4. **Quelle preuve ?** Un détail technique, un chiffre, un test, un témoignage.

## Les 5 angles qui fonctionnent le mieux en e-commerce
- **Angle identité** : « conçu pour les [tribu] » (cyclistes, infirmières, propriétaires de huskys).
- **Angle problème caché** : « 73 % des gens font ceci de travers ».
- **Angle comparaison** : « ce que votre [produit habituel] ne vous dit pas ».
- **Angle rituel** : le produit s'intègre dans une routine (matin, soir, dimanche).
- **Angle mission** : chaque achat soutient une cause crédible et vérifiable.

## Exercice
Pour votre produit A, écrivez 5 angles (un par type). Puis demandez à 10 personnes de la cible lequel les ferait cliquer. Gardez les 2 premiers pour les tests publicitaires du module 7.

> **Action :** publiez vos 5 angles dans #marque avec le vote de votre cible.`,
        resources: [["Gabarit « 5 angles »", "#"], ["50 exemples d'angles gagnants par catégorie", "#"]],
      },
      {
        title: "Nom, domaine et identité visuelle en 48 heures",
        duration: 20,
        content: `## Le nom
- 2 à 3 syllabes, prononçable dans les deux langues de votre marché, sans chiffre ni trait d'union.
- Domaine **.com** disponible (ou .ca si vous ne vendez qu'au Canada), comptes Instagram et TikTok libres.
- Vérifiez la base des marques (OPIC au Canada, USPTO aux États-Unis, EUIPO en Europe) : un conflit de marque ferme votre compte publicitaire.
- Évitez le nom du produit dans la marque (« GourdePro ») : vous bloquerez votre gamme future.

## L'identité en 6 décisions
1. Une **couleur principale** et une **couleur d'accent** (contraste suffisant pour les boutons).
2. Deux polices : une pour les titres (caractère), une pour le texte (lisibilité, Inter, Manrope, DM Sans).
3. Un logo **typographique** d'abord (Canva, Looka ou un designer Fiverr niveau 2 à 80 à 150 $). Le symbole viendra quand vous aurez du chiffre.
4. Un style photo : fond clair ou sombre, lumière naturelle ou studio. Choisissez et ne changez plus.
5. Un **ton** : 3 adjectifs (ex. direct, chaleureux, précis) et 3 mots interdits.
6. Une signature : la phrase sous le logo qui dit l'angle (« Pour celles qui courent avant l'aube »).

## Le kit de marque minimal
Un document d'une page (gabarit fourni) avec logo, couleurs (codes HEX), polices, ton, 3 photos de référence. Vous le donnerez à chaque créateur UGC, designer et rédacteur. Il élimine 80 % des allers-retours.

> **Action :** choisissez le nom, achetez le domaine, réservez les comptes sociaux et remplissez le kit de marque.`,
        resources: [["Kit de marque minimal (gabarit Canva)", "#"], ["Liste de contrôle nom et marque de commerce", "#"]],
      },
      {
        title: "Positionnement prix : comment vendre 49 $ ce que d'autres vendent 29 $",
        duration: 16,
        content: `## Le prix est un message
Un prix bas dit « produit générique ». Un prix élevé **avec justification** dit « solution sérieuse ». Sans justification, il dit « arnaque ». Toute la différence est dans la justification.

## Les 6 justificatifs de prix
1. **Bundle** : produit + accessoire + guide numérique = valeur perçue 2×, coût +15 %.
2. **Garantie forte** : 60 ou 90 jours satisfait ou remboursé (taux de retour réel : 2 à 4 %).
3. **Preuve** : avis vérifiés avec photos, test comparatif, certification.
4. **Rareté honnête** : édition, lot, saison. Jamais de faux compteurs : Meta et la loi les sanctionnent.
5. **Service** : livraison rapide affichée, support humain, guide d'utilisation vidéo.
6. **Identité** : le client achète l'appartenance à la tribu, pas l'objet.

## Grille de prix recommandée
- Prix d'ancrage (barré) : le prix « normal », crédible et affiché sur une partie de l'année.
- Prix de vente : 25 à 35 % sous l'ancrage.
- Bundle « le plus populaire » : +60 % de prix, +40 % de valeur ajoutée (le choix par défaut).
- Bundle « complet » : +120 % de prix, pour 10 à 15 % des clients.

Résultat attendu : panier moyen 1,3 à 1,5× le prix unitaire.

> **Action :** construisez vos 3 niveaux de prix et justifiez chacun avec au moins 2 des 6 justificatifs.`,
        resources: [["Calculateur de bundles et panier moyen", "#"]],
      },
      {
        title: "La page « Pourquoi nous » et la preuve sociale sans tricher",
        duration: 15,
        content: `## Pourquoi cette page compte
Une personne qui clique sur « Pourquoi nous » ou « Notre histoire » convertit 2 à 3× plus que la moyenne. Elle cherche une raison de vous faire confiance. Donnez-la-lui.

## Structure en 5 blocs
1. **Le déclencheur** : le moment où le fondateur a eu le problème (vrai, précis, daté).
2. **Ce qui n'allait pas** avec les solutions existantes (3 points, factuels).
3. **Ce qu'on a changé** (matériau, conception, service) avec une photo ou un schéma.
4. **La preuve** : chiffres de clients, avis, test, garantie.
5. **L'engagement** : ce qu'on promet, ce qu'on refuse de faire.

## Obtenir ses 20 premiers avis honnêtement
- Offrez le produit à 20 personnes de la cible contre un **avis honnête avec photo** (mentionnez « produit reçu gratuitement » si la loi de votre pays l'exige ; au Canada et aux É.-U., oui).
- Courriel automatisé 10 jours après livraison (module 10) avec lien direct vers le formulaire.
- Répondez à **chaque** avis, y compris les négatifs, en public.

## Ce qui vous détruit
Avis importés d'AliExpress, faux compteurs de visiteurs, faux « stock limité ». Les clients le sentent, Meta le détecte, et la Loi sur la concurrence (Canada) ou la FTC (É.-U.) le sanctionnent.

> **Action :** rédigez votre page « Pourquoi nous » avec le gabarit et lancez votre campagne de 20 premiers avis.`,
        resources: [["Gabarit page « Pourquoi nous »", "#"], ["Gabarit de courriel de demande d'avis", "#"]],
      },
    ],
    quiz: {
      title: "Quiz — Module 4",
      questions: [
        { q: "Qu'est-ce qui permet de vendre le même produit 3× plus cher ?", options: ["Une meilleure photo", "L'angle, la cible et la justification du prix", "Plus de publicités", "Un site plus rapide"], answer: 1, why: "L'objet ne change pas ; l'offre et le positionnement changent." },
        { q: "Quelle est la cible de panier moyen par rapport au prix unitaire avec des bundles ?", options: ["0,8×", "1×", "1,3 à 1,5×", "3×"], answer: 2, why: "Trois niveaux de prix avec un bundle par défaut portent le panier moyen à 1,3 à 1,5×." },
        { q: "Pourquoi éviter le nom du produit dans le nom de marque ?", options: ["C'est interdit", "Cela bloque l'extension de gamme future", "Google le pénalise", "Les clients n'aiment pas"], answer: 1, why: "« GourdePro » ne pourra jamais vendre des sacs ou des vêtements." },
        { q: "Laquelle de ces pratiques est acceptable ?", options: ["Importer des avis AliExpress", "Faux compteur de stock", "Offrir le produit contre un avis honnête, avec mention de la gratuité", "Masquer les avis négatifs"], answer: 2, why: "La transparence sur la gratuité rend la pratique légale et crédible." },
      ],
    },
  },
];
