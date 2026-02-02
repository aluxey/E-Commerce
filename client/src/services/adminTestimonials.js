import { supabase } from "../supabase/supabaseClient";

const TABLE = "testimonials";
const STORAGE_BUCKET = "product-images";

/**
 * List all testimonials with optional filters (for admin)
 */
export const listTestimonials = async (filters = {}) => {
  let query = supabase
    .from(TABLE)
    .select(`
      id,
      author_name,
      content,
      image_url,
      rating,
      type,
      is_featured,
      status,
      created_at,
      updated_at,
      user_id,
      item_id,
      order_id,
      users:user_id ( id, email ),
      items:item_id ( id, name ),
      orders:order_id ( id )
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.is_featured !== undefined) {
    query = query.eq("is_featured", filters.is_featured);
  }

  return query;
};

/**
 * Get a single testimonial by ID
 */
export const getTestimonial = async (id) => {
  return supabase
    .from(TABLE)
    .select(`
      id,
      author_name,
      content,
      image_url,
      rating,
      type,
      is_featured,
      status,
      created_at,
      updated_at,
      user_id,
      item_id,
      order_id,
      users:user_id ( id, email ),
      items:item_id ( id, name ),
      orders:order_id ( id )
    `)
    .eq("id", id)
    .single();
};

/**
 * Create a new testimonial
 */
export const createTestimonial = async (payload) => {
  const sanitized = sanitizePayload(payload);
  return supabase.from(TABLE).insert([sanitized]).select("id").single();
};

/**
 * Update an existing testimonial
 */
export const updateTestimonial = async (id, payload) => {
  const sanitized = sanitizePayload(payload);
  return supabase.from(TABLE).update(sanitized).eq("id", id);
};

/**
 * Delete a testimonial
 */
export const deleteTestimonial = async (id) => {
  return supabase.from(TABLE).delete().eq("id", id);
};

/**
 * Toggle featured status
 */
export const toggleFeatured = async (id, isFeatured) => {
  return supabase.from(TABLE).update({ is_featured: isFeatured }).eq("id", id);
};

/**
 * Update testimonial status (approve/reject)
 */
export const updateStatus = async (id, status) => {
  return supabase.from(TABLE).update({ status }).eq("id", id);
};

/**
 * Upload a testimonial image to storage
 */
export const uploadTestimonialImage = async (filePath, file) => {
  return supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);
};

/**
 * Remove a testimonial image from storage
 */
export const removeTestimonialImage = async (path) => {
  return supabase.storage.from(STORAGE_BUCKET).remove([path]);
};

/**
 * Get public URL for an image
 */
export const getPublicImageUrl = (filePath) => {
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
};

/**
 * Sanitize payload before insert/update
 */
const sanitizePayload = (payload) => ({
  author_name: payload.author_name ?? null,
  content: payload.content ?? null,
  image_url: payload.image_url ?? null,
  rating: payload.rating ?? null,
  type: payload.type ?? "product",
  is_featured: payload.is_featured ?? false,
  status: payload.status ?? "pending",
  user_id: payload.user_id ?? null,
  item_id: payload.item_id ?? null,
  order_id: payload.order_id ?? null,
});
