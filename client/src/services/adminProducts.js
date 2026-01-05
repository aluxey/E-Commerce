import { supabase } from "../supabase/supabaseClient";

const TABLE_ITEMS = "items";
const TABLE_CATEGORIES = "categories";
const TABLE_VARIANTS = "item_variants";

export const listProducts = async () => {
  return supabase
    .from(TABLE_ITEMS)
    .select(
      `
        id, name, price, description, category_id, status,
        item_images ( id, image_url, position ),
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
    .order("position", { foreignTable: "item_images", ascending: true });
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

export const insertItemImage = async (itemId, imageUrl, position = 0) =>
  supabase.from("item_images").insert([{ item_id: itemId, image_url: imageUrl, position }]);

export const deleteItemImage = async imageId =>
  supabase.from("item_images").delete().eq("id", imageId);

// Get the maximum position for images of an item
export const getMaxImagePosition = async itemId => {
  const { data, error } = await supabase
    .from("item_images")
    .select("position")
    .eq("item_id", itemId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") return { maxPosition: -1, error };
  return { maxPosition: data?.position ?? -1, error: null };
};

// Reorder images by updating their position values
// The first image in the array will be the primary image (position 0)
export const reorderItemImages = async (itemId, imageIds) => {
  if (!imageIds || imageIds.length === 0) return { error: null };

  // Update each image's position based on its index in the array
  const updates = imageIds.map((id, index) =>
    supabase
      .from("item_images")
      .update({ position: index })
      .eq("id", id)
      .eq("item_id", itemId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find(r => r.error);
  return { error: firstError?.error || null };
};

export const uploadProductImage = async (filePath, file) =>
  supabase.storage.from("product-images").upload(filePath, file);

export const removeProductImage = async path =>
  supabase.storage.from("product-images").remove([path]);

export const getPublicImageUrl = filePath =>
  supabase.storage.from("product-images").getPublicUrl(filePath);


