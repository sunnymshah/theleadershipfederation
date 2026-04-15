import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client.
 *
 * Uses the SUPABASE_SERVICE_ROLE_KEY and bypasses RLS. REQUIRED for
 * `auth.admin.*` operations (createUser, deleteUser, listUsers, etc.).
 *
 * NEVER expose this client to the browser. Import only from server
 * actions, route handlers, or other server-only code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars."
    )
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
