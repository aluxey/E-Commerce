-- Migration: normalize item variants structure and enforce data integrity
-- Applies column rename, pricing constraints, uniqueness, and order_items linkage

begin;

-- 1) Rename legacy column "format" -> size if still present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'item_variants'
      AND column_name = 'format'
  ) THEN
    EXECUTE 'alter table public.item_variants rename column "format" to size';
  END IF;
END
$$;

-- 2) Ensure every variant has an explicit price >= 0
update public.item_variants v
set price = i.price
from public.items i
where v.item_id = i.id
  and v.price is null;

alter table public.item_variants drop constraint if exists item_variants_price_check;
alter table public.item_variants alter column price set not null;
alter table public.item_variants add constraint item_variants_price_check check (price >= 0);

-- 3) Create a fallback variant per item if none exists (needed for future constraints)
insert into public.item_variants (item_id, sku, color, size, stock, price)
select i.id,
       concat('auto-', i.id),
       null,
       null,
       0,
       i.price
from public.items i
where not exists (
  select 1
  from public.item_variants v
  where v.item_id = i.id
);

-- 4) Enforce uniqueness of (item_id, size, color) treating null as ''
create unique index if not exists ux_item_variants_combo
  on public.item_variants (item_id, coalesce(size, ''), coalesce(color, ''));
create index if not exists idx_item_variants_item_size_color
  on public.item_variants (item_id, size, color);

-- 5) Attach order items to an existing variant (prefer the cheapest)
update public.order_items oi
set variant_id = picked.variant_id
from lateral (
  select v.id as variant_id
  from public.item_variants v
  where v.item_id = oi.item_id
  order by v.price asc, v.id asc
  limit 1
) as picked
where oi.variant_id is null;

-- 6) Strengthen referential integrity on order_items.variant_id
alter table public.order_items alter column variant_id set not null;

-- The FK is still "on delete set null" from legacy definitions.
-- Replace it with "on delete restrict" now that the column is NOT NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.order_items'::regclass
      AND confrelid = 'public.item_variants'::regclass
      AND contype = 'f'
  ) THEN
    ALTER TABLE public.order_items
      DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;
  END IF;
END
$$;

alter table public.order_items
  add constraint order_items_variant_id_fkey
  foreign key (variant_id) references public.item_variants(id) on delete restrict;

-- 7) Ensure the variant referenced by an order_item belongs to the same item
create or replace function public.ensure_order_item_variant_consistency()
returns trigger
language plpgsql
as $$
begin
  if new.variant_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.item_variants v
    where v.id = new.variant_id
      and v.item_id = new.item_id
  ) then
    raise exception using
      errcode = '23503',
      message = format('Variant %s does not belong to item %s', new.variant_id, new.item_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_order_items_variant_consistency on public.order_items;
create trigger trg_order_items_variant_consistency
before insert or update on public.order_items
for each row execute function public.ensure_order_item_variant_consistency();

commit;
