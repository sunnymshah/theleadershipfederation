import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll"

export const revalidate = 3600

export const metadata = {
  title: "Privacy Policy | The Leadership Federation",
  description:
    "Privacy policy for The Leadership Federation covering data collection, usage, security, and your rights.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

export default function PrivacyPolicyPage() {
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
              Privacy Policy
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
            <div className="text-sm text-[#1a1a2e]/80 leading-relaxed">
              <p>
                The Leadership Federation (&quot;TLF,&quot; &quot;we,&quot;
                &quot;us,&quot; or &quot;our&quot;) is committed to protecting
                your privacy. This Privacy Policy describes how we collect, use,
                store, and protect your personal information when you interact
                with our website, register for events, or engage with our
                services.
              </p>
            </div>

            <Section title="1. Information We Collect">
              <p>
                We collect the following types of personal information when you
                register for events, submit inquiries, or interact with our
                platform:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  <strong>Personal identifiers:</strong> Full name, email
                  address, phone number
                </li>
                <li>
                  <strong>Professional information:</strong> Company name,
                  designation/title, LinkedIn profile URL
                </li>
                <li>
                  <strong>Event-related data:</strong> Registration details,
                  event preferences, participation type
                </li>
                <li>
                  <strong>Communications:</strong> Messages, inquiries, and
                  feedback you submit through our forms
                </li>
                <li>
                  <strong>Technical data:</strong> IP address, browser type,
                  device information, and cookies (collected automatically)
                </li>
              </ul>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>
                We use the personal information we collect for the following
                purposes:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  Processing event registrations and managing attendance
                </li>
                <li>
                  Communicating with you about upcoming events, schedule changes,
                  and important updates
                </li>
                <li>
                  Evaluating award nominations, speaker applications, and
                  sponsorship inquiries
                </li>
                <li>Providing membership services and benefits</li>
                <li>
                  Improving our website, services, and user experience
                </li>
                <li>
                  Sending newsletters and marketing communications (with your
                  consent)
                </li>
                <li>Complying with legal obligations</li>
              </ul>
            </Section>

            <Section title="3. Data Sharing">
              <p>
                We do not sell, rent, or trade your personal information to third
                parties. We may share your information only in the following
                circumstances:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  <strong>Event service providers:</strong> With trusted
                  third-party vendors necessary to deliver event services (e.g.,
                  venue management, catering, badge printing). These providers
                  are contractually bound to protect your data.
                </li>
                <li>
                  <strong>Legal requirements:</strong> When required by law,
                  legal process, or government request
                </li>
                <li>
                  <strong>With your consent:</strong> When you have explicitly
                  agreed to the sharing of your information
                </li>
              </ul>
            </Section>

            <Section title="4. Data Security">
              <p>
                We implement reasonable administrative, technical, and physical
                security measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction.
                These measures include encrypted data transmission, secure server
                infrastructure, and access controls.
              </p>
              <p className="mt-2">
                While we strive to protect your data, no method of transmission
                over the internet or electronic storage is 100% secure. We
                cannot guarantee absolute security but are committed to taking
                every reasonable precaution.
              </p>
            </Section>

            <Section title="5. Cookies">
              <p>
                Our website uses standard web cookies and similar technologies
                to enhance your browsing experience. Cookies help us:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Remember your preferences and settings</li>
                <li>Understand how you interact with our website</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Improve website functionality and performance</li>
              </ul>
              <p className="mt-2">
                You can manage cookie preferences through your browser settings.
                Please note that disabling cookies may affect certain features of
                our website.
              </p>
            </Section>

            <Section title="6. Your Rights">
              <p>
                You have the following rights regarding your personal
                information:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  <strong>Access:</strong> Request a copy of the personal
                  information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of any
                  inaccurate or incomplete information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information, subject to legal retention requirements
                </li>
                <li>
                  <strong>Opt-out:</strong> Unsubscribe from marketing
                  communications at any time via the unsubscribe link in our
                  emails
                </li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, please contact us using the
                details below.
              </p>
            </Section>

            <Section title="7. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or applicable laws. Any updates will be
                posted on this page with a revised &quot;Last updated&quot; date.
                We encourage you to review this policy periodically.
              </p>
            </Section>

            <Section title="8. Contact Us">
              <p>
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or your personal data, please contact us at:
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
