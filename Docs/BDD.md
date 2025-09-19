
# 📦 Base de données

Aperçu des tables principales utilisées par la boutique Supabase.

## `items`

- `id` — identifiant
- `name`, `description` — infos produit
- `base_price` — prix de base en centimes
- `image_url` — URL d’illustration (Supabase Storage)
- `created_at` — date d’ajout

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

- `order_id` + `item_variant_id` — clé composée
- `quantity`
- `customization` — champ JSON libre

## Sécurité (RLS)

Les règles de Supabase limitent la lecture/écriture selon `auth.uid()` et le
rôle de l’utilisateur.

## Fichiers SQL

- `Database/bd.sql` — création des tables
- `Database/populate.sql` — exemples de données
- `Database/migrations/20241017_variants_overhaul.sql` — migration renommage taille/prix et contraintes
- `Database/scripts/backfill_variants_from_items.sql` — génération de variantes depuis `items.sizes/colors`
