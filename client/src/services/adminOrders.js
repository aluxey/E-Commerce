import { supabase } from "../supabase/supabaseClient";

export const listOrders = async () =>
  supabase
    .from('orders')
    .select(`
      id,
      total,
      status,
      currency,
      created_at,
      payment_intent_id,
      shipping_address,
      user:user_id (
        id,
        email
      ),
      order_items (
        id,
        quantity,
        unit_price,
        items:items (
          id,
          name,
          price
        ),
        item_variants (
          id,
          size,
          price,
          sku
        )
      )
    `)
    .order('created_at', { ascending: false });

export const updateOrderStatus = async (id, status) =>
  supabase.from('orders').update({ status }).eq('id', id);
