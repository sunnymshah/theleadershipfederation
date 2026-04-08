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

async function getPublicClient() {
  const cookieStore = await cookies()
  return createClient(cookieStore)
}

async function invalidateCaches(supabase: ReturnType<typeof createClient>, eventId: string) {
  revalidatePath("/admin/live", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
  revalidatePath(`/admin/events/${eventId}`, "page")

  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single()

  if (event?.slug) revalidatePath(`/events/${event.slug}`, "page")
  revalidatePath("/events", "page")
  revalidatePath("/", "layout")
}

// ---------------------------------------------------------------------------
// Admin actions (require auth)
// ---------------------------------------------------------------------------

export async function createPoll(formData: FormData) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const eventId         = formData.get("event_id") as string
    const sessionId       = formData.get("session_id") as string
    const question        = formData.get("question") as string
    const pollType        = formData.get("poll_type") as string
    const optionsRaw      = formData.get("options") as string
    const allowAnonymous  = formData.get("allow_anonymous") === "true"
    const maxVotesPerUser = parseInt(formData.get("max_votes_per_user") as string) || 1

    if (!eventId || !question || !pollType || !optionsRaw) {
      return { success: false, error: "Event, question, poll type, and options are required." }
    }

    let options: string[]
    try {
      options = JSON.parse(optionsRaw)
    } catch {
      return { success: false, error: "Options must be a valid JSON array of strings." }
    }

    const { data, error } = await supabase
      .from("polls")
      .insert({
        event_id: eventId,
        session_id: sessionId || null,
        question,
        poll_type: pollType,
        options,
        status: "draft",
        show_results: false,
        allow_anonymous: allowAnonymous,
        max_votes_per_user: maxVotesPerUser,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, eventId)
    return { success: true, poll: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updatePoll(pollId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("polls")
      .select("event_id")
      .eq("id", pollId)
      .single()

    const question        = formData.get("question") as string
    const pollType        = formData.get("poll_type") as string
    const optionsRaw      = formData.get("options") as string
    const allowAnonymous  = formData.get("allow_anonymous") === "true"
    const maxVotesPerUser = parseInt(formData.get("max_votes_per_user") as string) || 1

    if (!question || !pollType || !optionsRaw) {
      return { success: false, error: "Question, poll type, and options are required." }
    }

    let options: string[]
    try {
      options = JSON.parse(optionsRaw)
    } catch {
      return { success: false, error: "Options must be a valid JSON array of strings." }
    }

    const { data, error } = await supabase
      .from("polls")
      .update({
        question,
        poll_type: pollType,
        options,
        allow_anonymous: allowAnonymous,
        max_votes_per_user: maxVotesPerUser,
      })
      .eq("id", pollId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true, poll: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deletePoll(pollId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("polls")
      .select("event_id")
      .eq("id", pollId)
      .single()

    const { error } = await supabase.from("polls").delete().eq("id", pollId)
    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function activatePoll(pollId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("polls")
      .update({ status: "active" })
      .eq("id", pollId)
      .select("event_id")
      .single()

    if (error) return { success: false, error: error.message }
    if (data?.event_id) await invalidateCaches(supabase, data.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function closePoll(pollId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("polls")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", pollId)
      .select("event_id")
      .single()

    if (error) return { success: false, error: error.message }
    if (data?.event_id) await invalidateCaches(supabase, data.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function togglePollResults(pollId: string, show: boolean) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("polls")
      .update({ show_results: show })
      .eq("id", pollId)
      .select("event_id")
      .single()

    if (error) return { success: false, error: error.message }
    if (data?.event_id) await invalidateCaches(supabase, data.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Admin read actions (require auth)
// ---------------------------------------------------------------------------

export async function getEventPolls(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: polls, error } = await supabase
      .from("polls")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message, polls: [] }

    // Attach vote counts per poll
    const pollsWithCounts = await Promise.all(
      (polls ?? []).map(async (poll) => {
        const { count } = await supabase
          .from("poll_votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", poll.id)

        return { ...poll, vote_count: count ?? 0 }
      })
    )

    return { success: true, polls: pollsWithCounts }
  } catch (err) {
    return { success: false, error: (err as Error).message, polls: [] }
  }
}

// ---------------------------------------------------------------------------
// Public actions (no auth required)
// ---------------------------------------------------------------------------

export async function submitVote(
  pollId: string,
  attendeeId: string | null,
  selectedOptions: string[],
  textResponse?: string
) {
  try {
    const supabase = await getPublicClient()

    // Validate the poll is active
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("id, status, max_votes_per_user, allow_anonymous")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) return { success: false, error: "Poll not found." }
    if (poll.status !== "active") return { success: false, error: "This poll is not currently active." }

    if (!poll.allow_anonymous && !attendeeId) {
      return { success: false, error: "This poll requires identification to vote." }
    }

    if (selectedOptions.length > (poll.max_votes_per_user ?? 1)) {
      return { success: false, error: `You may select at most ${poll.max_votes_per_user} option(s).` }
    }

    const votePayload: Record<string, unknown> = {
      poll_id: pollId,
      attendee_id: attendeeId,
      selected_options: selectedOptions,
      text_response: textResponse || null,
    }

    // Upsert based on unique constraint (poll_id, attendee_id)
    const { data, error } = await supabase
      .from("poll_votes")
      .upsert(votePayload, { onConflict: "poll_id,attendee_id" })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Fetch event_id for revalidation
    const { data: pollData } = await supabase
      .from("polls")
      .select("event_id")
      .eq("id", pollId)
      .single()

    if (pollData?.event_id) {
      const eventSupabase = supabase
      await invalidateCaches(eventSupabase, pollData.event_id)
    }

    return { success: true, vote: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getPollResults(pollId: string) {
  try {
    const supabase = await getPublicClient()

    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) return { success: false, error: "Poll not found.", poll: null }

    const { data: votes, error: votesError } = await supabase
      .from("poll_votes")
      .select("selected_options, text_response")
      .eq("poll_id", pollId)

    if (votesError) return { success: false, error: votesError.message, poll: null }

    // Aggregate vote counts per option
    const optionCounts: Record<string, number> = {}
    for (const option of (poll.options as string[]) ?? []) {
      optionCounts[option] = 0
    }

    const textResponses: string[] = []

    for (const vote of votes ?? []) {
      const selected = vote.selected_options as string[] | null
      if (selected) {
        for (const opt of selected) {
          if (opt in optionCounts) {
            optionCounts[opt]++
          } else {
            optionCounts[opt] = 1
          }
        }
      }
      if (vote.text_response) {
        textResponses.push(vote.text_response)
      }
    }

    return {
      success: true,
      poll: {
        ...poll,
        results: {
          total_votes: (votes ?? []).length,
          option_counts: optionCounts,
          text_responses: textResponses,
        },
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, poll: null }
  }
}

export async function getActivePolls(eventId: string) {
  try {
    const supabase = await getPublicClient()

    const { data: polls, error } = await supabase
      .from("polls")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "active")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message, polls: [] }

    return { success: true, polls: polls ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, polls: [] }
  }
}
