"use client"

/**
 * ─── ADMIN CONSOLE SHELL — LIQUID GLASS ──────────────────────────────
 *
 * One floating liquid-glass sidebar + content, on a white background.
 *
 *   ┌────────────┬─────────────────────────────────────────────┐
 *   │  GLASS     │  TOP BAR  (breadcrumbs + account)           │
 *   │  SIDEBAR   ├─────────────────────────────────────────────┤
 *   │  (floating │  CONTENT  (the route's children)            │
 *   │   panel)   │                                             │
 *   └────────────┴─────────────────────────────────────────────┘
 *
 * The sidebar lists EVERY function the user can reach, organised:
 *   - Command center link → /admin (the glass launcher home)
 *   - one collapsible group per workspace (Backstage / CRM / Studio /
 *     Finance), each holding its sections grouped by sub-title
 *   - a Foundation group (Analytics / Team / Settings / …)
 *   - account block at the very bottom
 *
 * The workspace you're currently inside auto-expands; others collapse
 * so the sidebar stays scannable. Permissions, route gating and the
 * mobile drawer are all preserved.
 */

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home, Menu, X, ChevronRight, ChevronDown, Settings,
  Users as UsersIcon, Calendar, Megaphone, Wallet, Shield,
} from "lucide-react"
import {
  ADMIN_WORKSPACES, FOUNDATION_ITEMS,
  accessibleFoundation, canAccessSection, canAccessWorkspace,
  workspaceForPath,
  type AdminWorkspace, type WorkspaceSection, type IconName,
} from "@/lib/admin-domains"
import { AdminPermissionsProvider } from "./AdminPermissionsContext"
import { AdminLogoutButton } from "./AdminLogoutButton"
import type { ProfilePermissions } from "@/app/actions/profileActions"
import "./zoho-theme.css"

const WORKSPACE_ICON: Record<IconName, typeof Calendar> = {
  calendar:  Calendar,
  users:     UsersIcon,
  megaphone: Megaphone,
  wallet:    Wallet,
  shield:    Shield,
  chart:     UsersIcon,
}

export function AdminConsoleShell({
  userEmail,
  userRole,
  profilePermissions,
  children,
}: {
  userEmail: string
  userRole: string
  profilePermissions?: ProfilePermissions | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const activeWorkspace = workspaceForPath(pathname)
  const foundation = accessibleFoundation(userRole, profilePermissions)

  const [drawerOpen, setDrawerOpen] = useState(false)
  // Close the mobile drawer whenever the route changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  const [accountOpen, setAccountOpen] = useState(false)
  useEffect(() => {
    if (!accountOpen) return
    const close = () => setAccountOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [accountOpen])

  return (
    <AdminPermissionsProvider role={userRole} permissions={profilePermissions}>
      <div className="lf-admin-shell flex min-h-screen bg-white relative">
        {/* Ambient tonal wash — gives the glass sidebar colour to refract. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-0"
          style={{
            background:
              "radial-gradient(40% 36% at 6% 8%, rgba(0,113,227,0.07) 0%, transparent 64%), " +
              "radial-gradient(38% 38% at 96% 94%, rgba(0,113,227,0.05) 0%, transparent 66%)",
          }}
        />

        {/* ── Desktop sidebar ──────────────────────────────────────── */}
        <GlassSidebar
          activeWorkspace={activeWorkspace}
          foundation={foundation}
          pathname={pathname}
          userRole={userRole}
          userEmail={userEmail}
          profilePermissions={profilePermissions}
          className="hidden lg:flex"
        />

        {/* ── Right pane: top bar + content ────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 relative z-[1]">
          <header className="h-14 shrink-0 flex items-center justify-between px-3 sm:px-5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden z-btn z-btn-icon"
                onClick={() => setDrawerOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <Menu size={17} strokeWidth={1.6} />
              </button>
              <Breadcrumbs activeWorkspace={activeWorkspace} pathname={pathname} />
            </div>
            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#0071e3] text-white text-[13px] font-bold"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                {(userEmail?.[0] ?? "A").toUpperCase()}
              </button>
              {accountOpen && (
                <div className="lf-glass-strong absolute right-0 top-full mt-2 w-60 rounded-xl py-1.5 z-50 text-[13px]">
                  <div className="px-3.5 py-2.5 border-b border-black/[0.06]">
                    <p className="text-[11px] text-[#9ca3af]">Signed in as</p>
                    <p className="font-semibold text-[#1d1d1f] truncate">{userEmail}</p>
                    <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider mt-0.5">{userRole}</p>
                  </div>
                  <Link href="/admin/team" className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/[0.04]">
                    <UsersIcon size={14} strokeWidth={1.6} /> Team
                  </Link>
                  <Link href="/admin/settings" className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/[0.04]">
                    <Settings size={14} strokeWidth={1.6} /> Settings
                  </Link>
                  <div className="h-px bg-black/[0.06] my-1" />
                  <div className="px-1.5 pb-0.5">
                    <AdminLogoutButton />
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-3 sm:px-5 pb-6">
            {children}
          </main>
        </div>

        {/* ── Mobile drawer ────────────────────────────────────────── */}
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <GlassSidebar
              activeWorkspace={activeWorkspace}
              foundation={foundation}
              pathname={pathname}
              userRole={userRole}
              userEmail={userEmail}
              profilePermissions={profilePermissions}
              className="relative flex"
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        )}
      </div>
    </AdminPermissionsProvider>
  )
}

/* ── Floating glass sidebar ──────────────────────────────────────────── */

function GlassSidebar({
  activeWorkspace, foundation, pathname, userRole, userEmail, profilePermissions,
  className = "", onClose,
}: {
  activeWorkspace: AdminWorkspace | null
  foundation: typeof FOUNDATION_ITEMS
  pathname: string
  userRole: string
  userEmail: string
  profilePermissions?: ProfilePermissions | null
  className?: string
  onClose?: () => void
}) {
  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const onLauncher = pathname === "/admin"

  // Every workspace the user can open, with its permission-visible sections.
  const workspaces = ADMIN_WORKSPACES
    .filter((w) => canAccessWorkspace(w, userRole, profilePermissions))
    .map((w) => ({
      workspace: w,
      groups: w.groups
        .map((g) => ({
          title: g.title,
          items: g.items.filter((it) => canAccessSection(it, w, userRole, profilePermissions)),
        }))
        .filter((g) => g.items.length > 0),
    }))
    .filter((x) => x.groups.length > 0)

  return (
    <aside
      className={`lf-glass w-64 shrink-0 m-3 rounded-2xl flex-col overflow-hidden ${className}`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-black/[0.06]">
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="Admin home">
          <Image src="/logo-tlf.png" alt="TLF" width={26} height={26} className="rounded" />
          <span className="text-[14px] font-semibold text-[#1d1d1f]">Console</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="z-btn z-btn-icon lg:hidden" aria-label="Close menu">
            <X size={16} strokeWidth={1.6} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {/* Command center */}
        <Link
          href="/admin"
          className={`flex items-center gap-2.5 px-3 h-10 rounded-xl text-[13px] font-semibold transition-colors ${
            onLauncher
              ? "bg-[#0071e3]/[0.10] text-[#0071e3]"
              : "text-[#1d1d1f] hover:bg-black/[0.04]"
          }`}
        >
          <Home size={16} strokeWidth={1.7} />
          Command center
        </Link>

        {/* Every workspace — collapsible. Current one starts open. */}
        <div className="mt-3 space-y-0.5">
          {workspaces.map(({ workspace, groups }) => (
            <WorkspaceSection
              key={workspace.slug}
              workspace={workspace}
              groups={groups}
              defaultOpen={activeWorkspace?.slug === workspace.slug}
              isActive={isActive}
            />
          ))}
        </div>

        {/* Foundation */}
        {foundation.length > 0 && (
          <div className="mt-4 pt-3 border-t border-black/[0.06]">
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#9ca3af]">
              Foundation
            </p>
            {foundation.map((f) => (
              <SidebarLink key={f.href} href={f.href} label={f.label} active={isActive(f.href)} />
            ))}
          </div>
        )}
      </nav>

      {/* Account */}
      <div className="shrink-0 border-t border-black/[0.06] p-2.5">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="w-8 h-8 shrink-0 rounded-full bg-[#0071e3] text-white text-[12px] font-bold flex items-center justify-center">
            {(userEmail?.[0] ?? "A").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[#1d1d1f] truncate">{userEmail}</p>
            <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">{userRole}</p>
          </div>
        </div>
        <div className="mt-1">
          <AdminLogoutButton />
        </div>
      </div>
    </aside>
  )
}

/* ── One collapsible workspace section ──────────────────────────────── */

function WorkspaceSection({
  workspace, groups, defaultOpen, isActive,
}: {
  workspace: AdminWorkspace
  groups: { title: string; items: WorkspaceSection[] }[]
  defaultOpen: boolean
  isActive: (href: string) => boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = WORKSPACE_ICON[workspace.icon] ?? Calendar

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl text-[13px] font-semibold text-[#1d1d1f] hover:bg-black/[0.04] transition-colors"
      >
        <span
          className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${workspace.accent}1f`, color: workspace.accent }}
        >
          <Icon size={13} strokeWidth={1.9} />
        </span>
        <span className="flex-1 text-left">{workspace.name}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.9}
          className={`text-[#9ca3af] transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="mt-0.5 mb-1.5 pl-2.5">
          {groups.map((g) => (
            <div key={g.title} className="mb-1">
              <p className="px-3 pt-1.5 pb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#c4c4cc]">
                {g.title}
              </p>
              {g.items.map((s) => (
                <SidebarLink key={s.href} href={s.href} label={s.label} active={isActive(s.href)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 h-9 rounded-lg text-[13px] transition-colors ${
        active
          ? "bg-[#0071e3]/[0.10] text-[#0071e3] font-semibold"
          : "text-[#6b7280] hover:bg-black/[0.04] hover:text-[#1d1d1f]"
      }`}
    >
      <ChevronRight
        size={13}
        strokeWidth={1.8}
        className={active ? "text-[#0071e3]" : "text-[#c4c4cc]"}
      />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  )
}

/* ── Breadcrumbs ────────────────────────────────────────────────────── */

function Breadcrumbs({ activeWorkspace, pathname }: { activeWorkspace: AdminWorkspace | null; pathname: string }) {
  const parts = pathname.split("/").filter(Boolean)
  if (parts.length === 0) return null

  const items: Array<{ label: string; href: string | null }> = [
    { label: "Command center", href: "/admin" },
  ]
  if (activeWorkspace) {
    items.push({ label: activeWorkspace.name, href: activeWorkspace.href })
  }
  const last = parts[parts.length - 1]
  if (last && last !== "admin" && last !== activeWorkspace?.slug) {
    items.push({ label: pretty(last), href: null })
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] min-w-0">
      {items.map((it, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {it.href && !isLast ? (
              <Link href={it.href} className="text-[#9ca3af] hover:text-[#1d1d1f] truncate">
                {it.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-[#1d1d1f] truncate" : "text-[#9ca3af] truncate"}>
                {it.label}
              </span>
            )}
            {!isLast && <span className="text-[#d1d1d6]">/</span>}
          </span>
        )
      })}
    </nav>
  )
}

function pretty(seg: string): string {
  return seg
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
