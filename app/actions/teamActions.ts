"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import type { TeamRole } from "@/lib/permissions"

/* ── Helpers ──────────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

async function requireSuperAdmin() {
  const { supabase, user } = await getAuthenticatedClient()
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!member || member.role !== "super_admin") {
    throw new Error("Access not allowed. Please contact the super admin (Sunny Shah) to request permissions.")
  }
  return { supabase, user }
}

/* ── Get current user role ────────────────────────────────────────────── */

export async function getCurrentUserRole(): Promise<{
  role: TeamRole | null
  email: string | null
  name: string | null
}> {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    const { data: member } = await supabase
      .from("team_members")
      .select("role, email, name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!member) {
      // No team_members row → no role. User must be added by super admin (Sunny Shah).
      return { role: null, email: user.email ?? null, name: null }
    }

    return {
      role: member.role as TeamRole,
      email: member.email,
      name: member.name,
    }
  } catch {
    return { role: null, email: null, name: null }
  }
}

/* ── List team members (super_admin only) ─────────────────────────────── */

export async function getTeamMembers() {
  try {
    const { supabase } = await requireSuperAdmin()

    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) return { success: false, error: error.message, members: [] }
    return { success: true, members: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, members: [] }
  }
}

/* ── Invite a team member ─────────────────────────────────────────────── */

export async function inviteTeamMember(
  email: string,
  name: string,
  role: TeamRole
) {
  try {
    const { supabase } = await requireSuperAdmin()

    if (!email || !name || !role) {
      return { success: false, error: "Email, name, and role are required." }
    }

    // Check if email is already a team member
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", email)
      .single()

    if (existing) {
      return { success: false, error: "This email is already a team member." }
    }

    // Invite user via Supabase Auth (sends magic link / invite email)
    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email)

    if (inviteError) {
      // If user already exists in auth, we can still add them to team_members
      if (!inviteError.message.includes("already been registered")) {
        return { success: false, error: inviteError.message }
      }
    }

    // Get the user ID (from invite or existing user)
    let userId = inviteData?.user?.id
    if (!userId) {
      // Look up existing auth user by email
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find((u) => u.email === email)
      userId = existingUser?.id
    }

    if (!userId) {
      return {
        success: false,
        error: "Could not create or find user account.",
      }
    }

    // Insert team_members record
    const { error: insertError } = await supabase.from("team_members").insert({
      user_id: userId,
      email,
      name,
      role,
    })

    if (insertError) return { success: false, error: insertError.message }

    revalidatePath("/admin/team", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Update member role ───────────────────────────────────────────────── */

export async function updateMemberRole(memberId: string, newRole: TeamRole) {
  try {
    const { supabase, user } = await requireSuperAdmin()

    // Prevent super_admin from demoting themselves
    const { data: target } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("id", memberId)
      .single()

    if (target?.user_id === user.id) {
      return { success: false, error: "You cannot change your own role." }
    }

    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", memberId)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/team", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Remove team member ───────────────────────────────────────────────── */

export async function removeMember(memberId: string) {
  try {
    const { supabase, user } = await requireSuperAdmin()

    // Prevent removing yourself
    const { data: target } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("id", memberId)
      .single()

    if (target?.user_id === user.id) {
      return { success: false, error: "You cannot remove yourself from the team." }
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/team", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
