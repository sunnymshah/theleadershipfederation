"use client"

/**
 * ─── INTEGRATIONS PAGE — Webhooks, API Keys & Refunds ─────────────────
 *
 * Admin page with 3 tabs for managing webhooks, API keys, and refund
 * requests. Clean Zoho-like admin UI with light theme.
 */

import { useState, useEffect, useCallback } from "react"
import {
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhooks,
  getWebhookLogs,
  generateApiKey,
  revokeApiKey,
  getApiKeys,
  requestRefund,
  processRefund,
  denyRefund,
  getRefundRequests,
} from "@/app/actions/integrationActions"
import {
  Webhook,
  Key,
  CreditCard,
  Plus,
  Trash2,
  Play,
  Eye,
  Copy,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Shield,
  Loader2,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════════════════
 *  TYPES
 * ═══════════════════════════════════════════════════════════════════════════ */

interface WebhookRecord {
  id: string
  name: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  failure_count: number
  created_at: string
}

interface WebhookLog {
  id: string
  webhook_id: string
  status_code: number
  timestamp: string
  response_preview: string
  event: string
  success: boolean
}

interface ApiKeyRecord {
  id: string
  name: string
  key_prefix: string
  permissions: string[]
  created_at: string
  last_used_at: string | null
  usage_count: number
  is_active: boolean
  rate_limit: number | null
  expires_at: string | null
  created_by: string | null
}

interface RefundRequest {
  id: string
  attendee_name: string
  event_title: string
  amount_paid: number
  refund_reason: string
  status: "requested" | "processing" | "refunded" | "denied"
  requested_at: string
  refund_id: string | null
  refund_amount: number | null
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const WEBHOOK_EVENTS = [
  "attendee.registered",
  "attendee.checked_in",
  "payment.confirmed",
  "event.updated",
  "feedback.submitted",
  "sponsor.lead_captured",
] as const

const TABS = [
  { key: "webhooks" as const, label: "Webhooks", icon: Webhook },
  { key: "apikeys" as const, label: "API Keys", icon: Key },
  { key: "refunds" as const, label: "Refunds", icon: CreditCard },
]

type TabKey = (typeof TABS)[number]["key"]

/* ═══════════════════════════════════════════════════════════════════════════
 *  HELPER COMPONENTS
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
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200",
        checked ? "bg-blue-600" : "bg-gray-300",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        active ? "bg-emerald-500" : "bg-red-400"
      )}
    />
  )
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: "green" | "red" | "yellow" | "blue" | "gray"
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border",
        colors[variant]
      )}
    >
      {children}
    </span>
  )
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function truncateUrl(url: string, maxLen = 40) {
  if (url.length <= maxLen) return url
  return url.slice(0, maxLen) + "..."
}

function generateSecret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = "whsec_"
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MODAL BACKDROP
 * ═══════════════════════════════════════════════════════════════════════════ */

function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#1a1a2e]/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-white rounded-xl shadow-xl border border-gray-200 max-h-[85vh] overflow-y-auto",
          wide ? "w-full max-w-2xl" : "w-full max-w-lg"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-[#1a1a2e]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("webhooks")

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-1">Integrations</h2>
        <p className="text-sm text-gray-500">
          Manage webhooks, API keys, and refund requests
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === "webhooks" && <WebhooksTab />}
      {activeTab === "apikeys" && <ApiKeysTab />}
      {activeTab === "refunds" && <RefundsTab />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  WEBHOOKS TAB
 * ═══════════════════════════════════════════════════════════════════════════ */

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookRecord | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [logsWebhookId, setLogsWebhookId] = useState<string | null>(null)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formUrl, setFormUrl] = useState("")
  const [formSecret, setFormSecret] = useState("")
  const [formEvents, setFormEvents] = useState<Set<string>>(new Set())
  const [formActive, setFormActive] = useState(true)
  const [formSaving, setFormSaving] = useState(false)

  const fetchWebhooks = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getWebhooks()
      if (result.webhooks) setWebhooks(result.webhooks)
    } catch {
      setActionError("Failed to load webhooks")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  function openCreate() {
    setEditingWebhook(null)
    setFormName("")
    setFormUrl("")
    setFormSecret(generateSecret())
    setFormEvents(new Set())
    setFormActive(true)
    setFormOpen(true)
  }

  function openEdit(wh: WebhookRecord) {
    setEditingWebhook(wh)
    setFormName(wh.name)
    setFormUrl(wh.url)
    setFormSecret(wh.secret)
    setFormEvents(new Set(wh.events))
    setFormActive(wh.is_active)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formUrl.trim()) return
    setFormSaving(true)
    setActionError(null)
    try {
      const fd = new FormData()
      fd.set("name", formName.trim())
      fd.set("url", formUrl.trim())
      fd.set("secret", formSecret)
      fd.set("events", Array.from(formEvents).join(","))
      fd.set("is_active", formActive ? "true" : "false")
      if (editingWebhook) {
        await updateWebhook(editingWebhook.id, fd)
      } else {
        await createWebhook(fd)
      }
      setFormOpen(false)
      await fetchWebhooks()
    } catch {
      setActionError("Failed to save webhook")
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook? This cannot be undone.")) return
    setActionError(null)
    try {
      await deleteWebhook(id)
      await fetchWebhooks()
    } catch {
      setActionError("Failed to delete webhook")
    }
  }

  async function handleTest(id: string) {
    setTestingId(id)
    setActionError(null)
    try {
      const result = await testWebhook(id)
      if (result?.error) {
        setActionError(`Test failed: ${result.error}`)
      }
    } catch {
      setActionError("Test delivery failed")
    } finally {
      setTestingId(null)
    }
  }

  async function openLogs(webhookId: string) {
    setLogsWebhookId(webhookId)
    setLogsOpen(true)
    setLogsLoading(true)
    try {
      const result = await getWebhookLogs(webhookId)
      if (result.logs) setLogs(result.logs)
    } catch {
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  function toggleEvent(event: string) {
    setFormEvents((prev) => {
      const next = new Set(prev)
      if (next.has(event)) next.delete(event)
      else next.add(event)
      return next
    })
  }

  return (
    <>
      {/* Error banner */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} />
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""} configured
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Create Webhook
        </button>
      </div>

      {/* Webhook list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="py-16 text-center">
            <Webhook size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">
              No webhooks configured yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Create a webhook to receive real-time event notifications
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  URL
                </th>
                <th className="text-center px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Events
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Last Triggered
                </th>
                <th className="text-center px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Failures
                </th>
                <th className="text-right px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((wh) => (
                <tr
                  key={wh.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-[#1a1a2e]">
                    {wh.name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">
                    {truncateUrl(wh.url)}
                  </td>
                  <td className="px-5 py-3.5 text-center text-gray-600">
                    {wh.events.length}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {fmtDate(wh.last_triggered_at)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusDot active={wh.is_active} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {wh.failure_count > 0 ? (
                      <span className="text-red-600 font-medium">
                        {wh.failure_count}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(wh)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleTest(wh.id)}
                        disabled={testingId === wh.id}
                        className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Test"
                      >
                        {testingId === wh.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => openLogs(wh.id)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View Logs"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingWebhook ? "Edit Webhook" : "Create Webhook"}
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Slack Notification"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Endpoint URL
            </label>
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-xs"
            />
          </div>

          {/* Secret */}
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Signing Secret
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setFormSecret(generateSecret())}
                className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <RefreshCw size={14} className="inline mr-1" />
                Generate
              </button>
            </div>
          </div>

          {/* Events */}
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
              Events
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors",
                    formEvents.has(event)
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formEvents.has(event)}
                    onChange={() => toggleEvent(event)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0",
                      formEvents.has(event)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    )}
                  >
                    {formEvents.has(event) && (
                      <Check size={10} className="text-white" />
                    )}
                  </div>
                  <span className="font-mono">{event}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[#1a1a2e]">Active</p>
              <p className="text-xs text-gray-500">
                Enable or disable this webhook
              </p>
            </div>
            <Toggle checked={formActive} onChange={setFormActive} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={formSaving || !formName.trim() || !formUrl.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formSaving && <Loader2 size={14} className="animate-spin" />}
              {editingWebhook ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Logs Modal */}
      <Modal
        open={logsOpen}
        onClose={() => {
          setLogsOpen(false)
          setLogsWebhookId(null)
          setLogs([])
        }}
        title="Webhook Delivery Logs"
        wide
      >
        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Eye size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No delivery logs yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "rounded-lg border p-4",
                  log.success
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-red-200 bg-red-50/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={log.success ? "green" : "red"}>
                      {log.status_code}
                    </Badge>
                    <span className="text-xs font-mono text-gray-600">
                      {log.event}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {fmtDate(log.timestamp)}
                  </span>
                </div>
                {log.response_preview && (
                  <pre className="mt-2 bg-white rounded-md border border-gray-200 px-3 py-2 text-[11px] font-mono text-gray-600 overflow-x-auto max-h-24">
                    {log.response_preview}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  API KEYS TAB
 * ═══════════════════════════════════════════════════════════════════════════ */

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedPrefix, setCopiedPrefix] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formPermissions, setFormPermissions] = useState<Set<string>>(new Set())
  const [formExpiry, setFormExpiry] = useState("")
  const [formSaving, setFormSaving] = useState(false)

  const PERMISSIONS = ["read", "write", "admin"] as const

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getApiKeys()
      if (result.apiKeys) setKeys(result.apiKeys)
    } catch {
      setActionError("Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  function openCreate() {
    setFormName("")
    setFormPermissions(new Set(["read"]))
    setFormExpiry("")
    setFormOpen(true)
  }

  async function handleGenerate() {
    if (!formName.trim()) return
    setFormSaving(true)
    setActionError(null)
    try {
      const result = await generateApiKey(
        formName.trim(),
        Array.from(formPermissions),
        formExpiry ? parseInt(formExpiry, 10) : undefined,
      )
      if (result.key) {
        setNewKeyRevealed(result.key)
      }
      setFormOpen(false)
      await fetchKeys()
    } catch {
      setActionError("Failed to generate API key")
    } finally {
      setFormSaving(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? It will immediately stop working."))
      return
    setActionError(null)
    try {
      await revokeApiKey(id)
      await fetchKeys()
    } catch {
      setActionError("Failed to revoke API key")
    }
  }

  function copyToClipboard(text: string, type: "key" | "prefix", prefixId?: string) {
    navigator.clipboard.writeText(text)
    if (type === "key") {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedPrefix(prefixId ?? null)
      setTimeout(() => setCopiedPrefix(null), 2000)
    }
  }

  function togglePermission(perm: string) {
    setFormPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(perm)) next.delete(perm)
      else next.add(perm)
      return next
    })
  }

  return (
    <>
      {/* Error banner */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} />
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {keys.filter((k) => k.is_active).length} active key
          {keys.filter((k) => k.is_active).length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Generate Key
        </button>
      </div>

      {/* Keys list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : keys.length === 0 ? (
          <div className="py-16 text-center">
            <Key size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No API keys generated yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Generate a key to access the API programmatically
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Key
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Permissions
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Last Used
                </th>
                <th className="text-center px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Usage
                </th>
                <th className="text-center px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr
                  key={key.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-[#1a1a2e]">
                    {key.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {key.key_prefix}...
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      {key.permissions.map((p) => (
                        <Badge
                          key={p}
                          variant={
                            p === "admin"
                              ? "red"
                              : p === "write"
                              ? "yellow"
                              : "blue"
                          }
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {fmtDate(key.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {fmtDate(key.last_used_at)}
                  </td>
                  <td className="px-5 py-3.5 text-center text-gray-600">
                    {key.usage_count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusDot active={key.is_active} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          copyToClipboard(key.key_prefix, "prefix", key.id)
                        }
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy prefix"
                      >
                        {copiedPrefix === key.id ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      {key.is_active && (
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Revoke"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Key Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Generate API Key"
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Key Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Production Backend"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
              Permissions
            </label>
            <div className="flex gap-3">
              {PERMISSIONS.map((perm) => (
                <label
                  key={perm}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors flex-1 justify-center",
                    formPermissions.has(perm)
                      ? perm === "admin"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : perm === "write"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formPermissions.has(perm)}
                    onChange={() => togglePermission(perm)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0",
                      formPermissions.has(perm)
                        ? perm === "admin"
                          ? "bg-red-600 border-red-600"
                          : perm === "write"
                          ? "bg-amber-600 border-amber-600"
                          : "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    )}
                  >
                    {formPermissions.has(perm) && (
                      <Check size={10} className="text-white" />
                    )}
                  </div>
                  <span className="capitalize font-medium">{perm}</span>
                  {perm === "admin" && (
                    <Shield size={12} className="text-red-400" />
                  )}
                </label>
              ))}
            </div>
            {formPermissions.has("admin") && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                Admin keys have full access. Use with caution.
              </p>
            )}
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Expiry (Days)
              <span className="text-gray-400 normal-case tracking-normal ml-1">
                — optional
              </span>
            </label>
            <input
              type="number"
              value={formExpiry}
              onChange={(e) => setFormExpiry(e.target.value)}
              placeholder="Leave empty for no expiry"
              min={1}
              className="w-full max-w-xs px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={formSaving || !formName.trim() || formPermissions.size === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formSaving && <Loader2 size={14} className="animate-spin" />}
              Generate Key
            </button>
          </div>
        </div>
      </Modal>

      {/* Reveal New Key Modal */}
      <Modal
        open={!!newKeyRevealed}
        onClose={() => setNewKeyRevealed(null)}
        title="API Key Generated"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle
              size={18}
              className="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Save this key now
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                This is the only time the full key will be shown. Store it
                securely — it cannot be retrieved later.
              </p>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#1a1a2e] text-emerald-400 text-sm font-mono px-4 py-3 rounded-lg overflow-x-auto pr-12">
              {newKeyRevealed}
            </pre>
            <button
              onClick={() =>
                newKeyRevealed &&
                copyToClipboard(newKeyRevealed, "key")
              }
              className="absolute top-2 right-2 p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Copy key"
            >
              {copiedKey ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={() => setNewKeyRevealed(null)}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  REFUNDS TAB
 * ═══════════════════════════════════════════════════════════════════════════ */

function RefundsTab() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const STATUS_FILTERS = [
    { key: "all", label: "All" },
    { key: "requested", label: "Requested" },
    { key: "processing", label: "Processing" },
    { key: "refunded", label: "Refunded" },
    { key: "denied", label: "Denied" },
  ]

  const fetchRefunds = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getRefundRequests()
      if (result.refunds) setRefunds(result.refunds)
    } catch {
      setActionError("Failed to load refund requests")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRefunds()
  }, [fetchRefunds])

  async function handleProcess(id: string) {
    if (!confirm("Process this refund via Razorpay? This will initiate the refund."))
      return
    setProcessingId(id)
    setActionError(null)
    try {
      const result = await processRefund(id)
      if (result?.error) {
        setActionError(`Refund failed: ${result.error}`)
      } else {
        await fetchRefunds()
      }
    } catch {
      setActionError("Failed to process refund")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleDeny(id: string) {
    const reason = prompt("Enter denial reason:")
    if (!reason) return
    setProcessingId(id)
    setActionError(null)
    try {
      await denyRefund(id, reason)
      await fetchRefunds()
    } catch {
      setActionError("Failed to deny refund")
    } finally {
      setProcessingId(null)
    }
  }

  const filteredRefunds =
    statusFilter === "all"
      ? refunds
      : refunds.filter((r) => r.status === statusFilter)

  function statusBadgeVariant(
    status: string
  ): "green" | "red" | "yellow" | "blue" | "gray" {
    switch (status) {
      case "refunded":
        return "green"
      case "denied":
        return "red"
      case "processing":
        return "yellow"
      case "requested":
        return "blue"
      default:
        return "gray"
    }
  }

  return (
    <>
      {/* Error banner */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} />
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                statusFilter === f.key
                  ? "bg-white text-[#1a1a2e] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f.label}
              {f.key !== "all" && (
                <span className="ml-1 text-gray-400">
                  {refunds.filter((r) =>
                    f.key === "all" ? true : r.status === f.key
                  ).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500">
          {filteredRefunds.length} request
          {filteredRefunds.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Refunds list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">
              {statusFilter === "all"
                ? "No refund requests yet"
                : `No ${statusFilter} refund requests`}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Attendee
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Event
                </th>
                <th className="text-right px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Reason
                </th>
                <th className="text-center px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Requested
                </th>
                <th className="text-right px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-[#1a1a2e]">
                    {req.attendee_name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">
                    {req.event_title}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-[#1a1a2e]">
                    {fmtCurrency(req.amount_paid)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs max-w-[200px] truncate">
                    {req.refund_reason}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Badge variant={statusBadgeVariant(req.status)}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {fmtDate(req.requested_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === "requested" && (
                        <>
                          <button
                            onClick={() => handleProcess(req.id)}
                            disabled={processingId === req.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            title="Process Refund"
                          >
                            {processingId === req.id ? (
                              <Loader2
                                size={12}
                                className="animate-spin"
                              />
                            ) : (
                              <Check size={12} />
                            )}
                            Refund
                          </button>
                          <button
                            onClick={() => handleDeny(req.id)}
                            disabled={processingId === req.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Deny Refund"
                          >
                            <X size={12} />
                            Deny
                          </button>
                        </>
                      )}
                      {req.status === "processing" && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <RefreshCw size={12} className="animate-spin" />
                          Processing
                        </span>
                      )}
                      {req.status === "refunded" && (
                        <div className="text-right">
                          <p className="text-xs text-emerald-600 font-medium">
                            {req.refund_amount != null
                              ? fmtCurrency(req.refund_amount)
                              : "—"}
                          </p>
                          {req.refund_id && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              {req.refund_id}
                            </p>
                          )}
                        </div>
                      )}
                      {req.status === "denied" && (
                        <span className="text-xs text-gray-400">Denied</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
