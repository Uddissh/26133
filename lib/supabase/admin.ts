import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — import ONLY in server-side code (route handlers, server actions).
// Never expose this client or the key to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
