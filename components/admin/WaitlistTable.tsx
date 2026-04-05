"use client"

/**
 * ─── WaitlistTable — Client component for waitlist actions ────────────
 *
 * Renders the waitlist table with Promote and Remove action buttons.
 * Uses server actions from waitlistActions.ts.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { promoteFromWaitlist, cancelAndPromote } from "@/app/actions/waitlistActions"

interface WaitlistRow {
  id: string
  name: string
  email: string
  phone: string | null
  status: string
  waitlist_position: number | null
  registration_date: string
  event_id: string
  ticket_id: string | null
  events: { title: string } | null
  tickets: { name: string } | null
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function WaitlistTable({ rows }: { rows: WaitlistRow[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handlePromote(id: string) {
    setLoadingId(id)
    setActionError(null)
    const result = await promoteFromWaitlist(id)
    setLoadingId(null)
    if (!result.success) {
      setActionError(result.error ?? "Failed to promote")
    } else {
      router.refresh()
    }
  }

  async function handleRemove(id: string) {
    setLoadingId(id)
    setActionError(null)
    const result = await cancelAndPromote(id)
    setLoadingId(null)
    if (!result.success) {
      setActionError(result.error ?? "Failed to remove")
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Pos
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Waitlisted Date
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isLoading = loadingId === row.id
                return (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-50 text-orange-700 text-xs font-bold">
                        {row.waitlist_position ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{row.email}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {row.events?.title ?? "--"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {row.tickets?.name ?? "--"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {row.registration_date ? fmtDate(row.registration_date) : "--"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePromote(row.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? (
                            <span className="animate-spin w-3 h-3 border border-emerald-600 border-t-transparent rounded-full inline-block" />
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          )}
                          Promote
                        </button>
                        <button
                          onClick={() => handleRemove(row.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? (
                            <span className="animate-spin w-3 h-3 border border-red-600 border-t-transparent rounded-full inline-block" />
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          )}
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
