"use client"

/**
 * Zoho-style primary rail for the page builder.
 *
 * w-14 white sidebar with icon-only nav items, tooltip on hover, active
 * state shown by the .z-rail-item.is-active CSS class (red bar on left
 * edge + light red bg + red icon).
 *
 * Lives next to (not inside) Puck's frame so the rail is always visible
 * regardless of what Puck is doing internally.
 */

import { type ReactNode } from "react"
import {
  Layout, FileText, Palette, Mic2, Clock, Ticket, Building2, Settings,
  FolderTree, Globe, Puzzle, MessageSquare,
} from "lucide-react"

export type RailKey =
  | "sections"
  | "pages"
  | "stdpages"
  | "theme"
  | "languages"
  | "integrations"
  | "comments"
  | "speakers"
  | "sessions"
  | "tickets"
  | "sponsors"
  | "settings"

// Zoho-parity rail: exactly 5 primary items + Settings bottom-anchored.
// The legacy items (Sections / Sub-pages / Speakers / Sessions / Tickets /
// Sponsors) are still wired in ActiveRailPanel so deep-linking + existing
// flows continue to work, but they're no longer surfaced in the rail.
// Section-add is reachable via a "+ Add section" button that opens the
// Sections palette; speaker/session/ticket/sponsor managers live in the
// event admin pages (kebab menu in the top bar links there).
const PRIMARY_ITEMS: Array<{ key: RailKey; label: string; Icon: typeof Layout }> = [
  { key: "theme",        label: "Themes",       Icon: Palette },
  { key: "stdpages",     label: "Pages",        Icon: FolderTree },
  { key: "languages",    label: "Languages",    Icon: Globe },
  { key: "integrations", label: "Integrations", Icon: Puzzle },
  { key: "comments",     label: "Comments",     Icon: MessageSquare },
]

export function PrimaryRail({
  active,
  onChange,
  topSlot,
  bottomSlot,
}: {
  active: RailKey
  onChange: (key: RailKey) => void
  topSlot?: ReactNode
  bottomSlot?: ReactNode
}) {
  return (
    <nav
      aria-label="Builder navigation"
      className="w-14 shrink-0 h-full bg-[var(--z-bg-rail,#fff)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col items-center py-2 gap-0.5 relative"
    >
      {topSlot}
      {PRIMARY_ITEMS.map((item) => (
        <RailButton
          key={item.key}
          label={item.label}
          isActive={active === item.key}
          onClick={() => onChange(item.key)}
          Icon={item.Icon}
        />
      ))}
      {/* Bottom-anchored — Settings */}
      <div className="mt-auto w-full flex flex-col items-center gap-0.5 pt-2 border-t border-[var(--z-border,#e5e7eb)]">
        <RailButton
          label="Settings"
          isActive={active === "settings"}
          onClick={() => onChange("settings")}
          Icon={Settings}
        />
        {bottomSlot}
      </div>
    </nav>
  )
}

function RailButton({
  label, isActive, onClick, Icon,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  Icon: typeof Layout
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-current={isActive ? "page" : undefined}
      className={`z-rail-item ${isActive ? "is-active" : ""}`}
    >
      <Icon size={18} strokeWidth={1.5} />
    </button>
  )
}
