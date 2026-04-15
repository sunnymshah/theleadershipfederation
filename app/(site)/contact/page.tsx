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
  Users,
  Briefcase,
  Star,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ContactForm } from "@/components/site/ContactForm"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { getContactData } from "@/app/actions/cmsActions"

export const revalidate = 86400

export const metadata = {
  title: "Contact Us | The Leadership Federation",
  description:
    "Get in touch with The Leadership Federation for event registration, partnerships, speaker nominations, or Inner Circle membership.",
}

/* ── Icon resolver ────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
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
  Users,
  Briefcase,
}

function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return Star
  return ICON_MAP[name] ?? Star
}

/* ── Types ────────────────────────────────────────────────────────────── */

type Department = {
  id: string
  name: string
  description: string | null
  icon: string | null
  sort_order: number
}

type Person = {
  id: string
  department_id: string | null
  name: string
  role: string | null
  email: string | null
  phone: string | null
  phone_raw: string | null
  sort_order: number
}

type Office = {
  id: string
  city: string
  address_lines: string[] | null
  timezone: string | null
  phone: string | null
  email: string | null
  is_primary: boolean
  sort_order: number
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

export default async function ContactPage() {
  let departments: Department[] = []
  let persons: Person[] = []
  let offices: Office[] = []

  try {
    const res = await getContactData(true)
    if (res.success) {
      departments = (res.departments ?? []) as Department[]
      persons = (res.persons ?? []) as Person[]
      offices = (res.offices ?? []) as Office[]
    }
  } catch {
    /* empty state */
  }

  const primaryOffice = offices.find(o => o.is_primary) ?? offices[0]
  const keyContacts = persons.filter(p => p.phone && p.phone_raw).slice(0, 4)
  const emailOnlyContacts = Array.from(
    new Set(persons.filter(p => p.email && !p.phone).map(p => p.email as string))
  )

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

      {/* Inquiry Type Cards — static */}
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
            {primaryOffice && (
              <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-[#e7ab1c]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1a1a2e]">Office</h3>
                </div>
                <p className="text-sm text-[#1a1a2e]/75 leading-relaxed">
                  {(primaryOffice.address_lines ?? []).map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < (primaryOffice.address_lines?.length ?? 0) - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            )}

            {/* Email */}
            {emailOnlyContacts.length > 0 && (
              <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-[#e7ab1c]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1a1a2e]">Email</h3>
                </div>
                <div className="space-y-1.5">
                  {emailOnlyContacts.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      className="text-sm text-[#1a1a2e]/80 hover:text-[#e7ab1c] transition-colors block"
                    >
                      {email}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Key Contacts */}
            {keyContacts.length > 0 && (
              <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-[#e7ab1c]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1a1a2e]">Key Contacts</h3>
                </div>
                <StaggerChildren animation="fade-up" stagger={80} className="space-y-4 text-sm">
                  {keyContacts.map((contact) => {
                    const dept = departments.find(d => d.id === contact.department_id)
                    return (
                      <div key={contact.id}>
                        <p className="font-bold text-[#1a1a2e]">{contact.name}</p>
                        {(contact.role || dept?.name) && (
                          <p className="text-[#1a1a2e]/65 text-xs mb-0.5">
                            {contact.role ?? dept?.name}
                          </p>
                        )}
                        {contact.phone_raw && contact.phone && (
                          <>
                            <a href={`tel:${contact.phone_raw}`} className="text-xs text-[#e7ab1c] hover:underline">
                              {contact.phone}
                            </a>
                            {contact.email && (
                              <span className="text-[#1a1a2e]/30 mx-1.5">·</span>
                            )}
                          </>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-xs text-[#1a1a2e]/75 hover:text-[#e7ab1c]"
                          >
                            {contact.email}
                          </a>
                        )}
                      </div>
                    )
                  })}
                </StaggerChildren>
              </div>
            )}
          </AnimateOnScroll>
        </div>
      </section>

      {/* Reach the Right Team */}
      {departments.length > 0 && (
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
            {departments.map((dept) => {
              const Icon = resolveIcon(dept.icon)
              const deptPersons = persons.filter(p => p.department_id === dept.id)
              return (
                <div
                  key={dept.id}
                  className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-7 transition-all duration-300 hover:shadow-md hover:border-[#e7ab1c]/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-[#e7ab1c]" />
                    </div>
                    <h3 className="text-base font-bold text-[#1a1a2e]">
                      {dept.name}
                    </h3>
                  </div>
                  {dept.description && (
                    <p className="text-sm text-[#1a1a2e]/65 leading-relaxed mb-5">
                      {dept.description}
                    </p>
                  )}
                  <div className="space-y-4">
                    {deptPersons.map((contact) => (
                      <div
                        key={contact.id}
                        className="border-t border-[#1a1a2e]/[0.06] pt-4 first:border-t-0 first:pt-0"
                      >
                        <p className="font-semibold text-sm text-[#1a1a2e]">
                          {contact.name}
                          {contact.role && (
                            <span className="font-normal text-[#1a1a2e]/55 ml-2 text-xs">
                              {contact.role}
                            </span>
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="inline-flex items-center gap-1.5 text-xs text-[#1a1a2e]/75 hover:text-[#e7ab1c] transition-colors"
                            >
                              <Mail size={13} className="shrink-0" />
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && contact.phone_raw && (
                            <a
                              href={`tel:${contact.phone_raw}`}
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
      )}

      {/* Primary Office Address */}
      {primaryOffice && (
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
                  Our {primaryOffice.city} Office
                </h3>
                <p className="text-sm text-[#1a1a2e]/70 leading-relaxed flex items-start gap-2">
                  <MapPin size={15} className="text-[#e7ab1c] shrink-0 mt-0.5" />
                  {(primaryOffice.address_lines ?? []).join(", ")}
                </p>
              </div>
            </div>
          </AnimateOnScroll>
        </section>
      )}
    </main>
  )
}
