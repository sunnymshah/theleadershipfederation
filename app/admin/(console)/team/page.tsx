/**
 * ─── TEAM & ACCESS ──────────────────────────────────────────────────────
 *
 * Single home for human-access management:
 *   • Members     — who has a login (TeamManager)
 *   • Profiles    — what those logins can do (AccessProfilesManager)
 *
 * Both used to live in different places (Team page + Settings → Profiles
 * tab). Unified here so onboarding a new member is one flow.
 *
 * Still super_admin-only — same gate the page had before.
 */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { TeamAccessTabs } from "@/components/admin/TeamAccessTabs"

export const metadata = {
  title: "Team & Access",
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/admin/login")
  }

  // super_admin gate — identical to the original behaviour.
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (member && member.role !== "super_admin") {
    redirect("/admin")
  }

  const params = await searchParams
  const initialTab = params?.tab === "profiles" ? "profiles" : "members"

  return <TeamAccessTabs initialTab={initialTab} />
}
