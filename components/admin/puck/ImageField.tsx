"use client"

/**
 * ── Image upload custom field for Puck ────────────────────────────────
 *
 * Usage in a Puck config:
 *
 *   backgroundImage: {
 *     type: "custom",
 *     label: "Background image",
 *     render: (props) => <ImageField {...props} folder="sections" />,
 *   }
 *
 * Behaviour:
 *   - Preview of current URL
 *   - Two ways to set the value: (1) file picker that base64-encodes and
 *     uploads via `uploadImageDataUrl` server action, (2) paste a URL
 *     directly.
 *   - Upload errors surface inline; success updates `value` in the Puck
 *     form (which auto-saves via `onChange`).
 */

import { useState, useRef } from "react"
import { FieldLabel } from "@measured/puck"
import { uploadImageDataUrl } from "@/app/actions/uploadActions"
import { ImageIcon, Upload, X, Loader2 } from "lucide-react"

type Folder = "speakers" | "events" | "sponsors" | "sections" | "general"

export function ImageField({
  field,
  value,
  onChange,
  folder = "sections",
}: {
  field: { label?: string }
  value: string
  onChange: (v: string) => void
  folder?: Folder
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function onFile(file: File) {
    setError(null)
    if (!file) return
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setError("Only JPG, PNG, WebP, or GIF.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max file size 5 MB.")
      return
    }
    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      const res = await uploadImageDataUrl(dataUrl, folder, file.name)
      if (!res.success) {
        setError(res.error || "Upload failed.")
        return
      }
      onChange(res.url)
    } catch (err) {
      setError((err as Error).message || "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <FieldLabel label={field.label ?? "Image"}>
      <div>
        {value ? (
          <div className="relative border border-[#1a1a2e]/15 rounded-lg overflow-hidden bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full max-h-48 object-contain bg-[#F4F8FF]" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#1a1a2e]/15 rounded-lg bg-[#F4F8FF] py-8 text-center text-xs text-[#1a1a2e]/55 flex flex-col items-center gap-2">
            <ImageIcon size={20} className="opacity-45" />
            No image
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a1a2e] text-white text-xs font-medium hover:bg-[#2a2a4e] disabled:opacity-50"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
              e.currentTarget.value = ""
            }}
          />
        </div>

        <input
          type="url"
          placeholder="or paste an image URL"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full text-xs px-2 py-1.5 rounded-md bg-white border border-[#1a1a2e]/15 focus:outline-none focus:border-[#e7ab1c]"
        />

        {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
      </div>
    </FieldLabel>
  )
}
