"use client"

/**
 * Thin wrapper around `yet-another-react-lightbox` so the heavy CSS only
 * loads when a Gallery actually has lightbox enabled and the user clicks.
 * Kept in a separate module so blocks.tsx doesn't pull the lightbox CSS
 * for every page.
 */

import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

export function GalleryLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: Array<{ url: string; alt?: string; caption?: string }>
  startIndex: number
  onClose: () => void
}) {
  const slides = images
    .filter((img) => Boolean(img.url))
    .map((img) => ({
      src: img.url,
      alt: img.alt || img.caption || "",
      title: img.caption || img.alt || "",
    }))
  return (
    <Lightbox
      open
      close={onClose}
      slides={slides}
      index={startIndex}
    />
  )
}
