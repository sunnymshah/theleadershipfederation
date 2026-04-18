"use client"

/**
 * ─── ADMIN HOME TILES ────────────────────────────────────────────────
 *
 * Post-login landing surface. Renders the 9 domain tiles from
 * `ADMIN_DOMAINS`, splitting them into two rails:
 *
 *   Workspaces  — tiles the signed-in user can enter (full colour, clickable)
 *   Locked      — tiles they can't (dimmed + padlock; clicking shows a
 *                 "request access" dialog instead of silently bouncing).
 *
 * Data comes from `AdminPermissionsProvider`, which the console layout
 * populates from the user's team_members row + access_profiles JSON.
 * Super admins always see every tile as unlocked.
 */

import Link from "next/link"
import { useState } from "react"
import { useAdminPermissions } from "./AdminPermissionsContext"
import { ADMIN_DOMAINS, canAccessDomain, type AdminDomain, type IconName } from "@/lib/admin-domains"
import { Lock } from "lucide-react"

export function AdminHomeTiles({ userName }: { userName?: string | null }) {
  const { role, permissions } = useAdminPermissions()

  const [deniedDomain, setDeniedDomain] = useState<AdminDomain | null>(null)

  const unlocked = ADMIN_DOMAINS.filter((d) => canAccessDomain(d, role, permissions))
  const locked   = ADMIN_DOMAINS.filter((d) => !canAccessDomain(d, role, permissions))

  return (
    <section className="mb-10">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a2e] tracking-tight">
          {userName ? `Welcome, ${userName.split(" ")[0]}.` : "Welcome."}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {unlocked.length > 0
            ? `You have access to ${unlocked.length} ${unlocked.length === 1 ? "workspace" : "workspaces"}. Pick where to begin.`
            : "You don't have access to any workspaces yet. Contact your super admin."}
        </p>
      </div>

      {/* Unlocked tiles */}
      {unlocked.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unlocked.map((d) => (
            <DomainTile key={d.slug} domain={d} />
          ))}
        </div>
      )}

      {/* Locked tiles, compact row */}
      {locked.length > 0 && (
        <div className="mt-8">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">
            Not available to your role
          </div>
          <div className="flex flex-wrap gap-2">
            {locked.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => setDeniedDomain(d)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 text-xs hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                <Lock size={12} />
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Access-denied modal — the "if access not there then access denied"
          UX the user asked for. Shown on click for locked tiles; keeps the
          user on the landing instead of silently redirecting. */}
      {deniedDomain && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          onClick={() => setDeniedDomain(null)}
        >
          <div
            className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${deniedDomain.accent}22`, color: deniedDomain.accent }}
              >
                <Lock size={18} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-gray-400">Access denied</div>
                <div className="text-base font-semibold text-[#1a1a2e]">{deniedDomain.name}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your profile doesn&rsquo;t include <strong>{deniedDomain.gate.module}.{deniedDomain.gate.action}</strong> permission.
              Ask a super admin to update your access profile.
            </p>
            <button
              type="button"
              onClick={() => setDeniedDomain(null)}
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

function DomainTile({ domain }: { domain: AdminDomain }) {
  return (
    <Link
      href={domain.href}
      className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white hover:border-transparent hover:shadow-[0_16px_40px_rgba(26,26,46,0.08)] transition-all"
    >
      {/* Accent stripe */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${domain.accent}, ${domain.accent}77)` }}
      />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${domain.accent}18`,
              color: domain.accent,
            }}
          >
            <DomainIcon name={domain.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-[#1a1a2e] group-hover:text-[#c9a84c] transition-colors">
              {domain.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{domain.tagline}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-2">
          {domain.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {domain.sections.slice(0, 3).map((s) => (
              <span
                key={s.href}
                className="inline-block px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] text-gray-500"
              >
                {s.label}
              </span>
            ))}
            {domain.sections.length > 3 && (
              <span className="inline-block px-2 py-0.5 text-[10px] text-gray-400">
                +{domain.sections.length - 3}
              </span>
            )}
          </div>
          <span
            className="text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
            style={{ color: domain.accent }}
          >
            Open →
          </span>
        </div>
      </div>
    </Link>
  )
}

/* Inline SVGs to avoid a new icon dependency and keep the tile grid
   rendering on the first paint without a JS-dependent icon font. */
function DomainIcon({ name }: { name: IconName }) {
  const common = {
    width: 22, height: 22, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor",
    strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  }
  switch (name) {
    case "crm":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M20 8v6M23 11h-6" />
        </svg>
      )
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
    case "pages":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="13" y2="17" />
        </svg>
      )
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case "plug":
      return (
        <svg {...common}>
          <path d="M9 2v6M15 2v6" />
          <path d="M7 8h10v4a5 5 0 0 1-10 0z" />
          <path d="M12 17v5" />
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
