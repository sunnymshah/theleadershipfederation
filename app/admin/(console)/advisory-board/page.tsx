"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  getAllAdvisoryBoardMembers,
  createAdvisoryBoardMember,
  updateAdvisoryBoardMember,
  deleteAdvisoryBoardMember,
} from "@/app/actions/advisoryBoardActions"
import { Plus, Pencil, Trash2, X, Loader2, Users, ExternalLink } from "lucide-react"

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
    <div className="p-8 min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Advisory Board</h2>
          <p className="text-sm text-white/40 mt-1">
            Manage advisory board members shown on the public website
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-black text-sm font-semibold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Error banner */}
      {actionError && !showForm && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div className="mb-8 bg-[#141414] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">
              {editingMember ? "Edit Member" : "Add New Member"}
            </h3>
            <button
              onClick={closeForm}
              className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingMember?.name ?? ""}
                placeholder="Full name"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
              />
            </div>

            {/* Designation + Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  defaultValue={editingMember?.designation ?? ""}
                  placeholder="e.g. CEO, Board Director"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  defaultValue={editingMember?.company ?? ""}
                  placeholder="Organization name"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Bio</label>
              <textarea
                name="bio"
                rows={4}
                defaultValue={editingMember?.bio ?? ""}
                placeholder="Brief biography..."
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Photo</label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5 transition-colors">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-white/30 mb-1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className="text-xs text-white/40">Click to upload photo</span>
                <span className="text-[10px] text-white/20 mt-0.5">JPG, PNG up to 2MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="hidden"
                />
              </label>
              {editingMember?.image_url && (
                <p className="text-xs text-white/30 mt-1.5">
                  Current photo will be kept unless a new one is uploaded.
                </p>
              )}
              <input type="hidden" name="imageUrl" defaultValue={editingMember?.image_url ?? ""} />
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                LinkedIn URL
              </label>
              <input
                type="text"
                name="linkedin_url"
                defaultValue={editingMember?.linkedin_url ?? ""}
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
              />
            </div>

            {/* Sort Order + Active */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  min="0"
                  defaultValue={editingMember?.sort_order ?? 0}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={editingMember ? editingMember.is_active : true}
                    className="w-4 h-4 rounded border-white/20 bg-[#1a1a1a] accent-[#c9a84c]"
                  />
                  <span className="text-sm text-white/60">Active (visible on public site)</span>
                </label>
              </div>
            </div>

            {/* Form error */}
            {actionError && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {actionError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-black text-sm font-semibold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
        <div className="flex items-center justify-center py-20 text-white/40 gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading members...
        </div>
      ) : members.length === 0 ? (
        <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-[#c9a84c]" />
          </div>
          <p className="text-white/40 text-sm mb-4">No advisory board members yet.</p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-black text-sm font-semibold hover:bg-[#d4b85c] transition-colors"
          >
            <Plus size={16} /> Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-[#141414] border border-white/[0.06] rounded-xl p-5 group hover:border-white/[0.12] transition-colors cursor-pointer relative"
              onClick={() => openEditForm(member)}
            >
              {/* Top row: photo/initials + badges */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#c9a84c]/15 flex items-center justify-center text-[#c9a84c] text-sm font-bold shrink-0">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-white font-medium text-sm truncate">{member.name}</h4>
                    {member.designation && (
                      <p className="text-white/40 text-xs truncate">{member.designation}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    member.is_active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {member.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Company */}
              {member.company && (
                <p className="text-white/50 text-xs mb-2 truncate">{member.company}</p>
              )}

              {/* Bio preview */}
              {member.bio && (
                <p className="text-white/30 text-xs leading-relaxed line-clamp-2 mb-3">
                  {member.bio}
                </p>
              )}

              {/* Footer: LinkedIn + actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-white/25 hover:text-[#0a66c2] transition-colors"
                      title="LinkedIn profile"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <span className="text-[10px] text-white/20">#{member.sort_order}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditForm(member)
                    }}
                    className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
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
                    className="p-1.5 rounded-md text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
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
