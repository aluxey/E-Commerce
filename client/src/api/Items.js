import { supabase } from "../supabase/supabaseClient";

export async function fetchProducts() {
  try {
    const { data, error } = await supabase.from("items").select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("fetchProducts error:", error);
    throw error;
  }
}
