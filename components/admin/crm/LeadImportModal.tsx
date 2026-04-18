"use client"

/**
 * Zoho-style 3-step CSV import.
 *
 *   1. Upload   — drag-and-drop a .csv file. Parses client-side.
 *   2. Map      — detected columns on the left, target fields on the
 *                 right. Auto-maps via IMPORT_FIELD_ALIASES.
 *   3. Review   — confirms counts, runs the server action, shows the
 *                 result (created / duplicates / errors).
 *
 * CSV parsing is a hand-rolled RFC-4180-ish reader — handles quoted
 * fields, escaped quotes, and commas inside quotes. No external dep.
 */

import { useMemo, useRef, useState } from "react"
import {
  X, Upload, FileText, ArrowRight, ArrowLeft, Check, Loader2,
  AlertTriangle, Download,
} from "lucide-react"
import {
  importLeads,
  type ImportMapping, type ImportResult, type LeadSource,
} from "@/app/actions/crmLeadActions"
import {
  IMPORT_FIELD_ALIASES,
  IMPORT_FIELD_OPTIONS,
  SOURCE_LABELS,
  SOURCE_OPTIONS,
} from "./leadConstants"

type Member = { user_id: string; email: string; role: string }

interface Props {
  members: Member[]
  onClose: () => void
  onDone: () => void
}

type Step = "upload" | "map" | "review" | "done"

export function LeadImportModal({ members, onClose, onDone }: Props) {
  const [step, setStep] = useState<Step>("upload")
  const [fileName, setFileName] = useState<string>("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<ImportMapping>({})
  const [source, setSource] = useState<LeadSource>("import")
  const [ownerId, setOwnerId] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setFileName(file.name)
    try {
      const text = await file.text()
      const parsed = parseCSV(text)
      if (!parsed.headers.length) throw new Error("Could not find any headers.")
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      // Auto-map
      const auto: ImportMapping = {}
      for (const h of parsed.headers) {
        const key = h.trim().toLowerCase()
        auto[h] = (IMPORT_FIELD_ALIASES[key] ?? "ignore") as ImportMapping[string]
      }
      setMapping(auto)
      setStep("map")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file.")
    }
  }

  async function runImport() {
    setBusy(true); setError(null)
    const r = await importLeads(rows, mapping, {
      source,
      ownerId: ownerId || null,
    })
    setBusy(false)
    if (r.success) {
      setResult(r.result)
      setStep("done")
      onDone()
    } else {
      setError(r.error)
    }
  }

  const mappedFirstNameCol = useMemo(
    () => Object.entries(mapping).find(([, v]) => v === "firstName")?.[0],
    [mapping],
  )
  const canMap = !!mappedFirstNameCol

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[780px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#eee] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1a1a2e]">Import leads</h2>
            <p className="text-[12px] text-[#888] mt-0.5">
              Upload a CSV · map columns · we'll dedupe by email
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-[#888] hover:text-[#1a1a2e] hover:bg-[#f5f5f5]">
            <X size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-2.5 bg-[#fafafa] border-b border-[#eee] flex items-center gap-3 text-[11px]">
          <StepDot n={1} label="Upload"  active={step === "upload"} done={step !== "upload"} />
          <div className="flex-1 h-px bg-[#e5e7eb]" />
          <StepDot n={2} label="Map"     active={step === "map"}    done={step === "review" || step === "done"} />
          <div className="flex-1 h-px bg-[#e5e7eb]" />
          <StepDot n={3} label="Review"  active={step === "review"} done={step === "done"} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === "upload" && (
            <UploadStep
              fileName={fileName}
              onPick={() => fileRef.current?.click()}
              onDrop={(f) => handleFile(f)}
              onDownloadSample={() => downloadSample()}
              error={error}
            />
          )}

          {step === "map" && (
            <MapStep
              headers={headers}
              rows={rows}
              mapping={mapping}
              onChange={(h, v) => setMapping({ ...mapping, [h]: v as ImportMapping[string] })}
              source={source}
              onSourceChange={setSource}
              ownerId={ownerId}
              onOwnerChange={setOwnerId}
              members={members}
            />
          )}

          {step === "review" && (
            <ReviewStep
              rowCount={rows.length}
              mapping={mapping}
              source={source}
              busy={busy}
              error={error}
              onRun={runImport}
            />
          )}

          {step === "done" && result && (
            <DoneStep result={result} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#eee] bg-[#fafafa] flex items-center justify-between">
          <div className="text-[11px] text-[#aaa]">
            {rows.length > 0 && step !== "done" && `${rows.length} row${rows.length > 1 ? "s" : ""} detected`}
          </div>
          <div className="flex items-center gap-2">
            {step === "map" && (
              <>
                <button onClick={() => setStep("upload")}
                  className="px-3 py-1.5 text-[12px] text-[#888] hover:text-[#1a1a2e] inline-flex items-center gap-1">
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  disabled={!canMap}
                  className="px-4 py-1.5 rounded-md bg-[#1a1a2e] text-white text-[12px] font-medium disabled:opacity-40 hover:bg-[#2a2a3e] inline-flex items-center gap-1"
                >
                  Next <ArrowRight size={13} />
                </button>
              </>
            )}
            {step === "review" && !busy && (
              <button onClick={() => setStep("map")}
                className="px-3 py-1.5 text-[12px] text-[#888] hover:text-[#1a1a2e] inline-flex items-center gap-1">
                <ArrowLeft size={13} /> Back
              </button>
            )}
            {step === "done" && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-md bg-[#c9a84c] text-[#1a1a2e] text-[12px] font-bold hover:bg-[#d4b85c] inline-flex items-center gap-1"
              >
                Done
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
      </div>
    </div>
  )
}

/* ── Step components ───────────────────────────────────────────────── */

function UploadStep({
  fileName, onPick, onDrop, onDownloadSample, error,
}: {
  fileName: string
  onPick: () => void
  onDrop: (f: File) => void
  onDownloadSample: () => void
  error: string | null
}) {
  const [over, setOver] = useState(false)
  return (
    <div className="p-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onDrop(f)
        }}
        onClick={onPick}
        className={`
          border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors
          ${over
            ? "border-[#c9a84c] bg-[#fffcf2]"
            : "border-[#e5e7eb] bg-[#fafafa] hover:border-[#c9a84c]"}
        `}
      >
        <Upload size={28} className="mx-auto text-[#aaa] mb-3" />
        <p className="text-[14px] text-[#1a1a2e] font-medium">
          {fileName ? fileName : "Drag a CSV here, or click to browse"}
        </p>
        <p className="text-[11px] text-[#aaa] mt-1.5">
          .csv file. First row should contain column headers.
        </p>
      </div>

      <button
        onClick={onDownloadSample}
        className="mt-4 text-[12px] text-[#888] hover:text-[#1a1a2e] inline-flex items-center gap-1.5"
      >
        <Download size={12} /> Download sample template
      </button>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-[12px] text-red-700 flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </div>
  )
}

function MapStep({
  headers, rows, mapping, onChange,
  source, onSourceChange, ownerId, onOwnerChange, members,
}: {
  headers: string[]
  rows: Record<string, string>[]
  mapping: ImportMapping
  onChange: (header: string, value: string) => void
  source: LeadSource
  onSourceChange: (s: LeadSource) => void
  ownerId: string
  onOwnerChange: (id: string) => void
  members: Member[]
}) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-1">
          Map each CSV column to a lead field
        </h3>
        <p className="text-[11px] text-[#888]">
          First name is required. Everything else is optional. Unmapped columns will be ignored.
        </p>
      </div>

      {/* Defaults for every imported row */}
      <div className="bg-[#fafafa] border border-[#eee] rounded-lg p-3 mb-5 grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-[#888] font-medium">Default source</label>
          <select
            value={source}
            onChange={(e) => onSourceChange(e.target.value as LeadSource)}
            className="mt-1 w-full text-[12px] border border-[#e5e7eb] rounded px-2 py-1.5 bg-white"
          >
            {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-[#888] font-medium">Default owner</label>
          <select
            value={ownerId}
            onChange={(e) => onOwnerChange(e.target.value)}
            className="mt-1 w-full text-[12px] border border-[#e5e7eb] rounded px-2 py-1.5 bg-white"
          >
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
          </select>
        </div>
      </div>

      {/* Mapping table */}
      <div className="border border-[#eee] rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-[#fafafa] text-[10px] uppercase tracking-wider text-[#888]">
            <tr>
              <th className="text-left px-3 py-2">CSV column</th>
              <th className="text-left px-3 py-2">Sample</th>
              <th className="text-left px-3 py-2">Map to</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((h) => (
              <tr key={h} className="border-t border-[#eee]">
                <td className="px-3 py-2 font-medium text-[#333]">
                  <FileText size={11} className="inline mr-1.5 text-[#ccc]" />{h}
                </td>
                <td className="px-3 py-2 text-[#888] max-w-[220px] truncate">
                  {rows[0]?.[h] ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={mapping[h] ?? "ignore"}
                    onChange={(e) => onChange(h, e.target.value)}
                    className="border border-[#e5e7eb] rounded px-2 py-1 bg-white"
                  >
                    {IMPORT_FIELD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReviewStep({
  rowCount, mapping, source, busy, error, onRun,
}: {
  rowCount: number
  mapping: ImportMapping
  source: LeadSource
  busy: boolean
  error: string | null
  onRun: () => void
}) {
  const mappedFields = Object.values(mapping).filter((v) => v !== "ignore")
  return (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] mb-4">
        <Check size={22} />
      </div>
      <h3 className="text-[15px] font-semibold text-[#1a1a2e] mb-1">
        Ready to import {rowCount} row{rowCount > 1 ? "s" : ""}
      </h3>
      <p className="text-[12px] text-[#888] mb-6">
        {mappedFields.length} field{mappedFields.length > 1 ? "s" : ""} will be imported.
        Default source: <b>{SOURCE_LABELS[source]}</b>. We'll skip any lead whose email
        already exists.
      </p>
      <button
        onClick={onRun}
        disabled={busy}
        className="px-5 py-2 rounded-md bg-[#1a1a2e] text-white text-[13px] font-medium hover:bg-[#2a2a3e] disabled:opacity-40 inline-flex items-center gap-2"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        Import now
      </button>
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-[12px] text-red-700 max-w-md mx-auto">
          {error}
        </div>
      )}
    </div>
  )
}

function DoneStep({ result }: { result: ImportResult }) {
  return (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mb-4">
        <Check size={26} />
      </div>
      <h3 className="text-[16px] font-semibold text-[#1a1a2e] mb-1">
        Imported {result.created} lead{result.created !== 1 ? "s" : ""}
      </h3>
      {result.skippedDuplicates > 0 && (
        <p className="text-[12px] text-[#888] mb-1">
          Skipped {result.skippedDuplicates} duplicate{result.skippedDuplicates !== 1 ? "s" : ""} (by email).
        </p>
      )}
      {result.errors.length > 0 && (
        <div className="mt-4 text-left max-w-md mx-auto">
          <div className="text-[12px] text-red-700 mb-1.5">
            {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} had errors:
          </div>
          <ul className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-[11px] text-red-700 space-y-0.5 max-h-[160px] overflow-y-auto">
            {result.errors.map((e, i) => (
              <li key={i}>Row {e.row}: {e.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ── Stepper dot ───────────────────────────────────────────────────── */

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`
          w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-semibold
          ${done ? "bg-emerald-500 text-white"
            : active ? "bg-[#1a1a2e] text-white"
            : "bg-[#e5e7eb] text-[#888]"}
        `}
      >
        {done ? <Check size={11} /> : n}
      </span>
      <span className={`text-[11px] ${active ? "text-[#1a1a2e] font-medium" : "text-[#888]"}`}>{label}</span>
    </div>
  )
}

/* ── CSV parser (RFC-4180-ish) ─────────────────────────────────────── */

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else {
      if (c === '"') inQuotes = true
      else if (c === ",") { row.push(field); field = "" }
      else if (c === "\n") { row.push(field); lines.push(row); row = []; field = "" }
      else if (c === "\r") { /* skip */ }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); lines.push(row) }

  const nonEmpty = lines.filter((r) => r.some((c) => c.trim() !== ""))
  if (!nonEmpty.length) return { headers: [], rows: [] }
  const headers = nonEmpty[0].map((h) => h.trim())
  const rows = nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim() })
    return obj
  })
  return { headers, rows }
}

/* ── Sample template ───────────────────────────────────────────────── */

function downloadSample() {
  const csv = [
    "First Name,Last Name,Email,Phone,Company,Job Title,City,Country,Source,Rating,Tags",
    "Ananya,Sharma,ananya@example.com,+91 98765 43210,Acme Pvt Ltd,Founder,Mumbai,India,referral,hot,priority,inbound",
    "Rohan,Mehta,rohan@example.in,+91 98111 22333,Mehta Industries,CEO,Delhi,India,linkedin,warm,outbound",
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "leads-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}
