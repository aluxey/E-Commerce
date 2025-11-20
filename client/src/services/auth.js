import { supabase } from "../supabase/supabaseClient";

export const signOut = async () => supabase.auth.signOut();

export const fetchUserProfile = async (userId) =>
  supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle();
