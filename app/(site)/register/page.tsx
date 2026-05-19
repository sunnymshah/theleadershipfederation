import { Suspense } from "react"
import { cookies } from "next/headers"
import {
  MapPin, Mail, Phone, Building2, Star, CalendarCheck, Handshake,
  Mic2, Crown, Trophy, Megaphone, Users, Briefcase,
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
    "Register for The Leadership Federation as a delegate, speaker, sponsor, jury member, or nominate a leader for an award. One place to join the global leadership community.",
}

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarCheck, Handshake, Mic2, Crown, MapPin, Mail, Phone,
  Trophy, Megaphone, Building2, Users, Briefcase,
}
function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return Star
  return ICON_MAP[name] ?? Star
}

type Department = { id: string; name: string; description: string | null; icon: string | null; sort_order: number }
type Person = {
  id: string; department_id: string | null; name: string; role: string | null
  email: string | null; phone: string | null; phone_raw: string | null; sort_order: number
}
type Office = {
  id: string; city: string; address_lines: string[] | null; timezone: string | null
  phone: string | null; email: string | null; is_primary: boolean; sort_order: number
}

export default async function RegisterPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, title, slug")
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
  } catch {/* empty state */}

  const primaryOffice = offices.find((o) => o.is_primary) ?? offices[0]
  const emailContacts = Array.from(
    new Set(persons.filter((p) => p.email).map((p) => p.email as string)),
  ).slice(0, 3)
  const phoneContacts = persons.filter((p) => p.phone && p.phone_raw).slice(0, 3)

  return (
    <main className="bg-white">
      {/* ══════════════ Hero ══════════════ */}
      <section className="relative bg-white pt-32 lg:pt-40 pb-12 lg:pb-14 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(58% 56% at 50% 0%, rgba(0,113,227,0.09) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-flex items-center gap-2 lf-glass rounded-full px-4 py-1.5 text-[11px] sm:text-[12px] font-bold text-[#0071e3] uppercase tracking-[0.2em]">
              <Star size={12} fill="currentColor" /> Join the Movement
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={110}>
            <h1 className="mt-6 text-[clamp(2.6rem,5.8vw,4.6rem)] font-bold text-[#1d1d1f] tracking-[-0.04em] leading-[1.0]">
              Register &amp; <span className="text-[#0071e3]">get involved</span>
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={220}>
            <p className="mt-5 sm:mt-6 text-[15px] sm:text-[18px] text-[#1d1d1f]/60 leading-relaxed max-w-2xl mx-auto">
              One place for every way in — attend as a delegate, speak on stage,
              sponsor an event, nominate a leader, or join the jury. Choose your
              path and register in minutes.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════════ Role selector + form ══════════════ */}
      <section className="relative bg-[#f5f5f7] pt-14 lg:pt-16 overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(54% 40% at 50% 0%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
              "radial-gradient(50% 50% at 88% 90%, rgba(0,113,227,0.09) 0%, transparent 72%), " +
              "radial-gradient(46% 48% at 10% 96%, rgba(0,113,227,0.06) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10">
          <AnimateOnScroll animation="fade-up" className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 mb-10">
            <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
              Choose Your Path
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
              How would you like to take part?
            </h2>
          </AnimateOnScroll>

          <Suspense
            fallback={
              <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="lf-glass rounded-[22px] h-44 animate-pulse" />
                  ))}
                </div>
              </div>
            }
          >
            <RegistrationForm events={events} />
          </Suspense>
        </div>
      </section>

      {/* ══════════════ Reach the right team ══════════════ */}
      {departments.length > 0 && (
        <section className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(56% 48% at 50% 0%, rgba(0,113,227,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="text-[12px] font-semibold text-[#0071e3] uppercase tracking-[0.22em]">
                Direct Contacts
              </span>
              <h2 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold text-[#1d1d1f] tracking-[-0.035em] leading-[1.05]">
                Reach the right team
              </h2>
              <p className="mt-4 text-[#1d1d1f]/55 text-[16px] leading-relaxed">
                Prefer a direct line? Connect with the team that can best help.
              </p>
            </AnimateOnScroll>

            <StaggerChildren
              animation="fade-up"
              stagger={100}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {departments.map((dept) => {
                const Icon = resolveIcon(dept.icon)
                const deptPersons = persons.filter((p) => p.department_id === dept.id)
                return (
                  <div key={dept.id} className="lf-glass rounded-[24px] p-7 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[#0071e3] flex items-center justify-center shrink-0 shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                        <Icon size={19} className="text-white" strokeWidth={1.9} />
                      </div>
                      <h3 className="text-[16px] font-bold text-[#1d1d1f] tracking-[-0.015em]">
                        {dept.name}
                      </h3>
                    </div>
                    {dept.description && (
                      <p className="text-[13.5px] text-[#1d1d1f]/60 leading-relaxed mb-5">
                        {dept.description}
                      </p>
                    )}
                    <div className="space-y-4">
                      {deptPersons.map((contact) => (
                        <div key={contact.id} className="border-t border-black/[0.07] pt-4 first:border-t-0 first:pt-0">
                          <p className="font-semibold text-[14px] text-[#1d1d1f]">
                            {contact.name}
                            {contact.role && (
                              <span className="font-normal text-[#1d1d1f]/50 ml-2 text-[12px]">
                                {contact.role}
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-[12.5px] text-[#1d1d1f]/70 hover:text-[#0071e3] transition-colors">
                                <Mail size={13} className="shrink-0" /> {contact.email}
                              </a>
                            )}
                            {contact.phone && contact.phone_raw && (
                              <a href={`tel:${contact.phone_raw}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0071e3] hover:underline">
                                <Phone size={13} className="shrink-0" /> {contact.phone}
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
          </div>
        </section>
      )}

      {/* ══════════════ Office + quick contact ══════════════ */}
      {(primaryOffice || emailContacts.length > 0 || phoneContacts.length > 0) && (
        <section className="relative bg-[#f5f5f7] py-16 sm:py-20 lg:py-24 overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(54% 50% at 50% 100%, rgba(0,113,227,0.1) 0%, transparent 72%)",
            }}
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
            <AnimateOnScroll animation="fade-up">
              <div className="lf-glass-strong rounded-[28px] p-8 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                {primaryOffice && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0071e3] flex items-center justify-center">
                        <Building2 size={17} className="text-white" />
                      </div>
                      <h3 className="text-[14px] font-bold text-[#1d1d1f]">
                        {primaryOffice.city} Office
                      </h3>
                    </div>
                    <p className="text-[13.5px] text-[#1d1d1f]/65 leading-relaxed">
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
                      <div className="w-10 h-10 rounded-xl bg-[#0071e3] flex items-center justify-center">
                        <Mail size={17} className="text-white" />
                      </div>
                      <h3 className="text-[14px] font-bold text-[#1d1d1f]">Email</h3>
                    </div>
                    <div className="space-y-1.5">
                      {emailContacts.map((email) => (
                        <a key={email} href={`mailto:${email}`} className="text-[13.5px] text-[#1d1d1f]/70 hover:text-[#0071e3] transition-colors block">
                          {email}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {phoneContacts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0071e3] flex items-center justify-center">
                        <Phone size={17} className="text-white" />
                      </div>
                      <h3 className="text-[14px] font-bold text-[#1d1d1f]">Phone</h3>
                    </div>
                    <div className="space-y-2">
                      {phoneContacts.map((c) => (
                        <div key={c.id}>
                          <p className="text-[13.5px] font-semibold text-[#1d1d1f]">{c.name}</p>
                          {c.role && <p className="text-[12px] text-[#1d1d1f]/55">{c.role}</p>}
                          {c.phone_raw && c.phone && (
                            <a href={`tel:${c.phone_raw}`} className="text-[12.5px] font-semibold text-[#0071e3] hover:underline">
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
          </div>
        </section>
      )}
    </main>
  )
}
