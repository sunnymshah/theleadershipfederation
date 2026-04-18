"use client"

/**
 * ── Puck config for the event page builder ────────────────────────────
 *
 * Registers all 11 section components and exposes a typed Puck `Config`.
 * The same config is used by the admin editor (`<Puck>`) and the public
 * renderer (`<Render>`), so a component dropped by the admin renders
 * identically on the public page.
 *
 * Metadata flow:
 *   event, speakers, sessions, sponsors, tickets all come from the
 *   builder / public page via Puck's `metadata` — each component reads
 *   them via `getMeta(puck)`.
 */

import type { Config } from "@measured/puck"
import {
  Hero, RichText, StatsRow, SpeakersGrid, Agenda, TicketsCta,
  SponsorsGrid, Video, Gallery, CtaButton, Faqs,
  type HeroProps, type RichTextProps, type StatsRowProps,
  type SpeakersGridProps, type AgendaProps, type TicketsCtaProps,
  type SponsorsGridProps, type VideoProps, type GalleryProps,
  type CtaButtonProps, type FaqsProps,
} from "./blocks"
import { ImageField } from "./ImageField"

export type BuilderComponents = {
  Hero: HeroProps
  RichText: RichTextProps
  StatsRow: StatsRowProps
  SpeakersGrid: SpeakersGridProps
  Agenda: AgendaProps
  TicketsCta: TicketsCtaProps
  SponsorsGrid: SponsorsGridProps
  Video: VideoProps
  Gallery: GalleryProps
  CtaButton: CtaButtonProps
  Faqs: FaqsProps
}

export const puckConfig: Config<BuilderComponents> = {
  categories: {
    Headers: { title: "Headers", components: ["Hero"] },
    Story: { title: "Story", components: ["RichText", "StatsRow"] },
    Speakers: { title: "Speakers", components: ["SpeakersGrid"] },
    Program: { title: "Program", components: ["Agenda"] },
    Tickets: { title: "Tickets", components: ["TicketsCta"] },
    Sponsors: { title: "Sponsors", components: ["SponsorsGrid"] },
    Media: { title: "Media", components: ["Video", "Gallery"] },
    CTAs: { title: "Call-to-actions", components: ["CtaButton"] },
    FAQs: { title: "FAQs", components: ["Faqs"] },
  },

  components: {
    /* ── HERO ────────────────────────────────────────────────────── */
    Hero: {
      label: "Hero",
      defaultProps: {
        title: "",
        subtitle: "",
        ctaLabel: "Register Now",
        ctaUrl: "/tickets",
        backgroundImage: "",
      },
      fields: {
        title:    { type: "text",     label: "Title (leave blank to use event title)" },
        subtitle: { type: "textarea", label: "Subtitle" },
        ctaLabel: { type: "text",     label: "CTA label" },
        ctaUrl:   { type: "text",     label: "CTA URL" },
        backgroundImage: {
          type: "custom",
          label: "Background image",
          render: (p) => <ImageField {...p} folder="events" />,
        },
      },
      render: (p) => <Hero {...p} />,
    },

    /* ── RICH TEXT ───────────────────────────────────────────────── */
    RichText: {
      label: "Rich text",
      defaultProps: { title: "About this event", subtitle: "", body: "" },
      fields: {
        title:    { type: "text",     label: "Heading" },
        subtitle: { type: "text",     label: "Eyebrow (small caps)" },
        body:     { type: "textarea", label: "Body" },
      },
      render: (p) => <RichText {...p} />,
    },

    /* ── STATS ROW ───────────────────────────────────────────────── */
    StatsRow: {
      label: "Stats row",
      defaultProps: {
        title: "By the numbers",
        subtitle: "",
        stats: [
          { value: "500+", label: "Attendees" },
          { value: "30+",  label: "Speakers" },
          { value: "15+",  label: "Sessions" },
          { value: "10",   label: "Countries" },
        ],
      },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
        stats: {
          type: "array",
          label: "Stats",
          getItemSummary: (it) => `${it.value} ${it.label}`,
          defaultItemProps: { value: "100+", label: "Label" },
          arrayFields: {
            value: { type: "text", label: "Value" },
            label: { type: "text", label: "Label" },
          },
        },
      },
      render: (p) => <StatsRow {...p} />,
    },

    /* ── SPEAKERS GRID ───────────────────────────────────────────── */
    SpeakersGrid: {
      label: "Speakers grid",
      defaultProps: {
        title: "Speakers",
        subtitle: "",
        layout: "grid-4",
        frame: "circle",
        fit: "contain",
      },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
        layout: {
          type: "select",
          label: "Layout",
          options: [
            { label: "4-column grid", value: "grid-4" },
            { label: "3-column grid", value: "grid-3" },
            { label: "Single row",    value: "row" },
          ],
        },
        frame: {
          type: "select",
          label: "Frame",
          options: [
            { label: "Circle",  value: "circle" },
            { label: "Rounded", value: "rounded" },
            { label: "Square",  value: "square" },
          ],
        },
        fit: {
          type: "select",
          label: "Image fit",
          options: [
            { label: "Contain (whole face)", value: "contain" },
            { label: "Cover (crop to fill)", value: "cover" },
          ],
        },
      },
      render: (p) => <SpeakersGrid {...p} />,
    },

    /* ── AGENDA ──────────────────────────────────────────────────── */
    Agenda: {
      label: "Agenda",
      defaultProps: { title: "Agenda", subtitle: "" },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
      },
      render: (p) => <Agenda {...p} />,
    },

    /* ── TICKETS ─────────────────────────────────────────────────── */
    TicketsCta: {
      label: "Tickets",
      defaultProps: { title: "Tickets", subtitle: "", ctaLabel: "Buy Tickets" },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
        ctaLabel: { type: "text", label: "Button label" },
      },
      render: (p) => <TicketsCta {...p} />,
    },

    /* ── SPONSORS ────────────────────────────────────────────────── */
    SponsorsGrid: {
      label: "Sponsors grid",
      defaultProps: { title: "Our Partners" },
      fields: { title: { type: "text", label: "Heading" } },
      render: (p) => <SponsorsGrid {...p} />,
    },

    /* ── VIDEO ───────────────────────────────────────────────────── */
    Video: {
      label: "Video",
      defaultProps: { title: "", videoUrl: "" },
      fields: {
        title:    { type: "text", label: "Heading" },
        videoUrl: { type: "text", label: "YouTube URL" },
      },
      render: (p) => <Video {...p} />,
    },

    /* ── GALLERY ─────────────────────────────────────────────────── */
    Gallery: {
      label: "Gallery",
      defaultProps: {
        title: "Event Gallery",
        images: [],
      },
      fields: {
        title: { type: "text", label: "Heading" },
        images: {
          type: "array",
          label: "Images",
          getItemSummary: (_, idx) => `Image ${Number(idx ?? 0) + 1}`,
          defaultItemProps: { url: "" },
          arrayFields: {
            url: {
              type: "custom",
              label: "Image",
              render: (p) => <ImageField {...p} folder="sections" />,
            },
          },
        },
      },
      render: (p) => <Gallery {...p} />,
    },

    /* ── CTA BUTTON ──────────────────────────────────────────────── */
    CtaButton: {
      label: "CTA button",
      defaultProps: {
        title: "",
        subtitle: "",
        ctaLabel: "Register",
        ctaUrl: "/tickets",
      },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "textarea", label: "Subtitle" },
        ctaLabel: { type: "text", label: "Button label" },
        ctaUrl:   { type: "text", label: "Button URL" },
      },
      render: (p) => <CtaButton {...p} />,
    },

    /* ── FAQs ────────────────────────────────────────────────────── */
    Faqs: {
      label: "FAQs",
      defaultProps: {
        title: "Frequently Asked",
        faqs: [
          { q: "What's included in the ticket?", a: "Access to all sessions, lunch, and networking breaks." },
          { q: "Is the dress code formal?",      a: "Business casual is recommended." },
        ],
      },
      fields: {
        title: { type: "text", label: "Heading" },
        faqs: {
          type: "array",
          label: "Questions",
          getItemSummary: (it) => it.q || "New question",
          defaultItemProps: { q: "New question", a: "" },
          arrayFields: {
            q: { type: "text",     label: "Question" },
            a: { type: "textarea", label: "Answer" },
          },
        },
      },
      render: (p) => <Faqs {...p} />,
    },
  },

  root: {
    fields: {
      title: { type: "text", label: "Page title" },
    },
  },
}
