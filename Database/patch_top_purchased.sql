-- Add RPC function for top purchased items without resetting schema

begin;

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

commit;

