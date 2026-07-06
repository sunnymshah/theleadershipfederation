/**
 * ─── SERVER-SIDE PERMISSION ENFORCEMENT ────────────────────────────────
 *
 * Use these helpers in Server Actions and Server Components to enforce
 * access control based on the logged-in user's role + assigned profile.
 *
 * Key design points:
 *  - Reads the session via the cookie-backed SSR client so we never trust
 *    data coming from the client.
 *  - Loads team_members / access_profiles via the service-role admin client
 *    so RLS (especially the recursive team_members policies) can't trip us.
 *  - super_admin ALWAYS passes — no profile can reduce a super admin's
 *    power by accident.
 *  - Users with no team_members row are treated as bootstrap super_admin,
 *    consistent with (console)/layout.tsx.
 *
 *  Guard your server actions like:
 *    export async function createEvent(data) {
 *      await requirePermission("events", "create")
 *      ... mutation ...
 *    }
 * ───────────────────────────────────────────────────────────────────── */

"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import {
  canAccessWithProfile,
  type TeamRole,
} from "@/lib/permissions"
import type { ProfilePermissions } from "@/app/actions/profileActions"

export type UserContext = {
  userId: string
  email: string
  role: TeamRole
  /** null when the user is a bootstrap super_admin or otherwise has no
   *  profile assigned — their role alone governs access. */
  permissions: ProfilePermissions | null
}

/**
 * Get the current authenticated user + their role + profile permissions.
 * Throws "Unauthorized" if no session.
 */
export async function getCurrentUserContext(): Promise<UserContext> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const admin = createAdminClient()
  const { data: member } = await admin
    .from("team_members")
    .select("role, profile_id")
    .eq("user_id", user.id)
    .maybeSingle()

  // No team_members row → NOT a team member. The ONLY exception is the
  // one-time first-setup bootstrap, mirroring (console)/layout.tsx:
  // the table must be COMPLETELY EMPTY and the user's email must be in
  // ADMIN_BOOTSTRAP_EMAIL. The previous behaviour (any signed-in user
  // without a row = super_admin) let anyone who self-registered a
  // Supabase account pass every requirePermission() check.
  if (!member) {
    const bootstrapAllowlist = (process.env.ADMIN_BOOTSTRAP_EMAIL ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const userEmail = (user.email ?? "").toLowerCase()
    const { count: totalMembers } = await admin
      .from("team_members")
      .select("*", { count: "exact", head: true })
    const isBootstrap =
      (totalMembers ?? 0) === 0 &&
      userEmail.length > 0 &&
      bootstrapAllowlist.includes(userEmail)
    if (!isBootstrap) {
      throw new Error("Unauthorized: not a team member")
    }
    return {
      userId: user.id,
      email: user.email ?? "",
      role: "super_admin",
      permissions: null,
    }
  }

  const role: TeamRole = member.role as TeamRole

  let permissions: ProfilePermissions | null = null
  if (role !== "super_admin" && member?.profile_id) {
    const { data: profile } = await admin
      .from("access_profiles")
      .select("permissions")
      .eq("id", member.profile_id)
      .eq("is_active", true)
      .maybeSingle()
    permissions = (profile?.permissions as ProfilePermissions) ?? null
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    role,
    permissions,
  }
}

/**
 * Throw if the current user cannot perform `action` on `module`.
 *
 * STRICT MODEL:
 *  - super_admin role: unconditional full access (never blocked)
 *  - Everyone else: MUST have an assigned profile that explicitly grants
 *    this module+action. No profile → denied.
 *
 * There is intentionally NO "admin without profile = full access"
 * fallback — that was a security bug. If you want someone to have
 * broad access, either make them super_admin or assign them a profile
 * with the permissions you want.
 */
export async function requirePermission(
  module: keyof ProfilePermissions,
  action: string,
): Promise<UserContext> {
  const ctx = await getCurrentUserContext()

  // Super admin — never blocked.
  if (ctx.role === "super_admin") return ctx

  // Everyone else must have a profile that grants this action.
  if (ctx.permissions && canAccessWithProfile(ctx.permissions, module, action)) {
    return ctx
  }

  throw new Error(
    `Access denied: your profile does not grant "${action}" on ${String(module)}.`,
  )
}

/**
 * Non-throwing variant — returns a boolean. Useful for conditionally
 * rendering UI in Server Components without a try/catch. Uses the
 * same STRICT MODEL as requirePermission above.
 */
export async function canCurrentUser(
  module: keyof ProfilePermissions,
  action: string,
): Promise<boolean> {
  try {
    const ctx = await getCurrentUserContext()
    if (ctx.role === "super_admin") return true
    if (ctx.permissions && canAccessWithProfile(ctx.permissions, module, action)) {
      return true
    }
    return false
  } catch {
    return false
  }
}
