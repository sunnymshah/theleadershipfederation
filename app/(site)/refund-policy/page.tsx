import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll"

export const revalidate = 3600

export const metadata = {
  title: "Refund Policy | The Leadership Federation",
  description:
    "Refund and cancellation policy for The Leadership Federation events, tickets, and sponsorships.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Hero */}
      <section className="pt-24 pb-8 px-6">
        <div className="max-w-3xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[#e7ab1c] hover:text-[#d49c10] transition-colors mb-8"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <h1
              className="text-3xl md:text-5xl font-bold tracking-tight text-[#1a1a2e] mb-4"
              style={sfFont}
            >
              Refund Policy
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={150}>
            <p className="text-sm text-[#1a1a2e]/55">
              Last updated: April 2026
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-20">
        <AnimateOnScroll animation="fade-up" delay={200}>
          <div className="max-w-3xl mx-auto bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-8 md:p-12 space-y-8">
            <Section title="1. Ticket Purchases">
              <p>
                All ticket purchases for The Leadership Federation (&quot;TLF&quot;)
                events, conclaves, summits, and conferences are{" "}
                <strong>non-refundable</strong>. Once a ticket purchase is
                confirmed and payment is processed, refunds will not be issued
                for change of plans, scheduling conflicts, or inability to
                attend.
              </p>
            </Section>

            <Section title="2. Ticket Transfers">
              <p>
                While tickets are non-refundable, they may be transferred to
                another person with prior written approval from TLF. To request
                a ticket transfer, please contact us at{" "}
                <a
                  href="mailto:hello@theleadershipfederation.com"
                  className="text-[#e7ab1c] hover:underline"
                >
                  hello@theleadershipfederation.com
                </a>{" "}
                at least 7 business days before the event date with the details
                of the new attendee.
              </p>
            </Section>

            <Section title="3. Event Cancellation by TLF">
              <p>
                In the event that TLF cancels an event entirely (not merely
                postpones or reschedules), all ticket holders will receive a{" "}
                <strong>full refund</strong> within 21 business days of the
                cancellation announcement. Refunds will be issued to the
                original payment method used at the time of purchase.
              </p>
            </Section>

            <Section title="4. Rescheduled Events">
              <p>
                If TLF reschedules an event to a different date, ticket holders
                may choose to:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  <strong>Attend the rescheduled event</strong> -- your existing
                  ticket and registration will remain valid for the new date
                </li>
                <li>
                  <strong>Request a full refund</strong> -- if the new date does
                  not work for you, contact us within 14 days of the
                  rescheduling announcement to request a refund, which will be
                  processed within 21 business days
                </li>
              </ul>
            </Section>

            <Section title="5. Sponsorship & Exhibitor Fees">
              <p>
                Sponsorship and exhibitor fees are generally{" "}
                <strong>non-refundable</strong> once a sponsorship agreement has
                been executed. In the event that TLF cancels a sponsored event,
                sponsors and exhibitors will receive either:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>A full refund of the sponsorship fee, or</li>
                <li>
                  A credit of equivalent value toward a future TLF event of
                  their choice
                </li>
              </ul>
              <p className="mt-2">
                The choice between refund and credit will be made in
                consultation with the sponsor.
              </p>
            </Section>

            <Section title="6. How to Contact Us">
              <p>
                For any questions regarding refunds, cancellations, or ticket
                transfers, please reach out to us at:
              </p>
              <div className="mt-3 p-4 bg-[#F4F8FF] rounded-xl border border-[#1a1a2e]/[0.06]">
                <p className="text-sm font-semibold text-[#1a1a2e]">
                  The Leadership Federation
                </p>
                <p className="text-sm text-[#1a1a2e]/70 mt-1">
                  Email:{" "}
                  <a
                    href="mailto:hello@theleadershipfederation.com"
                    className="text-[#e7ab1c] hover:underline"
                  >
                    hello@theleadershipfederation.com
                  </a>
                </p>
              </div>
            </Section>
          </div>
        </AnimateOnScroll>
      </section>
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2
        className="text-lg font-bold text-[#1a1a2e] mb-3"
        style={{
          fontFamily:
            "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
        }}
      >
        {title}
      </h2>
      <div className="text-sm text-[#1a1a2e]/80 leading-relaxed">{children}</div>
    </div>
  )
}
