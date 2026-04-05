"use client"

/**
 * ─── GALLERY MANAGER ────────────────────────────────────────────────────
 *
 * Event gallery management. Upload, reorder, caption, feature, and
 * delete event photos. Supports drag-and-drop bulk upload.
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  uploadGalleryImage,
  deleteGalleryImage,
  updateGalleryImage,
  bulkUploadGallery,
} from "@/app/actions/galleryActions"
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Star,
  Upload,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface GalleryImage {
  id: string
  event_id: string
  image_url: string
  caption: string | null
  photographer: string | null
  sort_order: number
  is_featured: boolean
  created_at: string
}

export function GalleryManager({ eventId }: { eventId: string }) {
  const [images, setImages]         = useState<GalleryImage[]>([])
  const [loading, setLoading]       = useState(true)
  const [uploading, setUploading]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragOver, setDragOver]     = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const fetchImages = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("event_gallery")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order")
    if (data) setImages(data)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchImages() }, [fetchImages])

  // ── Upload handlers ──────────────────────────────────────────────
  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setUploading(true)
    setUploadError(null)

    if (fileArray.length === 1) {
      // Single upload
      const fd = new FormData()
      fd.set("file", fileArray[0])
      const result = await uploadGalleryImage(eventId, fd)
      if (!result.success) {
        setUploadError(result.error ?? "Upload failed")
      }
    } else {
      // Bulk upload
      const fd = new FormData()
      for (const file of fileArray) {
        fd.append("files", file)
      }
      const result = await bulkUploadGallery(eventId, fd)
      if (!result.success && result.errors && result.errors.length > 0) {
        setUploadError(result.errors.join("; "))
      }
    }

    await fetchImages()
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  // ── Delete ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Delete this image? This cannot be undone.")) return
    setDeletingId(id)
    await deleteGalleryImage(id)
    await fetchImages()
    setDeletingId(null)
  }

  // ── Toggle Featured ──────────────────────────────────────────────
  async function toggleFeatured(image: GalleryImage) {
    await updateGalleryImage(image.id, { is_featured: !image.is_featured })
    await fetchImages()
  }

  // ── Update Caption / Photographer ─────────────────────────────────
  async function handleCaptionBlur(image: GalleryImage, caption: string) {
    if (caption !== (image.caption ?? "")) {
      await updateGalleryImage(image.id, { caption })
    }
  }

  async function handlePhotographerBlur(image: GalleryImage, photographer: string) {
    if (photographer !== (image.photographer ?? "")) {
      await updateGalleryImage(image.id, { photographer })
    }
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#aaa] gap-2 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading gallery...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#333]">Event Gallery</h2>
          <p className="text-[13px] text-[#999] mt-0.5">{images.length} photo{images.length !== 1 ? "s" : ""} uploaded</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-medium hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Plus size={14} /> Upload Photos</>}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files)
              e.target.value = ""
            }
          }}
        />
      </div>

      {uploadError && (
        <div className="px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={14} /> {uploadError}
        </div>
      )}

      {/* ── Drop Zone ────────────────────────────────────────────── */}
      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          dragOver
            ? "border-[#c9a84c] bg-[#c9a84c]/5"
            : "border-[#d0d0d0] hover:border-[#bbb] hover:bg-[#fafafa]"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={32} className={cn("mx-auto mb-3", dragOver ? "text-[#c9a84c]" : "text-[#ccc]")} />
        <p className="text-sm text-[#888]">
          {uploading ? "Uploading..." : "Drag and drop images here, or click to browse"}
        </p>
        <p className="text-xs text-[#bbb] mt-1">JPEG, PNG, WebP, GIF up to 10MB each</p>
      </div>

      {/* ── Image Grid ───────────────────────────────────────────── */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="rounded-xl border border-[#e0e0e0] overflow-hidden bg-white group">
              {/* Image Preview */}
              <div className="relative aspect-square bg-[#f5f5f5]">
                <img
                  src={image.image_url}
                  alt={image.caption ?? "Gallery image"}
                  className="w-full h-full object-cover"
                />

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-start justify-end p-2 opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleFeatured(image)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        image.is_featured
                          ? "bg-[#c9a84c] text-white"
                          : "bg-white/90 text-[#888] hover:text-[#c9a84c]"
                      )}
                      title={image.is_featured ? "Remove from featured" : "Set as featured"}
                    >
                      <Star size={14} fill={image.is_featured ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={deletingId === image.id}
                      className="p-1.5 rounded-lg bg-white/90 text-[#888] hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      {deletingId === image.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Featured badge */}
                {image.is_featured && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#c9a84c] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Star size={8} fill="currentColor" /> Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Caption + Photographer */}
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  defaultValue={image.caption ?? ""}
                  placeholder="Add caption..."
                  onBlur={(e) => handleCaptionBlur(image, e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#fafafa] border border-[#e0e0e0] rounded text-xs text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                />
                <input
                  type="text"
                  defaultValue={image.photographer ?? ""}
                  placeholder="Photographer..."
                  onBlur={(e) => handlePhotographerBlur(image, e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#fafafa] border border-[#e0e0e0] rounded text-xs text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="rounded-xl border border-dashed border-[#d0d0d0] p-12 text-center">
          <ImageIcon size={32} className="mx-auto mb-3 text-[#ccc]" />
          <p className="text-[#888] text-sm">No photos in the gallery yet</p>
          <p className="text-[#bbb] text-xs mt-1">Upload event photos for post-event marketing</p>
        </div>
      )}
    </div>
  )
}
