import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { FeedbackForm } from "./FeedbackForm"

interface Props {
  params: Promise<{ eventSlug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { eventSlug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("slug", eventSlug)
    .single()

  if (!event) return { title: "Feedback | The Leadership Federation" }

  return {
    title: `Feedback: ${event.title} | The Leadership Federation`,
    description: `Share your feedback for ${event.title}`,
  }
}

export default async function FeedbackPage({ params }: Props) {
  const { eventSlug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, venue, start_date, cover_image_url")
    .eq("slug", eventSlug)
    .single()

  if (!event) notFound()

  const fmtDate = new Date(event.start_date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{
        background: "linear-gradient(160deg, #050505 0%, #0a0908 40%, #0f0d08 60%, #050505 100%)",
        fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-[20%] left-1/2 -translate-x-1/2"
          style={{
            width: "800px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(201,168,76,0.04) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/[0.04] mb-6">
            <span className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-widest">
              Share Your Feedback
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
          <p className="text-sm text-white/30">
            {fmtDate} {event.venue && <>&middot; {event.venue}</>}
          </p>
        </div>

        <FeedbackForm eventId={event.id} />
      </div>
    </div>
  )
}
