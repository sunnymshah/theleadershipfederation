import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Handshake,
  Globe,
  TrendingUp,
  Building2,
} from "lucide-react"

export const metadata = {
  title: "Partners & Ecosystem | The Leadership Federation",
  description:
    "Our partners and ecosystem builders powering global leadership conversations across 30+ countries.",
}

type PartnerCategory = {
  title: string
  partners: { name: string; logo?: string }[]
}

const PARTNER_CATEGORIES: PartnerCategory[] = [
  {
    title: "Title Partners",
    partners: [
      { name: "Tata", logo: "/partners/tata.jpg" },
      { name: "Reliance Jio", logo: "/partners/reliance-jio.png" },
      { name: "HCL Tech", logo: "/partners/hcltech.png" },
      { name: "EY", logo: "/partners/ey.png" },
    ],
  },
  {
    title: "Powered By Partners",
    partners: [
      { name: "Axis Bank", logo: "/partners/axis-bank.png" },
      { name: "ICICI Bank", logo: "/partners/icici-bank.png" },
      { name: "SBI", logo: "/partners/sbi.png" },
      { name: "Barclays", logo: "/partners/barclays.png" },
      { name: "Atos", logo: "/partners/atos.png" },
    ],
  },
  {
    title: "Associate Partners",
    partners: [
      { name: "Apollo", logo: "/partners/apollo.png" },
      { name: "Cadila", logo: "/partners/cadila.png" },
      { name: "Frost & Sullivan", logo: "/partners/frost-sullivan.png" },
      { name: "H&M", logo: "/partners/hm.png" },
    ],
  },
  {
    title: "Media Partners",
    partners: [
      { name: "Gulf News", logo: "/partners/gulf-news.png" },
    ],
  },
]

const BENEFITS = [
  {
    icon: Globe,
    title: "Global Visibility",
    description:
      "Position your brand alongside the most influential leaders in the GCC, APAC, and global enterprise ecosystem through our flagship conclaves and media platforms.",
  },
  {
    icon: Handshake,
    title: "Strategic Access",
    description:
      "Engage directly with 2,000+ CXOs, policymakers, and decision-makers in curated settings designed for high-value conversations and partnership development.",
  },
  {
    icon: TrendingUp,
    title: "Ecosystem Impact",
    description:
      "Co-create thought leadership, sponsor innovation tracks, and contribute to shaping the dialogue around AI, digital transformation, and the future of work.",
  },
]

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

function PartnerLogo({ name, logo }: { name: string; logo?: string }) {
  return (
    <div className="flex items-center justify-center h-20 rounded-xl bg-white/70 border border-black/[0.04] px-6 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={120}
          height={48}
          className="max-h-10 w-auto object-contain opacity-60 hover:opacity-90 transition-opacity"
        />
      ) : (
        <span className="text-sm font-semibold text-black/30 tracking-wide text-center leading-tight">
          {name}
        </span>
      )}
    </div>
  )
}

export default function PartnersPage() {
  return (
    <main className="bg-[#F4F8FF]">
      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
            Our Network
          </span>
          <h1
            className="text-black leading-[1.08] font-bold mb-8"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", ...sfFont }}
          >
            Partners & Ecosystem
          </h1>
          <p className="text-lg md:text-xl text-black/40 leading-relaxed max-w-3xl mx-auto">
            The Leadership Federation is powered by partnerships with
            world-leading enterprises, institutions, and organisations that
            share our commitment to advancing global leadership.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-black p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "100+", label: "Partners" },
                { value: "30+", label: "Countries" },
                { value: "6", label: "Categories" },
                { value: "50+", label: "Events" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-[#e7ab1c] text-3xl md:text-4xl leading-none font-bold mb-1.5" style={sfFont}>{value}</p>
                  <p className="text-[12px] font-semibold text-white/30 uppercase tracking-[0.15em]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partner categories */}
      {PARTNER_CATEGORIES.map(({ title, partners }) => (
        <section key={title} className="pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Building2 size={16} strokeWidth={1.4} className="text-[#e7ab1c]/60" />
              <h2 className="text-[13px] font-bold text-black/40 uppercase tracking-[0.2em]">
                {title}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {partners.map((p) => (
                <PartnerLogo key={p.name} name={p.name} logo={p.logo} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <div className="max-w-5xl mx-auto px-6">
        <hr className="border-black/[0.06]" />
      </div>

      {/* Become a Partner */}
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
              Partner With Us
            </span>
            <h2
              className="text-black leading-[1.12] font-bold mb-5"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", ...sfFont }}
            >
              Become a Partner
            </h2>
            <p className="text-black/35 text-base leading-relaxed max-w-2xl mx-auto">
              Join a curated ecosystem of global enterprises and institutions
              that are shaping the future of leadership across the GCC, Asia,
              and beyond.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mb-14">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
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

          <div className="text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Get in Touch
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
