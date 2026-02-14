-- Suppression de la table testimonials (fonctionnalité remplacée par customer_photos)

drop trigger if exists trg_testimonials_updated_at on public.testimonials;
drop index if exists idx_testimonials_featured;
drop index if exists idx_testimonials_status;
drop index if exists idx_testimonials_item;
drop table if exists public.testimonials;
