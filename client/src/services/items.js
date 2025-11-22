import { supabase } from "../supabase/supabaseClient";

export const fetchLatestItems = async (limit = 4) => {
  const { data, error } = await supabase
    .from('items')
    .select('*, item_images ( image_url ), item_variants ( id, size, color_id, price, stock ), item_colors ( colors ( id, name, hex_code ) )')
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
      item_variants ( id, size, color_id, price, stock ),
      item_colors ( colors ( id, name, hex_code ) ),
      categories ( id, name )
    `);
  return { data: data || [], error };
};

export const fetchCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*');
  return { data: data || [], error };
};

export const fetchItemDetail = async id => {
  const { data, error } = await supabase
    .from('items')
    .select(
      `
        *,
        item_images ( image_url ),
        item_variants ( id, size, color_id, price, stock ),
        item_colors ( colors ( id, name, hex_code ) )
      `
    )
    .eq('id', id)
    .single();
  return { data, error };
};

export const fetchRelatedItems = async (categoryId, excludeId, limit = 4) => {
  if (!categoryId) return { data: [], error: null };
  const query = supabase
    .from('items')
    .select(`
      *,
      item_images ( image_url ),
      item_variants ( id, size, color_id, price, stock ),
      item_colors ( colors ( id, name, hex_code ) )
    `)
    .eq('category_id', categoryId)
    .limit(limit);

  if (excludeId) query.neq('id', excludeId);
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
