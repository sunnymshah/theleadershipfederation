import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Handshake,
  Globe,
  TrendingUp,
  Building2,
  Users,
  Sparkles,
  Calendar,
  type LucideIcon,
} from "lucide-react"
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll"
import { getPartners } from "@/app/actions/cmsActions"
import { getPageSections } from "@/app/actions/pageContentActions"

const ICONS: Record<string, LucideIcon> = {
  globe: Globe,
  handshake: Handshake,
  trendingup: TrendingUp,
  building2: Building2,
  users: Users,
  sparkles: Sparkles,
  calendar: Calendar,
}

export const revalidate = 86400

export const metadata = {
  title: "Partners & Ecosystem | The Leadership Federation",
  description:
    "Our partners and ecosystem builders powering global leadership conversations across 30+ countries.",
}

type PartnerRow = {
  id: string
  name: string
  category: "title" | "powered_by" | "associate" | "media"
  logo_url: string | null
  website_url?: string | null
  sort_order: number
}

const CATEGORY_ORDER: { slug: PartnerRow["category"]; title: string }[] = [
  { slug: "title",      title: "Title Partners" },
  { slug: "powered_by", title: "Powered By Partners" },
  { slug: "associate",  title: "Associate Partners" },
  { slug: "media",      title: "Media Partners" },
]

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

function PartnerLogo({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <div className="flex items-center justify-center h-20 rounded-xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm px-6 transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30">
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={120}
          height={48}
          className="max-h-10 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
        />
      ) : (
        <span className="text-sm font-semibold text-[#1a1a2e]/80 tracking-wide text-center leading-tight">
          {name}
        </span>
      )}
    </div>
  )
}

type StrObj = Record<string, string>

function pickStr(obj: Record<string, unknown> | undefined, key: string, fallback: string): string {
  const v = obj?.[key]
  return typeof v === "string" && v.length > 0 ? v : fallback
}

function pickList(obj: Record<string, unknown> | undefined): StrObj[] {
  const items = obj?.items
  return Array.isArray(items) ? (items as StrObj[]) : []
}

export default async function PartnersPage() {
  let partners: PartnerRow[] = []
  try {
    const res = await getPartners(true)
    if (res.success && res.partners) {
      partners = res.partners as PartnerRow[]
    }
  } catch {
    /* empty state */
  }

  const { sections } = await getPageSections("partners")

  const hero = {
    eyebrow: pickStr(sections.hero, "eyebrow", "Our Network"),
    title: pickStr(sections.hero, "title", "Partners & Ecosystem"),
    description: pickStr(
      sections.hero,
      "description",
      "The Leadership Federation is powered by partnerships with world-leading enterprises, institutions, and organisations that share our commitment to advancing global leadership."
    ),
  }

  const statsList = pickList(sections.stats)

  const categoryRows = pickList(sections.categories)
  const categoryMap: Record<string, string> = {}
  for (const c of categoryRows) if (c.slug && c.title) categoryMap[c.slug] = c.title

  const benefitsHeader = {
    eyebrow: pickStr(sections.benefits_header, "eyebrow", "Partner With Us"),
    title: pickStr(sections.benefits_header, "title", "Become a Partner"),
    description: pickStr(
      sections.benefits_header,
      "description",
      "Join a curated ecosystem of global enterprises and institutions that are shaping the future of leadership across the GCC, Asia, and beyond."
    ),
  }

  const benefitsDb = pickList(sections.benefits)
  const benefits = benefitsDb.map((b) => ({
    icon: ICONS[(b.icon || "").toLowerCase()] ?? Handshake,
    title: b.title ?? "",
    description: b.description ?? "",
  }))

  const byCategory = CATEGORY_ORDER
    .map(({ slug, title }) => ({
      title: categoryMap[slug] ?? title,
      partners: partners.filter(p => p.category === slug),
    }))
    .filter(c => c.partners.length > 0)

  return (
    <main className="">
      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6">
              {hero.eyebrow}
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1
              className="text-[#1a1a2e] leading-[1.08] font-bold mb-8"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", ...sfFont }}
            >
              {hero.title}
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="text-lg md:text-xl text-[#1a1a2e]/75 leading-relaxed max-w-3xl mx-auto">
              {hero.description}
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Stats strip */}
      {statsList.length > 0 && (
        <section className="pb-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl bg-white border border-[#1a1a2e]/[0.06] shadow-sm p-8 md:p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {statsList.map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-[#e7ab1c] text-3xl md:text-4xl leading-none font-bold mb-1.5" style={sfFont}>{value}</p>
                    <p className="text-[12px] font-semibold text-[#1a1a2e]/65 uppercase tracking-[0.15em]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Partner categories */}
      {byCategory.map(({ title, partners }, catIdx) => (
        <AnimateOnScroll key={title} as="section" className="pb-16 px-6" animation="fade-up" delay={catIdx * 100}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Building2 size={16} strokeWidth={1.4} className="text-[#e7ab1c]" />
              <h2 className="text-[13px] font-bold text-[#1a1a2e]/80 uppercase tracking-[0.2em]">
                {title}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {partners.map((p) => (
                <PartnerLogo key={p.id} name={p.name} logo={p.logo_url} />
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      ))}

      <div className="max-w-5xl mx-auto px-6">
        <hr className="border-[#1a1a2e]/[0.06]" />
      </div>

      {/* Become a Partner */}
      <section className="pt-14 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
              {benefitsHeader.eyebrow}
            </span>
            <h2
              className="text-[#1a1a2e] leading-[1.12] font-bold mb-5"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", ...sfFont }}
            >
              {benefitsHeader.title}
            </h2>
            <p className="text-[#1a1a2e]/75 text-base leading-relaxed max-w-2xl mx-auto">
              {benefitsHeader.description}
            </p>
          </div>

          {benefits.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-5 mb-14">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl bg-white p-8 md:p-10 border border-[#1a1a2e]/[0.06] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center mb-5">
                    <Icon size={22} strokeWidth={1.4} className="text-[#e7ab1c]" />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-3">
                    {title}
                  </h3>
                  <p className="text-[14px] text-[#1a1a2e]/75 leading-[1.7]">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          )}

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
