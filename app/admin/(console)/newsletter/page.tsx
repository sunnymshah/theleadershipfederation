"use client"

/**
 * ─── ADMIN: NEWSLETTER SUBSCRIBERS ────────────────────────────────────
 *
 * View list of newsletter subscribers, search, and export CSV.
 */

import { useState, useEffect, useCallback } from "react"
import { getNewsletterSubscribers } from "@/app/actions/newsletterActions"
import {
  MailOpen,
  Search,
  Download,
  Loader2,
  Users,
  UserCheck,
  UserX,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Subscriber {
  id: string
  name: string | null
  email: string
  phone: string | null
  subscribed_at: string
  is_active: boolean
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await getNewsletterSubscribers()
    if (res.success) setSubscribers((res.data ?? []) as Subscriber[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = subscribers.filter((s) => {
    if (filter === "active" && !s.is_active) return false
    if (filter === "inactive" && s.is_active) return false

    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      s.email.toLowerCase().includes(q) ||
      (s.name ?? "").toLowerCase().includes(q)
    )
  })

  const stats = {
    total: subscribers.length,
    active: subscribers.filter((s) => s.is_active).length,
    inactive: subscribers.filter((s) => !s.is_active).length,
  }

  function handleExport() {
    if (filtered.length === 0) return
    const header = ["Name", "Email", "Phone", "Subscribed At", "Status"]
    const rows = filtered.map((s) => [
      s.name ?? "",
      s.email,
      s.phone ?? "",
      new Date(s.subscribed_at).toISOString(),
      s.is_active ? "Active" : "Inactive",
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MailOpen size={22} className="text-[#e7ab1c]" />
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            People who opted in via the homepage or footer newsletter form
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-semibold hover:bg-[#2a2a4e] disabled:opacity-40 transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, bg: "bg-gray-50", color: "text-gray-900", icon: Users },
          { label: "Active", value: stats.active, bg: "bg-emerald-50", color: "text-emerald-700", icon: UserCheck },
          { label: "Inactive", value: stats.inactive, bg: "bg-gray-50", color: "text-gray-500", icon: UserX },
        ].map((s) => (
          <div
            key={s.label}
            className={cn("rounded-xl border border-gray-200 px-4 py-3 flex items-start justify-between", s.bg)}
          >
            <div>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            </div>
            <s.icon size={18} className="text-gray-300" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                filter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MailOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No subscribers yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subscribed</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  className={cn(
                    "transition-colors hover:bg-gray-50/50",
                    i < filtered.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {s.name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {s.phone ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {fmtDate(s.subscribed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border",
                        s.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      )}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
