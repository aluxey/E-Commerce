import { supabase } from "../supabase/supabaseClient";

const TABLE = "customer_photos";

/**
 * Recupere toutes les photos visibles, triees par position.
 */
export const fetchVisiblePhotos = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_visible", true)
    .order("position", { ascending: true });
  return { data: data || [], error };
};

/**
 * Recupere un apercu (les N premieres photos visibles) pour la page d'accueil.
 */
export const fetchPreviewPhotos = async (limit = 8) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_visible", true)
    .order("position", { ascending: true })
    .limit(limit);
  return { data: data || [], error };
};
