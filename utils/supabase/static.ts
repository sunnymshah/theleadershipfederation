import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Cookie-free Supabase client using the anon key.
 *
 * Use this for read-only public queries inside `unstable_cache` or React
 * `cache()` where `cookies()` is unavailable / unnecessary.
 */
export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  )
}
