-- Reset complet de la base e-commerce (schéma public uniquement)
-- ⚠️ Détruit toutes les données avant de rejouer la structure/RLS/seed.

-- 1) Drop des tables dépendantes d'abord (order_items dépend de item_variants, etc.)
drop table if exists public.order_items cascade;
drop table if exists public.payments cascade;
drop table if exists public.orders cascade;
drop table if exists public.item_ratings cascade;
drop table if exists public.item_variants cascade;
drop table if exists public.item_images cascade;
drop table if exists public.item_colors cascade;
drop table if exists public.items cascade;
drop table if exists public.categories cascade;
drop table if exists public.colors cascade;
drop table if exists public.users cascade;
drop table if exists public.stripe_events cascade;

-- 2) Drop des fonctions utilitaires/contraintes (elles seront recréées ensuite)
drop function if exists public.require_item_color_trg() cascade;
drop function if exists public.assert_item_has_color(bigint) cascade;
drop function if exists public.set_updated_at() cascade;

-- Note: les extensions (pgcrypto, etc.) sont conservées.
