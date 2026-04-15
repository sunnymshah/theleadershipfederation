import Link from "next/link"
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

/* ── Fonts ────────────────────────────────────────────────────────── */

const sfDisplay = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

const sfText = {
  fontFamily:
    "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
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
  accent: string
  accentLight: string
  icon: typeof Crown
}

/* ── Style / icon lookup by slug ─────────────────────────────────── */

const TIER_STYLE: Record<string, { icon: typeof Crown; accent: string; accentLight: string }> = {
  silver:   { icon: Shield, accent: "#94a3b8", accentLight: "#94a3b8" },
  gold:     { icon: Star,   accent: "#e7ab1c", accentLight: "#e7ab1c" },
  platinum: { icon: Crown,  accent: "#c9a84c", accentLight: "#c9a84c" },
  titanium: { icon: Zap,    accent: "#1a1a2e", accentLight: "#1a1a2e" },
}

const DEFAULT_STYLE = { icon: Shield, accent: "#94a3b8", accentLight: "#94a3b8" }

/** Format an integer price with Indian comma grouping */
function formatINR(amount: number): string {
  const s = amount.toString()
  // Indian grouping: last 3 digits, then groups of 2
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3)
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return `${grouped},${last3}`
}

/** Format an integer price with standard comma grouping */
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

/** Convert a string DB value to display-typed value (boolean/string). */
function parseCellValue(raw: string | null | undefined): string | boolean {
  if (raw === null || raw === undefined) return false
  const v = raw.trim()
  if (v === "") return false
  const lower = v.toLowerCase()
  if (lower === "true") return true
  if (lower === "false") return false
  return v
}

/* ── FAQ ──────────────────────────────────────────────────────────── */

interface FaqItem { q: string; a: string }

/* ═══════════════════════════════════════════════════════════════════ */

export default async function MembershipsPage() {
  /* Fetch tiers from DB */
  let TIERS: Tier[] = []
  try {
    const result = await getMembershipTiers()
    if (result.success && result.tiers) {
      TIERS = result.tiers.map((t) => {
        const style = TIER_STYLE[t.slug] ?? DEFAULT_STYLE
        return {
          name: t.name,
          slug: t.slug,
          priceINR: formatINR(t.price_inr),
          priceUSD: formatUSD(t.price_usd),
          discount: t.discount_percent ?? 0,
          isPopular: t.is_popular ?? false,
          benefits: (t.benefits as string[]) ?? [],
          accent: style.accent,
          accentLight: style.accentLight,
          icon: style.icon,
        }
      })
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
        feature:  r.feature,
        silver:   parseCellValue(r.silver_value),
        gold:     parseCellValue(r.gold_value),
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
      "Join a global network of CXOs, founders, and decision-makers. Every membership tier includes full event credits, exclusive directory access, and year-round leadership opportunities."
    ),
    note: pickStr(
      sections.hero,
      "note",
      "All prices exclusive of GST. USD pricing available for international members."
    ),
  }

  const valuePropsHeader = {
    title: pickStr(sections.value_props_header, "title", "Why Members Stay"),
    description: pickStr(
      sections.value_props_header,
      "description",
      "Every tier is designed to deliver more value than your investment."
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
      "A detailed breakdown of what each membership tier includes."
    ),
  }

  const faqHeader = {
    title: pickStr(sections.faq_header, "title", "Frequently Asked Questions"),
    description: pickStr(
      sections.faq_header,
      "description",
      "Everything you need to know about our membership program."
    ),
  }

  const bottomCta = {
    title: pickStr(sections.bottom_cta, "title", "Ready to Lead?"),
    description: pickStr(
      sections.bottom_cta,
      "description",
      "Join a global community of leaders shaping the future. Start with any tier and upgrade as you grow."
    ),
    buttonLabel: pickStr(sections.bottom_cta, "button_label", "Apply for Membership"),
    buttonHref: pickStr(sections.bottom_cta, "button_href", "/register?type=membership&tier=platinum"),
  }

  return (
    <main className="">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up" delay={0}>
            <span
              className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6"
              style={sfText}
            >
              {hero.eyebrow}
            </span>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={80}>
            <h1
              className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold text-[#1a1a2e] leading-[1.08] tracking-[-0.03em] mb-6"
              style={sfDisplay}
            >
              {hero.title}
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={160}>
            <p
              className="text-[16px] sm:text-[18px] text-[#1a1a2e]/65 leading-[1.6] max-w-2xl mx-auto mb-4"
              style={sfText}
            >
              {hero.description}
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={240}>
            <p
              className="text-[13px] text-[#1a1a2e]/45 leading-[1.5]"
              style={sfText}
            >
              {hero.note}
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────────────────────────── */}
      {TIERS.length > 0 && (
        <section className="pb-20 px-6">
          <div className="max-w-[1200px] mx-auto">
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

      {/* ── Value Props ───────────────────────────────────────────── */}
      {VP.length > 0 && (
      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <AnimateOnScroll animation="fade-up">
            <h2
              className="text-[28px] sm:text-[36px] font-bold text-[#1a1a2e] text-center tracking-[-0.02em] mb-4"
              style={sfDisplay}
            >
              {valuePropsHeader.title}
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={80}>
            <p
              className="text-[15px] text-[#1a1a2e]/55 text-center max-w-xl mx-auto mb-12"
              style={sfText}
            >
              {valuePropsHeader.description}
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            animation="fade-up"
            stagger={80}
          >
            {VP.map((vp) => (
              <div
                key={vp.title}
                className="bg-white rounded-2xl p-6 border border-[#1a1a2e]/[0.06]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center mb-4">
                  <vp.icon size={20} className="text-[#e7ab1c]" strokeWidth={1.6} />
                </div>
                <h3
                  className="text-[15px] font-semibold text-[#1a1a2e] mb-2"
                  style={sfDisplay}
                >
                  {vp.title}
                </h3>
                <p
                  className="text-[13px] text-[#1a1a2e]/55 leading-[1.6]"
                  style={sfText}
                >
                  {vp.desc}
                </p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>
      )}

      {/* ── Comparison Table ──────────────────────────────────────── */}
      {COMPARISON.length > 0 && TIERS.length > 0 && (
      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <AnimateOnScroll animation="fade-up">
            <h2
              className="text-[28px] sm:text-[36px] font-bold text-[#1a1a2e] text-center tracking-[-0.02em] mb-4"
              style={sfDisplay}
            >
              {comparisonHeader.title}
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={80}>
            <p
              className="text-[15px] text-[#1a1a2e]/55 text-center max-w-xl mx-auto mb-10"
              style={sfText}
            >
              {comparisonHeader.description}
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={120}>
            <div className="overflow-x-auto rounded-2xl border border-[#1a1a2e]/[0.06] bg-white">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#1a1a2e]/[0.06]">
                    <th
                      className="text-left px-6 py-4 text-[13px] font-semibold text-[#1a1a2e]/70"
                      style={sfText}
                    >
                      Feature
                    </th>
                    {TIERS.map((t) => (
                      <th
                        key={t.slug}
                        className="text-center px-4 py-4 text-[13px] font-semibold text-[#1a1a2e]"
                        style={sfText}
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
                          ? "border-b border-[#1a1a2e]/[0.04]"
                          : ""
                      }
                    >
                      <td
                        className="px-6 py-3.5 text-[13px] text-[#1a1a2e]/75"
                        style={sfText}
                      >
                        {row.feature}
                      </td>
                      {(["silver", "gold", "platinum", "titanium"] as const).map(
                        (tier) => {
                          const val = row[tier]
                          return (
                            <td
                              key={tier}
                              className="text-center px-4 py-3.5 text-[13px]"
                              style={sfText}
                            >
                              {val === true ? (
                                <Check
                                  size={16}
                                  className="text-emerald-500 mx-auto"
                                  strokeWidth={2.5}
                                />
                              ) : val === false ? (
                                <span className="text-[#1a1a2e]/20">—</span>
                              ) : (
                                <span className="text-[#1a1a2e]/75 font-medium">
                                  {val}
                                </span>
                              )}
                            </td>
                          )
                        }
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      {FAQ.length > 0 && (
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <h2
              className="text-[28px] sm:text-[36px] font-bold text-[#1a1a2e] text-center tracking-[-0.02em] mb-4"
              style={sfDisplay}
            >
              {faqHeader.title}
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={80}>
            <p
              className="text-[15px] text-[#1a1a2e]/55 text-center max-w-xl mx-auto mb-10"
              style={sfText}
            >
              {faqHeader.description}
            </p>
          </AnimateOnScroll>

          <StaggerChildren
            className="space-y-3"
            animation="fade-up"
            stagger={60}
          >
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group bg-white rounded-xl border border-[#1a1a2e]/[0.06] overflow-hidden"
              >
                <summary
                  className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none select-none"
                  style={sfText}
                >
                  <span className="text-[14px] font-semibold text-[#1a1a2e]">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-[#1a1a2e]/40 shrink-0 transition-transform duration-300 group-open:rotate-180"
                    strokeWidth={2}
                  />
                </summary>
                <div className="px-6 pb-5">
                  <p
                    className="text-[13px] text-[#1a1a2e]/60 leading-[1.7]"
                    style={sfText}
                  >
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </StaggerChildren>
        </div>
      </section>
      )}

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <AnimateOnScroll animation="fade-up">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-[#1a1a2e] to-[#2d2d4e] rounded-3xl px-8 py-14 relative overflow-hidden">
            {/* Subtle gold accent glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e7ab1c]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#c9a84c]/8 rounded-full blur-[60px] pointer-events-none" />

            <h2
              className="text-[28px] sm:text-[36px] font-bold text-white tracking-[-0.02em] mb-4 relative z-10"
              style={sfDisplay}
            >
              {bottomCta.title}
            </h2>
            <p
              className="text-[15px] text-white/60 max-w-lg mx-auto mb-8 leading-[1.6] relative z-10"
              style={sfText}
            >
              {bottomCta.description}
            </p>
            <Link
              href={bottomCta.buttonHref}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-[14px] font-semibold rounded-full bg-[#e7ab1c] text-white hover:bg-[#d49c10] transition-all duration-200 active:scale-[0.97] shadow-[0_4px_20px_rgba(231,171,28,0.3)] relative z-10"
              style={sfText}
            >
              {bottomCta.buttonLabel}
              <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
          </div>
        </AnimateOnScroll>
      </section>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  TIER CARD COMPONENT                                               */
/* ═══════════════════════════════════════════════════════════════════ */

function TierCard({ tier }: { tier: Tier }) {
  const Icon = tier.icon
  const isPopular = tier.isPopular

  return (
    <div
      className={`
        relative flex flex-col bg-white rounded-2xl p-6
        border transition-all duration-300
        hover:shadow-[0_8px_40px_rgba(26,26,46,0.08)]
        hover:-translate-y-1
        ${
          isPopular
            ? "border-[#c9a84c]/40 shadow-[0_4px_24px_rgba(201,168,76,0.12)] ring-1 ring-[#c9a84c]/20"
            : "border-[#1a1a2e]/[0.06]"
        }
      `}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className="inline-flex items-center gap-1 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-full bg-gradient-to-r from-[#e7ab1c] to-[#c9a84c] text-white shadow-[0_2px_12px_rgba(231,171,28,0.3)]"
            style={sfText}
          >
            <Sparkles size={10} strokeWidth={2.5} />
            Most Popular
          </span>
        </div>
      )}

      {/* Tier icon & name */}
      <div className="flex items-center gap-3 mb-5 mt-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${tier.accent}15` }}
        >
          <Icon size={18} style={{ color: tier.accent }} strokeWidth={1.8} />
        </div>
        <h3
          className="text-[18px] font-bold text-[#1a1a2e] tracking-[-0.01em]"
          style={sfDisplay}
        >
          {tier.name}
        </h3>
      </div>

      {/* Price */}
      <div className="mb-1">
        <div className="flex items-baseline gap-1">
          <span
            className="text-[32px] font-bold text-[#1a1a2e] tracking-[-0.03em]"
            style={sfDisplay}
          >
            ₹{tier.priceINR}
          </span>
          <span
            className="text-[13px] text-[#1a1a2e]/40"
            style={sfText}
          >
            + GST
          </span>
        </div>
        <p
          className="text-[12px] text-[#1a1a2e]/40 mt-0.5"
          style={sfText}
        >
          USD ${tier.priceUSD} for international members
        </p>
      </div>

      {/* Discount badge */}
      <div className="mb-5 mt-3">
        <span
          className="inline-flex items-center px-3 py-1 text-[11px] font-semibold rounded-full"
          style={{
            backgroundColor: `${tier.accent}12`,
            color: tier.accent,
            ...sfText,
          }}
        >
          {tier.discount}% event discount
        </span>
      </div>

      {/* Benefits list */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {tier.benefits.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <Check
              size={14}
              className="text-emerald-500 mt-0.5 shrink-0"
              strokeWidth={2.5}
            />
            <span
              className="text-[13px] text-[#1a1a2e]/65 leading-[1.5]"
              style={sfText}
            >
              {b}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={`/register?type=membership&tier=${tier.slug}`}
        className={`
          flex items-center justify-center gap-2 w-full py-3 rounded-xl
          text-[13px] font-semibold transition-all duration-200
          active:scale-[0.97]
          ${
            isPopular
              ? "bg-gradient-to-r from-[#e7ab1c] to-[#c9a84c] text-white shadow-[0_2px_12px_rgba(231,171,28,0.25)] hover:shadow-[0_4px_20px_rgba(231,171,28,0.35)]"
              : "bg-[#1a1a2e] text-white hover:bg-[#2d2d4e]"
          }
        `}
        style={sfText}
      >
        Join Now
        <ArrowRight size={14} strokeWidth={2.2} />
      </Link>
    </div>
  )
}
