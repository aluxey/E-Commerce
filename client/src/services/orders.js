import { supabase } from "../supabase/supabaseClient";

export const fetchOrdersStats = async (d30Iso, d60Iso) => {
  const ordersLast30Promise = supabase
    .from('orders')
    .select('total, created_at, status', { count: 'exact' })
    .gte('created_at', d30Iso)
    .in('status', ['paid', 'shipped']);

  const ordersPrev30Promise = supabase
    .from('orders')
    .select('total, created_at, status', { count: 'exact' })
    .gte('created_at', d60Iso)
    .lt('created_at', d30Iso)
    .in('status', ['paid', 'shipped']);

  const pendingPromise = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const [{ data: ordersLast30, count: ordersCountLast30, error: err1 }, { data: ordersPrev30, count: ordersCountPrev30, error: err2 }, { count: pendingCount, error: err3 }] =
    await Promise.all([ordersLast30Promise, ordersPrev30Promise, pendingPromise]);

  return {
    ordersLast30,
    ordersPrev30,
    ordersCountLast30: ordersCountLast30 || 0,
    ordersCountPrev30: ordersCountPrev30 || 0,
    pendingCount: pendingCount || 0,
    error: err1 || err2 || err3 || null,
  };
};
