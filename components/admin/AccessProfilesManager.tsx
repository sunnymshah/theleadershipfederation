"use client"

/**
 * ─── ACCESS PROFILES MANAGER ──────────────────────────────────────────
 *
 * The per-module permission (JSONB) editor. Extracted from the monolithic
 * Settings page so it can live next to TeamManager inside the Team page
 * (as a tab) — profiles and members are one workflow, not two.
 *
 * The drawer creates a team member alongside the profile on first save
 * so a super admin can onboard someone in a single pass.
 */

import { useCallback, useEffect, useState } from "react"
import {
  Shield, Plus, Pencil, Trash2, X, Loader2, ChevronRight,
} from "lucide-react"
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  type AccessProfile,
} from "@/app/actions/profileActions"

/* ─── Constants ──────────────────────────────────────────────────────── */

const PRESET_COLORS = [
  "#DC2626", "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#84CC16", "#22C55E", "#059669", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#2563EB", "#4F46E5", "#7C3AED", "#8B5CF6",
  "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#6B7280",
]

const PERMISSION_MODULES: {
  key: string
  label: string
  description?: string
  columns: string[]
  group: "content" | "people" | "operations" | "finance" | "admin"
}[] = [
  { key: "events",       label: "Events",       group: "content",    description: "The event calendar and listings.",                columns: ["view", "create", "edit", "delete"] },
  { key: "sessions",     label: "Sessions",     group: "content",    description: "Agenda, tracks, session details.",                  columns: ["view", "create", "edit", "delete"] },
  { key: "speakers",     label: "Speakers",     group: "content",    description: "Speaker bios and photos.",                          columns: ["view", "create", "edit", "delete"] },
  { key: "sponsors",     label: "Sponsors",     group: "content",    description: "Sponsor logos, tiers, placements.",                 columns: ["view", "create", "edit", "delete"] },

  { key: "tickets",      label: "Tickets",      group: "operations", description: "Ticket tiers, inventory, and pricing.",             columns: ["view", "create", "edit", "delete"] },
  { key: "promo_codes",  label: "Promo Codes",  group: "operations", description: "Discount codes and coupon campaigns.",              columns: ["view", "create", "edit", "delete"] },
  { key: "check_in",     label: "Check-In",     group: "operations", description: "Scan tickets at the door / event entry.",           columns: ["perform"] },
  { key: "certificates", label: "Certificates", group: "operations", description: "Generate and email attendance certificates.",       columns: ["view", "generate", "email"] },

  { key: "attendees",    label: "Attendees",    group: "people",     description: "People registered for events (PII).",               columns: ["view", "create", "edit", "delete", "export"] },
  { key: "analytics",    label: "Analytics",    group: "people",     description: "Aggregate engagement and attendance trends.",       columns: ["view"] },

  { key: "invoices",     label: "Invoices",     group: "finance",    description: "Issue, send, and archive invoices.",                columns: ["view", "generate", "email"] },
  { key: "payments",     label: "Payments",     group: "finance",    description: "Individual transactions and refund initiations.",   columns: ["view", "refund"] },
  { key: "revenue",      label: "Revenue",      group: "finance",    description: "Totals, fees, payouts, net revenue dashboards.",    columns: ["view", "export"] },

  { key: "settings",     label: "Settings",     group: "admin",      description: "Org-wide configuration and defaults.",              columns: ["view", "edit"] },
  { key: "team",         label: "Team",         group: "admin",      description: "Add/remove team members and change roles.",         columns: ["view", "manage"] },
]

const PERMISSION_GROUPS: {
  key: "content" | "people" | "operations" | "finance" | "admin"
  label: string
  caption: string
}[] = [
  { key: "content",    label: "Content",            caption: "Public-facing event content on the website." },
  { key: "operations", label: "Event Operations",   caption: "Day-of tools — ticketing, check-in, certificates." },
  { key: "people",     label: "People & Analytics", caption: "Attendee data (contains PII) and engagement metrics." },
  { key: "finance",    label: "Finance",            caption: "Money: transactions, invoices, revenue, refunds." },
  { key: "admin",      label: "Admin",              caption: "Team management and organization-wide settings." },
]

/**
 * Permissions that reveal sensitive information or enable destructive /
 * financial actions. Turning ANY of these ON triggers a confirmation
 * warning so the super admin has to acknowledge what they're granting.
 */
const SENSITIVE_PERMISSIONS: Record<string, { title: string; body: string }> = {
  "revenue.view": {
    title: "Grant access to revenue totals?",
    body:
      "This member will be able to see exactly how much money the organization has earned — gross revenue, net revenue, refunds, fees, and payout amounts per event. Only turn this on for people who genuinely need to see totals.",
  },
  "revenue.export": {
    title: "Allow downloading revenue reports?",
    body:
      "This member will be able to download a CSV/Excel of revenue data — taking money figures offline and out of the platform. Recommended only for finance team leads.",
  },
  "payments.refund": {
    title: "Allow initiating refunds?",
    body:
      "This member will be able to refund payments to attendees, which MOVES MONEY out of your account. Refunds are irreversible from Razorpay's side. Grant with care.",
  },
  "payments.view": {
    title: "Grant access to individual payment records?",
    body:
      "This member will see every transaction — attendee name, amount, payment method (card type last-4, UPI handle where stored), and timestamp.",
  },
  "attendees.export": {
    title: "Allow exporting attendee PII?",
    body:
      "This member will be able to download a CSV of attendees including names, emails, and phone numbers. Protected personal data — once exported, it lives on their device.",
  },
  "attendees.delete": {
    title: "Allow deleting attendee records?",
    body:
      "This member will be able to permanently delete attendee rows. This may affect event capacity counts, reporting, and cannot be undone.",
  },
  "team.manage": {
    title: "Allow managing team members?",
    body:
      "This member will be able to invite, remove, and change roles of other team members — effectively granting them super-admin-level control over access. Only grant to co-owners you trust completely.",
  },
  "settings.edit": {
    title: "Allow editing organization settings?",
    body:
      "This member will be able to change organization-wide configuration — timezone, currency, tax rates, notification templates, and payment gateway settings.",
  },
}

type MemberRole = "super_admin" | "admin" | "manager" | "check_in_staff" | "viewer"

/* ─── Component ──────────────────────────────────────────────────────── */

export function AccessProfilesManager() {
  const [profiles, setProfiles] = useState<AccessProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Profile form state
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formColor, setFormColor] = useState("#2563EB")
  const [formPermissions, setFormPermissions] = useState<Record<string, Record<string, boolean>>>({})

  // New-member credentials (only on Create)
  const [formMemberName, setFormMemberName] = useState("")
  const [formMemberEmail, setFormMemberEmail] = useState("")
  const [formMemberPassword, setFormMemberPassword] = useState("")
  const [formMemberRole, setFormMemberRole] = useState<MemberRole>("admin")
  const [showPassword, setShowPassword] = useState(false)

  // Permission matrix UX
  const [permissionSearch, setPermissionSearch] = useState("")
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [pendingSensitive, setPendingSensitive] = useState<
    { moduleKey: string; column: string; title: string; body: string } | null
  >(null)

  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true)
    const result = await getProfiles()
    if (result.success) setProfiles(result.profiles)
    setProfilesLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  function initPermissions(): Record<string, Record<string, boolean>> {
    const perms: Record<string, Record<string, boolean>> = {}
    for (const mod of PERMISSION_MODULES) {
      perms[mod.key] = {}
      for (const col of mod.columns) perms[mod.key][col] = false
    }
    return perms
  }

  function openCreate() {
    setEditingProfile(null)
    setFormName("")
    setFormDescription("")
    setFormColor("#2563EB")
    setFormPermissions(initPermissions())
    setFormMemberName("")
    setFormMemberEmail("")
    setFormMemberPassword("")
    setFormMemberRole("admin")
    setShowPassword(false)
    setError(null)
    setSubmitting(false)
    setDrawerOpen(true)
  }

  function openEdit(p: AccessProfile) {
    setEditingProfile(p)
    setFormName(p.name)
    setFormDescription(p.description ?? "")
    setFormColor(p.color)
    const base = initPermissions()
    const perms = p.permissions as unknown as Record<string, Record<string, boolean>>
    const merged: Record<string, Record<string, boolean>> = {}
    for (const mod of PERMISSION_MODULES) {
      merged[mod.key] = { ...base[mod.key], ...(perms[mod.key] ?? {}) }
    }
    setFormPermissions(merged)
    setError(null)
    setSubmitting(false)
    setDrawerOpen(true)
  }

  function setPermission(moduleKey: string, column: string, value: boolean) {
    setFormPermissions((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [column]: value },
    }))
  }

  function togglePermission(moduleKey: string, column: string) {
    const current = formPermissions[moduleKey]?.[column] ?? false
    const next = !current
    const key = `${moduleKey}.${column}`
    if (next && SENSITIVE_PERMISSIONS[key]) {
      const warn = SENSITIVE_PERMISSIONS[key]
      setPendingSensitive({ moduleKey, column, title: warn.title, body: warn.body })
      return
    }
    setPermission(moduleKey, column, next)
  }

  function confirmPendingSensitive() {
    if (!pendingSensitive) return
    setPermission(pendingSensitive.moduleKey, pendingSensitive.column, true)
    setPendingSensitive(null)
  }

  function toggleRowAll(moduleKey: string) {
    const mod = PERMISSION_MODULES.find((m) => m.key === moduleKey)
    if (!mod) return
    const allOn = mod.columns.every((c) => formPermissions[moduleKey]?.[c])
    setFormPermissions((prev) => {
      const next = { ...prev[moduleKey] }
      for (const c of mod.columns) next[c] = !allOn
      return { ...prev, [moduleKey]: next }
    })
  }

  function toggleGroupAll(groupKey: string, turnOn: boolean) {
    setFormPermissions((prev) => {
      const next = { ...prev }
      for (const mod of PERMISSION_MODULES.filter((m) => m.group === groupKey)) {
        next[mod.key] = { ...next[mod.key] }
        for (const c of mod.columns) {
          if (turnOn && SENSITIVE_PERMISSIONS[`${mod.key}.${c}`]) continue
          next[mod.key][c] = turnOn
        }
      }
      return next
    })
  }

  function applyPreset(mode: "full" | "read" | "none") {
    const perms = initPermissions()
    for (const mod of PERMISSION_MODULES) {
      for (const col of mod.columns) {
        if (mode === "full") perms[mod.key][col] = true
        else if (mode === "read") perms[mod.key][col] = col === "view"
        else perms[mod.key][col] = false
      }
    }
    setFormPermissions(perms)
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      setError("Profile name is required.")
      return
    }
    if (!editingProfile) {
      if (!formMemberName.trim()) {
        setError("Member name is required.")
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formMemberEmail.trim())) {
        setError("A valid email is required.")
        return
      }
      if (formMemberPassword.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }
    }

    setSubmitting(true)
    setError(null)

    const profileData = {
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      permissions: formPermissions as Record<string, Record<string, boolean>>,
    }

    const TIMEOUT_MS = 30_000
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Request timed out after 30s — check Vercel Function logs for [createProfile] breadcrumbs.")),
        TIMEOUT_MS,
      ),
    )

    try {
      const action = editingProfile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? updateProfile(editingProfile.id, profileData as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : createProfile({
            ...(profileData as any),
            member: {
              name: formMemberName.trim(),
              email: formMemberEmail.trim(),
              password: formMemberPassword,
              role: formMemberRole,
            },
          })

      const result = (await Promise.race([action, timeoutPromise])) as
        | Awaited<ReturnType<typeof updateProfile>>
        | Awaited<ReturnType<typeof createProfile>>

      if (result.success) {
        setDrawerOpen(false)
        await fetchProfiles()
      } else {
        setError(result.error ?? "Operation failed")
      }
    } catch (err) {
      setError((err as Error).message ?? "Unexpected error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this profile?")) return
    const result = await deleteProfile(id)
    if (result.success) await fetchProfiles()
    else setError(result.error ?? "Failed to delete")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#333] mb-1">Access profiles</h3>
          <p className="text-sm text-[#888]">
            <span className="font-medium text-[#555]">{profiles.length}/20</span>{" "}
            profiles created. Fine-grained per-module permissions.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={profiles.length >= 20}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
            profiles.length >= 20
              ? "bg-[#e0e0e0] text-[#999] cursor-not-allowed"
              : "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
          }`}
        >
          <Plus size={16} /> Create profile
        </button>
      </div>

      {error && !drawerOpen && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {profilesLoading ? (
        <div className="flex items-center justify-center py-20 text-[#aaa] gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading profiles...
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e0e0e0] py-20 text-center">
          <Shield size={32} className="mx-auto mb-3 text-[#ccc]" />
          <p className="text-[#999] text-sm">No profiles found. Create your first profile.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-[#e0e0e0] px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#333] text-sm">{p.name}</span>
                    {p.is_system && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#f0f0f0] text-[#888] rounded">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#999] truncate">{p.description ?? "No description"}</p>
                  {p.members && p.members.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.members.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#f4f6fb] text-[#556] border border-[#e4e7ee]"
                          title={`${m.email} · ${m.role}`}
                        >
                          <span className="font-medium text-[#334]">{m.name ?? m.email.split("@")[0]}</span>
                          <span className="text-[#8b94a7]">·</span>
                          <span className="text-[#6b7280]">{m.email}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 ml-4">
                <span className="text-xs text-[#999] hidden sm:inline">
                  {p.member_count ?? 0} {(p.member_count ?? 0) === 1 ? "member" : "members"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={p.is_system}
                    className={`p-2 rounded-md transition-colors ${
                      p.is_system
                        ? "text-[#ddd] cursor-not-allowed"
                        : "text-[#aaa] hover:text-red-400 hover:bg-red-50"
                    }`}
                    title={p.is_system ? "Cannot delete system profiles" : "Delete"}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-[#1a1a2e]/60 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">
                {editingProfile ? "Edit profile" : "Create profile"}
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
                    Profile name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Event Coordinator"
                    className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief description of this profile's purpose..."
                    className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {!editingProfile && (
                <div className="rounded-xl border border-[#e0e0e0] bg-[#fafbfc] p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-[#333]">Assign this profile to a team member</p>
                    <p className="text-xs text-[#888] mt-0.5">
                      We&apos;ll create a login for them with the permissions you pick below. Share the email + password with them privately.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
                        Member name *
                      </label>
                      <input
                        type="text"
                        value={formMemberName}
                        onChange={(e) => setFormMemberName(e.target.value)}
                        placeholder="e.g. Priya Kapoor"
                        className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
                        Role
                      </label>
                      <select
                        value={formMemberRole}
                        onChange={(e) => setFormMemberRole(e.target.value as MemberRole)}
                        className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="check_in_staff">Check-in Staff</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
                      Email *
                    </label>
                    <input
                      type="email"
                      autoComplete="off"
                      value={formMemberEmail}
                      onChange={(e) => setFormMemberEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
                      Password * <span className="text-[#bbb] normal-case tracking-normal">(min 8 characters)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={formMemberPassword}
                        onChange={(e) => setFormMemberPassword(e.target.value)}
                        placeholder="Temporary password to share privately"
                        className="w-full px-3 py-2.5 pr-20 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#999] mt-1">
                      The member can change this after first login.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2 font-medium">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${
                        formColor === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2 font-medium">Quick presets</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => applyPreset("full")} className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                    Full access
                  </button>
                  <button type="button" onClick={() => applyPreset("read")} className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                    Read only
                  </button>
                  <button type="button" onClick={() => applyPreset("none")} className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
                    No access
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 gap-3">
                  <label className="text-[11px] text-[#777] uppercase tracking-wider font-medium">Permissions</label>
                  <input
                    type="text"
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder="Search (e.g. revenue, refund)…"
                    className="flex-1 max-w-[260px] px-3 py-1.5 text-[12px] bg-white border border-[#e0e0e0] rounded-md text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-3">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupModules = PERMISSION_MODULES.filter((m) => m.group === group.key)
                    const filtered = permissionSearch.trim()
                      ? groupModules.filter((m) =>
                          (m.label + " " + (m.description ?? "") + " " + m.columns.join(" "))
                            .toLowerCase()
                            .includes(permissionSearch.trim().toLowerCase())
                        )
                      : groupModules
                    if (filtered.length === 0) return null

                    const collapsed = collapsedGroups[group.key] ?? false
                    const grantedInGroup = groupModules.reduce(
                      (n, m) => n + m.columns.filter((c) => formPermissions[m.key]?.[c]).length,
                      0
                    )
                    const totalInGroup = groupModules.reduce((n, m) => n + m.columns.length, 0)

                    return (
                      <div key={group.key} className="rounded-xl border border-[#e0e0e0] bg-white overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-[#fafbfc] border-b border-[#eee]">
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedGroups((prev) => ({ ...prev, [group.key]: !collapsed }))
                            }
                            className="flex items-center gap-2 text-left flex-1 min-w-0"
                          >
                            <ChevronRight
                              size={15}
                              className={`text-[#888] shrink-0 transition-transform ${collapsed ? "" : "rotate-90"}`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[#333]">{group.label}</span>
                                <span className="text-[11px] text-[#999]">
                                  {grantedInGroup}/{totalInGroup} granted
                                </span>
                                {group.key === "finance" && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-amber-50 text-amber-700 border border-amber-200">
                                    Sensitive
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#888] mt-0.5 truncate">{group.caption}</p>
                            </div>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleGroupAll(group.key, true)}
                              className="px-2 py-1 text-[11px] font-medium rounded border border-[#e0e0e0] text-[#555] hover:bg-[#f4f6fb] transition-colors"
                              title="Allow all in this group (sensitive perms must still be toggled individually)"
                            >
                              Allow all
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleGroupAll(group.key, false)}
                              className="px-2 py-1 text-[11px] font-medium rounded border border-[#e0e0e0] text-[#555] hover:bg-[#f4f6fb] transition-colors"
                            >
                              Deny all
                            </button>
                          </div>
                        </div>

                        {!collapsed && (
                          <div className="divide-y divide-[#f0f0f0]">
                            {filtered.map((mod) => {
                              const allOn = mod.columns.every((c) => formPermissions[mod.key]?.[c])
                              const anyOn = mod.columns.some((c) => formPermissions[mod.key]?.[c])
                              return (
                                <div
                                  key={mod.key}
                                  className="px-4 py-3 flex items-start gap-4 hover:bg-[#fcfdff] transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-[#333]">{mod.label}</span>
                                      {mod.key === "revenue" && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-amber-50 text-amber-700 border border-amber-200">
                                          Shows money
                                        </span>
                                      )}
                                    </div>
                                    {mod.description && (
                                      <p className="text-[11px] text-[#888] mt-0.5">{mod.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                                    {mod.columns.map((col) => {
                                      const on = formPermissions[mod.key]?.[col] ?? false
                                      const sensitive = !!SENSITIVE_PERMISSIONS[`${mod.key}.${col}`]
                                      return (
                                        <button
                                          key={col}
                                          type="button"
                                          onClick={() => togglePermission(mod.key, col)}
                                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border transition-colors ${
                                            on
                                              ? sensitive
                                                ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                                                : "bg-[#1a73e8] text-white border-[#1a73e8] hover:bg-[#1557b0]"
                                              : "bg-white text-[#777] border-[#e0e0e0] hover:border-[#999]"
                                          }`}
                                          title={sensitive ? "Sensitive — shows a warning before granting" : undefined}
                                        >
                                          {col}
                                        </button>
                                      )
                                    })}
                                    <button
                                      type="button"
                                      onClick={() => toggleRowAll(mod.key)}
                                      className="px-2 py-1 text-[10px] font-semibold rounded border border-dashed border-[#d0d0d0] text-[#888] hover:text-[#444] hover:border-[#999] transition-colors"
                                      title={allOn ? "Clear all in this row" : "Grant all in this row"}
                                    >
                                      {allOn ? "Clear" : anyOn ? "All" : "All"}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <p className="text-[11px] text-[#aaa] mt-2">
                  Tip: orange buttons = sensitive (money or PII). Tapping one pops a warning before it turns on.
                </p>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#1a73e8] text-white text-sm font-semibold hover:bg-[#1557b0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  ) : editingProfile ? (
                    "Save changes"
                  ) : (
                    "Create profile"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sensitive permission warning */}
      {pendingSensitive && (
        <>
          <div
            className="fixed inset-0 bg-[#1a1a2e]/70 z-[60]"
            onClick={() => setPendingSensitive(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[92vw] max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">!</div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">{pendingSensitive.title}</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 uppercase tracking-wider font-semibold">
                    Sensitive permission
                  </p>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-[#444] leading-relaxed">{pendingSensitive.body}</p>
                <p className="text-[12px] text-[#888] mt-3">
                  You (super admin) will remain able to revoke this later from the same screen.
                </p>
              </div>
              <div className="px-5 py-3 bg-[#fafbfc] border-t border-[#eee] flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setPendingSensitive(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[#e0e0e0] text-[#555] hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPendingSensitive}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  Yes, grant access
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
