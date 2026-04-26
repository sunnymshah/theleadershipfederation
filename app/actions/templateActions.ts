"use server"

/**
 * User-saved templates (event_user_templates) + apply-prebuilt-template.
 * Prebuilts live in lib/section-templates.ts (SECTION_TEMPLATES).
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"
import {
  saveStandardPagePuckData,
  getStandardPageByKind,
} from "./standardPageActions"
import { getTemplate, type SectionTemplate } from "@/lib/section-templates"
import type { StandardPageKind } from "@/lib/standard-pages"
import type { Data as PuckData } from "@measured/puck"

export type SavedTemplate = {
  id: string
  event_id: string | null
  name: string
  description: string | null
  data: PuckData
  thumbnail_url: string | null
  created_by: string | null
  created_at: string
}

export async function listUserTemplates(): Promise<{ success: boolean; templates: SavedTemplate[]; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("event_user_templates")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) return { success: false, templates: [], error: error.message }
    return { success: true, templates: (data ?? []) as SavedTemplate[] }
  } catch (err) {
    return { success: false, templates: [], error: (err as Error).message }
  }
}

export async function saveAsTemplate(input: {
  eventId: string
  name: string
  description?: string
  data: PuckData
  thumbnail_url?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!input.name?.trim()) return { success: false, error: "Name is required." }
    if (!input.data) return { success: false, error: "No content to save." }
    const admin = createAdminClient()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: row, error } = await admin
      .from("event_user_templates")
      .insert({
        event_id: input.eventId,
        name: input.name.trim().slice(0, 120),
        description: input.description?.trim() ?? null,
        data: input.data,
        thumbnail_url: input.thumbnail_url ?? null,
        created_by: user?.id ?? null,
      })
      .select("id")
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    return { success: true, id: (row?.id as string) ?? undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteUserTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin.from("event_user_templates").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Apply a prebuilt template OR a saved one to a standard page.
 *  mode='replace' overwrites; mode='append' merges blocks at the end. */
export async function applyTemplateToStandardPage(input: {
  eventId: string
  pageKind: StandardPageKind
  templateId?: string         // prebuilt id from SECTION_TEMPLATES
  savedTemplateId?: string    // event_user_templates row id
  mode: "replace" | "append"
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    let template: SectionTemplate | null = null
    let savedData: PuckData | null = null
    if (input.templateId) template = getTemplate(input.templateId)
    if (input.savedTemplateId) {
      const admin = createAdminClient()
      const { data } = await admin
        .from("event_user_templates")
        .select("data")
        .eq("id", input.savedTemplateId)
        .maybeSingle()
      savedData = (data?.data ?? null) as PuckData | null
    }
    const sourceData: PuckData | null = template ? template.data : savedData
    if (!sourceData) return { success: false, error: "Template not found." }

    let nextData: PuckData = sourceData
    if (input.mode === "append") {
      const existing = (await getStandardPageByKind(input.eventId, input.pageKind))?.settings as { puckData?: PuckData } | undefined
      if (existing?.puckData?.content) {
        nextData = {
          ...sourceData,
          content: [...existing.puckData.content, ...sourceData.content] as PuckData["content"],
          root: existing.puckData.root,
          zones: existing.puckData.zones ?? {},
        }
      }
    }
    return await saveStandardPagePuckData(input.eventId, input.pageKind, nextData)
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
