# Othmani CPA — site web

Site bilingue (FR à la racine, EN sous `/en`) d'Othmani CPA Inc., Saint-Léonard.
Next.js 16 (App Router) + Tailwind CSS 4, **généré en statique** (`out/`) : chaque page est du HTML complet, lisible sans JavaScript.

## Commandes

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # génère le site statique dans out/
npm run check      # contrôle SEO du site généré (title < 60, description < 155, 1 H1, canonical, hreflang, alt, JSON-LD)
npm run images     # régénère les images provisoires (héros, portrait temporaire, Open Graph)
```

Le dossier `out/` se dépose tel quel sur n'importe quel hébergeur statique (Netlify, Cloudflare Pages, Vercel, o2switch…).

## ⚠️ À compléter avant la mise en ligne

Tout se règle dans **`lib/site.ts`** (un champ vide est masqué du site et du Schema.org, jamais inventé) :

| Champ | Quoi |
|---|---|
| `phone`, `mobile`, `email` | Coordonnées tirées de la carte professionnelle (514 448-0924, 514 299-2592, zouhaier@othmanicpa.com) |
| `hours`, `hoursLabel` | Heures d'ouverture — **valeurs provisoires** (lun-ven 9 h-17 h) à confirmer |
| `url` | Domaine définitif (sert aux canonical, hreflang, sitemap) |
| `geo` | Coordonnées GPS approximatives du 8065, boul. Viau — à vérifier |
| `portalEnabled`, `clientPortalUrl` | Espace client Pilote Fiscal : **désactivé** tant que l'application n'est pas prête. Le jour du lancement, passer `portalEnabled` à `true` et indiquer le lien : boutons, section d'accueil et mentions réapparaissent. |
| `googleReviewsUrl`, `googleWriteReviewUrl` | Fiche Google et lien « Laisser un avis » |
| `stats` | Chiffres clés affichés sur l'accueil (1 000+ clients, 300+ entreprises). ⚠️ Doivent rester exacts et vérifiables (règles de publicité de l'Ordre des CPA). Les mêmes chiffres apparaissent aussi en toutes lettres dans `content/pages.ts` (page À propos et description de l'accueil). |
| `formEndpoint` | Réception des formulaires (Formspree, Basin, Netlify Forms…) — sans lui, les formulaires affichent un message de repli |
| `heroVideo` | Vidéo du héros (`/public/media/…`, WebM + MP4, < 3 Mo, sans son). Tant qu'elle est vide, le héros affiche un diaporama animé de trois images. Dès qu'elle est renseignée, la vidéo se pose par-dessus sur ordinateur. |

Autres fichiers :

- **Avis Google** : `content/reviews.ts`. Copier **mot pour mot** de vrais avis publiés sur Google. Liste vide = la section affiche seulement les boutons vers Google. Aucun avis, chiffre ou témoignage inventé (règles de publicité de l'Ordre des CPA).
- **Dates fiscales** : `content/deadlines.ts`, à prolonger chaque année. Le HTML contient les dates du jour de génération ; le navigateur recalcule les « 3 prochaines ».
- **Rappels par courriel** : le formulaire recueille l'adresse avec consentement explicite ; l'envoi des rappels se fait dans l'outil d'infolettre choisi.

## Structure

```
app/(fr)/…            pages françaises (layout lang="fr-CA")
app/(en)/en/…         pages anglaises (layout lang="en-CA")
app/sitemap.ts        sitemap.xml avec alternatives hreflang
app/robots.ts         robots.txt
content/concerns.ts   les 8 préoccupations (FR + EN) : question H1, réponse courte, explication, 5 FAQ
content/pages.ts      textes et métadonnées des autres pages
content/ui.ts         libellés de l'interface FR + EN
lib/routes.ts         table des URL FR ↔ EN (hreflang, sélecteur de langue)
lib/schema.ts         AccountingService + LocalBusiness, FAQPage, BreadcrumbList, Person
components/           gabarits et composants (Clara, bannière Loi 25, formulaires…)
```

| FR | EN |
|---|---|
| `/` | `/en/` |
| `/particuliers/` · `/entreprises/` | `/en/individuals/` · `/en/businesses/` |
| `/impots-particuliers/` | `/en/personal-taxes/` |
| `/lettre-impot/` | `/en/tax-letter/` |
| `/travailleur-autonome/` | `/en/self-employed/` |
| `/grands-changements/` | `/en/life-changes/` |
| `/demarrer-entreprise/` | `/en/start-a-business/` |
| `/taxes-tps-tvq/` | `/en/gst-qst/` |
| `/etats-financiers/` | `/en/financial-statements/` |
| `/plusieurs-entreprises/` | `/en/multiple-companies/` |
| `/calendrier-fiscal/` | `/en/tax-calendar/` |
| `/outils/` | `/en/tools/` |
| `/a-propos/` · `/contact/` · `/confidentialite/` | `/en/about/` · `/en/contact/` · `/en/privacy/` |

## Fonctionnalités

- **Outils gratuits** (`/outils`, aussi intégrés aux pages concernées) : liste de documents personnalisée et imprimable, calculatrice TPS/TVQ (ajouter / retirer), vérification du seuil de 30 000 $. Tout reste dans le navigateur.
- **Ajouter à mon agenda** : fichier .ics par date ou pour tout le calendrier, avec rappel 3 jours avant.
- **Clara** répond directement en cherchant dans les 40 questions fréquentes du site, puis renvoie vers la page complète ou l'équipe.
- **Pages de préoccupation** : sommaire collant avec section active, barre de progression de lecture, temps de lecture, date de révision par un CPA (`REVIEWED` dans `components/ConcernPage.tsx`), bouton Imprimer.
- **Sous-menu** Particuliers / Entreprises sur ordinateur, au survol et au clavier.
- **Verre dépoli** (glassmorphism) avec repli opaque pour les navigateurs qui ne le gèrent pas.

- **Image d'accueil** : `public/images/saint-leonard-*.webp`, générée avec Higgsfield (illustration d'un boulevard de l'est de Montréal, pas une photo de l'immeuble réel).

- **Actualités économiques** (accueil) : titres lus automatiquement dans les fils officiels (Banque du Canada, Statistique Canada, ARC, Finances Canada), plus le taux directeur et le dollar américain. Sur Vercel, l'accueil se régénère au plus une fois par heure, sans intervention. Sources et réglages : `lib/news.ts`. `npm run build:static` produit toujours un export 100 % statique (la section affiche alors les liens vers les sources).
- **Avis Google** : la section est retirée de l'accueil pour l'instant (composant `Reviews` conservé dans `components/home.tsx`).

## Choix techniques

- **Loi 25** : aucun témoin optionnel sans consentement ; « Tout refuser » aussi visible que « Tout accepter » ; choix modifiables en tout temps (pied de page) ; carte OpenStreetMap chargée seulement sur clic ; polices hébergées localement (aucun appel à Google Fonts).
- **Clara** : assistante d'orientation 100 % locale (mots-clés → bonne page ou équipe). Aucun serveur, aucun message enregistré, ne donne pas de conseils fiscaux. Pour la brancher plus tard à une IA, remplacer la fonction `answer()` de `components/Clara.tsx`.
- **Performance mobile** : images WebP, `lazy` sous la ligne de flottaison, vidéo jamais chargée sur téléphone, en mode « économie de données » ou si l'utilisateur réduit les animations.
- **Accessibilité** : contraste AA, lien d'évitement, focus visible, menu mobile et FAQ en `<details>` (clavier, sans JS), `prefers-reduced-motion` respecté. Audit axe-core : 0 violation.
- **Contenu fiscal** : informations générales, prudentes, avec mention « ne remplace pas un avis adapté ». À relire par Zouhaier avant publication.
