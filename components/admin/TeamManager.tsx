"use client"

/**
 * ─── TEAM MANAGER ───────────────────────────────────────────────────────
 *
 * Admin component for managing team members, roles, and invitations.
 * Only accessible to super_admin users.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getTeamMembers,
  inviteTeamMember,
  updateMemberRole,
  removeMember,
} from "@/app/actions/teamActions"
import {
  type TeamRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from "@/lib/permissions"
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  AlertCircle,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  user_id: string
  email: string
  name: string
  role: string
  created_at: string
  updated_at: string
}

const ROLE_OPTIONS: TeamRole[] = [
  "super_admin",
  "admin",
  "manager",
  "check_in_staff",
  "viewer",
]

const ROLE_COLORS: Record<TeamRole, string> = {
  super_admin: "bg-red-500/10 text-red-400 border-red-500/20",
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  check_in_staff: "bg-green-500/10 text-green-400 border-green-500/20",
  viewer: "bg-gray-500/10 text-gray-400 border-gray-500/20",
}

export function TeamManager() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Invite form state
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamRole>("viewer")
  const [inviting, setInviting] = useState(false)

  // Role editing
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const result = await getTeamMembers()
    if (result.success) {
      setMembers(result.members)
    } else {
      setError(result.error ?? "Failed to load team members")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError(null)
    setSuccess(null)

    const result = await inviteTeamMember(inviteEmail, inviteName, inviteRole)
    if (result.success) {
      setSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
      setInviteName("")
      setInviteRole("viewer")
      setShowInvite(false)
      await fetchMembers()
    } else {
      setError(result.error ?? "Failed to invite member")
    }
    setInviting(false)
  }

  async function handleRoleChange(memberId: string, newRole: TeamRole) {
    setUpdatingRoleId(memberId)
    setError(null)
    setSuccess(null)

    const result = await updateMemberRole(memberId, newRole)
    if (result.success) {
      setSuccess("Role updated successfully")
      setEditingRoleId(null)
      await fetchMembers()
    } else {
      setError(result.error ?? "Failed to update role")
    }
    setUpdatingRoleId(null)
  }

  async function handleRemove(member: TeamMember) {
    if (
      !confirm(
        `Remove ${member.name} (${member.email}) from the team? They will lose all admin access.`
      )
    )
      return

    setDeletingId(member.id)
    setError(null)
    setSuccess(null)

    const result = await removeMember(member.id)
    if (result.success) {
      setSuccess(`${member.name} has been removed from the team`)
      await fetchMembers()
    } else {
      setError(result.error ?? "Failed to remove member")
    }
    setDeletingId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-[#333] mb-0.5">Members</h3>
          <p className="text-sm text-[#888]">
            Invite people and assign their access role.
          </p>
        </div>
        <button
          onClick={() => {
            setShowInvite(true)
            setError(null)
            setSuccess(null)
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] transition-colors"
        >
          <UserPlus size={16} /> Invite member
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-500 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400/50 hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-green-500/8 border border-green-500/15 text-green-600 text-sm">
          <div className="flex items-center gap-2">
            <Check size={14} />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400/50 hover:text-green-400"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Role Legend */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {ROLE_OPTIONS.map((role) => (
          <div
            key={role}
            className="px-4 py-3 rounded-lg border border-[#e0e0e0] bg-white"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield size={12} className="text-[#aaa]" />
              <span className="text-[12px] font-bold text-[#555]">
                {ROLE_LABELS[role]}
              </span>
            </div>
            <p className="text-[11px] text-[#999] leading-relaxed">
              {ROLE_DESCRIPTIONS[role]}
            </p>
          </div>
        ))}
      </div>

      {/* Team Table */}
      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading team
            members...
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">
              No team members yet. Invite your first member.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Member
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Added
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const roleStyle =
                  ROLE_COLORS[m.role as TeamRole] ?? ROLE_COLORS.viewer
                return (
                  <tr
                    key={m.id}
                    className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e7ab1c] flex items-center justify-center shrink-0">
                          <span className="text-white text-[11px] font-bold">
                            {m.name[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <span className="font-medium text-[#333]">
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#777] text-xs">
                      {m.email}
                    </td>
                    <td className="px-5 py-4">
                      {editingRoleId === m.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={m.role}
                            onChange={(e) =>
                              handleRoleChange(
                                m.id,
                                e.target.value as TeamRole
                              )
                            }
                            disabled={updatingRoleId === m.id}
                            className="px-2 py-1 text-xs border border-[#e0e0e0] rounded-md bg-white text-[#333] focus:outline-none focus:border-[#c9a84c]/50"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          {updatingRoleId === m.id ? (
                            <Loader2
                              size={14}
                              className="animate-spin text-[#aaa]"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingRoleId(null)}
                              className="text-[#aaa] hover:text-[#555]"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingRoleId(m.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border cursor-pointer hover:opacity-80 transition-opacity",
                            roleStyle
                          )}
                        >
                          {ROLE_LABELS[m.role as TeamRole] ?? m.role}
                          <ChevronDown size={10} />
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#777] text-xs">
                      {new Date(m.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleRemove(m)}
                          disabled={deletingId === m.id}
                          className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                          title="Remove member"
                        >
                          {deletingId === m.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Invite Drawer ──────────────────────────────────────────── */}
      {showInvite && (
        <>
          <div
            className="fixed inset-0 bg-[#1a1a2e]/60 z-40"
            onClick={() => setShowInvite(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="jane@theleadershipfederation.com"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Role *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-[#999]">
                  {ROLE_DESCRIPTIONS[inviteRole]}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#fffbeb] border border-[#fde68a]/30">
                <p className="text-[12px] text-[#92400e]">
                  An invitation email will be sent. The user must accept before
                  they can log in.
                </p>
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
