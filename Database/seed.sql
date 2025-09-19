-- Seed data for E-Commerce schema (compatible with complete_schema.sql)
-- IDs:
--   BIGINT: categories, items, item_images, item_variants, order_items
--   UUID:   users, orders, payments
-- Includes: admin/client users (dev only), products, images, variants, demo order (paid)

begin;

-- Extensions (pour gen_random_uuid() et crypt())
create extension if not exists pgcrypto;

------------------------------------------------------------
-- 1) Catégories
------------------------------------------------------------
insert into public.categories(name)
values ('Accessoires'), ('Maison'), ('Vêtements')
on conflict (name) do nothing;

------------------------------------------------------------
-- 2) Comptes de test (DEV UNIQUEMENT)
--   Crée 2 comptes email/password directement dans auth.*
--   puis lie à public.users avec rôles.
------------------------------------------------------------
do $$
declare
  v_admin_id  uuid;
  v_client_id uuid;
begin
  -- ADMIN
  if not exists (select 1 from auth.users where email = 'admin@example.com') then
    insert into auth.users
      (id, instance_id, aud, role, email, encrypted_password,
       email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at)
    values
      (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
       'authenticated', 'authenticated', 'admin@example.com',
       crypt('Admin123!', gen_salt('bf')),
       now(), '{"provider":"email","providers":["email"]}', '{}',
       now(), now());

    insert into auth.identities
      (id, user_id, provider, provider_id, identity_data,
       last_sign_in_at, created_at, updated_at)
    select gen_random_uuid(), u.id, 'email', u.id,
           jsonb_build_object('sub', u.id::text, 'email', 'admin@example.com'),
           now(), now(), now()
    from auth.users u
    where u.email = 'admin@example.com'
    on conflict do nothing;
  end if;

  -- CLIENT
  if not exists (select 1 from auth.users where email = 'client@example.com') then
    insert into auth.users
      (id, instance_id, aud, role, email, encrypted_password,
       email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at)
    values
      (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
       'authenticated', 'authenticated', 'client@example.com',
       crypt('Client123!', gen_salt('bf')),
       now(), '{"provider":"email","providers":["email"]}', '{}',
       now(), now());

    insert into auth.identities
      (id, user_id, provider, provider_id, identity_data,
       last_sign_in_at, created_at, updated_at)
    select gen_random_uuid(), u.id, 'email', u.id,
           jsonb_build_object('sub', u.id::text, 'email', 'client@example.com'),
           now(), now(), now()
    from auth.users u
    where u.email = 'client@example.com'
    on conflict do nothing;
  end if;

  select id into v_admin_id  from auth.users where email = 'admin@example.com'  limit 1;
  select id into v_client_id from auth.users where email = 'client@example.com' limit 1;

  insert into public.users(id, email, role)
  values (v_admin_id, 'admin@example.com', 'admin'),
         (v_client_id,'client@example.com','client')
  on conflict (id) do nothing;
end $$;

------------------------------------------------------------
-- 3) Produits (items) + images
------------------------------------------------------------
with c as (select id, name from public.categories)
insert into public.items(name, description, price, image_url, category_id, sizes, colors)
values
  ('Chaussettes en laine', 'Chaussettes douillettes pour l’hiver', 12.00,
   'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop',
   (select id from c where name='Vêtements'),
   array['S','M','L'],
   array['BLEU','ORANGE','VERT']),
  ('Mug en céramique', 'Mug artisanal peint à la main', 18.00,
   'https://images.unsplash.com/photo-1484659619207-9165d119dafe?w=1200&q=80&auto=format&fit=crop',
   (select id from c where name='Maison'),
   array['S','M','L'],
   array['BLEU','ORANGE','VERT']),
  ('Bonnet tricoté', 'Bonnet chaud fait main', 15.00,
   'https://images.unsplash.com/photo-1603293552165-0e7d1226a9b6?w=1200&q=80&auto=format&fit=crop',
   (select id from c where name='Vêtements'),
   array['S','M','L'],
   array['BLEU','ORANGE','VERT']),
  ('Plaid tissé main', 'Plaid doux et chaud', 35.00,
   'https://images.unsplash.com/photo-1582582621956-f11a44c1f36a?w=1200&q=80&auto=format&fit=crop',
   (select id from c where name='Maison'),
   array['S','M','L'],
   array['BLEU','ORANGE','VERT'])
on conflict do nothing;

-- une image par item si absente
insert into public.item_images(item_id, image_url)
select i.id, i.image_url
from public.items i
where i.image_url is not null
  and not exists (select 1 from public.item_images im where im.item_id = i.id);

------------------------------------------------------------
-- 4) Variantes (avec SKU, types BIGINT)
------------------------------------------------------------
do $$
declare
  v_mug_id       bigint;
  v_bonnet_id    bigint;
  v_mug_price    numeric(10,2);
  v_bonnet_price numeric(10,2);
begin
  select id, price into v_mug_id, v_mug_price
  from public.items
  where name = 'Mug en céramique'
  limit 1;

  select id, price into v_bonnet_id, v_bonnet_price
  from public.items
  where name = 'Bonnet tricoté'
  limit 1;

  if v_mug_id is not null then
    insert into public.item_variants(item_id, sku, color, size, stock, price)
    values
      (v_mug_id, 'MUG-WHITE-300', 'blanc', '300ml', 20, v_mug_price),
      (v_mug_id, 'MUG-NOIR-300',  'noir',  '300ml', 15, 19.50)
    on conflict (sku) do nothing;
  end if;

  if v_bonnet_id is not null then
    insert into public.item_variants(item_id, sku, color, size, stock, price)
    values
      (v_bonnet_id, 'BONNET-GRIS-S', 'gris', 'S', 10, v_bonnet_price),
      (v_bonnet_id, 'BONNET-GRIS-M', 'gris', 'M', 12, v_bonnet_price),
      (v_bonnet_id, 'BONNET-GRIS-L', 'gris', 'L',  8, v_bonnet_price)
    on conflict (sku) do nothing;
  end if;
end $$;

------------------------------------------------------------
-- 5) Commande de démo (client) marquée "paid"
--     - orders.id (UUID)
--     - order_items unit_price figé
--     - payments (si present)
------------------------------------------------------------
do $$
declare
  v_client_id uuid;
  v_order_id  uuid;
  v_item_id   bigint;
  v_variant_id bigint;
  v_unit      numeric(10,2);
  v_qty       int := 2;
  v_total     numeric(10,2);
begin
  select id into v_client_id from public.users where email='client@example.com' limit 1;
  if v_client_id is null then
    raise notice 'Client user missing; skipping demo order.';
    return;
  end if;

  -- crée la commande en pending
  insert into public.orders(user_id, status, currency, total, payment_intent_id)
  values (v_client_id, 'pending', 'eur', 0, 'pi_seed_demo_1')
  returning id into v_order_id;

  -- ajoute une ligne: Mug x2
  select id, price into v_item_id, v_unit
  from public.items
  where name='Mug en céramique'
  limit 1;

  if v_item_id is not null then
    select id into v_variant_id
    from public.item_variants
    where item_id = v_item_id
    order by price asc, id asc
    limit 1;

    if v_variant_id is not null then
      insert into public.order_items(order_id, item_id, variant_id, quantity, unit_price)
      values (v_order_id, v_item_id, v_variant_id, v_qty, v_unit);
    end if;
  end if;

  -- recalcule le total sur la base de total_price généré
  select coalesce(sum(oi.total_price), 0)
  into v_total
  from public.order_items oi
  where oi.order_id = v_order_id;

  update public.orders
  set total = v_total,
      status = 'paid'
  where id = v_order_id;

  -- enregistre un paiement (si table présente)
  if to_regclass('public.payments') is not null then
    insert into public.payments(order_id, provider, provider_id, amount, currency, status, raw)
    values (v_order_id, 'stripe', 'pi_seed_demo_1', v_total, 'eur', 'succeeded', '{"source":"seed"}'::jsonb)
    on conflict (provider, provider_id) do nothing;
  end if;
end $$;

commit;
