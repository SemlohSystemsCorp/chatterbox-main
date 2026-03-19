import { createBrowserClient } from "@supabase/ssr";

// Build-time fallback so `next build` doesn't crash when env vars are missing
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
