import { supabase } from "../supabase/supabaseClient";

export const listCategoriesWithParent = async () => {
  return supabase
    .from("categories")
    .select(
      `
        *,
        parent:parent_id (
          id,
          name
        )
      `
    )
    .order("parent_id", { nullsFirst: true })
    .order("name");
};

const normalizePayload = payload => ({
  ...payload,
  parent_id: payload.parent_id ? Number(payload.parent_id) : null,
});

export const insertCategory = async payload =>
  supabase.from("categories").insert([normalizePayload(payload)]);

export const updateCategory = async (id, payload) =>
  supabase.from("categories").update(normalizePayload(payload)).eq("id", id);

export const deleteCategory = async id => supabase.from("categories").delete().eq("id", id);

export const hasSubcategories = async id =>
  supabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id);

export const hasProductsInCategory = async id =>
  supabase.from("items").select("id", { count: "exact", head: true }).eq("category_id", id);

// Récupère le nombre de produits pour TOUTES les catégories en une seule requête
export const countAllCategoryProducts = async () => {
  const { data, error } = await supabase.from("items").select("category_id");

  if (error) return { data: {}, error };

  // Compter les occurrences de chaque category_id
  const counts = {};
  (data || []).forEach(row => {
    if (row.category_id) {
      counts[row.category_id] = (counts[row.category_id] || 0) + 1;
    }
  });

  return { data: counts, error: null };
};
