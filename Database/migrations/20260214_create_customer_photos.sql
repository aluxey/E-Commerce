-- Creation de la table customer_photos (mur de photos clients)

create table if not exists public.customer_photos (
  id          bigserial primary key,
  image_url   text not null,
  position    integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamp without time zone default now()
);

create index if not exists idx_customer_photos_visible
  on public.customer_photos(is_visible, position asc)
  where is_visible = true;

-- RLS : lecture publique (photos visibles), ecriture admin uniquement
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
