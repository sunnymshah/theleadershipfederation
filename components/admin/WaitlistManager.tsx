"use client"

/**
 * ─── WAITLIST MANAGER ───────────────────────────────────────────────────
 *
 * Shows waitlisted attendees in position order with promote/cancel actions.
 * Dark admin styling (bg-[#1a1a2e] text-white).
 */

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { promoteFromWaitlist, cancelAndPromote } from "@/app/actions/waitlistActions"
import {
  Loader2,
  Users,
  ArrowUpCircle,
  XCircle,
  Clock,
  Hash,
} from "lucide-react"

interface WaitlistRow {
  id: string
  event_id: string
  ticket_id: string | null
  name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  waitlist_position: number | null
  registration_date: string
  status: string
  tickets?: { name: string } | null
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function WaitlistManager({ eventId }: { eventId: string }) {
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  const fetchWaitlist = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("attendees")
      .select("*, tickets(name)")
      .eq("event_id", eventId)
      .eq("status", "waitlisted")
      .order("waitlist_position", { ascending: true })

    if (!error && data) {
      setWaitlist(data)
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchWaitlist()
  }, [fetchWaitlist])

  async function handlePromote(id: string, name: string) {
    setPromotingId(id)
    setActionError(null)
    setSuccessMsg(null)

    const result = await promoteFromWaitlist(id)
    if (result.success) {
      setSuccessMsg(`${name} has been promoted from the waitlist.`)
      await fetchWaitlist()
    } else {
      setActionError(result.error ?? "Failed to promote attendee.")
    }
    setPromotingId(null)
  }

  async function handleCancel(id: string, name: string) {
    if (!confirm(`Cancel waitlist entry for ${name}?`)) return
    setCancellingId(id)
    setActionError(null)
    setSuccessMsg(null)

    const result = await cancelAndPromote(id)
    if (result.success) {
      setSuccessMsg(`${name} has been removed from the waitlist.`)
      await fetchWaitlist()
    } else {
      setActionError(result.error ?? "Failed to cancel.")
    }
    setCancellingId(null)
  }

  return (
    <div className="bg-[#1a1a2e] rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Clock size={18} className="text-yellow-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Waitlist</h3>
            <p className="text-xs text-white/50">
              {waitlist.length} {waitlist.length === 1 ? "person" : "people"} waiting
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400/50 hover:text-red-400 ml-3"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400/50 hover:text-emerald-400 ml-3"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-white/40 gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading waitlist...
        </div>
      ) : waitlist.length === 0 ? (
        <div className="py-12 text-center">
          <Users size={28} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-sm">No one on the waitlist.</p>
          <p className="text-white/20 text-xs mt-1">
            When tickets sell out, new registrants are added here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {waitlist.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              {/* Left: Position + Info */}
              <div className="flex items-center gap-4">
                {/* Position badge */}
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <span className="text-yellow-400 text-xs font-bold">
                    {entry.waitlist_position != null ? (
                      `#${entry.waitlist_position}`
                    ) : (
                      <Hash size={12} />
                    )}
                  </span>
                </div>

                <div>
                  <div className="text-sm font-medium text-white">
                    {entry.name}
                  </div>
                  <div className="text-xs text-white/40 flex items-center gap-2">
                    <span>{entry.email}</span>
                    {entry.tickets?.name && (
                      <>
                        <span className="text-white/20">|</span>
                        <span>{entry.tickets.name}</span>
                      </>
                    )}
                  </div>
                  {(entry.company || entry.designation) && (
                    <div className="text-[11px] text-white/30 mt-0.5">
                      {[entry.designation, entry.company]
                        .filter(Boolean)
                        .join(" at ")}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 mr-2 hidden sm:block">
                  {fmtDate(entry.registration_date)}
                </span>
                <button
                  onClick={() => handlePromote(entry.id, entry.name)}
                  disabled={promotingId === entry.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                  title="Promote to registered"
                >
                  {promotingId === entry.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <ArrowUpCircle size={12} />
                  )}
                  Promote
                </button>
                <button
                  onClick={() => handleCancel(entry.id, entry.name)}
                  disabled={cancellingId === entry.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-40"
                  title="Remove from waitlist"
                >
                  {cancellingId === entry.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <XCircle size={12} />
                  )}
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
