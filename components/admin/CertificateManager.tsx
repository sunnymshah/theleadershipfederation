"use client"

/**
 * Certificate Manager Component
 *
 * Admin UI for generating and emailing participation certificates
 * to checked-in attendees. Supports per-attendee and bulk operations.
 */

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  generateCertificate,
  emailCertificate,
  emailBulkCertificates,
} from "@/app/actions/certificateActions"
import {
  Award,
  Download,
  Mail,
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AttendeeRow {
  id: string
  name: string
  email: string
  company: string | null
  status: string
  check_in_at: string | null
}

export function CertificateManager({ eventId }: { eventId: string }) {
  const [attendees, setAttendees] = useState<AttendeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [emailingId, setEmailingId] = useState<string | null>(null)
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [bulkEmailing, setBulkEmailing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("attendees")
      .select("id, name, email, company, status, check_in_at")
      .eq("event_id", eventId)
      .eq("status", "checked_in")
      .order("name")

    if (data) setAttendees(data)
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function clearMessages() {
    setActionError(null)
    setSuccessMessage(null)
  }

  /** Download a single certificate PDF */
  async function handleDownload(attendeeId: string) {
    clearMessages()
    setDownloadingId(attendeeId)

    try {
      // Use the API route for a direct download
      const res = await fetch(`/api/certificates/${attendeeId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to download certificate")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const disposition = res.headers.get("Content-Disposition")
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || "certificate.pdf"
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setActionError((err as Error).message)
    }

    setDownloadingId(null)
  }

  /** Email a single certificate */
  async function handleEmail(attendeeId: string) {
    clearMessages()
    setEmailingId(attendeeId)

    const result = await emailCertificate(attendeeId)
    if (result.success) {
      setSuccessMessage("Certificate emailed successfully!")
    } else {
      setActionError(result.error || "Failed to email certificate")
    }

    setEmailingId(null)
  }

  /** Download all certificates as individual files */
  async function handleBulkDownload() {
    clearMessages()
    setBulkDownloading(true)

    let downloaded = 0
    for (const attendee of attendees) {
      try {
        const res = await fetch(`/api/certificates/${attendee.id}`)
        if (!res.ok) continue

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const safeName = attendee.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase()
        a.download = `certificate-${safeName}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        downloaded++

        // Small delay between downloads
        await new Promise((r) => setTimeout(r, 300))
      } catch {
        // Continue with next
      }
    }

    setSuccessMessage(`Downloaded ${downloaded} of ${attendees.length} certificates.`)
    setBulkDownloading(false)
  }

  /** Email all certificates */
  async function handleBulkEmail() {
    clearMessages()
    if (!confirm(`Email certificates to all ${attendees.length} checked-in attendees?`)) return
    setBulkEmailing(true)

    const result = await emailBulkCertificates(eventId)
    if (result.success) {
      setSuccessMessage(`All ${result.sent} certificates emailed successfully!`)
    } else {
      setSuccessMessage(`Sent: ${result.sent}, Failed: ${result.failed}`)
      if (result.errors.length > 0) {
        setActionError(result.errors.join("\n"))
      }
    }

    setBulkEmailing(false)
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

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="px-4 py-3 rounded-lg border border-[#e0e0e0] bg-white text-center">
          <div className="text-xl font-bold tabular-nums text-[#c9a84c]">{attendees.length}</div>
          <div className="text-[10px] text-[#aaa] uppercase tracking-wider">Checked-In Attendees</div>
        </div>
        <div className="px-4 py-3 rounded-lg border border-[#e0e0e0] bg-white text-center">
          <div className="text-xl font-bold tabular-nums text-emerald-500">{attendees.length}</div>
          <div className="text-[10px] text-[#aaa] uppercase tracking-wider">Certificates Available</div>
        </div>
      </div>

      {/* Bulk Actions */}
      {attendees.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={handleBulkDownload}
            disabled={bulkDownloading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors"
          >
            {bulkDownloading ? (
              <><Loader2 size={14} className="animate-spin" /> Generating...</>
            ) : (
              <><Download size={14} /> Generate All Certificates</>
            )}
          </button>
          <button
            onClick={handleBulkEmail}
            disabled={bulkEmailing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c9a84c] text-[#c9a84c] text-sm font-bold hover:bg-[#c9a84c]/10 disabled:opacity-50 transition-colors"
          >
            {bulkEmailing ? (
              <><Loader2 size={14} className="animate-spin" /> Sending...</>
            ) : (
              <><Send size={14} /> Email All Certificates</>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      {actionError && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-500 text-sm">
          <span className="whitespace-pre-line">{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400 ml-3 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-emerald-600 text-sm">
          <span className="flex items-center gap-2"><CheckCircle2 size={14} /> {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400/50 hover:text-emerald-400 ml-3 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#aaa] gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading attendees...
          </div>
        ) : attendees.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={28} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">No checked-in attendees for this event.</p>
            <p className="text-[#bbb] text-xs mt-1">Attendees must be checked in to receive certificates.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Attendee</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Checked In</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((a) => (
                <tr key={a.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[#333]">{a.name}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[#666] text-xs">{a.email}</td>
                  <td className="px-5 py-3.5 text-[#777] text-xs">{a.company || "---"}</td>
                  <td className="px-5 py-3.5 text-[#888] text-[11px] whitespace-nowrap">
                    {a.check_in_at ? fmtDate(a.check_in_at) : "---"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(a.id)}
                        disabled={downloadingId === a.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#c9a84c] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-30"
                        title="Download Certificate"
                      >
                        {downloadingId === a.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Award size={12} />
                        )}
                        Certificate
                      </button>
                      <button
                        onClick={() => handleEmail(a.id)}
                        disabled={emailingId === a.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#555] border border-[#e0e0e0] hover:bg-[#fafafa] transition-colors disabled:opacity-30"
                        title="Email Certificate"
                      >
                        {emailingId === a.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Mail size={12} />
                        )}
                        Email
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
