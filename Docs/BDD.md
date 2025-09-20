
# 📦 Base de données

Aperçu des tables principales utilisées par la boutique Supabase.

## `items`

- `id` — identifiant
- `name`, `description` — infos produit
- `price` — prix de base en euros (numeric)
- `image_url` — URL d’illustration (Supabase Storage)
- `category_id` — référence vers `categories.id`
- `sizes`, `colors` — listes d’options disponibles (text[])
- `created_at`, `updated_at`

## `item_variants`

- `id`, `item_id`
- `color`, `size`
- `stock` — quantité disponible (>= 0)
- `price` — prix variant (obligatoire, en euros)

Chaque produit peut proposer plusieurs variantes.

## `users`

- `id` (lié à `auth.users.id`)
- `email`
- `role` — `client` ou `admin`
- `created_at`

Supabase Auth gère la connexion, cette table stocke le rôle.

## `orders`

- `id`, `user_id`
- `created_at`

## `order_items`

- `id` — identifiant
- `order_id`, `item_id`, `variant_id`
- `quantity`, `unit_price`, `total_price` (généré), `customization` (jsonb)

## Sécurité (RLS)

Les règles de Supabase limitent la lecture/écriture selon `auth.uid()` et le
rôle de l’utilisateur.

## Fichiers SQL

- `Database/BDD_struct.sql` — création des tables et index
- `Database/RLS.sql` — règles RLS et policies
- `Database/SEED.sql` — exemples de données (idempotent)
- `Database/delete_BDD.sql` — suppression complète (reset)
