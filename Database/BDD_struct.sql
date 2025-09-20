create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Tables
create table public.categories (
  id          bigserial primary key,
  name        text not null unique,
  created_at  timestamp without time zone default now()
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
  sizes        text[] default array['S','M','L'],
  colors       text[] default array['BLEU','ORANGE','VERT'],
  created_at   timestamp without time zone default now(),
  updated_at   timestamp without time zone default now()
);

create index if not exists idx_items_category on public.items(category_id);
create index if not exists idx_items_name on public.items using gin (to_tsvector('simple', coalesce(name,'')));

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
  color      text,
  size       text,
  stock      integer not null default 0 check (stock >= 0),
  price      numeric(10,2) not null check (price >= 0),
  created_at timestamp without time zone default now()
);
create index if not exists idx_variants_item on public.item_variants(item_id);
create unique index if not exists ux_item_variants_combo
  on public.item_variants (item_id, coalesce(size,''), coalesce(color,''));
create index if not exists idx_item_variants_item_size_color
  on public.item_variants (item_id, size, color);

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
  status             text not null default 'pending' check (status in ('pending','paid','failed','canceled','shipped','refunded')),
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

create trigger trg_users_updated_at    before update on public.users         for each row execute function public.set_updated_at();
create trigger trg_items_updated_at    before update on public.items         for each row execute function public.set_updated_at();
create trigger trg_ratings_updated_at  before update on public.item_ratings  for each row execute function public.set_updated_at();
create trigger trg_orders_updated_at   before update on public.orders        for each row execute function public.set_updated_at();
create trigger trg_payments_updated_at before update on public.payments      for each row execute function public.set_updated_at();
