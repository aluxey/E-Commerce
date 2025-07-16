import { supabase } from "../supabase/supabaseClient";

export async function fetchProducts() {
  const { data, error } = await supabase.from("items").select("*");
  if (error) throw error;
  return data;
}
