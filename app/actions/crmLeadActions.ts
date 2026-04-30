"use server"

/**
 * ─── CRM LEADS ──────────────────────────────────────────────────────────
 *
 * Zoho-style pipeline. Every prospect the federation talks to —
 * speaker outreach, partner inquiry, VIP prospect, site inbound —
 * flows through here with stages, owner, notes, activity timeline,
 * and tasks.
 *
 * Distinct from sponsor_leads (booth scan at an event).
 *
 * Gate: leads.view (read) / leads.create|edit|delete|import|export|assign (write).
 * Tasks use the dedicated tasks.* module.
 */

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission, getCurrentUserContext } from "@/lib/server-permissions"

/* ── Types ──────────────────────────────────────────────────────────── */

export type LeadStatus =
  | "new" | "contacted" | "qualified" | "proposal" | "won" | "lost"
export type LeadRating = "hot" | "warm" | "cold"
export type LeadSource =
  | "website" | "event" | "referral" | "import" | "campaign"
  | "linkedin" | "cold_outreach" | "sponsor_booth" | "other"

export interface CrmLead {
  id: string
  first_name: string
  last_name: string | null
  full_name: string
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  industry: string | null
  website_url: string | null
  linkedin_url: string | null
  city: string | null
  country: string | null
  status: LeadStatus
  rating: LeadRating | null
  score: number
  lead_value: number | null
  source: LeadSource
  source_detail: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  owner_id: string | null
  tags: string[]
  description: string | null
  converted_at: string | null
  converted_to_attendee_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface LeadInput {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  title?: string
  industry?: string
  websiteUrl?: string
  linkedinUrl?: string
  city?: string
  country?: string
  status?: LeadStatus
  rating?: LeadRating
  score?: number
  leadValue?: number
  source?: LeadSource
  sourceDetail?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  ownerId?: string | null
  tags?: string[]
  description?: string
}

export interface LeadNote {
  id: string
  lead_id: string
  body: string
  author_id: string | null
  author_email?: string | null
  created_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  type: string
  summary: string
  payload: Record<string, unknown>
  actor_id: string | null
  actor_email?: string | null
  created_at: string
}

export interface LeadTask {
  id: string
  lead_id: string | null
  title: string
  description: string | null
  due_date: string | null
  assignee_id: string | null
  assignee_email?: string | null
  status: "open" | "in_progress" | "done" | "cancelled"
  priority: "low" | "normal" | "high"
  created_at: string
  completed_at: string | null
  created_by: string | null
}

/* ── Helpers ────────────────────────────────────────────────────────── */

async function getServerClient() {
  const cookieStore = await cookies()
  return createClient(cookieStore)
}

/**
 * Extract a useful error message from anything thrown inside a server
 * action — including Supabase's PostgrestError shape (which is a plain
 * object with `.message`, NOT an `Error` instance, so the previous
 * `e instanceof Error ? e.message : "fallback"` pattern always hit
 * the fallback branch and hid the real root cause).
 */
function extractError(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === "object") {
    const obj = e as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    if (typeof obj.message === "string" && obj.message.length > 0) {
      // Surface RLS / constraint hints when the DB returned them.
      const parts = [obj.message]
      if (typeof obj.details === "string" && obj.details) parts.push(obj.details)
      if (typeof obj.hint === "string" && obj.hint) parts.push(`(hint: ${obj.hint})`)
      if (typeof obj.code === "string" && obj.code) parts.push(`[${obj.code}]`)
      return parts.join(" ")
    }
  }
  return fallback
}

function snakeifyInput(input: LeadInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (input.firstName !== undefined)   out.first_name = input.firstName.trim()
  if (input.lastName !== undefined)    out.last_name = input.lastName?.trim() || null
  if (input.email !== undefined)       out.email = input.email?.trim().toLowerCase() || null
  if (input.phone !== undefined)       out.phone = input.phone?.trim() || null
  if (input.company !== undefined)     out.company = input.company?.trim() || null
  if (input.title !== undefined)       out.title = input.title?.trim() || null
  if (input.industry !== undefined)    out.industry = input.industry?.trim() || null
  if (input.websiteUrl !== undefined)  out.website_url = input.websiteUrl?.trim() || null
  if (input.linkedinUrl !== undefined) out.linkedin_url = input.linkedinUrl?.trim() || null
  if (input.city !== undefined)        out.city = input.city?.trim() || null
  if (input.country !== undefined)     out.country = input.country?.trim() || null
  if (input.status !== undefined)      out.status = input.status
  if (input.rating !== undefined)      out.rating = input.rating
  if (input.score !== undefined)       out.score = input.score
  if (input.leadValue !== undefined)   out.lead_value = input.leadValue ?? null
  if (input.source !== undefined)      out.source = input.source
  if (input.sourceDetail !== undefined) out.source_detail = input.sourceDetail?.trim() || null
  if (input.utmSource !== undefined)   out.utm_source = input.utmSource?.trim() || null
  if (input.utmMedium !== undefined)   out.utm_medium = input.utmMedium?.trim() || null
  if (input.utmCampaign !== undefined) out.utm_campaign = input.utmCampaign?.trim() || null
  if (input.ownerId !== undefined)     out.owner_id = input.ownerId
  if (input.tags !== undefined)        out.tags = input.tags
  if (input.description !== undefined) out.description = input.description?.trim() || null
  return out
}

async function logActivity(
  leadId: string,
  type: string,
  summary: string,
  payload: Record<string, unknown> = {},
  actorId: string | null = null,
) {
  // Activity log writes also use the admin client — same RLS-lockdown
  // story as the main lead writes. Wrapped in a try/catch so a logging
  // failure never breaks the actual lead create/update path.
  try {
    const supabase = createAdminClient()
    await supabase.from("crm_lead_activities").insert({
      lead_id: leadId,
      type,
      summary,
      payload,
      actor_id: actorId,
    })
  } catch (e) {
    console.error("[crm-leads] activity log failed:", e)
  }
}

function revalidate() {
  try { revalidatePath("/admin/leads") } catch {}
}

/* ── Read ───────────────────────────────────────────────────────────── */

export async function listLeads(filters?: {
  status?: LeadStatus
  ownerId?: string
  source?: LeadSource
  search?: string
}): Promise<{ success: true; leads: CrmLead[] } | { success: false; error: string }> {
  try {
    await requirePermission("leads", "view")
    const supabase = await getServerClient()
    let q = supabase.from("crm_leads").select("*").order("created_at", { ascending: false })
    if (filters?.status)    q = q.eq("status", filters.status)
    if (filters?.ownerId)   q = q.eq("owner_id", filters.ownerId)
    if (filters?.source)    q = q.eq("source", filters.source)
    if (filters?.search) {
      const s = filters.search.trim().toLowerCase()
      if (s) {
        q = q.or(
          `full_name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%,phone.ilike.%${s}%`,
        )
      }
    }
    const { data, error } = await q
    if (error) throw error
    return { success: true, leads: (data as CrmLead[]) ?? [] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to load leads" }
  }
}

export async function getLead(
  id: string,
): Promise<{ success: true; lead: CrmLead } | { success: false; error: string }> {
  try {
    await requirePermission("leads", "view")
    const supabase = await getServerClient()
    const { data, error } = await supabase.from("crm_leads").select("*").eq("id", id).single()
    if (error) throw error
    return { success: true, lead: data as CrmLead }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Lead not found" }
  }
}

/* ── Team member directory (for owner / assignee pickers) ───────────── */

export async function listTeamMembers(): Promise<{
  success: true
  members: {
    user_id: string
    email: string
    name: string | null
    role: string
    profile_id: string | null
    profile_name: string | null
  }[]
} | { success: false; error: string }> {
  try {
    // Anyone authenticated with a team_members row can load the directory.
    // This dropdown is used by Leads, Tasks, Events (owner pickers, etc).
    // Gating it behind leads.view hid it from users who don't have CRM
    // access but do have Events / other workspace access.
    const ctx = await getCurrentUserContext()
    if (!ctx) return { success: false, error: "Unauthorized" }

    const admin = createAdminClient()
    const { data: rows, error } = await admin
      .from("team_members")
      .select("user_id, name, email, role, profile_id, status")
      .neq("status", "suspended")
      .order("name", { ascending: true })
    if (error) throw error

    // Resolve access-profile display names (for the "Sunny · Admin profile" hint).
    const profileIds = Array.from(
      new Set((rows ?? []).map((r) => r.profile_id as string | null).filter(Boolean)),
    ) as string[]
    const profileMap = new Map<string, string>()
    if (profileIds.length) {
      const { data: profs } = await admin
        .from("access_profiles")
        .select("id, name")
        .in("id", profileIds)
      for (const p of profs ?? []) profileMap.set(p.id as string, p.name as string)
    }

    // Pull latest auth.users.email (teams row email can drift).
    const ids = (rows ?? []).map((r) => r.user_id as string)
    const emailMap = new Map<string, string>()
    if (ids.length) {
      const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      for (const u of users?.users ?? []) {
        if (ids.includes(u.id)) emailMap.set(u.id, u.email ?? "")
      }
    }
    const members = (rows ?? []).map((r) => {
      const authEmail = emailMap.get(r.user_id as string)
      return {
        user_id: r.user_id as string,
        email: authEmail || (r.email as string) || "",
        name: (r.name as string | null) ?? null,
        role: r.role as string,
        profile_id: (r.profile_id as string | null) ?? null,
        profile_name: r.profile_id ? (profileMap.get(r.profile_id as string) ?? null) : null,
      }
    })
    return { success: true, members }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to load team" }
  }
}

/* ── Write ──────────────────────────────────────────────────────────── */

export async function createLead(
  input: LeadInput,
): Promise<{ success: true; lead: CrmLead } | { success: false; error: string }> {
  try {
    const ctx = await requirePermission("leads", "create")
    if (!input.firstName?.trim()) return { success: false, error: "First name is required" }

    // Use the service-role admin client for the write. The cookie-backed
    // client respects RLS, and the user's RLS lockdown migration drops the
    // permissive `crm_leads_auth_all` policy without replacing it, which
    // made every authenticated insert fail with a confusing "Failed to
    // create lead" error. requirePermission() above is the access gate;
    // the DB is the storage layer.
    const supabase = createAdminClient()
    const row = {
      ...snakeifyInput(input),
      created_by: ctx.userId,
      status: input.status ?? "new",
      source: input.source ?? "other",
    }
    const { data, error } = await supabase.from("crm_leads").insert(row).select().single()
    if (error) throw error

    await logActivity(
      data.id,
      "created",
      `Lead created${input.source ? ` from ${input.source}` : ""}`,
      { source: input.source ?? "other" },
      ctx.userId,
    )
    revalidate()
    return { success: true, lead: data as CrmLead }
  } catch (e) {
    return { success: false, error: extractError(e, "Failed to create lead") }
  }
}

export async function updateLead(
  id: string,
  patch: Partial<LeadInput>,
): Promise<{ success: true; lead: CrmLead } | { success: false; error: string }> {
  try {
    const ctx = await requirePermission("leads", "edit")
    // If the patch includes an owner change, the actor also needs leads.assign.
    if (patch.ownerId !== undefined) {
      await requirePermission("leads", "assign")
    }
    // Same admin-client switch as createLead — the user's RLS lockdown
    // dropped the permissive crm_leads policies, so cookie-backed writes
    // fail. requirePermission() above is the access gate.
    const supabase = createAdminClient()

    const { data: before } = await supabase
      .from("crm_leads")
      .select("status, owner_id")
      .eq("id", id)
      .single()

    const { data, error } = await supabase
      .from("crm_leads")
      .update(snakeifyInput(patch as LeadInput))
      .eq("id", id)
      .select()
      .single()
    if (error) throw error

    if (patch.status && before && patch.status !== before.status) {
      await logActivity(
        id,
        "status_change",
        `Status changed from ${before.status} to ${patch.status}`,
        { from: before.status, to: patch.status },
        ctx.userId,
      )
    }
    if (patch.ownerId !== undefined && before && patch.ownerId !== before.owner_id) {
      await logActivity(
        id,
        "assignment",
        patch.ownerId ? `Assigned to new owner` : `Unassigned`,
        { from: before.owner_id, to: patch.ownerId },
        ctx.userId,
      )
    }
    revalidate()
    return { success: true, lead: data as CrmLead }
  } catch (e) {
    return { success: false, error: extractError(e, "Failed to update lead") }
  }
}

export async function deleteLead(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission("leads", "delete")
    const supabase = createAdminClient()
    const { error } = await supabase.from("crm_leads").delete().eq("id", id)
    if (error) throw error
    revalidate()
    return { success: true }
  } catch (e) {
    return { success: false, error: extractError(e, "Failed to delete lead") }
  }
}

/* ── Bulk actions ───────────────────────────────────────────────────── */

export async function bulkUpdate(
  ids: string[],
  patch: { status?: LeadStatus; ownerId?: string | null; tags?: string[] },
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const ctx = await requirePermission("leads", "edit")
    if (patch.ownerId !== undefined) await requirePermission("leads", "assign")
    if (!ids.length) return { success: true, count: 0 }

    const supabase = createAdminClient()
    const update: Record<string, unknown> = {}
    if (patch.status) update.status = patch.status
    if (patch.ownerId !== undefined) update.owner_id = patch.ownerId
    if (patch.tags) update.tags = patch.tags

    const { error } = await supabase.from("crm_leads").update(update).in("id", ids)
    if (error) throw error

    // Log activity for each (lightweight summary)
    const summary =
      patch.status      ? `Bulk status → ${patch.status}`
      : patch.ownerId === null ? `Bulk unassigned`
      : patch.ownerId   ? `Bulk reassigned`
      : patch.tags      ? `Bulk tags updated`
      : `Bulk updated`

    await Promise.all(
      ids.map((id) =>
        logActivity(
          id,
          patch.status ? "status_change" : patch.ownerId !== undefined ? "assignment" : "tag",
          summary,
          patch as Record<string, unknown>,
          ctx.userId,
        ),
      ),
    )
    revalidate()
    return { success: true, count: ids.length }
  } catch (e) {
    return { success: false, error: extractError(e, "Bulk update failed") }
  }
}

export async function bulkDelete(
  ids: string[],
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    await requirePermission("leads", "delete")
    if (!ids.length) return { success: true, count: 0 }
    const supabase = createAdminClient()
    const { error } = await supabase.from("crm_leads").delete().in("id", ids)
    if (error) throw error
    revalidate()
    return { success: true, count: ids.length }
  } catch (e) {
    return { success: false, error: extractError(e, "Bulk delete failed") }
  }
}

/* ── Import ─────────────────────────────────────────────────────────── */

/** Raw row from the parsed CSV + a column→field mapping from the UI. */
export interface ImportRow { [col: string]: string }
export type ImportField =
  | "firstName" | "lastName" | "email" | "phone" | "company"
  | "title" | "industry" | "websiteUrl" | "linkedinUrl"
  | "city" | "country" | "status" | "rating" | "source"
  | "tags" | "description" | "ignore"

export interface ImportMapping { [csvColumn: string]: ImportField }

export interface ImportResult {
  created: number
  skippedDuplicates: number
  errors: { row: number; message: string }[]
}

export async function importLeads(
  rows: ImportRow[],
  mapping: ImportMapping,
  defaults?: { source?: LeadSource; ownerId?: string | null; tags?: string[] },
): Promise<{ success: true; result: ImportResult } | { success: false; error: string }> {
  try {
    const ctx = await requirePermission("leads", "import")
    if (!rows.length) return { success: true, result: { created: 0, skippedDuplicates: 0, errors: [] } }

    const supabase = await getServerClient()
    const result: ImportResult = { created: 0, skippedDuplicates: 0, errors: [] }

    // Grab existing emails for dedupe
    const { data: existing } = await supabase.from("crm_leads").select("email")
    const existingEmails = new Set(
      (existing ?? []).map((r) => (r.email as string | null)?.toLowerCase()).filter(Boolean),
    )

    const toInsert: Record<string, unknown>[] = []
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i]
      const lead: Partial<LeadInput> = {}
      for (const [col, field] of Object.entries(mapping)) {
        if (field === "ignore") continue
        const v = (raw[col] ?? "").toString().trim()
        if (!v) continue
        if (field === "tags") {
          lead.tags = v.split(",").map((t) => t.trim()).filter(Boolean)
        } else if (field === "status") {
          const s = v.toLowerCase()
          if (["new","contacted","qualified","proposal","won","lost"].includes(s)) {
            lead.status = s as LeadStatus
          }
        } else if (field === "rating") {
          const r = v.toLowerCase()
          if (["hot","warm","cold"].includes(r)) lead.rating = r as LeadRating
        } else if (field === "source") {
          const sr = v.toLowerCase()
          if ([
            "website","event","referral","import","campaign",
            "linkedin","cold_outreach","sponsor_booth","other",
          ].includes(sr)) {
            lead.source = sr as LeadSource
          }
        } else {
          ;(lead as Record<string, string>)[field] = v
        }
      }

      if (!lead.firstName) {
        result.errors.push({ row: i + 2, message: "Missing first name" })
        continue
      }

      const emailLc = lead.email?.toLowerCase()
      if (emailLc && existingEmails.has(emailLc)) {
        result.skippedDuplicates++
        continue
      }
      if (emailLc) existingEmails.add(emailLc)

      toInsert.push({
        ...snakeifyInput(lead as LeadInput),
        source: lead.source ?? defaults?.source ?? "import",
        owner_id: defaults?.ownerId ?? null,
        tags: [...(lead.tags ?? []), ...(defaults?.tags ?? [])].filter(Boolean),
        created_by: ctx.userId,
      })
    }

    if (toInsert.length) {
      const { data, error } = await supabase.from("crm_leads").insert(toInsert).select("id")
      if (error) throw error
      result.created = data?.length ?? 0

      // Activity log for each imported row
      await supabase.from("crm_lead_activities").insert(
        (data ?? []).map((r) => ({
          lead_id: r.id,
          type: "import",
          summary: "Imported via CSV",
          payload: { source: defaults?.source ?? "import" },
          actor_id: ctx.userId,
        })),
      )
    }

    revalidate()
    return { success: true, result }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Import failed" }
  }
}

/* ── Notes ──────────────────────────────────────────────────────────── */

export async function listNotes(
  leadId: string,
): Promise<{ success: true; notes: LeadNote[] } | { success: false; error: string }> {
  try {
    await requirePermission("leads", "view")
    const supabase = await getServerClient()
    const { data, error } = await supabase
      .from("crm_lead_notes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
    if (error) throw error

    const notes = (data ?? []) as LeadNote[]
    await attachAuthorEmails(notes, (n) => n.author_id)
    return { success: true, notes }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to load notes" }
  }
}

export async function addNote(
  leadId: string,
  body: string,
): Promise<{ success: true; note: LeadNote } | { success: false; error: string }> {
  try {
    const ctx = await requirePermission("leads", "edit")
    if (!body.trim()) return { success: false, error: "Note cannot be empty" }

    const supabase = await getServerClient()
    const { data, error } = await supabase
      .from("crm_lead_notes")
      .insert({ lead_id: leadId, body: body.trim(), author_id: ctx.userId })
      .select()
      .single()
    if (error) throw error

    await logActivity(leadId, "note", body.trim().slice(0, 200), {}, ctx.userId)
    return { success: true, note: data as LeadNote }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add note" }
  }
}

export async function deleteNote(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission("leads", "edit")
    const supabase = await getServerClient()
    const { error } = await supabase.from("crm_lead_notes").delete().eq("id", id)
    if (error) throw error
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete note" }
  }
}

/* ── Activities ─────────────────────────────────────────────────────── */

export async function listActivities(
  leadId: string,
): Promise<{ success: true; activities: LeadActivity[] } | { success: false; error: string }> {
  try {
    await requirePermission("leads", "view")
    const supabase = await getServerClient()
    const { data, error } = await supabase
      .from("crm_lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) throw error

    const activities = (data ?? []) as LeadActivity[]
    await attachAuthorEmails(activities, (a) => a.actor_id)
    return { success: true, activities }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to load activity" }
  }
}

/* ── Tasks ──────────────────────────────────────────────────────────── */

export async function listTasks(filter: {
  leadId?: string
  assigneeId?: string
  openOnly?: boolean
}): Promise<{ success: true; tasks: LeadTask[] } | { success: false; error: string }> {
  try {
    await requirePermission("tasks", "view")
    const supabase = await getServerClient()
    let q = supabase.from("crm_tasks").select("*").order("due_date", { ascending: true, nullsFirst: false })
    if (filter.leadId)     q = q.eq("lead_id", filter.leadId)
    if (filter.assigneeId) q = q.eq("assignee_id", filter.assigneeId)
    if (filter.openOnly)   q = q.in("status", ["open", "in_progress"])
    const { data, error } = await q
    if (error) throw error

    const tasks = (data ?? []) as LeadTask[]
    await attachAuthorEmails(tasks, (t) => t.assignee_id)
    return { success: true, tasks }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to load tasks" }
  }
}

export async function addTask(input: {
  leadId?: string | null
  title: string
  description?: string
  dueDate?: string | null
  assigneeId?: string | null
  priority?: "low" | "normal" | "high"
}): Promise<{ success: true; task: LeadTask } | { success: false; error: string }> {
  try {
    const ctx = await requirePermission("tasks", "create")
    if (!input.title.trim()) return { success: false, error: "Title is required" }

    const supabase = await getServerClient()
    const { data, error } = await supabase
      .from("crm_tasks")
      .insert({
        lead_id: input.leadId ?? null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        due_date: input.dueDate || null,
        assignee_id: input.assigneeId ?? null,
        priority: input.priority ?? "normal",
        created_by: ctx.userId,
      })
      .select()
      .single()
    if (error) throw error

    if (input.leadId) {
      await logActivity(
        input.leadId,
        "task",
        `Task: ${input.title.trim().slice(0, 100)}`,
        { taskId: data.id, dueDate: input.dueDate ?? null },
        ctx.userId,
      )
    }
    return { success: true, task: data as LeadTask }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add task" }
  }
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string
    description: string
    dueDate: string | null
    assigneeId: string | null
    status: "open" | "in_progress" | "done" | "cancelled"
    priority: "low" | "normal" | "high"
  }>,
): Promise<{ success: true; task: LeadTask } | { success: false; error: string }> {
  try {
    await requirePermission("tasks", "edit")
    const supabase = await getServerClient()
    const up: Record<string, unknown> = {}
    if (patch.title !== undefined)       up.title = patch.title.trim()
    if (patch.description !== undefined) up.description = patch.description?.trim() || null
    if (patch.dueDate !== undefined)     up.due_date = patch.dueDate
    if (patch.assigneeId !== undefined)  up.assignee_id = patch.assigneeId
    if (patch.status !== undefined)      up.status = patch.status
    if (patch.priority !== undefined)    up.priority = patch.priority
    const { data, error } = await supabase.from("crm_tasks").update(up).eq("id", id).select().single()
    if (error) throw error
    return { success: true, task: data as LeadTask }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update task" }
  }
}

export async function deleteTask(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission("tasks", "delete")
    const supabase = await getServerClient()
    const { error } = await supabase.from("crm_tasks").delete().eq("id", id)
    if (error) throw error
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete task" }
  }
}

/* ── Stats (for the Leads dashboard header) ─────────────────────────── */

export async function getLeadStats(): Promise<{
  success: true
  stats: {
    total: number
    byStatus: Record<LeadStatus, number>
    byRating: Record<LeadRating, number>
    bySource: Record<string, number>
    openTasks: number
    valueOpen: number
    valueWon: number
  }
} | { success: false; error: string }> {
  try {
    await requirePermission("leads", "view")
    const supabase = await getServerClient()
    const [{ data: leads }, { data: tasks }] = await Promise.all([
      supabase.from("crm_leads").select("status, rating, source, lead_value"),
      supabase.from("crm_tasks").select("id").in("status", ["open", "in_progress"]),
    ])

    const byStatus = { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 } as Record<LeadStatus, number>
    const byRating = { hot: 0, warm: 0, cold: 0 } as Record<LeadRating, number>
    const bySource: Record<string, number> = {}
    let valueOpen = 0
    let valueWon = 0

    for (const l of leads ?? []) {
      const s = l.status as LeadStatus
      if (s in byStatus) byStatus[s]++
      const r = l.rating as LeadRating | null
      if (r && r in byRating) byRating[r]++
      const src = l.source as string
      bySource[src] = (bySource[src] ?? 0) + 1
      const v = Number(l.lead_value ?? 0)
      if (s === "won") valueWon += v
      else if (s !== "lost") valueOpen += v
    }

    return {
      success: true,
      stats: {
        total: leads?.length ?? 0,
        byStatus,
        byRating,
        bySource,
        openTasks: tasks?.length ?? 0,
        valueOpen,
        valueWon,
      },
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to load stats" }
  }
}

/* ── Internal: attach author emails to a list ───────────────────────── */

async function attachAuthorEmails<T>(
  rows: T[],
  pickId: (r: T) => string | null,
): Promise<void> {
  const ids = Array.from(new Set(rows.map(pickId).filter(Boolean))) as string[]
  if (!ids.length) return
  const admin = createAdminClient()
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const emailById = new Map<string, string>()
  for (const u of data?.users ?? []) {
    if (ids.includes(u.id)) emailById.set(u.id, u.email ?? "")
  }
  for (const r of rows) {
    const id = pickId(r)
    if (id) {
      const rec = r as Record<string, unknown>
      rec.author_email = emailById.get(id) ?? null
      rec.actor_email = emailById.get(id) ?? null
      rec.assignee_email = emailById.get(id) ?? null
    }
  }
}

/** Current user id for client components that need it (e.g. "My leads" filter). */
export async function getMyId(): Promise<{ userId: string | null }> {
  try {
    const ctx = await getCurrentUserContext()
    return { userId: ctx.userId }
  } catch {
    return { userId: null }
  }
}
