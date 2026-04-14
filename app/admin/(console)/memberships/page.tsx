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
  createMembershipTier,
  updateMembershipTier,
  deleteMembershipTier,
} from "@/app/actions/membershipActions"
import {
  getMembershipComparisonRows,
  createComparisonRow,
  updateComparisonRow,
  deleteComparisonRow,
} from "@/app/actions/cmsActions"
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
  Plus,
  Pencil,
  Trash2,
  Table2,
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

interface ComparisonRow {
  id: string
  feature: string
  silver_value: string | null
  gold_value: string | null
  platinum_value: string | null
  titanium_value: string | null
  sort_order: number
  is_active: boolean
}

export default function AdminMembershipsPage() {
  const [tiers, setTiers] = useState<MembershipTier[]>([])
  const [applications, setApplications] = useState<MembershipApplication[]>([])
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"applications" | "tiers" | "comparison">("applications")

  /* Tier form state */
  const [tierFormOpen, setTierFormOpen] = useState(false)
  const [editingTier, setEditingTier]   = useState<MembershipTier | null>(null)
  const [submittingTier, setSubmittingTier] = useState(false)
  const [deletingTierId, setDeletingTierId] = useState<string | null>(null)

  /* Comparison row form state */
  const [rowFormOpen, setRowFormOpen]   = useState(false)
  const [editingRow, setEditingRow]     = useState<ComparisonRow | null>(null)
  const [submittingRow, setSubmittingRow] = useState(false)
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null)

  /* ── Fetch data ─────────────────────────────────────────────────── */

  const fetchTiers = useCallback(async () => {
    const result = await getAllMembershipTiers()
    if (result.success && result.tiers) {
      setTiers(result.tiers)
    }
  }, [])

  const fetchComparisonRows = useCallback(async () => {
    const res = await getMembershipComparisonRows(false)
    if (res.success && res.rows) setComparisonRows(res.rows as ComparisonRow[])
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
    fetchComparisonRows()
  }, [fetchTiers, fetchComparisonRows])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  /* ── Tier handlers ───────────────────────────────────────────────── */

  function openTierAdd() { setEditingTier(null); setTierFormOpen(true); setError(null) }
  function openTierEdit(t: MembershipTier) { setEditingTier(t); setTierFormOpen(true); setError(null) }
  function closeTierForm() { setTierFormOpen(false); setEditingTier(null); setError(null) }

  async function handleTierSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmittingTier(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const popCb = form.querySelector<HTMLInputElement>('input[name="is_popular_cb"]')
    const actCb = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_popular", popCb?.checked ? "true" : "false")
    fd.set("is_active",  actCb?.checked ? "true" : "false")
    if (editingTier) fd.set("id", editingTier.id)
    const res = editingTier ? await updateMembershipTier(fd) : await createMembershipTier(fd)
    if (res.success) { closeTierForm(); await fetchTiers() }
    else setError(res.error ?? "Operation failed")
    setSubmittingTier(false)
  }

  async function handleTierDelete(id: string) {
    if (!confirm("Delete this tier? Applications referencing it will fail.")) return
    setDeletingTierId(id)
    const res = await deleteMembershipTier(id)
    if (res.success) await fetchTiers()
    else setError(res.error ?? "Failed to delete")
    setDeletingTierId(null)
  }

  /* ── Comparison row handlers ─────────────────────────────────────── */

  function openRowAdd() { setEditingRow(null); setRowFormOpen(true); setError(null) }
  function openRowEdit(r: ComparisonRow) { setEditingRow(r); setRowFormOpen(true); setError(null) }
  function closeRowForm() { setRowFormOpen(false); setEditingRow(null); setError(null) }

  async function handleRowSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmittingRow(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const cb = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_active", cb?.checked ? "true" : "false")
    if (editingRow) fd.set("id", editingRow.id)
    const res = editingRow ? await updateComparisonRow(fd) : await createComparisonRow(fd)
    if (res.success) { closeRowForm(); await fetchComparisonRows() }
    else setError(res.error ?? "Operation failed")
    setSubmittingRow(false)
  }

  async function handleRowDelete(id: string) {
    if (!confirm("Delete this comparison row?")) return
    setDeletingRowId(id)
    const res = await deleteComparisonRow(id)
    if (res.success) await fetchComparisonRows()
    else setError(res.error ?? "Failed to delete")
    setDeletingRowId(null)
  }

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
        <button
          onClick={() => setActiveTab("comparison")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "comparison"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <span className="flex items-center gap-2">
            <Table2 size={15} />
            Comparison Table
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
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">{tiers.length} tier{tiers.length === 1 ? "" : "s"} configured</p>
            <button onClick={openTierAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-colors">
              <Plus size={16} /> New Tier
            </button>
          </div>

          {tierFormOpen && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                {editingTier ? "Edit Tier" : "New Tier"}
              </h2>
              <form onSubmit={handleTierSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TierField label="Name *">
                    <input name="name" required defaultValue={editingTier?.name ?? ""} className={tierInputCls} />
                  </TierField>
                  <TierField label="Slug *">
                    <input name="slug" required defaultValue={editingTier?.slug ?? ""} className={tierInputCls} placeholder="silver, gold, platinum, titanium" />
                  </TierField>
                  <TierField label="Price INR">
                    <input name="price_inr" type="number" min="0" defaultValue={editingTier?.price_inr ?? 0} className={tierInputCls} />
                  </TierField>
                  <TierField label="Price USD">
                    <input name="price_usd" type="number" min="0" defaultValue={editingTier?.price_usd ?? 0} className={tierInputCls} />
                  </TierField>
                  <TierField label="Discount %">
                    <input name="discount_percent" type="number" min="0" max="100" defaultValue={editingTier?.discount_percent ?? 0} className={tierInputCls} />
                  </TierField>
                  <TierField label="Sort Order">
                    <input name="sort_order" type="number" defaultValue={editingTier?.sort_order ?? 0} className={tierInputCls} />
                  </TierField>
                </div>
                <TierField label="Benefits (one per line)">
                  <textarea name="benefits" rows={6} defaultValue={(editingTier?.benefits ?? []).join("\n")}
                    className={cn(tierInputCls, "resize-y")} />
                </TierField>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" name="is_popular_cb" defaultChecked={editingTier ? editingTier.is_popular : false}
                      className="w-4 h-4 rounded accent-[#e7ab1c]" />
                    Popular badge
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" name="is_active_cb" defaultChecked={editingTier ? editingTier.is_active : true}
                      className="w-4 h-4 rounded accent-[#e7ab1c]" />
                    Active
                  </label>
                </div>
                {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={submittingTier}
                    className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors">
                    {submittingTier ? "Saving…" : editingTier ? "Update Tier" : "Create Tier"}
                  </button>
                  <button type="button" onClick={closeTierForm}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

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

                <div className="space-y-1.5 mb-4">
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

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => openTierEdit(tier)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => handleTierDelete(tier.id)} disabled={deletingTierId === tier.id}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                    {deletingTierId === tier.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
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
        </>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* COMPARISON TAB                                            */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "comparison" && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-gray-500">
                {comparisonRows.length} row{comparisonRows.length === 1 ? "" : "s"} · values can be "true", "false", or any label ("VIP", "5%", "₹25,000")
              </p>
            </div>
            <button onClick={openRowAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-colors">
              <Plus size={16} /> New Row
            </button>
          </div>

          {rowFormOpen && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                {editingRow ? "Edit Comparison Row" : "New Comparison Row"}
              </h2>
              <form onSubmit={handleRowSubmit} className="space-y-4">
                <TierField label="Feature *">
                  <input name="feature" required defaultValue={editingRow?.feature ?? ""} className={tierInputCls} placeholder="Event Discount" />
                </TierField>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <TierField label="Silver">
                    <input name="silver_value" defaultValue={editingRow?.silver_value ?? ""} className={tierInputCls} placeholder="5% / true / false" />
                  </TierField>
                  <TierField label="Gold">
                    <input name="gold_value" defaultValue={editingRow?.gold_value ?? ""} className={tierInputCls} />
                  </TierField>
                  <TierField label="Platinum">
                    <input name="platinum_value" defaultValue={editingRow?.platinum_value ?? ""} className={tierInputCls} />
                  </TierField>
                  <TierField label="Titanium">
                    <input name="titanium_value" defaultValue={editingRow?.titanium_value ?? ""} className={tierInputCls} />
                  </TierField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <TierField label="Sort Order">
                    <input name="sort_order" type="number" defaultValue={editingRow?.sort_order ?? 0} className={tierInputCls} />
                  </TierField>
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="checkbox" name="is_active_cb" defaultChecked={editingRow ? editingRow.is_active : true}
                        className="w-4 h-4 rounded accent-[#e7ab1c]" />
                      Active
                    </label>
                  </div>
                </div>
                {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={submittingRow}
                    className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors">
                    {submittingRow ? "Saving…" : editingRow ? "Update Row" : "Create Row"}
                  </button>
                  <button type="button" onClick={closeRowForm}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {comparisonRows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Table2 size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No comparison rows yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Feature</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Silver</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gold</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platinum</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Titanium</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.id} className={cn("hover:bg-gray-50/50", i < comparisonRows.length - 1 && "border-b border-gray-100")}>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {row.feature}
                        {!row.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.silver_value ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{row.gold_value ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{row.platinum_value ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{row.titanium_value ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openRowEdit(row)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => handleRowDelete(row.id)} disabled={deletingRowId === row.id}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                            {deletingRowId === row.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            Delete
                          </button>
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
    </div>
  )
}

const tierInputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"

function TierField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
