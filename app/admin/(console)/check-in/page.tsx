"use client"

import { useState } from "react"
import { verifyQrToken } from "@/app/actions/registrationActions"
import { ScanLine, CheckCircle2, XCircle, Loader2, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedAttendee {
  name: string
  email: string
  company: string | null
  designation: string | null
  status: string
  check_in_at: string | null
  events: { title: string; venue: string; start_date: string } | null
  tickets: { name: string } | null
}

export default function CheckInPage() {
  const [qrInput, setQrInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string; attendee?: VerifiedAttendee } | null>(null)

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    if (!qrInput.trim()) return

    setScanning(true)
    setResult(null)

    const res = await verifyQrToken(qrInput.trim())
    setResult(res as { success: boolean; error?: string; attendee?: VerifiedAttendee })
    setScanning(false)

    // Auto-clear after success for next scan
    if (res.success) {
      setTimeout(() => { setQrInput(""); setResult(null) }, 5000)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Check-In Scanner</h2>
        <p className="text-sm text-white/40">Scan or paste QR code tokens to verify and check in attendees</p>
      </div>

      {/* Scanner Input */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center">
            <Camera size={32} className="text-[#c9a84c]" />
          </div>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">QR Code Token</label>
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Scan QR code or paste token here…"
              autoFocus
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors text-center font-mono tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !qrInput.trim()}
            className="w-full py-3 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {scanning ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : <><ScanLine size={16} /> Verify & Check In</>}
          </button>
        </form>

        <p className="text-center text-[11px] text-white/20 mt-4">
          Use a barcode scanner or camera app to scan the QR code. The token will auto-fill.
        </p>
      </div>

      {/* Result */}
      {result && (
        <div className={cn(
          "rounded-xl border p-6 transition-all",
          result.success
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-red-500/20 bg-red-500/5"
        )}>
          <div className="flex items-start gap-4">
            {result.success ? (
              <CheckCircle2 size={28} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={28} className="text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={cn("text-lg font-semibold mb-1", result.success ? "text-emerald-400" : "text-red-400")}>
                {result.success ? "Check-In Successful!" : "Verification Failed"}
              </h3>

              {result.error && <p className="text-sm text-white/50 mb-3">{result.error}</p>}

              {result.attendee && (
                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Name</span>
                    <span className="text-white font-medium">{result.attendee.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Email</span>
                    <span className="text-white/70">{result.attendee.email}</span>
                  </div>
                  {result.attendee.company && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Company</span>
                      <span className="text-white/70">{result.attendee.designation ? `${result.attendee.designation}, ` : ""}{result.attendee.company}</span>
                    </div>
                  )}
                  {result.attendee.events && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Event</span>
                      <span className="text-white/70">{result.attendee.events.title}</span>
                    </div>
                  )}
                  {result.attendee.tickets && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Ticket</span>
                      <span className="text-white/70">{result.attendee.tickets.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
