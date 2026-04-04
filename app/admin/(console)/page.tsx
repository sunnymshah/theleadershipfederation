/**
 * ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────
 *
 * Landing page after login. Shows KPI cards (placeholder values for now).
 * Phase 2 will wire these to real Supabase aggregate queries.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import {
  Calendar,
  Ticket,
  Users,
  IndianRupee,
} from "lucide-react"

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)

  // Fetch real counts
  const { count: eventCount }  = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })

  const { count: ticketCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })

  const stats = [
    {
      label: "Total Events",
      value: String(eventCount ?? 0),
      icon: Calendar,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Ticket Tiers",
      value: String(ticketCount ?? 0),
      icon: Ticket,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Attendees",
      value: "—",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Revenue",
      value: "—",
      icon: IndianRupee,
      color: "text-[#c9a84c]",
      bg: "bg-[#c9a84c]/10",
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
        <p className="text-sm text-white/40">
          Overview of your events and platform metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
                {label}
              </p>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder */}
      <div className="mt-10 p-10 rounded-xl border border-white/[0.06] bg-white/[0.015] text-center">
        <p className="text-white/35 text-sm mb-1">
          Event activity feed, analytics, and revenue charts coming in Phase 2
        </p>
        <p className="text-white/20 text-xs">
          Navigate to Events to start managing your lineup
        </p>
      </div>
    </div>
  )
}
