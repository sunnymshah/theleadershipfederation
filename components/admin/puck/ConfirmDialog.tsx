"use client"

/**
 * ConfirmDialog — replaces window.confirm() for destructive operations
 * (e.g. deleting a sub-page). Renders into document.body via createPortal.
 *
 * Defaults are tuned for delete: red Confirm button, focuses Cancel by
 * default so a stray Enter doesn't drop a page. Pass tone="default" to
 * use a neutral confirm button.
 */

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

export type ConfirmDialogProps = {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "danger" | "default"
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => cancelRef.current?.focus(), 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onCancel])

  if (!open) return null
  if (typeof document === "undefined") return null

  const confirmCls =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-[#1a1a2e] text-white hover:bg-[#2a2a4e]"

  const node = (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1a1a2e]/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm mx-4 rounded-xl bg-white shadow-2xl border border-[#1a1a2e]/10 p-5">
        <h2 id="confirm-dialog-title" className="text-base font-bold text-[#1a1a2e] mb-1">
          {title}
        </h2>
        {message && <p className="text-[13px] text-[#1a1a2e]/70 leading-relaxed">{message}</p>}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-[13px] font-medium text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-bold ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
