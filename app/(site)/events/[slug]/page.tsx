import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, MapPin, Clock, Users, Building2, ArrowLeft } from "lucide-react"
import { TicketPurchaseCard } from "@/components/site/TicketPurchaseCard"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: event } = await supabase.from("events").select("title, description, venue").eq("slug", slug).single()
  if (!event) return { title: "Event Not Found" }
  return {
    title: `${event.title} | The Leadership Federation`,
    description: event.description ?? `${event.title} at ${event.venue}`,
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}
function fmtDay(d: string) {
  return new Date(d).getDate().toString()
}
function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
}
function fmtYear(d: string) {
  return new Date(d).getFullYear().toString()
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

  const tierOrder = ["title", "platinum", "gold", "silver", "bronze", "partner"]
  const tierLabels: Record<string, string> = {
    title: "Title Sponsor", platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze", partner: "Partners",
  }
  const tierColors: Record<string, string> = {
    title: "text-[#c9a84c] border-[#c9a84c]/20", platinum: "text-zinc-300 border-zinc-300/20",
    gold: "text-yellow-400 border-yellow-400/20", silver: "text-zinc-400 border-zinc-400/20",
    bronze: "text-amber-600 border-amber-600/20", partner: "text-blue-400 border-blue-400/20",
  }
  const sessionTypes: Record<string, string> = {
    keynote: "bg-[#c9a84c]/10 text-[#c9a84c]", session: "bg-blue-500/10 text-blue-400",
    panel: "bg-purple-500/10 text-purple-400", workshop: "bg-emerald-500/10 text-emerald-400",
    break: "bg-zinc-500/10 text-zinc-400", networking: "bg-orange-500/10 text-orange-400",
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* ────────────────────────────────────────────────────────────
       *  HERO
       * ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        {/* Ambient glow layers */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute top-[-20%] left-1/2 -translate-x-1/2"
            style={{ width: "1100px", height: "700px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, transparent 65%)" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-48"
            style={{ background: "linear-gradient(to top, #050505, transparent)" }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm text-white/25 hover:text-[#c9a84c] transition-colors mb-10"
          >
            <ArrowLeft size={14} /> All Events
          </Link>

          {/* Date + Title lockup */}
          <div className="flex flex-col md:flex-row md:items-end gap-8 mb-10">
            {/* Large date block */}
            <div
              className="shrink-0 w-28 h-28 rounded-2xl flex flex-col items-center justify-center"
              style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)" }}
            >
              <span className="text-4xl font-bold text-[#c9a84c] leading-none tabular-nums">{fmtDay(event.start_date)}</span>
              <span className="text-[11px] font-bold text-[#c9a84c]/60 uppercase tracking-[0.15em] mt-1">
                {fmtMonth(event.start_date)} {fmtYear(event.start_date)}
              </span>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.08] mb-5">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-sm text-white/40">
                <span className="flex items-center gap-2">
                  <Calendar size={15} className="text-[#c9a84c]/70" />
                  {fmtDate(event.start_date)} — {fmtDate(event.end_date)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#c9a84c]/70" />
                  {event.venue}
                </span>
              </div>
            </div>
          </div>

          {event.description && (
            <p className="text-lg text-white/35 max-w-3xl leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Quick nav pills */}
          {(tickets.length > 0 || speakers.length > 0 || sessions.length > 0) && (
            <div className="flex flex-wrap gap-3 mt-10">
              {tickets.length > 0 && (
                <a href="#tickets" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[#c9a84c] transition-colors hover:bg-[#c9a84c]/10" style={{ border: "1px solid rgba(201,168,76,0.2)" }}>
                  Secure Your Seat
                </a>
              )}
              {speakers.length > 0 && (
                <a href="#speakers" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-white/40 hover:text-white/70 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Users size={12} /> {speakers.length} Speaker{speakers.length !== 1 ? "s" : ""}
                </a>
              )}
              {sessions.length > 0 && (
                <a href="#agenda" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-white/40 hover:text-white/70 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Clock size={12} /> Agenda
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
       *  SPEAKERS — Apple Executive Grid
       * ──────────────────────────────────────────────────────────── */}
      {speakers.length > 0 && (
        <section id="speakers" className="py-24 relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em] mb-3 block">
                Meet the Minds
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Featured Speakers
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {speakers.map((speaker) => (
                <div key={speaker.id} className="text-center group">
                  {/* Avatar */}
                  <div className="mx-auto mb-5 relative">
                    {speaker.image_url ? (
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="w-32 h-32 rounded-full object-cover mx-auto ring-2 ring-white/[0.06] group-hover:ring-[#c9a84c]/30 transition-all duration-500"
                      />
                    ) : (
                      <div
                        className="w-32 h-32 rounded-full mx-auto flex items-center justify-center ring-2 ring-white/[0.06] group-hover:ring-[#c9a84c]/30 transition-all duration-500"
                        style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)" }}
                      >
                        <span className="text-2xl font-bold text-[#c9a84c]/70">
                          {speaker.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="text-lg font-semibold text-white mb-1">{speaker.name}</h3>
                  {(speaker.designation || speaker.company) && (
                    <p className="text-sm text-white/35">
                      {speaker.designation}{speaker.designation && speaker.company ? ", " : ""}{speaker.company}
                    </p>
                  )}
                  {speaker.bio && (
                    <p className="text-xs text-white/20 mt-3 max-w-xs mx-auto leading-relaxed line-clamp-3">
                      {speaker.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  TICKETS — Premium Pricing Cards
       * ──────────────────────────────────────────────────────────── */}
      {tickets.length > 0 && (
        <section id="tickets" className="py-24 relative">
          {/* Subtle section divider glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ width: "800px", height: "400px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(201,168,76,0.04) 0%, transparent 60%)" }}
            aria-hidden
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em] mb-3 block">
                Secure Your Place
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Choose Your Experience
              </h2>
              <p className="text-sm text-white/30 max-w-lg mx-auto">
                Select the tier that matches your level of engagement. Limited seats available.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {tickets.map((ticket) => (
                <TicketPurchaseCard
                  key={ticket.id}
                  ticket={ticket}
                  eventId={event.id}
                  eventTitle={event.title}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  AGENDA
       * ──────────────────────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <section id="agenda" className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em] mb-3 block">
                The Programme
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Event Agenda
              </h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 transition-colors hover:bg-white/[0.02]"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {/* Time */}
                  <div className="shrink-0 text-sm font-mono text-white/30 w-36 tabular-nums">
                    {fmtTime(session.start_time)} — {fmtTime(session.end_time)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sessionTypes[session.session_type] ?? "bg-white/5 text-white/30"}`}>
                        {session.session_type}
                      </span>
                      {session.track && (
                        <span className="text-[10px] text-white/20 uppercase tracking-wider">{session.track}</span>
                      )}
                    </div>
                    <h3 className="font-medium text-white/85">{session.title}</h3>
                    {session.description && (
                      <p className="text-sm text-white/30 mt-1 line-clamp-2">{session.description}</p>
                    )}
                  </div>

                  {/* Room */}
                  {session.room && (
                    <div className="shrink-0 text-xs text-white/20 px-2.5 py-1 rounded-md bg-white/[0.03]">
                      {session.room}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────
       *  SPONSORS
       * ──────────────────────────────────────────────────────────── */}
      {sponsors.length > 0 && (
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em] mb-3 block">
                Our Partners
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Sponsors & Partners
              </h2>
            </div>

            {tierOrder.map((tier) => {
              const tierSponsors = sponsors.filter((s) => s.tier === tier)
              if (tierSponsors.length === 0) return null
              const colorClass = tierColors[tier] ?? "text-white/40 border-white/[0.06]"
              return (
                <div key={tier} className="mb-12 last:mb-0">
                  <h3 className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-5 text-center ${colorClass.split(" ")[0]}`}>
                    {tierLabels[tier] ?? tier}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {tierSponsors.map((sponsor) => (
                      <div
                        key={sponsor.id}
                        className={`rounded-xl px-8 py-5 text-center transition-colors hover:bg-white/[0.02] ${colorClass}`}
                        style={{ border: "1px solid" }}
                      >
                        {sponsor.logo_url ? (
                          <img src={sponsor.logo_url} alt={sponsor.name} className="h-10 mx-auto mb-2 object-contain" />
                        ) : (
                          <Building2 size={24} className="mx-auto mb-2 opacity-40" />
                        )}
                        <p className="font-semibold text-white/80 text-sm">{sponsor.name}</p>
                        {sponsor.description && (
                          <p className="text-[11px] text-white/25 mt-1 max-w-[200px]">{sponsor.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
