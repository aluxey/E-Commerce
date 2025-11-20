import { supabase } from "../supabase/supabaseClient";

export const listUsers = async () =>
  supabase
    .from('users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false });

export const updateUserRole = async (id, role) =>
  supabase.from('users').update({ role }).eq('id', id);

export const deleteUser = async id =>
  supabase.from('users').delete().eq('id', id);
