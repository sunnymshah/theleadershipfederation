"use client"

/**
 * ─── WORKSPACE PICKER ────────────────────────────────────────────────
 *
 * The post-login landing. Netflix-style "which workspace are you
 * opening today" — big accent-coloured cards for the 4 workspaces the
 * user has access to, a compact row of locked ones below.
 *
 * Data comes from AdminPermissionsProvider so super admins see all
 * four and everyone else sees only what their profile grants.
 */

import Link from "next/link"
import { useState } from "react"
import { useAdminPermissions } from "./AdminPermissionsContext"
import {
  ADMIN_WORKSPACES,
  canAccessWorkspace,
  type AdminWorkspace,
  type IconName,
} from "@/lib/admin-domains"
import { Lock, ArrowRight } from "lucide-react"

export function AdminHomeTiles({ userName }: { userName?: string | null }) {
  const { role, permissions } = useAdminPermissions()
  const [denied, setDenied] = useState<AdminWorkspace | null>(null)

  const unlocked = ADMIN_WORKSPACES.filter((w) => canAccessWorkspace(w, role, permissions))
  const locked   = ADMIN_WORKSPACES.filter((w) => !canAccessWorkspace(w, role, permissions))

  const firstName = userName?.split(" ")[0] ?? null

  return (
    <section>
      {/* Greeting */}
      <div className="mb-8 md:mb-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-2">
          Workspaces
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-[#1a1a2e] tracking-tight">
          {firstName ? `Hey ${firstName}, where are we working today?` : "Where are we working today?"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {unlocked.length > 0
            ? "Pick a workspace. You can switch anytime from the sidebar."
            : "You don\u2019t have access to any workspaces yet. Ask a super admin."}
        </p>
      </div>

      {/* Unlocked workspaces — large tiles */}
      {unlocked.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {unlocked.map((w) => (
            <WorkspaceTile key={w.slug} w={w} />
          ))}
        </div>
      )}

      {/* Locked workspaces — compact padlock pills */}
      {locked.length > 0 && (
        <div className="mt-10">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-3">
            Not available to you
          </div>
          <div className="flex flex-wrap gap-2">
            {locked.map((w) => (
              <button
                key={w.slug}
                type="button"
                onClick={() => setDenied(w)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 text-xs hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                <Lock size={12} />
                {w.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Access-denied modal */}
      {denied && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          onClick={() => setDenied(null)}
        >
          <div
            className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${denied.accent}22`, color: denied.accent }}
              >
                <Lock size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400">Access denied</div>
                <div className="text-base font-semibold text-[#1a1a2e]">{denied.name}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your profile doesn&rsquo;t include{" "}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {denied.gate.module}.{denied.gate.action}
              </code>{" "}
              permission. Ask a super admin to update your access profile.
            </p>
            <button
              type="button"
              onClick={() => setDenied(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#1a1a2e] text-white text-sm font-medium hover:bg-black transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function WorkspaceTile({ w }: { w: AdminWorkspace }) {
  // Collect every section label across all groups so we can show what's
  // inside the workspace at a glance.
  const sectionLabels = w.groups.flatMap((g) => g.items.map((i) => i.label))

  return (
    <Link
      href={w.href}
      className="group relative rounded-3xl overflow-hidden border border-gray-200 bg-white hover:border-transparent hover:shadow-[0_24px_60px_rgba(26,26,46,0.10)] transition-all"
    >
      {/* Big accent block on the left */}
      <div className="flex min-h-[180px]">
        <div
          className="w-[120px] md:w-[140px] shrink-0 flex items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${w.accent} 0%, ${w.accent}cc 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white_0%,transparent_60%)]" />
          <div className="relative text-white">
            <WorkspaceIcon name={w.icon} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 md:p-6 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400">
                Workspace
              </div>
              <div className="mt-1 text-xl md:text-2xl font-semibold text-[#1a1a2e] group-hover:text-[#c9a84c] transition-colors">
                {w.name}
              </div>
              <div className="mt-0.5 text-xs md:text-sm text-gray-500">{w.tagline}</div>
            </div>
            <ArrowRight
              size={18}
              className="shrink-0 text-gray-300 group-hover:text-[#c9a84c] group-hover:translate-x-1 transition-all"
            />
          </div>

          <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-2">
            {w.description}
          </p>

          <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
            {sectionLabels.slice(0, 4).map((label) => (
              <span
                key={label}
                className="inline-block px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] text-gray-500"
              >
                {label}
              </span>
            ))}
            {sectionLabels.length > 4 && (
              <span className="inline-block px-2 py-0.5 text-[10px] text-gray-400">
                +{sectionLabels.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* Inline SVG icons — one per workspace. No extra dep, renders on first paint. */
function WorkspaceIcon({ name }: { name: IconName }) {
  const common = {
    width: 44,
    height: 44,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  switch (name) {
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case "users":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case "megaphone":
      return (
        <svg {...common}>
          <path d="M3 11l18-8v18L3 13z" />
          <path d="M11 11v7a2 2 0 0 0 2 2h1" />
        </svg>
      )
    case "wallet":
      return (
        <svg {...common}>
          <path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
        </svg>
      )
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case "chart":
      return (
        <svg {...common}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
  }
}
