import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Backward-compatible: accept old VITE_SUPABASE_KEY if present
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl) {
  console.error(
    "Missing VITE_SUPABASE_URL. Add it to client/.env.local (see client/.env.example)."
  );
}
if (!supabaseAnonKey) {
  console.error(
    "Missing VITE_SUPABASE_ANON_KEY (or legacy VITE_SUPABASE_KEY). Add it to client/.env.local."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
