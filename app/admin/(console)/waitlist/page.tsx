/**
 * ─── WAITLIST PAGE — All Waitlisted Attendees ─────────────────────────
 *
 * Server component that fetches all waitlisted attendees across events
 * and displays them in a table with promote/remove actions via a
 * client-side action panel.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { WaitlistTable } from "@/components/admin/WaitlistTable"

export default async function WaitlistPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all waitlisted attendees across all events
  const { data: waitlisted, error } = await supabase
    .from("attendees")
    .select("id, name, email, phone, status, waitlist_position, registration_date, event_id, ticket_id, events(title), tickets(name)")
    .eq("status", "waitlisted")
    .order("waitlist_position", { ascending: true })

  const rows = (waitlisted ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    phone: r.phone as string | null,
    status: r.status as string,
    waitlist_position: r.waitlist_position as number | null,
    registration_date: r.registration_date as string,
    event_id: r.event_id as string,
    ticket_id: r.ticket_id as string | null,
    events: Array.isArray(r.events) ? (r.events[0] ?? null) : r.events as { title: string } | null,
    tickets: Array.isArray(r.tickets) ? (r.tickets[0] ?? null) : r.tickets as { name: string } | null,
  }))

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Waitlist</h2>
        <p className="text-sm text-gray-500">
          All waitlisted attendees across events, ordered by position
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Total Waitlisted</p>
          <p className="text-2xl font-bold text-orange-600">{rows.length}</p>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center text-red-600 text-sm">
          Error loading waitlist: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">No waitlisted attendees</p>
          <p className="text-gray-400 text-xs mt-1">When attendees join a waitlist, they will appear here</p>
        </div>
      ) : (
        <WaitlistTable rows={rows} />
      )}
    </div>
  )
}
