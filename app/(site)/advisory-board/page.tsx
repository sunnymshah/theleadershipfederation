import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { Users, ArrowRight, ExternalLink } from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 300

export const metadata = {
  title: "Advisory Board & Jury | The Leadership Federation",
  description:
    "Meet the distinguished global leaders who guide The Leadership Federation's mission and jury our flagship awards.",
}

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

export default async function AdvisoryBoardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: members } = await supabase
    .from("advisory_board_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")

  const boardMembers = members ?? []

  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Hero */}
      <section className="relative pt-24 pb-12 px-6 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: "900px", height: "600px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(231,171,28,0.10) 0%, transparent 60%)" }}
          aria-hidden
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#e7ab1c]/40" />
              <span className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em]">Leadership</span>
              <div className="h-px w-8 bg-[#e7ab1c]/40" />
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-[-0.02em] text-[#1a1a2e] mb-6"
              style={sfDisplay}
            >
              Advisory Board & Jury
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="text-[16px] text-[#1a1a2e]/65 max-w-2xl mx-auto leading-relaxed" style={sfText}>
              The Leadership Federation is guided by an eminent panel of global CXOs, board
              directors, and domain experts who shape our strategic direction and uphold the
              highest standards across our awards, conclaves, and initiatives.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Members grid or empty state */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        {boardMembers.length === 0 ? (
          <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center mx-auto mb-6">
              <Users size={28} className="text-[#e7ab1c]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1a2e] mb-3" style={sfDisplay}>
              Coming Soon
            </h2>
            <p className="text-[#1a1a2e]/55 text-[15px] max-w-md mx-auto mb-8" style={sfText}>
              Our advisory board profiles are being updated. Check back soon to meet the
              leaders guiding The Leadership Federation.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-all duration-200 shadow-[0_4px_24px_rgba(231,171,28,0.25)]"
            >
              Express Interest <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" animation="fade-up" stagger={100}>
            {boardMembers.map((member) => {
              const initials = member.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
              return (
                <div
                  key={member.id}
                  className="group rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-6 hover:border-[#e7ab1c]/40 hover:shadow-md transition-all duration-300"
                >
                  {/* Photo or initials */}
                  <div className="w-20 h-20 rounded-full mx-auto mb-5 bg-gradient-to-br from-[#e7ab1c]/20 to-[#e7ab1c]/[0.06] flex items-center justify-center overflow-hidden relative">
                    {member.image_url ? (
                      <Image src={member.image_url} alt={member.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <span className="text-xl font-bold text-[#e7ab1c]" style={sfDisplay}>{initials}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-[#1a1a2e] mb-1" style={sfDisplay}>{member.name}</h3>
                    {(member.designation || member.company) && (
                      <p className="text-sm text-[#1a1a2e]/55 mb-3" style={sfText}>
                        {[member.designation, member.company].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {member.bio && (
                      <p className="text-xs text-[#1a1a2e]/65 leading-relaxed line-clamp-3 mb-4" style={sfText}>
                        {member.bio}
                      </p>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#e7ab1c]/80 hover:text-[#e7ab1c] transition-colors"
                      >
                        <ExternalLink size={14} /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </StaggerChildren>
        )}
      </section>
    </main>
  )
}
