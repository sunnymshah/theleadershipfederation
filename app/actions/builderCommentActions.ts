"use server"

/**
 * Per-block comments on builder sections. Threaded (parent_id),
 * resolvable, scoped to (event_id, page_kind, block_id).
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"

export type BuilderComment = {
  id: string
  event_id: string
  page_kind: string
  block_id: string
  body: string
  author_id: string | null
  parent_id: string | null
  resolved: boolean
  created_at: string
}

export async function listComments(input: {
  eventId: string
  pageKind?: string
  blockId?: string
  includeResolved?: boolean
}): Promise<{ success: boolean; comments: BuilderComment[]; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    let q = admin
      .from("event_builder_comments")
      .select("*")
      .eq("event_id", input.eventId)
      .order("created_at", { ascending: true })
    if (input.pageKind) q = q.eq("page_kind", input.pageKind)
    if (input.blockId)  q = q.eq("block_id", input.blockId)
    if (!input.includeResolved) q = q.eq("resolved", false)
    const { data, error } = await q
    if (error) return { success: false, comments: [], error: error.message }
    return { success: true, comments: (data ?? []) as BuilderComment[] }
  } catch (err) {
    return { success: false, comments: [], error: (err as Error).message }
  }
}

export async function addComment(input: {
  eventId: string
  pageKind: string
  blockId: string
  body: string
  parentId?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const trimmed = input.body.trim()
    if (!trimmed) return { success: false, error: "Comment can't be empty." }
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("event_builder_comments")
      .insert({
        event_id: input.eventId,
        page_kind: input.pageKind,
        block_id: input.blockId,
        body: trimmed.slice(0, 2000),
        author_id: user?.id ?? null,
        parent_id: input.parentId ?? null,
      })
      .select("id")
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    return { success: true, id: (data?.id as string) ?? undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function resolveComment(id: string, resolved = true): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("event_builder_comments")
      .update({ resolved })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteComment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin.from("event_builder_comments").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
