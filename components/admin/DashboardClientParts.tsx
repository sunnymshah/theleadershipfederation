"use client"

/**
 * ─── Dashboard Client Parts ────────────────────────────────────────────
 *
 * Minimal client component for the sortable Event Performance table.
 * Kept separate so the main dashboard page stays a server component.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"

interface EventRow {
  id: string
  title: string
  slug: string
  start_date: string
  start_date_fmt: string
  status: string
  totalRegistrations: number
  totalCheckedIn: number
  checkInRate: number
  revenue: number
  revenue_fmt: string
}

type SortKey = "title" | "start_date" | "status" | "totalRegistrations" | "revenue" | "checkInRate"
type SortDir = "asc" | "desc"

export function DashboardClientParts({
  eventBreakdowns,
  statusBadge,
}: {
  eventBreakdowns: EventRow[]
  statusBadge: Record<string, string>
}) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>("start_date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = [...eventBreakdowns].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1
    switch (sortKey) {
      case "title":
        return mul * a.title.localeCompare(b.title)
      case "start_date":
        return mul * a.start_date.localeCompare(b.start_date)
      case "status":
        return mul * a.status.localeCompare(b.status)
      case "totalRegistrations":
        return mul * (a.totalRegistrations - b.totalRegistrations)
      case "revenue":
        return mul * (a.revenue - b.revenue)
      case "checkInRate":
        return mul * (a.checkInRate - b.checkInRate)
      default:
        return 0
    }
  })

  function SortArrow({ column }: { column: SortKey }) {
    if (sortKey !== column) return null
    return (
      <span className="ml-1 text-[10px]">
        {sortDir === "asc" ? "\u25B2" : "\u25BC"}
      </span>
    )
  }

  const thClass =
    "text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className={thClass} onClick={() => handleSort("title")}>
              Event Name <SortArrow column="title" />
            </th>
            <th className={thClass} onClick={() => handleSort("start_date")}>
              Date <SortArrow column="start_date" />
            </th>
            <th className={thClass} onClick={() => handleSort("status")}>
              Status <SortArrow column="status" />
            </th>
            <th
              className={`${thClass} text-right`}
              onClick={() => handleSort("totalRegistrations")}
            >
              Registrations <SortArrow column="totalRegistrations" />
            </th>
            <th
              className={`${thClass} text-right`}
              onClick={() => handleSort("revenue")}
            >
              Revenue <SortArrow column="revenue" />
            </th>
            <th
              className={`${thClass} text-right`}
              onClick={() => handleSort("checkInRate")}
            >
              Check-in Rate <SortArrow column="checkInRate" />
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((event) => (
            <tr
              key={event.id}
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/admin/events/${event.id}`)}
            >
              <td className="px-5 py-4">
                <div className="font-medium text-gray-900">{event.title}</div>
                <div className="text-[11px] text-gray-400">/{event.slug}</div>
              </td>
              <td className="px-5 py-4 text-gray-600 text-xs">{event.start_date_fmt}</td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${statusBadge[event.status] ?? "text-gray-600 bg-gray-100 border-gray-200"}`}
                >
                  {event.status}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <span className="text-gray-900 font-semibold tabular-nums">
                  {event.totalRegistrations}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <span className="text-gray-900 font-semibold tabular-nums">
                  {event.revenue_fmt}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-20 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${event.checkInRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 tabular-nums w-9 text-right">
                    {event.checkInRate}%
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin/events/${event.id}`)
                  }}
                  className="text-xs text-[#1a73e8] hover:underline font-medium"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
