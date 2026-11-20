# Pilote Fiscal : application iOS et Android

Ce dossier emballe l'espace client (`/espace-client/`) dans une application native avec Capacitor.
L'application charge la version en ligne : une mise à jour du site met à jour l'application, sans repasser par les magasins.

## Ce qui est prêt

- Identifiant : `com.othmanicpa.pilotefiscal`, nom : « Pilote Fiscal ».
- Icône 1024 × 1024 : `../public/icons/icon-1024.png`.
- Connexion par code reçu par courriel (compatible application ; pas de lien à ouvrir).
- Compte de démonstration pour l'examen Apple et Google : code d'accès **0000** (données fictives).
- Fiche de magasin : `store-listing.md`.

## Ce qui ne peut se faire que sur vos comptes et vos machines

| Étape | Où | Remarque |
|---|---|---|
| Compte Apple Developer (99 $ US/an) au nom d'Othmani CPA Inc. | developer.apple.com | Numéro D-U-N-S requis pour une société |
| Compte Google Play Console (25 $ US, une fois) | play.google.com/console | Vérification d'identité de l'entreprise |
| Générer et signer l'application iOS (.ipa) | Un Mac avec Xcode | Impossible sous Linux ou Windows |
| Générer et signer l'application Android (.aab) | Android Studio | Clé de signature à conserver précieusement |

## Commandes (sur un Mac, Node 20+)

```bash
cd mobile
npm install
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios      # Xcode : choisir l'équipe, Product → Archive → Distribute App
npx cap open android  # Android Studio : Build → Generate Signed Bundle (AAB)
```

Avant l'envoi, remplacer l'adresse dans `capacitor.config.json` par le domaine définitif (www.othmanicpa.com).

## Risques à connaître avant de soumettre

- **Apple, règle 4.2 (fonctionnalité minimale)** : une application qui n'est qu'un site emballé peut être refusée. Ce qui joue en notre faveur : connexion, dépôt de documents par l'appareil photo, messagerie, suivi de dossier. Ajouter les notifications poussées renforcerait nettement le dossier.
- **Paiements** : des honoraires professionnels sont des services rendus hors de l'application ; ils peuvent être payés par Stripe (carte, Apple Pay, Google Pay) sans achat intégré Apple. Le paiement s'ouvre sur la page sécurisée de Stripe.
- **Confidentialité** : la fiche doit déclarer les données recueillies (nom, courriel, documents, messages) et pointer vers `/confidentialite/`.
- **Suppression de compte** : Apple exige qu'un utilisateur puisse demander la suppression de son compte depuis l'application. À ajouter dans l'onglet Profil avant la soumission.
