/**
 * 7 prebuilt page templates the admin can mount onto any standard page.
 * Each template is a Puck `Data` object — same shape as
 * standard-page-defaults but pre-curated for a specific use case.
 *
 * Usage from the editor: open a page → "Apply template" → preview →
 * Apply (replaces page content) or "Append" (adds to the end).
 */

import type { Data as PuckData } from "@measured/puck"
import { defaultPuckDataForKind } from "./standard-page-defaults"

export type SectionTemplate = {
  id: string
  name: string
  description: string
  scope: "home" | "subpage" | "any"
  preview: string  // emoji or short visual hint
  data: PuckData
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}
function block(type: string, props: Record<string, unknown> = {}) {
  return { type, props: { id: uid(type.toLowerCase()), ...props } }
}
function tree(content: ReturnType<typeof block>[]): PuckData {
  return {
    content: content as unknown as PuckData["content"],
    root: { props: { title: "" } },
    zones: {},
  }
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: "conference-home",
    name: "Conference home",
    description: "Hero · Countdown · About · Speakers · Agenda · Tickets · Sponsors · Footer.",
    scope: "home",
    preview: "🏛",
    data: defaultPuckDataForKind("home"),
  },
  {
    id: "workshop-landing",
    name: "Workshop landing",
    description: "Tighter hero, two value props, registration CTA. One-day events.",
    scope: "home",
    preview: "🎓",
    data: tree([
      block("Hero", { title: "A 1-day workshop for operators", subtitle: "Hands-on. Small group. Take-home playbook.", ctaLabel: "Reserve a seat", ctaUrl: "/tickets", minHeight: "tall" }),
      block("StatsRow", { title: "", animated: false, stats: [
        { value: "1 day", label: "Format", icon: "" },
        { value: "<25",   label: "Seats",  icon: "" },
        { value: "₹--",   label: "All-in", icon: "" },
      ] }),
      block("RichText", { title: "What you'll leave with", subtitle: "", body: "A working playbook, edits from peers, and the kind of contacts you'd otherwise spend a quarter chasing." }),
      block("CtaWithImage", { image: "", title: "Apply now", body: "Limited cohort. We close registrations once full.", ctaLabel: "Apply", ctaUrl: "/tickets", imageSide: "right", imageStyle: "rounded" }),
      block("Footer", { columns: 3, copyright: "© The Leadership Federation", showPoweredBy: true }),
    ]),
  },
  {
    id: "speaker-showcase",
    name: "Speaker showcase",
    description: "Tall hero · large speakers grid · individual bio cards · talk schedule.",
    scope: "subpage",
    preview: "🎤",
    data: tree([
      block("Hero", { title: "Speakers", subtitle: "The minds you came for.", minHeight: "short" }),
      block("SpeakersGrid", { title: "", gridLayout: "grid-3", frame: "circle", fit: "cover", linkToDetailPages: true }),
      block("ScheduleSummary", { title: "When they're on", mode: "compact", showSpeakers: true }),
      block("Footer", { columns: 3 }),
    ]),
  },
  {
    id: "sponsor-pack",
    name: "Sponsor pack",
    description: "Tier-grouped sponsors · logos strip · partnership CTA.",
    scope: "subpage",
    preview: "🤝",
    data: tree([
      block("Hero", { title: "Sponsors", subtitle: "The partners behind the room.", minHeight: "short" }),
      block("SponsorsGrid", { title: "", groupByTier: true }),
      block("LogosStrip", { title: "Past partners", logos: [] }),
      block("CtaWithImage", { image: "", title: "Become a partner", body: "Three sponsorship tiers, all with on-stage time.", ctaLabel: "Download deck", ctaUrl: "#", imageSide: "right", imageStyle: "rounded" }),
      block("Footer", { columns: 3 }),
    ]),
  },
  {
    id: "coming-soon",
    name: "Coming soon",
    description: "Centred hero · countdown · email capture. For pre-announce.",
    scope: "home",
    preview: "⏳",
    data: tree([
      block("Hero", { title: "Something new is coming.", subtitle: "Be the first to know when registration opens.", ctaLabel: "Get notified", ctaUrl: "#notify", alignment: "center", minHeight: "tall" }),
      block("Countdown", { title: "Doors open in", subtitle: "", pastMessage: "Registration is open!" }),
      block("Newsletter", { title: "Get notified", subtitle: "We'll email you the moment registration opens.", placeholder: "Your work email", ctaLabel: "Notify me" }),
      block("Footer", { columns: 1, copyright: "© The Leadership Federation" }),
    ]),
  },
  {
    id: "subpage-venue",
    name: "Sub-page · Venue",
    description: "Venue map · directions · gallery · partner hotels.",
    scope: "subpage",
    preview: "📍",
    data: tree([
      block("Hero", { title: "Venue", subtitle: "How to get there. Where to stay.", minHeight: "short" }),
      block("VenueMap", { title: "", address: "", height: "lg" }),
      block("RichText", { title: "Getting here", subtitle: "", body: "25 minutes from the airport. Closest hotels are walking distance." }),
      block("Gallery", { title: "Inside the venue", images: [], columns: 4, lightbox: true }),
      block("Footer", { columns: 3 }),
    ]),
  },
  {
    id: "subpage-faqs",
    name: "Sub-page · FAQs",
    description: "Hero + grouped FAQ accordion + contact CTA.",
    scope: "subpage",
    preview: "❓",
    data: tree([
      block("Hero", { title: "FAQs", subtitle: "Everything we get asked.", minHeight: "short" }),
      block("Faqs", { title: "Tickets & registration", faqs: [
        { q: "What's included?", a: "Full access — keynotes, breakouts, networking, lunch." },
        { q: "Can I get a refund?", a: "Full refund up to 14 days before the event; transfers after that." },
      ] }),
      block("Faqs", { title: "Logistics", faqs: [
        { q: "Is there a dress code?", a: "Smart casual." },
        { q: "Are meals included?", a: "Yes — lunch, tea breaks and a closing reception." },
      ] }),
      block("CtaButton", { title: "Still have questions?", subtitle: "", ctaLabel: "Email the team", ctaUrl: "mailto:hello@leadershipfederation.com", variant: "secondary" }),
      block("Footer", { columns: 3 }),
    ]),
  },
]

export function getTemplate(id: string): SectionTemplate | null {
  return SECTION_TEMPLATES.find((t) => t.id === id) ?? null
}
