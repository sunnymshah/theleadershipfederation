import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { TeamManager } from "@/components/admin/TeamManager"

export const metadata = {
  title: "Team Management",
}

export default async function TeamPage() {
  /* ── Auth + role gate: super_admin only ─────────────────────────── */
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/admin/login")
  }

  // Check if user is super_admin
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .single()

  // If team_members table has rows but user isn't super_admin, block access
  // If no rows exist at all, allow access (first-time setup)
  if (member && member.role !== "super_admin") {
    redirect("/admin")
  }

  return <TeamManager />
}
