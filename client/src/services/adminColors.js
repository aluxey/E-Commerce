import { supabase } from "../supabase/supabaseClient";

const TABLE_COLORS = "colors";

export const listColors = async () => supabase.from(TABLE_COLORS).select("*").order("name");

export const upsertColor = async payload =>
  supabase.from(TABLE_COLORS).upsert(payload, { onConflict: "id" });

export const deleteColor = async id => supabase.from(TABLE_COLORS).delete().eq("id", id);

// Since colors are now global (available for all products), usage count is always 0
// The item_colors junction table has been removed
export const countColorUsage = async colorId => ({ count: 0, error: null });

export const countAllColorUsages = async () => ({ data: {}, error: null });