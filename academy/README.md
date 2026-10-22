# The 1% — plateforme de formation e-commerce

Plateforme complète (LMS) pour vendre et livrer le programme **The 1% — Programme Élite E-commerce** à 20 000 $ US tout inclus, payable en 3 versements (5 000 / 5 000 / 10 000). Node.js ≥ 22.5, base SQLite intégrée (local) ou PostgreSQL (cloud), vidéos sur disque ou Vercel Blob, paiements Stripe.

**Production :** https://the-1-percent-three.vercel.app (Vercel, fonctions à Montréal ; base Postgres Supabase, schéma `academy` ; vidéos Vercel Blob).

L'offre commerciale est décrite dans [OFFRE.md](OFFRE.md) et affichée sur `/offre`.

## Démarrer en 30 secondes

```bash
cd academy
ADMIN_PASSWORD='un-mot-de-passe-solide' npm start     # http://localhost:3000
```

Au premier démarrage, la base est créée dans `academy/data/academy.db`, le catalogue (14 modules, 63 leçons, 15 quiz + examen final, masterclass gratuite) est chargé, et le compte admin `admin@the1percent.academy` est créé.

| Commande | Rôle |
|---|---|
| `npm start` | Lance le serveur (PORT=3000 par défaut) |
| `npm run dev` | Idem avec redémarrage automatique |
| `npm test` | 12 tests de bout en bout (inscription, achat 3×, progression, quiz, certificat, admin, téléversement) |
| `npm run seed` | Recharge le catalogue depuis `content/` sans toucher aux comptes (ajoute ce qui manque) |
| `npm run reset` | Supprime et recrée tout le contenu depuis `content/` (progrès des étudiants perdus) |

## Ce qui est inclus

**Côté public**
- Accueil (hero, carte d'offre, méthode en 3 paliers, programme, inclus, études de cas, FAQ), page d'offre imprimable (`/offre`), catalogue, page de formation avec programme détaillé et leçons en aperçu gratuit.
- Inscription, connexion, mot de passe oublié, pages Conditions et Confidentialité (gabarits Loi 25 / LPC Québec à faire valider).

**Côté étudiant**
- Tableau de bord (progression, prochaine leçon, échéancier de paiement).
- Lecteur de cours : barre latérale par module, vidéo (YouTube, Vimeo, MP4 téléversé), contenu riche en markdown, ressources, bouton « terminée », questions/commentaires par leçon.
- Quiz par module (70 %) et examen final (75 %) avec correction expliquée.
- Certificat vérifiable publiquement (`/certificat/CODE`), imprimable.
- Paiement intégral ou plan en 3 versements ; accès ouvert dès le premier versement ; relance des versements depuis le tableau de bord.

**Côté administration** (`/admin`)
- Statistiques : étudiants, encaissé, versements à venir, en retard, certificats, par formation ; export CSV.
- Étudiants : recherche, fiche (progression, commandes, quiz), inscription manuelle, versement marqué payé (virement), rôle, mot de passe.
- Contenu : création de formations, modules, leçons (éditeur markdown avec prévisualisation), quiz (JSON), fiche et prix, plan de paiement.
- Médias : **téléversement de vidéos** (MP4/WebM/MOV jusqu'à 2 Go), PDF, images ; diffusion réservée aux inscrits avec lecture en continu (Range).
- Codes promo, réglages (nom, courriel de soutien, liens Calendly et communauté).

## Ajouter les vidéos (quand elles seront prêtes)

1. `/admin/formations` → la formation → cliquez sur une leçon.
2. Glissez le fichier MP4 dans la zone « Déposez vos vidéos » (ou collez un lien YouTube non répertorié / Vimeo / Bunny Stream dans le champ Vidéo).
3. Enregistrez la leçon. La vidéo est servie à `/media/…` uniquement aux étudiants inscrits (et aux leçons en aperçu).

Pour des dizaines de gigaoctets ou une audience mondiale, hébergez les vidéos sur Bunny Stream, Vimeo ou Mux et collez le lien : le lecteur accepte toute URL d'intégration.

## Activer les paiements réels (Stripe)

1. Créez un compte Stripe et récupérez la clé secrète (`sk_live_…`).
2. Dans Stripe → Développeurs → Webhooks, ajoutez `https://votre-domaine/api/stripe/webhook` avec l'événement `checkout.session.completed` et copiez le secret de signature (`whsec_…`).
3. Lancez le serveur avec :

```bash
STRIPE_SECRET_KEY=sk_live_… STRIPE_WEBHOOK_SECRET=whsec_… BASE_URL=https://votre-domaine npm start
```

Sans ces variables, la plateforme est en **mode démonstration** : la page Stripe est remplacée par une page de paiement simulé (clairement indiquée) pour tester tout le parcours. Les versements 2 et 3 sont payés par l'étudiant depuis son tableau de bord (ou marqués payés par l'admin en cas de virement). Aucune donnée de carte ne transite par le serveur.

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | 3000 | Port d'écoute |
| `BASE_URL` | déduit de la requête | URL publique (pour les retours Stripe) |
| `ACADEMY_DB` | `academy/data/academy.db` | Fichier SQLite (ignoré si `DATABASE_URL` est défini) |
| `DATABASE_URL` | — | Connexion PostgreSQL (Supabase, Neon…) ; active le moteur Postgres |
| `BLOB_READ_WRITE_TOKEN` | — | Jeton Vercel Blob ; active les téléversements infonuagiques |
| `UPLOAD_DIR` | `academy/data/uploads` | Dossier des vidéos et fichiers |
| `MAX_UPLOAD_MB` | 2048 | Taille maximale d'un téléversement |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@the1percent.academy` / `ChangeMe-2026!` | Compte admin créé au premier démarrage |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | — | Paiements réels |

## Déploiement

### Vercel (configuration actuelle)
Le projet Vercel `the-1-percent` déploie sans lien Git : le fichier `bootstrap.mjs` (buildCommand `node bootstrap.mjs`) télécharge le dossier `academy/` de la branche GitHub indiquée par `BOOTSTRAP_REF` et produit la sortie Build Output API (fonction `api/index` + fichiers statiques). Pour redéployer après un changement : pousser sur la branche, puis créer un déploiement Vercel (tableau de bord → Redeploy, ou `vercel --prod`). Variables définies sur Vercel : `DATABASE_URL` (pooler Supabase, rôle `academy_app`), `BLOB_READ_WRITE_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODEJS_HELPERS=0`. À ajouter pour les paiements réels : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

Avec `DATABASE_URL`, le serveur utilise PostgreSQL (`pg`) et le schéma est créé automatiquement au premier démarrage. Avec `BLOB_READ_WRITE_TOKEN`, les téléversements de l'admin vont directement dans Vercel Blob (adresse longue et imprévisible, affichée seulement aux inscrits).

### Serveur classique (VPS)

Un seul processus Node, un seul fichier de base de données, un dossier de médias. Convient à un VPS (Hetzner, DigitalOcean, OVH : 5 à 12 $/mois) derrière Caddy ou Nginx pour le HTTPS, ou à Railway / Render / Fly.io avec un volume persistant pour `academy/data`. Sauvegarde = copier `academy/data`. Pour plusieurs instances ou des milliers d'étudiants simultanés, migrez la base vers Postgres (le schéma est standard) et les médias vers un stockage objet.

```bash
# Exemple systemd (extrait)
Environment=PORT=3000 BASE_URL=https://the1percent.example ADMIN_PASSWORD=… STRIPE_SECRET_KEY=… STRIPE_WEBHOOK_SECRET=…
ExecStart=/usr/bin/node --no-warnings=ExperimentalWarning /srv/academy/server.mjs
```

## Sécurité

Mots de passe hachés avec scrypt, sessions en base avec cookie HttpOnly/SameSite, protection CSRF par en-tête personnalisé, limitation des tentatives de connexion, requêtes SQL toujours paramétrées, échappement HTML côté client, médias protégés par inscription, vérification de signature des webhooks Stripe, en-têtes de sécurité. Le mot de passe de réinitialisation est consigné dans les journaux du serveur tant qu'aucun service de courriel n'est branché (à connecter : Postmark, Resend, SES).

## Structure

```
academy/
  server.mjs            serveur HTTP, API JSON, médias, statiques
  src/db.mjs            schéma SQLite (18 tables)
  src/auth.mjs          hachage, sessions, cookies, limitation
  src/payments.mjs      commandes, versements, Stripe Checkout, webhooks, simulation
  src/certificates.mjs  émission et page de certificat
  src/seed.mjs          chargement du catalogue et de l'admin
  content/              le programme : 14 modules, 63 leçons, quiz, examen, masterclass (modifiable ici ou dans l'admin)
  public/               interface (index.html, app.js, admin.js, styles.css)
  test/                 tests de bout en bout
  data/                 base et médias (ignoré par git)
```
