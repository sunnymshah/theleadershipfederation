"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, FileSpreadsheet, ChevronDown, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { parseCSV, importAttendees } from "@/app/actions/importActions"

interface EventOption { id: string; title: string }
interface TicketOption { id: string; name: string; event_id: string }

interface Props {
  events: EventOption[]
  tickets: TicketOption[]
  onClose: () => void
  onComplete: () => void
}

const FIELD_OPTIONS = [
  { value: "", label: "— Skip —" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "designation", label: "Designation" },
]

function guessMapping(header: string): string {
  const h = header.toLowerCase().trim()
  if (h.includes("name") && !h.includes("company")) return "name"
  if (h.includes("email") || h.includes("e-mail")) return "email"
  if (h.includes("phone") || h.includes("mobile") || h.includes("contact")) return "phone"
  if (h.includes("company") || h.includes("organization") || h.includes("organisation") || h.includes("firm")) return "company"
  if (h.includes("designation") || h.includes("title") || h.includes("role") || h.includes("position")) return "designation"
  return ""
}

export function CSVImporter({ events, tickets, onClose, onComplete }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload")
  const [fileName, setFileName] = useState("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [columnMap, setColumnMap] = useState<Record<number, string>>({})
  const [eventId, setEventId] = useState("")
  const [ticketId, setTicketId] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filteredTickets = tickets.filter(t => t.event_id === eventId)

  const processFile = useCallback(async (file: File) => {
    setParseError(null)
    setFileName(file.name)

    try {
      const text = await file.text()
      const parsed = await parseCSV(text)

      if (parsed.length < 2) {
        setParseError("File must have at least a header row and one data row.")
        return
      }

      const hdrs = parsed[0]
      const dataRows = parsed.slice(1).filter(r => r.some(cell => cell.trim()))

      if (dataRows.length === 0) {
        setParseError("No data rows found in the file.")
        return
      }

      setHeaders(hdrs)
      setRows(dataRows)

      // Auto-guess column mapping
      const mapping: Record<number, string> = {}
      hdrs.forEach((h, i) => {
        mapping[i] = guessMapping(h)
      })
      setColumnMap(mapping)
      setStep("preview")
    } catch {
      setParseError("Failed to parse the file. Please check it is a valid CSV.")
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  async function handleImport() {
    if (!eventId) return

    // Build mapped rows
    const mappedRows: { name: string; email: string; phone?: string; company?: string; designation?: string }[] = []

    // Find column indices for each field
    const nameCol = Object.entries(columnMap).find(([, v]) => v === "name")?.[0]
    const emailCol = Object.entries(columnMap).find(([, v]) => v === "email")?.[0]
    const phoneCol = Object.entries(columnMap).find(([, v]) => v === "phone")?.[0]
    const companyCol = Object.entries(columnMap).find(([, v]) => v === "company")?.[0]
    const designationCol = Object.entries(columnMap).find(([, v]) => v === "designation")?.[0]

    if (nameCol === undefined || emailCol === undefined) {
      setParseError("You must map at least Name and Email columns.")
      return
    }

    for (const row of rows) {
      mappedRows.push({
        name: row[parseInt(nameCol)] || "",
        email: row[parseInt(emailCol)] || "",
        phone: phoneCol !== undefined ? row[parseInt(phoneCol)] : undefined,
        company: companyCol !== undefined ? row[parseInt(companyCol)] : undefined,
        designation: designationCol !== undefined ? row[parseInt(designationCol)] : undefined,
      })
    }

    setStep("importing")
    setProgress(30)

    try {
      setProgress(60)
      const importResult = await importAttendees(eventId, ticketId, mappedRows)
      setProgress(100)
      setResult(importResult)
      setStep("done")
    } catch (err) {
      setResult({ imported: 0, skipped: 0, errors: [(err as Error).message] })
      setStep("done")
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-[#333]">Import Attendees from CSV</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Event / Ticket Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event *</label>
              <div className="relative">
                <select
                  value={eventId}
                  onChange={(e) => { setEventId(e.target.value); setTicketId("") }}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors appearance-none pr-8"
                >
                  <option value="">Select event...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Ticket</label>
              <div className="relative">
                <select
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors appearance-none pr-8"
                  disabled={!eventId}
                >
                  <option value="">No ticket</option>
                  {filteredTickets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Step: Upload */}
          {step === "upload" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                dragOver ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-[#e0e0e0] hover:border-[#ccc] hover:bg-[#fafafa]"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload size={32} className="mx-auto mb-4 text-[#bbb]" />
              <p className="text-sm text-[#666] mb-1">
                Drag & drop your CSV file here, or <span className="text-[#c9a84c] font-medium">click to browse</span>
              </p>
              <p className="text-[11px] text-[#aaa]">Supports .csv files</p>
            </div>
          )}

          {parseError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-500 text-sm">
              <AlertTriangle size={15} /> {parseError}
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#fafafa] border border-[#e0e0e0]">
                <FileSpreadsheet size={18} className="text-[#c9a84c]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#333]">{fileName}</span>
                  <span className="text-[11px] text-[#aaa] ml-2">{rows.length} rows found</span>
                </div>
                <button onClick={() => { setStep("upload"); setRows([]); setHeaders([]) }} className="text-[11px] text-[#888] hover:text-[#555] underline">
                  Change file
                </button>
              </div>

              {/* Column mapping */}
              <div>
                <h4 className="text-[11px] text-[#777] uppercase tracking-wider mb-3">Column Mapping</h4>
                <div className="space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-40 text-sm text-[#555] truncate" title={h}>{h || `Column ${i + 1}`}</div>
                      <div className="text-[11px] text-[#bbb]">maps to</div>
                      <div className="relative flex-1">
                        <select
                          value={columnMap[i] || ""}
                          onChange={(e) => setColumnMap(prev => ({ ...prev, [i]: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors appearance-none pr-8"
                        >
                          {FIELD_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              <div>
                <h4 className="text-[11px] text-[#777] uppercase tracking-wider mb-3">Preview (first 10 rows)</h4>
                <div className="rounded-lg border border-[#e0e0e0] overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                        {headers.map((h, i) => (
                          <th key={i} className="text-left px-3 py-2 text-[10px] font-semibold text-[#888] uppercase tracking-wider whitespace-nowrap">
                            {columnMap[i] ? <span className="text-[#c9a84c]">{columnMap[i]}</span> : <span className="text-[#ccc]">{h || `Col ${i + 1}`}</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((row, ri) => (
                        <tr key={ri} className="border-b border-[#eee] last:border-0">
                          {headers.map((_, ci) => (
                            <td key={ci} className="px-3 py-2 text-[#555] whitespace-nowrap max-w-[200px] truncate">
                              {row[ci] || ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 10 && (
                  <p className="text-[11px] text-[#aaa] mt-2">...and {rows.length - 10} more rows</p>
                )}
              </div>

              {parseError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-500 text-sm">
                  <AlertTriangle size={15} /> {parseError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setStep("upload"); setRows([]); setHeaders([]) }}
                  className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={!eventId}
                  className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> Import {rows.length} Attendees
                </button>
              </div>
            </>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="py-12 text-center">
              <Loader2 size={32} className="mx-auto mb-4 text-[#c9a84c] animate-spin" />
              <p className="text-sm text-[#666] mb-4">Importing attendees...</p>
              <div className="w-full max-w-xs mx-auto bg-[#f0f0f0] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#c9a84c] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-[#aaa] mt-2">{progress}%</p>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && result && (
            <div className="py-8 text-center space-y-4">
              {result.errors.length === 0 ? (
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              ) : (
                <AlertTriangle size={40} className="mx-auto text-amber-500" />
              )}

              <div>
                <p className="text-lg font-semibold text-[#333] mb-1">Import Complete</p>
                <p className="text-sm text-[#666]">
                  {result.imported} imported, {result.skipped} skipped (duplicates)
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="text-left max-h-48 overflow-y-auto rounded-lg border border-red-500/15 bg-red-500/5 p-4">
                  <p className="text-[11px] text-red-500 uppercase tracking-wider font-semibold mb-2">Errors ({result.errors.length})</p>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400 mb-1">{err}</p>
                  ))}
                </div>
              )}

              <button
                onClick={() => { onComplete(); onClose() }}
                className="w-full max-w-xs mx-auto py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
