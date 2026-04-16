"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

/* Hard timeout so auth calls can never hang the admin UI. */
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ])
}

/* ── Types ────────────────────────────────────────────────────────────── */

export interface ProfilePermissions {
  events: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  tickets: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  attendees: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean }
  speakers: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  sessions: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  sponsors: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  promo_codes: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  analytics: { view: boolean }
  certificates: { view: boolean; generate: boolean; email: boolean }
  invoices: { view: boolean; generate: boolean; email: boolean }
  check_in: { perform: boolean }
  settings: { view: boolean; edit: boolean }
  team: { view: boolean; manage: boolean }
  payments: { view: boolean; refund: boolean }
  /** Revenue & financial totals — gross, net, refund volume, fees, payout reports. SENSITIVE. */
  revenue: { view: boolean; export: boolean }
}

export interface AccessProfile {
  id: string
  name: string
  description: string | null
  color: string
  permissions: ProfilePermissions
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  member_count?: number
  /** Team members linked to this profile — only returned to super admins. */
  members?: Array<{
    id: string
    user_id: string
    email: string
    name: string | null
    role: string
  }>
}

/* ── Constants ────────────────────────────────────────────────────────── */

export const DEFAULT_PERMISSIONS: ProfilePermissions = {
  events: { view: false, create: false, edit: false, delete: false },
  tickets: { view: false, create: false, edit: false, delete: false },
  attendees: { view: false, create: false, edit: false, delete: false, export: false },
  speakers: { view: false, create: false, edit: false, delete: false },
  sessions: { view: false, create: false, edit: false, delete: false },
  sponsors: { view: false, create: false, edit: false, delete: false },
  promo_codes: { view: false, create: false, edit: false, delete: false },
  analytics: { view: false },
  certificates: { view: false, generate: false, email: false },
  invoices: { view: false, generate: false, email: false },
  check_in: { perform: false },
  settings: { view: false, edit: false },
  team: { view: false, manage: false },
  payments: { view: false, refund: false },
  revenue: { view: false, export: false },
}

export const PROFILE_COLORS = [
  '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
  '#16A34A', '#059669', '#0D9488', '#0891B2', '#0284C7',
  '#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#C026D3',
  '#DB2777', '#E11D48', '#6B7280', '#475569', '#1E293B'
]

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

/* ── Get all profiles ─────────────────────────────────────────────────── */

export async function getProfiles(): Promise<{
  success: boolean
  error?: string
  profiles: AccessProfile[]
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: profiles, error } = await supabase
      .from("access_profiles")
      .select("*")
      .eq("is_active", true)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true })

    if (error) return { success: false, error: error.message, profiles: [] }

    // Get members per profile so super admins can see email/name
    const { data: members } = await supabase
      .from("team_members")
      .select("id, user_id, email, name, role, profile_id")

    const membersByProfile: Record<
      string,
      Array<{ id: string; user_id: string; email: string; name: string | null; role: string }>
    > = {}
    if (members) {
      for (const m of members) {
        if (m.profile_id) {
          if (!membersByProfile[m.profile_id]) membersByProfile[m.profile_id] = []
          membersByProfile[m.profile_id].push({
            id: m.id,
            user_id: m.user_id,
            email: m.email,
            name: m.name,
            role: m.role,
          })
        }
      }
    }

    const enriched = (profiles ?? []).map((p) => ({
      ...p,
      members: membersByProfile[p.id] ?? [],
      member_count: (membersByProfile[p.id] ?? []).length,
    }))

    return { success: true, profiles: enriched }
  } catch (err) {
    return { success: false, error: (err as Error).message, profiles: [] }
  }
}

/* ── Get single profile ──────────────────────────────────────────────── */

export async function getProfile(id: string): Promise<{
  success: boolean
  error?: string
  profile?: AccessProfile
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: profile, error } = await supabase
      .from("access_profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return { success: false, error: error.message }

    return { success: true, profile }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Get profile count ───────────────────────────────────────────────── */

export async function getProfileCount(): Promise<{
  success: boolean
  error?: string
  count: number
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { count, error } = await supabase
      .from("access_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    if (error) return { success: false, error: error.message, count: 0 }

    return { success: true, count: count ?? 0 }
  } catch (err) {
    return { success: false, error: (err as Error).message, count: 0 }
  }
}

/* ── Generate SQL for a profile ──────────────────────────────────────── */

export async function generateProfileSQL(profile: {
  name: string
  description: string | null
  color: string
  permissions: ProfilePermissions
}): Promise<string> {
  const escapedName = profile.name.replace(/'/g, "''")
  const escapedDesc = (profile.description ?? "").replace(/'/g, "''")
  const permissionsJson = JSON.stringify(profile.permissions, null, 2).replace(/'/g, "''")
  const now = new Date().toISOString()

  return `-- =============================================
-- Profile: ${profile.name}
-- Description: ${profile.description ?? "No description"}
-- Created: ${now}
-- =============================================
-- Run this SQL in your Supabase SQL Editor to
-- complete the profile creation.
-- =============================================

INSERT INTO access_profiles (name, description, color, permissions, is_system, is_active)
VALUES (
  '${escapedName}',
  '${escapedDesc}',
  '${profile.color}',
  '${permissionsJson}'::jsonb,
  false,
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- Verify the profile was created:
SELECT id, name, description, color, is_active
FROM access_profiles
WHERE name = '${escapedName}';`
}

/* ── Create profile ───────────────────────────────────────────────────── */

export async function createProfile(data: {
  name: string
  description: string
  color: string
  permissions: ProfilePermissions
  /** Optional: create a login user and link them to this profile in one step. */
  member?: {
    name: string
    email: string
    password: string
    /** Team role for the new member. Defaults to "admin". */
    role?: "super_admin" | "admin" | "member"
  }
}): Promise<{
  success: boolean
  error?: string
  profile?: AccessProfile
  sql?: string
  createdMember?: { user_id: string; email: string; name: string; role: string }
}> {
  try {
    const { supabase, user } = await requireSuperAdmin()

    // Check profile count
    const { count } = await supabase
      .from("access_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    if ((count ?? 0) >= 20) {
      return { success: false, error: "Maximum 20 profiles allowed." }
    }

    /* ── Validate member credentials up-front (before any writes) ─────── */
    if (data.member) {
      const { email, password, name } = data.member
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: "A valid email is required for the team member." }
      }
      if (!password || password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters." }
      }
      if (!name || !name.trim()) {
        return { success: false, error: "Member name is required." }
      }

      // Check for pre-existing team_members row with this email
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("email", email)
        .maybeSingle()
      if (existingMember) {
        return { success: false, error: `A team member with email ${email} already exists.` }
      }
    }

    /* ── 1. Insert access_profile ─────────────────────────────────────── */
    const { data: profile, error } = await supabase
      .from("access_profiles")
      .insert({
        name: data.name,
        description: data.description,
        color: data.color,
        permissions: data.permissions,
        is_system: false,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    /* ── 2. Optionally create auth user + team_members row ────────────── */
    let createdMember: { user_id: string; email: string; name: string; role: string } | undefined
    if (data.member) {
      const role = data.member.role ?? "admin"
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

      let userId: string | undefined

      if (hasServiceRole) {
        /* Path A — service role: fastest, auto-confirms email. Wrapped in a
         * 10s timeout so a misconfigured key or a network blip can't hang
         * the admin UI forever. */
        const admin = createAdminClient()
        const { data: created, error: authErr } = await withTimeout(
          admin.auth.admin.createUser({
            email: data.member.email,
            password: data.member.password,
            email_confirm: true,
            user_metadata: { name: data.member.name },
          }),
          10_000,
          "createUser",
        )

        userId = created?.user?.id
        if (authErr) {
          if (/already.*registered|already been registered|already exists/i.test(authErr.message)) {
            const { data: list } = await withTimeout(
              admin.auth.admin.listUsers(),
              10_000,
              "listUsers",
            )
            userId = list?.users?.find((u) => u.email === data.member!.email)?.id
          }
          if (!userId) {
            await supabase.from("access_profiles").delete().eq("id", profile.id)
            return { success: false, error: `Failed to create auth user: ${authErr.message}` }
          }
        }
      } else {
        /* No service role key = can't create a confirmed auth user without
         * triggering Supabase's email-confirmation SMTP flow (which stalls
         * the server action). Fail fast with a clear message so the admin
         * can add the key to the Vercel env and retry. */
        await supabase.from("access_profiles").delete().eq("id", profile.id)
        return {
          success: false,
          error:
            "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel → Settings → Environment Variables and redeploy, then retry.",
        }
      }

      if (!userId) {
        await supabase.from("access_profiles").delete().eq("id", profile.id)
        return { success: false, error: "Could not create auth user." }
      }

      // Insert team_members row linking user → profile. Uses the current
      // (super-admin) cookie-backed client so RLS sees a super_admin actor.
      const { error: insertErr } = await supabase.from("team_members").insert({
        user_id: userId,
        email: data.member.email,
        name: data.member.name,
        role,
        profile_id: profile.id,
      })
      if (insertErr) {
        await supabase.from("access_profiles").delete().eq("id", profile.id)
        return { success: false, error: `Failed to link team member: ${insertErr.message}` }
      }

      createdMember = { user_id: userId, email: data.member.email, name: data.member.name, role }
    }

    // Generate the SQL code for the user
    const sql = await generateProfileSQL({
      name: data.name,
      description: data.description,
      color: data.color,
      permissions: data.permissions,
    })

    revalidatePath("/admin/settings", "page")
    revalidatePath("/admin/team", "page")
    return { success: true, profile, sql, createdMember }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Update profile ───────────────────────────────────────────────────── */

export async function updateProfile(
  id: string,
  data: {
    name?: string
    description?: string
    color?: string
    permissions?: ProfilePermissions
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await requireSuperAdmin()

    // Check if system profile — cannot rename system profiles
    const { data: existing } = await supabase
      .from("access_profiles")
      .select("is_system, name")
      .eq("id", id)
      .single()

    if (existing?.is_system && data.name && data.name !== existing.name) {
      return { success: false, error: "Cannot rename system profiles." }
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.color !== undefined) updatePayload.color = data.color
    if (data.permissions !== undefined) updatePayload.permissions = data.permissions

    const { error } = await supabase
      .from("access_profiles")
      .update(updatePayload)
      .eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/settings", "page")
    revalidatePath("/admin/team", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Delete profile ──────────────────────────────────────────────────── */

export async function deleteProfile(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await requireSuperAdmin()

    // Prevent deleting system profiles
    const { data: profile } = await supabase
      .from("access_profiles")
      .select("is_system")
      .eq("id", id)
      .single()

    if (profile?.is_system) {
      return { success: false, error: "Cannot delete system profiles." }
    }

    // Check if any team members use this profile
    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", id)

    if ((count ?? 0) > 0) {
      return {
        success: false,
        error: "Cannot delete a profile that is assigned to team members. Reassign them first.",
      }
    }

    const { error } = await supabase
      .from("access_profiles")
      .delete()
      .eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/settings", "page")
    revalidatePath("/admin/team", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Assign profile to team member ───────────────────────────────────── */

export async function assignProfileToMember(
  memberId: string,
  profileId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await requireSuperAdmin()

    // If profileId is provided, verify it exists and is active
    if (profileId) {
      const { data: profile, error: profileError } = await supabase
        .from("access_profiles")
        .select("id, is_active")
        .eq("id", profileId)
        .single()

      if (profileError || !profile) {
        return { success: false, error: "Profile not found." }
      }

      if (!profile.is_active) {
        return { success: false, error: "Cannot assign an inactive profile." }
      }
    }

    const { error } = await supabase
      .from("team_members")
      .update({
        profile_id: profileId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/team", "page")
    revalidatePath("/admin/settings", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
