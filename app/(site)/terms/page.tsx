import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll"

export const revalidate = 3600

export const metadata = {
  title: "Terms & Conditions | The Leadership Federation",
  description:
    "Terms and conditions governing the use of The Leadership Federation platform, events, and services.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

export default function TermsPage() {
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
              Terms & Conditions
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
            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using The Leadership Federation (&quot;TLF&quot;)
                website, attending our events, or engaging with our services, you
                agree to be bound by these Terms & Conditions. If you do not agree,
                please discontinue use of our platform and services immediately.
              </p>
            </Section>

            <Section title="2. Services Offered">
              <p>
                The Leadership Federation organizes and facilitates leadership
                events, conferences, conclaves, summits, award ceremonies, and
                related services. Our offerings include but are not limited to:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Leadership conclaves and summits across global markets</li>
                <li>Award nomination, evaluation, and ceremony services</li>
                <li>Conference ticketing and delegate registration</li>
                <li>Sponsorship and exhibitor partnership programs</li>
                <li>Speaker nomination and management</li>
                <li>Membership programs for CXO-level professionals</li>
              </ul>
            </Section>

            <Section title="3. User Responsibilities">
              <p>
                By using our platform and registering for our events, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  Provide accurate, current, and complete information during
                  registration and at all times
                </li>
                <li>
                  Not engage in any fraudulent, misleading, or unlawful activity
                </li>
                <li>
                  Maintain the confidentiality of any account credentials provided
                  to you
                </li>
                <li>
                  Comply with all applicable local, national, and international
                  laws and regulations
                </li>
                <li>
                  Conduct yourself professionally at all TLF events and
                  interactions
                </li>
              </ul>
            </Section>

            <Section title="4. Event Registrations & Ticketing">
              <p>
                All event registrations are subject to availability. TLF reserves
                the right to limit registrations, modify event schedules, change
                venues, or cancel events at its sole discretion. Specific terms
                related to refunds and cancellations are governed by our separate{" "}
                <Link
                  href="/refund-policy"
                  className="text-[#e7ab1c] hover:underline"
                >
                  Refund Policy
                </Link>
                .
              </p>
              <p className="mt-2">
                Tickets are issued on a per-event basis and may have individual
                terms attached. TLF may require identification verification at the
                point of entry.
              </p>
            </Section>

            <Section title="5. Sponsorships & Partnerships">
              <p>
                All sponsorship and partnership applications are subject to
                discretionary approval by TLF. Submission of a sponsorship
                application does not guarantee acceptance. TLF reserves the right
                to approve, decline, or modify sponsorship arrangements based on
                alignment with our mission and event requirements.
              </p>
            </Section>

            <Section title="6. Content & Intellectual Property">
              <p>
                All content, materials, branding, designs, logos, event formats,
                and intellectual property associated with The Leadership Federation
                are the exclusive property of TLF and are protected by applicable
                intellectual property laws.
              </p>
              <p className="mt-2">
                Attendees and participants may share event content on social media
                platforms with proper attribution to The Leadership Federation.
                Commercial use, reproduction, or distribution of TLF materials
                without prior written consent is strictly prohibited.
              </p>
            </Section>

            <Section title="7. Privacy & Data Protection">
              <p>
                Your privacy is important to us. The collection, use, and
                protection of your personal information is governed by our{" "}
                <Link
                  href="/privacy-policy"
                  className="text-[#e7ab1c] hover:underline"
                >
                  Privacy Policy
                </Link>
                . We do not share your personal data with third parties except as
                necessary to deliver event-related services.
              </p>
            </Section>

            <Section title="8. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, The Leadership Federation,
                its directors, employees, and partners shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages
                arising out of or related to your use of our services, attendance
                at our events, or reliance on any information provided by TLF.
              </p>
              <p className="mt-2">
                TLF&apos;s total liability for any claims arising under these terms
                shall not exceed the amount paid by you for the specific service or
                event in question.
              </p>
            </Section>

            <Section title="9. Changes to Terms">
              <p>
                TLF reserves the right to modify these Terms & Conditions at any
                time. Changes will be effective upon posting to this page with an
                updated date. Your continued use of our services after changes are
                posted constitutes acceptance of the revised terms. We encourage
                you to review this page periodically.
              </p>
            </Section>

            <Section title="10. Contact">
              <p>
                If you have any questions or concerns regarding these Terms &
                Conditions, please contact us at:
              </p>
              <p className="mt-2">
                <a
                  href="mailto:hello@theleadershipfederation.com"
                  className="text-[#e7ab1c] hover:underline"
                >
                  hello@theleadershipfederation.com
                </a>
              </p>
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
