import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { Users, ArrowRight, ExternalLink } from "lucide-react"

export const revalidate = 0

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
    <main className="min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="relative pt-36 pb-16 px-6 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: "900px", height: "600px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)" }}
          aria-hidden
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#c9a84c]/40" />
            <span className="text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em]">Leadership</span>
            <div className="h-px w-8 bg-[#c9a84c]/40" />
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-[-0.02em] text-white mb-6"
            style={sfDisplay}
          >
            Advisory Board & Jury
          </h1>
          <p className="text-[16px] text-white/40 max-w-2xl mx-auto leading-relaxed" style={sfText}>
            The Leadership Federation is guided by an eminent panel of global CXOs, board
            directors, and domain experts who shape our strategic direction and uphold the
            highest standards across our awards, conclaves, and initiatives.
          </p>
        </div>
      </section>

      {/* Members grid or empty state */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        {boardMembers.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-6">
              <Users size={28} className="text-[#c9a84c]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3" style={sfDisplay}>
              Coming Soon
            </h2>
            <p className="text-white/35 text-[15px] max-w-md mx-auto mb-8" style={sfText}>
              Our advisory board profiles are being updated. Check back soon to meet the
              leaders guiding The Leadership Federation.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#c9a84c] text-black text-sm font-semibold hover:bg-[#b8943f] transition-all duration-200"
            >
              Express Interest <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boardMembers.map((member) => {
              const initials = member.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
              return (
                <div
                  key={member.id}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-[#c9a84c]/20 hover:bg-white/[0.04] transition-all duration-300"
                >
                  {/* Photo or initials */}
                  <div className="w-20 h-20 rounded-full mx-auto mb-5 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center overflow-hidden relative">
                    {member.image_url ? (
                      <Image src={member.image_url} alt={member.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <span className="text-xl font-bold text-[#c9a84c]/70" style={sfDisplay}>{initials}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1" style={sfDisplay}>{member.name}</h3>
                    {(member.designation || member.company) && (
                      <p className="text-sm text-white/40 mb-3" style={sfText}>
                        {[member.designation, member.company].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {member.bio && (
                      <p className="text-xs text-white/30 leading-relaxed line-clamp-3 mb-4" style={sfText}>
                        {member.bio}
                      </p>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors"
                      >
                        <ExternalLink size={14} /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
