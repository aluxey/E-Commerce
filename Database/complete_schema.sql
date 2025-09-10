-- E-Commerce complete DB schema (Postgres/Supabase)
-- - Matches current app code (items, item_variants, orders, order_items)
-- - Prices stored in euros with numeric(10,2)
-- - Orders use UUID primary keys (compatible with Supabase)
-- - Includes RLS policies for users, items, variants, orders, and payments

begin;

-- Extensions
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- Clean drop (order matters)
drop table if exists public.order_items cascade;
drop table if exists public.payments cascade;
drop table if exists public.stripe_events cascade;
drop table if exists public.item_images cascade;
drop table if exists public.item_variants cascade;
drop table if exists public.items cascade;
drop table if exists public.categories cascade;
drop table if exists public.orders cascade;
drop table if exists public.users cascade;

-- Legacy names from older scripts (safe to ignore if absent)
drop table if exists public.item cascade;
drop table if exists public.category cascade;

-- Tables

create table public.categories (
  id          bigserial primary key,
  name        text not null unique,
  created_at  timestamp without time zone default now()
);

-- Application users table mirroring auth.users (id = auth user id)
-- If not using Supabase, remove the foreign key to auth.users.
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
  price        numeric(10,2) not null check (price >= 0), -- in euros
  image_url    text,
  category_id  bigint references public.categories(id) on delete set null,
  sizes        text[] default array['S','M','L'],
  colors       text[] default array['BLEU','ORANGE','VERT'],
  created_at   timestamp without time zone default now(),
  updated_at   timestamp without time zone default now()
);

create index if not exists idx_items_category on public.items(category_id);
create index if not exists idx_items_name on public.items using gin (to_tsvector('simple', coalesce(name,'') ));

-- Optional: multiple images per item
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
  "format"   text,
  stock      integer not null default 0 check (stock >= 0),
  price      numeric(10,2) null check (price is null or price >= 0), -- override item price if set
  created_at timestamp without time zone default now()
);
create index if not exists idx_variants_item on public.item_variants(item_id);

create table public.item_ratings (
  id         bigserial primary key,
  item_id    bigint not null references public.items(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  rating     integer not null check (rating >= 1 and rating <= 5),
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
  total              numeric(10,2) not null default 0 check (total >= 0), -- stored in euros
  shipping_address   jsonb, -- free-form address captured at checkout
  payment_intent_id  text unique,
  created_at         timestamp without time zone default now(),
  updated_at         timestamp without time zone default now()
);
create index if not exists idx_orders_user on public.orders(user_id);

create table public.order_items (
  id           bigserial primary key,
  order_id     uuid not null references public.orders(id) on delete cascade,
  item_id      bigint not null references public.items(id) on delete restrict,
  variant_id   bigint null references public.item_variants(id) on delete set null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(10,2) not null default 0 check (unit_price >= 0), -- euros at time of purchase
  total_price  numeric(10,2) generated always as (quantity * coalesce(unit_price,0)) stored,
  customization jsonb default '{}'::jsonb,
  created_at   timestamp without time zone default now()
);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_item on public.order_items(item_id);

-- Payments and Stripe event idempotency
create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  provider     text not null default 'stripe',
  provider_id  text not null, -- e.g., payment_intent id
  amount       numeric(10,2) not null check (amount >= 0), -- euros
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

-- Updated_at trigger
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at before update on public.items
for each row execute function public.set_updated_at();

drop trigger if exists trg_ratings_updated_at on public.item_ratings;
create trigger trg_ratings_updated_at before update on public.item_ratings
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

-- RLS: enable on all relevant tables
alter table public.users          enable row level security;
alter table public.items          enable row level security;
alter table public.item_images    enable row level security;
alter table public.item_variants  enable row level security;
alter table public.item_ratings  enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.payments       enable row level security;
alter table public.stripe_events  enable row level security;

-- Helper to check admin (bypasses RLS on users via SECURITY DEFINER)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public as $$
  select exists (
    select 1 from public.users u where u.id = uid and u.role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

-- USERS
drop policy if exists "Users: select own or admin" on public.users;
create policy "Users: select own or admin"
  on public.users for select
  to authenticated
  using ( id = auth.uid() or public.is_admin(auth.uid()) );

drop policy if exists "Users: insert self or admin" on public.users;
create policy "Users: insert self or admin"
  on public.users for insert
  to authenticated
  with check ( id = auth.uid() or public.is_admin(auth.uid()) );

drop policy if exists "Users: update self or admin" on public.users;
create policy "Users: update self or admin"
  on public.users for update
  to authenticated
  using ( id = auth.uid() or public.is_admin(auth.uid()) )
  with check ( id = auth.uid() or public.is_admin(auth.uid()) );

drop policy if exists "Users: delete admin only" on public.users;
create policy "Users: delete admin only"
  on public.users for delete
  to authenticated
  using ( public.is_admin(auth.uid()) );

-- ITEMS (products)
drop policy if exists "Items: public read" on public.items;
create policy "Items: public read"
  on public.items for select
  to anon, authenticated
  using ( true );

drop policy if exists "Items: admin write" on public.items;
create policy "Items: admin write"
  on public.items for all
  to authenticated
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

-- ITEM IMAGES
drop policy if exists "ItemImages: public read" on public.item_images;
create policy "ItemImages: public read"
  on public.item_images for select
  to anon, authenticated
  using ( true );

drop policy if exists "ItemImages: admin write" on public.item_images;
create policy "ItemImages: admin write"
  on public.item_images for all
  to authenticated
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

-- VARIANTS
drop policy if exists "Variants: public read" on public.item_variants;
create policy "Variants: public read"
  on public.item_variants for select
  to anon, authenticated
  using ( true );

drop policy if exists "Variants: admin write" on public.item_variants;
create policy "Variants: admin write"
  on public.item_variants for all
  to authenticated
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

-- ITEM RATINGS
drop policy if exists "Ratings: public read" on public.item_ratings;
create policy "Ratings: public read"
  on public.item_ratings for select
  to anon, authenticated
  using ( true );

drop policy if exists "Ratings: user manage own" on public.item_ratings;
create policy "Ratings: user manage own"
  on public.item_ratings for all
  to authenticated
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- ORDERS
drop policy if exists "Orders: read own or admin" on public.orders;
create policy "Orders: read own or admin"
  on public.orders for select
  to authenticated
  using ( user_id = auth.uid() or public.is_admin(auth.uid()) );

drop policy if exists "Orders: create own or admin" on public.orders;
create policy "Orders: create own or admin"
  on public.orders for insert
  to authenticated
  with check ( user_id = auth.uid() or public.is_admin(auth.uid()) );

drop policy if exists "Orders: admin update" on public.orders;
create policy "Orders: admin update"
  on public.orders for update
  to authenticated
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

drop policy if exists "Orders: admin delete" on public.orders;
create policy "Orders: admin delete"
  on public.orders for delete
  to authenticated
  using ( public.is_admin(auth.uid()) );

-- ORDER ITEMS
drop policy if exists "OrderItems: read own via order" on public.order_items;
create policy "OrderItems: read own via order"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

drop policy if exists "OrderItems: create own via order" on public.order_items;
create policy "OrderItems: create own via order"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

drop policy if exists "OrderItems: admin write" on public.order_items;
create policy "OrderItems: admin write"
  on public.order_items for update
  to authenticated
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

drop policy if exists "OrderItems: admin delete" on public.order_items;
create policy "OrderItems: admin delete"
  on public.order_items for delete
  to authenticated
  using ( public.is_admin(auth.uid()) );

-- PAYMENTS (usually written by backend with service_role)
drop policy if exists "Payments: admin read" on public.payments;
create policy "Payments: admin read"
  on public.payments for select
  to authenticated
  using ( public.is_admin(auth.uid()) );

drop policy if exists "Payments: admin write" on public.payments;
create policy "Payments: admin write"
  on public.payments for all
  to authenticated
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

-- STRIPE EVENTS (idempotency store)
drop policy if exists "StripeEvents: admin read" on public.stripe_events;
create policy "StripeEvents: admin read"
  on public.stripe_events for select
  to authenticated
  using ( public.is_admin(auth.uid()) );

drop policy if exists "StripeEvents: admin write" on public.stripe_events;
create policy "StripeEvents: admin write"
  on public.stripe_events for all
  to authenticated
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

commit;

-- Usage:
-- - On Supabase: run this in the SQL editor.
-- - With psql: psql "$DATABASE_URL" -f Database/complete_schema.sql
-- Notes:
-- - Create the Storage bucket "product-images" from the Dashboard (or CLI) for uploads.
-- - The API server uses the service role key and bypasses RLS for checkout/webhooks.

--
-- STORAGE: Create bucket `product-images` and policies
--

do $$
begin
  if not exists (select 1 from storage.buckets where name = 'product-images') then
    perform storage.create_bucket(
      name := 'product-images',
      public := true,                -- required for getPublicUrl to work from client
      file_size_limit := 10 * 1024 * 1024, -- 10MB
      allowed_mime_types := array['image/png','image/jpeg','image/webp']
    );
  end if;
end$$;

-- Ensure RLS is enabled on storage.objects (usually enabled by default)
alter table if exists storage.objects enable row level security;

-- Helper inline expression to match only the product-images bucket
-- Note: storage.objects.bucket_id references storage.buckets.id (uuid)

drop policy if exists "Storage: read product-images" on storage.objects;
create policy "Storage: read product-images"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = (select id from storage.buckets where name = 'product-images' limit 1)
  );

drop policy if exists "Storage: upload product-images (admin)" on storage.objects;
create policy "Storage: upload product-images (admin)"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = (select id from storage.buckets where name = 'product-images' limit 1)
    and public.is_admin(auth.uid())
  );

drop policy if exists "Storage: update product-images (admin)" on storage.objects;
create policy "Storage: update product-images (admin)"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = (select id from storage.buckets where name = 'product-images' limit 1)
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = (select id from storage.buckets where name = 'product-images' limit 1)
    and public.is_admin(auth.uid())
  );

drop policy if exists "Storage: delete product-images (admin)" on storage.objects;
create policy "Storage: delete product-images (admin)"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = (select id from storage.buckets where name = 'product-images' limit 1)
    and public.is_admin(auth.uid())
  );

--
-- ANALYTICS: Top purchased items (public RPC)
--
-- Expose a SECURITY DEFINER function that aggregates total quantities sold per item
-- from paid/shipped orders, so the client can show a "Top achats" section without
-- requiring service-role or bypassing RLS at the table level.
--
-- Returns: rows with (item_id bigint, total_sold bigint)
-- Usage from Supabase JS: supabase.rpc('top_purchased_items', { limit_count: 8 })
--
create or replace function public.top_purchased_items(limit_count int default 8)
returns table (
  item_id bigint,
  total_sold bigint
)
language sql
stable
security definer
set search_path = public as $$
  select oi.item_id::bigint as item_id,
         sum(oi.quantity)::bigint as total_sold
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status in ('paid','shipped')
  group by oi.item_id
  order by total_sold desc
  limit greatest(1, limit_count);
$$;

grant execute on function public.top_purchased_items(int) to anon, authenticated;
