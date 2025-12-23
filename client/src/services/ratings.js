import { supabase } from "../supabase/supabaseClient";

/**
 * Fetch average rating and count for an item
 * @param {string} itemId - The item ID
 * @returns {Promise<{avg: number, count: number, error: any}>}
 */
export const fetchItemRatingStats = async (itemId) => {
  const { data, error } = await supabase
    .from("item_ratings")
    .select("rating")
    .eq("item_id", itemId);

  if (error) {
    return { avg: 0, count: 0, error };
  }

  const count = data.length;
  const avg = count ? data.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  
  return { avg, count, error: null };
};

/**
 * Fetch detailed reviews for an item
 * @param {string} itemId - The item ID
 * @param {number} limit - Maximum number of reviews to fetch (default: 5)
 * @returns {Promise<{data: Array, error: any}>}
 */
export const fetchItemReviews = async (itemId, limit = 5) => {
  const { data, error } = await supabase
    .from("item_ratings")
    .select(`
      rating,
      comment,
      created_at,
      users (
        email
      )
    `)
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: data || [], error };
};

/**
 * Fetch current user's rating for an item
 * @param {string} itemId - The item ID
 * @param {string} userId - The user ID
 * @returns {Promise<{rating: number|null, error: any}>}
 */
export const fetchUserRating = async (itemId, userId) => {
  if (!userId) {
    return { rating: null, error: null };
  }

  const { data, error } = await supabase
    .from("item_ratings")
    .select("rating")
    .eq("item_id", itemId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned (not an actual error)
    return { rating: null, error };
  }

  return { rating: data?.rating || null, error: null };
};

/**
 * Submit or update a rating for an item
 * @param {string} itemId - The item ID
 * @param {string} userId - The user ID
 * @param {number} rating - The rating (1-5)
 * @param {string|null} comment - Optional comment
 * @returns {Promise<{error: any}>}
 */
export const submitRating = async (itemId, userId, rating, comment = null) => {
  const { error } = await supabase
    .from("item_ratings")
    .upsert(
      {
        item_id: itemId,
        user_id: userId,
        rating,
        comment: comment?.trim() || null,
      },
      { onConflict: "item_id,user_id" }
    );

  return { error };
};

/**
 * Load all rating data for an item (stats, reviews, and optionally user rating)
 * @param {string} itemId - The item ID
 * @param {string|null} userId - Optional user ID for fetching user's rating
 * @returns {Promise<{avgRating: number, reviews: Array, userRating: number|null, error: any}>}
 */
export const loadAllRatings = async (itemId, userId = null) => {
  const [statsResult, reviewsResult, userRatingResult] = await Promise.all([
    fetchItemRatingStats(itemId),
    fetchItemReviews(itemId),
    userId ? fetchUserRating(itemId, userId) : Promise.resolve({ rating: null, error: null }),
  ]);

  const error = statsResult.error || reviewsResult.error || userRatingResult.error;

  return {
    avgRating: statsResult.avg,
    reviews: reviewsResult.data,
    userRating: userRatingResult.rating,
    error,
  };
};
