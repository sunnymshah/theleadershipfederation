"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  Settings as SettingsIcon,
  UserPlus,
  CreditCard,
  Receipt,
  Bell,
  Code,
  ClipboardList,
  X,
  Loader2,
  Copy,
  Check,
  Eye,
  Clock,
  ChevronRight,
} from "lucide-react"

/* ═══════════════════════════════════════════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "tlf_admin_settings"

const TABS = [
  {
    section: "SETUP",
    items: [
      { key: "general", label: "General", icon: SettingsIcon },
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

const VALID_TABS = new Set([
  "general", "registration", "payments",
  "tax", "notifications", "widget", "audit",
])

export default function AdminSettingsPage() {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams?.get("tab") ?? null
  const initialTab = tabFromUrl && VALID_TABS.has(tabFromUrl) ? tabFromUrl : "general"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)


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


  /* ═══════════════════════════════════════════════════════════════════════
   *  RENDER — TAB CONTENT
   * ═══════════════════════════════════════════════════════════════════════ */

  function renderTabContent() {
    switch (activeTab) {
      case "general":
        return renderGeneral()
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
