/* ═══════════════════════════════════════════════════════════════════════════
 *  CONTACT / GET IN TOUCH — Server Component
 *
 *  Inquiry type cards, a client-side contact form (ContactForm.tsx),
 *  and office information. Form submission handled via Server Action.
 * ═══════════════════════════════════════════════════════════════════════════ */

import {
  CalendarCheck,
  Handshake,
  Mic2,
  Crown,
  MapPin,
  Mail,
  Phone,
} from "lucide-react"
import { ContactForm } from "@/components/site/ContactForm"

export const metadata = {
  title: "Contact Us | The Leadership Federation",
  description:
    "Get in touch with The Leadership Federation for event registration, partnerships, speaker nominations, or Inner Circle membership.",
}

/* ─── Inquiry type cards data ────────────────────────────────────────────── */

const INQUIRY_TYPES = [
  {
    icon: CalendarCheck,
    label: "Event Registration",
    description:
      "Register for our upcoming conclaves, summits, and leadership forums across the globe.",
  },
  {
    icon: Handshake,
    label: "Partner With Us",
    description:
      "Explore sponsorship, co-creation, and strategic partnership opportunities with TLF.",
  },
  {
    icon: Mic2,
    label: "Speaker Nomination",
    description:
      "Nominate a thought leader or yourself to speak at our next flagship event.",
  },
  {
    icon: Crown,
    label: "Inner Circle Membership",
    description:
      "Apply for our invitation-only leadership community of 500+ global CXOs.",
  },
]

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#1a1a2e]/50 uppercase tracking-[0.25em] mb-5">
            We Would Love to Hear From You
          </span>
          <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight text-[#1a1a2e] mb-6">
            Get In Touch
          </h1>
          <p className="text-lg text-[#1a1a2e]/55 max-w-2xl mx-auto leading-relaxed">
            Whether you are looking to attend our next event, explore a partnership, or
            join the Inner Circle, our team is here to help.
          </p>
        </div>
      </section>

      {/* ── Inquiry Type Cards ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INQUIRY_TYPES.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="bg-white rounded-2xl p-6 flex flex-col items-start transition-shadow duration-300 hover:shadow-lg"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(26,26,46,0.04), 0 4px 14px rgba(26,26,46,0.03)",
                }}
              >
                <div className="w-11 h-11 rounded-xl bg-[#1a1a2e]/[0.06] flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#1a1a2e]/50" />
                </div>
                <h3 className="text-base font-bold text-[#1a1a2e] mb-1.5">
                  {item.label}
                </h3>
                <p className="text-sm text-[#1a1a2e]/45 leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Form + Office Info ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact form — client component */}
          <div className="lg:col-span-2">
            <ContactForm sourcePage="contact" />
          </div>

          {/* Office info sidebar */}
          <div className="flex flex-col gap-6">
            {/* Address */}
            <div
              className="bg-white rounded-2xl p-7"
              style={{
                boxShadow:
                  "0 1px 3px rgba(26,26,46,0.04), 0 4px 14px rgba(26,26,46,0.03)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a2e]/[0.06] flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-[#1a1a2e]/50" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a2e]">Office</h3>
              </div>
              <p className="text-sm text-[#1a1a2e]/50 leading-relaxed">
                The Leadership Federation<br />
                WeWork Galaxy, 43 Residency Road<br />
                Bengaluru, Karnataka 560025<br />
                India
              </p>
            </div>

            {/* Email */}
            <div
              className="bg-white rounded-2xl p-7"
              style={{
                boxShadow:
                  "0 1px 3px rgba(26,26,46,0.04), 0 4px 14px rgba(26,26,46,0.03)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a2e]/[0.06] flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-[#1a1a2e]/50" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a2e]">Email</h3>
              </div>
              <a
                href="mailto:hello@theleadershipfederation.com"
                className="text-sm text-[#1a1a2e]/60 hover:text-[#1a1a2e] transition-colors"
              >
                hello@theleadershipfederation.com
              </a>
            </div>

            {/* Phone */}
            <div
              className="bg-white rounded-2xl p-7"
              style={{
                boxShadow:
                  "0 1px 3px rgba(26,26,46,0.04), 0 4px 14px rgba(26,26,46,0.03)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a2e]/[0.06] flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-[#1a1a2e]/50" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a2e]">Phone</h3>
              </div>
              <a
                href="tel:+919876543210"
                className="text-sm text-[#1a1a2e]/60 hover:text-[#1a1a2e] transition-colors"
              >
                +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
