import { supabase } from "../supabase/supabaseClient";

export const listCategoriesWithParent = async () => {
  return supabase
    .from('categories')
    .select(
      `
        *,
        parent:parent_id (
          name
        )
      `
    )
    .order('name');
};

export const insertCategory = async payload =>
  supabase.from('categories').insert([payload]);

export const updateCategory = async (id, payload) =>
  supabase.from('categories').update(payload).eq('id', id);

export const deleteCategory = async id =>
  supabase.from('categories').delete().eq('id', id);

export const hasSubcategories = async id =>
  supabase.from('categories').select('id', { count: 'exact', head: true }).eq('parent_id', id);

export const hasProductsInCategory = async id =>
  supabase.from('items').select('id', { count: 'exact', head: true }).eq('category_id', id);
