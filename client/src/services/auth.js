import { supabase } from "../supabase/supabaseClient";

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const signIn = async (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

/**
 * Sign up with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const signUp = async (email, password) =>
  supabase.auth.signUp({ email, password });

/**
 * Sign out current user
 */
export const signOut = async () => supabase.auth.signOut();

/**
 * Fetch user profile from users table
 * @param {string} userId 
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const fetchUserProfile = async (userId) =>
  supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle();

/**
 * Create or update user profile in users table
 * @param {object} payload - { id, email, role }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const upsertUserProfile = async (payload) =>
  supabase.from('users').upsert(payload, { onConflict: 'id' });
