import { supabase } from "../supabase/supabaseClient";

export const listOrders = async () =>
  supabase
    .from('orders')
    .select('id, total, status, created_at, payment_intent_id, user_id')
    .order('created_at', { ascending: false });

export const updateOrderStatus = async (id, status) =>
  supabase.from('orders').update({ status }).eq('id', id);
