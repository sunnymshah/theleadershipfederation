"use client"

/**
 * Right-click section → A/B test → this dialog.
 * Variant A is the section as it currently is; Variant B is a JSON-edited
 * copy of the same props. Traffic split + conversion event are picked
 * here, then `createABTest` saves a draft. The admin starts/stops the
 * test from /admin/events/{id}/ab-tests.
 */

import { useState, useTransition } from "react"
import { Beaker, X, Check, Loader2 } from "lucide-react"
import { createABTest } from "@/app/actions/abTestActions"

export function ABTestCreateDialog({
  open,
  onClose,
  eventId,
  pageKind,
  blockId,
  blockType,
  blockProps,
}: {
  open: boolean
  onClose: () => void
  eventId: string
  pageKind: string
  blockId: string
  blockType: string
  blockProps: Record<string, unknown>
}) {
  const [name, setName] = useState(`${blockType} test`)
  const [variantBJson, setVariantBJson] = useState(() => {
    try { return JSON.stringify(blockProps, null, 2) } catch { return "{}" }
  })
  const [trafficSplit, setTrafficSplit] = useState(50)
  const [conversion, setConversion] = useState("register-click")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!open) return null

  function save() {
    setError(null)
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(variantBJson) }
    catch { setError("Variant B must be valid JSON."); return }
    if (!name.trim()) { setError("Name is required."); return }
    start(async () => {
      const res = await createABTest({
        eventId,
        pageKind,
        blockId,
        name: name.trim(),
        variantBProps: parsed,
        trafficSplit,
        conversionEvent: conversion,
      })
      if (!res.success) { setError(res.error ?? "Couldn't create test."); return }
      // Bounce to reporting page so admin can hit Start.
      window.location.href = `/admin/events/${eventId}/ab-tests`
    })
  }

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl border border-[#1a1a2e]/10">
        <div className="flex items-center gap-2 px-5 h-12 border-b border-[#1a1a2e]/[0.06]">
          <Beaker size={14} className="text-[var(--lf-primary,#e7ab1c)]" />
          <h3 className="text-[13px] font-bold text-[#1a1a2e]">A/B test — {blockType}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto p-1.5 rounded text-[#1a1a2e]/55 hover:bg-[#1a1a2e]/[0.04]">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <label className="block">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[#1a1a2e]/55 mb-1">Test name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[#1a1a2e]/15 text-[14px]"
            />
          </label>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#1a1a2e]/55 mb-1">Variants</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-[#1a1a2e]/10 bg-[#1a1a2e]/[0.02] p-3">
                <p className="text-[12px] font-bold text-[#1a1a2e] mb-1">Variant A — control</p>
                <p className="text-[11px] text-[#1a1a2e]/55">The section as it is now. Locked while the test runs.</p>
              </div>
              <div className="rounded-md border border-[#1a1a2e]/10 p-3">
                <p className="text-[12px] font-bold text-[#1a1a2e] mb-1">Variant B</p>
                <p className="text-[11px] text-[#1a1a2e]/55 mb-2">Edit the JSON props for the alternate version. Only changed fields override A.</p>
                <textarea
                  value={variantBJson}
                  onChange={(e) => setVariantBJson(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  className="w-full px-2 py-1.5 rounded border border-[#1a1a2e]/15 font-mono text-[11px] leading-relaxed"
                />
              </div>
            </div>
          </div>

          <label className="block">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[#1a1a2e]/55 mb-1">
              Traffic split — {trafficSplit}% to A, {100 - trafficSplit}% to B
            </span>
            <input
              type="range" min={5} max={95} step={5}
              value={trafficSplit}
              onChange={(e) => setTrafficSplit(parseInt(e.target.value, 10))}
              className="w-full accent-[#e7ab1c]"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[#1a1a2e]/55 mb-1">Conversion event</span>
            <select
              value={conversion}
              onChange={(e) => setConversion(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[#1a1a2e]/15 text-[14px]"
            >
              <option value="register-click">Click on a button tagged data-ab-convert (default)</option>
              <option value="form-submission">Microsite form submission</option>
              <option value="registration-paid">Paid registration (Razorpay)</option>
            </select>
          </label>

          {error && (
            <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#1a1a2e]/[0.06] flex items-center gap-2">
          <p className="text-[11px] text-[#1a1a2e]/55 flex-1">
            Status will be <span className="font-mono">draft</span>. Hit <span className="font-mono">Start</span> in the reporting page to roll out.
          </p>
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
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md text-[12px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white hover:bg-[#d49c10] disabled:opacity-60"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Save draft
          </button>
        </div>
      </div>
    </div>
  )
}
