import { notFound } from "next/navigation"
import { FeedbackForm } from "./FeedbackForm"
import { getEventForFeedback } from "@/lib/get-event"

export const revalidate = 300

interface Props {
  params: Promise<{ eventSlug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { eventSlug } = await params
  // Uses React cache() — shared with the page component
  const event = await getEventForFeedback(eventSlug)

  if (!event) return { title: "Feedback | The Leadership Federation" }

  return {
    title: `Feedback: ${event.title} | The Leadership Federation`,
    description: `Share your feedback for ${event.title}`,
  }
}

export default async function FeedbackPage({ params }: Props) {
  const { eventSlug } = await params
  // Uses React cache() — shared with generateMetadata
  const event = await getEventForFeedback(eventSlug)

  if (!event) notFound()

  const fmtDate = new Date(event.start_date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-20"
      style={{
        fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-[15%] left-1/2 -translate-x-1/2"
          style={{
            width: "800px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(231,171,28,0.08) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#e7ab1c]/30 bg-[#e7ab1c]/10 mb-6">
            <span className="text-[10px] font-bold text-[#e7ab1c] uppercase tracking-widest">
              Share Your Feedback
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-3">{event.title}</h1>
          <p className="text-sm text-[#1a1a2e]/75">
            {fmtDate} {event.venue && <>&middot; {event.venue}</>}
          </p>
        </div>

        <FeedbackForm eventId={event.id} />
      </div>
    </div>
  )
}
