import { supabase } from "../supabase/supabaseClient";

const stripItemColors = select =>
  select.replace(/,\s*item_colors:[^)]+\([^)]*\)/g, '').replace(/\s*item_colors:[^)]+\([^)]*\),?/g, '');

const selectItemsWithFallback = async (select, opts = {}) => {
  const build = sel => {
    let query = supabase.from('items').select(sel);
    if (opts.eq) query = query.eq(opts.eq[0], opts.eq[1]);
    if (opts.neq) query = query.neq(opts.neq[0], opts.neq[1]);
    if (opts.in) query = query.in(opts.in[0], opts.in[1]);
    if (opts.order) query = query.order(opts.order[0], { ascending: opts.order[1] });
    if (opts.limit) query = query.limit(opts.limit);
    if (opts.single) query = query.single();
    return query;
  };

  const first = await build(select);
  if (!first.error) return first;

  if (String(first.error.message || '').includes('item_colors')) {
    const fallbackSelect = stripItemColors(select);
    return build(fallbackSelect);
  }

  return first;
};

export const fetchLatestItems = async (limit = 4) => {
  const { data, error } = await selectItemsWithFallback(
    '*, item_images ( image_url ), item_variants ( id, size, color_id, price, stock ), item_colors:item_colors!item_id ( colors ( id, name, hex_code ) )',
    { order: ['created_at', false], limit }
  );
  return { data: data || [], error };
};

export const fetchTopItems = async (limit = 4) => {
  // Fallback: juste les derniers produits si la RPC n'est pas dispo
  const { data, error } = await fetchLatestItems(limit);
  return { data, error };
};

export const fetchItemsWithRelations = async () => {
  const { data, error } = await selectItemsWithFallback(
    `
      *,
      item_images ( image_url ),
      item_variants ( id, size, color_id, price, stock ),
      item_colors:item_colors!item_id ( colors ( id, name, hex_code ) ),
      categories (
        id,
        name,
        parent_id,
        parent:parent_id ( id, name )
      )
    `
  );
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
  const { data, error } = await selectItemsWithFallback(
    `
      *,
      item_images ( image_url ),
      item_variants ( id, size, color_id, price, stock ),
      item_colors:item_colors!item_id ( colors ( id, name, hex_code ) ),
      categories (
        id,
        name,
        parent_id,
        parent:parent_id ( id, name )
      )
    `,
    { eq: ['id', id], single: true }
  );
  return { data, error };
};

export const fetchRelatedItems = async (categoryId, excludeId, limit = 4) => {
  if (!categoryId) return { data: [], error: null };
  const { data, error } = await selectItemsWithFallback(
    `
      *,
      item_images ( image_url ),
      item_variants ( id, size, color_id, price, stock ),
      item_colors:item_colors!item_id ( colors ( id, name, hex_code ) )
    `,
    { eq: ['category_id', categoryId], limit, neq: excludeId ? ['id', excludeId] : null }
  );
  return { data: data || [], error };
};

export const fetchItemRatings = async ids => {
  if (!ids?.length) return { data: [], error: null };
  return supabase
    .from('item_ratings')
    .select('item_id, rating')
    .in('item_id', ids);
};
