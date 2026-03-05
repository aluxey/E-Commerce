# TODO - Deployment Readiness (Pro)

Date: 2026-03-05
Derniere mise a jour: 2026-03-05 (API security pass)

## Derniers changements integres

- Footer nettoye et liens corriges vers des pages reelles.
- Hash links homogeneises (`#faq`, `#about-me`) sur variantes desktop/mobile.
- Documentation regroupee dans `Docs/` avec archivage des anciens snapshots.
- API securisee: auth admin, rate limiting, CORS durci, headers de securite.
- Validation stricte ajoutee sur `checkout` et `contact` + format d'erreur unifie.
- `api/.env.example` ajoute avec variables de rate-limit.
- Tests API de securite ajoutes (`npm --prefix api test`).

## Etat des lieux rapide

Points positifs:
- Build client OK (`npm --prefix client run build`).
- Structure documentation assainie et centralisee.
- Base API presente avec endpoint health (`/api/health`).
- RLS/Supabase et separation client/API en place.

Points critiques avant deploiement pro:
- Lint en echec (8 erreurs, 4 warnings) sur le client.
- Couverture de test encore insuffisante (pas d'integration DB/webhook, pas d'E2E).
- Pas de CI/CD pipeline versionnee dans `.github/workflows`.
- Flux paiement incoherent: creation PaymentIntent Stripe mais redirection SumUp statique.
- `client/.env.example` encore manquant.

---

## P0 - Blocants go-live (a faire en premier)

- [x] Securiser l'API admin
  - [x] Proteger `/api/admin/cleanup-orders` via auth + role admin cote serveur.
  - [x] Ajouter rate limiting sur `/api/*`.
  - [x] Durcir CORS en production + ajouter headers de securite.
  - [x] Externaliser les seuils de rate-limit via variables d'environnement.
  - Done: un utilisateur non admin recoit `401/403` sur endpoint admin.

- [ ] Stabiliser le flux de paiement
  - [ ] Choisir une seule strategie: Stripe complet OU SumUp complet.
  - [ ] Supprimer le flux mixte actuel (ordre Stripe + redirection SumUp).
  - [ ] Garantir la reconciliation paiement -> commande (webhook/idempotence).
  - Done quand: une commande payee passe a `paid` de facon deterministe, sans intervention manuelle.

- [ ] Corriger la qualite minimale de code
  - [ ] Passer `npm --prefix client run lint` a zero erreur.
  - [ ] Traiter les warnings hooks (deps manquantes) prioritaires.
  - Done quand: lint vert en local + CI.

- [ ] Ajouter les environnements standardises
  - [x] Creer `api/.env.example` avec variables obligatoires et options.
  - [ ] Creer `client/.env.example`.
  - [ ] Aligner le README avec les templates reellement presents.
  - Done quand: un nouveau dev peut lancer le projet sans guess.

---

## P1 - Fiabilite et industrialisation

- [ ] Mettre en place la CI
  - [ ] Workflow GitHub Actions: install, lint, build.
  - [ ] Ajouter checks obligatoires sur PR.
  - Done quand: aucune PR ne merge sans pipeline verte.

- [ ] Introduire des tests critiques
  - [x] Base de tests API securite (validation payload + rate-limit).
  - [ ] Unit tests services/formatters/hooks critiques (client).
  - [ ] Integration tests API checkout/webhook/contact avec mocks DB/Stripe.
  - [ ] E2E minimal: login -> panier -> checkout -> confirmation.
  - Done quand: couverture de base sur parcours business principaux.

- [x] Renforcer validation et robustesse API
  - [x] Validation stricte des payloads checkout/contact.
  - [x] Limites explicites (quantites max, tailles payload, types MIME upload).
  - [x] Gestion d'erreurs standardisee (codes + messages).
  - Done: payload invalide renvoie 4xx predictible, jamais 500 sur ces endpoints.

- [ ] Observabilite
  - [ ] Logging structure (request id, route, status, duree).
  - [ ] Error tracking (Sentry ou equivalent) client + API.
  - [ ] Monitoring uptime/latence/erreurs.
  - Done quand: incident reproductible en moins de 10 min.

---

## P2 - Niveau "pro" produit et operations

- [ ] Performance front
  - [ ] Traiter warning chunk > 500k (split manuel, lazy strategique).
  - [ ] Optimiser images (compression, formats modernes, responsive sizes).
  - Done quand: Lighthouse perf mobile >= 80 sur pages principales.

- [ ] Accessibilite
  - [ ] Audit a11y (navigation clavier, contrastes, labels, focus).
  - [ ] Corriger parcours checkout/admin.
  - Done quand: zero erreur critique axe sur pages core.

- [ ] Conformite et legal
  - [ ] Verifier coherence textes legaux + flux paiement reel.
  - [ ] Politique retention des donnees + procedure suppression compte.
  - Done quand: checklist legal validee pour marche cible.

- [ ] Runbook de production
  - [ ] Procedure release (versioning, rollback, migrations DB).
  - [ ] Procedure incident (paiement ko, webhook ko, db ko).
  - Done quand: exploitation possible sans dependre d'une seule personne.

---

## Proposition de plan 30 jours

Semaine 1:
- Securite API (fait) + lint client vert + `client/.env.example`.

Semaine 2:
- P0 paiement unifie + tests integration checkout/webhook.

Semaine 3:
- CI complete + E2E smoke + observabilite minimale.

Semaine 4:
- perf/a11y + runbook + pre-prod puis go-live.
