-- RPC pour créer un item avec ses couleurs en une seule transaction
-- À exécuter dans Supabase SQL Editor

create or replace function public.create_item_with_colors(
  p_name text,
  p_description text,
  p_category_id bigint,
  p_price numeric,
  p_status text,
  p_color_ids bigint[],
  p_pattern_type text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id bigint;
  v_color_id bigint;
begin
  -- Vérifier qu'au moins une couleur est fournie
  if p_color_ids is null or array_length(p_color_ids, 1) is null then
    raise exception 'Au moins une couleur est requise pour le produit.';
  end if;

  -- Vérifier la valeur de pattern_type si fournie
  if p_pattern_type is not null and p_pattern_type not in ('rechtsmuster', 'gaensefuesschen') then
    raise exception 'pattern_type invalide. Valeurs acceptées: rechtsmuster, gaensefuesschen';
  end if;

  -- Créer l'item
  insert into items (name, description, category_id, price, status, pattern_type)
  values (p_name, p_description, p_category_id, p_price, coalesce(p_status, 'draft'), p_pattern_type)
  returning id into v_item_id;

  -- Insérer les couleurs
  foreach v_color_id in array p_color_ids
  loop
    insert into item_colors (item_id, color_id)
    values (v_item_id, v_color_id);
  end loop;

  return v_item_id;
end;
$$;

-- Donner les permissions
grant execute on function public.create_item_with_colors(text, text, bigint, numeric, text, bigint[], text) to authenticated;
