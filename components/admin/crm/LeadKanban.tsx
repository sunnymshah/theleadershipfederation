"use client"

/**
 * Kanban board for leads — one column per status. Drag a card to
 * another column to change its status. Uses the HTML5 drag-drop API
 * (no dep). Keeps a local optimistic view so the board never feels
 * laggy.
 */

import { useMemo, useState } from "react"
import type { CrmLead, LeadStatus } from "@/app/actions/crmLeadActions"
import { useAdminPermissions } from "@/components/admin/AdminPermissionsContext"
import { STATUS_LABELS, STATUS_ORDER, STATUS_PILL } from "./leadConstants"

interface Props {
  leads: CrmLead[]
  onStatusChange: (leadId: string, next: LeadStatus) => void
  onOpenLead: (id: string) => void
}

export function LeadKanban({ leads, onStatusChange, onOpenLead }: Props) {
  const { can } = useAdminPermissions()
  const canMove = can("leads", "edit")
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null)

  const grouped = useMemo(() => {
    const map: Record<LeadStatus, CrmLead[]> = {
      new: [], contacted: [], qualified: [], proposal: [], won: [], lost: [],
    }
    for (const l of leads) {
      if (l.status in map) map[l.status].push(l)
    }
    return map
  }, [leads])

  function handleDrop(e: React.DragEvent<HTMLDivElement>, status: LeadStatus) {
    e.preventDefault()
    setDragOver(null)
    if (!canMove) return
    const id = e.dataTransfer.getData("text/plain")
    if (id) onStatusChange(id, status)
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {STATUS_ORDER.map((s) => {
          const col = grouped[s]
          const pill = STATUS_PILL[s]
          const isTarget = dragOver === s
          const sum = col.reduce((a, l) => a + Number(l.lead_value ?? 0), 0)
          return (
            <div
              key={s}
              className={`
                w-[280px] shrink-0 rounded-xl border transition-colors
                ${isTarget ? "border-[#c9a84c] bg-[#fffcf2]" : "border-[#e5e7eb] bg-[#fafafa]"}
              `}
              onDragOver={(e) => { if (canMove) { e.preventDefault(); setDragOver(s) } }}
              onDragLeave={() => setDragOver((v) => (v === s ? null : v))}
              onDrop={(e) => handleDrop(e, s)}
            >
              {/* Column header */}
              <div className="px-3 py-2.5 border-b border-[#eee] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${pill.dot}`} />
                  <span className="text-[12px] font-semibold text-[#333]">
                    {STATUS_LABELS[s]}
                  </span>
                  <span className="text-[11px] text-[#aaa]">({col.length})</span>
                </div>
                {sum > 0 && (
                  <span className="text-[10px] text-[#aaa]">
                    ₹{Math.round(sum / 1000)}k
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[60vh] max-h-[70vh] overflow-y-auto">
                {col.map((l) => (
                  <KanbanCard key={l.id} lead={l} onOpen={() => onOpenLead(l.id)} canDrag={canMove} />
                ))}
                {col.length === 0 && (
                  <div className="text-[11px] text-[#ccc] text-center py-6">
                    {canMove ? "Drag leads here" : "No leads"}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCard({ lead, onOpen, canDrag }: { lead: CrmLead; onOpen: () => void; canDrag: boolean }) {
  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => { if (canDrag) e.dataTransfer.setData("text/plain", lead.id) }}
      onClick={onOpen}
      className={`
        bg-white border border-[#e5e7eb] rounded-md px-3 py-2.5
        hover:border-[#c9a84c] hover:shadow-sm transition-all
        ${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
      `}
    >
      <div className="text-[13px] font-medium text-[#1a1a2e] truncate">
        {lead.full_name}
      </div>
      {lead.company && (
        <div className="text-[11px] text-[#888] mt-0.5 truncate">{lead.company}</div>
      )}
      <div className="flex items-center justify-between mt-2">
        {lead.rating && (
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${ratingText(lead.rating)}`}>
            {lead.rating}
          </span>
        )}
        {lead.lead_value && (
          <span className="text-[11px] text-[#555] font-medium ml-auto">
            ₹{Number(lead.lead_value).toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  )
}

function ratingText(r: string): string {
  return r === "hot" ? "text-red-600" : r === "warm" ? "text-orange-600" : "text-slate-500"
}
