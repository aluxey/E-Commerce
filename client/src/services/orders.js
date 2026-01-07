import { supabase } from "../supabase/supabaseClient";

/**
 * Fetch all orders for a specific user with their items
 * @param {string} userId - The user ID
 * @returns {Promise<{data: Array, error: any}>}
 */
export const fetchUserOrders = async (userId) => {
  if (!userId) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      created_at,
      order_items (
        quantity,
        items (
          id,
          name,
          price,
          item_images ( image_url )
        )
      )
    `)
    .eq('user_id', userId)
    // Only show confirmed orders (paid, shipped, delivered) - not pending or failed
    .in('status', ['paid', 'shipped', 'delivered'])
    .order('created_at', { ascending: false });

  return { data: data || [], error };
};

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
