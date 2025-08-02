## TODO: Intégration Stripe

### 1. Préparation
- [ ] Créer un compte Stripe (mode test d’abord).
- [ ] Ajouter et configurer les variables d’environnement :
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (plus tard, après avoir configuré le webhook)
- [ ] Étendre le schéma Supabase :
  - Ajouter `payment_intent_id` sur le panier / entité appropriée.
  - Créer une table `orders` avec: `id`, `status` (`pending`/`paid`/`failed`), `amount`, `stripe_payment_intent_id`, timestamps.

### 2. Backend sécurisé
- [ ] Ajouter un service backend (Edge Function ou petit serveur Node/Express) pour ne pas exposer la clé secrète.
- [ ] Implémenter endpoint `POST /create-payment-intent` :
  - Valider le panier et recalculer le montant côté serveur.
  - Créer un `PaymentIntent` via l’API Stripe.
  - Retourner `client_secret` au front.
- [ ] Implémenter endpoint `POST /webhook` :
  - Recevoir et vérifier la signature Stripe.
  - Gérer les événements clés (`payment_intent.succeeded`, `payment_intent.payment_failed`).
  - Mettre à jour la commande (`orders`) en conséquence.
- [ ] Enregistrer le `payment_intent_id` / associer la commande pour réconciliation.

### 3. Frontend
- [ ] Installer et initialiser Stripe.js (`@stripe/stripe-js`).
- [ ] Appeler `/create-payment-intent` pour obtenir le `client_secret`.
- [ ] Afficher le formulaire de paiement via `Elements` + `PaymentElement`.
- [ ] Confirmer le paiement avec `stripe.confirmPayment(...)`.
- [ ] Gérer les erreurs utilisateurs (cartes refusées, réseau, double soumission).
- [ ] Rediriger ou rafraîchir l’état après paiement en fonction de la réponse / webhook.

### 4. Réconciliation et logique métier
- [ ] Créer / mettre à jour une commande (`order`) seulement après confirmation de paiement réussi (via webhook).
- [ ] Gérer les échecs de paiement (`payment_intent.payment_failed`) et prévoir des relances ou messages.

### 5. Tests
- [ ] Tester avec les cartes de test Stripe.
- [ ] Simuler les webhooks en local (`stripe-cli` ou équivalent).
- [ ] Tester les cas limites :
  - Paiement interrompu / reprise avec même `PaymentIntent`.
  - Montant modifié après création (recréation ou mise à jour du `PaymentIntent`).
  - Webhook manqué / retry.

### 6. Déploiement
- [ ] Déployer le backend (Vercel / Railway / Supabase Edge Function, etc.).
- [ ] Ajouter les clés live dans l’environnement de production.
- [ ] Configurer les webhooks Stripe en production (URL de `/webhook`).
- [ ] Vérifier la réception et traitement des événements webhooks.

### 7. Améliorations possibles
- [ ] Support des abonnements via `Subscription` / `Customer`.
- [ ] Sauvegarde de moyens de paiement (`SetupIntent`) pour reuse.
- [ ] Passage à Stripe Checkout pour un MVP encore plus rapide.
- [ ] Ajout d’emails de confirmation / notifications.
- [ ] Monitoring / alerting sur webhooks échoués et incohérences.
- [ ] Sécurisation additionnelle : validation CSRF, limitation des montants côté front, idempotence.

