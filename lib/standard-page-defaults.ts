/**
 * Default Puck data tree for every standard page kind.
 * Returned when a page row's `settings.puckData` is empty (newly seeded
 * event, or after a "Reset to default" admin action).
 *
 * Block names + prop shapes mirror those registered in
 * `components/admin/puck/puck-config.tsx`. Keep them in sync — a missing
 * key falls back to the block's defaultProps; an unknown block kind
 * silently disappears at render time.
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

function tree(content: Block[]): PuckData {
  return {
    content: content as unknown as PuckData["content"],
    root: { props: { title: "" } },
    zones: {},
  }
}

const FOOTER_BLOCK = block("RichText", {
  title: "",
  subtitle: "",
  body:
    "© The Leadership Federation. " +
    "All rights reserved. For sponsorship and partnership enquiries, write to partnerships@leadershipfederation.com.",
})

export function defaultPuckDataForKind(kind: StandardPageKind): PuckData {
  switch (kind) {
    case "home":
      return tree([
        block("Hero", {
          title: "",
          subtitle:
            "Two days of unmissable keynotes, debates, and the kind of conversations that change companies.",
          ctaLabel: "Register Now",
          ctaUrl: "/tickets",
          secondaryCtaLabel: "View Agenda",
          secondaryCtaUrl: "#agenda",
          alignment: "left",
          minHeight: "tall",
        }),
        block("Countdown", {
          title: "Doors open in",
          subtitle: "",
          pastMessage: "We're live!",
        }),
        block("RichText", {
          title: "About this event",
          subtitle: "Why this room",
          body:
            "A carefully curated room of operators, founders and investors. " +
            "Every session is on-record, every conversation is off. We optimise for signal — short " +
            "talks, long lunches, and the rare permission to think out loud.",
        }),
        block("StatsRow", {
          title: "By the numbers",
          subtitle: "",
          animated: false,
          stats: [
            { value: "500+", label: "Delegates", icon: "" },
            { value: "60+",  label: "Speakers",  icon: "" },
            { value: "30+",  label: "Sessions",  icon: "" },
            { value: "20+",  label: "Sponsors",  icon: "" },
          ],
        }),
        block("SpeakersGrid", {
          title: "Featured Speakers",
          subtitle: "",
          gridLayout: "grid-3",
          frame: "circle",
          fit: "cover",
          linkToDetailPages: true,
        }),
        block("Agenda", {
          title: "Agenda",
          subtitle: "",
          groupByDay: true,
          showTracks: true,
          showDuration: false,
          showSpeakers: true,
          linkToDetailPages: true,
        }),
        block("TicketsPricing", { title: "Choose your ticket", subtitle: "", mostPopular: "" }),
        block("SponsorsGrid", { title: "Our Partners", groupByTier: true }),
        block("VenueMap", { title: "Venue", address: "", height: "md" }),
        FOOTER_BLOCK,
      ])

    case "agenda":
      return tree([
        block("Hero", { title: "Agenda", subtitle: "Two days of curated programming.", minHeight: "short" }),
        block("Agenda", {
          title: "",
          subtitle: "",
          groupByDay: true,
          showTracks: true,
          showDuration: true,
          showSpeakers: true,
          linkToDetailPages: true,
        }),
        FOOTER_BLOCK,
      ])

    case "speakers":
      return tree([
        block("Hero", { title: "Speakers", subtitle: "The minds you came for.", minHeight: "short" }),
        block("SpeakersGrid", {
          title: "",
          subtitle: "",
          gridLayout: "grid-3",
          frame: "circle",
          fit: "cover",
          linkToDetailPages: true,
        }),
        FOOTER_BLOCK,
      ])

    case "discussions":
      return tree([
        block("Hero", { title: "Discussions", subtitle: "Pick a track and dive in.", minHeight: "short" }),
        block("TabsBlock", {
          items: [
            { title: "Strategy",   body: "Operator-led conversations on growth, focus and resilience." },
            { title: "Capital",    body: "How money is moving in 2026 — and what it means for builders." },
            { title: "Technology", body: "Real-world AI deployments, infra trade-offs, and the talent question." },
          ],
        }),
        FOOTER_BLOCK,
      ])

    case "tickets":
      return tree([
        block("Hero", { title: "Tickets", subtitle: "Choose the experience that fits.", minHeight: "short" }),
        block("TicketsPricing", { title: "", subtitle: "", mostPopular: "" }),
        block("Faqs", {
          title: "Payment & cancellations",
          faqs: [
            { q: "What's included?", a: "Full access to keynotes, breakouts, networking lounges, lunch and tea service." },
            { q: "Can I get a refund?", a: "Yes — a full refund up to 14 days before the event. After that, transfers only." },
            { q: "Do you support invoicing?", a: "Yes. Choose 'Pay by invoice' at checkout and we'll email a 14-day invoice." },
          ],
        }),
        FOOTER_BLOCK,
      ])

    case "networking":
      return tree([
        block("Hero", { title: "Networking", subtitle: "The hallway is the conference.", minHeight: "short" }),
        block("RichText", {
          title: "Why we go deep on this",
          subtitle: "",
          body:
            "Curated meetups, an opt-in delegate directory, and the old-school equivalent " +
            "— a private speakers' lounge open to every paid delegate.",
        }),
        FOOTER_BLOCK,
      ])

    case "sponsors":
      return tree([
        block("Hero", { title: "Sponsors", subtitle: "Partners who make this possible.", minHeight: "short" }),
        block("SponsorsGrid", { title: "", groupByTier: true }),
        FOOTER_BLOCK,
      ])

    case "venue":
      return tree([
        block("Hero", { title: "Venue", subtitle: "How to get there, where to stay.", minHeight: "short" }),
        block("VenueMap", { title: "", address: "", height: "lg" }),
        block("RichText", {
          title: "Getting here",
          subtitle: "",
          body:
            "The venue is a 25-minute drive from the international airport. " +
            "Recommended hotels within walking distance are listed below.",
        }),
        block("Gallery", { title: "", images: [], columns: 4, lightbox: false }),
        FOOTER_BLOCK,
      ])

    case "exhibitors":
      return tree([
        block("Hero", { title: "Exhibitors", subtitle: "Discover the brands shaping the year ahead.", minHeight: "short" }),
        block("RichText", {
          title: "",
          subtitle: "",
          body:
            "Booth visits, product demos, and a lounge open through the day. Pick up a map at registration.",
        }),
        FOOTER_BLOCK,
      ])

    case "gallery":
      return tree([
        block("Hero", { title: "Gallery", subtitle: "Captured moments.", minHeight: "short" }),
        block("Gallery", { title: "", images: [], columns: 4, lightbox: true }),
        FOOTER_BLOCK,
      ])

    case "register":
      return tree([
        block("Hero", { title: "Register", subtitle: "Reserve your seat in under two minutes.", minHeight: "short" }),
        block("FormBlock", {
          title: "Your details",
          subtitle: "Tell us a little about yourself.",
          fields: [
            { id: "name",    label: "Full name", type: "text",  required: true },
            { id: "email",   label: "Email",     type: "email", required: true },
            { id: "company", label: "Company",   type: "text" },
            { id: "role",    label: "Job title", type: "text" },
          ],
          ctaLabel: "Register",
          successMessage: "Thanks — you'll get a confirmation by email.",
        }),
        FOOTER_BLOCK,
      ])

    case "signin":
      return tree([
        block("Hero", { title: "Sign in", subtitle: "Sign in to access your tickets, badge and event materials.", minHeight: "short" }),
        block("CtaButton", {
          title: "",
          subtitle: "",
          ctaLabel: "Go to admin sign-in",
          ctaUrl: "/admin/login",
          variant: "primary",
        }),
        FOOTER_BLOCK,
      ])
  }
}
