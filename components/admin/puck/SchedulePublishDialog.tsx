"use client"

/**
 * Schedule-publish modal — pick a future timestamp, persists to
 * events.builder_scheduled_publish_at. The /api/cron/publish-scheduled
 * cron sweeps every 5 minutes and fires publishBuilderAtomic when due.
 */

import { useEffect, useState, useTransition } from "react"
import { Calendar, Loader2, X, Check, Trash2 } from "lucide-react"
import {
  setScheduledPublish,
  getScheduledPublish,
} from "@/app/actions/scheduledPublishActions"

function pad(n: number) { return n.toString().padStart(2, "0") }
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SchedulePublishDialog({
  eventId,
  open,
  onClose,
}: {
  eventId: string
  open: boolean
  onClose: () => void
}) {
  const [value, setValue] = useState("")
  const [existing, setExisting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void getScheduledPublish(eventId).then((res) => {
      if (cancelled) return
      setExisting(res.at)
      if (res.at) setValue(toLocalInput(new Date(res.at)))
      else {
        const t = new Date()
        t.setHours(t.getHours() + 1, 0, 0, 0)
        setValue(toLocalInput(t))
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [open, eventId])

  if (!open) return null

  function save() {
    setError(null)
    const local = new Date(value)
    if (Number.isNaN(local.getTime())) { setError("Pick a valid date and time."); return }
    if (local.getTime() < Date.now()) { setError("Pick a time in the future."); return }
    start(async () => {
      const res = await setScheduledPublish(eventId, local.toISOString())
      if (!res.success) { setError(res.error ?? "Couldn't save."); return }
      setExisting(local.toISOString())
      onClose()
    })
  }
  function clear() {
    start(async () => {
      const res = await setScheduledPublish(eventId, null)
      if (!res.success) { setError(res.error ?? "Couldn't clear."); return }
      setExisting(null)
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-[#1a1a2e]/10">
        <div className="flex items-center gap-2 px-5 h-12 border-b border-[#1a1a2e]/[0.06]">
          <Calendar size={14} className="text-[var(--lf-primary,#e7ab1c)]" />
          <h3 className="text-[13px] font-bold text-[#1a1a2e]">Schedule publish</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto p-1.5 rounded text-[#1a1a2e]/55 hover:bg-[#1a1a2e]/[0.04]">
            <X size={14} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-[12px] text-[#1a1a2e]/65 leading-relaxed">
            We&apos;ll publish the latest draft at the time you choose. Cron runs every 5 minutes,
            so the actual publish may land up to 5 minutes after the time below.
          </p>
          {loading ? (
            <div className="py-6 text-center text-[#1a1a2e]/45 text-sm">
              <Loader2 size={16} className="animate-spin mx-auto" />
            </div>
          ) : (
            <label className="block">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[#1a1a2e]/55 mb-1">Time</span>
              <input
                type="datetime-local"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#1a1a2e]/15 bg-white text-[14px]"
              />
            </label>
          )}
          {existing && (
            <p className="text-[11px] text-[#1a1a2e]/55">
              Currently scheduled for{" "}
              <span className="font-semibold text-[#1a1a2e]">{new Date(existing).toLocaleString()}</span>
            </p>
          )}
          {error && (
            <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
          )}
        </div>
        <div className="px-5 py-3 border-t border-[#1a1a2e]/[0.06] flex items-center gap-2">
          {existing && (
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[12px] font-semibold text-red-700 hover:bg-red-50 border border-red-200"
            >
              <Trash2 size={12} /> Clear schedule
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex items-center px-4 h-9 rounded-md text-[12px] font-semibold text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/[0.04]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || loading}
              className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md text-[12px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white hover:bg-[#d49c10] disabled:opacity-60"
            >
              {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
