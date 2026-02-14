-- 03_rls_owner.sql
-- Active RLS + recrée TOUTES les policies, y compris Storage
-- ⚠️ Exécuter en "Run as Owner" pour pouvoir DROP les policies Storage existantes.

-- 1) Activer RLS sur les tables public
alter table public.users          enable row level security;
alter table public.colors         enable row level security;
alter table public.item_colors    enable row level security;
alter table public.items          enable row level security;
alter table public.item_images    enable row level security;
alter table public.item_variants  enable row level security;
alter table public.item_ratings   enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.payments       enable row level security;
alter table public.stripe_events  enable row level security;

-- 2) Helper admin
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

-- 3) Policies PUBLIC.*
create policy "Users: select own or admin" on public.users for select
  to authenticated using ( id = auth.uid() or public.is_admin(auth.uid()) );

create policy "Users: insert self or admin" on public.users for insert
  to authenticated with check ( id = auth.uid() or public.is_admin(auth.uid()) );

create policy "Users: update self or admin" on public.users for update
  to authenticated using ( id = auth.uid() or public.is_admin(auth.uid()) )
  with check ( id = auth.uid() or public.is_admin(auth.uid()) );

create policy "Users: delete admin only" on public.users for delete
  to authenticated using ( public.is_admin(auth.uid()) );

create policy "Colors: public read" on public.colors for select
  to anon, authenticated using (true);

create policy "Colors: admin write" on public.colors for all
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "ItemColors: public read" on public.item_colors for select
  to anon, authenticated using (true);

create policy "ItemColors: admin write" on public.item_colors for all
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "Items: public read" on public.items for select
  to anon, authenticated using (true);

create policy "Items: admin write" on public.items for all
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "ItemImages: public read" on public.item_images for select
  to anon, authenticated using (true);

create policy "ItemImages: admin write" on public.item_images for all
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "Variants: public read" on public.item_variants for select
  to anon, authenticated using (true);

create policy "Variants: admin write" on public.item_variants for all
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "Ratings: public read" on public.item_ratings for select
  to anon, authenticated using (true);

create policy "Ratings: user manage own" on public.item_ratings for all
  to authenticated using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Orders: read own or admin" on public.orders for select
  to authenticated using ( user_id = auth.uid() or public.is_admin(auth.uid()) );

create policy "Orders: create own or admin" on public.orders for insert
  to authenticated with check ( user_id = auth.uid() or public.is_admin(auth.uid()) );

create policy "Orders: admin update" on public.orders for update
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "Orders: admin delete" on public.orders for delete
  to authenticated using ( public.is_admin(auth.uid()) );

create policy "OrderItems: read own via order" on public.order_items for select
  to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "OrderItems: create own via order" on public.order_items for insert
  to authenticated with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "OrderItems: admin write" on public.order_items for update
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "OrderItems: admin delete" on public.order_items for delete
  to authenticated using ( public.is_admin(auth.uid()) );

create policy "Payments: admin read" on public.payments for select
  to authenticated using ( public.is_admin(auth.uid()) );

create policy "Payments: admin write" on public.payments for all
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "StripeEvents: admin read" on public.stripe_events for select
  to authenticated using ( public.is_admin(auth.uid()) );

create policy "StripeEvents: admin write" on public.stripe_events for all
  to authenticated using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

-- 4) STORAGE.objects — on DROP TOUT puis on recrée des policies propres
do $$
declare r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname='storage' and tablename='objects'
  loop
    execute format('drop policy %I on storage.objects;', r.policyname);
  end loop;
end$$;

-- =================== customer_photos ===================

alter table public.customer_photos enable row level security;

create policy "customer_photos: public read visible"
  on public.customer_photos for select
  to anon, authenticated
  using ( is_visible = true );

create policy "customer_photos: admin read all"
  on public.customer_photos for select
  to authenticated
  using ( public.is_admin(auth.uid()) );

create policy "customer_photos: admin write"
  on public.customer_photos for insert
  to authenticated
  with check ( public.is_admin(auth.uid()) );

create policy "customer_photos: admin update"
  on public.customer_photos for update
  to authenticated
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

create policy "customer_photos: admin delete"
  on public.customer_photos for delete
  to authenticated
  using ( public.is_admin(auth.uid()) );

-- =================== Storage ===================

-- Lecture publique de ton bucket
create policy "Storage: read product-images"
  on storage.objects for select
  to anon, authenticated
  using ( bucket_id = 'product-images' );

-- Écritures réservées aux admins sur ce bucket
create policy "Storage: insert product-images (admin)"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'product-images' and public.is_admin(auth.uid()) );

create policy "Storage: update product-images (admin)"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'product-images' and public.is_admin(auth.uid()) )
  with check ( bucket_id = 'product-images' and public.is_admin(auth.uid()) );

create policy "Storage: delete product-images (admin)"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'product-images' and public.is_admin(auth.uid()) );
