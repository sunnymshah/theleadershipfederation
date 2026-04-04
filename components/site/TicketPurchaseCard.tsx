"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, Minus } from "lucide-react"
import { registerForEvent } from "@/app/actions/registrationActions"

interface Ticket {
  id: string
  name: string
  description: string | null
  price_inr: number
  inventory_limit: number
  sold: number
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

export function TicketPurchaseCard({ ticket, eventId, eventTitle }: { ticket: Ticket; eventId: string; eventTitle: string }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const soldOut = ticket.sold >= ticket.inventory_limit
  const spotsLeft = ticket.inventory_limit - ticket.sold
  const almostGone = !soldOut && spotsLeft <= 10

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)
    fd.set("ticketId", ticket.id)

    const result = await registerForEvent(fd)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error ?? "Registration failed")
    }
    setSubmitting(false)
  }

  /* ── Success state ──────────────────────────────────────────── */
  if (success) {
    return (
      <div
        className="rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[320px]"
        style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.04)" }}
      >
        <CheckCircle2 size={40} className="text-emerald-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">You&apos;re In!</h3>
        <p className="text-sm text-white/40 max-w-xs">
          Your registration for <span className="text-white/60">{eventTitle}</span> is confirmed. Check your email for your personalized QR ticket.
        </p>
      </div>
    )
  }

  /* ── Main card ──────────────────────────────────────────────── */
  return (
    <div
      className="rounded-2xl p-7 flex flex-col relative overflow-hidden transition-all duration-300 hover:border-[#c9a84c]/20"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />

      {/* Tier name */}
      <h3 className="text-lg font-semibold text-white mb-1">{ticket.name}</h3>
      {ticket.description && (
        <p className="text-sm text-white/30 mb-6 leading-relaxed">{ticket.description}</p>
      )}

      {/* Price */}
      <div className="mb-6 mt-auto">
        {ticket.price_inr === 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-emerald-400">Free</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white tabular-nums">&#8377;{fmtPrice(ticket.price_inr)}</span>
            <span className="text-xs text-white/25 ml-1">per person</span>
          </div>
        )}

        {/* Availability */}
        <div className="flex items-center gap-2 mt-2">
          {soldOut ? (
            <span className="text-xs text-red-400/80 font-medium">Sold out</span>
          ) : almostGone ? (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-amber-400/80 font-medium">Only {spotsLeft} left</span>
            </>
          ) : (
            <span className="text-xs text-white/20">{spotsLeft} spots remaining</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mb-6" />

      {/* CTA / Form */}
      {!open ? (
        <button
          onClick={() => !soldOut && setOpen(true)}
          disabled={soldOut}
          className={
            soldOut
              ? "w-full py-3 rounded-xl text-sm font-semibold text-white/20 bg-white/[0.03] border border-white/[0.06] cursor-not-allowed flex items-center justify-center gap-2"
              : "w-full py-3 rounded-xl text-sm font-bold text-[#0a0a0a] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          }
          style={
            soldOut
              ? undefined
              : {
                  background: "linear-gradient(135deg, #c9a84c 0%, #d9b85c 100%)",
                  boxShadow: "0 0 20px rgba(201,168,76,0.2), 0 2px 6px rgba(0,0,0,0.3)",
                }
          }
        >
          {soldOut ? (
            <><Minus size={14} /> Sold Out</>
          ) : (
            "Secure Your Seat"
          )}
        </button>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <input
            type="text"
            name="name"
            required
            placeholder="Full Name *"
            className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="Email *"
            className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              name="company"
              placeholder="Company"
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
            />
            <input
              type="text"
              name="designation"
              placeholder="Designation"
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-[#0a0a0a] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #c9a84c 0%, #d9b85c 100%)",
              }}
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Registering…</> : "Confirm"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
