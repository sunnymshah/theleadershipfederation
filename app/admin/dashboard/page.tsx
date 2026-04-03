import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { LogoutButton } from "./logout-button"

export const metadata = {
  title: "Admin Dashboard",
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // ── Auth gate ────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/admin/login")
  }

  // ── Fetch events ─────────────────────────────────────────────────────
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false })

  // ── Status badge color map ───────────────────────────────────────────
  const statusStyle: Record<string, string> = {
    published: "bg-emerald-500/10 text-emerald-400",
    draft:     "bg-yellow-500/10 text-yellow-400",
    completed: "bg-blue-500/10 text-blue-400",
    cancelled: "bg-red-500/10 text-red-400",
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white/90">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-white/30 mt-0.5">{user.email}</p>
        </div>
        <LogoutButton />
      </header>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-medium text-white/75">Events</h2>
          <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#d4b85c] transition-colors">
            + Create New Event
          </button>
        </div>

        {eventsError && (
          <p className="text-sm text-red-400/80 bg-red-400/5 border border-red-400/10 rounded-lg px-4 py-3 mb-4">
            Error loading events: {eventsError.message}
          </p>
        )}

        {events && events.length > 0 ? (
          <div className="border border-white/[0.06] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 tracking-wide">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 tracking-wide">
                    Venue
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-white/85">
                      {event.title}
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-white/50">{event.venue}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${
                          statusStyle[event.status] ?? "bg-white/5 text-white/40"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-white/[0.06] rounded-lg py-16 text-center">
            <p className="text-white/30 text-sm">
              No events yet. Create your first event to get started.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
