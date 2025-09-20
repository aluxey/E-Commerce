-- PARAM
-- CHANGE ME:
with params as (
  select 'admin@example.com'::text as admin_email
)

-- 1) Créer un user admin dans public.users (si l'email existe dans auth.users)
, ins_admin as (
  insert into public.users (id, email, role)
  select au.id, au.email, 'admin'
  from auth.users au
  join params p on au.email = p.admin_email
  on conflict (id) do update set role='admin', email=excluded.email
  returning id
)
-- 2) Catégories
insert into public.categories (name) values
  ('Crochet'),
  ('Accessoires')
on conflict (name) do nothing;

-- 3) Items
insert into public.items (name, description, price, image_url, category_id)
select 'Écharpe laine', 'Écharpe tricotée main', 29.90, null, c.id
from public.categories c where c.name='Accessoires'
union all
select 'Amigurumi renard', 'Peluche crochet renard', 19.90, null, c.id
from public.categories c where c.name='Crochet';

-- 4) Variants (exemples)
insert into public.item_variants (item_id, sku, color, size, stock, price)
select i.id, 'SCARF-BLEU-M', 'BLEU', 'M', 10, 29.90
from public.items i where i.name='Écharpe laine'
union all
select i.id, 'SCARF-VERT-L', 'VERT', 'L', 6, 31.90
from public.items i where i.name='Écharpe laine'
union all
select i.id, 'FOX-ORANGE-UNI', 'ORANGE', null, 12, 19.90
from public.items i where i.name='Amigurumi renard';

-- 5) Note produit (facultatif) — l’admin note un produit
insert into public.item_ratings (item_id, user_id, rating, comment)
select i.id, (select id from public.users where role='admin' limit 1), 5, 'Top qualité'
from public.items i where i.name='Amigurumi renard'
on conflict do nothing;


-- 04_seed_full.sql
-- Seed complet et idempotent pour ta base e-commerce (Supabase/Postgres)
-- - N'INSÈRE QUE SI NÉCESSAIRE (NOT EXISTS / ON CONFLICT)
-- - Noms d'items différents de ton premier seed pour éviter les collisions

-- ========= PARAMS (⚠️ À ADAPTER) =========
with params as (
  select
    'admin@example.com'::text  as admin_email,
    'client@example.com'::text as client_email
),

-- ========= USERS =========
-- Crée/Met à jour un admin et un client DANS public.users,
-- liés à des comptes existant dans auth.users (même email)
upsert_admin as (
  insert into public.users (id, email, role)
  select au.id, au.email, 'admin'
  from auth.users au
  join params p on au.email = p.admin_email
  on conflict (id) do update set role='admin', email=excluded.email
  returning id as admin_id
),
upsert_client as (
  insert into public.users (id, email, role)
  select au.id, au.email, 'client'
  from auth.users au
  join params p on au.email = p.client_email
  on conflict (id) do update set role='client', email=excluded.email
  returning id as client_id
)

-- ========= CATEGORIES =========
insert into public.categories (name) values
  ('Accessoires'),
  ('Décoration'),
  ('Bébé'),
  ('Peluches')
on conflict (name) do nothing;

-- ========= ITEMS (noms nouveaux vs. ton précédent seed) =========
-- On prépare une table virtuelle d'items à insérer
;
with items_src(name, description, price, category_name, image_url) as (
  values
    ('Bonnet torsadé', 'Bonnet chaud tricot torsadé', 24.90, 'Accessoires', null),
    ('Plaid cocoon', 'Grand plaid douillet pour canapé', 59.90, 'Décoration', null),
    ('Chaussons bébé', 'Chaussons crochet taille 0-6 mois', 14.90, 'Bébé', null),
    ('Amigurumi lapin', 'Peluche crochet lapin tout doux', 21.90, 'Peluches', null)
)
insert into public.items (name, description, price, image_url, category_id)
select s.name, s.description, s.price, s.image_url, c.id
from items_src s
join public.categories c on c.name = s.category_name
where not exists (
  select 1 from public.items i where i.name = s.name
);

-- ========= VARIANTS (avec SKUs uniques ; UPSERT par SKU) =========
insert into public.item_variants (item_id, sku, color, size, stock, price)
-- Bonnet torsadé
select i.id, 'BONNET-BLEU-M', 'BLEU', 'M', 12, 24.90 from public.items i where i.name='Bonnet torsadé'
union all
select i.id, 'BONNET-VERT-L', 'VERT', 'L', 8, 26.90 from public.items i where i.name='Bonnet torsadé'
-- Plaid cocoon
union all
select i.id, 'PLAID-ORANGE-XL', 'ORANGE', 'XL', 5, 64.90 from public.items i where i.name='Plaid cocoon'
-- Chaussons bébé
union all
select i.id, 'BOOTIE-BLEU-0_6', 'BLEU', '0-6M', 20, 14.90 from public.items i where i.name='Chaussons bébé'
-- Amigurumi lapin
union all
select i.id, 'LAPIN-BLANC-UNI', 'BLANC', null, 15, 21.90 from public.items i where i.name='Amigurumi lapin'
on conflict (sku) do nothing;

-- ========= IMAGES (anti-doublon par (item_id, image_url)) =========
with img_src(item_name, url) as (
  values
    ('Bonnet torsadé',   'https://example.com/img/bonnet.jpg'),
    ('Plaid cocoon',     'https://example.com/img/plaid.jpg'),
    ('Chaussons bébé',   'https://example.com/img/chaussons.jpg'),
    ('Amigurumi lapin',  'https://example.com/img/lapin.jpg')
)
insert into public.item_images (item_id, image_url)
select i.id, s.url
from img_src s
join public.items i on i.name = s.item_name
where not exists (
  select 1 from public.item_images ii
  where ii.item_id = i.id and ii.image_url = s.url
);

-- ========= RATINGS (par l’admin sur 2 produits — idempotent) =========
insert into public.item_ratings (item_id, user_id, rating, comment)
select i.id, (select id from public.users where role='admin' order by created_at asc limit 1), 5, 'Très belle finition'
from public.items i where i.name='Bonnet torsadé'
on conflict (item_id, user_id) do nothing;

insert into public.item_ratings (item_id, user_id, rating, comment)
select i.id, (select id from public.users where role='admin' order by created_at asc limit 1), 4, 'Confortable et soigné'
from public.items i where i.name='Plaid cocoon'
on conflict (item_id, user_id) do nothing;

-- ========= ORDERS (1 pending + 1 paid) — idempotent via payment_intent_id =========

-- Order PENDING pour le client
with cli as (
  select id as user_id from public.users where role='client' limit 1
),
upsert_order1 as (
  insert into public.orders (user_id, status, currency, total, shipping_address, payment_intent_id)
  select c.user_id, 'pending', 'eur', 0, '{"city":"Bordeaux","country":"FR"}'::jsonb, 'seed_pi_pending_001'
  from cli c
  on conflict (payment_intent_id) do update set updated_at = now()
  returning id
)
-- lignes de commande (si absentes) : 2 lignes
insert into public.order_items (order_id, item_id, variant_id, quantity, unit_price, customization)
select o.id, i.id, v.id, 1, v.price, '{}'::jsonb
from upsert_order1 o
join public.items i on i.name in ('Bonnet torsadé')
join public.item_variants v on v.item_id = i.id and v.sku in ('BONNET-BLEU-M')
where not exists (
  select 1 from public.order_items oi
  where oi.order_id = o.id and oi.variant_id = v.id
);

with cli as (
  select id as user_id from public.users where role='client' limit 1
),
oid as (
  select id from public.orders where payment_intent_id = 'seed_pi_pending_001'
),
add_line2 as (
  insert into public.order_items (order_id, item_id, variant_id, quantity, unit_price, customization)
  select o.id, i.id, v.id, 2, v.price, '{}'::jsonb
  from oid o
  join public.items i on i.name = 'Chaussons bébé'
  join public.item_variants v on v.item_id = i.id and v.sku = 'BOOTIE-BLEU-0_6'
  where not exists (
    select 1 from public.order_items oi
    where oi.order_id = o.id and oi.variant_id = v.id
  )
  returning 1
)
-- recalcule le total de cette commande
update public.orders o
set total = coalesce((
  select sum(oi.total_price) from public.order_items oi where oi.order_id = o.id
), 0)
where o.payment_intent_id = 'seed_pi_pending_001';

-- Order PAID pour le client
with cli as (
  select id as user_id from public.users where role='client' limit 1
),
upsert_order2 as (
  insert into public.orders (user_id, status, currency, total, shipping_address, payment_intent_id)
  select c.user_id, 'paid', 'eur', 0, '{"city":"Bordeaux","country":"FR"}'::jsonb, 'seed_pi_paid_001'
  from cli c
  on conflict (payment_intent_id) do update set status='paid', updated_at = now()
  returning id
)
insert into public.order_items (order_id, item_id, variant_id, quantity, unit_price, customization)
select o.id, i.id, v.id, 1, v.price, '{}'::jsonb
from upsert_order2 o
join public.items i on i.name in ('Plaid cocoon')
join public.item_variants v on v.item_id = i.id and v.sku in ('PLAID-ORANGE-XL')
where not exists (
  select 1 from public.order_items oi
  where oi.order_id = o.id and oi.variant_id = v.id
);

-- recalcule le total de la commande paid
update public.orders o
set total = coalesce((
  select sum(oi.total_price) from public.order_items oi where oi.order_id = o.id
), 0)
where o.payment_intent_id = 'seed_pi_paid_001';

-- ========= PAYMENTS (pour l’order PAID) — idempotent via (provider, provider_id) =========
insert into public.payments (order_id, provider, provider_id, amount, currency, status, raw)
select o.id, 'stripe', 'seed_pay_001', o.total, 'eur', 'succeeded', '{"seed":true}'::jsonb
from public.orders o
where o.payment_intent_id = 'seed_pi_paid_001'
on conflict (provider, provider_id) do update
set amount = excluded.amount,
    status = excluded.status,
    updated_at = now();

-- ========= (Optionnel) Un rating du client =========
insert into public.item_ratings (item_id, user_id, rating, comment)
select i.id, u.id, 5, 'Parfait pour l’hiver'
from public.items i
join public.users u on u.role='client'
where i.name='Bonnet torsadé'
on conflict (item_id, user_id) do nothing;
