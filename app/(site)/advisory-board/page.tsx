/* ═══════════════════════════════════════════════════════════════════════════
 *  ADVISORY BOARD & JURY — Server Component
 *
 *  Displays the distinguished leaders who guide The Leadership Federation.
 *  Placeholder data; swap for Supabase fetch when the table is ready.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Advisory Board & Jury | The Leadership Federation",
  description:
    "Meet the distinguished global leaders, CXOs, and thought leaders who guide The Leadership Federation's mission and jury our flagship awards.",
}

/* ─── Placeholder board members ──────────────────────────────────────────── */

interface BoardMember {
  name: string
  title: string
  company: string
  bio: string
}

const BOARD_MEMBERS: BoardMember[] = [
  {
    name: "Rajesh Kumar",
    title: "Former CEO",
    company: "Global Tech Corp",
    bio: "A seasoned technology leader with 30+ years steering Fortune 500 enterprises through digital transformation and strategic growth across APAC and the Middle East.",
  },
  {
    name: "Sarah Chen",
    title: "Managing Director, Asia Pacific",
    company: "Fortune 500 Bank",
    bio: "Drives regional strategy for one of the world's largest financial institutions, with deep expertise in cross-border capital markets and ESG-driven leadership.",
  },
  {
    name: "Dr. Amina Patel",
    title: "Board Director",
    company: "Innovation Council",
    bio: "A globally recognized voice in responsible AI governance and boardroom diversity, advising sovereign funds and multilateral bodies on technology ethics.",
  },
  {
    name: "Marcus Holt",
    title: "Global CHRO",
    company: "Nexus Industries",
    bio: "Architect of talent ecosystems spanning 40 countries, known for pioneering skills-based hiring frameworks and the future-of-work agenda at scale.",
  },
  {
    name: "Priya Venkatesh",
    title: "Senior Partner",
    company: "McKinley & Associates",
    bio: "Leads the firm's CEO advisory practice in emerging markets, specializing in GCC strategy, operating model design, and post-merger integration.",
  },
  {
    name: "Thomas Lindqvist",
    title: "Former CTO",
    company: "Ericsson Global Services",
    bio: "Spearheaded 5G and edge-computing strategy across 100+ markets; now a board advisor championing deep-tech innovation in sustainable infrastructure.",
  },
  {
    name: "Dr. Fatima Al-Rashid",
    title: "Director of Strategy",
    company: "Sovereign Wealth Fund, UAE",
    bio: "Oversees multi-billion-dollar portfolio allocation with a focus on future industries, AI-first ventures, and next-generation leadership development.",
  },
  {
    name: "James Okafor",
    title: "CEO",
    company: "Pan-Africa Growth Partners",
    bio: "A trailblazer in Africa's enterprise technology sector, building bridges between global capital, local talent, and scalable business models across the continent.",
  },
  {
    name: "Mei Ling Tan",
    title: "Chief Strategy Officer",
    company: "ASEAN Digital Alliance",
    bio: "Leads cross-border digital economy initiatives across Southeast Asia, advising governments and multinationals on smart-nation strategies.",
  },
  {
    name: "Robert Schneider",
    title: "Chairman",
    company: "European Leadership Institute",
    bio: "A thought leader in executive education and board governance, with three decades of experience shaping leadership curricula for C-suite executives globally.",
  },
  {
    name: "Ananya Desai",
    title: "Partner & Head of Technology",
    company: "Meridian Ventures",
    bio: "Backs category-defining enterprise SaaS and AI startups; recognized among the top 50 venture investors in Asia by industry publications.",
  },
  {
    name: "David Nakamura",
    title: "Former Global Head of Innovation",
    company: "Toyota Motor Corporation",
    bio: "Pioneered mobility-as-a-service platforms and autonomous logistics; now mentors the next generation of deep-tech founders in Japan and Silicon Valley.",
  },
]

/* ─── Helper: extract initials from a full name ──────────────────────────── */

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdvisoryBoardPage() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#1a1a2e]/50 uppercase tracking-[0.25em] mb-5">
            Governance & Excellence
          </span>
          <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight text-[#1a1a2e] mb-6">
            Advisory Board &amp; Jury
          </h1>
          <p className="text-lg text-[#1a1a2e]/55 max-w-2xl mx-auto leading-relaxed">
            The Leadership Federation is guided by an eminent panel of global CXOs, board
            directors, and domain experts who shape our strategic direction and uphold the
            highest standards across our awards, conclaves, and initiatives.
          </p>
        </div>
      </section>

      {/* ── Board Member Grid ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BOARD_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-2xl p-7 flex flex-col transition-shadow duration-300 hover:shadow-lg"
              style={{
                boxShadow: "0 1px 3px rgba(26,26,46,0.04), 0 4px 14px rgba(26,26,46,0.03)",
              }}
            >
              {/* Photo placeholder */}
              <div className="w-20 h-20 rounded-full bg-[#1a1a2e]/[0.07] flex items-center justify-center mb-5 shrink-0">
                <span className="text-lg font-semibold text-[#1a1a2e]/40 select-none">
                  {initials(member.name)}
                </span>
              </div>

              {/* Name & title */}
              <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">{member.name}</h3>
              <p className="text-sm font-medium text-[#1a1a2e]/60 mb-0.5">{member.title}</p>
              <p className="text-sm text-[#1a1a2e]/40 mb-4">{member.company}</p>

              {/* Bio */}
              <p className="text-sm text-[#1a1a2e]/50 leading-relaxed mt-auto">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA: Join the Board ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <div
          className="rounded-2xl p-10 md:p-14 text-center bg-white"
          style={{
            boxShadow: "0 2px 8px rgba(26,26,46,0.04), 0 8px 28px rgba(26,26,46,0.04)",
          }}
        >
          <div className="w-14 h-14 rounded-full bg-[#1a1a2e]/[0.06] flex items-center justify-center mx-auto mb-6">
            <Users size={24} className="text-[#1a1a2e]/50" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#1a1a2e] mb-4">
            Interested in Joining the Advisory Board?
          </h2>
          <p className="text-[#1a1a2e]/50 max-w-xl mx-auto mb-8 leading-relaxed">
            We are selectively expanding our advisory panel with leaders who bring deep
            domain expertise, global perspective, and a commitment to advancing the
            leadership ecosystem.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1a1a2e] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#1a1a2e]/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            Express Interest <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  )
}
