/* ═══════════════════════════════════════════════════════════════════════════
 *  PARTNERS PAGE — Server Component
 *
 *  Showcases TLF's partner ecosystem across six categories with
 *  placeholder text-based logos and a "Become a Partner" CTA.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link"
import {
  ArrowRight,
  Handshake,
  Globe,
  TrendingUp,
  Building2,
} from "lucide-react"

export const metadata = {
  title: "Partners & Ecosystem",
  description:
    "Our partners and ecosystem builders powering global leadership conversations across 30+ countries.",
}

/* ─── Partner data ────────────────────────────────────────────────────────── */

type PartnerCategory = {
  title: string
  partners: string[]
}

const PARTNER_CATEGORIES: PartnerCategory[] = [
  {
    title: "Title Partners",
    partners: ["HSBC", "Google", "SAP", "Schneider Electric"],
  },
  {
    title: "Powered By Partners",
    partners: ["Adobe", "KPMG", "Deloitte", "Tata", "HCL"],
  },
  {
    title: "Associate Partners",
    partners: [
      "EY",
      "Reliance",
      "Axis Bank",
      "Samsung",
      "Uber",
      "Novartis",
      "Bosch",
      "DBS Bank",
    ],
  },
  {
    title: "Government & Institutional Partners",
    partners: ["NASSCOM", "STPI", "Invest India", "DPIIT", "NITI Aayog"],
  },
  {
    title: "Knowledge Partners",
    partners: ["Diageo", "Citi", "Johnson Controls", "McKinsey"],
  },
  {
    title: "Media Partners",
    partners: ["Economic Times", "CNBC-TV18", "Business Standard", "Forbes India", "YourStory"],
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

/* ─── Placeholder logo component ──────────────────────────────────────────── */

function PartnerLogo({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-20 rounded-xl bg-white border border-[#1a1a2e]/[0.06] px-6 transition-all duration-300 hover:border-[#1a1a2e]/[0.12] hover:shadow-[0_2px_16px_rgba(26,26,46,0.04)]">
      <span className="text-sm font-semibold text-[#1a1a2e]/40 tracking-wide text-center leading-tight">
        {name}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PartnersPage() {
  return (
    <main className="bg-[#F4F8FF]">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#1a1a2e]/40 uppercase tracking-[0.25em] mb-6">
            Our Network
          </span>
          <h1
            className="font-serif text-[#1a1a2e] leading-[1.08] mb-8"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
          >
            Partners & Ecosystem
          </h1>
          <p className="text-lg md:text-xl text-[#1a1a2e]/50 leading-relaxed max-w-3xl mx-auto">
            The Leadership Federation is powered by partnerships with
            world-leading enterprises, institutions, and organisations that
            share our commitment to advancing global leadership.
          </p>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-[#1a1a2e] p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="font-serif text-white text-3xl md:text-4xl leading-none mb-1.5">100+</p>
                <p className="text-[12px] font-semibold text-white/30 uppercase tracking-[0.15em]">Partners</p>
              </div>
              <div>
                <p className="font-serif text-white text-3xl md:text-4xl leading-none mb-1.5">30+</p>
                <p className="text-[12px] font-semibold text-white/30 uppercase tracking-[0.15em]">Countries</p>
              </div>
              <div>
                <p className="font-serif text-white text-3xl md:text-4xl leading-none mb-1.5">6</p>
                <p className="text-[12px] font-semibold text-white/30 uppercase tracking-[0.15em]">Categories</p>
              </div>
              <div>
                <p className="font-serif text-white text-3xl md:text-4xl leading-none mb-1.5">50+</p>
                <p className="text-[12px] font-semibold text-white/30 uppercase tracking-[0.15em]">Events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner categories ────────────────────────────────────── */}
      {PARTNER_CATEGORIES.map(({ title, partners }) => (
        <section key={title} className="pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Building2 size={16} strokeWidth={1.4} className="text-[#1a1a2e]/25" />
              <h2 className="text-[13px] font-bold text-[#1a1a2e]/40 uppercase tracking-[0.2em]">
                {title}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {partners.map((name) => (
                <PartnerLogo key={name} name={name} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6">
        <hr className="border-[#1a1a2e]/[0.06]" />
      </div>

      {/* ── Become a Partner ──────────────────────────────────────── */}
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold text-[#1a1a2e]/40 uppercase tracking-[0.25em] mb-5">
              Partner With Us
            </span>
            <h2
              className="font-serif text-[#1a1a2e] leading-[1.12] mb-5"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}
            >
              Become a Partner
            </h2>
            <p className="text-[#1a1a2e]/45 text-base leading-relaxed max-w-2xl mx-auto">
              Join a curated ecosystem of global enterprises and institutions
              that are shaping the future of leadership across the GCC, Asia,
              and beyond.
            </p>
          </div>

          {/* Benefit cards */}
          <div className="grid sm:grid-cols-3 gap-5 mb-14">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl bg-white p-8 md:p-10 border border-[#1a1a2e]/[0.06] transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(26,26,46,0.04)]"
              >
                <Icon
                  size={28}
                  strokeWidth={1.4}
                  className="text-[#1a1a2e]/50 mb-5"
                />
                <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-3">
                  {title}
                </h3>
                <p className="text-[14px] text-[#1a1a2e]/45 leading-[1.7]">
                  {description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#1a1a2e] text-white text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-[#1a1a2e]/90 hover:shadow-[0_8px_32px_rgba(26,26,46,0.2)]"
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
