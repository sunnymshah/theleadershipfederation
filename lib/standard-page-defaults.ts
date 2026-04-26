/**
 * Default Puck data tree for every standard page kind.
 * Returned when a page row's `settings.puckData` is empty (newly seeded
 * event, or after a "Reset to default" admin action).
 *
 * The block names below MUST match those registered in
 * `components/admin/puck/puck-config.tsx`. Block prop shapes mirror the
 * defaults in `components/admin/puck/blocks.tsx` so a fresh canvas
 * renders without runtime errors.
 */

import type { Data as PuckData } from "@measured/puck"
import type { StandardPageKind } from "./standard-pages"

type Block = { type: string; props: Record<string, unknown> }

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function block(type: string, props: Record<string, unknown> = {}): Block {
  return { type, props: { id: uid(type.toLowerCase()), ...props } }
}

function tree(content: Block[], rootProps: Record<string, unknown> = {}): PuckData {
  return {
    content: content as unknown as PuckData["content"],
    root: { props: { title: "", ...rootProps } },
    zones: {},
  }
}

export function defaultPuckDataForKind(kind: StandardPageKind): PuckData {
  switch (kind) {
    case "home":
      return tree([
        block("Hero", {
          headline: "Where the world's most influential leaders meet.",
          subheadline: "Two days of unmissable keynotes, debates, and the kind of conversations that change companies.",
          ctaPrimaryLabel: "Register now",
          ctaPrimaryUrl: "#register",
          ctaSecondaryLabel: "View agenda",
          ctaSecondaryUrl: "#agenda",
          background: "gradient",
        }),
        block("Countdown", { title: "Doors open in", showLabels: true }),
        block("RichText", {
          markdown:
            "## About this event\n\nA carefully curated room of operators, founders and investors. " +
            "Every session is on-record, every conversation is off. We optimise for signal — short " +
            "talks, long lunches, and the rare permission to think out loud.",
        }),
        block("StatsRow", {
          stats: [
            { value: "500+", label: "Delegates" },
            { value: "60+",  label: "Speakers" },
            { value: "30+",  label: "Sessions" },
            { value: "20+",  label: "Sponsors" },
          ],
        }),
        block("SpeakersGrid", { columns: 3, limit: 9, linkToDetailPages: true }),
        block("Agenda", { groupByDay: true, limit: 6, mode: "compact" }),
        block("TicketsPricing", { columns: 3, layout: "card" }),
        block("SponsorsGrid", { groupByTier: true }),
        block("VenueMap", {}),
        block("Footer", {
          columns: 3,
          copyright: "© The Leadership Federation",
          showPoweredBy: true,
        }),
      ])

    case "agenda":
      return tree([
        block("Hero", {
          headline: "Agenda",
          subheadline: "Two days of curated programming. Times in IST.",
          background: "minimal",
        }),
        block("Agenda", { groupByDay: true, mode: "full" }),
        block("Footer", { columns: 3 }),
      ])

    case "speakers":
      return tree([
        block("Hero", {
          headline: "Speakers",
          subheadline: "The minds you came for.",
          background: "minimal",
        }),
        block("SpeakersGrid", { columns: 3, layout: "grid", linkToDetailPages: true }),
        block("Footer", { columns: 3 }),
      ])

    case "discussions":
      return tree([
        block("Hero", {
          headline: "Discussions",
          subheadline: "Pick a track and dive in.",
          background: "minimal",
        }),
        block("Tabs", {
          tabs: [
            { label: "Strategy",   content: "Operator-led conversations on growth, focus and resilience." },
            { label: "Capital",    content: "How money is moving in 2026 — and what it means for builders." },
            { label: "Technology", content: "Real-world AI deployments, infra trade-offs, and the talent question." },
          ],
        }),
        block("Footer", { columns: 3 }),
      ])

    case "tickets":
      return tree([
        block("Hero", {
          headline: "Tickets",
          subheadline: "Choose the experience that fits.",
          background: "minimal",
        }),
        block("TicketsPricing", { columns: 3, layout: "card" }),
        block("Faqs", {
          title: "Payment & cancellations",
          items: [
            { q: "What's included?", a: "Full access to keynotes, breakouts, networking lounges, lunch and tea service." },
            { q: "Can I get a refund?", a: "Yes — a full refund up to 14 days before the event. After that, transfers only." },
            { q: "Do you support invoicing?", a: "Yes. Choose 'Pay by invoice' at checkout and we'll email a 14-day invoice." },
          ],
        }),
        block("Footer", { columns: 3 }),
      ])

    case "networking":
      return tree([
        block("Hero", {
          headline: "Networking",
          subheadline: "The hallway is the conference.",
          background: "minimal",
        }),
        block("RichText", {
          markdown:
            "Curated meetups, an opt-in delegate directory, and the old-school equivalent " +
            "— a private speakers' lounge open to every paid delegate.",
        }),
        block("Footer", { columns: 3 }),
      ])

    case "sponsors":
      return tree([
        block("Hero", {
          headline: "Sponsors",
          subheadline: "Partners who make this possible.",
          background: "minimal",
        }),
        block("SponsorsGrid", { groupByTier: true }),
        block("Footer", { columns: 3 }),
      ])

    case "venue":
      return tree([
        block("Hero", {
          headline: "Venue",
          subheadline: "How to get there, where to stay.",
          background: "minimal",
        }),
        block("VenueMap", {}),
        block("RichText", {
          markdown:
            "## Getting here\n\nThe venue is a 25-minute drive from the international airport. " +
            "Recommended hotels within walking distance are listed below.",
        }),
        block("Gallery", {}),
        block("Footer", { columns: 3 }),
      ])

    case "exhibitors":
      return tree([
        block("Hero", {
          headline: "Exhibitors",
          subheadline: "Discover the brands shaping the year ahead.",
          background: "minimal",
        }),
        block("RichText", {
          markdown:
            "Booth visits, product demos, and a lounge open through the day. Pick up a map at registration.",
        }),
        block("Footer", { columns: 3 }),
      ])

    case "gallery":
      return tree([
        block("Hero", {
          headline: "Gallery",
          subheadline: "Captured moments.",
          background: "minimal",
        }),
        block("Gallery", {}),
        block("Footer", { columns: 3 }),
      ])

    case "register":
      return tree([
        block("Hero", {
          headline: "Register",
          subheadline: "Reserve your seat in under two minutes.",
          background: "minimal",
        }),
        block("Form", {
          formKey: "registration",
          fields: [
            { name: "name",    label: "Full name",   type: "text",  required: true },
            { name: "email",   label: "Email",       type: "email", required: true },
            { name: "company", label: "Company",     type: "text",  required: false },
            { name: "role",    label: "Job title",   type: "text",  required: false },
          ],
          submitLabel: "Register",
          successMessage: "Thanks — you'll get a confirmation by email.",
        }),
        block("Footer", { columns: 3 }),
      ])

    case "signin":
      return tree([
        block("Hero", {
          headline: "Sign in",
          subheadline: "Sign in to access your tickets, badge and event materials.",
          background: "minimal",
        }),
        block("CtaButton", {
          label: "Go to admin sign-in",
          url: "/admin/login",
          variant: "primary",
        }),
        block("Footer", { columns: 3 }),
      ])
  }
}
