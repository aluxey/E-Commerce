-- Migration: Ajouter colonne position à item_images pour gérer l'ordre des images
-- Date: 2025-01-05
-- Description: Permet le réordonnancement des images par drag & drop

-- 1. Ajouter la colonne position
ALTER TABLE public.item_images 
ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- 2. Mettre à jour les positions existantes basées sur l'ID (ordre de création)
-- Chaque image d'un produit reçoit une position séquentielle (0, 1, 2, ...)
WITH ranked AS (
  SELECT id, item_id, ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY id) - 1 as new_pos
  FROM public.item_images
)
UPDATE public.item_images i
SET position = r.new_pos
FROM ranked r
WHERE i.id = r.id;

-- 3. Créer un index pour optimiser les requêtes triées par position
CREATE INDEX IF NOT EXISTS idx_item_images_position 
ON public.item_images(item_id, position);

-- 4. Commentaire sur la colonne
COMMENT ON COLUMN public.item_images.position IS 'Ordre d''affichage de l''image (0 = image principale)';
