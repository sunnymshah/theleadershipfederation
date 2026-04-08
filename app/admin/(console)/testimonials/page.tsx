"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/app/actions/testimonialActions"

interface Testimonial {
  id: string
  name: string
  designation: string | null
  company: string | null
  quote: string
  image_url: string | null
  is_featured: boolean
  sort_order: number
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTestimonials = useCallback(async () => {
    setLoading(true)
    const result = await getTestimonials()
    if (result.success && result.testimonials) {
      setTestimonials(result.testimonials)
    } else {
      setError(result.error ?? "Failed to load testimonials")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTestimonials()
  }, [fetchTestimonials])

  function openAddForm() {
    setEditing(null)
    setShowForm(true)
    setError(null)
  }

  function openEditForm(t: Testimonial) {
    setEditing(t)
    setShowForm(true)
    setError(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)

    // Checkbox handling: FormData only includes checked checkboxes
    // We need to set isFeatured based on whether it's checked
    const isFeaturedCheckbox = form.querySelector<HTMLInputElement>(
      'input[name="isFeaturedCheckbox"]'
    )
    fd.set("isFeatured", isFeaturedCheckbox?.checked ? "true" : "false")

    if (editing) {
      fd.set("id", editing.id)
      // Preserve existing image URL for update
      if (!fd.get("imageUrl")) {
        fd.set("imageUrl", editing.image_url ?? "")
      }
      const result = await updateTestimonial(fd)
      if (result.success) {
        closeForm()
        await fetchTestimonials()
      } else {
        setError(result.error ?? "Failed to update testimonial")
      }
    } else {
      const result = await createTestimonial(fd)
      if (result.success) {
        closeForm()
        await fetchTestimonials()
      } else {
        setError(result.error ?? "Failed to create testimonial")
      }
    }

    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this testimonial?")) return
    setDeletingId(id)
    const result = await deleteTestimonial(id)
    if (result.success) {
      await fetchTestimonials()
    } else {
      setError(result.error ?? "Failed to delete testimonial")
    }
    setDeletingId(null)
  }

  function truncate(text: string, maxLen: number) {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen).trimEnd() + "..."
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Testimonials</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage testimonials shown on the homepage
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-[#c9a84c] text-black font-semibold rounded-lg px-4 py-2 hover:bg-[#d4b85c] transition-colors"
        >
          + Add Testimonial
        </button>
      </div>

      {/* Error banner */}
      {error && !showForm && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400/50 hover:text-red-400 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">
            {editing ? "Edit Testimonial" : "New Testimonial"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editing?.name ?? ""}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  defaultValue={editing?.designation ?? ""}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="CEO, VP of Sales, etc."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  defaultValue={editing?.company ?? ""}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="Company name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/60 block mb-1.5">
                Quote *
              </label>
              <textarea
                name="quote"
                required
                rows={4}
                defaultValue={editing?.quote ?? ""}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
                placeholder="What did they say about the experience?"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">
                  Photo
                </label>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-white/70 hover:file:bg-white/15 transition-colors"
                />
                {editing?.image_url && (
                  <p className="text-white/30 text-xs mt-1">
                    Current photo will be kept unless replaced
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  min="0"
                  defaultValue={editing?.sort_order ?? 0}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeaturedCheckbox"
                    defaultChecked={editing ? editing.is_featured : true}
                    className="w-4 h-4 rounded border-white/20 bg-[#1a1a1a] text-[#c9a84c] accent-[#c9a84c]"
                  />
                  <span className="text-sm text-white/60">Featured</span>
                </label>
              </div>
            </div>

            {/* Hidden field for imageUrl passthrough */}
            <input type="hidden" name="imageUrl" defaultValue={editing?.image_url ?? ""} />

            {error && showForm && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#c9a84c] text-black font-semibold rounded-lg px-5 py-2 hover:bg-[#d4b85c] disabled:opacity-50 transition-colors"
              >
                {submitting
                  ? "Saving..."
                  : editing
                    ? "Update Testimonial"
                    : "Add Testimonial"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white/70 hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Testimonials Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm">
          Loading testimonials...
        </div>
      ) : testimonials.length === 0 ? (
        <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-12 text-center">
          <p className="text-white/40 text-sm">
            No testimonials yet. Add your first testimonial to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-[#141414] border border-white/[0.06] rounded-xl p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Featured badge + quote */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-white/70 text-sm leading-relaxed italic">
                    &ldquo;{truncate(t.quote, 140)}&rdquo;
                  </p>
                  {t.is_featured && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider bg-[#c9a84c]/15 text-[#c9a84c] px-2 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </div>

                {/* Author info */}
                <div className="flex items-center gap-3 mt-4">
                  {t.image_url ? (
                    <img
                      src={t.image_url}
                      alt={t.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold shrink-0">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {t.name}
                    </p>
                    <p className="text-white/40 text-xs truncate">
                      {[t.designation, t.company].filter(Boolean).join(", ") ||
                        "No title"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                <span className="text-white/20 text-xs">
                  Order: {t.sort_order}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditForm(t)}
                    className="text-white/30 hover:text-white text-xs transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="text-red-400 hover:text-red-300 text-xs transition-colors disabled:opacity-30"
                  >
                    {deletingId === t.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
