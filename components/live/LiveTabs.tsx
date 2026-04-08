"use client"

import { useState } from "react"
import { BarChart3, MessageCircleQuestion, CalendarClock } from "lucide-react"
import { LivePolls } from "@/components/live/LivePolls"
import { LiveQA } from "@/components/live/LiveQA"
import { LiveSchedule } from "@/components/live/LiveSchedule"

interface Session {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  speaker_name: string | null
  location: string | null
  session_type: string | null
}

const tabs = [
  { key: "polls", label: "Polls", icon: BarChart3 },
  { key: "qa", label: "Q&A", icon: MessageCircleQuestion },
  { key: "schedule", label: "Schedule", icon: CalendarClock },
] as const

type TabKey = (typeof tabs)[number]["key"]

export function LiveTabs({
  eventId,
  sessions,
}: {
  eventId: string
  sessions: Session[]
}) {
  const [active, setActive] = useState<TabKey>("polls")

  return (
    <>
      {/* Tab bar */}
      <nav className="sticky top-[57px] z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = active === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors relative ${
                  isActive
                    ? "text-[#e7ab1c]"
                    : "text-white/50 active:text-white/70"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-4 h-0.5 rounded-full bg-[#e7ab1c]" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Tab panels */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {active === "polls" && <LivePolls eventId={eventId} />}
        {active === "qa" && <LiveQA eventId={eventId} />}
        {active === "schedule" && <LiveSchedule sessions={sessions} />}
      </main>
    </>
  )
}
