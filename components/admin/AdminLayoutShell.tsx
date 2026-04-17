"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "./AdminSidebar"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProfilePermissions } from "@/app/actions/profileActions"

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
    <div className="flex min-h-screen admin-scrollbar relative">
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
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar drawer */}
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
            <span className="text-[13px] sm:text-[14px] font-semibold text-[#333] truncate">
              The Leadership Federation
            </span>
            <span className="hidden sm:inline text-[11px] text-[#888] px-2 py-0.5 bg-[#f0f0f0] rounded font-medium whitespace-nowrap">
              Admin Console
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

        {/* Scrollable workspace — responsive padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
