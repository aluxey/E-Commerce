# Audit Projet - 2026-03-15

Date: 2026-03-15

Cet audit consolide l'etat du projet en se basant sur le code actuel, `Docs/reference/deployment_readiness_todo.md` et `.opencode/todo.md`.

## Vue d'ensemble

Le projet est globalement sur une bonne base produit:

- separation `client/` / `api/` / `Database/` claire
- auth Supabase, admin, catalogue, commandes et Stripe deja en place
- documentation centralisee dans `Docs/`
- lint client, build client et tests API de base disponibles

Les principaux risques restants ne sont plus des "features manquantes" mais des sujets de fiabilite, de coherence entre sources de verite et de maintenabilite.

## Forces actuelles

- Flux checkout Stripe integre et nofication email boutique en place.
- API deja durcie (auth admin, rate limits, validation payloads, webhook idempotent).
- Structure de services cote client deja amorcee pour plusieurs domaines.
- Backlog metier et backlog technique deja documentes.

## Risques et constats prioritaires

### P0 - A traiter avant une mise en production sereine

1. **Schema/documentation/database drift**
   - Le schema SQL, les migrations et la documentation BDD ne racontent pas toujours la meme histoire.
   - Impact: un nouvel environnement peut diverger du comportement attendu par le front.

2. **Backend trop concentre dans `api/src/server.js`**
   - Le fichier melange bootstrap serveur, auth, validation, checkout, webhook, contact et emails.
   - Impact: forte surface de regression et tests d'integration difficiles a cibler.

3. **Couverture de tests business trop faible**
   - Les contrats de securite existent, mais pas encore de tests d'integration sur checkout/webhook/contact ni de tests client.
   - Impact: les regressions paiement et commandes restent possibles.

4. **Pas de CI/CD versionnee**
   - Aucun workflow automatise pour lint/test/build.
   - Impact: la qualite depend encore d'une verification manuelle locale.

### P1 - A traiter pour rendre le projet maintenable a moyen terme

5. **Pages/composants trop volumineux**
   - `client/src/pages/ProductDetail.jsx`, `client/src/pages/Home.jsx` et `client/src/components/Admin/ProductManager.jsx` portent trop de responsabilites.
   - Impact: iteration plus lente et refactorings plus risqués.

6. **Bordures d'architecture parfois poreuses**
   - Certaines pages publiques consomment des services admin ou contournent la couche de service.
   - Impact: conventions moins lisibles et duplication de logique.

7. **Nommage et conventions de donnees heterogenes**
   - `variantId` / `variant_id`, `cart` / `cartItems`, erreurs booleennes ou string selon les modules.
   - Impact: plus de code defensif et plus de bugs subtils.

8. **Perf front encore perfectible**
   - Build OK mais warning chunk > 500 kB.
   - Images nombreuses et lourdes.
   - Impact: perf mobile et temps de chargement fragiles.

### P2 - Qualite produit et operations

9. **A11y non encore auditée systematiquement**
   - Pas d'audit axe-core ni sweep complet clavier/focus.

10. **Runbook et observabilite manquants**
   - Logs encore peu structures, pas d'error tracking, pas de procedure incident/release formalisee.

## Nettoyage deja applique pendant cet audit

- Suppression de `Server/Stripe.js` (legacy Deno, remplace par `api/src/server.js`).
- Suppression de `client/src/components/ProductForm.jsx` (ancien formulaire non utilise).
- Nettoyage du `package.json` racine pour supprimer des dependances inutilisees.
- Suppression de `nodemailer` de `api/package.json` au profit de `resend` uniquement.
- Mise a jour du `README.md` pour aligner la stack et le bootstrap reel.
- Mise a jour de `Docs/database/overview.md` pour retirer les references les plus obsoletes sur le modele catalogue.

## Roadmap recommandee

### P0 - Fiabilite de base

1. Reconciler `Database/BDD_struct.sql`, `Database/RLS.sql`, les migrations et `Docs/database/overview.md`.
2. Decouper `api/src/server.js` en modules:
   - `middleware/`
   - `routes/`
   - `services/`
   - `lib/`
   - `emails/`
3. Ajouter une CI minimale:
   - `npm --prefix api test`
   - `npm --prefix client run lint`
   - `npm --prefix client run build`
4. Ajouter des tests d'integration API pour:
   - checkout
   - webhook Stripe
   - contact

### P1 - Maintenabilite front

5. Refactorer `ProductManager` en sous-composants et services plus fins.
6. Refactorer `ProductDetail` en `ProductGallery`, `ProductInfo`, `ProductReviews`.
7. Harmoniser les conventions de donnees et erreurs.
8. Continuer l'externalisation des acces Supabase dans `client/src/services/`.

### P2 - Qualite produit

9. Ajouter Vitest + Testing Library cote client.
10. Traiter la performance front (split chunks, images, lazy loading).
11. Faire un audit accessibilite complet.
12. Ajouter observabilite et runbook de production.

## Prochaines etapes metier recommandees

En se basant sur `.opencode/todo.md`, les prochains chantiers utiles cote business sont:

1. remplacer les images categories
2. ajouter les `Pflegehinweise`
3. ameliorer la galerie mobile produit
4. finaliser la vue collection par categories
5. ajouter un bloc "produits disponibles maintenant"

## Conclusion

Le projet n'est plus au stade "prototype fragile", mais il n'est pas encore totalement industrialise.
La priorite n'est pas d'ajouter beaucoup de nouvelles features techniques: il faut d'abord consolider les sources de verite, les tests et l'architecture backend, puis accelerer sur le backlog metier visible pour la boutique.
