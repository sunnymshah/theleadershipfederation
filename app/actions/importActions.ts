"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/**
 * Parse CSV text into an array of string arrays (rows).
 * Handles quoted fields with commas inside them.
 */
export async function parseCSV(csvText: string): Promise<string[][]> {
  const rows: string[][] = []
  const lines = csvText.split(/\r?\n/)

  for (const line of lines) {
    if (!line.trim()) continue
    const row: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"'
            i++ // skip escaped quote
          } else {
            inQuotes = false
          }
        } else {
          current += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === ",") {
          row.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
    }
    row.push(current.trim())
    rows.push(row)
  }

  return rows
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

interface AttendeeRow {
  name: string
  email: string
  phone?: string
  company?: string
  designation?: string
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

/**
 * Import attendees in bulk for a given event and ticket.
 * - Validates all emails
 * - Skips duplicates (same email + event)
 * - Creates attendees with status='registered', payment_status='free'
 */
export async function importAttendees(
  eventId: string,
  ticketId: string,
  rows: AttendeeRow[]
): Promise<ImportResult> {
  const { supabase } = await getAuthenticatedClient()

  const errors: string[] = []
  let imported = 0
  let skipped = 0

  // Validate emails upfront
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.name || !row.name.trim()) {
      errors.push(`Row ${i + 1}: Name is missing.`)
    }
    if (!row.email || !isValidEmail(row.email.trim())) {
      const emailVal = row.email || "(empty)"
      errors.push("Row " + (i + 1) + ": Invalid email " + JSON.stringify(emailVal) + ".")
    }
  }

  if (errors.length > 0) {
    return { imported: 0, skipped: 0, errors }
  }

  // Fetch existing emails for this event to detect duplicates
  const { data: existingAttendees } = await supabase
    .from("attendees")
    .select("email")
    .eq("event_id", eventId)

  const existingEmails = new Set(
    (existingAttendees ?? []).map((a) => a.email.toLowerCase())
  )

  // Process in batches of 50
  const batchSize = 50
  const toInsert: Array<{
    event_id: string
    ticket_id: string | null
    name: string
    email: string
    phone: string | null
    company: string | null
    designation: string | null
    status: string
    payment_status: string
  }> = []

  for (const row of rows) {
    const email = row.email.trim().toLowerCase()
    if (existingEmails.has(email)) {
      skipped++
      continue
    }

    // Mark as seen to prevent duplicates within the import batch
    existingEmails.add(email)

    toInsert.push({
      event_id: eventId,
      ticket_id: ticketId || null,
      name: row.name.trim(),
      email,
      phone: row.phone?.trim() || null,
      company: row.company?.trim() || null,
      designation: row.designation?.trim() || null,
      status: "registered",
      payment_status: "free",
    })
  }

  // Insert in batches
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    const { error } = await supabase.from("attendees").insert(batch)
    if (error) {
      errors.push(`Batch insert error (rows ${i + 1}-${i + batch.length}): ${error.message}`)
    } else {
      imported += batch.length
    }
  }

  // Increment ticket sold count
  if (ticketId && imported > 0) {
    const { data: ticket } = await supabase
      .from("tickets")
      .select("sold")
      .eq("id", ticketId)
      .single()

    if (ticket) {
      await supabase
        .from("tickets")
        .update({ sold: (ticket.sold || 0) + imported })
        .eq("id", ticketId)
    }
  }

  // Revalidate caches
  revalidatePath("/admin/attendees", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
  revalidatePath(`/admin/events/${eventId}`, "page")

  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single()

  if (event?.slug) {
    revalidatePath(`/events/${event.slug}`, "page")
  }

  return { imported, skipped, errors }
}
