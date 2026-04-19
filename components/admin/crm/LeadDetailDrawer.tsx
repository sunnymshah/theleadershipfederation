"use client"

/**
 * Slide-in detail drawer for a single lead.
 *
 * Tabs: Overview · Activity · Notes · Tasks
 *
 * - Overview: all editable fields, inline-saved on blur.
 * - Activity: append-only timeline (auto-logged events).
 * - Notes: add / delete.
 * - Tasks: add / toggle done / delete.
 */

import { useCallback, useEffect, useState } from "react"
import {
  X, Mail, Phone, Building2, Briefcase, Globe, Link2, MapPin,
  User as UserIcon, Calendar, Flame, Trash2, Loader2, Check,
  StickyNote, ListTodo, Activity as ActivityIcon, Info, Lock,
} from "lucide-react"
import {
  getLead, updateLead, deleteLead, listActivities, listNotes, addNote,
  deleteNote, listTasks, addTask, updateTask, deleteTask,
  type CrmLead, type LeadInput, type LeadStatus, type LeadRating,
  type LeadSource, type LeadActivity, type LeadNote, type LeadTask,
} from "@/app/actions/crmLeadActions"
import { useAdminPermissions } from "@/components/admin/AdminPermissionsContext"
import {
  STATUS_LABELS, STATUS_ORDER, STATUS_PILL, RATING_LABELS,
  SOURCE_LABELS, SOURCE_OPTIONS,
} from "./leadConstants"

type Member = {
  user_id: string
  email: string
  name: string | null
  role: string
  profile_id: string | null
  profile_name: string | null
}
type Tab = "overview" | "activity" | "notes" | "tasks"

interface Props {
  leadId: string
  members: Member[]
  onClose: () => void
  onChange: () => void
}

export function LeadDetailDrawer({ leadId, members, onClose, onChange }: Props) {
  const { can } = useAdminPermissions()
  const canEdit   = can("leads", "edit")
  const canDelete = can("leads", "delete")
  const canAssign = can("leads", "assign")
  const canViewTasks = can("tasks", "view")
  const [lead, setLead] = useState<CrmLead | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("overview")
  const [deleting, setDeleting] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const r = await getLead(leadId)
    if (r.success) setLead(r.lead)
    setLoading(false)
  }, [leadId])

  useEffect(() => { fetch() }, [fetch])

  // ESC to close
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  async function patch(p: Partial<LeadInput>) {
    if (!lead) return
    // Optimistic update
    setLead({ ...lead, ...fieldMap(p, lead) })
    const r = await updateLead(lead.id, p)
    if (r.success) {
      setLead(r.lead)
      onChange()
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this lead? This cannot be undone.")) return
    setDeleting(true)
    const r = await deleteLead(leadId)
    setDeleting(false)
    if (r.success) { onChange(); onClose() }
    else alert(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="w-full sm:max-w-[640px] bg-white shadow-2xl flex flex-col overflow-hidden">
        {loading || !lead ? (
          <div className="flex-1 flex items-center justify-center text-[#aaa]">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-[#eee]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center font-semibold">
                    {initials(lead.full_name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1a1a2e] leading-tight">
                      {lead.full_name || "Untitled lead"}
                    </h2>
                    <p className="text-[12px] text-[#888] mt-0.5">
                      {lead.title ? `${lead.title}` : ""}{lead.title && lead.company ? " · " : ""}
                      {lead.company ?? ""}
                      {!lead.title && !lead.company ? "No company" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="p-2 rounded-md text-[#888] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Delete lead"
                    >
                      {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-md text-[#888] hover:text-[#1a1a2e] hover:bg-[#f5f5f5] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Stage stepper */}
              <StageStepper
                value={lead.status}
                disabled={!canEdit}
                onChange={(s) => patch({ status: s })}
              />
              {!canEdit && (
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#999]">
                  <Lock size={10} /> Read-only — you can view this lead but not edit it.
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-[#eee] px-4 bg-[#fafafa]">
              <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} icon={<Info size={13} />} label="Overview" />
              <TabBtn active={tab === "activity"} onClick={() => setTab("activity")} icon={<ActivityIcon size={13} />} label="Activity" />
              <TabBtn active={tab === "notes"}    onClick={() => setTab("notes")}    icon={<StickyNote size={13} />}   label="Notes" />
              {canViewTasks && (
                <TabBtn active={tab === "tasks"}  onClick={() => setTab("tasks")}    icon={<ListTodo size={13} />}     label="Tasks" />
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab === "overview" && (
                <OverviewPanel
                  lead={lead}
                  members={members}
                  onPatch={patch}
                  canEdit={canEdit}
                  canAssign={canAssign}
                />
              )}
              {tab === "activity" && <ActivityPanel leadId={lead.id} />}
              {tab === "notes"    && <NotesPanel leadId={lead.id} canEdit={canEdit} />}
              {tab === "tasks" && canViewTasks && (
                <TasksPanel
                  leadId={lead.id}
                  members={members}
                  canCreate={can("tasks", "create")}
                  canEditTasks={can("tasks", "edit")}
                  canDeleteTasks={can("tasks", "delete")}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Stage stepper ─────────────────────────────────────────────────── */

function StageStepper({
  value, onChange, disabled,
}: { value: LeadStatus; onChange: (s: LeadStatus) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {STATUS_ORDER.map((s) => {
        const active = value === s
        const pill = STATUS_PILL[s]
        return (
          <button
            key={s}
            onClick={() => !disabled && onChange(s)}
            disabled={disabled}
            className={`
              flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-all
              ${active
                ? `${pill.bg} ${pill.text} ring-1 ring-inset ring-black/5`
                : "text-[#888] hover:bg-[#f5f5f5]"}
              ${disabled ? "cursor-not-allowed opacity-60" : ""}
            `}
          >
            {STATUS_LABELS[s]}
          </button>
        )
      })}
    </div>
  )
}

/* ── Overview panel ────────────────────────────────────────────────── */

function OverviewPanel({
  lead, members, onPatch, canEdit, canAssign,
}: {
  lead: CrmLead
  members: Member[]
  onPatch: (p: Partial<LeadInput>) => void
  canEdit: boolean
  canAssign: boolean
}) {
  const memberLabel = (m: Member) => {
    const base = m.name?.trim() || m.email || "Unknown"
    const badge = m.profile_name
      ? ` · ${m.profile_name}`
      : m.role === "super_admin" ? " · Super admin"
        : m.role === "admin" ? " · Admin"
        : m.role === "manager" ? " · Manager"
        : m.role === "check_in_staff" ? " · Check-in"
        : m.role === "viewer" ? " · Viewer" : ""
    return `${base}${badge}`
  }
  return (
    <div className="p-6 space-y-5">
      <FieldGroup title="Identity">
        <RowField icon={<UserIcon size={13} />} label="First name" readOnly={!canEdit}
          value={lead.first_name} onSave={(v) => onPatch({ firstName: v })} />
        <RowField icon={<UserIcon size={13} />} label="Last name" readOnly={!canEdit}
          value={lead.last_name ?? ""} onSave={(v) => onPatch({ lastName: v })} />
        <RowField icon={<Mail size={13} />} label="Email" type="email" readOnly={!canEdit}
          value={lead.email ?? ""} onSave={(v) => onPatch({ email: v })} />
        <RowField icon={<Phone size={13} />} label="Phone" readOnly={!canEdit}
          value={lead.phone ?? ""} onSave={(v) => onPatch({ phone: v })} />
      </FieldGroup>

      <FieldGroup title="Professional">
        <RowField icon={<Building2 size={13} />} label="Company" readOnly={!canEdit}
          value={lead.company ?? ""} onSave={(v) => onPatch({ company: v })} />
        <RowField icon={<Briefcase size={13} />} label="Job title" readOnly={!canEdit}
          value={lead.title ?? ""} onSave={(v) => onPatch({ title: v })} />
        <RowField icon={<Briefcase size={13} />} label="Industry" readOnly={!canEdit}
          value={lead.industry ?? ""} onSave={(v) => onPatch({ industry: v })} />
        <RowField icon={<Globe size={13} />} label="Website" readOnly={!canEdit}
          value={lead.website_url ?? ""} onSave={(v) => onPatch({ websiteUrl: v })} />
        <RowField icon={<Link2 size={13} />} label="LinkedIn" readOnly={!canEdit}
          value={lead.linkedin_url ?? ""} onSave={(v) => onPatch({ linkedinUrl: v })} />
      </FieldGroup>

      <FieldGroup title="Location">
        <RowField icon={<MapPin size={13} />} label="City" readOnly={!canEdit}
          value={lead.city ?? ""} onSave={(v) => onPatch({ city: v })} />
        <RowField icon={<MapPin size={13} />} label="Country" readOnly={!canEdit}
          value={lead.country ?? ""} onSave={(v) => onPatch({ country: v })} />
      </FieldGroup>

      <FieldGroup title="Pipeline">
        <RowSelect label="Owner" disabled={!canAssign}
          value={lead.owner_id ?? ""}
          options={[{ value: "", label: "Unassigned" }, ...members.map((m) => ({ value: m.user_id, label: memberLabel(m) }))]}
          onSave={(v) => onPatch({ ownerId: v || null })} />
        <RowSelect label="Rating" disabled={!canEdit}
          value={lead.rating ?? ""}
          options={[
            { value: "", label: "—" },
            ...(["hot","warm","cold"] as LeadRating[]).map((r) => ({ value: r, label: RATING_LABELS[r] })),
          ]}
          onSave={(v) => onPatch({ rating: (v || undefined) as LeadRating })} />
        <RowField icon={<Flame size={13} />} label="Lead value (₹)" type="number" readOnly={!canEdit}
          value={lead.lead_value?.toString() ?? ""}
          onSave={(v) => onPatch({ leadValue: v ? Number(v) : undefined })} />
        <RowSelect label="Source" disabled={!canEdit}
          value={lead.source}
          options={SOURCE_OPTIONS.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
          onSave={(v) => onPatch({ source: v as LeadSource })} />
        <RowField icon={<Info size={13} />} label="Source detail" readOnly={!canEdit}
          value={lead.source_detail ?? ""} onSave={(v) => onPatch({ sourceDetail: v })} />
      </FieldGroup>

      <FieldGroup title="Extra">
        <RowField icon={<Info size={13} />} label="Tags (comma-separated)" readOnly={!canEdit}
          value={lead.tags.join(", ")}
          onSave={(v) => onPatch({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
        <RowTextarea label="Description" readOnly={!canEdit}
          value={lead.description ?? ""}
          onSave={(v) => onPatch({ description: v })} />
      </FieldGroup>

      <div className="pt-3 border-t border-[#eee] text-[11px] text-[#aaa] flex items-center gap-2">
        <Calendar size={12} />
        Created {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        {lead.updated_at !== lead.created_at && (
          <span> · Updated {new Date(lead.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        )}
      </div>
    </div>
  )
}

/* ── Activity panel ────────────────────────────────────────────────── */

function ActivityPanel({ leadId }: { leadId: string }) {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const r = await listActivities(leadId)
      if (r.success) setActivities(r.activities)
      setLoading(false)
    })()
  }, [leadId])

  if (loading) return <div className="p-6 text-center text-[#aaa]"><Loader2 size={18} className="inline animate-spin" /></div>
  if (!activities.length) {
    return <div className="p-10 text-center text-[#aaa] text-sm">No activity yet.</div>
  }
  return (
    <div className="p-6">
      <ol className="relative border-l-2 border-[#eee] ml-3 space-y-4">
        {activities.map((a) => (
          <li key={a.id} className="pl-5 relative">
            <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#c9a84c] ring-2 ring-white" />
            <div className="text-[13px] text-[#333]">{a.summary}</div>
            <div className="text-[11px] text-[#aaa] mt-0.5">
              {a.actor_email ? <>{a.actor_email} · </> : null}
              {new Date(a.created_at).toLocaleString("en-IN", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── Notes panel ───────────────────────────────────────────────────── */

function NotesPanel({ leadId, canEdit }: { leadId: string; canEdit: boolean }) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState("")
  const [adding, setAdding] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const r = await listNotes(leadId)
    if (r.success) setNotes(r.notes)
    setLoading(false)
  }, [leadId])

  useEffect(() => { fetch() }, [fetch])

  async function submit() {
    if (!body.trim()) return
    setAdding(true)
    const r = await addNote(leadId, body)
    setAdding(false)
    if (r.success) { setBody(""); fetch() }
    else alert(r.error)
  }

  async function remove(id: string) {
    if (!confirm("Delete this note?")) return
    const r = await deleteNote(id)
    if (r.success) fetch()
  }

  return (
    <div className="p-6">
      {canEdit ? (
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden mb-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit() }}
            placeholder="Add a note… (⌘↵ to save)"
            className="w-full px-3 py-2.5 text-[13px] resize-none focus:outline-none"
            rows={3}
          />
          <div className="flex items-center justify-between border-t border-[#eee] px-3 py-1.5 bg-[#fafafa]">
            <span className="text-[11px] text-[#aaa]">{body.length} chars</span>
            <button
              onClick={submit}
              disabled={!body.trim() || adding}
              className="px-3 py-1 rounded-md bg-[#1a1a2e] text-white text-[12px] font-medium disabled:opacity-40 hover:bg-[#2a2a3e] transition-colors"
            >
              {adding ? <Loader2 size={12} className="animate-spin" /> : "Add note"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-1.5 text-[11px] text-[#999] bg-[#fafafa] border border-[#eee] rounded-md px-3 py-2">
          <Lock size={11} /> You don&apos;t have permission to add notes.
        </div>
      )}

      {loading ? (
        <div className="text-center text-[#aaa]"><Loader2 size={18} className="inline animate-spin" /></div>
      ) : !notes.length ? (
        <div className="text-center text-[#aaa] text-sm py-10">No notes yet.</div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="bg-[#fffcf2] border border-[#f5e9c0] rounded-lg px-3 py-2.5 relative group">
              <p className="text-[13px] text-[#333] whitespace-pre-wrap">{n.body}</p>
              <div className="text-[11px] text-[#aaa] mt-1.5 flex items-center justify-between">
                <span>
                  {n.author_email ? <>{n.author_email} · </> : null}
                  {new Date(n.created_at).toLocaleString("en-IN", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                {canEdit && (
                  <button onClick={() => remove(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#aaa] hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Tasks panel ───────────────────────────────────────────────────── */

function TasksPanel({
  leadId, members, canCreate, canEditTasks, canDeleteTasks,
}: {
  leadId: string
  members: Member[]
  canCreate: boolean
  canEditTasks: boolean
  canDeleteTasks: boolean
}) {
  const [tasks, setTasks] = useState<LeadTask[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [adding, setAdding] = useState(false)

  const memberLabel = (m: Member) => {
    const base = m.name?.trim() || m.email || "Unknown"
    const badge = m.profile_name ? ` · ${m.profile_name}` : m.role ? ` · ${m.role.replace("_", " ")}` : ""
    return `${base}${badge}`
  }

  const fetch = useCallback(async () => {
    setLoading(true)
    const r = await listTasks({ leadId })
    if (r.success) setTasks(r.tasks)
    setLoading(false)
  }, [leadId])

  useEffect(() => { fetch() }, [fetch])

  async function submit() {
    if (!title.trim()) return
    setAdding(true)
    const r = await addTask({
      leadId,
      title,
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
    })
    setAdding(false)
    if (r.success) { setTitle(""); setDueDate(""); setAssigneeId(""); fetch() }
    else alert(r.error)
  }

  async function toggle(t: LeadTask) {
    const r = await updateTask(t.id, { status: t.status === "done" ? "open" : "done" })
    if (r.success) fetch()
  }

  async function remove(id: string) {
    if (!confirm("Delete this task?")) return
    const r = await deleteTask(id)
    if (r.success) fetch()
  }

  return (
    <div className="p-6">
      {canCreate ? (
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) submit() }}
            placeholder="Add a task (press ↵)"
            className="w-full px-3 py-2.5 text-[13px] focus:outline-none"
          />
          <div className="flex items-center gap-2 border-t border-[#eee] px-3 py-2 bg-[#fafafa]">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="text-[11px] border border-[#e5e7eb] rounded px-1.5 py-1 bg-white" />
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
              className="text-[11px] border border-[#e5e7eb] rounded px-1.5 py-1 bg-white">
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.user_id} value={m.user_id}>{memberLabel(m)}</option>)}
            </select>
            <button
              onClick={submit}
              disabled={!title.trim() || adding}
              className="ml-auto px-3 py-1 rounded-md bg-[#1a1a2e] text-white text-[12px] font-medium disabled:opacity-40 hover:bg-[#2a2a3e] transition-colors"
            >
              {adding ? <Loader2 size={12} className="animate-spin" /> : "Add"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-1.5 text-[11px] text-[#999] bg-[#fafafa] border border-[#eee] rounded-md px-3 py-2">
          <Lock size={11} /> You don&apos;t have permission to create tasks.
        </div>
      )}

      {loading ? (
        <div className="text-center text-[#aaa]"><Loader2 size={18} className="inline animate-spin" /></div>
      ) : !tasks.length ? (
        <div className="text-center text-[#aaa] text-sm py-10">No tasks yet.</div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const done = t.status === "done"
            const overdue = !done && t.due_date && new Date(t.due_date) < new Date()
            return (
              <li key={t.id} className="flex items-center gap-3 py-2 px-3 border border-[#eee] rounded-lg group hover:bg-[#fafafa]">
                <button
                  onClick={() => { if (canEditTasks) toggle(t) }}
                  disabled={!canEditTasks}
                  className={`
                    w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                    ${done ? "bg-[#1a1a2e] border-[#1a1a2e]" : "border-[#ccc] hover:border-[#888]"}
                    ${!canEditTasks ? "cursor-not-allowed opacity-60" : ""}
                  `}
                >
                  {done && <Check size={12} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] ${done ? "line-through text-[#aaa]" : "text-[#333]"}`}>
                    {t.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#aaa] mt-0.5">
                    {t.due_date && (
                      <span className={overdue ? "text-red-600 font-medium" : ""}>
                        Due {new Date(t.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    {t.assignee_email && <span>· {t.assignee_email}</span>}
                  </div>
                </div>
                {canDeleteTasks && (
                  <button onClick={() => remove(t.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#aaa] hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ── Small field primitives ────────────────────────────────────────── */

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#aaa] mb-2">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function RowField({
  icon, label, value, onSave, type = "text", readOnly = false,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  onSave: (v: string) => void
  type?: string
  readOnly?: boolean
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const changed = draft !== value
  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <div className="w-32 flex items-center gap-1.5 text-[12px] text-[#888] shrink-0">
        {icon} {label}
      </div>
      <input
        type={type}
        value={draft}
        readOnly={readOnly}
        onChange={(e) => { if (!readOnly) setDraft(e.target.value) }}
        onBlur={() => { if (!readOnly && changed) onSave(draft) }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
        className={`flex-1 text-[13px] bg-transparent border-b border-transparent py-1 focus:outline-none ${
          readOnly
            ? "text-[#666] cursor-default"
            : "text-[#333] hover:border-[#eee] focus:border-[#c9a84c]"
        }`}
        placeholder="—"
      />
    </div>
  )
}

function RowTextarea({
  label, value, onSave, readOnly = false,
}: {
  label: string
  value: string
  onSave: (v: string) => void
  readOnly?: boolean
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <div className="py-1.5">
      <div className="text-[12px] text-[#888] mb-1">{label}</div>
      <textarea
        value={draft}
        readOnly={readOnly}
        onChange={(e) => { if (!readOnly) setDraft(e.target.value) }}
        onBlur={() => { if (!readOnly && draft !== value) onSave(draft) }}
        className={`w-full text-[13px] border rounded-md px-2 py-1.5 focus:outline-none ${
          readOnly
            ? "text-[#666] border-[#f2f2f2] bg-[#fafafa] cursor-default"
            : "text-[#333] border-[#eee] focus:border-[#c9a84c]"
        }`}
        rows={3}
        placeholder="—"
      />
    </div>
  )
}

function RowSelect({
  label, value, options, onSave, disabled = false,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onSave: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-32 text-[12px] text-[#888] shrink-0">{label}</div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onSave(e.target.value)}
        className={`flex-1 text-[13px] bg-transparent border-b border-transparent py-1 focus:outline-none ${
          disabled
            ? "text-[#666] cursor-not-allowed"
            : "text-[#333] hover:border-[#eee] focus:border-[#c9a84c]"
        }`}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-2.5 text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors
        ${active ? "text-[#1a1a2e]" : "text-[#888] hover:text-[#1a1a2e]"}
      `}
    >
      {icon}{label}
      {active && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#c9a84c] rounded-full" />}
    </button>
  )
}

/* ── Utils ─────────────────────────────────────────────────────────── */

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?"
}

/** Apply a LeadInput patch to a CrmLead row for optimistic UI updates. */
function fieldMap(p: Partial<LeadInput>, lead: CrmLead): Partial<CrmLead> {
  const out: Partial<CrmLead> = {}
  if (p.firstName !== undefined)   out.first_name = p.firstName
  if (p.lastName !== undefined)    out.last_name = p.lastName ?? null
  if (p.email !== undefined)       out.email = p.email ?? null
  if (p.phone !== undefined)       out.phone = p.phone ?? null
  if (p.company !== undefined)     out.company = p.company ?? null
  if (p.title !== undefined)       out.title = p.title ?? null
  if (p.industry !== undefined)    out.industry = p.industry ?? null
  if (p.websiteUrl !== undefined)  out.website_url = p.websiteUrl ?? null
  if (p.linkedinUrl !== undefined) out.linkedin_url = p.linkedinUrl ?? null
  if (p.city !== undefined)        out.city = p.city ?? null
  if (p.country !== undefined)     out.country = p.country ?? null
  if (p.status !== undefined)      out.status = p.status
  if (p.rating !== undefined)      out.rating = p.rating ?? null
  if (p.ownerId !== undefined)     out.owner_id = p.ownerId
  if (p.source !== undefined)      out.source = p.source
  if (p.sourceDetail !== undefined) out.source_detail = p.sourceDetail ?? null
  if (p.leadValue !== undefined)   out.lead_value = p.leadValue ?? null
  if (p.tags !== undefined)        out.tags = p.tags
  if (p.description !== undefined) out.description = p.description ?? null
  // regenerate full_name client-side to keep the header in sync
  if (p.firstName !== undefined || p.lastName !== undefined) {
    const fn = p.firstName ?? lead.first_name ?? ""
    const ln = p.lastName ?? lead.last_name ?? ""
    out.full_name = `${fn} ${ln}`.trim()
  }
  return out
}

