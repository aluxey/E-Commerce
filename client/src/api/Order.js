// api/product.js
import { supabase } from "../supabase/supabaseClient";

export async function fetchProducts() {
  const { data, error } = await supabase.from("order").select("*");
  if (error) throw error;
  return data;
}
