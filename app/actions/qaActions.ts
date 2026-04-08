"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/* ── Helpers ───────────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/** Unauthenticated client for public-facing endpoints (submit, upvote, view). */
async function getPublicClient() {
  const cookieStore = await cookies()
  return createClient(cookieStore)
}

function revalidateQAPaths(eventId: string) {
  revalidatePath("/admin/live", "page")
  revalidatePath(`/admin/events/${eventId}`, "page")
  revalidatePath(`/events`, "page")
}

/* ── 1. Public: Submit a question ──────────────────────────────────────── */

export interface SubmitQuestionData {
  eventId: string
  sessionId?: string
  attendeeId?: string
  authorName?: string
  question: string
  isAnonymous?: boolean
}

export async function submitQuestion(data: SubmitQuestionData) {
  try {
    const supabase = await getPublicClient()

    if (!data.eventId || !data.question?.trim()) {
      return { success: false, error: "Event ID and question are required." }
    }

    const { data: row, error } = await supabase
      .from("qa_questions")
      .insert({
        event_id: data.eventId,
        session_id: data.sessionId || null,
        attendee_id: data.attendeeId || null,
        author_name: data.authorName || null,
        question: data.question.trim(),
        is_anonymous: data.isAnonymous ?? false,
        status: "pending",
        upvotes: 0,
        is_featured: false,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidateQAPaths(data.eventId)
    return { success: true, question: row }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 2. Admin: Approve a question ──────────────────────────────────────── */

export async function approveQuestion(questionId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("qa_questions")
      .update({ status: "approved" })
      .eq("id", questionId)
      .select("event_id")
      .single()

    if (error) return { success: false, error: error.message }

    revalidateQAPaths(data.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 3. Admin: Reject a question ───────────────────────────────────────── */

export async function rejectQuestion(questionId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("qa_questions")
      .update({ status: "rejected" })
      .eq("id", questionId)
      .select("event_id")
      .single()

    if (error) return { success: false, error: error.message }

    revalidateQAPaths(data.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 4. Admin: Answer a question ───────────────────────────────────────── */

export async function answerQuestion(questionId: string, answer: string, answeredBy: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!answer?.trim()) {
      return { success: false, error: "Answer text is required." }
    }

    const { data, error } = await supabase
      .from("qa_questions")
      .update({
        status: "answered",
        answer: answer.trim(),
        answered_by: answeredBy,
        answered_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .select("event_id")
      .single()

    if (error) return { success: false, error: error.message }

    revalidateQAPaths(data.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 5. Admin: Toggle pin (is_featured) ────────────────────────────────── */

export async function pinQuestion(questionId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch current state
    const { data: existing, error: fetchErr } = await supabase
      .from("qa_questions")
      .select("is_featured, event_id")
      .eq("id", questionId)
      .single()

    if (fetchErr || !existing) {
      return { success: false, error: fetchErr?.message ?? "Question not found." }
    }

    const { error } = await supabase
      .from("qa_questions")
      .update({ is_featured: !existing.is_featured })
      .eq("id", questionId)

    if (error) return { success: false, error: error.message }

    revalidateQAPaths(existing.event_id)
    return { success: true, is_featured: !existing.is_featured }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 6. Admin: Delete a question ───────────────────────────────────────── */

export async function deleteQuestion(questionId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch event_id before deleting so we can revalidate the right paths
    const { data: existing, error: fetchErr } = await supabase
      .from("qa_questions")
      .select("event_id")
      .eq("id", questionId)
      .single()

    if (fetchErr || !existing) {
      return { success: false, error: fetchErr?.message ?? "Question not found." }
    }

    const { error } = await supabase
      .from("qa_questions")
      .delete()
      .eq("id", questionId)

    if (error) return { success: false, error: error.message }

    revalidateQAPaths(existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 7. Public: Upvote a question ──────────────────────────────────────── */

export async function upvoteQuestion(questionId: string, attendeeId: string | null) {
  try {
    const supabase = await getPublicClient()

    // Upsert into qa_upvotes for idempotency (unique on question_id + attendee_id)
    const { error: upvoteErr } = await supabase
      .from("qa_upvotes")
      .upsert(
        {
          question_id: questionId,
          attendee_id: attendeeId,
        },
        { onConflict: "question_id,attendee_id" }
      )

    if (upvoteErr) return { success: false, error: upvoteErr.message }

    // Recount upvotes for this question
    const { count, error: countErr } = await supabase
      .from("qa_upvotes")
      .select("*", { count: "exact", head: true })
      .eq("question_id", questionId)

    if (countErr) return { success: false, error: countErr.message }

    const { data, error: updateErr } = await supabase
      .from("qa_questions")
      .update({ upvotes: count ?? 0 })
      .eq("id", questionId)
      .select("event_id")
      .single()

    if (updateErr) return { success: false, error: updateErr.message }

    revalidateQAPaths(data.event_id)
    return { success: true, upvotes: count ?? 0 }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 8. Admin: Get all questions for an event ──────────────────────────── */

export async function getEventQuestions(eventId: string, status?: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("qa_questions")
      .select("*")
      .eq("event_id", eventId)
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, questions: [] }

    // Strip author_name from anonymous questions
    const questions = (data ?? []).map((q) => ({
      ...q,
      author_name: q.is_anonymous ? null : q.author_name,
    }))

    return { success: true, questions }
  } catch (err) {
    return { success: false, error: (err as Error).message, questions: [] }
  }
}

/* ── 9. Public: Get approved / answered / pinned questions ─────────────── */

export async function getApprovedQuestions(eventId: string, sessionId?: string) {
  try {
    const supabase = await getPublicClient()

    let query = supabase
      .from("qa_questions")
      .select("id, event_id, session_id, author_name, question, answer, answered_by, status, upvotes, is_anonymous, is_featured, created_at, answered_at")
      .eq("event_id", eventId)
      .in("status", ["approved", "answered"])
      .order("is_featured", { ascending: false })
      .order("upvotes", { ascending: false })

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, questions: [] }

    // Strip author_name from anonymous questions
    const questions = (data ?? []).map((q) => ({
      ...q,
      author_name: q.is_anonymous ? null : q.author_name,
    }))

    return { success: true, questions }
  } catch (err) {
    return { success: false, error: (err as Error).message, questions: [] }
  }
}

/* ── 10. Admin: Live Q&A stats ─────────────────────────────────────────── */

export async function getLiveQAStats(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const [totalRes, approvedRes, answeredRes, pendingRes] = await Promise.all([
      supabase
        .from("qa_questions")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId),

      supabase
        .from("qa_questions")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "approved"),

      supabase
        .from("qa_questions")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "answered"),

      supabase
        .from("qa_questions")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "pending"),
    ])

    return {
      success: true,
      stats: {
        total: totalRes.count ?? 0,
        approved: approvedRes.count ?? 0,
        answered: answeredRes.count ?? 0,
        pending: pendingRes.count ?? 0,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      stats: { total: 0, approved: 0, answered: 0, pending: 0 },
    }
  }
}
