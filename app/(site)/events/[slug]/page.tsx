import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, MapPin, Clock, Users, Ticket, Building2 } from "lucide-react"
import { TicketPurchaseCard } from "@/components/site/TicketPurchaseCard"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: event } = await supabase.from("events").select("title, description").eq("slug", slug).single()
  if (!event) return { title: "Event Not Found" }
  return { title: `${event.title} | The Leadership Federation`, description: event.description }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) notFound()

  // Fetch related data in parallel
  const [speakersRes, ticketsRes, sessionsRes, sponsorsRes] = await Promise.all([
    supabase.from("speakers").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("tickets").select("*").eq("event_id", event.id).eq("status", "published").order("price_inr"),
    supabase.from("sessions").select("*").eq("event_id", event.id).order("start_time"),
    supabase.from("sponsors").select("*").eq("event_id", event.id).order("sort_order"),
  ])

  const speakers = speakersRes.data ?? []
  const tickets = ticketsRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const sponsors = sponsorsRes.data ?? []

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  }
  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  }
  function fmtPrice(n: number) {
    return new Intl.NumberFormat("en-IN").format(n)
  }

  const tierOrder = ["title", "platinum", "gold", "silver", "bronze", "partner"]
  const tierColors: Record<string, string> = {
    title: "text-[#c9a84c] border-[#c9a84c]/30",
    platinum: "text-zinc-300 border-zinc-300/30",
    gold: "text-yellow-400 border-yellow-400/30",
    silver: "text-zinc-400 border-zinc-400/30",
    bronze: "text-amber-600 border-amber-600/30",
    partner: "text-blue-400 border-blue-400/30",
  }

  const sessionTypes: Record<string, string> = {
    keynote: "bg-[#c9a84c]/10 text-[#c9a84c]",
    session: "bg-blue-500/10 text-blue-400",
    panel: "bg-purple-500/10 text-purple-400",
    workshop: "bg-emerald-500/10 text-emerald-400",
    break: "bg-zinc-500/10 text-zinc-400",
    networking: "bg-orange-500/10 text-orange-400",
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back link */}
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-[#c9a84c] transition-colors mb-8">
          ← All Events
        </Link>

        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-5 text-sm text-white/50 mb-6">
            <span className="flex items-center gap-2"><Calendar size={16} className="text-[#c9a84c]" /> {fmtDate(event.start_date)} — {fmtDate(event.end_date)}</span>
            <span className="flex items-center gap-2"><MapPin size={16} className="text-[#c9a84c]" /> {event.venue}</span>
          </div>
          {event.description && (
            <p className="text-lg text-white/40 max-w-3xl leading-relaxed">{event.description}</p>
          )}
        </div>

        {/* Tickets */}
        {tickets.length > 0 && (
          <section className="mb-20" id="tickets">
            <h2 className="text-xs font-bold text-[#c9a84c] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Ticket size={14} /> Register
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tickets.map((ticket) => (
                <TicketPurchaseCard key={ticket.id} ticket={ticket} eventId={event.id} eventTitle={event.title} />
              ))}
            </div>
          </section>
        )}

        {/* Speakers */}
        {speakers.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs font-bold text-[#c9a84c] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Users size={14} /> Speakers
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {speakers.map((speaker) => (
                <div key={speaker.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 text-lg font-bold shrink-0">
                      {speaker.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{speaker.name}</h3>
                      {speaker.designation && (
                        <p className="text-xs text-white/40">
                          {speaker.designation}{speaker.company ? `, ${speaker.company}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  {speaker.bio && <p className="text-sm text-white/35 line-clamp-3">{speaker.bio}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Agenda */}
        {sessions.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs font-bold text-[#c9a84c] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Clock size={14} /> Agenda
            </h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="shrink-0 text-sm font-mono text-white/40 w-32">
                    {fmtTime(session.start_time)} — {fmtTime(session.end_time)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sessionTypes[session.session_type] ?? "bg-white/5 text-white/40"}`}>
                        {session.session_type}
                      </span>
                      {session.track && <span className="text-[10px] text-white/25 uppercase tracking-wider">{session.track}</span>}
                    </div>
                    <h3 className="font-medium text-white/90">{session.title}</h3>
                    {session.description && <p className="text-sm text-white/35 mt-1">{session.description}</p>}
                  </div>
                  {session.room && (
                    <div className="shrink-0 text-xs text-white/30">{session.room}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sponsors */}
        {sponsors.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs font-bold text-[#c9a84c] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Building2 size={14} /> Sponsors & Partners
            </h2>
            {tierOrder.map((tier) => {
              const tierSponsors = sponsors.filter((s) => s.tier === tier)
              if (tierSponsors.length === 0) return null
              return (
                <div key={tier} className="mb-8">
                  <h3 className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-4 ${tierColors[tier]?.split(" ")[0] ?? "text-white/40"}`}>
                    {tier === "title" ? "Title Sponsor" : tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {tierSponsors.map((sponsor) => (
                      <div key={sponsor.id} className={`rounded-lg border bg-white/[0.02] px-6 py-4 ${tierColors[tier] ?? "border-white/[0.06]"}`}>
                        <p className="font-semibold text-white/80">{sponsor.name}</p>
                        {sponsor.description && <p className="text-xs text-white/30 mt-1">{sponsor.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
