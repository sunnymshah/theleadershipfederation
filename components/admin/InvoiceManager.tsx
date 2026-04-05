"use client"

/**
 * Invoice Manager Component
 *
 * Admin UI for generating and emailing GST-compliant tax invoices
 * for paid attendees. Supports per-attendee and bulk operations.
 */

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  generateInvoice,
  emailInvoice,
  emailBulkInvoices,
} from "@/app/actions/invoiceActions"
import {
  FileText,
  Download,
  Mail,
  Loader2,
  Users,
  CheckCircle2,
  X,
  Send,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AttendeeRow {
  id: string
  name: string
  email: string
  company: string | null
  payment_status: string
  payment_amount: number
  invoice_number: string | null
  invoice_generated_at: string | null
  tickets?: { name: string; price_inr: number } | null
}

export function InvoiceManager({ eventId }: { eventId: string }) {
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
      .select("id, name, email, company, payment_status, payment_amount, invoice_number, invoice_generated_at, tickets(name, price_inr)")
      .eq("event_id", eventId)
      .eq("payment_status", "paid")
      .order("name")

    if (data) {
      // Supabase may return tickets as an array; normalize to single object
      const normalized = data.map((row: Record<string, unknown>) => ({
        ...row,
        tickets: Array.isArray(row.tickets) ? row.tickets[0] ?? null : row.tickets,
      }))
      setAttendees(normalized as AttendeeRow[])
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function clearMessages() {
    setActionError(null)
    setSuccessMessage(null)
  }

  /** Download a single invoice PDF */
  async function handleDownload(attendeeId: string) {
    clearMessages()
    setDownloadingId(attendeeId)

    try {
      const res = await fetch(`/api/invoices/${attendeeId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to download invoice")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const disposition = res.headers.get("Content-Disposition")
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || "invoice.pdf"
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      // Refresh to show updated invoice number
      await fetchData()
    } catch (err) {
      setActionError((err as Error).message)
    }

    setDownloadingId(null)
  }

  /** Email a single invoice */
  async function handleEmail(attendeeId: string) {
    clearMessages()
    setEmailingId(attendeeId)

    const result = await emailInvoice(attendeeId)
    if (result.success) {
      setSuccessMessage("Invoice emailed successfully!")
      await fetchData()
    } else {
      setActionError(result.error || "Failed to email invoice")
    }

    setEmailingId(null)
  }

  /** Download all invoices */
  async function handleBulkDownload() {
    clearMessages()
    setBulkDownloading(true)

    let downloaded = 0
    for (const attendee of attendees) {
      try {
        const res = await fetch(`/api/invoices/${attendee.id}`)
        if (!res.ok) continue

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const safeName = attendee.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase()
        a.download = `invoice-${safeName}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        downloaded++

        await new Promise((r) => setTimeout(r, 300))
      } catch {
        // Continue with next
      }
    }

    setSuccessMessage(`Downloaded ${downloaded} of ${attendees.length} invoices.`)
    await fetchData()
    setBulkDownloading(false)
  }

  /** Email all invoices */
  async function handleBulkEmail() {
    clearMessages()
    if (!confirm(`Email invoices to all ${attendees.length} paid attendees?`)) return
    setBulkEmailing(true)

    const result = await emailBulkInvoices(eventId)
    if (result.success) {
      setSuccessMessage(`All ${result.sent} invoices emailed successfully!`)
    } else {
      setSuccessMessage(`Sent: ${result.sent}, Failed: ${result.failed}`)
      if (result.errors.length > 0) {
        setActionError(result.errors.join("\n"))
      }
    }

    await fetchData()
    setBulkEmailing(false)
  }

  function formatINR(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const withInvoice = attendees.filter((a) => a.invoice_number)

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="px-4 py-3 rounded-lg border border-[#e0e0e0] bg-white text-center">
          <div className="text-xl font-bold tabular-nums text-[#c9a84c]">{attendees.length}</div>
          <div className="text-[10px] text-[#aaa] uppercase tracking-wider">Paid Attendees</div>
        </div>
        <div className="px-4 py-3 rounded-lg border border-[#e0e0e0] bg-white text-center">
          <div className="text-xl font-bold tabular-nums text-emerald-500">{withInvoice.length}</div>
          <div className="text-[10px] text-[#aaa] uppercase tracking-wider">Invoices Generated</div>
        </div>
        <div className="px-4 py-3 rounded-lg border border-[#e0e0e0] bg-white text-center">
          <div className="text-xl font-bold tabular-nums text-blue-500">{attendees.length - withInvoice.length}</div>
          <div className="text-[10px] text-[#aaa] uppercase tracking-wider">Pending</div>
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
              <><Download size={14} /> Generate All Invoices</>
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
              <><Send size={14} /> Email All Invoices</>
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
            <Receipt size={28} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">No paid attendees for this event.</p>
            <p className="text-[#bbb] text-xs mt-1">Invoices are generated for attendees with payment_status = paid.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Attendee</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Invoice #</th>
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
                  <td className="px-5 py-3.5 text-[#333] text-xs font-medium tabular-nums">
                    {formatINR(a.tickets?.price_inr ?? a.payment_amount ?? 0)}
                  </td>
                  <td className="px-5 py-3.5">
                    {a.invoice_number ? (
                      <div>
                        <span className="inline-flex px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                          {a.invoice_number}
                        </span>
                        {a.invoice_generated_at && (
                          <div className="text-[10px] text-[#aaa] mt-0.5">{fmtDate(a.invoice_generated_at)}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#bbb] text-xs">Not generated</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(a.id)}
                        disabled={downloadingId === a.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#c9a84c] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-30"
                        title="Download Invoice"
                      >
                        {downloadingId === a.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <FileText size={12} />
                        )}
                        Invoice
                      </button>
                      <button
                        onClick={() => handleEmail(a.id)}
                        disabled={emailingId === a.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#555] border border-[#e0e0e0] hover:bg-[#fafafa] transition-colors disabled:opacity-30"
                        title="Email Invoice"
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
