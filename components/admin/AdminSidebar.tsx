"use client"

/* ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN SIDEBAR — Workspace-aware navigation
 *
 *  The sidebar is driven entirely by the active workspace (Backstage / CRM /
 *  Studio / Finance), resolved from the current pathname. When no workspace
 *  is active (/admin home or /admin/denied) we show a minimal rail — just
 *  the Foundation items and a "Pick a workspace" hint.
 *
 *  Foundation items (Analytics, Team, Settings, Integrations, Audit log)
 *  are always pinned to the bottom for anyone who has access to them.
 *
 *  Source of truth: lib/admin-domains.ts (ADMIN_WORKSPACES, FOUNDATION_ITEMS).
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { ProfilePermissions } from "@/app/actions/profileActions"
import {
  ADMIN_WORKSPACES,
  FOUNDATION_ITEMS,
  accessibleFoundation,
  canAccessSection,
  canAccessWorkspace,
  workspaceForPath,
  type AdminWorkspace,
  type WorkspaceSection,
} from "@/lib/admin-domains"
import { AdminLogoutButton } from "./AdminLogoutButton"
import { ArrowLeft, Grid3x3, ChevronRight } from "lucide-react"

export function AdminSidebar({
  userEmail,
  userRole = "super_admin",
  profilePermissions,
}: {
  userEmail: string
  userRole?: string
  profilePermissions?: ProfilePermissions | null
}) {
  const pathname = usePathname()
  const activeWorkspace = workspaceForPath(pathname)
  const foundation = accessibleFoundation(userRole, profilePermissions)

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="w-[260px] shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col h-screen sticky top-0">
      {/* ── Top: workspace header or home brand ──────────────────────── */}
      {activeWorkspace ? (
        <WorkspaceHeader w={activeWorkspace} />
      ) : (
        <HomeHeader />
      )}

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {activeWorkspace ? (
          <WorkspaceNav
            w={activeWorkspace}
            role={userRole}
            perms={profilePermissions}
            isActive={isActive}
          />
        ) : (
          <HomeNav role={userRole} perms={profilePermissions} />
        )}

        {/* Foundation — always visible to anyone who has it */}
        {foundation.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#f0f0f0]">
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Foundation
            </div>
            <div className="space-y-0.5 px-1">
              {foundation.map((f) => {
                const active = isActive(f.href)
                return (
                  <Link
                    key={f.href}
                    href={f.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all",
                      active
                        ? "bg-[#1a1a2e] text-white font-semibold"
                        : "text-[#5f6368] hover:bg-[#f6f7f9] hover:text-[#1a1a2e] font-medium"
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                    {f.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── Footer: signed-in + logout ──────────────────────────────── */}
      <div className="px-4 py-3 border-t border-[#e5e7eb]">
        <div className="px-1 mb-2.5">
          <p className="text-[10px] text-[#9aa0a6] uppercase tracking-wider mb-0.5">
            Signed in as
          </p>
          <p className="text-[12px] text-[#1a1a2e] truncate font-medium">{userEmail}</p>
        </div>
        <AdminLogoutButton />
      </div>
    </aside>
  )
}

/* ── Sub-views ──────────────────────────────────────────────────────── */

function HomeHeader() {
  return (
    <div className="px-5 py-4 border-b border-[#e5e7eb]">
      <Link href="/admin" className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#e7ab1c] flex items-center justify-center shrink-0">
          <span className="text-white text-[11px] font-extrabold tracking-widest">
            TLF
          </span>
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-[14px] font-semibold text-[#1a1a2e] truncate">
            The Leadership Federation
          </div>
          <div className="text-[10px] text-[#9aa0a6] tracking-[0.06em]">Admin</div>
        </div>
      </Link>
    </div>
  )
}

function WorkspaceHeader({ w }: { w: AdminWorkspace }) {
  return (
    <div className="border-b border-[#e5e7eb]">
      <Link
        href="/admin"
        className="flex items-center gap-2 px-5 pt-3 pb-1.5 text-[11px] text-gray-400 hover:text-[#1a1a2e] transition-colors"
      >
        <ArrowLeft size={12} />
        All workspaces
      </Link>
      <div className="px-5 pt-1 pb-4 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${w.accent} 0%, ${w.accent}cc 100%)`,
          }}
        >
          <span className="text-white text-[10px] font-extrabold tracking-widest">
            {w.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400">
            Workspace
          </div>
          <div className="text-[14px] font-semibold text-[#1a1a2e] truncate">
            {w.name}
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeNav({
  role,
  perms,
}: {
  role: string
  perms: ProfilePermissions | null | undefined
}) {
  const workspaces = ADMIN_WORKSPACES.filter((w) => canAccessWorkspace(w, role, perms))
  return (
    <div>
      <div className="px-3 mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        <Grid3x3 size={11} />
        Your workspaces
      </div>
      <div className="space-y-0.5 px-1">
        {workspaces.map((w) => (
          <Link
            key={w.slug}
            href={w.href}
            className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] text-[#5f6368] hover:bg-[#f6f7f9] hover:text-[#1a1a2e] font-medium transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: w.accent }}
              />
              <span className="truncate">{w.name}</span>
            </div>
            <ChevronRight
              size={13}
              className="text-gray-300 group-hover:text-[#1a1a2e] transition-colors shrink-0"
            />
          </Link>
        ))}
        {workspaces.length === 0 && (
          <div className="px-3 py-2 text-[12px] text-gray-400">
            No workspaces available.
          </div>
        )}
      </div>
    </div>
  )
}

function WorkspaceNav({
  w,
  role,
  perms,
  isActive,
}: {
  w: AdminWorkspace
  role: string
  perms: ProfilePermissions | null | undefined
  isActive: (href: string) => boolean
}) {
  // Flatten every group's items into one list and filter by profile perms.
  // The groups in admin-domains.ts are preserved for the home tiles and
  // semantic ordering, but the sidebar renders them as a single flat list
  // so users don't have to navigate multiple nested sections.
  const items: WorkspaceSection[] = w.groups
    .flatMap((g) => g.items)
    .filter((s) => canAccessSection(s, w, role, perms))

  if (items.length === 0) {
    return (
      <div className="px-3 py-2 text-[12px] text-gray-400">
        This workspace has no sections available to your profile.
      </div>
    )
  }

  return (
    <div className="space-y-0.5 px-1">
      {items.map((s) => {
        const active = isActive(s.href)
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all",
              active
                ? "font-semibold text-[#1a1a2e]"
                : "text-[#5f6368] hover:bg-[#f6f7f9] hover:text-[#1a1a2e] font-medium"
            )}
            style={active ? { backgroundColor: `${w.accent}14` } : undefined}
          >
            <span
              className={cn(
                "w-1 h-1 rounded-full shrink-0 transition-all",
                active ? "w-1.5 h-1.5" : "opacity-40"
              )}
              style={{ backgroundColor: active ? w.accent : "currentColor" }}
            />
            <span className="truncate">{s.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
