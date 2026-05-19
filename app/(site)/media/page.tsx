import {
  ArrowRight, Newspaper, Video, ExternalLink, Mail, Radio, Megaphone,
} from "lucide-react"
import Link from "next/link"
import { Linkedin, Instagram, Facebook } from "@/components/icons/SocialIcons"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getMediaData } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "Newsroom & Media | The Leadership Federation",
  description:
    "Press coverage, news features and event video from The Leadership Federation — as reported by Business Standard, The Tribune, ANI, The Print and the national trade press.",
}

type Outlet = {
  id: string
  name: string
  logo_url: string | null
  article_url: string | null
  sort_order: number
}
type MediaVideo = {
  id: string
  title: string
  description: string | null
  youtube_id: string | null
  thumbnail_url: string | null
  label: string | null
  sort_order: number
}

const SOCIAL = {
  linkedin: "https://www.linkedin.com/company/leadership-federation/",
  instagram: "https://www.instagram.com/leadershipfederation/",
  facebook: "https://facebook.com/theleadershipfederation",
}

/* ── Verified press coverage of The Leadership Federation ─────────────── */
const PRESS = [
  {
    outlet: "Business Standard",
    title: "The Leadership Federation hosts a high-impact GCC & AI leadership gathering in Bengaluru",
    date: "April 2026",
    url: "https://www.business-standard.com/content/press-releases-ani/the-leadership-federation-hosts-a-high-impact-gcc-and-ai-leadership-gathering-in-bengaluru-honors-leaders-driving-global-enterprise-transformation-126041100705_1.html",
  },
  {
    outlet: "The Tribune",
    title: "Leadership Federation concludes the 5th Edition of the GCC Leadership Conclave — Pune",
    date: "January 2026",
    url: "https://www.tribuneindia.com/news/business/leadership-federation-successfully-concludes-the-5th-edition-of-the-gcc-leadership-conclave-pune-21-22-january-2026/",
  },
  {
    outlet: "Business Standard",
    title: "Leadership Federation concludes the 4th Edition of the GCC Leadership Conclave — Hyderabad",
    date: "November 2025",
    url: "https://www.business-standard.com/content/press-releases-ani/leadership-federation-concludes-the-4th-edition-of-the-gcc-leadership-conclave-hyderabad-13-14-november-2025-125112000566_1.html",
  },
  {
    outlet: "The Print",
    title: "Leadership Federation concludes the 5th Edition of the GCC Leadership Conclave: Pune",
    date: "January 2026",
    url: "https://theprint.in/ani-press-releases/leadership-federation-successfully-concludes-the-5th-edition-of-the-gcc-leadership-conclave-pune-21-22-january-2026/2839943/",
  },
  {
    outlet: "ANI News",
    title: "Leadership Federation concludes the 4th Edition of the GCC Leadership Conclave — Hyderabad",
    date: "November 2025",
    url: "https://aninews.in/news/business/leadership-federation-concludes-the-4th-edition-of-the-gcc-leadership-conclave-hyderabad-13-14-november-202520251120133517/",
  },
  {
    outlet: "The Tribune",
    title: "GCC Leadership Conclave 2025: celebrating innovation, leadership and global excellence",
    date: "September 2025",
    url: "https://www.tribuneindia.com/news/business/gcc-leadership-conclave-2025-celebrating-innovation-leadership-and-global-excellence/",
  },
  {
    outlet: "Business Standard",
    title: "GCC Leadership Conclave 2025 concludes in Bengaluru, celebrating excellence in Global Capability Centers",
    date: "May 2025",
    url: "https://www.business-standard.com/content/press-releases-ani/gcc-leadership-conclave-2025-concludes-in-bengaluru-celebrating-excellence-in-global-capability-centers-125052101311_1.html",
  },
  {
    outlet: "Editorji",
    title: "4th GCC Leadership Conclave — an exhibition of success",
    date: "November 2025",
    url: "https://www.editorji.com/business-news/4th-gcc-leadership-conclave-exhibition-of-success-1763626611135",
  },
]

const OUTLET_NAMES = [
  "Business Standard", "The Tribune", "ANI News", "The Print", "Editorji",
  "Gulf News", "The Economic Times", "YourStory", "EIN Presswire",
  "Frost & Sullivan", "Dailyhunt", "Lokmat Times",
]

export default async function MediaPage() {
  let outlets: Outlet[] = []
  let videos: MediaVideo[] = []
  try {
    const res = await getMediaData(true)
    if (res.success) {
      outlets = (res.outlets ?? []) as Outlet[]
      videos = (res.videos ?? []) as MediaVideo[]
    }
  } catch {
    /* empty state */
  }
  const realVideos = videos.filter((v) => v.youtube_id)

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
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              <Newspaper size={14} /> Newsroom
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={110}>
            <h1 className="mt-4 sm:mt-5 text-[clamp(2.4rem,5.6vw,4.4rem)] font-bold text-[#1d1d1f] tracking-[-0.04em] leading-[1.02]">
              The Federation
              <br />
              <span className="text-[#0071e3]">in the press</span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={220}>
            <p className="mt-5 sm:mt-6 text-[15px] sm:text-[18px] text-[#1d1d1f]/60 leading-relaxed max-w-2xl mx-auto">
              How the national and trade press cover our conclaves, awards and
              the leaders who convene at them — plus event video and media
              enquiries, all in one place.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════════ Featured Coverage ══════════════ */}
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
              Featured Coverage
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Recent press
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              Selected reporting from India&apos;s national and business press.
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={70}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {PRESS.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="lf-glass group flex flex-col rounded-[22px] p-7 transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center gap-2 text-[12px] font-bold text-[#0071e3] uppercase tracking-[0.12em]">
                    <Newspaper size={13} /> {p.outlet}
                  </span>
                  <span className="text-[11.5px] font-semibold text-[#1d1d1f]/45">
                    {p.date}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-[#1d1d1f] leading-[1.35] tracking-[-0.015em] flex-1">
                  {p.title}
                </h3>
                <span className="inline-flex items-center gap-1.5 mt-5 text-[13px] font-bold text-[#0071e3] group-hover:gap-2.5 transition-all duration-200">
                  Read article <ExternalLink size={13} />
                </span>
              </a>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ══════════════ As Featured In ══════════════ */}
      <section className="relative bg-white py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              As Featured In
            </span>
            <h2 className="mt-4 text-[clamp(1.6rem,3.4vw,2.4rem)] font-bold text-[#1d1d1f] tracking-[-0.03em]">
              Trusted by the newsdesks that cover enterprise
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {(outlets.length > 0 ? outlets.map((o) => o.name) : OUTLET_NAMES).map(
                (name) => (
                  <span
                    key={name}
                    className="lf-glass rounded-full px-5 py-2.5 text-[13px] font-bold text-[#1d1d1f]"
                  >
                    {name}
                  </span>
                ),
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════════ Video Highlights ══════════════ */}
      {realVideos.length > 0 && (
        <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(54% 46% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up" className="flex flex-wrap items-end justify-between gap-4 mb-10 sm:mb-12">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                  <Video size={14} /> Watch
                </span>
                <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                  Video highlights
                </h2>
              </div>
              <Link
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="lf-glass inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold text-[#1d1d1f] hover:gap-2.5 transition-all duration-200"
              >
                More on LinkedIn <ExternalLink size={13} />
              </Link>
            </AnimateOnScroll>

            <StaggerChildren
              animation="fade-up"
              stagger={90}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              {realVideos.map((vid) => (
                <div key={vid.id} className="lf-glass rounded-[22px] overflow-hidden">
                  <div className="w-full aspect-video bg-[#0a0a14] relative">
                    <iframe
                      src={`https://www.youtube.com/embed/${vid.youtube_id}`}
                      title={vid.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-[16px] font-bold text-[#1d1d1f] tracking-[-0.01em]">
                      {vid.title}
                    </h3>
                    {vid.label && (
                      <span className="text-[11.5px] text-[#0071e3] uppercase tracking-[0.12em] font-semibold">
                        {vid.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </section>
      )}

      {/* ══════════════ Media Enquiries ══════════════ */}
      <section className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 56% at 50% 100%, rgba(0,113,227,0.1) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Press enquiries */}
            <AnimateOnScroll animation="fade-up">
              <div className="lf-glass-strong rounded-[28px] p-8 sm:p-10 h-full">
                <span className="inline-flex w-12 h-12 rounded-2xl bg-[#0071e3] items-center justify-center mb-5 shadow-[0_12px_28px_-8px_rgba(0,113,227,0.6)]">
                  <Megaphone size={22} className="text-white" strokeWidth={1.8} />
                </span>
                <h2 className="text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold text-[#1d1d1f] tracking-[-0.025em] leading-[1.15]">
                  Media &amp; press enquiries
                </h2>
                <p className="mt-3 text-[14px] text-[#1d1d1f]/60 leading-[1.7]">
                  Journalists and editors — for interviews, event accreditation,
                  speaker access or our press kit, reach the communications team.
                </p>
                <a
                  href="mailto:register@theleadershipfederation.com?subject=Media%20enquiry"
                  className="inline-flex items-center gap-2 mt-6 px-7 py-[14px] rounded-full font-bold text-[14px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_12px_30px_-10px_rgba(0,113,227,0.6)]"
                >
                  <Mail size={15} /> Contact the press team
                </a>
              </div>
            </AnimateOnScroll>

            {/* Follow / channels */}
            <AnimateOnScroll animation="fade-up" delay={120}>
              <div className="lf-glass-strong rounded-[28px] p-8 sm:p-10 h-full flex flex-col">
                <h2 className="text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold text-[#1d1d1f] tracking-[-0.025em] leading-[1.15]">
                  Follow the Federation
                </h2>
                <p className="mt-3 text-[14px] text-[#1d1d1f]/60 leading-[1.7]">
                  Announcements, event coverage and leadership insight as it
                  publishes.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" className="lf-glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold text-[#1d1d1f]">
                    <Linkedin size={15} /> LinkedIn
                  </a>
                  <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="lf-glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold text-[#1d1d1f]">
                    <Instagram size={15} /> Instagram
                  </a>
                  <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="lf-glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold text-[#1d1d1f]">
                    <Facebook size={15} /> Facebook
                  </a>
                </div>
                {/* The Sunny Shah Show — a platform, linked, not the focus */}
                <Link
                  href="/platforms"
                  className="mt-auto pt-6 group inline-flex items-center gap-3 text-left"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#0071e3]/[0.1] border border-[#0071e3]/15 flex items-center justify-center shrink-0">
                    <Radio size={17} className="text-[#0071e3]" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold text-[#1d1d1f]">
                      Looking for The Sunny Shah Show?
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0071e3] group-hover:gap-2 transition-all">
                      It&apos;s one of our platforms <ArrowRight size={12} />
                    </span>
                  </span>
                </Link>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </main>
  )
}
