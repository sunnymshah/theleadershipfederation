"use client"

import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { registerForEvent } from "@/app/actions/registrationActions"

interface Ticket {
  id: string
  name: string
  description: string | null
  price_inr: number
  inventory_limit: number
  sold: number
}

export function TicketPurchaseCard({ ticket, eventId, eventTitle }: { ticket: Ticket; eventId: string; eventTitle: string }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const soldOut = ticket.sold >= ticket.inventory_limit
  const spotsLeft = ticket.inventory_limit - ticket.sold

  function fmtPrice(n: number) {
    return new Intl.NumberFormat("en-IN").format(n)
  }

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

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
        <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-400" />
        <h3 className="font-semibold text-white mb-1">Registration Confirmed!</h3>
        <p className="text-sm text-white/40">Check your email for your personalized QR ticket for {eventTitle}.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col">
      <h3 className="font-semibold text-white mb-1">{ticket.name}</h3>
      {ticket.description && <p className="text-sm text-white/35 mb-4">{ticket.description}</p>}
      <div className="mt-auto">
        <div className="flex items-baseline gap-1 mb-1">
          {ticket.price_inr === 0 ? (
            <span className="text-2xl font-bold text-emerald-400">Free</span>
          ) : (
            <>
              <span className="text-2xl font-bold text-white">₹{fmtPrice(ticket.price_inr)}</span>
              <span className="text-xs text-white/30">per person</span>
            </>
          )}
        </div>
        <p className="text-[11px] text-white/25 mb-4">
          {soldOut ? "Sold out" : `${spotsLeft} spots remaining`}
        </p>

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            disabled={soldOut}
            className="w-full py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {soldOut ? "Sold Out" : "Register Now"}
          </button>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <input type="text" name="name" required placeholder="Full Name *" className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50" />
            <input type="email" name="email" required placeholder="Email *" className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50" />
            <input type="tel" name="phone" placeholder="Phone" className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" name="company" placeholder="Company" className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50" />
              <input type="text" name="designation" placeholder="Designation" className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50" />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Registering…</> : "Confirm"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
