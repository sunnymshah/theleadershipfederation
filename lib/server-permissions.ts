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

  // Bootstrap rule: no row → treat as super_admin (matches layout)
  const role: TeamRole = (member?.role as TeamRole) ?? "super_admin"

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
 * super_admin always passes. Users without a profile but with a
 * permissive role (admin/manager/etc) fall back to the role table in
 * lib/permissions.ts — for mutations we're strict: if they don't have
 * a profile granting the action explicitly, only super_admin/admin
 * pass. This is deliberately conservative for mutations.
 */
export async function requirePermission(
  module: keyof ProfilePermissions,
  action: string,
): Promise<UserContext> {
  const ctx = await getCurrentUserContext()

  // Super admin — never blocked.
  if (ctx.role === "super_admin") return ctx

  // Admin without an explicit profile → full mutation access (matches
  // legacy behaviour before profiles existed).
  if (ctx.role === "admin" && !ctx.permissions) return ctx

  // Profile present → check it.
  if (ctx.permissions && canAccessWithProfile(ctx.permissions, module, action)) {
    return ctx
  }

  throw new Error(
    `Access denied: your profile does not grant "${action}" on ${String(module)}.`,
  )
}

/**
 * Non-throwing variant — returns a boolean. Useful for conditionally
 * rendering UI in Server Components without a try/catch.
 */
export async function canCurrentUser(
  module: keyof ProfilePermissions,
  action: string,
): Promise<boolean> {
  try {
    const ctx = await getCurrentUserContext()
    if (ctx.role === "super_admin") return true
    if (ctx.role === "admin" && !ctx.permissions) return true
    if (ctx.permissions && canAccessWithProfile(ctx.permissions, module, action)) {
      return true
    }
    return false
  } catch {
    return false
  }
}
