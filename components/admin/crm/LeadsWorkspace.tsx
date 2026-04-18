"use client"

/**
 * /admin/leads — the CRM pipeline workspace.
 *
 * Layout (top → bottom):
 *   • Page header: title + stats pills + primary buttons (Import, New).
 *   • Toolbar: search, status filter, source filter, owner filter,
 *     view toggle (Table ⇄ Kanban).
 *   • Body: Table (with row-select + sort) or Kanban (drag-drop).
 *   • Floating BulkActionsBar when rows selected.
 *   • Side drawers: new-lead form · lead detail · import wizard.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Search, Plus, Upload, LayoutGrid, Table as TableIcon, Loader2,
  Download, ChevronDown, UserCircle2, Users, TrendingUp, CheckCircle2, X,
} from "lucide-react"
import {
  listLeads, createLead, updateLead, listTeamMembers, getLeadStats, getMyId,
  type CrmLead, type LeadStatus, type LeadSource, type LeadInput,
} from "@/app/actions/crmLeadActions"
import { LeadDetailDrawer } from "./LeadDetailDrawer"
import { LeadKanban } from "./LeadKanban"
import { LeadImportModal } from "./LeadImportModal"
import { BulkActionsBar } from "./BulkActionsBar"
import {
  STATUS_LABELS, STATUS_ORDER, STATUS_PILL,
  SOURCE_LABELS, SOURCE_OPTIONS,
} from "./leadConstants"

type Member = { user_id: string; email: string; role: string }
type View = "table" | "kanban"

type Stats = {
  total: number
  byStatus: Record<LeadStatus, number>
  byRating: Record<"hot" | "warm" | "cold", number>
  bySource: Record<string, number>
  openTasks: number
  valueOpen: number
  valueWon: number
}

export function LeadsWorkspace() {
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<View>("table")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<LeadStatus | "">("")
  const [source, setSource] = useState<LeadSource | "">("")
  const [owner, setOwner] = useState<string>("")

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)

  /* ── Load data ───────────────────────────────────────────────────── */

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [leadsR, statsR] = await Promise.all([
      listLeads({
        search: search.trim() || undefined,
        status: status || undefined,
        source: source || undefined,
        ownerId: owner || undefined,
      }),
      getLeadStats(),
    ])
    if (leadsR.success) setLeads(leadsR.leads)
    if (statsR.success) setStats(statsR.stats)
    setLoading(false)
  }, [search, status, source, owner])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    (async () => {
      const [m, me] = await Promise.all([listTeamMembers(), getMyId()])
      if (m.success) setMembers(m.members)
      setMyId(me.userId)
    })()
  }, [])

  /* ── Handlers ────────────────────────────────────────────────────── */

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === leads.length) setSelected(new Set())
    else setSelected(new Set(leads.map((l) => l.id)))
  }

  async function handleStatusDrop(leadId: string, next: LeadStatus) {
    // Optimistic
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: next } : l)))
    await updateLead(leadId, { status: next })
    fetchAll()
  }

  function exportCSV(ids?: string[]) {
    const rows = ids?.length ? leads.filter((l) => ids.includes(l.id)) : leads
    const headers = [
      "First name","Last name","Email","Phone","Company","Title",
      "Status","Rating","Source","Owner","Tags","Value","Created at",
    ]
    const memberEmail = (id: string | null) =>
      members.find((m) => m.user_id === id)?.email ?? ""
    const body = rows.map((l) => [
      l.first_name, l.last_name ?? "", l.email ?? "", l.phone ?? "",
      l.company ?? "", l.title ?? "",
      STATUS_LABELS[l.status], l.rating ?? "", SOURCE_LABELS[l.source],
      memberEmail(l.owner_id), l.tags.join("; "),
      l.lead_value?.toString() ?? "",
      new Date(l.created_at).toLocaleString("en-IN"),
    ])
    const csv = [headers, ...body]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Derived ─────────────────────────────────────────────────────── */

  const memberById = useMemo(() => {
    const m = new Map<string, Member>()
    for (const x of members) m.set(x.user_id, x)
    return m
  }, [members])

  return (
    <div className="p-6 md:p-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-2">
            CRM · Pipeline
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a2e] tracking-tight">
            Leads
          </h1>
          <p className="mt-1 text-sm text-gray-500 max-w-2xl">
            Every prospect — speaker outreach, partner inquiry, VIP prospect, inbound — with
            stages, owners, notes, and follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImporting(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#333] hover:border-[#c9a84c] transition-colors"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1a1a2e] text-white text-[13px] font-medium hover:bg-[#2a2a3e] transition-colors"
          >
            <Plus size={14} /> New lead
          </button>
        </div>
      </div>

      {/* ── Stat strip ──────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard icon={<Users size={14} />} label="Total leads"
            value={stats.total.toString()} />
          <StatCard icon={<TrendingUp size={14} />} label="Open pipeline ₹"
            value={`₹${compact(stats.valueOpen)}`} />
          <StatCard icon={<CheckCircle2 size={14} />} label="Won ₹"
            value={`₹${compact(stats.valueWon)}`} tone="success" />
          <StatCard icon={<UserCircle2 size={14} />} label="Open tasks"
            value={stats.openTasks.toString()} />
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company, phone…"
            className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-md text-[13px] focus:outline-none focus:border-[#c9a84c]"
          />
        </div>

        <FilterSelect
          value={status}
          onChange={(v) => setStatus(v as LeadStatus | "")}
          placeholder="All statuses"
          options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        />
        <FilterSelect
          value={source}
          onChange={(v) => setSource(v as LeadSource | "")}
          placeholder="All sources"
          options={SOURCE_OPTIONS.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
        />
        <FilterSelect
          value={owner}
          onChange={setOwner}
          placeholder="All owners"
          options={[
            ...(myId ? [{ value: myId, label: "Me" }] : []),
            ...members.filter((m) => m.user_id !== myId).map((m) => ({ value: m.user_id, label: m.email })),
          ]}
        />

        <div className="ml-auto flex items-center gap-1 bg-[#f5f5f5] rounded-md p-0.5">
          <ViewBtn active={view === "table"}  onClick={() => setView("table")}  icon={<TableIcon size={13} />} label="Table" />
          <ViewBtn active={view === "kanban"} onClick={() => setView("kanban")} icon={<LayoutGrid size={13} />} label="Kanban" />
        </div>

        <button
          onClick={() => exportCSV()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] text-[#888] hover:text-[#1a1a2e]"
          title="Export all filtered as CSV"
        >
          <Download size={13} />
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#aaa] gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      ) : leads.length === 0 ? (
        <EmptyState onNew={() => setCreating(true)} onImport={() => setImporting(true)} />
      ) : view === "kanban" ? (
        <LeadKanban
          leads={leads}
          onStatusChange={handleStatusDrop}
          onOpenLead={setDetailId}
        />
      ) : (
        <LeadsTable
          leads={leads}
          selected={selected}
          onToggle={toggleSelect}
          onToggleAll={toggleSelectAll}
          onOpen={setDetailId}
          memberById={memberById}
        />
      )}

      {/* ── Bulk bar ────────────────────────────────────────────────── */}
      <BulkActionsBar
        selectedIds={Array.from(selected)}
        members={members}
        onCleared={() => setSelected(new Set())}
        onChanged={() => { setSelected(new Set()); fetchAll() }}
        onExport={() => exportCSV(Array.from(selected))}
      />

      {/* ── Drawers / modals ────────────────────────────────────────── */}
      {detailId && (
        <LeadDetailDrawer
          leadId={detailId}
          members={members}
          onClose={() => setDetailId(null)}
          onChange={fetchAll}
        />
      )}

      {creating && (
        <NewLeadDrawer
          members={members}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); fetchAll() }}
        />
      )}

      {importing && (
        <LeadImportModal
          members={members}
          onClose={() => setImporting(false)}
          onDone={fetchAll}
        />
      )}
    </div>
  )
}

/* ── Table ─────────────────────────────────────────────────────────── */

function LeadsTable({
  leads, selected, onToggle, onToggleAll, onOpen, memberById,
}: {
  leads: CrmLead[]
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  onOpen: (id: string) => void
  memberById: Map<string, { email: string }>
}) {
  const allSelected = selected.size > 0 && selected.size === leads.length
  return (
    <div className="border border-[#e5e7eb] rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#fafafa] text-[10px] uppercase tracking-wider text-[#888]">
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" checked={allSelected} onChange={onToggleAll}
                  className="rounded cursor-pointer" />
              </th>
              <th className="text-left px-3 py-2.5 font-semibold">Name</th>
              <th className="text-left px-3 py-2.5 font-semibold">Company</th>
              <th className="text-left px-3 py-2.5 font-semibold">Status</th>
              <th className="text-left px-3 py-2.5 font-semibold">Source</th>
              <th className="text-left px-3 py-2.5 font-semibold">Owner</th>
              <th className="text-right px-3 py-2.5 font-semibold">Value</th>
              <th className="text-left px-3 py-2.5 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const pill = STATUS_PILL[l.status]
              const owner = l.owner_id ? memberById.get(l.owner_id) : null
              return (
                <tr
                  key={l.id}
                  className="border-t border-[#eee] hover:bg-[#fafafa] cursor-pointer transition-colors"
                  onClick={() => onOpen(l.id)}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => onToggle(l.id)}
                      className="rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-[#1a1a2e]">{l.full_name}</div>
                    {l.email && <div className="text-[11px] text-[#aaa] mt-0.5">{l.email}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-[#555]">
                    {l.company || <span className="text-[#ccc]">—</span>}
                    {l.title && <div className="text-[11px] text-[#aaa] mt-0.5">{l.title}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${pill.bg} ${pill.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                      {STATUS_LABELS[l.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#555] text-[12px]">
                    {SOURCE_LABELS[l.source]}
                  </td>
                  <td className="px-3 py-2.5 text-[#555] text-[12px]">
                    {owner ? owner.email : <span className="text-[#ccc]">Unassigned</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#555] font-medium">
                    {l.lead_value ? `₹${Number(l.lead_value).toLocaleString("en-IN")}` : <span className="text-[#ccc]">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[#888] text-[12px] whitespace-nowrap">
                    {new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── New lead drawer ───────────────────────────────────────────────── */

function NewLeadDrawer({
  members, onClose, onCreated,
}: { members: Member[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<LeadInput>({
    firstName: "", lastName: "", email: "", phone: "",
    company: "", title: "", source: "other", status: "new",
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!form.firstName?.trim()) return setError("First name is required")
    setBusy(true); setError(null)
    const r = await createLead(form)
    setBusy(false)
    if (r.success) onCreated()
    else setError(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full sm:max-w-[480px] bg-white shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-[#eee] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#1a1a2e]">New lead</h2>
          <button onClick={onClose} className="p-2 rounded-md text-[#888] hover:bg-[#f5f5f5]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} autoFocus />
            <Field label="Last name"    value={form.lastName ?? ""} onChange={(v) => setForm({ ...form, lastName: v })} />
          </div>
          <Field label="Email"   type="email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Phone"   value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Company" value={form.company ?? ""} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label="Job title" value={form.title ?? ""} onChange={(v) => setForm({ ...form, title: v })} />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Source"
              value={form.source ?? "other"}
              onChange={(v) => setForm({ ...form, source: v as LeadSource })}
              options={SOURCE_OPTIONS.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))} />
            <Select label="Status"
              value={form.status ?? "new"}
              onChange={(v) => setForm({ ...form, status: v as LeadStatus })}
              options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))} />
          </div>

          <Select label="Assign to"
            value={form.ownerId ?? ""}
            onChange={(v) => setForm({ ...form, ownerId: v || null })}
            options={[
              { value: "", label: "Unassigned" },
              ...members.map((m) => ({ value: m.user_id, label: m.email })),
            ]} />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-[12px] text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#eee] bg-[#fafafa] flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-[13px] text-[#888] hover:text-[#1a1a2e]">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-1.5 rounded-md bg-[#1a1a2e] text-white text-[13px] font-medium hover:bg-[#2a2a3e] disabled:opacity-40 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : null}
            Create lead
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Primitives ────────────────────────────────────────────────────── */

function Field({
  label, value, onChange, type = "text", autoFocus,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] text-[#888] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[13px] focus:outline-none focus:border-[#c9a84c]"
      />
    </div>
  )
}

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-[11px] text-[#888] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#c9a84c]"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function FilterSelect({
  value, onChange, placeholder, options,
}: { value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 border border-[#e5e7eb] rounded-md text-[13px] text-[#333] bg-white focus:outline-none focus:border-[#c9a84c]"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
    </div>
  )
}

function ViewBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium transition-colors
        ${active ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#888] hover:text-[#1a1a2e]"}
      `}
    >
      {icon} {label}
    </button>
  )
}

function StatCard({
  icon, label, value, tone = "default",
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "default" | "success"
}) {
  return (
    <div className="border border-[#e5e7eb] rounded-lg px-4 py-3 bg-white">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-[#888] font-semibold">{label}</span>
        <span className="text-[#ccc]">{icon}</span>
      </div>
      <div className={`text-xl font-semibold ${tone === "success" ? "text-emerald-700" : "text-[#1a1a2e]"}`}>
        {value}
      </div>
    </div>
  )
}

function EmptyState({ onNew, onImport }: { onNew: () => void; onImport: () => void }) {
  return (
    <div className="border border-dashed border-[#e5e7eb] rounded-xl p-12 text-center bg-[#fafafa]">
      <Users size={32} className="mx-auto text-[#ccc] mb-3" />
      <h3 className="text-[15px] font-semibold text-[#1a1a2e] mb-1">No leads yet</h3>
      <p className="text-[12px] text-[#888] mb-5">
        Add your first lead or import a CSV to get the pipeline started.
      </p>
      <div className="flex items-center justify-center gap-2">
        <button onClick={onImport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#333] hover:border-[#c9a84c]">
          <Upload size={14} /> Import CSV
        </button>
        <button onClick={onNew}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1a1a2e] text-white text-[13px] font-medium hover:bg-[#2a2a3e]">
          <Plus size={14} /> New lead
        </button>
      </div>
    </div>
  )
}

/* ── Utils ─────────────────────────────────────────────────────────── */

function compact(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return n.toString()
}
