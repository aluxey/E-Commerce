import { supabase } from "../supabase/supabaseClient";

const TABLE_ITEMS = 'items';
const TABLE_CATEGORIES = 'categories';
const TABLE_VARIANTS = 'item_variants';

export const listProducts = async () => {
  return supabase
    .from(TABLE_ITEMS)
    .select(
      `
        id, name, price, description, category_id, sizes, colors,
        item_images ( id, image_url ),
        categories ( id, name ),
        item_variants ( id, size, color, price, stock, sku )
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
    .select('id, size, color, price, stock, sku')
    .eq('item_id', itemId)
    .order('price', { ascending: true })
    .order('id', { ascending: true });

export const upsertItem = async (itemPayload, editingId) => {
  if (editingId) {
    return supabase.from(TABLE_ITEMS).update(itemPayload).eq('id', editingId);
  }
  return supabase.from(TABLE_ITEMS).insert([itemPayload]).select('id').single();
};

export const upsertVariants = async variantsPayload =>
  supabase.from(TABLE_VARIANTS).upsert(variantsPayload, { onConflict: 'id' });

export const insertVariants = async variantsPayload =>
  supabase.from(TABLE_VARIANTS).insert(variantsPayload);

export const deleteVariants = async ids =>
  supabase.from(TABLE_VARIANTS).delete().in('id', ids);

export const updateItemPriceMeta = async (itemId, price, sizes, colors) =>
  supabase
    .from(TABLE_ITEMS)
    .update({ price, sizes, colors })
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
