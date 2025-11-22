import { supabase } from "../supabase/supabaseClient";

const TABLE_ITEMS = 'items';
const TABLE_CATEGORIES = 'categories';
const TABLE_VARIANTS = 'item_variants';

export const listProducts = async () => {
  return supabase
    .from(TABLE_ITEMS)
    .select(
      `
        id, name, price, description, category_id, status,
        item_images ( id, image_url ),
        categories ( id, name ),
        item_variants ( id, size, color_id, price, stock, sku ),
        item_colors ( color_id, colors ( id, name, hex_code ) )
      `
    )
    .order('id', { ascending: false });
};

export const listCategories = async () => {
  return supabase.from(TABLE_CATEGORIES).select('id, name').order('name');
};

export const fetchVariantsByItem = async itemId =>
  supabase
    .from(TABLE_VARIANTS)
    .select('id, size, color_id, price, stock, sku')
    .eq('item_id', itemId)
    .order('price', { ascending: true })
    .order('id', { ascending: true });

export const upsertItem = async (itemPayload, editingId) => {
  if (editingId) {
    return supabase.from(TABLE_ITEMS).update(itemPayload).eq('id', editingId);
  }
  return supabase.from(TABLE_ITEMS).insert([itemPayload]).select('id').single();
};

export const insertItemWithColors = async (itemPayload, colorIds) => {
  return supabase
    .from(TABLE_ITEMS)
    .insert([
      {
        ...itemPayload,
        item_colors: {
          data: (colorIds || []).map(id => ({ color_id: id })),
        },
      },
    ])
    .select('id')
    .single();
};

export const syncItemColors = async (itemId, colorIds) => {
  const ids = Array.from(new Set(colorIds || [])).filter(Boolean);
  if (!ids.length) throw new Error('Au moins une couleur est requise pour le produit.');

  const inserts = ids.map(id => ({ item_id: itemId, color_id: id }));
  const { error: insertError } = await supabase
    .from('item_colors')
    .upsert(inserts, { onConflict: 'item_id,color_id' });
  if (insertError) return { error: insertError };

  const { error: deleteError } = await supabase
    .from('item_colors')
    .delete()
    .eq('item_id', itemId)
    .not('color_id', 'in', `(${ids.join(',')})`);

  return { error: deleteError };
};

export const upsertVariants = async variantsPayload =>
  supabase.from(TABLE_VARIANTS).upsert(variantsPayload, { onConflict: 'id' });

export const insertVariants = async variantsPayload =>
  supabase.from(TABLE_VARIANTS).insert(variantsPayload);

export const deleteVariants = async ids =>
  supabase.from(TABLE_VARIANTS).delete().in('id', ids);

export const updateItemPriceMeta = async (itemId, price) =>
  supabase
    .from(TABLE_ITEMS)
    .update({ price })
    .eq('id', itemId);

export const deleteItem = async id =>
  supabase.from(TABLE_ITEMS).delete().eq('id', id);

export const insertItemImage = async (itemId, imageUrl) =>
  supabase.from('item_images').insert([{ item_id: itemId, image_url: imageUrl }]);

export const deleteItemImage = async imageId =>
  supabase.from('item_images').delete().eq('id', imageId);

export const uploadProductImage = async (filePath, file) =>
  supabase.storage.from('product-images').upload(filePath, file);

export const removeProductImage = async path =>
  supabase.storage.from('product-images').remove([path]);

export const getPublicImageUrl = filePath =>
  supabase.storage.from('product-images').getPublicUrl(filePath);
