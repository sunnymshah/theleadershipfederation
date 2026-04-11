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
      return "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
    case "confirmed":
      return "bg-blue-500/15 text-blue-700 border border-blue-500/30"
    case "registered":
      return "bg-amber-500/15 text-amber-700 border border-amber-500/30"
    default:
      return "bg-[#1a1a2e]/10 text-[#1a1a2e]/75 border border-[#1a1a2e]/[0.10]"
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
      return "text-emerald-700"
    case "pending":
      return "text-amber-700"
    case "free":
      return "text-blue-700"
    case "refunded":
      return "text-red-700"
    default:
      return "text-[#1a1a2e]/65"
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
        <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center">
              <Ticket size={20} className="text-[#e7ab1c]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-[#1a1a2e]"
                style={sfFont}
              >
                Find My Tickets
              </h2>
              <p className="text-sm text-[#1a1a2e]/75">
                Enter your registered email to access your tickets
              </p>
            </div>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-[#1a1a2e]/80 uppercase tracking-wider mb-2"
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
                className="w-full px-4 py-3 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-xl text-sm text-[#1a1a2e] placeholder-[#1a1a2e]/55 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#e7ab1c] hover:bg-[#d49c10] disabled:opacity-50 text-[#1a1a2e] font-bold rounded-full transition-colors shadow-[0_4px_24px_rgba(231,171,28,0.25)]"
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
        className="flex items-center gap-2 text-sm text-[#1a1a2e]/75 hover:text-[#e7ab1c] transition-colors mb-8 font-medium"
      >
        <ArrowLeft size={16} />
        Search with a different email
      </button>

      {/* Empty state */}
      {registrations && registrations.length === 0 && (
        <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center mx-auto mb-5">
            <Search size={24} className="text-[#e7ab1c]" />
          </div>
          <h3
            className="text-xl font-bold text-[#1a1a2e] mb-2"
            style={sfFont}
          >
            No Registrations Found
          </h3>
          <p className="text-[#1a1a2e]/75 text-sm max-w-md mx-auto leading-relaxed">
            We could not find any active registrations for{" "}
            <span className="text-[#1a1a2e] font-semibold">{email}</span>.
            Please check the email address and try again, or contact our
            support team for assistance.
          </p>
        </div>
      )}

      {/* Registration cards */}
      {registrations && registrations.length > 0 && (
        <div className="space-y-5">
          <p className="text-sm text-[#1a1a2e]/75">
            Showing {registrations.length} registration{registrations.length !== 1 ? "s" : ""} for{" "}
            <span className="text-[#1a1a2e] font-semibold">{email}</span>
          </p>

          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm hover:shadow-md hover:border-[#e7ab1c]/30 transition-all p-6 md:p-7"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-lg font-bold text-[#1a1a2e] mb-1 truncate"
                    style={sfFont}
                  >
                    {reg.event_title}
                  </h3>
                  <p className="text-sm text-[#1a1a2e]/75">
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
                  <CreditCard size={14} className="text-[#e7ab1c]" />
                  <span className={`font-semibold ${paymentColor(reg.payment_status)}`}>
                    {paymentLabel(reg.payment_status)}
                  </span>
                </div>
                {reg.payment_amount !== null && reg.payment_amount > 0 && (
                  <span className="text-[#1a1a2e]/75 font-medium">
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border border-[#e7ab1c]/40 text-[#a37410] bg-[#e7ab1c]/10 hover:bg-[#e7ab1c]/20 transition-colors"
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border border-emerald-500/40 text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border border-blue-500/40 text-blue-700 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
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
