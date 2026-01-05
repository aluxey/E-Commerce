-- Migration: Remove item_colors junction table and color constraints
-- This migration removes the many-to-many relationship between items and colors
-- so that all colors are available for all items

-- Drop triggers first
DROP TRIGGER IF EXISTS ctr_items_require_color ON items;
DROP TRIGGER IF EXISTS ctr_item_colors_require_color ON item_colors;

-- Drop functions
DROP FUNCTION IF EXISTS public.require_item_color_trg();
DROP FUNCTION IF EXISTS public.assert_item_has_color(bigint);

-- Drop RPC function that requires color parameters
DROP FUNCTION IF EXISTS public.create_item_with_colors(
  p_name text,
  p_description text,
  p_category_id bigint,
  p_price numeric,
  p_status text,
  p_color_ids bigint[],
  p_pattern_type text
);

-- Drop the junction table
DROP TABLE IF EXISTS public.item_colors;

-- Note: The colors table itself remains unchanged
-- Items table remains unchanged (except for removed triggers)
