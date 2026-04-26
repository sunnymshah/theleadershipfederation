"use client"

/**
 * "Generate with AI" event-setup wizard. Single textarea → Gemini drafts
 * Hero copy, About body, FAQs, ticket blurbs, etc., across all 12
 * standard pages. Replaces the empty-state hand-edit flow.
 */

import { useState, useTransition } from "react"
import { Sparkles, X, Check, Loader2, AlertCircle } from "lucide-react"
import { aiGenerateInitialContent } from "@/app/actions/aiActions"

const PLACEHOLDER = `Example:
The 2026 GCC Leadership Conclave brings together 500 chairmen, founders and policy leaders for two days at the Taj Lands End, Mumbai. Day 1 focuses on India's GCC strategy, with keynotes from RBI and SEBI. Day 2 is a closed-room workshop on capital allocation and AI in regulated industries. Format: 60% panels, 30% off-record dialogues, 10% awards. Tickets: invite-only with three tiers — Founder, Operator, Observer.`

export function AIWizardDialog({
  open,
  onClose,
  eventId,
  onComplete,
}: {
  open: boolean
  onClose: () => void
  eventId: string
  /** Called when generation finishes successfully — caller typically
   *  reloads the editor data so the new content shows up immediately. */
  onComplete?: () => void
}) {
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pages, setPages] = useState<number | null>(null)
  const [pending, start] = useTransition()

  if (!open) return null

  function generate() {
    setError(null); setPages(null)
    if (description.trim().length < 40) {
      setError("Add a bit more detail (at least a couple of sentences).")
      return
    }
    start(async () => {
      const res = await aiGenerateInitialContent({ eventId, description })
      if (!res.success) { setError(res.error ?? "AI failed"); return }
      setPages(res.pages ?? 0)
      onComplete?.()
    })
  }

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !pending) onClose() }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl border border-[#1a1a2e]/10">
        <div className="flex items-center gap-2 px-5 h-12 border-b border-[#1a1a2e]/[0.06]">
          <Sparkles size={14} className="text-[var(--lf-primary,#e7ab1c)]" />
          <h3 className="text-[13px] font-bold text-[#1a1a2e]">Generate microsite with AI</h3>
          <button type="button" onClick={onClose} aria-label="Close" disabled={pending} className="ml-auto p-1.5 rounded text-[#1a1a2e]/55 hover:bg-[#1a1a2e]/[0.04] disabled:opacity-50">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {pages === null ? (
            <>
              <p className="text-[13px] text-[#1a1a2e]/70 leading-relaxed">
                Describe the event in your own words. Gemini will draft the Hero copy, About section,
                FAQs, ticket blurbs, agenda intro and venue copy across all 12 standard pages.
                You can still edit any of it afterwards.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                placeholder={PLACEHOLDER}
                disabled={pending}
                className="w-full px-3 py-2 rounded-md border border-[#1a1a2e]/15 text-[13px] leading-relaxed font-sans"
              />
              <div className="flex items-center gap-2 text-[11px] text-[#1a1a2e]/55">
                <AlertCircle size={12} />
                Existing content gets overwritten. Run on a fresh event, not a polished one.
              </div>
              {error && (
                <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
              )}
            </>
          ) : (
            <div className="py-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50">
                <Check size={20} className="text-emerald-600" />
              </div>
              <p className="text-[14px] font-semibold text-[#1a1a2e]">
                Done — updated {pages} pages.
              </p>
              <p className="text-[12px] text-[#1a1a2e]/65 max-w-sm mx-auto">
                Reload the editor to see the new content. You can still edit anything by hand.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#1a1a2e]/[0.06] flex items-center justify-end gap-2">
          {pages === null ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="inline-flex items-center px-4 h-9 rounded-md text-[12px] font-semibold text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/[0.04] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md text-[12px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white hover:bg-[#d49c10] disabled:opacity-60"
              >
                {pending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {pending ? "Drafting…" : "Generate"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { onClose(); window.location.reload() }}
              className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md text-[12px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white hover:bg-[#d49c10]"
            >
              Reload to view
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
