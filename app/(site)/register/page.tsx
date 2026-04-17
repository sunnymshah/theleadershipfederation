import { Suspense } from "react"
import { cookies } from "next/headers"
import {
  MapPin,
  Mail,
  Phone,
  Building2,
  Star,
  CalendarCheck,
  Handshake,
  Mic2,
  Crown,
  Trophy,
  Megaphone,
  Users,
  Briefcase,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"
import { RegistrationForm } from "@/components/site/RegistrationForm"
import { getContactData } from "@/app/actions/cmsActions"

export const revalidate = 3600

export const metadata = {
  title: "Register & Get Involved | The Leadership Federation",
  description:
    "Register for The Leadership Federation events as a delegate, speaker, sponsor, jury member, or nominate a leader for an award. Join the global leadership community.",
  openGraph: {
    title: "Register & Get Involved | The Leadership Federation",
    description:
      "Register for The Leadership Federation events as a delegate, speaker, sponsor, jury member, or nominate a leader for an award.",
  },
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

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

export default async function RegisterPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, title")
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })

  const events = upcomingEvents ?? []

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
  } catch { /* empty state */ }

  const primaryOffice = offices.find((o) => o.is_primary) ?? offices[0]
  const emailContacts = Array.from(
    new Set(persons.filter((p) => p.email).map((p) => p.email as string)),
  ).slice(0, 3)
  const phoneContacts = persons.filter((p) => p.phone && p.phone_raw).slice(0, 3)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-5">
              Join the Movement
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-[#1a1a2e] mb-6"
              style={sfFont}
            >
              Register & Get Involved
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={200}>
            <p className="text-lg text-[#1a1a2e]/75 max-w-2xl mx-auto leading-relaxed">
              Attend as a delegate, speak on stage, sponsor an event, nominate
              a leader for an award, or join our jury panel — choose your path
              and register in minutes.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Role selector + form (client component with Suspense for searchParams) */}
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-6 pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#1a1a2e]/[0.06] rounded-2xl p-6 h-40 animate-pulse"
                />
              ))}
            </div>
          </div>
        }
      >
        <RegistrationForm events={events} />
      </Suspense>

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
                Prefer a direct line? Connect with the department that can
                best assist you.
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
              const deptPersons = persons.filter((p) => p.department_id === dept.id)
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

      {/* Office + quick contact strip */}
      {(primaryOffice || emailContacts.length > 0 || phoneContacts.length > 0) && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <AnimateOnScroll animation="fade-up">
            <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {primaryOffice && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center">
                      <Building2 size={18} className="text-[#e7ab1c]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1a1a2e]">
                      {primaryOffice.city} Office
                    </h3>
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

              {emailContacts.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center">
                      <Mail size={18} className="text-[#e7ab1c]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1a1a2e]">Email</h3>
                  </div>
                  <div className="space-y-1.5">
                    {emailContacts.map((email) => (
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

              {phoneContacts.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 flex items-center justify-center">
                      <Phone size={18} className="text-[#e7ab1c]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1a1a2e]">Phone</h3>
                  </div>
                  <div className="space-y-2">
                    {phoneContacts.map((c) => (
                      <div key={c.id}>
                        <p className="text-sm font-semibold text-[#1a1a2e]">
                          {c.name}
                        </p>
                        {c.role && (
                          <p className="text-xs text-[#1a1a2e]/55">{c.role}</p>
                        )}
                        {c.phone_raw && c.phone && (
                          <a
                            href={`tel:${c.phone_raw}`}
                            className="text-xs text-[#e7ab1c] hover:underline"
                          >
                            {c.phone}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimateOnScroll>
        </section>
      )}
    </main>
  )
}
