import { supabase } from "../supabase/supabaseClient";

export const fetchLatestItems = async (limit = 4) => {
  const { data, error } = await supabase
    .from('items')
    .select('*, item_images ( image_url ), item_variants ( id, size, price, stock )')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
};

export const fetchTopItems = async (limit = 4) => {
  // Fallback: juste les derniers produits si la RPC n'est pas dispo
  const { data, error } = await fetchLatestItems(limit);
  return { data, error };
};

export const fetchItemsWithRelations = async () => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      item_images ( image_url ),
      item_variants ( id, size, price, stock ),
      categories (
        id,
        name,
        parent_id,
        parent:parent_id ( id, name )
      )
    `);
  return { data: data || [], error };
};

export const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select(
      `
        id,
        name,
        parent_id,
        parent:parent_id ( id, name )
      `
    )
    .order('parent_id', { nullsFirst: true })
    .order('name');
  return { data: data || [], error };
};

export const fetchItemDetail = async id => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      item_images ( image_url ),
      item_variants ( id, size, price, stock ),
      categories (
        id,
        name,
        parent_id,
        parent:parent_id ( id, name )
      )
    `)
    .eq('id', id)
    .single();
  return { data, error };
};

export const fetchRelatedItems = async (categoryId, excludeId, limit = 4) => {
  if (!categoryId) return { data: [], error: null };
  let query = supabase
    .from('items')
    .select(`
      *,
      item_images ( image_url ),
      item_variants ( id, size, price, stock )
    `)
    .eq('category_id', categoryId)
    .limit(limit);
  
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data, error } = await query;
  return { data: data || [], error };
};

export const fetchItemRatings = async ids => {
  if (!ids?.length) return { data: [], error: null };
  return supabase
    .from('item_ratings')
    .select('item_id, rating')
    .in('item_id', ids);
};
