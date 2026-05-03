"use client"

/**
 * DataPanel — single SecondaryPanel container with 6 horizontal sub-
 * tabs (Speakers / Sessions / Tickets / Sponsors / Exhibitors /
 * Hotels). Picking a tab swaps in the corresponding manager.
 *
 * Reached from the Primary Rail via the new "DATA" item (ITEM 5.1).
 * This is a thin wrapper — each manager already owns its own
 * ManagerTable + ProfilePanel; the panel just gives them a single
 * entry point.
 */

import { useState } from "react"
import { Users, Calendar, Ticket, Building2, Briefcase, BedDouble } from "lucide-react"
import { SpeakersManager } from "./SpeakersManager"
import { SessionsManager } from "./SessionsManager"
import { TicketsManager } from "./TicketsManager"
import { SponsorsManager } from "./SponsorsManager"
import { ExhibitorsManager } from "./ExhibitorsManager"
import { HotelsManager } from "./HotelsManager"

type Tab = "speakers" | "sessions" | "tickets" | "sponsors" | "exhibitors" | "hotels"

const TABS: Array<{ key: Tab; label: string; Icon: typeof Users }> = [
  { key: "speakers",   label: "Speakers",   Icon: Users },
  { key: "sessions",   label: "Sessions",   Icon: Calendar },
  { key: "tickets",    label: "Tickets",    Icon: Ticket },
  { key: "sponsors",   label: "Sponsors",   Icon: Building2 },
  { key: "exhibitors", label: "Exhibitors", Icon: Briefcase },
  { key: "hotels",     label: "Hotels",     Icon: BedDouble },
]

export function DataPanel({
  eventId,
  initialTab,
  onClose,
}: {
  eventId: string
  initialTab?: Tab
  onClose?: () => void
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "speakers")

  return (
    <div className="flex h-full">
      {/* Tab strip — 56px wide column with stacked icon+label tabs. */}
      <nav
        aria-label="Event data tabs"
        className="shrink-0 w-14 h-full bg-[var(--z-bg,#fff)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col items-center py-1.5 gap-0.5"
      >
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={active ? "page" : undefined}
              title={label}
              aria-label={label}
              className={`z-rail-item z-rail-item--stacked ${active ? "is-active" : ""}`}
            >
              <Icon size={16} strokeWidth={1.5} />
              <span className="z-rail-item__label">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Manager surface — the picked tab mounts its own SecondaryPanel
          internally, so it provides its own header / search / table
          / profile slide-in. */}
      <div className="flex-1 min-w-0 h-full">
        {tab === "speakers"   && <SpeakersManager   eventId={eventId} onClose={onClose} />}
        {tab === "sessions"   && <SessionsManager   eventId={eventId} onClose={onClose} />}
        {tab === "tickets"    && <TicketsManager    eventId={eventId} onClose={onClose} />}
        {tab === "sponsors"   && <SponsorsManager   eventId={eventId} onClose={onClose} />}
        {tab === "exhibitors" && <ExhibitorsManager eventId={eventId} onClose={onClose} />}
        {tab === "hotels"     && <HotelsManager     eventId={eventId} onClose={onClose} />}
      </div>
    </div>
  )
}
