"use client"

/**
 * Admin Invoices Page
 *
 * Allows administrators to generate and email GST-compliant tax invoices
 * for paid attendees, with event selector and summary stats.
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { InvoiceManager } from "@/components/admin/InvoiceManager"
import { Receipt } from "lucide-react"

interface EventOption {
  id: string
  title: string
  start_date: string
  status: string
}

export default function AdminInvoicesPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("events")
      .select("id, title, start_date, status")
      .order("start_date", { ascending: false })

    if (data) {
      setEvents(data)
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1 flex items-center gap-3">
            <Receipt size={24} className="text-[#c9a84c]" />
            Invoices
          </h2>
          <p className="text-sm text-[#888]">
            Generate and email GST-compliant tax invoices for paid attendees.
          </p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="mb-6">
        <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] transition-colors min-w-[320px]"
        >
          {loading ? (
            <option>Loading events...</option>
          ) : events.length === 0 ? (
            <option>No events found</option>
          ) : (
            events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
                {ev.status !== "published" ? ` (${ev.status})` : ""}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Invoice Manager */}
      {selectedEventId && <InvoiceManager eventId={selectedEventId} />}
    </div>
  )
}
