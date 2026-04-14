import Link from "next/link"
import {
  ArrowRight,
  Users,
  Shield,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Globe,
  Sparkles,
  Star,
  MessageCircle,
  Lock,
  Zap,
} from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 86400

export const metadata = {
  title: "The Inner Circle | The Leadership Federation",
  description:
    "Join The Inner Circle — an exclusive community for GCC leaders, CXOs, and enterprise decision-makers. Access peer-to-peer networking, exclusive content, and strategic connections.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

const INNER_CIRCLE_URL = "https://innercircle.theleadershipfederation.com"

const VALUE_PROPS = [
  {
    icon: Globe,
    title: "GCC Leaders Network",
    description:
      "Connect with leaders from Global Capability Centres and enterprise hubs worldwide. Forge strategic alliances with peers driving digital transformation across industries.",
    accent: "from-blue-500/20 to-blue-600/10",
  },
  {
    icon: Users,
    title: "CXO Leaders Network",
    description:
      "Peer-to-peer C-suite networking with vetted senior executives. Join curated roundtables, private forums, and strategic conversations that shape your leadership trajectory.",
    accent: "from-[#e7ab1c]/20 to-[#d49c10]/10",
  },
  {
    icon: BookOpen,
    title: "Exclusive Content",
    description:
      "Access members-only insights, research reports, leadership playbooks, and curated discussions. Stay ahead with content crafted for senior decision-makers.",
    accent: "from-purple-500/20 to-purple-600/10",
  },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Apply",
    description:
      "Submit your application with your leadership profile. We review every application to ensure the community maintains its high standard of membership.",
    icon: CheckCircle2,
  },
  {
    step: "02",
    title: "Get Approved",
    description:
      "Our team reviews your profile and background. Approved members receive an invitation to join the exclusive community platform on Circle.so.",
    icon: Shield,
  },
  {
    step: "03",
    title: "Join the Community",
    description:
      "Access the full Inner Circle — peer networking, discussion groups, exclusive events, private roundtables, and members-only content.",
    icon: Sparkles,
  },
]

const TESTIMONIALS = [
  {
    quote:
      "The Inner Circle has been transformative for my leadership journey. The quality of conversations and connections here is unmatched.",
    name: "Senior GCC Leader",
    role: "Global Capability Centre",
  },
  {
    quote:
      "Access to peer CXOs across industries has opened strategic partnerships I never would have found through traditional networking.",
    name: "Enterprise CXO",
    role: "Fortune 500 Company",
  },
  {
    quote:
      "The curated content and private roundtables provide insights that directly impact my decision-making as a leader.",
    name: "Chief Technology Officer",
    role: "Leading Tech Enterprise",
  },
]

const FAQ = [
  {
    question: "Who is The Inner Circle for?",
    answer:
      "The Inner Circle is designed for senior leaders — CXOs, GCC heads, VPs, Directors, and enterprise decision-makers. We maintain a curated membership to ensure every member benefits from high-quality peer connections.",
  },
  {
    question: "How is this different from LinkedIn or other networks?",
    answer:
      "Unlike open platforms, The Inner Circle is invite-only and curated. Every member is vetted, conversations are private, and the community is focused on strategic leadership rather than broad social networking.",
  },
  {
    question: "What platform does The Inner Circle use?",
    answer:
      "We host The Inner Circle on Circle.so, a premium community platform that enables discussion spaces, direct messaging, events, and resource libraries — all in a private, secure environment.",
  },
  {
    question: "Is there a membership fee?",
    answer:
      "Please visit our Inner Circle page or contact us for the latest membership details. We offer different tiers to accommodate various levels of engagement and access.",
  },
  {
    question: "Can I attend TLF events through The Inner Circle?",
    answer:
      "Yes. Inner Circle members receive priority access, exclusive discounts, and VIP experiences at all TLF events including the GCC Leadership Conclave, Asia Leadership Awards, and regional summits.",
  },
]

export default function InnerCirclePage() {
  return (
    <main className="min-h-screen">
      {/* ── Hero — dark premium section ── */}
      <section className="relative pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
        {/* Ambient gold glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "900px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(231,171,28,0.12) 0%, transparent 55%)",
          }}
          aria-hidden
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
          aria-hidden
        />

        {/* Gold line at very top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e7ab1c] to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-6 px-4 py-1.5 rounded-full bg-[#e7ab1c]/10 border border-[#e7ab1c]/20">
              <Lock size={12} />
              Exclusive Community
            </span>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={120}>
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-5 sm:mb-7 tracking-tight"
              style={sfFont}
            >
              The Inner{" "}
              <span className="bg-gradient-to-r from-[#e7ab1c] to-[#f0c040] bg-clip-text text-transparent">
                Circle
              </span>
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={240}>
            <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed mb-10 px-2">
              A private, invite-only community for the world&rsquo;s most impactful
              leaders. Connect with GCC heads, CXOs, and enterprise
              decision-makers in an environment built for strategic conversations.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={360}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={INNER_CIRCLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_24px_rgba(231,171,28,0.35)]"
              >
                Apply for Membership
                <ArrowRight size={16} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/85 text-sm font-semibold transition-all duration-200 hover:border-white/40 hover:text-white"
              >
                Learn More
                <ChevronDown size={14} />
              </a>
            </div>
          </AnimateOnScroll>

          {/* Trust indicators */}
          <AnimateOnScroll animation="fade-up" delay={450}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-white/50">
              {[
                { value: "500+", label: "Members" },
                { value: "30+", label: "Countries" },
                { value: "CXO", label: "Level Access" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-[#e7ab1c]/80" style={sfFont}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Value proposition ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#F4F8FF]">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-14">
              <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
                Why Join
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4"
                style={sfFont}
              >
                Built for Leaders Who Lead
              </h2>
              <p className="text-base text-[#1a1a2e]/65 max-w-xl mx-auto">
                Three pillars that make The Inner Circle the most valuable
                leadership community in the GCC and Asia-Pacific ecosystem.
              </p>
            </div>
          </AnimateOnScroll>

          <StaggerChildren
            className="grid md:grid-cols-3 gap-6"
            animation="fade-up"
            stagger={120}
          >
            {VALUE_PROPS.map(({ icon: Icon, title, description, accent }) => (
              <div
                key={title}
                className="group relative rounded-2xl bg-white p-8 md:p-10 border border-[#1a1a2e]/[0.06] shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#e7ab1c]/25 overflow-hidden"
              >
                {/* Subtle gradient background */}
                <div
                  className={`absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br ${accent} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  aria-hidden
                />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center mb-6 group-hover:bg-[#e7ab1c]/15 transition-colors">
                    <Icon size={26} strokeWidth={1.5} className="text-[#e7ab1c]" />
                  </div>
                  <h3
                    className="text-lg font-bold text-[#1a1a2e] mb-3"
                    style={sfFont}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-[#1a1a2e]/70 leading-[1.75]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-14">
              <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
                How It Works
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4"
                style={sfFont}
              >
                Three Steps to Join
              </h2>
              <p className="text-base text-[#1a1a2e]/65 max-w-xl mx-auto">
                Our application process ensures a community of high-calibre
                leaders who can both contribute and benefit.
              </p>
            </div>
          </AnimateOnScroll>

          <StaggerChildren
            className="grid md:grid-cols-3 gap-8"
            animation="fade-up"
            stagger={150}
          >
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }, idx) => (
              <div key={step} className="relative text-center">
                {/* Connector line (desktop only) */}
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#e7ab1c]/30 to-transparent" />
                )}

                <div className="relative z-10">
                  {/* Step number */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#e7ab1c]/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Icon size={28} strokeWidth={1.5} className="text-[#e7ab1c]" />
                  </div>
                  <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.2em] mb-2">
                    Step {step}
                  </span>
                  <h3
                    className="text-lg font-bold text-[#1a1a2e] mb-3"
                    style={sfFont}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-[#1a1a2e]/70 leading-[1.75] max-w-xs mx-auto">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </StaggerChildren>

          {/* CTA after steps */}
          <AnimateOnScroll animation="fade-up" delay={200}>
            <div className="mt-14 text-center">
              <a
                href={INNER_CIRCLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
              >
                Start Your Application
                <ArrowRight size={16} />
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Social proof / Testimonials ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#F4F8FF]">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-14">
              <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
                Member Voices
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4"
                style={sfFont}
              >
                What Leaders Are Saying
              </h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren
            className="grid md:grid-cols-3 gap-6"
            animation="fade-up"
            stagger={120}
          >
            {TESTIMONIALS.map((testimonial, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white p-8 border border-[#1a1a2e]/[0.06] shadow-sm relative overflow-hidden"
              >
                {/* Quote decoration */}
                <div className="absolute top-4 right-5 text-[#e7ab1c]/10 text-6xl font-serif leading-none" aria-hidden>
                  &ldquo;
                </div>

                <div className="relative z-10">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-[#e7ab1c] fill-[#e7ab1c]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#1a1a2e]/80 leading-[1.8] mb-6 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
                      <MessageCircle size={16} className="text-[#e7ab1c]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1a1a2e]">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-[#1a1a2e]/55">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-14">
              <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
                FAQ
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4"
                style={sfFont}
              >
                Frequently Asked Questions
              </h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren
            className="space-y-4"
            animation="fade-up"
            stagger={80}
          >
            {FAQ.map(({ question, answer }, idx) => (
              <details
                key={idx}
                className="group rounded-xl bg-[#F4F8FF] border border-[#1a1a2e]/[0.06] overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left list-none">
                  <span className="text-[15px] font-semibold text-[#1a1a2e] pr-4">
                    {question}
                  </span>
                  <ChevronDown
                    size={18}
                    className="text-[#1a1a2e]/40 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="px-6 pb-5 pt-0">
                  <p className="text-sm text-[#1a1a2e]/70 leading-[1.8]">
                    {answer}
                  </p>
                </div>
              </details>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── Final CTA — dark premium ── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-[#1a1a2e] to-[#0f3460]">
        {/* Ambient gold glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "700px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(231,171,28,0.12) 0%, transparent 55%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <div className="w-16 h-16 rounded-2xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/25 flex items-center justify-center mx-auto mb-7">
              <Zap size={28} strokeWidth={1.5} className="text-[#e7ab1c]" />
            </div>
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-5"
              style={sfFont}
            >
              Ready to Elevate Your Leadership?
            </h2>
            <p className="text-base text-white/70 leading-relaxed mb-10 max-w-xl mx-auto">
              Join a curated community of the most impactful leaders in the GCC
              and Asia-Pacific ecosystem. Your next strategic partnership starts
              here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={INNER_CIRCLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_24px_rgba(231,171,28,0.35)]"
              >
                Apply for Membership
                <ArrowRight size={16} />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/85 text-sm font-semibold transition-all duration-200 hover:border-white/40 hover:text-white"
              >
                Contact Us
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  )
}
