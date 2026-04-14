import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LiveTabs } from "@/components/live/LiveTabs"

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("slug", slug)
    .single()

  if (!event) return { title: "Event Not Found" }

  return {
    title: `Live | ${event.title} | The Leadership Federation`,
    description: `Join the live experience for ${event.title}. Vote on polls, ask questions, and follow the schedule.`,
  }
}

export default async function LiveEventPage({ params }: Props) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, slug, venue, start_date, end_date, cover_image_url, status"
    )
    .eq("slug", slug)
    .single()

  if (!event) notFound()

  /* Fetch sessions for the schedule tab */
  const { data: sessions } = await supabase
    .from("event_sessions")
    .select(
      "id, title, description, start_time, end_time, speaker_name, location, session_type"
    )
    .eq("event_id", event.id)
    .order("start_time", { ascending: true })

  return (
    <div className="min-h-screen text-[#1a1a2e]">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#F4F8FF]/95 backdrop-blur-md border-b border-[#1a1a2e]/[0.06]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/events/${slug}`}
            className="shrink-0 w-9 h-9 rounded-full bg-[#1a1a2e]/[0.05] flex items-center justify-center active:bg-[#1a1a2e]/[0.1] transition-colors"
            aria-label="Back to event"
          >
            <ArrowLeft className="w-4 h-4 text-[#1a1a2e]/70" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#e7ab1c] font-semibold">
              Live
            </p>
            <h1 className="text-sm font-bold truncate">{event.title}</h1>
          </div>
          <div className="ml-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#e7ab1c]/15 text-[#e7ab1c] border border-[#e7ab1c]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e7ab1c] animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </header>

      {/* ── Tabbed Content ─────────────────────────────────────────── */}
      <LiveTabs eventId={event.id} sessions={sessions ?? []} />
    </div>
  )
}
