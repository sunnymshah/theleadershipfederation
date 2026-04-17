"use client"

/**
 * ─── ADMIN PERMISSIONS CONTEXT ───────────────────────────────────────
 *
 * Exposes the current user's role + profile permissions to every client
 * component inside the admin console, so buttons/tabs/forms can gate
 * themselves without prop-drilling through N layers.
 *
 * The layout tree mounts the provider once with the same data that
 * already gates the sidebar, so any client component can do:
 *
 *   const { can } = useAdminPermissions()
 *   if (can("events", "create")) { ... }
 *
 * Or use the <PermissionGate module="events" action="create"> wrapper.
 *
 * SECURITY NOTE: this is a UX layer only — any mutation the user is
 * not allowed to perform must ALSO be blocked server-side via
 * requirePermission() in the relevant server action. Client-side gates
 * prevent accidental UI misleads but can never enforce security on
 * their own.
 * ─────────────────────────────────────────────────────────────────── */

import { createContext, useContext, useMemo, type ReactNode } from "react"
import {
  canAccessWithProfile,
} from "@/lib/permissions"
import type { ProfilePermissions } from "@/app/actions/profileActions"

type AdminPermissionsValue = {
  role: string
  permissions: ProfilePermissions | null
  /** Non-throwing permission check for UI gating. */
  can: (module: keyof ProfilePermissions, action: string) => boolean
}

const AdminPermissionsContext = createContext<AdminPermissionsValue | null>(null)

export function AdminPermissionsProvider({
  role,
  permissions,
  children,
}: {
  role: string
  permissions: ProfilePermissions | null | undefined
  children: ReactNode
}) {
  const value = useMemo<AdminPermissionsValue>(() => {
    const perms = permissions ?? null
    return {
      role,
      permissions: perms,
      can(module, action) {
        // Mirrors lib/server-permissions.ts STRICT model.
        // Super admin: unconditional full access. Everyone else MUST have
        // a profile that explicitly grants the action. No profile → deny.
        if (role === "super_admin") return true
        if (perms && canAccessWithProfile(perms, module, action)) return true
        return false
      },
    }
  }, [role, permissions])

  return (
    <AdminPermissionsContext.Provider value={value}>
      {children}
    </AdminPermissionsContext.Provider>
  )
}

export function useAdminPermissions(): AdminPermissionsValue {
  const ctx = useContext(AdminPermissionsContext)
  if (!ctx) {
    // Sensible default if someone renders a gated component outside the
    // provider (e.g. in Storybook/tests) — deny all.
    return {
      role: "viewer",
      permissions: null,
      can: () => false,
    }
  }
  return ctx
}

/**
 * Render `children` only when the current user can perform the given
 * action on the given module. Optionally render a fallback (e.g. a
 * disabled button).
 */
export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
}: {
  module: keyof ProfilePermissions
  action: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { can } = useAdminPermissions()
  return <>{can(module, action) ? children : fallback}</>
}
