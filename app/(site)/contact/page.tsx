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

export const revalidate = 86400

export const metadata = {
  title: "Contact Us | The Leadership Federation",
  description:
    "Get in touch with The Leadership Federation for event registration, partnerships, speaker nominations, or Inner Circle membership.",
}

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

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Hero */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
            We Would Love to Hear From You
          </span>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight text-black mb-6"
            style={sfFont}
          >
            Get In Touch
          </h1>
          <p className="text-lg text-black/40 max-w-2xl mx-auto leading-relaxed">
            Whether you are looking to attend our next event, explore a partnership, or
            join the Inner Circle, our team is here to help.
          </p>
        </div>
      </section>

      {/* Inquiry Type Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INQUIRY_TYPES.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="bg-white/70 border border-black/[0.04] rounded-2xl p-6 flex flex-col items-start transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-base font-bold text-black mb-1.5">
                  {item.label}
                </h3>
                <p className="text-sm text-black/35 leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Form + Office Info */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ContactForm sourcePage="contact" />
          </div>

          <div className="flex flex-col gap-6">
            {/* Address */}
            <div className="bg-white/70 border border-black/[0.04] rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-sm font-bold text-black">Office</h3>
              </div>
              <p className="text-sm text-black/40 leading-relaxed">
                The Leadership Federation<br />
                Office No. 44-43, Building of Dubai Municipality<br />
                Bur Dubai - Al Fahidi<br />
                Dubai, United Arab Emirates
              </p>
            </div>

            {/* Email */}
            <div className="bg-white/70 border border-black/[0.04] rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-sm font-bold text-black">Email</h3>
              </div>
              <div className="space-y-1.5">
                <a href="mailto:register@theleadershipfederation.com" className="text-sm text-black/50 hover:text-[#e7ab1c] transition-colors block">
                  register@theleadershipfederation.com
                </a>
                <a href="mailto:Hello@theleadershipfederation.com" className="text-sm text-black/50 hover:text-[#e7ab1c] transition-colors block">
                  Hello@theleadershipfederation.com
                </a>
              </div>
            </div>

            {/* Key Contacts */}
            <div className="bg-white/70 border border-black/[0.04] rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/10 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-sm font-bold text-black">Key Contacts</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-black/60">Harshal Patel</p>
                  <p className="text-black/30 text-xs mb-0.5">Sponsorship & Exhibitor Opportunities</p>
                  <a href="tel:+917227993338" className="text-xs text-[#e7ab1c] hover:underline">+91 72279 93338</a>
                  <span className="text-black/15 mx-1.5">·</span>
                  <a href="mailto:Harshal@theleadershipfederation.com" className="text-xs text-black/35 hover:text-[#e7ab1c]">Harshal@theleadershipfederation.com</a>
                </div>
                <div>
                  <p className="font-medium text-black/60">Ovais Kapadia</p>
                  <p className="text-black/30 text-xs mb-0.5">Award Nomination & Speaker Opportunities</p>
                  <a href="tel:+919106033979" className="text-xs text-[#e7ab1c] hover:underline">+91 91060 33979</a>
                  <span className="text-black/15 mx-1.5">·</span>
                  <a href="mailto:Ovais@theleadershipfederation.com" className="text-xs text-black/35 hover:text-[#e7ab1c]">Ovais@theleadershipfederation.com</a>
                </div>
                <div>
                  <p className="font-medium text-black/60">Manan Desai</p>
                  <p className="text-black/30 text-xs mb-0.5">Award Nomination & Speaker Opportunities</p>
                  <a href="tel:+919978257508" className="text-xs text-[#e7ab1c] hover:underline">+91 99782 57508</a>
                  <span className="text-black/15 mx-1.5">·</span>
                  <a href="mailto:Manan@theleadershipfederation.com" className="text-xs text-black/35 hover:text-[#e7ab1c]">Manan@theleadershipfederation.com</a>
                </div>
                <div>
                  <p className="font-medium text-black/60">Jessica Morgan</p>
                  <p className="text-black/30 text-xs mb-0.5">VP Marketing</p>
                  <a href="mailto:Hello@theleadershipfederation.com" className="text-xs text-black/35 hover:text-[#e7ab1c]">Hello@theleadershipfederation.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
