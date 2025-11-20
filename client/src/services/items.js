import { supabase } from "../supabase/supabaseClient";

export const fetchLatestItems = async (limit = 4) => {
  const { data, error } = await supabase
    .from('items')
    .select('*, item_images ( image_url ), item_variants ( id, size, color, price, stock )')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
};

export const fetchTopItems = async (limit = 4) => {
  const { data: topAgg, error } = await supabase.rpc('top_purchased_items', { limit_count: limit });
  if (error) return { data: [], error };
  if (!topAgg?.length) return { data: [], error: null };

  const ids = topAgg.map(r => r.item_id);
  const { data: items, error: itemsErr } = await supabase
    .from('items')
    .select('*, item_images ( image_url ), item_variants ( id, size, color, price, stock )')
    .in('id', ids);

  return {
    data: items ? ids.map(id => items.find(i => i.id === id)).filter(Boolean) : [],
    error: itemsErr,
  };
};

export const fetchItemsWithRelations = async () => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      item_images ( image_url ),
      item_variants ( id, size, color, price, stock ),
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
        item_variants ( id, size, color, price, stock )
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
      item_variants ( id, size, color, price, stock )
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
