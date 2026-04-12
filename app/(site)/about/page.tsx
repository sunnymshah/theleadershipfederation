import { existsSync } from "fs"
import path from "path"
import Link from "next/link"
import Image from "next/image"
import {
  MessageSquare,
  Globe,
  ShieldCheck,
  Handshake,
  ArrowRight,
} from "lucide-react"
import { Linkedin } from "@/components/icons/SocialIcons"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 86400

export const metadata = {
  title: "About | The Leadership Federation",
  description:
    "The Leadership Federation is a global platform connecting GCC leaders, CXOs, decision-makers, innovators, policymakers, and ecosystem builders.",
}

const WHY_TLF = [
  {
    icon: MessageSquare,
    title: "Strategic Conversations",
    description:
      "High-value dialogues that shape industries. Curated discussions between C-suite executives, policymakers, and transformation leaders that drive real outcomes.",
  },
  {
    icon: Globe,
    title: "Global Connectivity",
    description:
      "A living network spanning 30+ countries, from Bengaluru to Dubai, Kuala Lumpur to London, connecting leaders who are redefining the global business landscape.",
  },
  {
    icon: ShieldCheck,
    title: "Curated Access",
    description:
      "An invite-only inner circle where senior leaders gain exclusive peer connections, private roundtables, and strategic access to the people who matter most.",
  },
  {
    icon: Handshake,
    title: "Ecosystem Building",
    description:
      "Cross-sector partnerships that bridge enterprises, GCCs, governments, startups, and industry pioneers, creating multiplier effects across the ecosystem.",
  },
]

const STATS = [
  { value: "50+", label: "Events" },
  { value: "30+", label: "Countries" },
  { value: "2,000+", label: "Leaders" },
  { value: "500+", label: "Speakers" },
]

const SUNNY_SHAH_LINKEDIN = "https://www.linkedin.com/in/sunnymshah/"

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

/** Check at build/render time whether the founder photo has been uploaded.
 *  Drop a file at `public/sunny-shah.jpg` and it'll start showing automatically. */
function hasFounderPhoto(): boolean {
  try {
    return existsSync(path.join(process.cwd(), "public", "sunny-shah.jpg"))
  } catch {
    return false
  }
}

export default function AboutPage() {
  const founderPhotoExists = hasFounderPhoto()
  return (
    <main className="bg-[#F4F8FF]">
      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up" delay={0}>
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
              About Us
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <h1
              className="text-[#1a1a2e] leading-[1.08] font-bold mb-8"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", ...sfFont }}
            >
              The Leadership Federation
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={200}>
            <p className="text-lg md:text-xl text-[#1a1a2e]/70 leading-relaxed max-w-3xl mx-auto">
              A global leadership platform connecting GCC leaders, CXOs,
              decision-makers, innovators, policymakers, and ecosystem builders
              to drive meaningful impact across industries and borders.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Vision — light card with gold accent */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll animation="scale">
            <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-12 md:p-20 text-center relative overflow-hidden">
              {/* Ambient gold glow */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  width: "700px",
                  height: "400px",
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse at center, rgba(231,171,28,0.10) 0%, transparent 60%)",
                }}
                aria-hidden
              />
              <div className="relative z-10">
                <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
                  Our Vision
                </span>
                <h2
                  className="text-[#1a1a2e] leading-[1.12] font-bold max-w-3xl mx-auto"
                  style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", ...sfFont }}
                >
                  To build the world&rsquo;s most impactful leadership ecosystem
                </h2>
                <p className="mt-6 text-[#1a1a2e]/70 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                  Where every conversation sparks action, every connection creates
                  value, and every leader finds the platform to amplify their impact
                  on the global stage.
                </p>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Founder */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 md:gap-16 items-start">
            <AnimateOnScroll animation="fade-right" className="md:col-span-2">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#1a1a2e]/[0.06] shadow-sm relative bg-gradient-to-br from-[#1a1a2e] via-[#2a2440] to-[#1a1a2e]">
                {/*
                  To show the real Sunny Shah photo here:
                  1. Save the photo at: public/sunny-shah.jpg
                     (Recommended size: 600x800 or any 3:4 ratio. JPG or PNG.)
                  2. Refresh — it will replace this monogram automatically.
                */}
                {founderPhotoExists ? (
                  <Image
                    src="/sunny-shah.jpg"
                    alt="Sunny Shah, Founder & CEO of The Leadership Federation"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <>
                    {/* Stylized monogram fallback — looks intentional, not broken */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 35%, rgba(231,171,28,0.22) 0%, transparent 65%)",
                      }}
                      aria-hidden
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-[140px] font-bold text-[#e7ab1c]/80 leading-none tracking-tighter"
                        style={sfFont}
                      >
                        SS
                      </span>
                    </div>
                  </>
                )}
                {/* Bottom gradient + caption */}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#1a1a2e]/85 via-[#1a1a2e]/40 to-transparent">
                  <p className="text-base font-bold text-white">Sunny Shah</p>
                  <p className="text-xs text-white/85 mt-0.5">Founder & CEO</p>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-left" delay={200} className="md:col-span-3">
              <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
                The Founder
              </span>
              <h2
                className="text-[#1a1a2e] leading-[1.12] font-bold mb-6"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", ...sfFont }}
              >
                Sunny Shah
              </h2>
              <p className="text-[15px] text-[#1a1a2e]/75 leading-[1.8] mb-5">
                As Founder & CEO of The Leadership Federation, Sunny Shah
                envisioned a platform that transcends traditional conferences
                and networking events. His vision centres on creating lasting
                bridges between enterprises, Global Capability Centres,
                governments, and emerging ecosystems.
              </p>
              <p className="text-[15px] text-[#1a1a2e]/75 leading-[1.8] mb-5">
                Under his leadership, TLF has grown into one of the most
                respected leadership platforms in the GCC and Asia-Pacific
                region, convening decision-makers from over 30 countries and
                facilitating the strategic conversations that shape industries.
              </p>
              <p className="text-[15px] text-[#1a1a2e]/75 leading-[1.8] mb-7">
                His approach is rooted in a singular belief: that the right
                conversation between the right leaders at the right time can
                transform enterprises, economies, and communities. This
                philosophy drives every event, every programme, and every
                partnership within the TLF ecosystem.
              </p>
              <Link
                href={SUNNY_SHAH_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A66C2] text-white text-sm font-semibold transition-opacity duration-200 hover:opacity-90 shadow-sm"
              >
                <Linkedin size={15} /> Connect on LinkedIn
              </Link>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Why TLF Exists */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
              Our Pillars
            </span>
            <h2
              className="text-[#1a1a2e] leading-[1.12] font-bold"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", ...sfFont }}
            >
              Why TLF Exists
            </h2>
          </div>

          <StaggerChildren animation="fade-up" stagger={100} className="grid sm:grid-cols-2 gap-5">
            {WHY_TLF.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl bg-white p-8 md:p-10 border border-[#1a1a2e]/[0.06] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30"
              >
                <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center mb-5">
                  <Icon size={22} strokeWidth={1.6} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-3">
                  {title}
                </h3>
                <p className="text-[14px] text-[#1a1a2e]/70 leading-[1.7]">
                  {description}
                </p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-10 md:p-16">
            <StaggerChildren animation="scale" stagger={80} className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p
                    className="text-[#e7ab1c] leading-none font-bold mb-2"
                    style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", ...sfFont }}
                  >
                    {value}
                  </p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]/65 uppercase tracking-[0.15em]">
                    {label}
                  </p>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-6">
        <AnimateOnScroll animation="fade-up">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-[#1a1a2e] leading-[1.12] font-bold mb-5"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", ...sfFont }}
            >
              Join the Ecosystem
            </h2>
            <p className="text-[#1a1a2e]/70 text-base leading-relaxed mb-10 max-w-xl mx-auto">
              Whether you are a CXO seeking strategic connections, a GCC leader
              driving transformation, or a policymaker shaping the future, there
              is a place for you in The Leadership Federation.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Get in Touch
              <ArrowRight size={16} />
            </Link>
          </div>
        </AnimateOnScroll>
      </section>
    </main>
  )
}
