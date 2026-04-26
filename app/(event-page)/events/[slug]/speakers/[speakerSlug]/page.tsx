/**
 * /events/[slug]/speakers/[speakerSlug] — speaker detail page (B18).
 *
 * Renders bio + socials for a speaker who has a slug. Falls through to
 * notFound() when the speaker doesn't exist or its slug is null.
 */

import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { getEvent } from "@/lib/get-event"

export const revalidate = 30

interface Props {
  params: Promise<{ slug: string; speakerSlug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, speakerSlug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: "Speaker not found" }
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: speaker } = await supabase
    .from("speakers")
    .select("name, designation, company")
    .eq("event_id", event.id)
    .eq("slug", speakerSlug)
    .maybeSingle()
  if (!speaker) return { title: `Speaker | ${event.title}` }
  return {
    title: `${speaker.name as string} | ${event.title}`,
    description: [speaker.designation, speaker.company].filter(Boolean).join(" · "),
  }
}

export default async function SpeakerDetailPage({ params }: Props) {
  const { slug, speakerSlug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: speaker } = await supabase
    .from("speakers")
    .select("id, name, designation, company, image_url, bio, social")
    .eq("event_id", event.id)
    .eq("slug", speakerSlug)
    .maybeSingle()
  if (!speaker) notFound()

  const social = (speaker.social ?? {}) as Record<string, string>

  return (
    <main className="min-h-screen bg-white text-[#1a1a2e]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#1a1a2e]/60 hover:text-[#1a1a2e] mb-8"
        >
          <ArrowLeft size={14} /> Back to {event.title}
        </Link>

        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-[#F4F8FF] shrink-0">
            {speaker.image_url
              ? <Image src={speaker.image_url as string} alt={speaker.name as string} fill className="object-cover" sizes="(max-width:640px) 160px, 192px" />
              : <div className="absolute inset-0 flex items-center justify-center text-[#1a1a2e]/30 font-bold text-2xl">{(speaker.name as string)?.slice(0, 1)}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{speaker.name as string}</h1>
            {(speaker.designation || speaker.company) && (
              <p className="mt-2 text-lg opacity-75">
                {[speaker.designation, speaker.company].filter(Boolean).join(" · ")}
              </p>
            )}
            {Object.keys(social).length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {Object.entries(social).map(([platform, url]) => (
                  url ? (
                    <li key={platform}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-[#1a1a2e]/10 hover:bg-[#1a1a2e]/[0.04] text-xs font-medium capitalize"
                      >
                        {platform}
                        <ExternalLink size={11} />
                      </a>
                    </li>
                  ) : null
                ))}
              </ul>
            )}
          </div>
        </div>

        {speaker.bio && (
          <article className="mt-10 prose prose-neutral max-w-none whitespace-pre-wrap leading-relaxed">
            {speaker.bio as string}
          </article>
        )}
      </div>
    </main>
  )
}
