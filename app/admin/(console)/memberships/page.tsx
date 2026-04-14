"use client"

/**
 * ─── MEMBERSHIP MANAGEMENT PAGE ──────────────────────────────────────
 *
 * Admin page for managing membership tiers and applications.
 * - View all membership applications in a filterable table
 * - Filter by status (pending / approved / rejected)
 * - Approve or reject applications
 * - View tier configuration (read-only)
 */

import { useState, useEffect, useCallback } from "react"
import {
  getAllMembershipTiers,
  getMembershipApplications,
  updateApplicationStatus,
} from "@/app/actions/membershipActions"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  X,
  Crown,
  Users,
  Clock,
  Filter,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ────────────────────────────────────────────────────────── */

interface MembershipTier {
  id: string
  name: string
  slug: string
  price_inr: number
  price_usd: number
  discount_percent: number
  benefits: string[]
  is_popular: boolean
  sort_order: number
  is_active: boolean
}

interface MembershipApplication {
  id: string
  tier_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  linkedin_url: string | null
  status: "pending" | "approved" | "rejected"
  notes: string | null
  created_at: string
  updated_at: string
  membership_tiers: { id: string; name: string; slug: string } | null
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
}

/* ═══════════════════════════════════════════════════════════════════ */

export default function AdminMembershipsPage() {
  const [tiers, setTiers] = useState<MembershipTier[]>([])
  const [applications, setApplications] = useState<MembershipApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"applications" | "tiers">("applications")

  /* ── Fetch data ─────────────────────────────────────────────────── */

  const fetchTiers = useCallback(async () => {
    const result = await getAllMembershipTiers()
    if (result.success && result.tiers) {
      setTiers(result.tiers)
    }
  }, [])

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const result = await getMembershipApplications({
      status: statusFilter,
      search: searchQuery || undefined,
    })
    if (result.success && result.applications) {
      setApplications(result.applications)
    } else {
      setError(result.error ?? "Failed to load applications")
    }
    setLoading(false)
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchTiers()
  }, [fetchTiers])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  /* ── Handlers ───────────────────────────────────────────────────── */

  async function handleStatusChange(id: string, newStatus: "pending" | "approved" | "rejected") {
    setProcessingId(id)
    setError(null)
    const result = await updateApplicationStatus(id, newStatus)
    if (result.success) {
      await fetchApplications()
    } else {
      setError(result.error ?? "Failed to update status")
    }
    setProcessingId(null)
  }

  /* ── Stats ──────────────────────────────────────────────────────── */

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

  /* ── Filter in-page ─────────────────────────────────────────────── */

  const filtered = applications.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.company ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown size={24} className="text-amber-500" />
            Memberships
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage membership tiers and applications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("applications")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "applications"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <span className="flex items-center gap-2">
            <Users size={15} />
            Applications
          </span>
        </button>
        <button
          onClick={() => setActiveTab("tiers")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "tiers"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <span className="flex items-center gap-2">
            <Crown size={15} />
            Tiers
          </span>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* APPLICATIONS TAB                                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "applications" && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total", value: stats.total, color: "text-gray-900", bg: "bg-gray-50" },
              { label: "Pending", value: stats.pending, color: "text-amber-700", bg: "bg-amber-50" },
              { label: "Approved", value: stats.approved, color: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "Rejected", value: stats.rejected, color: "text-red-700", bg: "bg-red-50" },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  "rounded-xl border px-4 py-3",
                  s.bg,
                  "border-gray-200"
                )}
              >
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name, email, company..."
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

            {/* Status filter */}
            <div className="relative">
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app, i) => (
                    <tr
                      key={app.id}
                      className={cn(
                        "transition-colors hover:bg-gray-50/50",
                        i < filtered.length - 1 && "border-b border-gray-100"
                      )}
                    >
                      {/* Applicant */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {app.name}
                          </p>
                          <p className="text-xs text-gray-500">{app.email}</p>
                          {app.phone && (
                            <p className="text-xs text-gray-400">{app.phone}</p>
                          )}
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Crown size={11} />
                          {app.membership_tiers?.name ?? "—"}
                        </span>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-700">
                            {app.company ?? "—"}
                          </p>
                          {app.designation && (
                            <p className="text-xs text-gray-400">
                              {app.designation}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {fmtDate(app.created_at)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border capitalize",
                            STATUS_STYLES[app.status]
                          )}
                        >
                          {app.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {processingId === app.id ? (
                            <Loader2
                              size={16}
                              className="animate-spin text-gray-400"
                            />
                          ) : (
                            <>
                              {app.status !== "approved" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(app.id, "approved")
                                  }
                                  title="Approve"
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}
                              {app.status !== "rejected" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(app.id, "rejected")
                                  }
                                  title="Reject"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                              {app.status !== "pending" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(app.id, "pending")
                                  }
                                  title="Reset to Pending"
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <Clock size={16} />
                                </button>
                              )}
                              {app.linkedin_url && (
                                <a
                                  href={app.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="LinkedIn Profile"
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TIERS TAB                                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "tiers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "rounded-xl border bg-white p-5 relative",
                tier.is_popular
                  ? "border-amber-300 ring-1 ring-amber-200"
                  : "border-gray-200"
              )}
            >
              {tier.is_popular && (
                <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500 text-white">
                  Popular
                </span>
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {tier.name}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">
                ₹{fmtPrice(tier.price_inr)}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  + GST
                </span>
              </p>
              <p className="text-xs text-gray-400 mb-3">
                USD ${fmtPrice(tier.price_usd)}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {tier.discount_percent}% discount
                </span>
                <span
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-full border",
                    tier.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  )}
                >
                  {tier.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-1.5">
                {(Array.isArray(tier.benefits) ? tier.benefits : []).map(
                  (b: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-gray-600"
                    >
                      <CheckCircle2
                        size={12}
                        className="text-emerald-500 mt-0.5 shrink-0"
                      />
                      {b}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}

          {tiers.length === 0 && !loading && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Crown size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                No tiers configured. Run the membership migration to seed
                default tiers.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
