import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import { DelegateDirectory } from "@/components/site/DelegateDirectory"
import { getEventForDelegates } from "@/lib/get-event"

export const revalidate = 1800

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  // Uses React cache() — shared with the page component
  const event = await getEventForDelegates(slug)

  if (!event || !event.show_delegate_directory) return { title: "Not Found" }

  return {
    title: `Delegate Directory — ${event.title} | The Leadership Federation`,
    description: `Browse the delegate directory for ${event.title}. Connect and network with fellow leaders.`,
  }
}

export default async function DelegateDirectoryPage({ params }: Props) {
  const { slug } = await params
  // Uses React cache() — shared with generateMetadata
  const event = await getEventForDelegates(slug)

  if (!event || !event.show_delegate_directory) notFound()

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch delegates — only public info (no email, no phone)
  const { data: delegates } = await supabase
    .from("attendees")
    .select("id, name, company, designation, linkedin_url")
    .eq("event_id", event.id)
    .eq("show_in_directory", true)
    .in("status", ["registered", "confirmed", "checked_in"])
    .order("name")

  const delegateList = delegates ?? []

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* ── Hero Header ──────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: "900px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Breadcrumb */}
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-white/25 hover:text-[#c9a84c] transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to Event
          </Link>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#c9a84c]/40" />
              <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em]">
                Networking
              </span>
              <div className="h-px w-8 bg-[#c9a84c]/40" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              Delegate Directory
            </h1>
            <p className="text-base text-white/40 max-w-xl mx-auto">
              {event.title}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center mb-12">
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
              style={{
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <Users size={18} className="text-[#c9a84c]" />
              <span className="text-lg font-bold text-[#c9a84c] tabular-nums">{delegateList.length}+</span>
              <span className="text-sm text-white/40">Leaders Attending</span>
            </div>
          </div>

          {/* Client-side search + grid */}
          <DelegateDirectory delegates={delegateList} />
        </div>
      </section>
    </div>
  )
}
