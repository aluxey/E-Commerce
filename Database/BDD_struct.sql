create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Tables
create table public.categories (
  id          bigserial primary key,
  name        text not null unique,
  created_at  timestamp without time zone default now()
);

create table public.colors (
  id         bigserial primary key,
  name       text not null,
  code       text not null unique,  -- code interne (ex: "blue_navy")
  hex_code   text not null unique
             check (hex_code ~ '^#([0-9A-Fa-f]{6})$'),
  created_at timestamp without time zone default now()
);

create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  role        text not null default 'client' check (role in ('client','admin')),
  created_at  timestamp without time zone default now(),
  updated_at  timestamp without time zone default now()
);

create table public.items (
  id           bigserial primary key,
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  image_url    text,
  category_id  bigint references public.categories(id) on delete set null,
  status       text not null default 'draft'
               check (status in ('draft','active','archived')),
  created_at   timestamp without time zone default now(),
  updated_at   timestamp without time zone default now()
);

create index if not exists idx_items_category on public.items(category_id);
create index if not exists idx_items_name
  on public.items using gin (to_tsvector('simple', coalesce(name,'')));

create table public.item_colors (
  item_id   bigint not null references public.items(id) on delete cascade,
  color_id  bigint not null references public.colors(id) on delete restrict,
  primary key (item_id, color_id)
);
create index if not exists idx_item_colors_color on public.item_colors(color_id);

create table public.item_images (
  id         bigserial primary key,
  item_id    bigint not null references public.items(id) on delete cascade,
  image_url  text not null,
  created_at timestamp without time zone default now()
);
create index if not exists idx_item_images_item on public.item_images(item_id);

create table public.item_variants (
  id         bigserial primary key,
  item_id    bigint not null references public.items(id) on delete cascade,
  sku        text unique,
  color_id   bigint references public.colors(id),
  size       text,
  stock      integer not null default 0 check (stock >= 0),
  price      numeric(10,2) not null check (price >= 0),
  created_at timestamp without time zone default now()
);
create index if not exists idx_variants_item
  on public.item_variants(item_id);

create unique index if not exists ux_item_variants_combo
  on public.item_variants (item_id, coalesce(size,''), color_id);

create index if not exists idx_item_variants_item_size_colorid
  on public.item_variants (item_id, size, color_id);

create table public.item_ratings (
  id         bigserial primary key,
  item_id    bigint not null references public.items(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  unique (item_id, user_id)
);
create index if not exists idx_ratings_item on public.item_ratings(item_id);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  status             text not null default 'pending'
                     check (status in ('pending','paid','failed','canceled','shipped','refunded')),
  currency           text not null default 'eur',
  total              numeric(10,2) not null default 0 check (total >= 0),
  shipping_address   jsonb,
  payment_intent_id  text unique,
  created_at         timestamp without time zone default now(),
  updated_at         timestamp without time zone default now()
);
create index if not exists idx_orders_user on public.orders(user_id);

create table public.order_items (
  id            bigserial primary key,
  order_id      uuid not null references public.orders(id) on delete cascade,
  item_id       bigint not null references public.items(id) on delete restrict,
  variant_id    bigint not null references public.item_variants(id) on delete restrict,
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(10,2) not null default 0 check (unit_price >= 0),
  total_price   numeric(10,2) generated always as (quantity * coalesce(unit_price,0)) stored,
  customization jsonb default '{}'::jsonb,
  created_at    timestamp without time zone default now()
);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_item on public.order_items(item_id);

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  provider     text not null default 'stripe',
  provider_id  text not null,
  amount       numeric(10,2) not null check (amount >= 0),
  currency     text not null default 'eur',
  status       text not null,
  raw          jsonb default '{}'::jsonb,
  created_at   timestamp without time zone default now(),
  updated_at   timestamp without time zone default now(),
  unique (provider, provider_id)
);
create index if not exists idx_payments_order on public.payments(order_id);

create table public.stripe_events (
  event_id    text primary key,
  received_at timestamp without time zone default now()
);

-- Trigger 'updated_at'
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

create trigger trg_ratings_updated_at
  before update on public.item_ratings
  for each row execute function public.set_updated_at();

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Contrainte : chaque item doit avoir au moins une couleur liée
create or replace function public.assert_item_has_color(item_id bigint) returns void
language plpgsql as $$
begin
  -- si l'item n'existe plus (delete cascade), on ne valide pas la contrainte
  if not exists (select 1 from public.items i where i.id = item_id) then
    return;
  end if;

  if not exists (select 1 from public.item_colors ic where ic.item_id = item_id) then
    raise exception 'Item % doit avoir au moins une couleur', item_id;
  end if;
end;
$$;

create or replace function public.require_item_color_trg() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'items' then
    perform public.assert_item_has_color(new.id);
  elsif tg_table_name = 'item_colors' then
    if tg_op = 'UPDATE' then
      perform public.assert_item_has_color(new.item_id);
      if old.item_id is distinct from new.item_id then
        perform public.assert_item_has_color(old.item_id);
      end if;
    elsif tg_op = 'DELETE' then
      perform public.assert_item_has_color(old.item_id);
    else
      perform public.assert_item_has_color(new.item_id);
    end if;
  end if;
  return null;
end;
$$;

create constraint trigger ctr_items_require_color
  after insert or update on public.items
  deferrable initially deferred
  for each row execute function public.require_item_color_trg();

create constraint trigger ctr_item_colors_require_color
  after insert or update or delete on public.item_colors
  deferrable initially deferred
  for each row execute function public.require_item_color_trg();
