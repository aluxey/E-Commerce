import { supabase } from "../supabase/supabaseClient";

/**
 * Fetch featured testimonials for the homepage
 * Only returns approved and featured testimonials with optional item details
 */
export const fetchFeaturedTestimonials = async (limit = 10) => {
  const { data, error } = await supabase
    .from("testimonials")
    .select(`
      id,
      author_name,
      content,
      image_url,
      rating,
      type,
      created_at,
      item_id,
      items:item_id (
        id,
        name,
        item_images ( image_url, position )
      )
    `)
    .eq("status", "approved")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: data || [], error };
};

/**
 * Fetch all approved testimonials (for a dedicated testimonials page if needed)
 */
export const fetchApprovedTestimonials = async (limit = 50) => {
  const { data, error } = await supabase
    .from("testimonials")
    .select(`
      id,
      author_name,
      content,
      image_url,
      rating,
      type,
      created_at,
      item_id,
      items:item_id (
        id,
        name,
        item_images ( image_url, position )
      )
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: data || [], error };
};
