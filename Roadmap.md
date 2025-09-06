# 🛠️ Roadmap E-Commerce – Todolist

## Phase 1 — Fondations

* [ ] Créer fichier `.env` avec toutes les variables nécessaires (Supabase, Stripe, etc.).
* [ ] Ajouter ESLint + Prettier pour garder un code propre.
* [ ] Installer et configurer Pino pour les logs.
* [ ] Mettre en place client Supabase côté **admin (server)** et côté **browser (front)**.

---

## Phase 2 — Base de données & sécurité

* [ ] Ajouter tables :

  * `orders` (commandes)
  * `order_items` (lignes de commande)
  * `payments` (paiements Stripe)
  * `item_variants` (déclinaisons produit)
  * `stripe_events` (idempotence webhook)
* [ ] Ajouter trigger pour recalcul automatique du total d’une commande.
* [ ] Activer **RLS** (Row Level Security) pour toutes les tables.
* [ ] Écrire les policies :

  * un utilisateur ne voit que ses commandes,
  * un admin voit tout.

---

## Phase 3 — Panier & commandes (avant paiement)

* [ ] Gérer un **cart localStorage** pour les invités.
* [ ] Quand l’utilisateur se connecte → synchroniser le cart dans un `order` en `draft`.
* [ ] API côté serveur :

  * `POST /orders` → créer une commande draft.
  * `POST /orders/:id/items` → ajouter/supprimer/modifier un produit dans la commande.
* [ ] Vérifier stock et figer prix (`unit_price_cents`) à chaque ajout.

---

## Phase 4 — Paiement Stripe Checkout

* [ ] API `POST /api/checkout` :

  * Vérifie commande (`draft` ou `pending`).
  * Met la commande en `pending`.
  * Crée une **Checkout Session Stripe** (line\_items basés sur la DB).
  * Sauvegarde la session dans `payments`.
* [ ] Front → bouton “Payer” qui appelle `/api/checkout` et redirige vers Stripe.
* [ ] Pages de retour :

  * `success` (commande validée)
  * `cancel` (retour panier)

---

## Phase 5 — Webhook Stripe

* [ ] Créer route `POST /api/stripe/webhook` avec **raw body** (pas de `express.json()`).
* [ ] Vérifier la **signature Stripe** avec `STRIPE_WEBHOOK_SECRET`.
* [ ] Gérer événements :

  * `checkout.session.completed` → passer commande en `paid`, mettre à jour `payments`, décrémenter stock.
  * `payment_intent.payment_failed` → remettre commande en `draft` et marquer paiement `failed`.
* [ ] Stocker l’`event.id` dans `stripe_events` pour éviter les doublons.

---

## Phase 6 — Interface Admin

* [ ] CRUD Produits + variantes + images (upload via Supabase Storage).
* [ ] Liste des commandes avec filtres par statut/date.
* [ ] Détail commande (lignes, total, état, lien Stripe).
* [ ] Actions admin : changer statut (`paid → fulfilled`), déclencher remboursement (lien Stripe Dashboard au début).
* [ ] Dashboard avec KPIs :

  * CA des 7 derniers jours
  * nombre de commandes
  * panier moyen

---

## Phase 7 — Observabilité & tests

* [ ] Ajouter validation **zod** pour toutes les requêtes d’API.
* [ ] Écrire tests unitaires : calcul des totaux, mapping des line\_items.
* [ ] Écrire tests API : `/checkout` (vérifie que le montant correspond), webhook.
* [ ] Écrire test E2E : ajouter un produit → payer → vérifier que la commande passe en `paid`.
* [ ] Intégrer CI (GitHub Actions) : lint + tests + build à chaque PR.
* [ ] Optionnel : configurer Sentry pour suivre les erreurs en prod.

---

## Phase 8 — Déploiement

* [ ] Déployer backend (Railway/Render/Fly.io).
* [ ] Ajouter variables d’env en prod.
* [ ] Configurer Stripe Webhook en mode live.
* [ ] Smoke test : faire un paiement réel de 1 € → vérifier passage en `paid`.

---

## Phase 9 — (À traiter plus tard)

* [ ] Stripe Tax pour TVA Allemagne/France.
* [ ] Pages légales : CGV, Mentions légales, Politique de confidentialité.
* [ ] Fonctionnalités RGPD (export/suppression de données).
* [ ] Bannière cookies si tracking/analytics. 
