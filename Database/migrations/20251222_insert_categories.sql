-- Migration: Insert product categories
-- À exécuter dans Supabase SQL Editor

-- 1. Catégorie principale: Körbe (baskets)
INSERT INTO public.categories (name, parent_id) VALUES ('Körbe', NULL);

-- Sous-catégories de Körbe
INSERT INTO public.categories (name, parent_id)
SELECT 'Ovale Körbe', id FROM public.categories WHERE name = 'Körbe' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Runde Körbe', id FROM public.categories WHERE name = 'Körbe' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Eckige Körbe', id FROM public.categories WHERE name = 'Körbe' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Körbe mit Deckel', id FROM public.categories WHERE name = 'Körbe' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Tierkörbe', id FROM public.categories WHERE name = 'Körbe' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Tabletts', id FROM public.categories WHERE name = 'Körbe' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Individualisierte Körbe', id FROM public.categories WHERE name = 'Körbe' AND parent_id IS NULL;


-- 2. Catégorie principale: Bestseller
INSERT INTO public.categories (name, parent_id) VALUES ('Bestseller', NULL);

-- Sous-catégories de Bestseller
INSERT INTO public.categories (name, parent_id)
SELECT 'Platzsets', id FROM public.categories WHERE name = 'Bestseller' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Handytaschen', id FROM public.categories WHERE name = 'Bestseller' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Shoppingbags', id FROM public.categories WHERE name = 'Bestseller' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Tee- & Windlichter', id FROM public.categories WHERE name = 'Bestseller' AND parent_id IS NULL;


-- 3. Catégorie principale: Kollektionen
INSERT INTO public.categories (name, parent_id) VALUES ('Kollektionen', NULL);

-- Sous-catégories de Kollektionen
INSERT INTO public.categories (name, parent_id)
SELECT 'Winter- & Weihnachtskollektion', id FROM public.categories WHERE name = 'Kollektionen' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Osterkollektion', id FROM public.categories WHERE name = 'Kollektionen' AND parent_id IS NULL;

INSERT INTO public.categories (name, parent_id)
SELECT 'Herbstkollektion', id FROM public.categories WHERE name = 'Kollektionen' AND parent_id IS NULL;
