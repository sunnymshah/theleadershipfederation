import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ExternalLink, Gavel, ShieldCheck, Scale, Star } from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getPageSections } from "@/app/actions/pageContentActions"

export const revalidate = 300

function pickStr(obj: Record<string, unknown> | undefined, key: string, fallback: string): string {
  const v = obj?.[key]
  return typeof v === "string" && v.length > 0 ? v : fallback
}

export const metadata = {
  title: "Advisory Board & Jury | The Leadership Federation",
  description:
    "Meet the distinguished global leaders who guide The Leadership Federation — an eminent advisory board of CXOs and board directors, and an international jury that upholds the standard of our awards.",
}

function initials(name: string): string {
  return name
    .replace(/^(Dr\.?|Mr\.?|Ms\.?|Col(?:onel)?\.?)\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/* ── Researched from theleadershipfederation.com/advisoryboardandjury.
 *    Photos paired to each person via that page's own DOM order and
 *    re-hosted locally in /public/people. Members without an official
 *    photo fall back to a monogram avatar. ──────────────────────────── */

type BoardMember = { name: string; role: string; org: string; bio: string; img: string | null }

const ADVISORY_BOARD: BoardMember[] = [
  { name: "Mohammed Al Mashroom", role: "Founder & CEO", org: "Dubai Euro Group", bio: "An experienced entrepreneur with a strong track record across international commerce and development.", img: "/people/mohammed-al-mashroom.png" },
  { name: "Colonel Ajai Lal", role: "Leadership & Executive Coach", org: "TEDx Speaker · Author", bio: "A Colonel in the Indian Army (Veteran) and former Senior Military Observer with the United Nations.", img: "/people/ajai-lal.png" },
  { name: "Robin Joffe", role: "Partner & MD — Middle East, Africa & South Asia", org: "Frost & Sullivan", bio: "A growth strategist with deep on-the-ground experience building companies and businesses globally.", img: "/people/robin-arthur-joffe.png" },
  { name: "Devendrasingh Rajput", role: "Chief Business Officer", org: "Indira IVF", bio: "Over 20 years across the diagnostics and healthcare industry, with full P&L responsibility.", img: null },
  { name: "Sandip Patnaik", role: "Sr. Managing Director & Board Director", org: "JLL India", bio: "More than 26 years of professional experience, including 18 years with JLL India.", img: null },
  { name: "Dr. Rajesh Puneyani", role: "VP — Technology & Site Leader", org: "Kenvue India GCC", bio: "Over 28 years of global leadership in technology and digital transformation.", img: "/people/rajesh-puneyani.png" },
  { name: "Kaushik Das", role: "Managing Director", org: "JCPenney India", bio: "25+ years of global experience in transformation, strategy, operations and change management.", img: null },
  { name: "Srinivas Sampath", role: "VP — R&D & Site Leader", org: "Upland India", bio: "Nearly three decades building, scaling and transforming global technology and product organisations.", img: "/people/srinivas-sampath.png" },
  { name: "Monica Pirgal", role: "Chief Executive Officer", org: "Bhartiya Converge", bio: "A qualified lawyer with twenty-five years of deep, cross-industry leadership experience.", img: null },
  { name: "Neel Pandya", role: "CEO — EMEA, APAC & Global Partnerships", org: "Pixis", bio: "Extensive leadership across the FMCG, telecom, marketing and advertising industries.", img: "/people/neel-pandya.png" },
  { name: "Dr. Ishha Farha Quraishy", role: "Founder", org: "IFQ Technologies", bio: "An AI and Metaverse innovation evangelist with over 14 years in the technology industry.", img: "/people/ishha-farha-quraishy.png" },
  { name: "Jai Mulani", role: "Chief Executive Officer", org: "IBT", bio: "Transforming the Middle East BPO industry — built a company employing 1,000+ people in Dubai.", img: "/people/jai-mulani.png" },
  { name: "Radhakrishnan Mahalingam", role: "Chief IT Transformations Leader", org: "ICT & Smart Security", bio: "23 years across smart security, master system integration and ICT infrastructure architecture.", img: "/people/radhakrishnan-mahalingam.png" },
  { name: "Vaishali Wagle", role: "Founder & CEO", org: "Zenesse", bio: "A leadership strategist and peak-performance coach; two decades in banking technology with Citi and JPMorgan.", img: "/people/vaishali-wagle.png" },
]

type JuryMember = { name: string; role: string; country?: string; img: string | null }

const JURY: JuryMember[] = [
  { name: "Dr. Rama Mundra", role: "Dean, Adani Institute of Digital Technology Management", country: "India", img: "/people/rama-mundra.png" },
  { name: "Yaseen Sahar", role: "Channel Head, SBI Mutual Funds", country: "India", img: "/people/yaseen-sahar.png" },
  { name: "Aniruddh Tiwari", role: "Data Analytics Leader & Evangelist", country: "USA", img: "/people/aniruddh-tiwari.png" },
  { name: "Rupal Jain", role: "Semiconductor Industry Leader", country: "USA", img: "/people/rupal-jain.png" },
  { name: "Prashant Kumar", role: "Data Scientist & Generative AI Evangelist, BOLD", country: "USA", img: "/people/prashant-kumar.png" },
  { name: "Suneeta Modekurty", role: "Business Analytics, Data Science & GenAI Leader", country: "USA", img: "/people/suneeta-modekurty.png" },
  { name: "Dipen Tamboli", role: "Project Control Manager, Newtron Group", country: "USA", img: "/people/dipen-tamboli.png" },
  { name: "Anil Sood", role: "AI Governance & Data Management Leader, EY", country: "Canada & US", img: null },
  { name: "Gaurav Shah", role: "Director of Software Development, EG4 Electronics", img: null },
  { name: "Ankur Mehra", role: "Advisory Board Member & Author", img: null },
  { name: "Harish Padmanabhan", role: "Vice President — SRE, JP Morgan Chase", country: "USA", img: null },
  { name: "Punit Panjwani", role: "Manager, Control System Integration, Barry-Wehmiller Design Group", country: "USA", img: "/people/punit-panjwani.png" },
  { name: "Pavan Joshi", role: "Vice President of Software Engineering, Fiserv", country: "USA", img: "/people/pavan-joshi.png" },
  { name: "Arpil Mehta", role: "AVP — Fraud Analytics & Innovation, Bank of America", country: "USA", img: "/people/arpil-mehta.png" },
  { name: "Sabyasachi Mondal", role: "Senior Software Engineer, Apple", country: "USA", img: null },
  { name: "Shreerang Tarte", role: "Head — HR & Business Strategy, JSM Consulting", country: "USA", img: "/people/shreerang-tarte.png" },
  { name: "Bhashwanth Kadapagunta", role: "Specialist Leader (Senior Manager), Deloitte", country: "USA", img: "/people/bhashwanth-kadapagunta.png" },
  { name: "Sanjay Jain", role: "Machine Learning Engineer, Atlanta Journal-Constitution", country: "USA", img: "/people/sanjay-jain.png" },
  { name: "Santosh Kumar Singu", role: "Sr. Solution Specialist, Deloitte", country: "USA", img: null },
  { name: "Ramesh Babu Potla", role: "ERP / SAP Digital Transformation Manager, Corning Inc.", img: "/people/ramesh-babu-potla.png" },
  { name: "Anu Shivaraj", role: "Lead Data Scientist, E. & J. Gallo Winery", img: "/people/anu-shivaraj.jpg" },
  { name: "Ravi Shankar", role: "Machine Learning Manager, Overstock", img: "/people/ravi-shankar.jpg" },
  { name: "Vijitha Uppuluri", role: "Sr. Manager — Data Science, CVS Health", img: null },
  { name: "Ravi Kumar Vallemoni", role: "Sr. Data Architect, Bank of America", img: "/people/ravi-kumar-vallemoni.png" },
  { name: "Anjan G.", role: "Sr. Software Engineer, Optum", img: null },
  { name: "Ashmitha Nagraj", role: "Senior Full Stack Engineer, Fidelity", img: "/people/ashmitha-nagraj.png" },
  { name: "Sunil Karthik Kota", role: "Sr. Software Engineer & Technology Leader, Cisco", img: "/people/sunil-karthik-kota.png" },
  { name: "Jagadeeswar Alampally", role: "Software Development Manager, IQVIA", img: "/people/jagadeeswar-alampally.png" },
]

export default async function AdvisoryBoardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: members }, { sections }] = await Promise.all([
    supabase
      .from("advisory_board_members")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    getPageSections("advisory_board"),
  ])

  /* DB members override the researched defaults when present. */
  const dbBoard = (members ?? []).map((m) => ({
    name: m.name as string,
    role: (m.designation as string | null) ?? "",
    org: (m.company as string | null) ?? "",
    bio: (m.bio as string | null) ?? "",
    image_url: (m.image_url as string | null) ?? null,
    linkedin_url: (m.linkedin_url as string | null) ?? null,
  }))
  const board =
    dbBoard.length > 0
      ? dbBoard
      : ADVISORY_BOARD.map((b) => ({
          name: b.name,
          role: b.role,
          org: b.org,
          bio: b.bio,
          image_url: b.img,
          linkedin_url: null as string | null,
        }))

  const hero = {
    eyebrow: pickStr(sections.hero, "eyebrow", "Governance & Standards"),
    title: pickStr(sections.hero, "title", "The Advisory Board & Jury"),
    description: pickStr(
      sections.hero,
      "description",
      "The Leadership Federation is guided by an eminent panel of global CXOs and board directors — and its awards are upheld by an independent international jury. Together they set the bar, and hold it.",
    ),
  }

  return (
    <main className="bg-white">
      {/* ══════════════ Hero ══════════════ */}
      <section className="relative bg-white pt-32 lg:pt-40 pb-14 lg:pb-16 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(58% 56% at 50% 0%, rgba(0,113,227,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              {hero.eyebrow}
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={110}>
            <h1 className="mt-4 sm:mt-5 text-[clamp(2.4rem,5.6vw,4.4rem)] font-bold text-[#1d1d1f] tracking-[-0.04em] leading-[1.02]">
              The Advisory Board
              <br />
              &amp; <span className="text-[#0071e3]">Jury</span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={220}>
            <p className="mt-5 sm:mt-6 text-[15px] sm:text-[18px] text-[#1d1d1f]/60 leading-relaxed max-w-2xl mx-auto">
              {hero.description}
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={300}>
            <div className="mt-9 flex flex-wrap items-stretch justify-center gap-3">
              {[
                { icon: ShieldCheck, value: board.length, label: "Advisory Board" },
                { icon: Gavel, value: JURY.length, label: "Jury Members" },
                { icon: Scale, value: "100%", label: "Independent" },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="lf-glass rounded-2xl px-6 py-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#0071e3]/[0.1] flex items-center justify-center shrink-0">
                      <Icon size={17} className="text-[#0071e3]" strokeWidth={2} />
                    </span>
                    <span className="text-left">
                      <span className="block text-[20px] font-bold text-[#1d1d1f] leading-none tabular-nums">
                        {s.value}
                      </span>
                      <span className="block text-[10.5px] uppercase tracking-[0.1em] text-[#1d1d1f]/50 font-semibold mt-1">
                        {s.label}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════════ Advisory Board ══════════════ */}
      <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 46% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 88% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-10 sm:mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              The Advisory Board
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              The leaders who shape the agenda
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              CXOs, founders and board directors from across the GCC, India and
              beyond — guiding the Federation&apos;s strategic direction.
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={70}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {board.map((m) => (
              <div
                key={m.name}
                className="lf-glass rounded-[24px] p-7 transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="flex items-center gap-4 mb-5">
                  {/* Liquid-glass photo frame */}
                  <div className="lf-glass rounded-[20px] p-1.5 shrink-0">
                    <div className="w-[64px] h-[64px] rounded-[14px] overflow-hidden">
                      {m.image_url ? (
                        <Image
                          src={m.image_url}
                          alt={m.name}
                          width={144}
                          height={144}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0071e3] to-[#4c9df2] flex items-center justify-center">
                          <span className="text-[20px] font-bold text-white">
                            {initials(m.name)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold text-[#1d1d1f] tracking-[-0.015em] leading-tight">
                      {m.name}
                    </h3>
                    {m.org && (
                      <p className="text-[12.5px] font-semibold text-[#0071e3] mt-1 truncate">
                        {m.org}
                      </p>
                    )}
                  </div>
                </div>
                {m.role && (
                  <p className="text-[12.5px] font-semibold text-[#1d1d1f]/70 mb-2">
                    {m.role}
                  </p>
                )}
                {m.bio && (
                  <p className="text-[13px] text-[#1d1d1f]/60 leading-[1.65]">
                    {m.bio}
                  </p>
                )}
                {m.linkedin_url && (
                  <a
                    href={m.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-bold text-[#0071e3] hover:gap-2.5 transition-all duration-200"
                  >
                    <ExternalLink size={13} /> LinkedIn
                  </a>
                )}
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ The Jury ══════════════ */}
      <section className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 48% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              <Gavel size={14} /> The Jury
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              An independent international jury
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              Every Leadership Federation award is decided by a panel of senior
              practitioners — data scientists, engineering leaders and academics
              across India, the US and Canada — never by the organisers.
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={40}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {JURY.map((j) => (
              <div
                key={j.name}
                className="lf-glass rounded-[18px] p-5 flex items-start gap-3.5 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Liquid-glass photo frame */}
                <div className="lf-glass rounded-[14px] p-1 shrink-0">
                  <div className="w-[42px] h-[42px] rounded-[10px] overflow-hidden">
                    {j.img ? (
                      <Image
                        src={j.img}
                        alt={j.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0071e3] to-[#4c9df2] flex items-center justify-center">
                        <span className="text-[13px] font-bold text-white">
                          {initials(j.name)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold text-[#1d1d1f] tracking-[-0.01em] leading-tight">
                    {j.name}
                  </h3>
                  <p className="text-[12px] text-[#1d1d1f]/60 leading-[1.5] mt-1">
                    {j.role}
                  </p>
                  {j.country && (
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0071e3] bg-[#0071e3]/[0.08] rounded-full px-2 py-0.5">
                      {j.country}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 56% at 50% 100%, rgba(0,113,227,0.1) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up">
            <div className="lf-glass-strong rounded-[32px] p-10 sm:p-14 text-center">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-[#0071e3] items-center justify-center mx-auto mb-6 shadow-[0_14px_32px_-10px_rgba(0,113,227,0.7)]">
                <Star size={24} className="text-white" fill="currentColor" />
              </span>
              <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
                Lend your judgement
              </h2>
              <p className="mt-4 text-[#1d1d1f]/60 text-[16px] leading-relaxed max-w-md mx-auto">
                We invite accomplished leaders to join the advisory board or
                serve on the jury for an upcoming awards programme.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_14px_34px_-10px_rgba(0,113,227,0.6)]"
                >
                  Express Interest <ArrowRight size={16} />
                </Link>
                <Link
                  href="/about"
                  className="lf-glass inline-flex items-center px-7 py-[15px] rounded-full font-bold text-[15px] text-[#1d1d1f] transition-all duration-200"
                >
                  About the Federation
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  )
}
