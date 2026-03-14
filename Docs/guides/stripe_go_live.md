# Guide Go-Live Stripe

Date: 2026-03-05

## 1) Variables d'environnement

### API

- `STRIPE_SECRET_KEY=sk_live_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `RESEND_API_KEY=...`
- `RESEND_FROM_EMAIL=Sabbels Handmade <orders@votre-domaine.com>`
- `EMAIL_TO=sabbelshandmade@gmail.com`
- `CLIENT_ORIGIN=https://votre-front.netlify.app`

### Client

- `VITE_API_URL=https://votre-api.example.com`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`
- `VITE_STRIPE_PUBLIC_KEY=pk_live_...`

## 2) Webhook Stripe

Endpoint backend:

- `POST /api/stripe/webhook`

Events minimum a activer dans Stripe Dashboard:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

Notes:

- Le webhook est verifie par signature (`STRIPE_WEBHOOK_SECRET`).
- L'idempotence est active via `stripe_events` (un event ne sera traite qu'une fois).

## 3) Tests de bout en bout (preprod)

1. Creer un compte client test.
2. Ajouter un produit au panier.
3. Aller au checkout Stripe.
4. Payer avec une carte test:
   - succes: `4242 4242 4242 4242`
   - 3DS: `4000 0025 0000 3155`
   - echec: `4000 0000 0000 9995`
5. Verifier:
   - statut commande en DB (`orders.status`)
   - email recu pour les paiements `succeeded`
   - `payment_intent_id` present sur la commande

## 4) Stripe CLI (local)

Installer puis lancer:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Recuperer le `whsec_...` affiche et le mettre dans `STRIPE_WEBHOOK_SECRET`.

Declencher des events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

## 5) Checklist finale avant prod

1. `npm --prefix api test`
2. `npm --prefix client run lint`
3. `npm --prefix client run build`
4. Verifier que `RESEND_FROM_EMAIL` utilise un domaine verifie (pas `resend.dev`)
5. Verifier les logs webhook apres 3 paiements reels (ou sandbox) consecutifs
6. Verifier qu'un retry webhook Stripe ne duplique pas le traitement
