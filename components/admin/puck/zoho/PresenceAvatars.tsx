"use client"

/**
 * Presence avatars in the builder top bar. Subscribes to the
 * Supabase realtime channel `builder-presence:{eventId}` and shows
 * up to 3 visible bubbles plus an overflow "+N" pill.
 */

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

type Person = { user_id: string; name: string; color: string }

const COLORS = ["#e7ab1c", "#3e7af7", "#10b981", "#a855f7", "#ef4444", "#f97316"]

function colorFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

export function PresenceAvatars({ eventId, me }: { eventId: string; me: { id: string; name: string } }) {
  const [people, setPeople] = useState<Person[]>([])

  useEffect(() => {
    if (!eventId || !me?.id) return
    const supabase = createClient()
    const channel = supabase.channel(`builder-presence:${eventId}`, {
      config: { presence: { key: me.id } },
    })
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, Array<Person>>
        const list: Person[] = []
        for (const arr of Object.values(state)) {
          for (const p of arr) list.push(p)
        }
        setPeople(list)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: me.id, name: me.name, color: colorFor(me.id) })
        }
      })
    return () => { void supabase.removeChannel(channel) }
  }, [eventId, me?.id, me?.name])

  // Hide self from visible avatars; we know we're here.
  const others = people.filter((p) => p.user_id !== me.id)
  const visible = others.slice(0, 3)
  const overflow = Math.max(0, others.length - visible.length)
  if (others.length === 0) return null

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((p) => (
        <div
          key={p.user_id}
          title={p.name}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white shadow-sm"
          style={{ background: p.color }}
        >
          {(p.name || "?").trim().charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[#1a1a2e] ring-2 ring-white bg-[#1a1a2e]/10">
          +{overflow}
        </div>
      )}
    </div>
  )
}
