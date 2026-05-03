"use client"

/**
 * Zoho-style primary rail for the page builder.
 *
 * 64px (w-16) white sidebar with icon + label nav items. The label is
 * always visible directly under the icon (Zoho's pattern). Active
 * state: red 3px left-edge bar + light red bg + red icon + red label.
 *
 * Lives next to (not inside) Puck's frame so the rail is always visible
 * regardless of what Puck is doing internally.
 */

import { type ReactNode } from "react"
import {
  Layout, FileText, Palette, Mic2, Clock, Ticket, Building2, Settings,
  FolderTree, Globe, Puzzle, Plus, Database,
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
  | "exhibitors"
  | "hotels"
  | "data"
  | "settings"

// Zoho-parity rail: ITEM 4.2 prepends a permanent "ADD" item + ITEM
// 5.1 inserts a "DATA" item before Languages. Comments stays in the
// top bar (next to History). Legacy keys (speakers / sessions /
// tickets / sponsors / exhibitors / hotels) stay in the RailKey union
// for the routing switch in ActiveRailPanel but are now reached via
// the DATA panel's sub-tabs.
const PRIMARY_ITEMS: Array<{ key: RailKey; label: string; Icon: typeof Layout; emphasised?: boolean }> = [
  { key: "sections",     label: "Add",          Icon: Plus,       emphasised: true },
  { key: "theme",        label: "Themes",       Icon: Palette },
  { key: "stdpages",     label: "Pages",        Icon: FolderTree },
  { key: "data",         label: "Data",         Icon: Database },
  { key: "languages",    label: "Languages",    Icon: Globe },
  { key: "integrations", label: "Integrations", Icon: Puzzle },
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
      style={{ width: "var(--lf-rail-width, 72px)" }}
      className="shrink-0 h-full bg-[var(--z-bg-rail,#fff)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col items-center py-1.5 gap-0.5 relative"
    >
      {topSlot}
      {PRIMARY_ITEMS.map((item) => (
        <RailButton
          key={item.key}
          label={item.label}
          isActive={active === item.key}
          onClick={() => onChange(item.key)}
          Icon={item.Icon}
          emphasised={item.emphasised}
        />
      ))}
      {/* Bottom-anchored — Settings */}
      <div className="mt-auto w-full flex flex-col items-center gap-0.5 pt-1.5 border-t border-[var(--z-border,#e5e7eb)]">
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
  label, isActive, onClick, Icon, emphasised,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  Icon: typeof Layout
  /** ITEM 4.2 — emphasised buttons (the ADD item) get a primary-tinted
   *  fill so the user can never miss the entry point to insert
   *  sections. Hover scales subtly. */
  emphasised?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-current={isActive ? "page" : undefined}
      className={`z-rail-item z-rail-item--stacked ${isActive ? "is-active" : ""} ${emphasised ? "z-rail-item--emphasised" : ""}`}
    >
      <Icon size={emphasised ? 20 : 18} strokeWidth={emphasised ? 2 : 1.5} />
      <span className="z-rail-item__label">{label}</span>
    </button>
  )
}
