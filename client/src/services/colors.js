import { supabase } from "../supabase/supabaseClient";

const TABLE_COLORS = "colors";

export const listColors = async () => supabase.from(TABLE_COLORS).select("*").order("name");
