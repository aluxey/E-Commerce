-- Stripe-related tables (for reference; adjust to your environment)

-- payments: record Stripe payment intents/charges related to orders
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'stripe',
  provider_id text not null, -- e.g., payment_intent id
  amount numeric not null,
  currency text not null default 'eur',
  status text not null,
  raw jsonb default '{}'::jsonb,
  created_at timestamp without time zone default current_timestamp
);

create index if not exists idx_payments_order on public.payments(order_id);
create unique index if not exists ux_payments_provider_id on public.payments(provider_id);

-- stripe_events: store processed Stripe event ids for idempotency
create table if not exists public.stripe_events (
  event_id text primary key,
  received_at timestamp without time zone default current_timestamp
);

