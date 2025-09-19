-- Backfill script: create item variants from items.sizes/colors arrays
-- Run after 20241017_variants_overhaul.sql to populate normalized data

begin;

-- Helper CTE to expand size/color combinations (gracefully handles null/empty arrays)
with expanded as (
  select distinct
         i.id as item_id,
         nullif(trim(sz), '') as size,
         nullif(trim(cl), '') as color,
         i.price as base_price
  from public.items i
  left join lateral unnest(
    case
      when i.sizes is null or array_length(i.sizes, 1) = 0 then array[null::text]
      else i.sizes
    end
  ) as s(sz) on true
  left join lateral unnest(
    case
      when i.colors is null or array_length(i.colors, 1) = 0 then array[null::text]
      else i.colors
    end
  ) as c(cl) on true
)
insert into public.item_variants (item_id, size, color, price, stock, sku)
select e.item_id,
       e.size,
       e.color,
       e.base_price,
       0,
       concat('sku-', e.item_id, '-', coalesce(e.size, '_'), '-', coalesce(e.color, '_'))
from expanded e
where not exists (
  select 1
  from public.item_variants v
  where v.item_id = e.item_id
    and coalesce(v.size, '') = coalesce(e.size, '')
    and coalesce(v.color, '') = coalesce(e.color, '')
);

-- Update each item price to reflect the cheapest variant
with min_prices as (
  select item_id, min(price) as min_price
  from public.item_variants
  group by item_id
)
update public.items i
set price = m.min_price
from min_prices m
where i.id = m.item_id
  and i.price <> m.min_price;

-- Reassign any fallback variants created during migration to the best available real variant
with fallback as (
  select v.id, v.item_id
  from public.item_variants v
  where v.sku like 'auto-%'
),
preferred as (
  select fb.id as fallback_id,
         best.id as preferred_id
  from fallback fb
  join lateral (
    select v.id
    from public.item_variants v
    where v.item_id = fb.item_id
      and v.sku not like 'auto-%'
    order by v.price asc, v.id asc
    limit 1
  ) as best on true
)
update public.order_items oi
set variant_id = p.preferred_id
from preferred p
where oi.variant_id = p.fallback_id;

-- Remove fallback variants when a proper variant exists
delete from public.item_variants v
where v.sku like 'auto-%'
  and exists (
    select 1
    from public.item_variants other
    where other.item_id = v.item_id
      and other.id <> v.id
      and other.sku not like 'auto-%'
  );

commit;
