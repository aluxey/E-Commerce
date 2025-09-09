// api/orders.js
import { supabase } from "../supabase/supabaseClient";

export async function fetchOrders() {
  try {
    const { data, error } = await supabase.from("orders").select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("fetchOrders error:", error);
    throw error;
  }
}
