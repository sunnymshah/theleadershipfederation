"use client"

/**
 * Generic list-row used by the in-builder Speakers / Sessions / Tickets /
 * Sponsors managers. A row shows:
 *   [optional avatar/logo] [name] [meta line]      [edit] [delete]
 *
 * Hovering exposes the edit/delete buttons. Clicking the row body fires
 * onEdit. Clicking the delete button fires onDelete after a confirm.
 */

import { type ReactNode } from "react"
import { Pencil, Trash2 } from "lucide-react"

export function EntityListItem({
  avatarSrc,
  avatarFallback,
  name,
  meta,
  onEdit,
  onDelete,
  trailing,
}: {
  avatarSrc?: string | null
  avatarFallback: string
  name: string
  meta?: string | null
  onEdit?: () => void
  onDelete?: () => void
  trailing?: ReactNode
}) {
  return (
    <div className="group relative flex items-center gap-3 px-3 py-2 mx-2 rounded-md hover:bg-[var(--z-bg,#fff)] border border-transparent hover:border-[var(--z-border,#e5e7eb)] transition-colors">
      {avatarSrc !== undefined && (
        avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt=""
            className="w-8 h-8 rounded-full object-cover shrink-0 bg-[var(--z-bg-alt,#f7f8fa)]"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-[var(--z-bg-alt,#f7f8fa)] flex items-center justify-center shrink-0 text-[11px] font-bold text-[var(--z-text-muted,#6b7280)]">
            {avatarFallback}
          </span>
        )
      )}
      <button
        type="button"
        onClick={onEdit}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-[13px] font-semibold text-[var(--z-text,#1f2937)] truncate">
          {name}
        </p>
        {meta && (
          <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] truncate mt-0.5">
            {meta}
          </p>
        )}
      </button>
      {trailing}
      <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${name}`}
            className="z-btn z-btn-icon"
          >
            <Pencil size={12} strokeWidth={1.5} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${name}`}
            className="z-btn z-btn-icon hover:!bg-red-50 hover:!text-red-700"
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </button>
        )}
      </span>
    </div>
  )
}
