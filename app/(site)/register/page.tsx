import { Suspense } from "react"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll"
import { RegistrationForm } from "@/components/site/RegistrationForm"

export const revalidate = 3600

export const metadata = {
  title: "Register & Get Involved | The Leadership Federation",
  description:
    "Register for The Leadership Federation events as a delegate, speaker, sponsor, jury member, or nominate a leader for an award. Join the global leadership community.",
  openGraph: {
    title: "Register & Get Involved | The Leadership Federation",
    description:
      "Register for The Leadership Federation events as a delegate, speaker, sponsor, jury member, or nominate a leader for an award.",
  },
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

export default async function RegisterPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch upcoming published events for the event dropdown
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, title")
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })

  const events = upcomingEvents ?? []

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
              Join the Movement
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-[#1a1a2e] mb-6"
              style={sfFont}
            >
              Register & Get Involved
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={200}>
            <p className="text-lg text-[#1a1a2e]/75 max-w-2xl mx-auto leading-relaxed">
              Whether you want to attend as a delegate, speak on stage, sponsor
              an event, nominate a leader for an award, or join our jury panel
              -- choose your path below and register in minutes.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Registration form with role selector (client component with Suspense for searchParams) */}
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-6 pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#1a1a2e]/[0.06] rounded-2xl p-6 h-40 animate-pulse"
                />
              ))}
            </div>
          </div>
        }
      >
        <RegistrationForm events={events} />
      </Suspense>
    </main>
  )
}
