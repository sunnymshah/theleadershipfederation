"use client"

import { useState } from "react"
import {
  Loader2,
  Search,
  Download,
  FileText,
  Award,
  Ticket,
  CheckCircle2,
  Clock,
  CreditCard,
  ArrowLeft,
} from "lucide-react"

/* ── Types ───────────────────────────────────────────────────────── */

interface Registration {
  id: string
  name: string
  email: string
  event_title: string
  event_slug: string
  event_id: string
  ticket_name: string
  status: string
  payment_status: string | null
  payment_amount: number | null
  checked_in: boolean
  qr_token: string | null
}

/* ── Helpers ─────────────────────────────────────────────────────── */

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

function statusLabel(status: string) {
  switch (status) {
    case "checked_in":
      return "Checked In"
    case "confirmed":
      return "Confirmed"
    case "registered":
      return "Registered"
    default:
      return status
  }
}

function statusColor(status: string) {
  switch (status) {
    case "checked_in":
      return "bg-emerald-500/20 text-emerald-400"
    case "confirmed":
      return "bg-blue-500/20 text-blue-400"
    case "registered":
      return "bg-amber-500/20 text-amber-400"
    default:
      return "bg-white/10 text-white/60"
  }
}

function paymentLabel(status: string | null) {
  switch (status) {
    case "paid":
      return "Paid"
    case "pending":
      return "Pending"
    case "free":
      return "Free"
    case "refunded":
      return "Refunded"
    default:
      return status ?? "N/A"
  }
}

function paymentColor(status: string | null) {
  switch (status) {
    case "paid":
      return "text-emerald-400"
    case "pending":
      return "text-amber-400"
    case "free":
      return "text-blue-400"
    case "refunded":
      return "text-red-400"
    default:
      return "text-white/40"
  }
}

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return ""
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/* ── Component ───────────────────────────────────────────────────── */

export function AttendeePortal() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrations, setRegistrations] = useState<Registration[] | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = email.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setRegistrations(null)

    try {
      const res = await fetch("/api/attendee/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to look up registrations")
      }

      const data = await res.json()
      setRegistrations(data.registrations ?? [])
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setEmail("")
    setRegistrations(null)
    setSearched(false)
    setError(null)
  }

  function buildUrl(base: string, attendeeId: string, qrToken: string | null) {
    if (!qrToken) return null
    return `${base}/${attendeeId}?token=${encodeURIComponent(qrToken)}`
  }

  /* ── Step 1: Email Lookup ──────────────────────────────────────── */
  if (!searched) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center">
              <Ticket size={20} className="text-[#c9a84c]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-white"
                style={sfFont}
              >
                Find My Tickets
              </h2>
              <p className="text-sm text-white/40">
                Enter your registered email to access your tickets
              </p>
            </div>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#c9a84c] hover:bg-[#b8993f] disabled:opacity-50 text-black font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Find My Tickets
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Step 2: Results ───────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={handleReset}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Search with a different email
      </button>

      {/* Empty state */}
      {registrations && registrations.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-5">
            <Search size={24} className="text-white/20" />
          </div>
          <h3
            className="text-xl font-bold text-white mb-2"
            style={sfFont}
          >
            No Registrations Found
          </h3>
          <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
            We could not find any active registrations for{" "}
            <span className="text-white/60 font-medium">{email}</span>.
            Please check the email address and try again, or contact our
            support team for assistance.
          </p>
        </div>
      )}

      {/* Registration cards */}
      {registrations && registrations.length > 0 && (
        <div className="space-y-5">
          <p className="text-sm text-white/40">
            Showing {registrations.length} registration{registrations.length !== 1 ? "s" : ""} for{" "}
            <span className="text-white/60 font-medium">{email}</span>
          </p>

          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-7"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-lg font-bold text-white mb-1 truncate"
                    style={sfFont}
                  >
                    {reg.event_title}
                  </h3>
                  <p className="text-sm text-white/40">
                    {reg.ticket_name}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColor(reg.status)}`}
                >
                  {reg.status === "checked_in" ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  {statusLabel(reg.status)}
                </span>
              </div>

              {/* Payment info */}
              <div className="flex items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-white/30" />
                  <span className={`font-medium ${paymentColor(reg.payment_status)}`}>
                    {paymentLabel(reg.payment_status)}
                  </span>
                </div>
                {reg.payment_amount !== null && reg.payment_amount > 0 && (
                  <span className="text-white/40">
                    {formatCurrency(reg.payment_amount)}
                  </span>
                )}
              </div>

              {/* Download buttons */}
              <div className="flex flex-wrap gap-3">
                {/* E-Ticket / Badge — available for all valid statuses */}
                {reg.qr_token && ["registered", "confirmed", "checked_in"].includes(reg.status) && (
                  <a
                    href={buildUrl("/api/attendee/badge", reg.id, reg.qr_token) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
                  >
                    <Download size={14} />
                    E-Ticket / Badge
                  </a>
                )}

                {/* Certificate — only if checked in */}
                {reg.qr_token && reg.checked_in && (
                  <a
                    href={buildUrl("/api/attendee/certificate", reg.id, reg.qr_token) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Award size={14} />
                    Certificate
                  </a>
                )}

                {/* Invoice — only if paid */}
                {reg.qr_token && reg.payment_status === "paid" && (
                  <a
                    href={buildUrl("/api/attendee/invoice", reg.id, reg.qr_token) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <FileText size={14} />
                    Invoice
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
