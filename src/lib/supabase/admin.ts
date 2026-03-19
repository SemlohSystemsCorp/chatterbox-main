import { createClient } from "@supabase/supabase-js";

// Build-time fallback so `next build` doesn't crash when env vars are missing
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
