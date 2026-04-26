"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AdminSidebar } from "./AdminSidebar"
import { AdminPermissionsProvider } from "./AdminPermissionsContext"
import { Menu, Grid3x3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { workspaceForPath } from "@/lib/admin-domains"
import type { ProfilePermissions } from "@/app/actions/profileActions"
import "./zoho-theme.css"

export function AdminLayoutShell({
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const activeWorkspace = workspaceForPath(pathname)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [sidebarOpen])

  return (
    <AdminPermissionsProvider role={userRole} permissions={profilePermissions}>
    <div className="lf-admin-shell flex min-h-screen admin-scrollbar relative">
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:block shrink-0">
        <AdminSidebar
          userEmail={userEmail}
          userRole={userRole}
          profilePermissions={profilePermissions}
        />
      </div>

      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-200",
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] max-w-[85vw] transition-transform duration-200 shadow-2xl [&>aside]:w-full",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <AdminSidebar
          userEmail={userEmail}
          userRole={userRole}
          profilePermissions={profilePermissions}
        />
        </div>
      </div>

      {/* Right side: top bar + workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top context bar */}
        <header className="h-[52px] shrink-0 bg-white border-b border-[#e0e0e0] flex items-center justify-between px-3 sm:px-6 shadow-[0_1px_3px_rgba(26,26,46,0.04)]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-[#f0f0f0] text-[#555] transition-colors shrink-0"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <Link
              href="/admin"
              className="text-[13px] sm:text-[14px] font-semibold text-[#333] truncate hover:text-[#c9a84c] transition-colors"
            >
              The Leadership Federation
            </Link>
            {activeWorkspace ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-gray-300 text-sm">/</span>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: `${activeWorkspace.accent}18`,
                    color: activeWorkspace.accent,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: activeWorkspace.accent }}
                  />
                  {activeWorkspace.name}
                </span>
              </div>
            ) : (
              <span className="hidden sm:inline text-[11px] text-[#888] px-2 py-0.5 bg-[#f0f0f0] rounded font-medium whitespace-nowrap">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {activeWorkspace && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-[#1a1a2e] px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
                title="Switch workspace"
              >
                <Grid3x3 size={12} />
                Switch
              </Link>
            )}
            <span className="text-[12px] text-[#666] hidden md:block truncate max-w-[200px]">
              {userEmail}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#e7ab1c] flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">
                {(userEmail?.[0] ?? "A").toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
    </AdminPermissionsProvider>
  )
}
