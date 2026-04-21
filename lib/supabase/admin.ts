/**
 * lib/supabase/admin.ts — Service-Role Supabase Client
 *
 * Uses SUPABASE_SECRET_KEY (sb_secret_... format) to bypass Row Level Security.
 * This is intentional: auth callbacks and Server Actions run as trusted server
 * code and need unfettered access to user + organisation records.
 *
 * NEVER import this file in client components or expose it to the browser.
 * The taint API in next.config.ts will throw if you try.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("[admin] Missing NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseServiceKey) {
  throw new Error("[admin] Missing SUPABASE_SECRET_KEY");
}

export const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // Server-side only. No token refresh or session persistence needed.
    autoRefreshToken: false,
    persistSession: false,
  },
});
