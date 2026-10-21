// The 1% — Programme Élite E-commerce : modules 5 à 9.
export const MODULES_B = [
  {
    title: "Module 5 — Construire la boutique Shopify haute conversion",
    summary: "De zéro à une boutique qui convertit à 2,5 % et plus : thème, structure, page produit, panier, paiement, vitesse, applications et confiance.",
    lessons: [
      {
        title: "Architecture d'une boutique qui convertit : les 7 pages qui comptent",
        duration: 20,
        content: `## Moins de pages, mieux faites
| Page | Rôle | Objectif de conversion |
|---|---|---|
| Page produit | 80 % du trafic publicitaire y arrive | Ajout au panier ≥ 8 % |
| Accueil | Rassure ceux qui vérifient qui vous êtes | Clic vers produit ≥ 40 % |
| Collection | Navigation et comparaison | Clic produit ≥ 50 % |
| Panier / tiroir | Vente additionnelle | Passage à la caisse ≥ 55 % |
| Paiement (checkout) | Finaliser sans friction | Commandes ÷ checkouts ≥ 60 % |
| Pourquoi nous | Confiance | Convertit 2 à 3× |
| FAQ + livraison + retours | Lever les objections | Réduire les tickets |

## Thèmes
Commencez avec un thème gratuit Shopify (Dawn, Sense, Refresh) ou un thème payant éprouvé (Impact, Prestige, Shrine : 250 à 400 $ une fois). Évitez les constructeurs de pages lourds au début : ils ralentissent le site et compliquent la maintenance.

## Navigation
Maximum 5 liens dans le menu principal : Boutique, Pourquoi nous, Avis, FAQ, Contact. Pour une boutique à 1 à 3 produits, le logo renvoie directement vers le produit vedette.

## Mobile d'abord
85 à 92 % de votre trafic publicitaire sera mobile. Construisez sur téléphone, vérifiez sur ordinateur, jamais l'inverse.

> **Action :** créez les 7 pages (même vides) et la navigation. Capturez la version mobile.`,
        resources: [["Liste de contrôle des 7 pages", "#"], ["Comparatif de 10 thèmes Shopify", "#"]],
      },
      {
        title: "La page produit parfaite, section par section",
        duration: 32,
        content: `## Au-dessus du pli (ce qu'on voit sans défiler, sur mobile)
1. **Galerie** : 6 à 8 images. 1) produit en usage, 2) bénéfice principal avec texte, 3) détail technique, 4) comparaison avant/après, 5) ce qui est inclus, 6) taille/échelle, 7) avis client en image, 8) vidéo de 15 secondes.
2. **Titre** : bénéfice + produit (« Dormez en 12 minutes — le masque chauffant Luma »).
3. **Étoiles + nombre d'avis** cliquables.
4. **Prix** avec ancrage barré et économie en dollars.
5. **Sélecteur de bundle** (1 / 2 / 3 unités ou Essentiel / Populaire / Complet) avec « le plus populaire » présélectionné.
6. **Bouton Ajouter au panier** contrasté, texte orienté bénéfice (« Je veux mieux dormir »).
7. **Rassurance sous le bouton** : livraison rapide avec date, garantie 60 jours, paiement sécurisé.

## Sous le pli
- 3 bénéfices en icônes.
- Bloc « Comment ça marche » en 3 étapes avec images.
- Bloc comparaison « Nous vs. les autres » (tableau à 5 lignes, honnête).
- Témoignages avec photos et prénoms.
- FAQ dépliante (8 questions, dont livraison, retours, compatibilité, entretien).
- Rappel de l'offre + bouton collant en bas de l'écran mobile.

## Rédaction
Une idée par phrase. Un bénéfice par bloc. Le mot « vous » 3× plus souvent que « nous ». Lisez le texte à voix haute : s'il sonne comme une publicité, réécrivez-le comme un ami qui explique.

## Vitesse
Images en WebP, ≤ 150 ko chacune. Score Lighthouse mobile ≥ 60. Chaque seconde de chargement au-delà de 3 secondes coûte ~7 % de conversion.

> **Action :** construisez la page produit avec les 7 éléments au-dessus du pli, puis demandez une révision à un coach dans #boutique.`,
        resources: [["Gabarit de page produit (Figma)", "#"], ["Gabarit de 8 images produit (Canva)", "#"], ["Liste de contrôle de révision de page produit (42 points)", "#"]],
      },
      {
        title: "Panier, upsell et caisse : +30 % de panier moyen sans trafic supplémentaire",
        duration: 22,
        content: `## Le tiroir de panier
Au clic sur « Ajouter », ouvrez un tiroir (pas une page) avec :
- la barre de progression vers la livraison gratuite (« plus que 14 $ »),
- une recommandation « souvent acheté avec » à prix réduit,
- le bouton « Passer à la caisse » visible sans défiler.

## Les trois moments d'upsell
1. **Avant le panier** : sélecteur de quantité avec rabais progressif (2 = −10 %, 3 = −20 %).
2. **Dans le panier** : accessoire complémentaire à moins de 30 % du prix principal.
3. **Après paiement** (post-purchase) : offre en un clic, sans ressaisir la carte. Taux d'acceptation typique : 8 à 15 %. Zéro risque sur la conversion initiale.

## La caisse Shopify
- Activez **Shop Pay**, Apple Pay, Google Pay, PayPal. Les portefeuilles express augmentent la conversion de 10 à 20 % sur mobile.
- Adresse en une page, pas de création de compte obligatoire.
- Affichez les taxes et la livraison **dès la page produit** : les frais surprises causent 48 % des abandons.
- Champ code promo discret (sinon les clients quittent pour chercher un code).

## Applications recommandées (et pas plus)
Avis (Judge.me ou Loox), upsell (ReConvert ou Selleasy), courriels/SMS (Klaviyo), suivi de colis (Parcel Panel), tiroir de panier (souvent inclus dans le thème). Au-delà de 8 applications, votre site ralentit et vos coûts fixes grimpent.

> **Action :** configurez le tiroir de panier, un upsell post-achat et activez les portefeuilles express. Passez une commande test complète.`,
        resources: [["Configuration d'upsell post-achat (guide pas à pas)", "#"], ["Liste des 8 applications et leurs réglages", "#"]],
      },
      {
        title: "Confiance et conformité : politiques, mentions légales, cookies, taxes",
        duration: 18,
        content: `## Les pages obligatoires
Shopify génère des gabarits : **lisez-les et adaptez-les**. Vous devez afficher clairement : politique de remboursement, politique de livraison, conditions de vente, politique de confidentialité, coordonnées (adresse physique ou postale et courriel).

## Québec et Canada
- Loi 25 : avis de collecte de renseignements personnels, responsable de la protection désigné, bannière de consentement pour les témoins non essentiels.
- Loi sur la protection du consommateur (Québec) : prix tout compris, droit d'annulation du contrat à distance, francisation de l'affichage si vous vendez au Québec.
- Taxes : TPS 5 % + TVQ 9,975 % (Québec), TVH 13 à 15 % (Ontario, Maritimes), TPS + TVP ailleurs. Inscription obligatoire au-delà de 30 000 $ de ventes sur 4 trimestres ; nous recommandons de s'inscrire dès le départ pour récupérer les taxes payées à l'import.

## États-Unis
Taxe de vente par État dès que vous dépassez un seuil de « nexus économique » (souvent 100 000 $ ou 200 transactions par État). Shopify Tax calcule et vous alerte.

## Europe
TVA du pays de livraison via le guichet unique (OSS) ; mentions légales et droit de rétractation de 14 jours.

## Signaux de confiance qui comptent
- Adresse physique dans le pied de page.
- Photo réelle de l'équipe sur « Pourquoi nous ».
- Numéro de téléphone ou chat avec horaires.
- Logos des moyens de paiement.
- Certificat SSL (inclus avec Shopify).

> **Action :** publiez vos 5 pages légales adaptées et configurez la collecte des taxes de votre marché principal.`,
        resources: [["Gabarits de politiques FR/EN (Canada, É.-U., UE)", "#"], ["Liste de contrôle Loi 25", "#"]],
      },
      {
        title: "Suivi et données : Pixel Meta, API Conversions, GA4, TikTok Pixel",
        duration: 24,
        content: `## Pourquoi c'est la leçon la plus importante du module
Sans suivi fiable, Meta et TikTok optimisent à l'aveugle et vos décisions reposent sur du bruit. 30 % des « échecs publicitaires » que nous diagnostiquons sont des problèmes de suivi.

## Installation (ordre exact)
1. **Meta** : créez le Pixel dans le Gestionnaire d'événements, installez-le via l'application Facebook & Instagram de Shopify (elle active l'**API Conversions** côté serveur, indispensable depuis iOS 14).
2. Vérifiez avec l'extension « Meta Pixel Helper » : PageView, ViewContent, AddToCart, InitiateCheckout, Purchase doivent se déclencher **une seule fois** chacun.
3. **TikTok** : application TikTok de Shopify, mêmes vérifications.
4. **Google Analytics 4** via Google & YouTube de Shopify ; activez le commerce électronique amélioré.
5. **Paramètres UTM** sur chaque publicité (campagne, ensemble, annonce) pour relier les ventes dans Shopify.

## Le tableau de bord quotidien (10 minutes)
| Indicateur | Source | Cible |
|---|---|---|
| Dépense publicitaire | Meta + TikTok | Selon budget |
| Ventes Shopify | Shopify | — |
| MER (ventes ÷ dépense totale) | Calcul | ≥ 2,5 au palier 2 |
| Taux de conversion | Shopify | ≥ 2 % |
| Panier moyen | Shopify | ≥ 1,3× prix unitaire |
| CPA plateforme vs. CPA réel | Meta vs. Shopify | Écart < 25 % |

Le MER (Marketing Efficiency Ratio) est votre chiffre de vérité : il ignore les attributions imparfaites des plateformes.

> **Action :** installez les 3 pixels, vérifiez les 5 événements et remplissez le tableau de bord avec votre commande test.`,
        resources: [["Guide d'installation du suivi avec captures", "#"], ["Tableau de bord quotidien (Google Sheets)", "#"]],
      },
      {
        title: "Révision finale avant lancement : la liste de contrôle à 60 points",
        duration: 14,
        content: `## Pourquoi une liste
Un coach révise votre boutique avec cette liste avant que vous dépensiez votre premier dollar publicitaire. Chaque point non coché coûte des ventes.

## Extraits (liste complète en ressource)
**Page produit** : titre bénéfice, 6+ images optimisées, vidéo, prix et ancrage, bundle présélectionné, rassurance sous le bouton, avis visibles, FAQ, bouton collant mobile.
**Technique** : Lighthouse mobile ≥ 60, favicon, pages 404 personnalisée, domaine en HTTPS avec redirection www, courriels de notification personnalisés (confirmation, expédition).
**Confiance** : 5 politiques, adresse, contact, Loi 25, paiement express.
**Suivi** : 5 événements Meta sans doublon, TikTok, GA4, UTM.
**Commande test** : passée, remboursée, courriels reçus, suivi de colis fonctionnel.
**Service client** : adresse de support, réponse automatique, FAQ, gabarits de réponses (module 12).

## Lancement doux
Avant la publicité : envoyez la boutique à 30 personnes de la cible avec un code de 15 % valable 72 h. Objectif : 5 à 10 commandes, et surtout les bogues que vous n'avez pas vus.

> **Action :** complétez les 60 points, réservez votre révision de boutique avec un coach, puis lancez le lancement doux.`,
        resources: [["Liste de contrôle de lancement (60 points)", "#"]],
      },
    ],
    quiz: {
      title: "Quiz — Module 5",
      questions: [
        { q: "Quel pourcentage approximatif du trafic publicitaire arrive sur la page produit ?", options: ["20 %", "50 %", "80 %", "100 %"], answer: 2, why: "La page produit est la page d'atterrissage de la quasi-totalité des publicités." },
        { q: "Quel est l'avantage principal de l'upsell post-achat ?", options: ["Il augmente la conversion initiale", "Il n'a aucun risque sur la conversion initiale et s'accepte en un clic", "Il remplace le panier", "Il réduit les frais Shopify"], answer: 1, why: "L'offre apparaît après le paiement : la vente initiale est déjà sécurisée." },
        { q: "Quel indicateur ignore les problèmes d'attribution des plateformes ?", options: ["Le ROAS Meta", "Le CPC", "Le MER (ventes totales ÷ dépense totale)", "Le taux de clic"], answer: 2, why: "Le MER compare les ventes réelles Shopify à toute la dépense, sans dépendre des pixels." },
        { q: "Au Québec, quelle loi impose une bannière de consentement pour les témoins non essentiels ?", options: ["Loi 101", "Loi 25", "Loi 96", "La LPRPDE uniquement"], answer: 1, why: "La Loi 25 encadre la collecte des renseignements personnels, témoins inclus." },
      ],
    },
  },

  {
    title: "Module 6 — Offre, prix et psychologie de la conversion",
    summary: "Construire une offre irrésistible : garantie, bonus, urgence honnête, preuve, et les 12 leviers psychologiques mesurables qui font passer une page de 1 % à 3 % de conversion.",
    lessons: [
      {
        title: "L'équation de l'offre : valeur perçue, prix, risque, effort",
        duration: 19,
        content: `## La formule
**Désir d'acheter = (résultat désiré × probabilité perçue de l'obtenir) ÷ (prix + délai + effort + risque)**

Vous pouvez augmenter le numérateur (montrer un résultat plus désirable, plus crédible) ou réduire le dénominateur (prix perçu, délai de livraison, effort d'utilisation, risque de regret). Les débutants ne jouent que sur le prix. Le 1 % joue sur les sept variables.

## Augmenter le numérateur
- Résultat : une image avant/après, un chiffre (« −40 % de douleurs au réveil selon 212 clients »).
- Probabilité : avis, démonstration, garantie, « conçu avec un physiothérapeute ».

## Réduire le dénominateur
- Prix : bundle, paiement en 4× (Shop Pay Installments, Sezzle), comparaison au coût de l'alternative (« le prix de deux massages »).
- Délai : date de livraison précise, expédition en 24 h.
- Effort : « prêt en 30 secondes », vidéo d'installation, guide inclus.
- Risque : garantie 60 jours, retour gratuit, support humain.

## Exercice de l'offre à 10 lignes
Produit + résultat + pour qui + preuve + bonus 1 + bonus 2 + garantie + livraison + prix et ancrage + raison d'agir maintenant. Si une ligne est faible, l'offre est faible.

> **Action :** rédigez votre offre à 10 lignes et publiez-la dans #offre pour obtenir 3 retours.`,
        resources: [["Gabarit « offre à 10 lignes »", "#"]],
      },
      {
        title: "Garanties, bonus et urgence qui restent légaux",
        duration: 16,
        content: `## La garantie comme levier de conversion
Passer de 30 à 60 jours augmente typiquement la conversion de 10 à 20 % et les retours de moins de 1 point. Les gens achètent avec la garantie et oublient de s'en servir. Rendez-la visible : sous le bouton, dans la FAQ, dans le courriel de confirmation.

## Bonus à coût marginal nul
Guide numérique (PDF, 10 pages), accès à une mini-formation vidéo, groupe privé, liste de contrôle, modèle. Valeur perçue : 20 à 50 $. Coût : votre temps une fois. Nommez-les et donnez-leur un prix barré.

## Urgence honnête
- Offre de lancement datée (vraie date, vraie fin).
- Lot limité réellement limité (vous avez 300 unités, dites 300 unités).
- Prix qui monte après la précommande (annoncé, tenu).
- Livraison garantie avant une date (Noël, fête des Mères) si commandé avant le X.

## Ce qui est interdit ou pénalisé
Compte à rebours qui se réinitialise, « 3 personnes regardent ce produit » inventé, prix barré jamais pratiqué (la loi exige qu'il ait été réel pendant une période raisonnable), faux avis. Au Canada, le Bureau de la concurrence a imposé des amendes de plusieurs millions pour ces pratiques ; Meta ferme les comptes.

> **Action :** choisissez votre garantie, 2 bonus et 1 mécanisme d'urgence honnête ; intégrez-les sur la page produit.`,
        resources: [["Gabarits de bonus numériques (Canva)", "#"], ["Résumé des règles de publicité trompeuse Canada / É.-U. / UE", "#"]],
      },
      {
        title: "Les 12 leviers psychologiques mesurables (avec résultats de tests)",
        duration: 24,
        content: `## Chaque levier, son test A/B et son résultat typique
| # | Levier | Mise en œuvre | Gain mesuré (médiane de nos tests) |
|---|---|---|---|
| 1 | Preuve sociale | Compteur d'avis vérifiés près du prix | +9 % ajout au panier |
| 2 | Ancrage | Prix barré + économie en $ | +6 % |
| 3 | Choix par défaut | Bundle « populaire » présélectionné | +22 % panier moyen |
| 4 | Aversion à la perte | « Vous économisez 24 $ » plutôt que « −30 % » | +4 % |
| 5 | Réduction du risque | Garantie sous le bouton | +11 % conversion |
| 6 | Concrétude | Date de livraison précise | +7 % |
| 7 | Autorité | « Conçu avec… », certification | +5 % |
| 8 | Appartenance | « Rejoignez 12 400 coureurs » | +3 % |
| 9 | Réciprocité | Guide gratuit avant l'achat | +6 % courriels captés |
| 10 | Cohérence | Quiz de recommandation produit | +15 % conversion sur trafic froid |
| 11 | Simplicité | Une seule décision par écran | +8 % |
| 12 | Contraste | Bouton d'une couleur unique sur la page | +4 % |

## Comment tester sans se tromper
- Un changement à la fois.
- Minimum 100 conversions par variante (sinon le résultat est du bruit).
- Utilisez l'outil de test natif du thème ou Shopify A/B apps ; ne testez pas la couleur du bouton avant d'avoir testé l'offre.

## Ordre de priorité des tests
Offre et prix → titre et première image → bundle par défaut → garantie et rassurance → longueur de la page → détails.

> **Action :** appliquez les leviers 1, 3, 5 et 6 aujourd'hui (ils ne nécessitent aucun test) et planifiez votre premier test A/B sur l'offre.`,
        resources: [["Journal de tests A/B (gabarit)", "#"]],
      },
      {
        title: "Capturer les courriels et SMS avant la vente : le pop-up qui ne fait pas fuir",
        duration: 13,
        content: `## Pourquoi
Entre 95 et 98 % des visiteurs n'achètent pas à la première visite. Un courriel ou un numéro capté transforme ce trafic payé en actif que vous possédez (module 10).

## Le pop-up qui fonctionne
- Déclenchement après 8 à 12 secondes ou à 40 % de défilement, jamais à l'arrivée.
- Offre claire : « 10 % sur votre première commande » ou mieux, un bonus utile (« le guide des 7 erreurs… »).
- Deux champs maximum : courriel, puis SMS en deuxième étape (le double opt-in SMS est légal et requis).
- Fermeture facile. Un pop-up impossible à fermer tue la conversion mobile.
- Taux de capture visé : 5 à 8 % des visiteurs.

## Consentement
Au Canada (LCAP) et en Europe (RGPD) : consentement explicite, mention de la fréquence, lien de désabonnement dans chaque message. Les amendes sont réelles ; Klaviyo gère le consentement si vous activez les bons champs.

## Le courriel de bienvenue
Envoyé dans la minute : code promo, le « pourquoi nous » en 3 phrases, le produit vedette, une question (« qu'est-ce qui vous amène ? »). Taux d'ouverture attendu : 50 à 65 %.

> **Action :** configurez le pop-up dans Klaviyo avec l'offre choisie et le flux de bienvenue à 3 courriels (gabarits fournis).`,
        resources: [["Gabarits de pop-up et flux de bienvenue (Klaviyo)", "#"]],
      },
    ],
    quiz: {
      title: "Quiz — Module 6",
      questions: [
        { q: "Dans l'équation de l'offre, lequel de ces éléments réduit le dénominateur ?", options: ["Un chiffre de résultat", "Une garantie 60 jours", "Un témoignage", "Un logo de certification"], answer: 1, why: "La garantie réduit le risque perçu ; les autres augmentent le résultat ou sa probabilité." },
        { q: "Quel levier produit le plus gros gain de panier moyen ?", options: ["L'ancrage", "Le bundle présélectionné par défaut", "La couleur du bouton", "L'autorité"], answer: 1, why: "Le choix par défaut oriente la majorité des clients vers le bundle intermédiaire." },
        { q: "Quel est le nombre minimal de conversions par variante pour un test A/B fiable ?", options: ["10", "25", "100", "1 000"], answer: 2, why: "En dessous de 100 conversions, les écarts observés sont du bruit statistique." },
        { q: "Laquelle de ces pratiques d'urgence est légale ?", options: ["Compte à rebours qui se réinitialise", "Faux compteur de visiteurs", "Offre de lancement avec une vraie date de fin", "Prix barré jamais pratiqué"], answer: 2, why: "L'urgence doit reposer sur un fait vrai et vérifiable." },
      ],
    },
  },

  {
    title: "Module 7 — Publicité Meta (Facebook et Instagram) : du test au scaling",
    summary: "Le système publicitaire complet du 1 % : structure de compte, créatifs, budget de test, lecture des chiffres, règles de coupe et méthodes de scaling vertical et horizontal.",
    lessons: [
      {
        title: "Comment Meta décide qui voit votre annonce (et ce que ça change pour vous)",
        duration: 18,
        content: `## L'enchère
À chaque affichage, Meta organise une enchère entre annonceurs. Le gagnant n'est pas celui qui paie le plus : c'est celui dont **enchère × taux d'action estimé × qualité** est le plus élevé. Une annonce que les gens regardent, aiment et sur laquelle ils cliquent coûte moins cher à diffuser. **Le créatif est le ciblage.**

## Ce qui a changé depuis 2021
Avec iOS 14 et la fin du suivi précis, le ciblage détaillé par intérêts a perdu de sa valeur. Les campagnes **Advantage+ Shopping** et les audiences larges, nourries par de bons créatifs et par l'API Conversions, surpassent presque toujours les ciblages manuels.

## Les 3 niveaux
1. **Campagne** : objectif (toujours « Ventes »), budget (CBO ou ABO).
2. **Ensemble de publicités** : audience, emplacements, optimisation (toujours « Achat »).
3. **Publicité** : le créatif (vidéo ou image), le texte, le titre, l'appel à l'action, l'URL avec UTM.

## Phase d'apprentissage
Un ensemble a besoin d'environ 50 conversions en 7 jours pour sortir de l'apprentissage. En dessous, les performances sont instables : c'est normal, ne modifiez rien pendant 3 jours.

> **Action :** créez votre structure de compte : Business Manager vérifié, compte publicitaire, moyen de paiement, Pixel connecté, domaine vérifié.`,
        resources: [["Liste de contrôle de configuration du compte Meta", "#"]],
      },
      {
        title: "Créatifs gagnants : les 6 formats et la formule de script en 5 temps",
        duration: 28,
        content: `## Les 6 formats qui fonctionnent en 2026
1. **UGC témoignage** (15 à 30 s) : une personne de la cible explique son problème et montre le produit.
2. **Démonstration « hook » 3 secondes** : le résultat d'abord, l'explication ensuite.
3. **« 3 raisons pour lesquelles… »** : liste rapide, texte à l'écran.
4. **Avant/après** sincère et comparable.
5. **« Je n'y croyais pas »** : objection puis preuve.
6. **Image statique** : produit + 1 bénéfice + 1 preuve. Toujours en tester 2 ou 3, elles gagnent plus souvent qu'on ne le pense.

## Le script en 5 temps (30 secondes)
1. **Hook (0–3 s)** : une phrase qui arrête le pouce. Question, résultat choc, erreur courante.
2. **Problème (3–8 s)** : l'instant de douleur, précis.
3. **Solution (8–18 s)** : le produit en action, 2 bénéfices maximum.
4. **Preuve (18–25 s)** : avis, chiffre, démonstration, garantie.
5. **Appel à l'action (25–30 s)** : « Essayez-le 60 jours, lien ci-dessous ».

## Combien de créatifs
Par produit, pour un test sérieux : **3 angles × 2 formats × 2 hooks = 12 variantes**. Les créatifs représentent 70 % du résultat ; le réglage de campagne, 30 %.

## Où les produire
- Vous-même avec un téléphone et une lumière à 40 $ (modules fournis).
- Créateurs UGC (plateformes : Billo, Insense, Twirl, ou en direct sur TikTok) : 60 à 250 $ par vidéo, droits publicitaires inclus.
- Montage : CapCut (gratuit), sous-titres toujours activés (80 % des visionnages sont sans son).

> **Action :** écrivez 3 scripts (3 angles) avec la formule en 5 temps et commandez 2 vidéos UGC.`,
        resources: [["30 hooks éprouvés par catégorie", "#"], ["Gabarit de brief créateur UGC", "#"], ["Liste de plateformes UGC avec tarifs", "#"]],
      },
      {
        title: "La structure de test du 1 % : 300 à 500 $ pour une décision claire",
        duration: 25,
        content: `## Structure recommandée (jour 1)
- **1 campagne** Ventes, budget au niveau de la campagne (CBO) de **50 à 70 $/jour**.
- **3 ensembles** = 3 angles. Audience large (pays, 18–65, aucun intérêt) ou Advantage+.
- **4 publicités par ensemble** (2 formats × 2 hooks).
- Optimisation : Achat. Attribution : clic 7 jours, vue 1 jour.
- Emplacements : Advantage+ (automatiques).

## Règles de décision écrites avant de lancer
| Horizon | Règle | Action |
|---|---|---|
| Jour 1–2 | CTR < 1 % et CPC > 2 $ sur une annonce après 15 $ dépensés | Couper l'annonce |
| Jour 3 | Aucun ajout au panier après 60 $ sur un ensemble | Couper l'ensemble |
| Jour 4–5 | CPA > 1,5× la marge brute sur un ensemble après 2× la marge dépensée | Couper l'ensemble |
| Jour 5–7 | Au moins 1 ensemble avec CPA ≤ marge brute et ≥ 5 achats | Produit **validé** : passer au scaling |
| Jour 7 | Aucun ensemble validé après 400 à 500 $ | Produit **coupé** ou 1 relance avec 3 nouveaux angles |

## Les 5 métriques à regarder, dans l'ordre
1. **CTR (lien)** ≥ 1,5 % : le hook fonctionne.
2. **CPC** ≤ 1,20 $ : le créatif est jugé pertinent.
3. **Taux d'ajout au panier** ≥ 8 % des clics : la page fonctionne.
4. **Taux de conversion** ≥ 2 % : l'offre fonctionne.
5. **CPA** ≤ marge brute : le modèle fonctionne.

Chaque métrique diagnostique une étape différente. Un CTR faible = problème de créatif, pas de page. Un CTR élevé et pas d'ajout au panier = problème de page ou de prix.

> **Action :** lancez votre première campagne de test avec les 12 créatifs et les règles de décision imprimées à côté de vous.`,
        resources: [["Plan de test publicitaire (gabarit)", "#"], ["Tableau de diagnostic des 5 métriques", "#"]],
      },
      {
        title: "Lire le Gestionnaire de publicités comme un opérateur",
        duration: 20,
        content: `## Colonnes personnalisées (sauvegardez ce réglage)
Montant dépensé · Achats · Coût par achat · Valeur de conversion · ROAS · CTR (lien) · CPC (lien) · CPM · Taux de visionnage 3 s (hook rate) · Ajouts au panier · Coût par ajout au panier · Fréquence.

## Lire sans paniquer
- Les chiffres bougent beaucoup avec moins de 10 achats : regardez des **fenêtres de 3 à 7 jours**, pas des journées.
- Meta « retarde » l'attribution : les achats du lundi apparaissent partiellement jusqu'au mercredi.
- Comparez toujours le CPA Meta au CPA réel (dépense totale ÷ commandes Shopify) : le MER tranche.

## Diagnostiquer avec le hook rate et le hold rate
- **Hook rate** (3 s ÷ impressions) ≥ 30 % : la première seconde fonctionne.
- **Hold rate** (ThruPlay ÷ 3 s) ≥ 25 % : le corps de la vidéo tient.
Un hook rate faible = changer les 3 premières secondes, pas toute la vidéo.

## Fréquence et fatigue
Au-delà d'une fréquence de 3 sur 7 jours avec un CPA qui monte, le créatif fatigue. Remplacez-le, ne l'éditez pas (l'édition relance l'apprentissage).

> **Action :** créez votre jeu de colonnes, exportez vos données du test et complétez la fiche de diagnostic.`,
        resources: [["Fiche de diagnostic hebdomadaire", "#"]],
      },
      {
        title: "Scaling : vertical, horizontal et les règles pour ne pas tout casser",
        duration: 23,
        content: `## Scaling vertical (augmenter le budget)
- Augmentez de **20 à 30 % toutes les 48 à 72 h** si le CPA tient. Jamais ×2 d'un coup : l'algorithme réinitialise l'apprentissage.
- Avec CBO, laissez Meta répartir ; coupez seulement les ensembles qui n'ont aucun achat après 3× le CPA cible.

## Scaling horizontal (dupliquer ce qui marche)
- Dupliquez l'ensemble gagnant dans une **nouvelle campagne** avec un budget 2× plus élevé (les gros budgets atteignent des enchères différentes).
- Testez de nouvelles audiences : similaires (lookalike 1 à 3 % des acheteurs), intérêts larges, pays voisins.
- Créez une campagne **créatifs uniquement** : 5 nouveaux créatifs par semaine, en permanence. Le scaling, c'est une usine à créatifs.

## Reciblage (10 à 15 % du budget)
Visiteurs 7 jours, ajouts au panier 7 jours, acheteurs 60 jours (pour la vente croisée). Créatifs spécifiques : avis, réponse aux objections, rappel de la garantie, offre.

## Les signaux d'alerte
- CPM qui double : saturation ou saison (Q4 : +40 à 80 %).
- ROAS qui baisse avec un MER stable : problème d'attribution, pas de performance.
- Compte restreint : lisez la politique, faites appel, et préparez un deuxième compte publicitaire **dans le même Business Manager** (jamais un faux compte).

## Objectif de palier 3
MER ≥ 2,5, 30 à 50 commandes/jour, 5 nouveaux créatifs/semaine, 15 % de budget en reciblage.

> **Action :** rédigez votre plan de scaling pour les 14 prochains jours avec des paliers de budget et vos critères de coupe.`,
        resources: [["Plan de scaling 14 jours (gabarit)", "#"], ["Guide de recours en cas de restriction de compte", "#"]],
      },
      {
        title: "Étude de cas : de 50 $ à 1 800 $ par jour en 31 jours",
        duration: 17,
        content: `## Contexte
Produit : tapis d'acupression premium, prix 69 $, bundle populaire 94 $, coût rendu 16 $, marge brute moyenne ~62 $.

## Semaine 1 — Test (dépense : 420 $)
12 créatifs, 3 angles (« douleur au réveil », « 20 minutes de calme », « l'alternative au massage à 90 $ »). Résultats au jour 6 : angle 3 valide avec CPA 34 $, CTR 2,4 %, 9 achats. Angles 1 et 2 coupés.

## Semaine 2 — Consolidation (dépense : 1 100 $)
Budget +25 % tous les 2 jours. 6 nouveaux créatifs sur l'angle 3 (2 UGC, 2 statiques, 2 démonstrations). CPA stable à 31 $. MER 2,8.

## Semaine 3 — Horizontal (dépense : 3 900 $)
Nouvelle campagne à 300 $/jour avec l'ensemble gagnant. Lookalike 2 % des acheteurs. Reciblage à 12 % du budget. CPA 36 $ (acceptable), MER 2,6.

## Semaine 4 — Palier 3 (dépense : 1 800 $/jour)
Deux campagnes principales, une usine à créatifs (7 nouveaux/semaine), SMS et courriels (module 10) qui apportent 22 % des ventes sans publicité. MER global 3,1. Profit net mensuel : ~19 000 $.

## Ce qu'il faut retenir
Le produit n'a pas changé. L'angle 3 a tout changé, puis la discipline de budget et la production continue de créatifs ont fait le reste.

> **Action :** comparez votre plan de scaling à cette chronologie et ajustez vos paliers.`,
        resources: [["Chronologie détaillée avec captures du Gestionnaire (PDF)", "#"]],
      },
    ],
    quiz: {
      title: "Quiz — Module 7",
      questions: [
        { q: "Quel élément a le plus de poids dans le résultat d'une campagne Meta en 2026 ?", options: ["Le ciblage par intérêts", "Le créatif", "L'heure de lancement", "Le nombre d'ensembles"], answer: 1, why: "Le créatif est le ciblage : il détermine le taux d'action estimé et donc le coût." },
        { q: "De combien augmente-t-on un budget en scaling vertical ?", options: ["×2 chaque jour", "20 à 30 % toutes les 48 à 72 h", "10 % par mois", "On ne touche jamais au budget"], answer: 1, why: "Un saut trop grand réinitialise la phase d'apprentissage et dégrade le CPA." },
        { q: "Un CTR élevé mais aucun ajout au panier indique un problème de…", options: ["Créatif", "Page produit ou prix", "Pixel", "Fréquence"], answer: 1, why: "Les gens cliquent (le créatif fonctionne) mais ne passent pas à l'action sur la page." },
        { q: "Quelle part du budget est recommandée pour le reciblage ?", options: ["0 %", "10 à 15 %", "50 %", "100 %"], answer: 1, why: "Le reciblage est efficace mais limité par la taille de l'audience chaude." },
      ],
    },
  },
];
