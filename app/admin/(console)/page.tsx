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
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/events",
    },
    {
      label: "Ticket Tiers",
      value: String(ticketRes.count ?? 0),
      icon: Ticket,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/tickets",
    },
    {
      label: "Speakers",
      value: String(speakerRes.count ?? 0),
      icon: Radio,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/speakers",
    },
    {
      label: "Attendees",
      value: String(attendeeRes.count ?? 0),
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/admin/attendees",
    },
    {
      label: "Sponsors",
      value: String(sponsorRes.count ?? 0),
      icon: Building2,
      color: "text-[#b8941a]",
      bg: "bg-[#e7ab1c]/10",
      href: "/admin/sponsors",
    },
  ]

  const recentEvents = recentEventsRes.data ?? []

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const statusColors: Record<string, string> = {
    draft: "text-yellow-700 bg-yellow-50",
    published: "text-emerald-700 bg-emerald-50",
    completed: "text-blue-700 bg-blue-50",
    cancelled: "text-red-700 bg-red-50",
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#333] mb-1">Dashboard</h2>
        <p className="text-sm text-[#888]">
          Overview of your events and platform metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="p-5 rounded-xl border border-[#e0e0e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#888] font-medium uppercase tracking-wider">
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
        <h3 className="text-lg font-semibold text-[#333] mb-4">Recent Events</h3>
        <div className="rounded-xl border border-[#e0e0e0] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {recentEvents.length === 0 ? (
            <div className="py-12 text-center text-[#999] text-sm">No events yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#eee] bg-[#fafafa]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Venue</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event: { id: string; title: string; slug: string; start_date: string; venue: string; status: string }) => (
                  <tr key={event.id} className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#333]">{event.title}</div>
                      <div className="text-[11px] text-[#bbb]">/{event.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-[#666] text-xs">{fmtDate(event.start_date)}</td>
                    <td className="px-5 py-4 text-[#666] text-xs">{event.venue}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${statusColors[event.status] ?? "text-[#888] bg-[#f5f5f5]"}`}>
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
