import {
  CalendarCheck,
  Handshake,
  Mic2,
  Crown,
  MapPin,
  Mail,
  Phone,
  Trophy,
  Megaphone,
  Building2,
} from "lucide-react"
import { ContactForm } from "@/components/site/ContactForm"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

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

const DEPARTMENTS = [
  {
    icon: Handshake,
    department: "Sponsorship & Exhibitor",
    description: "Partner with us as a sponsor or exhibitor at our global leadership events.",
    contacts: [
      {
        name: "Harshal Patel",
        email: "Harshal@theleadershipfederation.com",
        phone: "+91 72279 93338",
        phoneRaw: "+917227993338",
      },
    ],
  },
  {
    icon: Trophy,
    department: "Award Nomination & Speaker Opportunity",
    description: "Nominate for awards or explore speaking engagements at TLF events.",
    contacts: [
      {
        name: "Ovais Kapadia",
        email: "Ovais@theleadershipfederation.com",
        phone: "+91 91060 33979",
        phoneRaw: "+919106033979",
      },
      {
        name: "Manan Desai",
        email: "Manan@theleadershipfederation.com",
        phone: "+91 99782 57508",
        phoneRaw: "+919978257508",
      },
    ],
  },
  {
    icon: Megaphone,
    department: "Marketing & Support",
    description: "Media inquiries, marketing collaborations, and general support.",
    contacts: [
      {
        name: "Jessica Morgan",
        role: "VP Marketing",
        email: "Hello@theleadershipfederation.com",
      },
    ],
  },
  {
    icon: Mail,
    department: "General Inquiries",
    description: "For general questions, event registration, and other inquiries.",
    contacts: [
      {
        name: "General",
        email: "hello@theleadershipfederation.com",
        label: "General Inquiries",
      },
      {
        name: "Registration",
        email: "register@theleadershipfederation.com",
        label: "Event Registration",
      },
    ],
  },
]

const sfFont = { fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
              We Would Love to Hear From You
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-[#1a1a2e] mb-6"
              style={sfFont}
            >
              Get In Touch
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={200}>
            <p className="text-lg text-[#1a1a2e]/75 max-w-2xl mx-auto leading-relaxed">
              Whether you are looking to attend our next event, explore a partnership, or
              join the Inner Circle, our team is here to help.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Inquiry Type Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <StaggerChildren animation="fade-up" stagger={100} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INQUIRY_TYPES.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-6 flex flex-col items-start transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30"
              >
                <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-base font-bold text-[#1a1a2e] mb-1.5">
                  {item.label}
                </h3>
                <p className="text-sm text-[#1a1a2e]/75 leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </StaggerChildren>
      </section>

      {/* Form + Office Info */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <AnimateOnScroll animation="fade-left" className="lg:col-span-2">
            <ContactForm sourcePage="contact" />
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-right" delay={200} className="flex flex-col gap-6">
            {/* Address */}
            <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a2e]">Office</h3>
              </div>
              <p className="text-sm text-[#1a1a2e]/75 leading-relaxed">
                The Leadership Federation<br />
                Office No. 44-43, Building of Dubai Municipality<br />
                Bur Dubai - Al Fahidi<br />
                Dubai, United Arab Emirates
              </p>
            </div>

            {/* Email */}
            <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a2e]">Email</h3>
              </div>
              <div className="space-y-1.5">
                <a href="mailto:register@theleadershipfederation.com" className="text-sm text-[#1a1a2e]/80 hover:text-[#e7ab1c] transition-colors block">
                  register@theleadershipfederation.com
                </a>
                <a href="mailto:Hello@theleadershipfederation.com" className="text-sm text-[#1a1a2e]/80 hover:text-[#e7ab1c] transition-colors block">
                  Hello@theleadershipfederation.com
                </a>
              </div>
            </div>

            {/* Key Contacts */}
            <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-[#e7ab1c]" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a2e]">Key Contacts</h3>
              </div>
              <StaggerChildren animation="fade-up" stagger={80} className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-[#1a1a2e]">Harshal Patel</p>
                  <p className="text-[#1a1a2e]/65 text-xs mb-0.5">Sponsorship & Exhibitor Opportunities</p>
                  <a href="tel:+917227993338" className="text-xs text-[#e7ab1c] hover:underline">+91 72279 93338</a>
                  <span className="text-[#1a1a2e]/30 mx-1.5">·</span>
                  <a href="mailto:Harshal@theleadershipfederation.com" className="text-xs text-[#1a1a2e]/75 hover:text-[#e7ab1c]">Harshal@theleadershipfederation.com</a>
                </div>
                <div>
                  <p className="font-bold text-[#1a1a2e]">Ovais Kapadia</p>
                  <p className="text-[#1a1a2e]/65 text-xs mb-0.5">Award Nomination & Speaker Opportunities</p>
                  <a href="tel:+919106033979" className="text-xs text-[#e7ab1c] hover:underline">+91 91060 33979</a>
                  <span className="text-[#1a1a2e]/30 mx-1.5">·</span>
                  <a href="mailto:Ovais@theleadershipfederation.com" className="text-xs text-[#1a1a2e]/75 hover:text-[#e7ab1c]">Ovais@theleadershipfederation.com</a>
                </div>
                <div>
                  <p className="font-bold text-[#1a1a2e]">Manan Desai</p>
                  <p className="text-[#1a1a2e]/65 text-xs mb-0.5">Award Nomination & Speaker Opportunities</p>
                  <a href="tel:+919978257508" className="text-xs text-[#e7ab1c] hover:underline">+91 99782 57508</a>
                  <span className="text-[#1a1a2e]/30 mx-1.5">·</span>
                  <a href="mailto:Manan@theleadershipfederation.com" className="text-xs text-[#1a1a2e]/75 hover:text-[#e7ab1c]">Manan@theleadershipfederation.com</a>
                </div>
                <div>
                  <p className="font-bold text-[#1a1a2e]">Jessica Morgan</p>
                  <p className="text-[#1a1a2e]/65 text-xs mb-0.5">VP Marketing</p>
                  <a href="mailto:Hello@theleadershipfederation.com" className="text-xs text-[#1a1a2e]/75 hover:text-[#e7ab1c]">Hello@theleadershipfederation.com</a>
                </div>
              </StaggerChildren>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Reach the Right Team */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-10">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4">
              Direct Contacts
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-[#1a1a2e] mb-3"
              style={sfFont}
            >
              Reach the Right Team
            </h2>
            <p className="text-base text-[#1a1a2e]/70 max-w-xl mx-auto leading-relaxed">
              Connect directly with the department that can best assist you.
            </p>
          </div>
        </AnimateOnScroll>

        <StaggerChildren
          animation="fade-up"
          stagger={120}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon
            return (
              <div
                key={dept.department}
                className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-7 transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-[#e7ab1c]" />
                  </div>
                  <h3 className="text-base font-bold text-[#1a1a2e]">
                    {dept.department}
                  </h3>
                </div>
                <p className="text-sm text-[#1a1a2e]/65 leading-relaxed mb-5">
                  {dept.description}
                </p>
                <div className="space-y-4">
                  {dept.contacts.map((contact) => (
                    <div
                      key={contact.email}
                      className="border-t border-[#1a1a2e]/[0.06] pt-4 first:border-t-0 first:pt-0"
                    >
                      <p className="font-semibold text-sm text-[#1a1a2e]">
                        {contact.name}
                        {"role" in contact && contact.role && (
                          <span className="font-normal text-[#1a1a2e]/55 ml-2 text-xs">
                            {contact.role}
                          </span>
                        )}
                        {"label" in contact && contact.label && (
                          <span className="font-normal text-[#1a1a2e]/55 ml-2 text-xs">
                            {contact.label}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <a
                          href={`mailto:${contact.email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[#1a1a2e]/75 hover:text-[#e7ab1c] transition-colors"
                        >
                          <Mail size={13} className="shrink-0" />
                          {contact.email}
                        </a>
                        {"phone" in contact && contact.phone && (
                          <a
                            href={`tel:${contact.phoneRaw}`}
                            className="inline-flex items-center gap-1.5 text-xs text-[#e7ab1c] hover:underline"
                          >
                            <Phone size={13} className="shrink-0" />
                            {contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </StaggerChildren>
      </section>

      {/* Dubai Office Address */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <AnimateOnScroll animation="fade-up">
          <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
              <Building2 size={26} className="text-[#e7ab1c]" />
            </div>
            <div>
              <h3
                className="text-lg font-bold text-[#1a1a2e] mb-1"
                style={sfFont}
              >
                Our Dubai Office
              </h3>
              <p className="text-sm text-[#1a1a2e]/70 leading-relaxed flex items-start gap-2">
                <MapPin size={15} className="text-[#e7ab1c] shrink-0 mt-0.5" />
                Office No. 44-43, Building of Dubai Municipality, Bur Dubai - Al Fahidi, Dubai, United Arab Emirates
              </p>
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </main>
  )
}
