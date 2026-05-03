"use client"

/**
 * Right-edge slide-in profile panel for the Speakers / Sessions /
 * Tickets / Sponsors / Exhibitors / Hotels managers (ITEM 2). One
 * panel renders any entity's view + edit modes via the `viewBody` /
 * `editForm` callbacks the consumer hands in.
 *
 * Layout: fixed right-0 top-0 bottom-0, w-[480px], slides in from the
 * right via translateX 200ms ease-out. Header carries title + Edit /
 * Save / Cancel + close X. Footer in edit mode shows Save (primary) +
 * Cancel (outline). Esc closes; backdrop click closes (in edit mode
 * with a confirm if dirty).
 */

import { useEffect, useState, type ReactNode } from "react"
import { Edit3, X, Loader2, Trash2 } from "lucide-react"

export function ProfilePanel<T>({
  open,
  item,
  title,
  mode,
  onClose,
  onModeChange,
  onSave,
  onDelete,
  viewBody,
  editForm,
}: {
  open: boolean
  item: T | null
  title: string
  mode: "view" | "edit"
  onClose: () => void
  onModeChange: (next: "view" | "edit") => void
  onSave: (next: T) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string }
  onDelete?: () => void | Promise<void> | Promise<{ success: boolean; error?: string }>
  viewBody: (item: T) => ReactNode
  editForm: (item: T, onChange: (next: T) => void) => ReactNode
}) {
  const [draft, setDraft] = useState<T | null>(item)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync draft when the selected item changes (e.g. user picks a
  // different row while panel is open).
  useEffect(() => {
    setDraft(item)
    setDirty(false)
    setError(null)
  }, [item])

  // Esc closes.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        attemptClose()
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, dirty])

  function attemptClose() {
    if (mode === "edit" && dirty) {
      if (!confirm("Discard unsaved changes?")) return
    }
    onClose()
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true); setError(null)
    const res = await onSave(draft)
    setSaving(false)
    if (!res.success) {
      setError(res.error ?? "Save failed")
      return
    }
    setDirty(false)
    onModeChange("view")
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!confirm("Delete this item? This cannot be undone.")) return
    await onDelete()
    onClose()
  }

  return (
    <>
      {/* Backdrop — click outside closes. */}
      <div
        className={`fixed inset-0 z-[110] bg-black/0 transition-opacity ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={attemptClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={title}
        aria-modal="false"
        className={`lf-profile-panel fixed top-0 right-0 bottom-0 z-[120] w-[480px] max-w-full bg-white shadow-2xl border-l border-[var(--z-border,#e5e7eb)] flex flex-col`}
        data-open={open ? "true" : "false"}
      >
        <header className="shrink-0 h-12 px-4 flex items-center gap-2 border-b border-[var(--z-border,#e5e7eb)] bg-white">
          <h2 className="flex-1 text-[13px] font-bold text-[var(--z-text,#1f2937)] truncate">{title}</h2>
          {mode === "view" ? (
            <button
              type="button"
              onClick={() => onModeChange("edit")}
              className="z-btn !text-[11px] inline-flex items-center gap-1.5"
            >
              <Edit3 size={11} /> Edit
            </button>
          ) : null}
          <button
            type="button"
            onClick={attemptClose}
            aria-label="Close panel"
            className="z-btn z-btn-icon"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {item && draft ? (
            mode === "view" ? (
              <div className="p-4">{viewBody(item)}</div>
            ) : (
              <div className="p-4 space-y-3">
                {editForm(draft, (next) => { setDraft(next); setDirty(true) })}
              </div>
            )
          ) : (
            <p className="p-4 text-[12px] text-[var(--z-text-muted,#6b7280)]">No item selected.</p>
          )}
        </div>

        {error && (
          <div className="px-4 py-2 text-[12px] text-red-600 bg-red-50 border-t border-red-200">
            {error}
          </div>
        )}

        {mode === "edit" && (
          <footer className="shrink-0 px-4 py-3 border-t border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg-alt,#f7f8fa)] flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="z-btn !text-red-600 hover:!bg-red-50 inline-flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => { setDraft(item); setDirty(false); setError(null); onModeChange("view") }}
              className="z-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="z-btn-primary"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              Save
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}
