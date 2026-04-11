"use client"

/**
 * Admin Reports & Analytics Export Page
 *
 * Generate comprehensive event reports with PDF and CSV downloads.
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  generateEventReport,
  exportEventReportCSV,
  exportRevenueReportCSV,
} from "@/app/actions/reportActions"

interface EventOption {
  id: string
  title: string
  start_date: string
  status: string
}

type ReportType = "full" | "attendees" | "revenue" | "sponsors"

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminReportsPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<ReportType>("full")
  const [generating, setGenerating] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)

  // Preview stats
  const [stats, setStats] = useState<{
    registrations: number
    checkedIn: number
    revenue: number
    sponsors: number
    speakers: number
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

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

  // Load preview stats when event changes
  useEffect(() => {
    if (!selectedEventId) return
    let cancelled = false

    async function loadStats() {
      setLoadingStats(true)
      setStats(null)
      const result = await generateEventReport(selectedEventId)
      if (!cancelled && result.success && result.data) {
        setStats({
          registrations: result.data.totalRegistrations,
          checkedIn: result.data.totalCheckedIn,
          revenue: result.data.totalRevenue,
          sponsors: result.data.sponsors.length,
          speakers: result.data.speakers.length,
        })
      }
      if (!cancelled) setLoadingStats(false)
    }

    loadStats()
    return () => { cancelled = true }
  }, [selectedEventId])

  const handleDownloadPdf = async () => {
    if (!selectedEventId) return
    setGenerating(true)

    try {
      const url = `/api/reports/${selectedEventId}`
      const response = await fetch(url)

      if (!response.ok) {
        const err = await response.json()
        alert(err.error || "Failed to generate report")
        setGenerating(false)
        return
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `report-${selectedEventId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      alert("Failed to generate report: " + (err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadCsv = async () => {
    if (!selectedEventId) return
    setExportingCsv(true)

    try {
      let result
      if (reportType === "revenue") {
        result = await exportRevenueReportCSV(selectedEventId)
      } else {
        result = await exportEventReportCSV(selectedEventId)
      }

      if (!result.success || !result.csv) {
        alert(result.error || "Failed to export CSV")
        setExportingCsv(false)
        return
      }

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      const suffix = reportType === "revenue" ? "revenue" : "attendees"
      a.download = `${suffix}-${selectedEventId.slice(0, 8)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      alert("Failed to export CSV: " + (err as Error).message)
    } finally {
      setExportingCsv(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1 flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Reports & Analytics
          </h2>
          <p className="text-sm text-[#888]">
            Generate comprehensive event reports and export data.
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

      {selectedEventId && (
        <>
          {/* Preview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Registrations", value: stats?.registrations },
              { label: "Checked In", value: stats?.checkedIn },
              { label: "Revenue", value: stats ? fmtCurrency(stats.revenue) : null },
              { label: "Speakers", value: stats?.speakers },
              { label: "Sponsors", value: stats?.sponsors },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)]"
              >
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                {loadingStats ? (
                  <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <p className="text-xl font-bold text-[#1a1a2e]">
                    {stat.value ?? "--"}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Report options card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)] p-6 max-w-[700px]">
            {/* Report type selector */}
            <div className="mb-6">
              <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2">
                Report Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "full", label: "Full Report" },
                    { value: "attendees", label: "Attendee List" },
                    { value: "revenue", label: "Revenue Report" },
                    { value: "sponsors", label: "Sponsor Report" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setReportType(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      reportType === opt.value
                        ? "bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30"
                        : "bg-[#f0f0f0] text-[#555] hover:bg-[#e8e8e8] border border-transparent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Download buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPdf}
                disabled={generating}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  generating
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm"
                }`}
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadCsv}
                disabled={exportingCsv}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  exportingCsv
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white text-[#333] border border-[#d0d0d0] hover:bg-[#f5f5f5] shadow-sm"
                }`}
              >
                {exportingCsv ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Download CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
