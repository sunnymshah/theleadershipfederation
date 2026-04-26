"use client"

/**
 * Zoho-style admin console shell.
 *
 * Replaces the legacy AdminLayoutShell with a three-column chrome:
 *
 *   ┌─────┬───────────┬──────────────────────────────────────────────┐
 *   │RAIL │ SECONDARY │  TOP BAR  (h-12, breadcrumbs + user avatar)  │
 *   │w-14 │  w-56     ├──────────────────────────────────────────────┤
 *   │     │           │  CONTENT  (the existing route's children)    │
 *   │icons│ section   │                                              │
 *   │only │ list      │                                              │
 *   │     │           │                                              │
 *   └─────┴───────────┴──────────────────────────────────────────────┘
 *
 * The rail shows:
 *   - one icon per workspace (Backstage / CRM / Studio / Finance)
 *   - foundation icons (Analytics / Team / Integrations / Audit log /
 *     Settings) bottom-anchored, separated by a divider
 *
 * The secondary panel is the active workspace's groups + items, plus a
 * sticky panel header. When a foundation rail item is active the panel
 * is the foundation list.
 *
 * Permissions, route gating, and mobile drawer behaviour are preserved
 * from AdminLayoutShell — we just rearrange the chrome.
 */

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar, Users as UsersIcon, Megaphone, Wallet, Shield, BarChart3,
  Home, Menu, HelpCircle, Bell, ChevronRight, ChevronDown, LogOut,
  Settings, Plug, ScrollText, Sparkles, Boxes,
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
  chart:     BarChart3,
}

const FOUNDATION_ICON: Record<string, typeof Calendar> = {
  Analytics:    BarChart3,
  Team:         UsersIcon,
  Integrations: Plug,
  "Audit log":  ScrollText,
  Settings:     Settings,
  Approvals:    Sparkles,
  Automations:  Boxes,
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
  const accessibleWorkspaces = ADMIN_WORKSPACES.filter((w) =>
    canAccessWorkspace(w, userRole, profilePermissions),
  )
  const foundation = accessibleFoundation(userRole, profilePermissions)

  // Mobile drawer.
  const [drawerOpen, setDrawerOpen] = useState(false)
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Foundation panel toggle — when a foundation route is active OR the user
  // explicitly clicks a foundation icon, show foundation in the secondary panel.
  const isFoundationPath = foundation.some((f) => pathname === f.href || pathname.startsWith(f.href + "/"))
  const [foundationOpen, setFoundationOpen] = useState(isFoundationPath)
  useEffect(() => { setFoundationOpen(isFoundationPath) }, [isFoundationPath])

  // Account menu.
  const [accountOpen, setAccountOpen] = useState(false)
  useEffect(() => {
    if (!accountOpen) return
    const close = () => setAccountOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [accountOpen])

  return (
    <AdminPermissionsProvider role={userRole} permissions={profilePermissions}>
      <div className="lf-admin-shell flex min-h-screen relative">
        {/* ── Primary rail (desktop) ───────────────────────────────── */}
        <RailColumn
          accessibleWorkspaces={accessibleWorkspaces}
          activeWorkspace={activeWorkspace}
          foundation={foundation}
          foundationOpen={foundationOpen}
          onToggleFoundation={() => setFoundationOpen((v) => !v)}
        />

        {/* ── Secondary panel ──────────────────────────────────────── */}
        <SecondaryColumn
          activeWorkspace={activeWorkspace}
          foundation={foundation}
          foundationOpen={foundationOpen}
          pathname={pathname}
          userRole={userRole}
          profilePermissions={profilePermissions}
        />

        {/* ── Right pane: top bar + content ────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 shrink-0 flex items-center justify-between px-3 sm:px-4 bg-[var(--z-bg,#fff)] border-b border-[var(--z-border,#e5e7eb)]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden z-btn z-btn-icon"
                onClick={() => setDrawerOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <Menu size={16} strokeWidth={1.5} />
              </button>
              <Breadcrumbs activeWorkspace={activeWorkspace} pathname={pathname} />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button className="z-btn z-btn-icon" aria-label="Help">
                <HelpCircle size={16} strokeWidth={1.5} />
              </button>
              <button className="z-btn z-btn-icon" aria-label="Notifications">
                <Bell size={16} strokeWidth={1.5} />
              </button>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--z-accent,#f0483e)] text-white text-[12px] font-bold"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                >
                  {(userEmail?.[0] ?? "A").toUpperCase()}
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-md bg-white border border-[var(--z-border,#e5e7eb)] shadow-[var(--z-shadow-lg)] py-1 z-50 text-[12px]">
                    <div className="px-3 py-2 border-b border-[var(--z-border,#e5e7eb)]">
                      <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">Signed in as</p>
                      <p className="font-medium text-[var(--z-text,#1f2937)] truncate">{userEmail}</p>
                      <p className="text-[10px] text-[var(--z-text-muted,#6b7280)] uppercase tracking-wider mt-0.5">{userRole}</p>
                    </div>
                    <Link href="/admin/team" className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--z-bg-alt,#f7f8fa)]">
                      <UsersIcon size={13} strokeWidth={1.5} /> Team
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--z-bg-alt,#f7f8fa)]">
                      <Settings size={13} strokeWidth={1.5} /> Settings
                    </Link>
                    <div className="h-px bg-[var(--z-border,#e5e7eb)] my-1" />
                    <div className="px-1 pb-1">
                      <AdminLogoutButton />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>

        {/* ── Mobile drawer (rail + secondary panel stacked) ──────── */}
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="relative bg-white w-[280px] max-w-[85vw] shadow-2xl flex">
              <div className="w-14 shrink-0">
                <RailColumn
                  accessibleWorkspaces={accessibleWorkspaces}
                  activeWorkspace={activeWorkspace}
                  foundation={foundation}
                  foundationOpen={foundationOpen}
                  onToggleFoundation={() => setFoundationOpen((v) => !v)}
                  embedded
                />
              </div>
              <div className="flex-1">
                <SecondaryColumn
                  activeWorkspace={activeWorkspace}
                  foundation={foundation}
                  foundationOpen={foundationOpen}
                  pathname={pathname}
                  userRole={userRole}
                  profilePermissions={profilePermissions}
                  embedded
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionsProvider>
  )
}

/* ── Rail column ─────────────────────────────────────────────────── */

function RailColumn({
  accessibleWorkspaces, activeWorkspace, foundation, foundationOpen, onToggleFoundation, embedded,
}: {
  accessibleWorkspaces: AdminWorkspace[]
  activeWorkspace: AdminWorkspace | null
  foundation: typeof FOUNDATION_ITEMS
  foundationOpen: boolean
  onToggleFoundation: () => void
  embedded?: boolean
}) {
  return (
    <nav
      aria-label="Admin navigation"
      className={`w-14 shrink-0 ${embedded ? "" : "hidden lg:flex"} flex-col items-center bg-[var(--z-bg-rail,#fff)] border-r border-[var(--z-border,#e5e7eb)] py-2 gap-0.5 ${embedded ? "h-screen overflow-y-auto" : ""}`}
    >
      {/* Brand */}
      <Link
        href="/admin"
        aria-label="Admin home"
        title="Admin home"
        className="flex items-center justify-center w-10 h-10 mb-2"
      >
        <Image src="/logo-tlf.png" alt="Leadership Federation" width={24} height={24} className="rounded" />
      </Link>
      <Link
        href="/admin"
        aria-label="Dashboard"
        title="Dashboard"
        className="z-rail-item"
      >
        <Home size={18} strokeWidth={1.5} />
      </Link>
      <span className="w-8 h-px bg-[var(--z-border,#e5e7eb)] my-1" />
      {/* Workspace icons */}
      {accessibleWorkspaces.map((w) => {
        const Icon = WORKSPACE_ICON[w.icon] ?? Calendar
        const isActive = activeWorkspace?.slug === w.slug && !foundationOpen
        return (
          <Link
            key={w.slug}
            href={w.href}
            aria-label={w.name}
            title={`${w.name} — ${w.tagline}`}
            className={`z-rail-item ${isActive ? "is-active" : ""}`}
          >
            <Icon size={18} strokeWidth={1.5} />
          </Link>
        )
      })}
      {/* Foundation toggle (icon set) */}
      <div className="mt-auto w-full flex flex-col items-center gap-0.5 pt-2 border-t border-[var(--z-border,#e5e7eb)]">
        {foundation.map((f) => {
          const Icon = FOUNDATION_ICON[f.label] ?? Settings
          const isActive = foundationOpen
          return (
            <Link
              key={f.href}
              href={f.href}
              aria-label={f.label}
              title={f.label}
              className={`z-rail-item ${isActive ? "is-active" : ""}`}
              onClick={onToggleFoundation}
            >
              <Icon size={18} strokeWidth={1.5} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/* ── Secondary panel ────────────────────────────────────────────── */

function SecondaryColumn({
  activeWorkspace, foundation, foundationOpen, pathname, userRole, profilePermissions, embedded,
}: {
  activeWorkspace: AdminWorkspace | null
  foundation: typeof FOUNDATION_ITEMS
  foundationOpen: boolean
  pathname: string
  userRole: string
  profilePermissions?: ProfilePermissions | null
  embedded?: boolean
}) {
  const showFoundation = foundationOpen
  const showWorkspace  = !showFoundation && activeWorkspace

  function isActiveRoute(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      className={`w-56 shrink-0 ${embedded ? "h-screen" : "hidden lg:flex"} flex-col bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)]`}
    >
      <header className="shrink-0 h-12 px-4 flex items-center bg-[var(--z-bg,#fff)] border-b border-[var(--z-border,#e5e7eb)]">
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)] truncate">
          {showFoundation ? "Foundation" : showWorkspace ? activeWorkspace.name : "Choose a workspace"}
        </h2>
      </header>
      <div className="flex-1 overflow-y-auto py-2">
        {showFoundation ? (
          <ul className="px-2 space-y-1">
            {foundation.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className={`z-panel-item w-full ${isActiveRoute(f.href) ? "is-active" : ""}`}
                >
                  <ChevronRight size={12} strokeWidth={1.5} className="text-[var(--z-text-subtle,#9ca3af)]" />
                  <span className="flex-1 text-left">{f.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : showWorkspace ? (
          <div>
            <p className="px-4 pt-1 pb-2 text-[11px] text-[var(--z-text-muted,#6b7280)]">
              {activeWorkspace.tagline}
            </p>
            {activeWorkspace.groups.map((group) => {
              const items = group.items.filter((it) => canAccessSection(it, activeWorkspace, userRole, profilePermissions))
              if (items.length === 0) return null
              return (
                <CollapsibleGroup key={group.title} title={group.title}>
                  <ul className="space-y-1">
                    {items.map((s: WorkspaceSection) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className={`z-panel-item w-full ${isActiveRoute(s.href) ? "is-active" : ""}`}
                        >
                          <span className="flex-1 text-left">{s.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CollapsibleGroup>
              )
            })}
          </div>
        ) : (
          <div className="z-empty mt-12">
            <Sparkles size={24} strokeWidth={1.5} className="z-empty-icon" />
            <p className="z-empty-title">Pick a workspace</p>
            <p className="z-empty-desc">Use the rail on the left to enter Backstage, CRM, Studio, or Finance.</p>
          </div>
        )}
      </div>
    </aside>
  )
}

function CollapsibleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="px-2 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)]"
      >
        <span>{title}</span>
        <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}

/* ── Breadcrumbs ────────────────────────────────────────────────── */

function Breadcrumbs({ activeWorkspace, pathname }: { activeWorkspace: AdminWorkspace | null; pathname: string }) {
  // Walk path segments, stripping group markers.
  const parts = pathname.split("/").filter(Boolean) // ["admin", "events", ...]
  if (parts.length === 0) return null

  const items: Array<{ label: string; href: string | null }> = [
    { label: "Admin", href: "/admin" },
  ]
  if (activeWorkspace) {
    items.push({ label: activeWorkspace.name, href: activeWorkspace.href })
  }
  // The remaining segment (if any) is the section name.
  const last = parts[parts.length - 1]
  if (last && last !== "admin" && last !== activeWorkspace?.slug) {
    items.push({ label: pretty(last), href: null })
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] min-w-0">
      {items.map((it, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {it.href && !isLast ? (
              <Link href={it.href} className="text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)] truncate">
                {it.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-[var(--z-text,#1f2937)] truncate" : "text-[var(--z-text-muted,#6b7280)] truncate"}>
                {it.label}
              </span>
            )}
            {!isLast && <span className="text-[var(--z-text-subtle,#9ca3af)]">/</span>}
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
