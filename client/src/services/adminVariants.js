import { supabase } from "../supabase/supabaseClient";

export const listVariants = async () =>
  supabase
    .from('item_variants')
    .select(
      `
      id, item_id, size, price, stock, sku,
      items ( name )
      `
    )
    .order('id', { ascending: false });

export const upsertVariant = async payload =>
  supabase.from('item_variants').upsert(payload, { onConflict: 'id' });

export const deleteVariant = async id =>
  supabase.from('item_variants').delete().eq('id', id);

export const listItemsBasic = async () =>
  supabase.from('items').select('id, name');
