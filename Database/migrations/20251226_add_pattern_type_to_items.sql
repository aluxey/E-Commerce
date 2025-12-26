-- Migration: Ajoute le champ pattern_type aux items
-- Date: 2025-12-26
-- Description: Permet de spécifier le style de crochet (rechtsmuster, gaensefuesschen)

-- Ajouter la colonne pattern_type à la table items
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS pattern_type text
CHECK (pattern_type IS NULL OR pattern_type IN ('rechtsmuster', 'gaensefuesschen'));

COMMENT ON COLUMN public.items.pattern_type IS 'Style de crochet: rechtsmuster ou gaensefuesschen';

-- Mettre à jour la fonction RPC pour inclure pattern_type
DROP FUNCTION IF EXISTS public.create_item_with_colors(text, text, bigint, numeric, text, bigint[]);

CREATE OR REPLACE FUNCTION public.create_item_with_colors(
  p_name text,
  p_description text,
  p_category_id bigint,
  p_price numeric,
  p_status text,
  p_color_ids bigint[],
  p_pattern_type text DEFAULT NULL
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

  -- Vérifier la valeur de pattern_type si fournie
  IF p_pattern_type IS NOT NULL AND p_pattern_type NOT IN ('rechtsmuster', 'gaensefuesschen') THEN
    RAISE EXCEPTION 'pattern_type invalide. Valeurs acceptées: rechtsmuster, gaensefuesschen';
  END IF;

  -- Créer l'item
  INSERT INTO items (name, description, category_id, price, status, pattern_type)
  VALUES (p_name, p_description, p_category_id, p_price, COALESCE(p_status, 'draft'), p_pattern_type)
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

-- Donner les permissions (nouvelle signature avec 7 paramètres)
GRANT EXECUTE ON FUNCTION public.create_item_with_colors(text, text, bigint, numeric, text, bigint[], text) TO authenticated;
