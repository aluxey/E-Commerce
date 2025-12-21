-- Migration: Insert Bobbiny colors
-- À exécuter dans Supabase SQL Editor

-- D'abord supprimer les couleurs qui ne sont pas utilisées par des produits
DELETE FROM public.colors
WHERE id NOT IN (SELECT DISTINCT color_id FROM public.item_colors);

-- Insérer les nouvelles couleurs (ignore si code OU hex_code existe déjà)
DO $$
DECLARE
  color_record RECORD;
BEGIN
  FOR color_record IN
    SELECT * FROM (VALUES
      ('Ink Blue', 'ink_blue', '#1B3A5F'),
      ('Moss Green', 'moss_green', '#4A5D23'),
      ('Nut Brown', 'nut_brown', '#6B4423'),
      ('Mocha Mousse', 'mocha_mousse', '#A68B6A'),
      ('Caramel', 'caramel', '#C17F3C'),
      ('Terracotta', 'terracotta', '#B5503C'),
      ('Spicy Yellow', 'spicy_yellow', '#E8B830'),
      ('Mustard', 'mustard', '#C9A227'),
      ('Orange', 'orange', '#D96830'),
      ('Butter Yellow', 'butter_yellow', '#F5D678'),
      ('White', 'white', '#FFFFFF'),
      ('Off White', 'off_white', '#F5F0E8'),
      ('Natural', 'natural', '#E8DFD0'),
      ('Golden Natural', 'golden_natural', '#D4B896'),
      ('Nude', 'nude', '#D4A98C'),
      ('Pine Green', 'pine_green', '#2D5A45'),
      ('Avocado', 'avocado', '#6B7D3A'),
      ('Eucalyptus Green', 'eucalyptus_green', '#7A9B8A'),
      ('Pale Olive', 'pale_olive', '#A8AB7B'),
      ('Aloe', 'aloe', '#8FB897'),
      ('Duck Egg Blue', 'duck_egg_blue', '#7AB5B0'),
      ('Laurel', 'laurel', '#4D7C5E'),
      ('Misty', 'misty', '#C8C5D0'),
      ('Teal', 'teal', '#2A8B8B'),
      ('Peacock Blue', 'peacock_blue', '#1E6B6B'),
      ('Jeans', 'jeans', '#4A6078'),
      ('Light Grey', 'light_grey', '#C5C5C5'),
      ('Steel', 'steel', '#8A8A8A'),
      ('Charcoal', 'charcoal', '#4A4A4A'),
      ('Black', 'black', '#1A1A1A'),
      ('Wine Red', 'wine_red', '#722F37'),
      ('Burgundy', 'burgundy', '#6B2C3E'),
      ('Blossom', 'blossom', '#C77B8B'),
      ('Peony', 'peony', '#B85070'),
      ('Blush', 'blush', '#D4A5A5'),
      ('Pastel Pink', 'pastel_pink', '#E8C4C8'),
      ('Pearl', 'pearl', '#E8E4DC'),
      ('Mauve', 'mauve', '#9B7A8E'),
      ('Violet', 'violet', '#6B4C7A'),
      ('Moonlight', 'moonlight', '#D8D4E0'),
      ('Beige', 'beige', '#C9B99A'),
      ('Warm Beige', 'warm_beige', '#C4A882'),
      ('Sand', 'sand', '#D4C4A8'),
      ('Coffee', 'coffee', '#6B5344')
    ) AS t(name, code, hex_code)
  LOOP
    INSERT INTO public.colors (name, code, hex_code)
    VALUES (color_record.name, color_record.code, color_record.hex_code)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
