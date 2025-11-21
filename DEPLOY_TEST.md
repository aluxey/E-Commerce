# Déployer la version de test (Stripe / Supabase)

Ce guide explique comment pousser la version de test pour toi et tes proches. Il couvre la base de données Supabase, l’API Express et le front Vite.

## 1. Prérequis
- Compte Stripe avec clés **test** (`sk_test…` / `pk_test…`).
- Projet Supabase (tables créées) + clé **service_role** (backend) + clé **anon** (front).
- Node 18+ disponible sur la plateforme d’hébergement.
- Stripe CLI (facultatif) si tu veux tester les webhooks en local.

## 2. État du code (check rapide)
- API Express (`api/`) attend `SUPABASE_SERVICE_ROLE_KEY` et `STRIPE_SECRET_KEY` (clé secrète test). CORS via `CLIENT_ORIGIN`.
- Front Vite (`client/`) utilise `VITE_API_URL` pour joindre l’API et `VITE_STRIPE_PUBLISHABLE_KEY` test.
- RLS en place sur Supabase : l’API doit être côté serveur (service_role) pour créer les commandes.
- Webhook Stripe gère `payment_intent.succeeded/failed` et met à jour `orders.status`.
- Admin : la lecture des commandes nécessite un user avec `role = 'admin'` (cf. §4).

## 3. Variables d’environnement
### API (`api/.env`)
```
PORT=3000
CLIENT_ORIGIN=https://ton-front-test.app
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # après config du webhook
SUPABASE_URL=https://<ton-projet>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # clé service_role
```

### Front (`client/.env`)
```
VITE_SUPABASE_URL=https://<ton-projet>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...          # clé anon
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://ton-api-test.app
```

## 4. Base de données Supabase
1) Exécute `Database/BDD_struct.sql` puis `Database/RLS.sql` dans le SQL Editor.  
2) (Optionnel) `Database/SEED.sql` pour des données de démo.  
3) Donner le rôle admin à ton compte de test pour l’interface admin :
```sql
update public.users set role = 'admin' where email = 'ton-email@test.com';
```

## 5. Déployer l’API (ex. Render / Railway / Vercel functions Node)
- Crée un service Node, pointe vers le dossier `api/`.
- Commande de build : `npm install` (pas de build).  
- Commande de démarrage : `npm run start`.  
- Renseigne toutes les variables du §3 (API).  
- Expose le port 3000 (ou celui fourni par la plateforme) et note l’URL publique, ex. `https://ton-api-test.app`.
- Vérifie : `GET /api/health` doit répondre `{ ok: true }`.

## 6. Déployer le front (ex. Netlify / Vercel / Cloudflare Pages)
- Dossier : `client/`.
- Commande de build : `npm install && npm run build`.
- Dossier de sortie : `dist`.
- Ajoute les variables du §3 (Front) en pointant `VITE_API_URL` vers l’URL publique de l’API.

## 7. Webhook Stripe
- En local : `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` puis mets le `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.
- En ligne : crée un endpoint webhook Stripe vers `https://ton-api-test.app/api/stripe/webhook` (événements `payment_intent.succeeded` et `payment_intent.payment_failed`). Copie le secret dans l’API.

## 8. Recette de bout en bout (test)
- Se connecter avec un user (clé anon côté front) et ajouter un produit avec variante au panier.
- Payer avec une carte test Stripe : `4242 4242 4242 4242`, date future, CVC 123.
- Vérifier la redirection `/payment-success` et que la commande passe à `paid` après webhook.
- Ouvrir l’admin (user rôle admin) : la commande s’affiche avec lignes, variantes, total. Tester le changement de statut.

## 9. Points de vigilance
- Ne jamais exposer la clé `service_role` côté front.
- Vérifie `CLIENT_ORIGIN` (API) et `VITE_API_URL` (front) selon l’URL déployée.
- Reste en clés **test** tant que tu n’ouvres pas au public. Passe en `sk_live/pk_live` uniquement après validation. 
