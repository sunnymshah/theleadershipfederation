"use client"

/**
 * Client tab shell for /admin/team. Two tabs:
 *   • Members     — TeamManager (invites, roles, remove)
 *   • Profiles    — AccessProfilesManager (JSONB permission editor)
 *
 * Tab state lives in the URL (?tab=members | profiles) so a deep-link
 * from elsewhere (sidebar, invite flow) lands on the right panel.
 */

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Users, Shield } from "lucide-react"
import { TeamManager } from "./TeamManager"
import { AccessProfilesManager } from "./AccessProfilesManager"

type TabKey = "members" | "profiles"

export function TeamAccessTabs({ initialTab }: { initialTab: TabKey }) {
  const router = useRouter()
  const pathname = usePathname()
  const [tab, setTab] = useState<TabKey>(initialTab)

  function select(next: TabKey) {
    setTab(next)
    // Reflect in the URL without a full nav — so back-button works and a
    // paste-able link lands on the same tab.
    const url = next === "members" ? pathname : `${pathname}?tab=${next}`
    router.replace(url, { scroll: false })
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-2">
          Team & Access
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a2e] tracking-tight">
          Who&rsquo;s on the team, and what they can do
        </h1>
        <p className="mt-1 text-sm text-gray-500 max-w-2xl">
          Invite members, assign access profiles, and fine-tune per-module
          permissions without leaving the page.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#e5e7eb]">
        <TabButton
          active={tab === "members"}
          onClick={() => select("members")}
          icon={<Users size={14} />}
          label="Members"
        />
        <TabButton
          active={tab === "profiles"}
          onClick={() => select("profiles")}
          icon={<Shield size={14} />}
          label="Access profiles"
        />
      </div>

      {/* Panel */}
      {tab === "members" ? <TeamManager /> : <AccessProfilesManager />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors
        ${active
          ? "text-[#1a1a2e]"
          : "text-[#888] hover:text-[#1a1a2e]"
        }
      `}
    >
      {icon}
      {label}
      {active && (
        <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#c9a84c] rounded-full" />
      )}
    </button>
  )
}
