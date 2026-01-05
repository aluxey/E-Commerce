import { supabase } from "../supabase/supabaseClient";

const TABLE_ITEMS = "items";
const TABLE_CATEGORIES = "categories";
const TABLE_VARIANTS = "item_variants";

export const listProducts = async () => {
  return supabase
    .from(TABLE_ITEMS)
    .select(
      `
        id, name, price, description, category_id, status, pattern_type,
        item_images ( id, image_url ),
        categories (
          id,
          name,
          parent_id,
          parent:parent_id ( id, name )
        ),
        item_variants ( id, size, price, stock, sku )
      `
    )
    .order("id", { ascending: false })
    .order("id", { foreignTable: "item_images", ascending: true });
};

export const listCategories = async () => {
  return supabase
    .from(TABLE_CATEGORIES)
    .select(
      `
        id,
        name,
        parent_id,
        parent:parent_id ( id, name )
      `
    )
    .order("parent_id", { nullsFirst: true })
    .order("name");
};

export const fetchVariantsByItem = async itemId =>
  supabase
    .from(TABLE_VARIANTS)
    .select("id, size, price, stock, sku")
    .eq("item_id", itemId)
    .order("price", { ascending: true })
    .order("id", { ascending: true });

const sanitizeItemPayload = payload => ({
  name: payload.name ?? null,
  description: payload.description ?? null,
  category_id: payload.category_id ?? null,
  price: payload.price ?? null,
  status: payload.status ?? undefined,
  pattern_type: payload.pattern_type || null,
});

export const upsertItem = async (itemPayload, editingId) => {
  const payload = sanitizeItemPayload(itemPayload);
  if (editingId) {
    return supabase.from(TABLE_ITEMS).update(payload).eq("id", editingId);
  }
  return supabase.from(TABLE_ITEMS).insert([payload]).select("id").single();
};



export const upsertVariants = async variantsPayload =>
  supabase.from(TABLE_VARIANTS).upsert(variantsPayload, { onConflict: "id" });

export const insertVariants = async variantsPayload =>
  supabase.from(TABLE_VARIANTS).insert(variantsPayload);

export const deleteVariants = async ids => supabase.from(TABLE_VARIANTS).delete().in("id", ids);

export const updateItemPriceMeta = async (itemId, price) =>
  supabase.from(TABLE_ITEMS).update({ price }).eq("id", itemId);

export const deleteItem = async id => supabase.from(TABLE_ITEMS).delete().eq("id", id);

export const insertItemImage = async (itemId, imageUrl) =>
  supabase.from("item_images").insert([{ item_id: itemId, image_url: imageUrl }]);

export const deleteItemImage = async imageId =>
  supabase.from("item_images").delete().eq("id", imageId);

// Reorder images by deleting and reinserting in the desired order
// The first image in the array will be the primary image
export const reorderItemImages = async (itemId, imageIds) => {
  // Get all images for this item
  const { data: images, error: fetchError } = await supabase
    .from("item_images")
    .select("id, image_url")
    .eq("item_id", itemId);

  if (fetchError) return { error: fetchError };
  if (!images || images.length === 0) return { error: null };

  // Create a map for quick lookup
  const imageMap = new Map(images.map(img => [img.id, img]));

  // Get the images in the desired order
  const orderedImages = imageIds
    .map(id => imageMap.get(id))
    .filter(Boolean);

  // Delete all existing images
  const { error: deleteError } = await supabase
    .from("item_images")
    .delete()
    .eq("item_id", itemId);

  if (deleteError) return { error: deleteError };

  // Reinsert in the desired order
  const inserts = orderedImages.map(img => ({
    item_id: itemId,
    image_url: img.image_url
  }));

  const { error: insertError } = await supabase
    .from("item_images")
    .insert(inserts);

  return { error: insertError };
};

export const uploadProductImage = async (filePath, file) =>
  supabase.storage.from("product-images").upload(filePath, file);

export const removeProductImage = async path =>
  supabase.storage.from("product-images").remove([path]);

export const getPublicImageUrl = filePath =>
  supabase.storage.from("product-images").getPublicUrl(filePath);


