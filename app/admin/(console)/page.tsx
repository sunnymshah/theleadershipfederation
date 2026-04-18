/**
 * ─── ADMIN HOME — WORKSPACE PICKER ───────────────────────────────────
 *
 * Post-login landing. Shows the workspaces the current user has
 * access to as big accent-coloured cards (Backstage / CRM / Studio /
 * Finance). Picking one enters that workspace's focused sidebar.
 *
 * The old all-in-one analytics dashboard has moved to /admin/analytics
 * (accessible via the Foundation rail in the sidebar).
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { AdminHomeTiles } from "@/components/admin/AdminHomeTiles"

export const metadata = { title: "Admin" }

export default async function AdminHomePage() {
  // Resolve display name from team_members via service-role (dodges RLS).
  // Fallback gracefully to the auth email if the admin client isn't
  // configured locally — the picker still renders with a generic
  // greeting.
  let displayName: string | null = null
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        const admin = createAdminClient()
        const { data: member } = await admin
          .from("team_members")
          .select("name")
          .eq("user_id", user.id)
          .maybeSingle()
        displayName = member?.name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? null
      } catch {
        displayName = user.user_metadata?.name ?? user.email?.split("@")[0] ?? null
      }
    }
  } catch {
    displayName = null
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 md:py-8">
      <AdminHomeTiles userName={displayName} />
    </div>
  )
}
