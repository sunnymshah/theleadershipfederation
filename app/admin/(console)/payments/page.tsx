/**
 * ─── PAYMENTS PAGE — Payment Overview ─────────────────────────────────
 *
 * Redirects to the attendees page filtered by payment status.
 * For now, displays a summary of payment statuses and links through
 * to the attendees view.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function PaymentsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch payment summary
  const { data: allAttendees } = await supabase
    .from("attendees")
    .select("id, name, email, payment_status, payment_amount, status, events(title), tickets(name)")
    .neq("status", "cancelled")
    .order("registration_date", { ascending: false })

  const attendees = (allAttendees ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    payment_status: r.payment_status as string | null,
    payment_amount: r.payment_amount as number | null,
    status: r.status as string,
    events: Array.isArray(r.events) ? (r.events[0] ?? null) : r.events as { title: string } | null,
    tickets: Array.isArray(r.tickets) ? (r.tickets[0] ?? null) : r.tickets as { name: string } | null,
  }))

  const paidCount = attendees.filter((a) => a.payment_status === "paid").length
  const pendingCount = attendees.filter((a) => a.payment_status === "pending").length
  const freeCount = attendees.filter((a) => a.payment_status === "free" || a.payment_status === null).length
  const totalCollected = attendees
    .filter((a) => a.payment_status === "paid")
    .reduce((sum, a) => sum + (a.payment_amount ?? 0), 0)

  const pendingAttendees = attendees.filter((a) => a.payment_status === "pending")

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Payments</h2>
        <p className="text-sm text-gray-500">Payment overview across all events</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-gray-900">{fmtCurrency(totalCollected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Free / Comp</p>
          <p className="text-2xl font-bold text-gray-600">{freeCount}</p>
        </div>
      </div>

      {/* Pending payments table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Pending Payments</h3>
            <p className="text-sm text-gray-500">Attendees with outstanding payments</p>
          </div>
          <Link
            href="/admin/attendees"
            className="text-xs font-medium text-[#1a73e8] hover:underline"
          >
            View All Attendees
          </Link>
        </div>

        {pendingAttendees.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No pending payments
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingAttendees.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-5 py-3 text-gray-600">{a.email}</td>
                    <td className="px-5 py-3 text-gray-600">{a.events?.title ?? "--"}</td>
                    <td className="px-5 py-3 text-gray-600">{a.tickets?.name ?? "--"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900 tabular-nums">
                      {a.payment_amount ? fmtCurrency(a.payment_amount) : "--"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider text-orange-700 bg-orange-50">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
