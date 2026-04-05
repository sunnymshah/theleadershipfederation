import Link from "next/link"
import {
  MessageSquare,
  Globe,
  ShieldCheck,
  Handshake,
  Users,
  ArrowRight,
} from "lucide-react"

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

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

export default function AboutPage() {
  return (
    <main className="bg-[#F4F8FF]">
      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
            About Us
          </span>
          <h1
            className="text-black leading-[1.08] font-bold mb-8"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", ...sfFont }}
          >
            The Leadership Federation
          </h1>
          <p className="text-lg md:text-xl text-black/40 leading-relaxed max-w-3xl mx-auto">
            A global leadership platform connecting GCC leaders, CXOs,
            decision-makers, innovators, policymakers, and ecosystem builders
            to drive meaningful impact across industries and borders.
          </p>
        </div>
      </section>

      {/* Vision */}
      <section className="pb-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-black p-12 md:p-20 text-center">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
              Our Vision
            </span>
            <h2
              className="text-white leading-[1.12] font-bold max-w-3xl mx-auto"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", ...sfFont }}
            >
              To build the world&rsquo;s most impactful leadership ecosystem
            </h2>
            <p className="mt-6 text-white/40 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Where every conversation sparks action, every connection creates
              value, and every leader finds the platform to amplify their impact
              on the global stage.
            </p>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="pb-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 md:gap-16 items-start">
            <div className="md:col-span-2">
              <div className="aspect-[3/4] rounded-2xl bg-black/[0.04] border border-black/[0.06] flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="w-20 h-20 rounded-full bg-[#e7ab1c]/10 mx-auto mb-4 flex items-center justify-center">
                    <Users size={32} strokeWidth={1.2} className="text-[#e7ab1c]" />
                  </div>
                  <p className="text-sm font-semibold text-black/60">Sunny Shah</p>
                  <p className="text-xs text-black/30 mt-1">Founder & CEO</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
                The Founder
              </span>
              <h2
                className="text-black leading-[1.12] font-bold mb-6"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", ...sfFont }}
              >
                Sunny Shah
              </h2>
              <p className="text-[15px] text-black/45 leading-[1.8] mb-5">
                As Founder & CEO of The Leadership Federation, Sunny Shah
                envisioned a platform that transcends traditional conferences
                and networking events. His vision centres on creating lasting
                bridges between enterprises, Global Capability Centres,
                governments, and emerging ecosystems.
              </p>
              <p className="text-[15px] text-black/45 leading-[1.8] mb-5">
                Under his leadership, TLF has grown into one of the most
                respected leadership platforms in the GCC and Asia-Pacific
                region, convening decision-makers from over 30 countries and
                facilitating the strategic conversations that shape industries.
              </p>
              <p className="text-[15px] text-black/45 leading-[1.8]">
                His approach is rooted in a singular belief: that the right
                conversation between the right leaders at the right time can
                transform enterprises, economies, and communities. This
                philosophy drives every event, every programme, and every
                partnership within the TLF ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why TLF Exists */}
      <section className="pb-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
              Our Pillars
            </span>
            <h2
              className="text-black leading-[1.12] font-bold"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", ...sfFont }}
            >
              Why TLF Exists
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {WHY_TLF.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl bg-white/70 p-8 md:p-10 border border-black/[0.04] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center mb-5">
                  <Icon size={22} strokeWidth={1.4} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-[17px] font-bold text-black mb-3">
                  {title}
                </h3>
                <p className="text-[14px] text-black/35 leading-[1.7]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white/70 border border-black/[0.04] p-10 md:p-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p
                    className="text-[#e7ab1c] leading-none font-bold mb-2"
                    style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", ...sfFont }}
                  >
                    {value}
                  </p>
                  <p className="text-[13px] font-semibold text-black/35 uppercase tracking-[0.15em]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-black leading-[1.12] font-bold mb-5"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", ...sfFont }}
          >
            Join the Ecosystem
          </h2>
          <p className="text-black/35 text-base leading-relaxed mb-10 max-w-xl mx-auto">
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
      </section>
    </main>
  )
}
