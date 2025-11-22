import { supabase } from "../supabase/supabaseClient";

const TABLE_COLORS = 'colors';
const TABLE_ITEM_COLORS = 'item_colors';

export const listColors = async () =>
  supabase.from(TABLE_COLORS).select('*').order('name');

export const upsertColor = async payload =>
  supabase.from(TABLE_COLORS).upsert(payload, { onConflict: 'id' });

export const deleteColor = async id =>
  supabase.from(TABLE_COLORS).delete().eq('id', id);

export const countColorUsage = async colorId =>
  supabase.from(TABLE_ITEM_COLORS).select('item_id', { count: 'exact', head: true }).eq('color_id', colorId);
