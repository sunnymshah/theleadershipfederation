"use client"

/**
 * In-place device-frame preview.
 *
 * Opens an iframe sized to a real device width (Mobile / Tablet /
 * Desktop) so the admin can see how the public page looks at each
 * breakpoint WITHOUT leaving the builder. Replaces the old
 * "open in new tab" Preview Mobile flow.
 *
 * The iframe loads the public page directly (`/events/<slug>`), so
 * what you see is what visitors see — including all React Server
 * Components and Tailwind styles.
 */

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  X, Monitor, Tablet, Smartphone, RefreshCw, ExternalLink,
  RotateCcw,
} from "lucide-react"

type Device = "desktop" | "tablet" | "mobile"

const DEVICE_WIDTH: Record<Device, number> = {
  desktop: 1280,
  tablet:  768,
  mobile:  390,
}
const DEVICE_HEIGHT: Record<Device, number> = {
  desktop: 800,
  tablet:  1024,
  mobile:  844,
}

export type PreviewMode = "visitor" | "attendee"

export function DevicePreviewModal({
  open,
  onClose,
  baseUrl,
  initialDevice = "desktop",
  initialMode = "visitor",
}: {
  open: boolean
  onClose: () => void
  /** The public-page URL to preview (e.g. "/events/some-slug"). */
  baseUrl: string
  initialDevice?: Device
  initialMode?: PreviewMode
}) {
  const [device, setDevice] = useState<Device>(initialDevice)
  const [mode, setMode] = useState<PreviewMode>(initialMode)
  const [rotated, setRotated] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  if (typeof document === "undefined") return null

  // Width / height (rotation flips them for tablet/mobile only).
  const baseW = DEVICE_WIDTH[device]
  const baseH = DEVICE_HEIGHT[device]
  const w = rotated && device !== "desktop" ? baseH : baseW
  const h = rotated && device !== "desktop" ? baseW : baseH

  // Compose preview URL with mode flag.
  const sep = baseUrl.includes("?") ? "&" : "?"
  const previewUrl = `${baseUrl}${sep}preview-mode=${mode}&preview-device=${device}`

  function copyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    void navigator.clipboard?.writeText(`${origin}${previewUrl}`)
  }

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Device preview"
      className="fixed inset-0 z-[1000] flex flex-col bg-[#1a1a2e]/85 backdrop-blur-sm"
    >
      {/* Toolbar */}
      <header className="shrink-0 h-14 px-4 flex items-center gap-3 bg-[var(--z-bg,#fff)] border-b border-[var(--z-border,#e5e7eb)]">
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)] mr-2">
          Device preview
        </h2>

        {/* Device toggle */}
        <div className="inline-flex items-center gap-0.5 bg-[var(--z-bg-alt,#f7f8fa)] rounded-md p-0.5">
          <DeviceBtn label="Desktop" active={device === "desktop"} onClick={() => setDevice("desktop")}>
            <Monitor size={14} strokeWidth={1.5} />
          </DeviceBtn>
          <DeviceBtn label="Tablet" active={device === "tablet"} onClick={() => setDevice("tablet")}>
            <Tablet size={14} strokeWidth={1.5} />
          </DeviceBtn>
          <DeviceBtn label="Mobile" active={device === "mobile"} onClick={() => setDevice("mobile")}>
            <Smartphone size={14} strokeWidth={1.5} />
          </DeviceBtn>
        </div>

        {/* Width readout */}
        <span className="text-[11px] font-medium text-[var(--z-text-muted,#6b7280)] tabular-nums">
          {w}×{h}
        </span>

        {/* Rotate (tablet/mobile only) */}
        {device !== "desktop" && (
          <button
            type="button"
            onClick={() => setRotated((r) => !r)}
            aria-label="Rotate"
            title="Rotate"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
          >
            <RotateCcw size={14} strokeWidth={1.5} />
          </button>
        )}

        <span className="w-px h-5 bg-[var(--z-border,#e5e7eb)] mx-1" />

        {/* Mode toggle */}
        <div className="inline-flex items-center gap-0.5 bg-[var(--z-bg-alt,#f7f8fa)] rounded-md p-0.5 text-[11px] font-medium">
          <ModeBtn label="Visitor"   active={mode === "visitor"}  onClick={() => setMode("visitor")} />
          <ModeBtn label="Attendee"  active={mode === "attendee"} onClick={() => setMode("attendee")} />
        </div>

        <span className="flex-1" />

        {/* Reload */}
        <button
          type="button"
          onClick={() => setIframeKey((k) => k + 1)}
          aria-label="Reload preview"
          title="Reload preview"
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
        >
          <RefreshCw size={14} strokeWidth={1.5} />
        </button>

        {/* Copy link */}
        <button
          type="button"
          onClick={copyLink}
          className="z-btn text-[12px]"
        >
          Copy link
        </button>

        {/* Open in new tab */}
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in new tab"
          title="Open in new tab"
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
        >
          <ExternalLink size={14} strokeWidth={1.5} />
        </a>

        <span className="w-px h-5 bg-[var(--z-border,#e5e7eb)] mx-1" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          title="Close (Esc)"
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </header>

      {/* Stage */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <div
          className="bg-white rounded-[18px] overflow-hidden shadow-2xl border border-[var(--z-border,#e5e7eb)] transition-all duration-200"
          style={{ width: w, height: Math.min(h, /* don't overflow viewport */ window.innerHeight - 130) }}
        >
          <iframe
            key={iframeKey}
            src={previewUrl}
            className="block w-full h-full border-0"
            title="Public-page preview"
          />
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

function DeviceBtn({
  label, active, onClick, children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
        active
          ? "bg-white text-[var(--z-text,#1f2937)] shadow-sm"
          : "text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)]"
      }`}
    >
      {children}
    </button>
  )
}

function ModeBtn({
  label, active, onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center px-2.5 h-7 rounded-md transition-colors ${
        active
          ? "bg-white text-[var(--z-text,#1f2937)] shadow-sm"
          : "text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)]"
      }`}
    >
      {label}
    </button>
  )
}
