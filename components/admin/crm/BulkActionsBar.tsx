"use client"

/**
 * Floating action bar that appears when one or more leads are
 * selected in the table. Zoho-style: "N selected" left, quick
 * actions right.
 */

import { useState } from "react"
import {
  X, UserCog, Flag, Trash2, Download, Loader2,
} from "lucide-react"
import type { LeadStatus } from "@/app/actions/crmLeadActions"
import { bulkUpdate, bulkDelete } from "@/app/actions/crmLeadActions"
import { STATUS_LABELS, STATUS_ORDER } from "./leadConstants"

type Member = { user_id: string; email: string; role: string }

interface Props {
  selectedIds: string[]
  members: Member[]
  onCleared: () => void
  onChanged: () => void
  onExport: () => void
}

export function BulkActionsBar({
  selectedIds, members, onCleared, onChanged, onExport,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [menu, setMenu] = useState<"none" | "status" | "owner">("none")

  if (selectedIds.length === 0) return null

  async function runStatus(s: LeadStatus) {
    setBusy(true); setMenu("none")
    await bulkUpdate(selectedIds, { status: s })
    setBusy(false)
    onChanged()
  }

  async function runOwner(ownerId: string | null) {
    setBusy(true); setMenu("none")
    await bulkUpdate(selectedIds, { ownerId })
    setBusy(false)
    onChanged()
  }

  async function runDelete() {
    if (!confirm(`Delete ${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""}? Cannot be undone.`)) return
    setBusy(true)
    await bulkDelete(selectedIds)
    setBusy(false)
    onChanged()
    onCleared()
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-in">
      <div className="flex items-center gap-2 bg-[#1a1a2e] text-white rounded-full pl-4 pr-2 py-2 shadow-xl">
        <button onClick={onCleared} className="p-1 hover:bg-white/10 rounded-full">
          <X size={14} />
        </button>
        <span className="text-[12px] font-medium">{selectedIds.length} selected</span>
        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Change status */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu === "status" ? "none" : "status")}
            className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <Flag size={13} /> Status
          </button>
          {menu === "status" && (
            <div className="absolute bottom-full mb-2 left-0 bg-white text-[#1a1a2e] rounded-lg shadow-xl border border-[#eee] min-w-[160px] py-1">
              {STATUS_ORDER.map((s) => (
                <button key={s} onClick={() => runStatus(s)}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#fafafa]">
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assign owner */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu === "owner" ? "none" : "owner")}
            className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <UserCog size={13} /> Assign
          </button>
          {menu === "owner" && (
            <div className="absolute bottom-full mb-2 left-0 bg-white text-[#1a1a2e] rounded-lg shadow-xl border border-[#eee] min-w-[200px] max-h-[240px] overflow-y-auto py-1">
              <button onClick={() => runOwner(null)}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[#888] hover:bg-[#fafafa] border-b border-[#eee]">
                Unassigned
              </button>
              {members.map((m) => (
                <button key={m.user_id} onClick={() => runOwner(m.user_id)}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#fafafa] truncate">
                  {m.email}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <Download size={13} /> Export
        </button>

        {/* Delete */}
        <button
          onClick={runDelete}
          className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full hover:bg-red-500/80 transition-colors"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Delete
        </button>
      </div>
    </div>
  )
}
