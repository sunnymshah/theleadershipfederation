"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  getAllAdvisoryBoardMembers,
  createAdvisoryBoardMember,
  updateAdvisoryBoardMember,
  deleteAdvisoryBoardMember,
} from "@/app/actions/advisoryBoardActions"
import { Plus, Pencil, Trash2, X, Loader2, Users, ExternalLink } from "lucide-react"
import { PageContentEditor, type SectionDef } from "@/components/admin/PageContentEditor"

const ADVISORY_PAGE_SECTIONS: SectionDef[] = [
  {
    kind: "fields",
    sectionKey: "hero",
    label: "Hero",
    description: "Top of the /advisory-board page.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", placeholder: "Leadership" },
      { name: "title", label: "Headline", placeholder: "Advisory Board & Jury" },
      { name: "description", label: "Description", textarea: true },
    ],
  },
  {
    kind: "fields",
    sectionKey: "empty_state",
    label: "Empty State",
    description: "Shown when no board members are published.",
    fields: [
      { name: "title", label: "Headline", placeholder: "Coming Soon" },
      { name: "description", label: "Description", textarea: true },
      { name: "cta_label", label: "Button Label", placeholder: "Express Interest" },
    ],
  },
]

interface AdvisoryMember {
  id: string
  name: string
  designation: string | null
  company: string | null
  bio: string | null
  image_url: string | null
  linkedin_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function AdvisoryBoardAdminPage() {
  const [members, setMembers] = useState<AdvisoryMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<AdvisoryMember | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const result = await getAllAdvisoryBoardMembers()
    if (result.success && result.members) {
      setMembers(result.members as AdvisoryMember[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  function openAddForm() {
    setEditingMember(null)
    setShowForm(true)
    setActionError(null)
  }

  function openEditForm(member: AdvisoryMember) {
    setEditingMember(member)
    setShowForm(true)
    setActionError(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingMember(null)
    setActionError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)

    // Map checkbox: if unchecked, it won't be in FormData
    if (!fd.has("is_active")) {
      fd.set("is_active", "false")
    }

    let result
    if (editingMember) {
      fd.set("id", editingMember.id)
      // Preserve existing image URL if no new file is uploaded
      if (!fd.get("imageUrl")) {
        fd.set("imageUrl", editingMember.image_url ?? "")
      }
      result = await updateAdvisoryBoardMember(fd)
    } else {
      result = await createAdvisoryBoardMember(fd)
    }

    if (result.success) {
      closeForm()
      await fetchMembers()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this advisory board member? This action cannot be undone.")) return
    setDeletingId(id)
    const result = await deleteAdvisoryBoardMember(id)
    if (result.success) {
      await fetchMembers()
    } else {
      setActionError(result.error ?? "Failed to delete member")
    }
    setDeletingId(null)
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a2e]">Advisory Board</h2>
          <p className="text-sm text-[#1a1a2e]/55 mt-1">
            Manage advisory board members shown on the public website
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-colors shadow-[0_4px_16px_rgba(231,171,28,0.25)]"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Error banner */}
      {actionError && !showForm && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-700/60 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page content */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-[#333] mb-3 uppercase tracking-wider">
          Page Content
        </h3>
        <PageContentEditor pageSlug="advisory_board" sections={ADVISORY_PAGE_SECTIONS} />
      </div>

      <h3 className="text-sm font-bold text-[#333] mb-3 uppercase tracking-wider">
        Board Members
      </h3>

      {/* Inline Form */}
      {showForm && (
        <div className="mb-8 bg-white shadow-sm border border-[#1a1a2e]/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-[#1a1a2e]">
              {editingMember ? "Edit Member" : "Add New Member"}
            </h3>
            <button
              onClick={closeForm}
              className="p-1.5 rounded-md text-[#1a1a2e]/45 hover:text-[#1a1a2e]/80 hover:bg-[#1a1a2e]/[0.04] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e]/65 mb-1.5">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingMember?.name ?? ""}
                placeholder="Full name"
                className="w-full bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg px-3 py-2 text-[#1a1a2e] text-sm placeholder-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
              />
            </div>

            {/* Designation + Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a2e]/65 mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  defaultValue={editingMember?.designation ?? ""}
                  placeholder="e.g. CEO, Board Director"
                  className="w-full bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg px-3 py-2 text-[#1a1a2e] text-sm placeholder-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a2e]/65 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  defaultValue={editingMember?.company ?? ""}
                  placeholder="Organization name"
                  className="w-full bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg px-3 py-2 text-[#1a1a2e] text-sm placeholder-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e]/65 mb-1.5">Bio</label>
              <textarea
                name="bio"
                rows={4}
                defaultValue={editingMember?.bio ?? ""}
                placeholder="Brief biography..."
                className="w-full bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg px-3 py-2 text-[#1a1a2e] text-sm placeholder-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all resize-none"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e]/65 mb-1.5">Photo</label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#1a1a2e]/[0.12] rounded-lg cursor-pointer hover:border-[#e7ab1c]/50 hover:bg-[#e7ab1c]/[0.04] transition-colors">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-[#1a1a2e]/35 mb-1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className="text-xs text-[#1a1a2e]/55">Click to upload photo</span>
                <span className="text-[10px] text-[#1a1a2e]/35 mt-0.5">JPG, PNG up to 2MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="hidden"
                />
              </label>
              {editingMember?.image_url && (
                <p className="text-xs text-[#1a1a2e]/55 mt-1.5">
                  Current photo will be kept unless a new one is uploaded.
                </p>
              )}
              <input type="hidden" name="imageUrl" defaultValue={editingMember?.image_url ?? ""} />
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e]/65 mb-1.5">
                LinkedIn URL
              </label>
              <input
                type="text"
                name="linkedin_url"
                defaultValue={editingMember?.linkedin_url ?? ""}
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg px-3 py-2 text-[#1a1a2e] text-sm placeholder-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
              />
            </div>

            {/* Sort Order + Active */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a2e]/65 mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  min="0"
                  defaultValue={editingMember?.sort_order ?? 0}
                  className="w-full bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg px-3 py-2 text-[#1a1a2e] text-sm focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={editingMember ? editingMember.is_active : true}
                    className="w-4 h-4 rounded border-[#1a1a2e]/20 bg-white accent-[#e7ab1c]"
                  />
                  <span className="text-sm text-[#1a1a2e]/65">Active (visible on public site)</span>
                </label>
              </div>
            </div>

            {/* Form error */}
            {actionError && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 text-sm">
                {actionError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-lg border border-[#1a1a2e]/[0.08] bg-white text-sm text-[#1a1a2e]/65 hover:text-[#1a1a2e] hover:bg-[#F4F8FF] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(231,171,28,0.25)]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : editingMember ? (
                  "Update Member"
                ) : (
                  "Add Member"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#1a1a2e]/45 gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading members...
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white shadow-sm border border-[#1a1a2e]/[0.06] rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-[#e7ab1c]" />
          </div>
          <p className="text-[#1a1a2e]/55 text-sm mb-4">No advisory board members yet.</p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-colors shadow-[0_4px_16px_rgba(231,171,28,0.25)]"
          >
            <Plus size={16} /> Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white shadow-sm border border-[#1a1a2e]/[0.06] rounded-xl p-5 group hover:border-[#e7ab1c]/40 hover:shadow-md transition-all cursor-pointer relative"
              onClick={() => openEditForm(member)}
            >
              {/* Top row: photo/initials + badges */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#1a1a2e]/[0.08]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#e7ab1c]/15 flex items-center justify-center text-[#e7ab1c] text-sm font-bold shrink-0">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-[#1a1a2e] font-semibold text-sm truncate">{member.name}</h4>
                    {member.designation && (
                      <p className="text-[#1a1a2e]/55 text-xs truncate">{member.designation}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    member.is_active
                      ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/20"
                      : "bg-[#1a1a2e]/[0.04] text-[#1a1a2e]/45 border border-[#1a1a2e]/[0.06]"
                  }`}
                >
                  {member.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Company */}
              {member.company && (
                <p className="text-[#1a1a2e]/65 text-xs mb-2 truncate">{member.company}</p>
              )}

              {/* Bio preview */}
              {member.bio && (
                <p className="text-[#1a1a2e]/55 text-xs leading-relaxed line-clamp-2 mb-3">
                  {member.bio}
                </p>
              )}

              {/* Footer: LinkedIn + actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1a1a2e]/[0.05]">
                <div className="flex items-center gap-2">
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#1a1a2e]/35 hover:text-[#0a66c2] transition-colors"
                      title="LinkedIn profile"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <span className="text-[10px] text-[#1a1a2e]/35">#{member.sort_order}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditForm(member)
                    }}
                    className="p-1.5 rounded-md text-[#1a1a2e]/45 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04] transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(member.id)
                    }}
                    disabled={deletingId === member.id}
                    className="p-1.5 rounded-md text-red-500/60 hover:text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                    title="Delete"
                  >
                    {deletingId === member.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
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
