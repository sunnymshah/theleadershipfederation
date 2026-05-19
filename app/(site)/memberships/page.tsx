import Link from "next/link"
import Image from "next/image"
import {
  Check,
  Crown,
  Users,
  Sparkles,
  Calendar,
  ArrowRight,
  ChevronDown,
  Star,
  Shield,
  Zap,
  Globe,
  Handshake,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getMembershipTiers } from "@/app/actions/membershipActions"
import { getMembershipComparisonRows, getFaqs } from "@/app/actions/cmsActions"
import { getPageSections } from "@/app/actions/pageContentActions"

const VALUE_PROP_ICONS: Record<string, LucideIcon> = {
  users: Users,
  calendar: Calendar,
  sparkles: Sparkles,
  globe: Globe,
  handshake: Handshake,
  trendingup: TrendingUp,
  crown: Crown,
  shield: Shield,
  star: Star,
  zap: Zap,
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

export const revalidate = 3600

export const metadata = {
  title: "Memberships | The Leadership Federation",
  description:
    "Join The Leadership Federation as a Silver, Gold, Platinum, or Titanium member. Access exclusive events, global networking, and leadership opportunities across 30+ countries.",
  openGraph: {
    title: "Memberships | The Leadership Federation",
    description:
      "Unlock exclusive benefits — event credits, VIP networking, global leader directory access, and more.",
  },
}

/* ── Tier data ────────────────────────────────────────────────────── */

interface Tier {
  name: string
  slug: string
  priceINR: string
  priceUSD: string
  discount: number
  isPopular: boolean
  benefits: string[]
  icon: LucideIcon
}

const TIER_ICON: Record<string, LucideIcon> = {
  silver: Shield,
  gold: Star,
  platinum: Crown,
  titanium: Zap,
}

function formatINR(amount: number): string {
  const s = amount.toString()
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3)
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return `${grouped},${last3}`
}

function formatUSD(amount: number): string {
  return amount.toLocaleString("en-US")
}

/* ── Comparison table ─────────────────────────────────────────────── */

interface ComparisonRow {
  feature: string
  silver: string | boolean
  gold: string | boolean
  platinum: string | boolean
  titanium: string | boolean
}

function parseCellValue(raw: string | null | undefined): string | boolean {
  if (raw === null || raw === undefined) return false
  const v = raw.trim()
  if (v === "") return false
  const lower = v.toLowerCase()
  if (lower === "true") return true
  if (lower === "false") return false
  return v
}

interface FaqItem { q: string; a: string }

/* ── Rooms a membership opens ─────────────────────────────────────── */
const ACCESS_GALLERY = [
  { src: "/platforms/conclave-pune.jpg", label: "GCC Leadership Conclave", note: "India's largest gathering of GCC leaders" },
  { src: "/events/asia-leadership-awards.jpg", label: "Asia Leadership Awards", note: "Recognition for the work that raises the bar" },
  { src: "/events/bharat-leadership-awards.jpg", label: "Bharat Leadership Summit", note: "The conversations shaping enterprise" },
]

/* ═══════════════════════════════════════════════════════════════════ */

export default async function MembershipsPage() {
  /* Fetch tiers from DB */
  let TIERS: Tier[] = []
  try {
    const result = await getMembershipTiers()
    if (result.success && result.tiers) {
      TIERS = result.tiers.map((t) => ({
        name: t.name,
        slug: t.slug,
        priceINR: formatINR(t.price_inr),
        priceUSD: formatUSD(t.price_usd),
        discount: t.discount_percent ?? 0,
        isPopular: t.is_popular ?? false,
        benefits: (t.benefits as string[]) ?? [],
        icon: TIER_ICON[t.slug] ?? Shield,
      }))
    }
  } catch {
    /* empty state */
  }

  /* Fetch comparison rows */
  let COMPARISON: ComparisonRow[] = []
  try {
    const result = await getMembershipComparisonRows(true)
    if (result.success && result.rows) {
      COMPARISON = result.rows.map((r) => ({
        feature: r.feature,
        silver: parseCellValue(r.silver_value),
        gold: parseCellValue(r.gold_value),
        platinum: parseCellValue(r.platinum_value),
        titanium: parseCellValue(r.titanium_value),
      }))
    }
  } catch {/* empty state */}

  /* Fetch FAQs */
  let FAQ: FaqItem[] = []
  try {
    const result = await getFaqs("memberships", true)
    if (result.success && result.faqs) {
      FAQ = result.faqs.map((f) => ({ q: f.question, a: f.answer }))
    }
  } catch {/* empty state */}

  /* Fetch editable page content */
  const { sections } = await getPageSections("memberships")

  const hero = {
    eyebrow: pickStr(sections.hero, "eyebrow", "Memberships"),
    title: pickStr(sections.hero, "title", "Become a Member"),
    description: pickStr(
      sections.hero,
      "description",
      "Join a global network of CXOs, founders, and decision-makers. Every membership tier includes full event credits, exclusive directory access, and year-round leadership opportunities.",
    ),
    note: pickStr(
      sections.hero,
      "note",
      "All prices exclusive of GST. USD pricing available for international members.",
    ),
  }

  const valuePropsHeader = {
    title: pickStr(sections.value_props_header, "title", "Why Members Stay"),
    description: pickStr(
      sections.value_props_header,
      "description",
      "Every tier is designed to deliver more value than your investment.",
    ),
  }

  const valuePropsDb = pickList(sections.value_props)
  const VP = valuePropsDb.map((v) => ({
    icon: VALUE_PROP_ICONS[(v.icon || "").toLowerCase()] ?? Users,
    title: v.title ?? "",
    desc: v.description ?? "",
  }))

  const comparisonHeader = {
    title: pickStr(sections.comparison_header, "title", "Compare Tiers"),
    description: pickStr(
      sections.comparison_header,
      "description",
      "A detailed breakdown of what each membership tier includes.",
    ),
  }

  const faqHeader = {
    title: pickStr(sections.faq_header, "title", "Frequently Asked Questions"),
    description: pickStr(
      sections.faq_header,
      "description",
      "Everything you need to know about our membership program.",
    ),
  }

  const bottomCta = {
    title: pickStr(sections.bottom_cta, "title", "Ready to Lead?"),
    description: pickStr(
      sections.bottom_cta,
      "description",
      "Join a global community of leaders shaping the future. Start with any tier and upgrade as you grow.",
    ),
    buttonLabel: pickStr(sections.bottom_cta, "button_label", "Apply for Membership"),
    buttonHref: pickStr(sections.bottom_cta, "button_href", "/register?type=membership&tier=platinum"),
  }

  return (
    <main>
      {/* ═══════════════ Hero ═══════════════ */}
      <section className="relative bg-white pt-32 lg:pt-40 pb-16 lg:pb-20 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(56% 56% at 50% 0%, rgba(0,113,227,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              {hero.eyebrow}
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={110}>
            <h1 className="mt-5 text-[clamp(2.6rem,5.6vw,4.4rem)] font-bold text-[#1d1d1f] tracking-[-0.04em] leading-[1.0]">
              {hero.title}
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={220}>
            <p className="mt-6 text-[17px] lg:text-[18px] text-[#1d1d1f]/60 leading-relaxed max-w-2xl mx-auto">
              {hero.description}
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={300}>
            <p className="mt-4 text-[12.5px] text-[#1d1d1f]/40">{hero.note}</p>
          </AnimateOnScroll>
        </div>

        {/* Hero image */}
        <AnimateOnScroll animation="fade-up" delay={380}>
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 mt-14">
            <div className="lf-glass rounded-[28px] p-2 sm:p-2.5">
              <div className="relative aspect-[16/7] rounded-[20px] overflow-hidden">
                <Image
                  src="/platforms/conclave-stage.jpg"
                  alt="Members at a Leadership Federation conclave"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1100px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 sm:bottom-6 sm:left-7 lf-glass-dark rounded-xl px-4 py-2.5">
                  <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.14em] text-white">
                    One membership · every room
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ═══════════════ Pricing tiers ═══════════════ */}
      {TIERS.length > 0 && (
        <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
                "radial-gradient(50% 56% at 88% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
            }}
          />
          <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                Choose Your Tier
              </span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                Four tiers, one community
              </h2>
            </AnimateOnScroll>

            <StaggerChildren
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
              animation="fade-up"
              stagger={100}
            >
              {TIERS.map((tier) => (
                <TierCard key={tier.slug} tier={tier} />
              ))}
            </StaggerChildren>
          </div>
        </section>
      )}

      {/* ═══════════════ Value props ═══════════════ */}
      {VP.length > 0 && (
        <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(56% 50% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                The Value
              </span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                {valuePropsHeader.title}
              </h2>
              <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
                {valuePropsHeader.description}
              </p>
            </AnimateOnScroll>

            <StaggerChildren
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              animation="fade-up"
              stagger={80}
            >
              {VP.map((vp) => (
                <div
                  key={vp.title}
                  className="lf-glass rounded-[24px] p-7 transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#0071e3] flex items-center justify-center mb-5 shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                    <vp.icon size={21} className="text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-2 tracking-[-0.015em]">
                    {vp.title}
                  </h3>
                  <p className="text-[13px] text-[#1d1d1f]/60 leading-[1.65]">
                    {vp.desc}
                  </p>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </section>
      )}

      {/* ═══════════════ What membership opens ═══════════════ */}
      <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 56% at 12% 96%, rgba(0,113,227,0.09) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimateOnScroll animation="fade-up" className="max-w-2xl mb-12 lg:mb-14">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Where It Takes You
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              Your membership, in rooms
            </h2>
            <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
              Event credits put you inside the gatherings that define global
              leadership — not as an attendee, but as a member.
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            animation="fade-up"
            stagger={100}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            {ACCESS_GALLERY.map((g) => (
              <div key={g.src} className="lf-glass rounded-[24px] p-2.5">
                <div className="relative aspect-[4/5] rounded-[18px] overflow-hidden">
                  <Image
                    src={g.src}
                    alt={g.label}
                    fill
                    sizes="(max-width: 640px) 100vw, 360px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[15px] font-bold text-white tracking-[-0.01em]">
                      {g.label}
                    </p>
                    <p className="text-[12px] text-white/75 leading-snug mt-0.5">
                      {g.note}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ═══════════════ Comparison table ═══════════════ */}
      {COMPARISON.length > 0 && TIERS.length > 0 && (
        <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
          <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                Side by Side
              </span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                {comparisonHeader.title}
              </h2>
              <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
                {comparisonHeader.description}
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={120}>
              <div className="lf-glass rounded-[24px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-black/[0.07]">
                        <th className="text-left px-6 py-4 text-[13px] font-bold text-[#1d1d1f]/70">
                          Feature
                        </th>
                        {TIERS.map((t) => (
                          <th
                            key={t.slug}
                            className={
                              "text-center px-4 py-4 text-[13px] font-bold " +
                              (t.isPopular ? "text-[#0071e3]" : "text-[#1d1d1f]")
                            }
                          >
                            {t.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON.map((row, i) => (
                        <tr
                          key={row.feature}
                          className={
                            i < COMPARISON.length - 1
                              ? "border-b border-black/[0.05]"
                              : ""
                          }
                        >
                          <td className="px-6 py-3.5 text-[13px] text-[#1d1d1f]/75">
                            {row.feature}
                          </td>
                          {(["silver", "gold", "platinum", "titanium"] as const).map(
                            (tier) => {
                              const val = row[tier]
                              return (
                                <td key={tier} className="text-center px-4 py-3.5 text-[13px]">
                                  {val === true ? (
                                    <Check
                                      size={16}
                                      className="text-[#0071e3] mx-auto"
                                      strokeWidth={2.6}
                                    />
                                  ) : val === false ? (
                                    <span className="text-[#1d1d1f]/20">—</span>
                                  ) : (
                                    <span className="text-[#1d1d1f]/75 font-medium">
                                      {val}
                                    </span>
                                  )}
                                </td>
                              )
                            },
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      )}

      {/* ═══════════════ FAQ ═══════════════ */}
      {FAQ.length > 0 && (
        <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(54% 50% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up" className="text-center mb-12">
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                Questions
              </span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                {faqHeader.title}
              </h2>
              <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
                {faqHeader.description}
              </p>
            </AnimateOnScroll>

            <StaggerChildren className="space-y-3" animation="fade-up" stagger={60}>
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group lf-glass rounded-[18px] overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none select-none">
                    <span className="text-[14.5px] font-semibold text-[#1d1d1f]">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={17}
                      className="text-[#0071e3] shrink-0 transition-transform duration-300 group-open:rotate-180"
                      strokeWidth={2.2}
                    />
                  </summary>
                  <div className="px-6 pb-5">
                    <p className="text-[13.5px] text-[#1d1d1f]/65 leading-[1.75]">
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </StaggerChildren>
          </div>
        </section>
      )}

      {/* ═══════════════ Bottom CTA ═══════════════ */}
      <section className="relative bg-white py-20 lg:py-28 overflow-hidden">
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
              <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold text-[#1d1d1f] tracking-[-0.03em] leading-[1.1]">
                {bottomCta.title}
              </h2>
              <p className="mt-4 text-[#1d1d1f]/60 text-[16px] leading-relaxed max-w-md mx-auto">
                {bottomCta.description}
              </p>
              <Link
                href={bottomCta.buttonHref}
                className="mt-8 inline-flex items-center gap-2 px-9 py-[16px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 active:scale-[0.98] shadow-[0_14px_34px_-10px_rgba(0,113,227,0.6)]"
              >
                {bottomCta.buttonLabel}
                <ArrowRight size={16} strokeWidth={2.2} />
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  TIER CARD                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function TierCard({ tier }: { tier: Tier }) {
  const Icon = tier.icon
  const isPopular = tier.isPopular

  return (
    <div
      className={
        "relative flex flex-col rounded-[24px] p-7 transition-all duration-300 hover:-translate-y-1.5 " +
        (isPopular
          ? "lf-glass-strong ring-2 ring-[#0071e3]/45"
          : "lf-glass")
      }
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] rounded-full bg-[#0071e3] text-white shadow-[0_8px_20px_-6px_rgba(0,113,227,0.7)]">
            <Sparkles size={11} strokeWidth={2.5} />
            Most Popular
          </span>
        </div>
      )}

      {/* Tier icon & name */}
      <div className="flex items-center gap-3 mb-5 mt-1">
        <div className="w-10 h-10 rounded-xl bg-[#0071e3]/[0.1] border border-[#0071e3]/15 flex items-center justify-center">
          <Icon size={19} className="text-[#0071e3]" strokeWidth={1.9} />
        </div>
        <h3 className="text-[19px] font-bold text-[#1d1d1f] tracking-[-0.015em]">
          {tier.name}
        </h3>
      </div>

      {/* Price */}
      <div className="mb-1">
        <div className="flex items-baseline gap-1">
          <span className="text-[33px] font-bold text-[#1d1d1f] tracking-[-0.03em]">
            ₹{tier.priceINR}
          </span>
          <span className="text-[13px] text-[#1d1d1f]/40">+ GST</span>
        </div>
        <p className="text-[12px] text-[#1d1d1f]/40 mt-0.5">
          USD ${tier.priceUSD} for international members
        </p>
      </div>

      {/* Discount badge */}
      <div className="mb-5 mt-3">
        <span className="inline-flex items-center px-3 py-1 text-[11px] font-semibold rounded-full bg-[#0071e3]/[0.08] text-[#0071e3] border border-[#0071e3]/15">
          {tier.discount}% event discount
        </span>
      </div>

      {/* Benefits */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {tier.benefits.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <Check size={14} className="text-[#0071e3] mt-0.5 shrink-0" strokeWidth={2.6} />
            <span className="text-[13px] text-[#1d1d1f]/65 leading-[1.5]">{b}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={`/register?type=membership&tier=${tier.slug}`}
        className={
          "flex items-center justify-center gap-2 w-full py-3 rounded-full text-[13.5px] font-bold transition-all duration-200 active:scale-[0.97] " +
          (isPopular
            ? "bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-[0_10px_26px_-10px_rgba(0,113,227,0.7)]"
            : "bg-[#1d1d1f] text-white hover:bg-[#000]")
        }
      >
        Join Now
        <ArrowRight size={14} strokeWidth={2.2} />
      </Link>
    </div>
  )
}
