"use client"

/**
 * Zoho-style secondary panel — the wide left column that appears when a
 * primary-rail item is active. Width 288px (w-72).
 *
 * Provides:
 *   - Sticky header with title + optional close button (close hides the
 *     panel by setting active rail to null in the caller)
 *   - Optional search input under the header
 *   - Scrollable body that the caller fills (block tiles, speaker list,
 *     pages tree, etc.)
 */

import { type ReactNode } from "react"
import { X, Search } from "lucide-react"

export function SecondaryPanel({
  title,
  onClose,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  children,
}: {
  title: string
  onClose?: () => void
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (v: string) => void
  children: ReactNode
}) {
  return (
    <aside
      className="w-72 shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col"
      aria-label={title}
    >
      {/* Header */}
      <div className="shrink-0 h-12 px-4 flex items-center justify-between border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)] truncate">
          {title}
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="z-btn z-btn-icon"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Search */}
      {onSearchChange !== undefined && (
        <div className="shrink-0 p-3 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
          <div className="relative">
            <Search
              size={14}
              strokeWidth={1.5}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--z-text-subtle,#9ca3af)]"
            />
            <input
              type="search"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder ?? "Search…"}
              className="z-input pl-7"
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </aside>
  )
}
