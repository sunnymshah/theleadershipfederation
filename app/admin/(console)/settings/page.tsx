"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Settings as SettingsIcon,
  Shield,
  UserPlus,
  CreditCard,
  Receipt,
  Bell,
  Code,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Copy,
  Check,
  ChevronRight,
  Eye,
  Clock,
} from "lucide-react"
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  type AccessProfile,
} from "@/app/actions/profileActions"

/* ═══════════════════════════════════════════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "tlf_admin_settings"

const TABS = [
  {
    section: "SETUP",
    items: [
      { key: "general", label: "General", icon: SettingsIcon },
      { key: "profiles", label: "Profiles & Access", icon: Shield },
      { key: "registration", label: "Registration", icon: UserPlus },
      { key: "payments", label: "Payments", icon: CreditCard },
      { key: "tax", label: "Tax", icon: Receipt },
      { key: "notifications", label: "Notifications", icon: Bell },
      { key: "widget", label: "Embeddable Widget", icon: Code },
    ],
  },
  {
    section: "OVERVIEW",
    items: [{ key: "audit", label: "Audit Log", icon: ClipboardList }],
  },
]

const PRESET_COLORS = [
  "#DC2626", "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#84CC16", "#22C55E", "#059669", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#2563EB", "#4F46E5", "#7C3AED", "#8B5CF6",
  "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#6B7280",
]

/** Modules and their permission columns */
const PERMISSION_MODULES: {
  key: string
  label: string
  description?: string
  columns: string[]
  /** Category grouping in the UI. */
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

const PERMISSION_GROUPS: { key: "content" | "people" | "operations" | "finance" | "admin"; label: string; caption: string }[] = [
  { key: "content",    label: "Content",              caption: "Public-facing event content on the website." },
  { key: "operations", label: "Event Operations",     caption: "Day-of tools — ticketing, check-in, certificates." },
  { key: "people",     label: "People & Analytics",   caption: "Attendee data (contains PII) and engagement metrics." },
  { key: "finance",    label: "Finance",              caption: "Money: transactions, invoices, revenue, refunds." },
  { key: "admin",      label: "Admin",                caption: "Team management and organization-wide settings." },
]

/**
 * Permissions that reveal sensitive information or enable destructive /
 * financial actions. Toggling ANY of these ON pops a confirmation warning
 * so the super admin has to acknowledge what they're granting.
 */
const SENSITIVE_PERMISSIONS: Record<
  string, // `${moduleKey}.${column}`
  { title: string; body: string }
> = {
  "revenue.view": {
    title: "Grant access to revenue totals?",
    body:
      "This member will be able to see exactly how much money the organization has earned — gross revenue, net revenue, refunds, fees, and payout amounts per event. This is the most sensitive financial figure on the platform. Only turn this on for people who genuinely need to see totals.",
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
      "This member will be able to download a CSV of attendees including names, emails, and phone numbers. That's personal data protected under privacy law — once exported, it lives on their device.",
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

/** All unique permission column names (union of all modules) */
const ALL_COLUMNS = Array.from(
  new Set(PERMISSION_MODULES.flatMap((m) => m.columns))
)

/* ═══════════════════════════════════════════════════════════════════════════
 *  LOCAL STORAGE SETTINGS TYPE
 * ═══════════════════════════════════════════════════════════════════════════ */

interface LocalSettings {
  general: {
    orgName: string
    timezone: string
    currency: string
    dateFormat: string
  }
  registration: {
    autoConfirm: boolean
    sendConfirmation: boolean
    allowCancellations: boolean
    cancellationDeadline: string
    fields: {
      phone: boolean
      company: boolean
      designation: boolean
      dietaryPreferences: boolean
    }
  }
  tax: {
    enableGst: boolean
    gstin: string
    hsnSac: string
    cgstRate: number
    sgstRate: number
    igstRate: number
    taxCalculation: "inclusive" | "exclusive"
  }
  notifications: {
    onRegistration: boolean
    onPayment: boolean
    onCheckIn: boolean
    dailyDigest: boolean
    recipients: string
  }
}

const DEFAULT_SETTINGS: LocalSettings = {
  general: {
    orgName: "The Leadership Federation",
    timezone: "IST",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
  },
  registration: {
    autoConfirm: true,
    sendConfirmation: true,
    allowCancellations: true,
    cancellationDeadline: "48h",
    fields: {
      phone: false,
      company: false,
      designation: false,
      dietaryPreferences: false,
    },
  },
  tax: {
    enableGst: true,
    gstin: "",
    hsnSac: "998554",
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    taxCalculation: "exclusive",
  },
  notifications: {
    onRegistration: true,
    onPayment: true,
    onCheckIn: false,
    dailyDigest: false,
    recipients: "",
  },
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  TOGGLE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200
        ${checked ? "bg-blue-600" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200
          ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}
        `}
      />
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  WIDGET TAB — extracted as proper component so it can use hooks
 * ═══════════════════════════════════════════════════════════════════════════ */

function WidgetTab() {
  const [eventSlug, setEventSlug] = useState("your-event-slug")
  const [widgetCopied, setWidgetCopied] = useState(false)

  const embedCode = `<iframe
  src="https://theleadershipfederation.com/events/${eventSlug}?embed=true"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>`

  function copyWidget() {
    navigator.clipboard.writeText(embedCode)
    setWidgetCopied(true)
    setTimeout(() => setWidgetCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#333] mb-1">
          Embeddable Widget
        </h3>
        <p className="text-sm text-[#888]">
          Embed a registration widget on your external website
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 space-y-5">
        {/* Event slug */}
        <div>
          <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
            Event Slug
          </label>
          <input
            type="text"
            value={eventSlug}
            onChange={(e) => setEventSlug(e.target.value)}
            placeholder="e.g. leadership-summit-2026"
            className="w-full max-w-md px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Code snippet */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] text-[#777] uppercase tracking-wider font-medium">
              Embed Code
            </label>
            <button
              onClick={copyWidget}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-[#e0e0e0] text-[#555] hover:bg-[#f0f0f0] transition-colors"
            >
              {widgetCopied ? (
                <>
                  <Check size={12} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy Code
                </>
              )}
            </button>
          </div>
          <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-xs font-mono p-4 rounded-xl overflow-x-auto leading-relaxed">
            {embedCode}
          </pre>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2 font-medium">
            Preview
          </label>
          <div className="border border-[#e0e0e0] rounded-xl overflow-hidden bg-[#f8f9fa] p-4">
            <div className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm p-8 text-center">
              <Eye size={32} className="mx-auto mb-3 text-[#ccc]" />
              <p className="text-sm text-[#999]">
                Widget preview for{" "}
                <span className="font-medium text-[#555]">{eventSlug}</span>
              </p>
              <p className="text-xs text-[#bbb] mt-1">
                The embedded widget will display your event registration form
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN SETTINGS PAGE
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profiles state
  const [profiles, setProfiles] = useState<AccessProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Profile form state
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formColor, setFormColor] = useState("#2563EB")
  const [formPermissions, setFormPermissions] = useState<
    Record<string, Record<string, boolean>>
  >({})

  // New-member credentials (only shown on Create, not Edit)
  const [formMemberName, setFormMemberName] = useState("")
  const [formMemberEmail, setFormMemberEmail] = useState("")
  const [formMemberPassword, setFormMemberPassword] = useState("")
  const [formMemberRole, setFormMemberRole] = useState<"super_admin" | "admin" | "member">("admin")
  const [showPassword, setShowPassword] = useState(false)

  // Permission matrix UX state
  const [permissionSearch, setPermissionSearch] = useState("")
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [pendingSensitive, setPendingSensitive] = useState<
    { moduleKey: string; column: string; title: string; body: string } | null
  >(null)

  /* ── Load settings from localStorage ──────────────────────────────── */

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<LocalSettings>
        setSettings((prev) => ({
          general: { ...prev.general, ...parsed.general },
          registration: {
            ...prev.registration,
            ...parsed.registration,
            fields: {
              ...prev.registration.fields,
              ...parsed.registration?.fields,
            },
          },
          tax: { ...prev.tax, ...parsed.tax },
          notifications: { ...prev.notifications, ...parsed.notifications },
        }))
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  /* ── Load profiles ────────────────────────────────────────────────── */

  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true)
    const result = await getProfiles()
    if (result.success) setProfiles(result.profiles)
    setProfilesLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  /* ── Save settings to localStorage ────────────────────────────────── */

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function updateSetting<
    S extends keyof LocalSettings,
    K extends keyof LocalSettings[S],
  >(section: S, key: K, value: LocalSettings[S][K]) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
    setDirty(true)
  }

  /* ── Profile form helpers ─────────────────────────────────────────── */

  function initPermissions(): Record<string, Record<string, boolean>> {
    const perms: Record<string, Record<string, boolean>> = {}
    for (const mod of PERMISSION_MODULES) {
      perms[mod.key] = {}
      for (const col of mod.columns) {
        perms[mod.key][col] = false
      }
    }
    return perms
  }

  function openCreateProfile() {
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
    setProfileError(null)
    setProfileDrawerOpen(true)
  }

  function openEditProfile(p: AccessProfile) {
    setEditingProfile(p)
    setFormName(p.name)
    setFormDescription(p.description ?? "")
    setFormColor(p.color)
    // Merge existing permissions with defaults to ensure all keys present
    const base = initPermissions()
    const perms = p.permissions as unknown as Record<string, Record<string, boolean>>
    const merged: Record<string, Record<string, boolean>> = {}
    for (const mod of PERMISSION_MODULES) {
      merged[mod.key] = { ...base[mod.key], ...(perms[mod.key] ?? {}) }
    }
    setFormPermissions(merged)
    setProfileError(null)
    setProfileDrawerOpen(true)
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

    // Intercept sensitive GRANTS (not revokes) with a confirmation modal
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
          // When turning ON, still force sensitive perms to stay OFF until
          // the super admin explicitly toggles them (shows warning).
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

  async function handleProfileSubmit() {
    if (!formName.trim()) {
      setProfileError("Profile name is required.")
      return
    }

    // When creating a profile, also validate the linked-member credentials.
    if (!editingProfile) {
      if (!formMemberName.trim()) {
        setProfileError("Member name is required.")
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formMemberEmail.trim())) {
        setProfileError("A valid email is required.")
        return
      }
      if (formMemberPassword.length < 8) {
        setProfileError("Password must be at least 8 characters.")
        return
      }
    }

    setProfileSubmitting(true)
    setProfileError(null)

    const profileData = {
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      permissions: formPermissions as Record<string, Record<string, boolean>>,
    }

    // Hard client-side timeout so the button physically cannot stay in
    // "Saving..." forever, even if the server action never returns.
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
        setProfileDrawerOpen(false)
        await fetchProfiles()
      } else {
        setProfileError(result.error ?? "Operation failed")
      }
    } catch (err) {
      setProfileError((err as Error).message ?? "Unexpected error")
    } finally {
      // GUARANTEED to run — button can never stay stuck in "Saving..."
      setProfileSubmitting(false)
    }
  }

  async function handleDeleteProfile(id: string) {
    if (!confirm("Are you sure you want to delete this profile?")) return
    const result = await deleteProfile(id)
    if (result.success) {
      await fetchProfiles()
    } else {
      setProfileError(result.error ?? "Failed to delete")
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
   *  RENDER — TAB CONTENT
   * ═══════════════════════════════════════════════════════════════════════ */

  function renderTabContent() {
    switch (activeTab) {
      case "general":
        return renderGeneral()
      case "profiles":
        return renderProfiles()
      case "registration":
        return renderRegistration()
      case "payments":
        return renderPayments()
      case "tax":
        return renderTax()
      case "notifications":
        return renderNotifications()
      case "widget":
        return <WidgetTab />
      case "audit":
        return renderAudit()
      default:
        return null
    }
  }

  /* ── Save Button (reusable) ─────────────────────────────────────────── */

  function SaveButton() {
    return (
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={!dirty}
          className={`
            px-6 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${
              dirty
                ? "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                : "bg-[#e0e0e0] text-[#999] cursor-not-allowed"
            }
          `}
        >
          {saved ? (
            <span className="flex items-center gap-1.5">
              <Check size={14} /> Saved
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    )
  }

  /* ── General ────────────────────────────────────────────────────────── */

  function renderGeneral() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#333] mb-1">General Settings</h3>
          <p className="text-sm text-[#888]">Organization defaults and display preferences</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 space-y-5">
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">Organization Name</label>
            <input
              type="text"
              value={settings.general.orgName}
              onChange={(e) => updateSetting("general", "orgName", e.target.value)}
              className="w-full max-w-md px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">Default Timezone</label>
            <select
              value={settings.general.timezone}
              onChange={(e) => updateSetting("general", "timezone", e.target.value)}
              className="w-full max-w-md px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="IST">IST (India Standard Time)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="EST">EST (Eastern Standard Time)</option>
              <option value="PST">PST (Pacific Standard Time)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">Default Currency</label>
            <select
              value={settings.general.currency}
              onChange={(e) => updateSetting("general", "currency", e.target.value)}
              className="w-full max-w-md px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="INR">INR (Indian Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">Date Format</label>
            <select
              value={settings.general.dateFormat}
              onChange={(e) => updateSetting("general", "dateFormat", e.target.value)}
              className="w-full max-w-md px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <SaveButton />
      </div>
    )
  }

  /* ── Profiles & Access ──────────────────────────────────────────────── */

  function renderProfiles() {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#333] mb-1">Profiles & Access Control</h3>
            <p className="text-sm text-[#888]">
              <span className="font-medium text-[#555]">{profiles.length}/20</span>{" "}
              profiles created. Define granular permissions for each role.
            </p>
          </div>
          <button
            onClick={openCreateProfile}
            disabled={profiles.length >= 20}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0
              ${profiles.length >= 20
                ? "bg-[#e0e0e0] text-[#999] cursor-not-allowed"
                : "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
              }
            `}
          >
            <Plus size={16} /> Create Profile
          </button>
        </div>

        {profileError && !profileDrawerOpen && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            <span>{profileError}</span>
            <button onClick={() => setProfileError(null)} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Profile list */}
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
                      onClick={() => openEditProfile(p)}
                      className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(p.id)}
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

        {/* ── Profile Drawer ─────────────────────────────────────── */}
        {profileDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-[#1a1a2e]/60 z-40" onClick={() => setProfileDrawerOpen(false)} />
            <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
              {/* Drawer header */}
              <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-[#333]">
                  {editingProfile ? "Edit Profile" : "Create Profile"}
                </h3>
                <button
                  onClick={() => setProfileDrawerOpen(false)}
                  className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Name & Description */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
                      Profile Name *
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

                {/* Member credentials — only on Create */}
                {!editingProfile && (
                  <div className="rounded-xl border border-[#e0e0e0] bg-[#fafbfc] p-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-[#333]">Assign this profile to a team member</p>
                      <p className="text-xs text-[#888] mt-0.5">
                        We&apos;ll create a login for them with the permissions you pick below. Share the email + password with them privately — only the super admin can view this list.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">
                          Member Name *
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
                          onChange={(e) => setFormMemberRole(e.target.value as "super_admin" | "admin" | "member")}
                          className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="super_admin">Super Admin</option>
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
                        The member can change this after first login under Settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Color picker */}
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2 font-medium">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${
                          formColor === c
                            ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick presets */}
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2 font-medium">Quick Presets</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => applyPreset("full")} className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                      Full Access
                    </button>
                    <button type="button" onClick={() => applyPreset("read")} className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                      Read Only
                    </button>
                    <button type="button" onClick={() => applyPreset("none")} className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
                      No Access
                    </button>
                  </div>
                </div>

                {/* Permissions */}
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
                        <div
                          key={group.key}
                          className="rounded-xl border border-[#e0e0e0] bg-white overflow-hidden"
                        >
                          {/* Group header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-[#fafbfc] border-b border-[#eee]">
                            <button
                              type="button"
                              onClick={() =>
                                setCollapsedGroups((prev) => ({ ...prev, [group.key]: !collapsed }))
                              }
                              className="flex items-center gap-2 text-left flex-1 min-w-0"
                            >
                              {collapsed ? (
                                <ChevronRight size={15} className="text-[#888] shrink-0" />
                              ) : (
                                <ChevronRight size={15} className="text-[#888] shrink-0 rotate-90 transition-transform" />
                              )}
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

                          {/* Group body */}
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
                                            title={
                                              sensitive
                                                ? "Sensitive — shows a warning before granting"
                                                : undefined
                                            }
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

                {/* Error */}
                {profileError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {profileError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setProfileDrawerOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileSubmit}
                    disabled={profileSubmitting}
                    className="flex-1 py-2.5 rounded-lg bg-[#1a73e8] text-white text-sm font-semibold hover:bg-[#1557b0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {profileSubmitting ? (
                      <><Loader2 size={14} className="animate-spin" /> Saving...</>
                    ) : editingProfile ? (
                      "Save Changes"
                    ) : (
                      "Create Profile"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Sensitive permission warning ────────────────────────── */}
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

  /* ── Registration ───────────────────────────────────────────────────── */

  function renderRegistration() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#333] mb-1">Registration Settings</h3>
          <p className="text-sm text-[#888]">Configure how attendee registrations are handled</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#333]">Auto-confirm registrations</p>
                <p className="text-xs text-[#999]">Automatically confirm registrations without manual review</p>
              </div>
              <Toggle checked={settings.registration.autoConfirm} onChange={(v) => updateSetting("registration", "autoConfirm", v)} />
            </div>

            <div className="border-t border-[#f0f0f0]" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#333]">Send confirmation email</p>
                <p className="text-xs text-[#999]">Send an email to attendees upon registration</p>
              </div>
              <Toggle checked={settings.registration.sendConfirmation} onChange={(v) => updateSetting("registration", "sendConfirmation", v)} />
            </div>

            <div className="border-t border-[#f0f0f0]" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#333]">Allow cancellations</p>
                <p className="text-xs text-[#999]">Allow attendees to cancel their registrations</p>
              </div>
              <Toggle checked={settings.registration.allowCancellations} onChange={(v) => updateSetting("registration", "allowCancellations", v)} />
            </div>
          </div>

          {settings.registration.allowCancellations && (
            <div>
              <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">Cancellation Deadline</label>
              <select
                value={settings.registration.cancellationDeadline}
                onChange={(e) => updateSetting("registration", "cancellationDeadline", e.target.value)}
                className="w-full max-w-md px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="24h">Up to 24 hours before</option>
                <option value="48h">Up to 48 hours before</option>
                <option value="7d">Up to 7 days before</option>
                <option value="none">No cancellations</option>
              </select>
            </div>
          )}

          {/* Registration form fields */}
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-3 font-medium">Registration Form Fields</label>
            <div className="space-y-3">
              {([
                { key: "phone", label: "Phone Number" },
                { key: "company", label: "Company / Organization" },
                { key: "designation", label: "Designation / Title" },
                { key: "dietaryPreferences", label: "Dietary Preferences" },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.registration.fields[key]}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        registration: {
                          ...prev.registration,
                          fields: { ...prev.registration.fields, [key]: e.target.checked },
                        },
                      }))
                      setDirty(true)
                    }}
                    className="w-4 h-4 rounded border-[#d0d0d0] text-[#1a73e8] focus:ring-blue-500"
                  />
                  <span className="text-sm text-[#444]">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <SaveButton />
      </div>
    )
  }

  /* ── Payments ───────────────────────────────────────────────────────── */

  function renderPayments() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#333] mb-1">Payment Settings</h3>
          <p className="text-sm text-[#888]">Payment gateway configuration and preferences</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 space-y-6">
          {/* Razorpay status */}
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-3 font-medium">Payment Gateway</label>
            <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-lg border border-[#e0e0e0]">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Rp</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#333]">Razorpay</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Not configured
                  </span>
                </div>
                <p className="text-xs text-[#999] mt-0.5">
                  Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables
                </p>
              </div>
            </div>
            <p className="text-xs text-[#aaa] mt-2">
              Configure in <span className="text-[#1a73e8]">Vercel Dashboard &rarr; Environment Variables</span>
            </p>
          </div>

          {/* Default currency */}
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">Default Currency</label>
            <div className="px-3 py-2.5 bg-[#f8f9fa] border border-[#e0e0e0] rounded-lg text-sm text-[#555] max-w-md">
              INR (Indian Rupee)
            </div>
          </div>

          {/* Payment modes */}
          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-3 font-medium">Accepted Payment Modes</label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {["UPI", "Cards", "Net Banking", "Wallets"].map((mode) => (
                <div key={mode} className="flex items-center gap-2 px-3 py-2 bg-[#f8f9fa] border border-[#e0e0e0] rounded-lg">
                  <div className="w-4 h-4 rounded border border-[#ccc] bg-white flex items-center justify-center">
                    <Check size={10} className="text-green-600" />
                  </div>
                  <span className="text-sm text-[#555]">{mode}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#aaa] mt-2">Payment modes are managed through Razorpay Dashboard</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Tax ─────────────────────────────────────────────────────────────── */

  function renderTax() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#333] mb-1">Tax Settings</h3>
          <p className="text-sm text-[#888]">Configure GST and tax calculation preferences</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#333]">Enable GST</p>
              <p className="text-xs text-[#999]">Apply GST to all ticket sales</p>
            </div>
            <Toggle checked={settings.tax.enableGst} onChange={(v) => updateSetting("tax", "enableGst", v)} />
          </div>

          {settings.tax.enableGst && (
            <>
              <div className="border-t border-[#f0f0f0]" />

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">GSTIN Number</label>
                <input
                  type="text"
                  value={settings.tax.gstin}
                  onChange={(e) => updateSetting("tax", "gstin", e.target.value)}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="w-full max-w-md px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">HSN/SAC Code</label>
                <input
                  type="text"
                  value={settings.tax.hsnSac}
                  onChange={(e) => updateSetting("tax", "hsnSac", e.target.value)}
                  className="w-full max-w-md px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">CGST Rate (%)</label>
                  <input
                    type="number"
                    value={settings.tax.cgstRate}
                    onChange={(e) => updateSetting("tax", "cgstRate", Number(e.target.value))}
                    min={0} max={50}
                    className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">SGST Rate (%)</label>
                  <input
                    type="number"
                    value={settings.tax.sgstRate}
                    onChange={(e) => updateSetting("tax", "sgstRate", Number(e.target.value))}
                    min={0} max={50}
                    className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">IGST Rate (%)</label>
                  <input
                    type="number"
                    value={settings.tax.igstRate}
                    onChange={(e) => updateSetting("tax", "igstRate", Number(e.target.value))}
                    min={0} max={50}
                    className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2 font-medium">Tax Calculation</label>
                <div className="flex gap-4">
                  {(["inclusive", "exclusive"] as const).map((mode) => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taxCalculation"
                        checked={settings.tax.taxCalculation === mode}
                        onChange={() => updateSetting("tax", "taxCalculation", mode)}
                        className="w-4 h-4 text-[#1a73e8] focus:ring-blue-500 border-[#d0d0d0]"
                      />
                      <span className="text-sm text-[#444] capitalize">{mode}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#aaa] mt-1">
                  {settings.tax.taxCalculation === "inclusive"
                    ? "Tax is included in the ticket price"
                    : "Tax is added on top of the ticket price"}
                </p>
              </div>
            </>
          )}
        </div>

        <SaveButton />
      </div>
    )
  }

  /* ── Notifications ──────────────────────────────────────────────────── */

  function renderNotifications() {
    const notifItems = [
      { key: "onRegistration" as const, label: "New registration notification", desc: "Get notified when someone registers for an event" },
      { key: "onPayment" as const, label: "Payment received notification", desc: "Get notified when a payment is received" },
      { key: "onCheckIn" as const, label: "Check-in notification", desc: "Get notified when an attendee checks in" },
      { key: "dailyDigest" as const, label: "Daily summary email", desc: "Receive a daily summary of all event activity" },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#333] mb-1">Notification Settings</h3>
          <p className="text-sm text-[#888]">Configure when and how you receive admin notifications</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 space-y-5">
          <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1 font-medium">Email Notifications</label>

          <div className="space-y-4">
            {notifItems.map(({ key, label, desc }, idx) => (
              <div key={key}>
                {idx > 0 && <div className="border-t border-[#f0f0f0] mb-4" />}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#333]">{label}</p>
                    <p className="text-xs text-[#999]">{desc}</p>
                  </div>
                  <Toggle checked={settings.notifications[key]} onChange={(v) => updateSetting("notifications", key, v)} />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#f0f0f0]" />

          <div>
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5 font-medium">Notification Recipients</label>
            <input
              type="text"
              value={settings.notifications.recipients}
              onChange={(e) => updateSetting("notifications", "recipients", e.target.value)}
              placeholder="admin@example.com, manager@example.com"
              className="w-full max-w-lg px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-[#aaa] mt-1">Comma-separated email addresses</p>
          </div>
        </div>

        <SaveButton />
      </div>
    )
  }

  /* ── Audit Log ──────────────────────────────────────────────────────── */

  function renderAudit() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#333] mb-1">Audit Log</h3>
          <p className="text-sm text-[#888]">Track all admin actions and configuration changes</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e0e0] py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-[#bbb]" />
          </div>
          <h4 className="text-lg font-semibold text-[#444] mb-2">Coming Soon</h4>
          <p className="text-sm text-[#999] max-w-sm mx-auto">
            Audit logging will track all admin actions — who changed what, when.
          </p>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════════════
   *  MAIN RENDER
   * ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="p-2 sm:p-8">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#333] mb-1">Settings</h2>
        <p className="text-sm text-[#888]">Manage your organization, access controls, and preferences</p>
      </div>

      {/* Layout: sidebar + content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left sidebar (tabs) ──────────────────────────────────── */}
        <div className="w-full lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden lg:sticky lg:top-6">
            {TABS.map((section) => (
              <div key={section.section}>
                <div className="px-4 pt-4 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8e9298]">
                    {section.section}
                  </span>
                </div>

                {section.items.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left
                        ${isActive
                          ? "bg-[#e8f0fe] text-[#1a73e8] font-medium"
                          : "text-[#444] hover:bg-[#f0f0f0]"
                        }
                      `}
                    >
                      <Icon size={16} className={isActive ? "text-[#1a73e8]" : "text-[#999]"} />
                      <span className="flex-1">{tab.label}</span>
                      <ChevronRight size={14} className={isActive ? "text-[#1a73e8] opacity-60" : "text-[#ccc]"} />
                    </button>
                  )
                })}
              </div>
            ))}
            <div className="h-3" />
          </div>
        </div>

        {/* ── Right content area ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">{renderTabContent()}</div>
      </div>
    </div>
  )
}
