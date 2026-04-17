"use client"

/**
 * ─── IMAGE UPLOAD + CROP ─────────────────────────────────────────────
 *
 * A self-contained admin picker that:
 *   1. Accepts a file (drag/drop or click)
 *   2. Lets the user pan + zoom the image inside a fixed-aspect-ratio
 *      crop frame (no external deps — plain DOM + canvas)
 *   3. Exports the cropped region as a Base64 JPEG/PNG
 *   4. Uploads via uploadImageDataUrl() and calls back with the URL
 *
 * Usage:
 *   <ImageUploadCrop
 *     value={imageUrl}
 *     aspectRatio={16/9}
 *     onChange={(url) => setImageUrl(url)}
 *     folder="sections"
 *   />
 *
 * aspectRatio of 0 = "free" (no crop frame, upload as-is).
 */

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { Crop, Loader2, Trash2, Upload, ZoomIn, ZoomOut, X } from "lucide-react"
import { uploadImageDataUrl, deleteImage } from "@/app/actions/uploadActions"

type Folder = "speakers" | "events" | "sponsors" | "sections" | "general"

export function ImageUploadCrop({
  value,
  onChange,
  aspectRatio = 16 / 9,
  folder = "sections",
  label = "Image",
  help,
}: {
  value: string | null | undefined
  onChange: (url: string | null) => void
  /** width / height. Pass 0 for "no crop — just upload as-is". */
  aspectRatio?: number
  folder?: Folder
  label?: string
  help?: string
}) {
  const [picking, setPicking] = useState<string | null>(null) // object URL of picked but uncropped file
  const [pickedName, setPickedName] = useState<string>("")
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState("")

  const imgRef = useRef<HTMLImageElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)

  // ── Pick / drop / paste ────────────────────────────────────────────
  const onPickFile = useCallback((file: File) => {
    setError(null)
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max 5 MB.`)
      return
    }
    setPicking(URL.createObjectURL(file))
    setPickedName(file.name)
    setOffset({ x: 0, y: 0 })
    setZoom(1)
  }, [])

  // ── Drag to pan ─────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return
    setOffset({ x: e.clientX - drag.x, y: e.clientY - drag.y })
  }
  function onPointerUp() {
    setDrag(null)
  }

  // ── Apply crop → canvas → dataUrl → upload ─────────────────────────
  async function applyCrop() {
    if (!picking || !imgRef.current || !frameRef.current) return
    setUploading(true)
    setError(null)

    try {
      const frameRect = frameRef.current.getBoundingClientRect()
      const imgEl = imgRef.current
      const natW = imgEl.naturalWidth
      const natH = imgEl.naturalHeight
      const renderedW = imgEl.getBoundingClientRect().width
      const renderedH = imgEl.getBoundingClientRect().height
      const scale = natW / renderedW // how many source pixels per displayed pixel

      // Frame is centered within the scroll-area — compute what slice of the
      // source image lies under the crop frame.
      const imgRect = imgEl.getBoundingClientRect()
      const cropScreenX = frameRect.left - imgRect.left
      const cropScreenY = frameRect.top - imgRect.top

      const sx = cropScreenX * scale
      const sy = cropScreenY * scale
      const sw = frameRect.width * scale
      const sh = frameRect.height * scale

      const outW = Math.min(1600, Math.round(sw))
      const outH = Math.min(1600, Math.round(sh))
      const canvas = document.createElement("canvas")
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, outW, outH)

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9)

      const res = await uploadImageDataUrl(dataUrl, folder, pickedName || "cropped")
      if (!res.success) {
        setError(res.error)
        setUploading(false)
        return
      }
      onChange(res.url)
      setPicking(null)
      setUploading(false)
    } catch (err) {
      setError((err as Error).message)
      setUploading(false)
    }
  }

  async function removeCurrent() {
    if (!value) return
    if (!confirm("Remove this image?")) return
    onChange(null)
    void deleteImage(value).catch(() => {}) // fire-and-forget cleanup
  }

  const frameStyle =
    aspectRatio > 0
      ? { aspectRatio: String(aspectRatio), width: "100%", maxWidth: "520px" }
      : { width: "100%", maxWidth: "520px", aspectRatio: "16/9" }

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold text-[#888] uppercase tracking-wider">
        {label}
      </label>

      {/* Empty / current-image states */}
      {!picking && value && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-white relative shrink-0">
            <Image src={value} alt="" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900">Image set</p>
            <p className="text-[11px] text-emerald-700 truncate">{value}</p>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-[#1a1a2e] hover:bg-gray-50 cursor-pointer">
            <Upload size={12} /> Change
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onPickFile(e.target.files[0])} />
          </label>
          <button
            type="button"
            onClick={removeCurrent}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
            title="Remove image"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {!picking && !value && (
        <div className="space-y-2">
          <label
            className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/5 transition-colors"
            onDragOver={(e) => { e.preventDefault() }}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files?.[0]
              if (file) onPickFile(file)
            }}
          >
            <Upload size={22} className="text-[#bbb] mb-2" />
            <span className="text-sm text-[#666]">Drag & drop, or <span className="text-[#c9a84c] font-semibold">click to upload</span></span>
            <span className="text-[11px] text-[#aaa] mt-1">JPG · PNG · WebP — max 5 MB</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && e.target.files[0] && onPickFile(e.target.files[0])}
            />
          </label>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowUrlInput((v) => !v)}
              className="text-[#888] hover:text-[#1a1a2e] underline"
            >
              …or paste an image URL
            </button>
            {showUrlInput && (
              <div className="flex-1 flex items-center gap-2">
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                />
                <button
                  type="button"
                  onClick={() => { if (urlInput.trim()) { onChange(urlInput.trim()); setUrlInput(""); setShowUrlInput(false) } }}
                  className="px-3 py-1 rounded bg-[#1a1a2e] text-white text-xs font-semibold"
                >
                  Use URL
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Crop stage — fixed aspect-ratio frame, pan + zoom the image under it */}
      {picking && (
        <div className="space-y-3 p-4 rounded-xl bg-[#050505] border border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
              <Crop size={14} className="text-[#e7ab1c]" />
              Position & zoom the image inside the frame
            </div>
            <button
              type="button"
              onClick={() => setPicking(null)}
              className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>

          <div className="relative mx-auto select-none touch-none" style={frameStyle}>
            {/* Scroll/pan container */}
            <div
              ref={frameRef}
              className="absolute inset-0 overflow-hidden rounded-lg ring-2 ring-[#e7ab1c]/90"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                ref={imgRef}
                src={picking}
                alt="Crop preview"
                draggable={false}
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: "center",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                }}
              />
              {/* Rule-of-thirds overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-1/3 h-px bg-white/20" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-white/20" />
                <div className="absolute inset-y-0 left-1/3 w-px bg-white/20" />
                <div className="absolute inset-y-0 left-2/3 w-px bg-white/20" />
              </div>
            </div>
          </div>

          {/* Zoom slider — 0.5× shows whole image (contain), 4× deep crop */}
          <div className="flex items-center gap-3 max-w-[520px] mx-auto">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}
              className="p-1 text-white/60 hover:text-white" title="Zoom out">
              <ZoomOut size={14} />
            </button>
            <input
              type="range"
              min={0.3}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#e7ab1c]"
            />
            <button type="button" onClick={() => setZoom((z) => Math.min(4, +(z + 0.1).toFixed(2)))}
              className="p-1 text-white/60 hover:text-white" title="Zoom in">
              <ZoomIn size={14} />
            </button>
            <span className="text-[11px] text-white/60 w-10 text-right tabular-nums">{zoom.toFixed(2)}×</span>
            <button
              type="button"
              onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}
              className="px-2 py-1 rounded text-[10px] font-semibold text-white/70 hover:text-white hover:bg-white/10"
              title="Reset zoom & pan"
            >
              Reset
            </button>
          </div>

          {error && (
            <div className="text-[12px] text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setPicking(null)}
              disabled={uploading}
              className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyCrop}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#e7ab1c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d49c10] disabled:opacity-60"
            >
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Uploading</>
              ) : (
                <><Crop size={14} /> Apply & Save</>
              )}
            </button>
          </div>
        </div>
      )}

      {help && <p className="text-[11px] text-[#aaa] mt-1">{help}</p>}
    </div>
  )
}
