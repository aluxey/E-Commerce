-- Migration: Supprimer le champ pattern_type des items
-- Date: 2025-12-29
-- Description: Retire l'ancien système de type de crochet pour le remplacer par une sélection utilisateur

-- Supprimer la colonne pattern_type de la table items
ALTER TABLE public.items DROP COLUMN IF EXISTS pattern_type;

-- Recréer la fonction RPC sans le paramètre pattern_type
DROP FUNCTION IF EXISTS public.create_item_with_colors(text, text, bigint, numeric, text, bigint[]);

CREATE OR REPLACE FUNCTION public.create_item_with_colors(
  p_name text,
  p_description text,
  p_category_id bigint,
  p_price numeric,
  p_status text,
  p_color_ids bigint[]
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id bigint;
  v_color_id bigint;
BEGIN
  -- Vérifier qu'au moins une couleur est fournie
  IF p_color_ids IS NULL OR array_length(p_color_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Au moins une couleur est requise pour le produit.';
  END IF;

  -- Créer l'item (sans pattern_type)
  INSERT INTO items (name, description, category_id, price, status)
  VALUES (p_name, p_description, p_category_id, p_price, COALESCE(p_status, 'draft'))
  RETURNING id INTO v_item_id;

  -- Insérer les couleurs
  FOREACH v_color_id IN ARRAY p_color_ids
  LOOP
    INSERT INTO item_colors (item_id, color_id)
    VALUES (v_item_id, v_color_id);
  END LOOP;

  RETURN v_item_id;
END;
$$;

-- Donner les permissions (nouvelle signature avec 6 paramètres)
GRANT EXECUTE ON FUNCTION public.create_item_with_colors(text, text, bigint, numeric, text, bigint[]) TO authenticated;