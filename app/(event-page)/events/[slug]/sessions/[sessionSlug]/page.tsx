/**
 * /events/[slug]/sessions/[sessionSlug] — session detail page (B19).
 */

import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { ArrowLeft, Calendar, Clock, MapPin, Mic2 } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { getEvent } from "@/lib/get-event"

export const revalidate = 30

interface Props {
  params: Promise<{ slug: string; sessionSlug: string }>
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

export async function generateMetadata({ params }: Props) {
  const { slug, sessionSlug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: "Session not found" }
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: session } = await supabase
    .from("sessions")
    .select("title")
    .eq("event_id", event.id)
    .eq("slug", sessionSlug)
    .maybeSingle()
  if (!session) return { title: `Session | ${event.title}` }
  return {
    title: `${session.title as string} | ${event.title}`,
  }
}

export default async function SessionDetailPage({ params }: Props) {
  const { slug, sessionSlug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, description, start_time, end_time, track, room, session_type")
    .eq("event_id", event.id)
    .eq("slug", sessionSlug)
    .maybeSingle()
  if (!session) notFound()

  // Linked speakers via session_speakers join.
  const { data: links } = await supabase
    .from("session_speakers")
    .select("speaker_id")
    .eq("session_id", session.id as string)
  const speakerIds = (links ?? []).map((l) => l.speaker_id as string)
  const { data: speakers } = speakerIds.length > 0
    ? await supabase.from("speakers").select("id, name, designation, company, image_url, slug").in("id", speakerIds)
    : { data: [] as Array<{ id: string; name: string; designation: string | null; company: string | null; image_url: string | null; slug: string | null }> }

  return (
    <main className="min-h-screen bg-white text-[#1a1a2e]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#1a1a2e]/60 hover:text-[#1a1a2e] mb-8"
        >
          <ArrowLeft size={14} /> Back to {event.title}
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{session.title as string}</h1>

        <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm opacity-80">
          {session.start_time && (
            <li className="inline-flex items-center gap-1.5"><Calendar size={14} /> {fmtDate(session.start_time as string)}</li>
          )}
          {session.start_time && (
            <li className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {fmtTime(session.start_time as string)}
              {session.end_time ? <> &mdash; {fmtTime(session.end_time as string)}</> : null}
            </li>
          )}
          {session.room && (
            <li className="inline-flex items-center gap-1.5"><MapPin size={14} /> {session.room as string}</li>
          )}
          {session.track && (
            <li className="inline-flex items-center gap-1.5 text-[#a37410]">{session.track as string}</li>
          )}
        </ul>

        {session.description && (
          <p className="mt-6 leading-relaxed whitespace-pre-wrap text-[15px]">
            {session.description as string}
          </p>
        )}

        {(speakers ?? []).length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] opacity-65 mb-3 inline-flex items-center gap-1.5">
              <Mic2 size={13} /> Speakers
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(speakers ?? []).map((sp) => {
                const inner = (
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-[15px] truncate">{sp.name}</span>
                    {(sp.designation || sp.company) && (
                      <span className="block text-xs opacity-70 truncate">
                        {[sp.designation, sp.company].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                )
                const card = (
                  <span className="flex items-center gap-3 p-3 rounded-xl border border-[#1a1a2e]/[0.06] bg-white">
                    {sp.image_url
                      ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sp.image_url} alt={sp.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      )
                      : <span className="w-10 h-10 rounded-full bg-[#F4F8FF] inline-flex items-center justify-center text-xs font-bold text-[#1a1a2e]/50">{sp.name.slice(0, 1)}</span>}
                    {inner}
                  </span>
                )
                return (
                  <li key={sp.id}>
                    {sp.slug
                      ? <Link href={`/events/${event.slug}/speakers/${sp.slug}`} className="block hover:opacity-90">{card}</Link>
                      : card}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
