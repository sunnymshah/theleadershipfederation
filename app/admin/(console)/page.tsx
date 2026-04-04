/**
 * ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────
 *
 * Landing page after login. Shows KPI cards with real Supabase counts
 * and a quick overview of recent events.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import {
  Calendar,
  Ticket,
  Users,
  IndianRupee,
  Radio,
  Building2,
} from "lucide-react"

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)

  // Fetch real counts in parallel
  const [eventRes, ticketRes, speakerRes, attendeeRes, sponsorRes, recentEventsRes] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("tickets").select("*", { count: "exact", head: true }),
    supabase.from("speakers").select("*", { count: "exact", head: true }),
    supabase.from("attendees").select("*", { count: "exact", head: true }),
    supabase.from("sponsors").select("*", { count: "exact", head: true }),
    supabase.from("events").select("id, title, slug, start_date, venue, status").order("start_date", { ascending: false }).limit(5),
  ])

  const stats = [
    {
      label: "Events",
      value: String(eventRes.count ?? 0),
      icon: Calendar,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/admin/events",
    },
    {
      label: "Ticket Tiers",
      value: String(ticketRes.count ?? 0),
      icon: Ticket,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/tickets",
    },
    {
      label: "Speakers",
      value: String(speakerRes.count ?? 0),
      icon: Radio,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      href: "/admin/speakers",
    },
    {
      label: "Attendees",
      value: String(attendeeRes.count ?? 0),
      icon: Users,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      href: "/admin/attendees",
    },
    {
      label: "Sponsors",
      value: String(sponsorRes.count ?? 0),
      icon: Building2,
      color: "text-[#c9a84c]",
      bg: "bg-[#c9a84c]/10",
      href: "/admin/sponsors",
    },
  ]

  const recentEvents = recentEventsRes.data ?? []

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const statusColors: Record<string, string> = {
    draft: "text-yellow-400 bg-yellow-500/10",
    published: "text-emerald-400 bg-emerald-500/10",
    completed: "text-blue-400 bg-blue-500/10",
    cancelled: "text-red-400 bg-red-500/10",
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
        <p className="text-sm text-white/40">
          Overview of your events and platform metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Recent Events */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Events</h3>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {recentEvents.length === 0 ? (
            <div className="py-12 text-center text-white/35 text-sm">No events yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Venue</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event: { id: string; title: string; slug: string; start_date: string; venue: string; status: string }) => (
                  <tr key={event.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white/90">{event.title}</div>
                      <div className="text-[11px] text-white/30">/{event.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-white/50 text-xs">{fmtDate(event.start_date)}</td>
                    <td className="px-5 py-4 text-white/50 text-xs">{event.venue}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${statusColors[event.status] ?? "text-white/40 bg-white/5"}`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
