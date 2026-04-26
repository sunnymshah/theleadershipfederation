"use client"

/**
 * ── Image upload custom field for Puck ────────────────────────────────
 *
 * Wraps the existing admin `ImageUploadCrop` widget so block fields get
 * the same drag-pan + zoom + rule-of-thirds crop UI everywhere images
 * are uploaded in the admin (speakers, events, sponsors, builder
 * sections, etc.).
 *
 * Usage in a Puck config:
 *
 *   backgroundImage: {
 *     type: "custom",
 *     label: "Background image",
 *     render: (props) => <ImageField {...props} folder="sections" aspectRatio={16/9} />,
 *   }
 *
 * `aspectRatio` defaults to 16/9 for hero-style images. Pass 1 for
 * square (e.g. avatars), 0 for "no crop — upload as-is" (e.g. logos
 * where preserving the original ratio matters).
 */

import { FieldLabel } from "@measured/puck"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"

type Folder = "speakers" | "events" | "sponsors" | "sections" | "general"

export function ImageField({
  field,
  value,
  onChange,
  folder = "sections",
  aspectRatio = 16 / 9,
}: {
  field: { label?: string }
  value: string
  onChange: (v: string) => void
  folder?: Folder
  aspectRatio?: number
}) {
  return (
    <FieldLabel label={field.label ?? "Image"}>
      <ImageUploadCrop
        value={value}
        onChange={(url) => onChange(url ?? "")}
        aspectRatio={aspectRatio}
        folder={folder}
        // Hide the wrapper's own label since FieldLabel handles it.
        label=""
      />
    </FieldLabel>
  )
}
