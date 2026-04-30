"use client"

/**
 * ── Puck config for the event page builder ────────────────────────────
 *
 * Registers every section component and exposes a typed Puck `Config`.
 * The same config is used by the admin editor (`<Puck>`) and the public
 * renderer (`<Render>`), so a component dropped by the admin renders
 * identically on the public page.
 *
 * Each block exposes:
 *   - Its own content fields (title/body/ctaLabel/etc.)
 *   - A shared `layout` object with padding, background colour/image,
 *     text colour, and alignment so ANY block can be themed per-instance.
 *
 * The `root` level adds a site-wide theme cascade: primary colour,
 * text colour, page background, and font family. These become CSS
 * custom properties that any child block can read.
 *
 * Metadata flow:
 *   event, speakers, sessions, sponsors, tickets all come from the
 *   builder / public page via Puck's `metadata` — each component reads
 *   them via `getMeta(puck)`.
 */

import type { Config, Field, FieldProps } from "@measured/puck"
import * as React from "react"
import type { ReactElement } from "react"
import {
  Root,
  Hero, RichText, StatsRow, SpeakersGrid, Agenda, TicketsCta,
  SponsorsGrid, Video, Gallery, CtaButton, Faqs,
  Spacer, Divider, ImageBlock, TwoColumn, Testimonial, LogosStrip, Newsletter,
  TextBox,
  Countdown, VenueMap, StickyCta, SocialBar,
  Carousel, TabsBlock, AccordionBlock, ImageHotspots, EventCardGrid,
  TicketsPricing,
  FormBlock,
  EmbedHtml, Footer, SpeakerBioCard, ScheduleSummary, CtaWithImage,
  MediaWithTextGroup, TestimonialsGroup, FloorPlan,
  ExhibitorsListing, ExhibitorCategoryBlock, HotelsListing,
  type RootProps,
  type HeroProps, type RichTextProps, type StatsRowProps,
  type SpeakersGridProps, type AgendaProps, type TicketsCtaProps,
  type SponsorsGridProps, type VideoProps, type GalleryProps,
  type CtaButtonProps, type FaqsProps,
  type SpacerProps, type DividerProps, type ImageBlockProps,
  type TwoColumnProps, type TestimonialProps, type LogosStripProps,
  type NewsletterProps,
  type TextBoxProps,
  type CountdownProps, type VenueMapProps, type StickyCtaProps, type SocialBarProps,
  type CarouselProps, type TabsBlockProps, type AccordionBlockProps,
  type ImageHotspotsProps, type EventCardGridProps,
  type TicketsPricingProps,
  type FormBlockProps,
  type EmbedHtmlProps, type FooterProps, type SpeakerBioCardProps,
  type ScheduleSummaryProps, type CtaWithImageProps,
  type MediaWithTextGroupProps, type TestimonialsGroupProps,
  type FloorPlanProps, type ExhibitorsListingProps,
  type ExhibitorCategoryProps, type HotelsListingProps,
  type LayoutProps,
} from "./blocks"
import { ImageField } from "./ImageField"
import { UrlPicker } from "./UrlPicker"
import { ThemePresetGrid } from "./ThemePresetGrid"
import { makeSparklesField } from "./SparklesField"

export type BuilderComponents = {
  Hero: HeroProps
  RichText: RichTextProps
  TextBox: TextBoxProps
  StatsRow: StatsRowProps
  SpeakersGrid: SpeakersGridProps
  Agenda: AgendaProps
  TicketsCta: TicketsCtaProps
  SponsorsGrid: SponsorsGridProps
  Video: VideoProps
  Gallery: GalleryProps
  CtaButton: CtaButtonProps
  Faqs: FaqsProps
  Spacer: SpacerProps
  Divider: DividerProps
  ImageBlock: ImageBlockProps
  TwoColumn: TwoColumnProps
  Testimonial: TestimonialProps
  LogosStrip: LogosStripProps
  Newsletter: NewsletterProps
  Countdown: CountdownProps
  VenueMap: VenueMapProps
  StickyCta: StickyCtaProps
  SocialBar: SocialBarProps
  Carousel: CarouselProps
  TabsBlock: TabsBlockProps
  AccordionBlock: AccordionBlockProps
  ImageHotspots: ImageHotspotsProps
  EventCardGrid: EventCardGridProps
  TicketsPricing: TicketsPricingProps
  FormBlock: FormBlockProps
  EmbedHtml: EmbedHtmlProps
  Footer: FooterProps
  SpeakerBioCard: SpeakerBioCardProps
  ScheduleSummary: ScheduleSummaryProps
  CtaWithImage: CtaWithImageProps
  MediaWithTextGroup: MediaWithTextGroupProps
  TestimonialsGroup: TestimonialsGroupProps
  FloorPlan: FloorPlanProps
  ExhibitorsListing: ExhibitorsListingProps
  ExhibitorCategoryBlock: ExhibitorCategoryProps
  HotelsListing: HotelsListingProps
}

/* ── Shared layout field ─────────────────────────────────────────────
 * Applied to every block so it can override its default background,
 * padding, and alignment. Dropping the same object into every block's
 * `fields.layout` keeps the inspector consistent.                     */
const layoutField = {
  type: "object",
  label: "Section settings",
  objectFields: {
    paddingY: {
      type: "select",
      label: "Vertical padding",
      options: [
        { label: "None",   value: "none" },
        { label: "Small",  value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large (default)", value: "lg" },
        { label: "X-Large", value: "xl" },
      ],
    },
    backgroundColor: { type: "text", label: "Background colour (hex, e.g. #F4F8FF)" },
    backgroundImage: {
      type: "custom",
      label: "Background image",
      render: (p: FieldProps): ReactElement => (
        <ImageField
          field={p.field as { label?: string }}
          value={(p.value as string) ?? ""}
          onChange={p.onChange as (v: string) => void}
          folder="sections"
        />
      ),
    },
    backgroundOverlay: { type: "number", label: "Background overlay opacity (0–100)", min: 0, max: 100 },
    overlayColor: { type: "text", label: "Overlay colour (hex; blank = black)" },
    textColor: { type: "text", label: "Text colour (hex)" },
    textAlign: {
      type: "select",
      label: "Text alignment",
      options: [
        { label: "Left",   value: "left" },
        { label: "Center", value: "center" },
        { label: "Right",  value: "right" },
      ],
    },
    anchor: { type: "text", label: "Anchor (advanced — renders as id=, used for #links)" },
    cssClass: { type: "text", label: "CSS class (advanced — appended to wrapper)" },
    locked: {
      type: "radio",
      label: "Locked (read-only on public site)",
      options: [
        { label: "No",  value: false },
        { label: "Yes", value: true },
      ],
    },
  },
} as unknown as Field<LayoutProps | undefined>

const defaultLayout: LayoutProps = { paddingY: "lg", backgroundColor: "", backgroundImage: "", textAlign: "left" }

export const puckConfig: Config<BuilderComponents> = {
  categories: {
    Headers:  { title: "Headers",         components: ["Hero", "Countdown", "Carousel"] },
    Story:    { title: "Story",           components: ["RichText", "TextBox", "StatsRow", "TwoColumn", "Testimonial", "TestimonialsGroup", "MediaWithTextGroup", "TabsBlock", "AccordionBlock"] },
    Discovery:{ title: "Discovery",       components: ["EventCardGrid"] },
    Speakers: { title: "Speakers",        components: ["SpeakersGrid", "SpeakerBioCard"] },
    Program:  { title: "Program",         components: ["Agenda", "ScheduleSummary"] },
    Tickets:  { title: "Tickets",         components: ["TicketsCta", "TicketsPricing"] },
    Sponsors: { title: "Sponsors",        components: ["SponsorsGrid", "LogosStrip", "ExhibitorsListing", "ExhibitorCategoryBlock"] },
    Media:    { title: "Media",           components: ["Video", "Gallery", "ImageBlock", "ImageHotspots"] },
    Venue:    { title: "Venue",           components: ["VenueMap", "FloorPlan", "HotelsListing"] },
    CTAs:     { title: "Call-to-actions", components: ["CtaButton", "CtaWithImage", "FormBlock", "Newsletter", "StickyCta", "SocialBar"] },
    FAQs:     { title: "FAQs",            components: ["Faqs"] },
    Layout:   { title: "Layout",          components: ["Spacer", "Divider", "Footer"] },
    Advanced: { title: "Advanced",        components: ["EmbedHtml"] },
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
        secondaryCtaLabel: "",
        secondaryCtaUrl: "",
        backgroundImage: "",
        alignment: "left",
        minHeight: "tall",
        useEventLogo: false,
        // ITEM 1
        slides: [],
        sliderControls: {
          arrowsVisible: true,
          arrowColor: "#ffffff",
          arrowSize: "md",
          navigatorVisible: true,
          navigatorStyle: "dots",
          autoplay: true,
          intervalSec: 6,
          transition: "slide",
        },
        // ITEM 2
        showEventName: true,
        showDateTime: true,
        showLocation: true,
        showCountdown: false,
        showSocialHandles: false,
        showButtons: true,
      },
      fields: {
        title:    makeSparklesField({ label: "Title (leave blank to use event title)", hint: "title" }) as unknown as Field<string>,
        subtitle: makeSparklesField({ label: "Subtitle", type: "textarea", hint: "subtitle", rows: 3 }) as unknown as Field<string>,
        useEventLogo: {
          type: "radio",
          label: "Show event logo above title",
          options: [
            { label: "No",  value: false as unknown as string },
            { label: "Yes", value: true  as unknown as string },
          ],
        },
        ctaLabel: { type: "text",     label: "CTA label" },
        ctaUrl: {
          type: "custom",
          label: "CTA link",
          render: (p) => (
            <UrlPicker
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
            />
          ),
        },
        secondaryCtaLabel: { type: "text", label: "Secondary CTA label (optional)" },
        secondaryCtaUrl: {
          type: "custom",
          label: "Secondary CTA link",
          render: (p) => (
            <UrlPicker
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
            />
          ),
        },
        backgroundImage: {
          type: "custom",
          label: "Background image",
          render: (p) => <ImageField {...p} folder="events" />,
        },
        alignment: {
          type: "radio",
          label: "Alignment",
          options: [
            { label: "Left",   value: "left" },
            { label: "Center", value: "center" },
          ],
        },
        minHeight: {
          type: "select",
          label: "Height",
          options: [
            { label: "Short",          value: "short" },
            { label: "Tall (default)", value: "tall" },
            { label: "Full viewport",  value: "full" },
          ],
        },
        // ── ITEM 1 — slider config ────────────────────────────────
        slides: {
          type: "array",
          label: "Slides (leave empty for single hero)",
          arrayFields: {
            id:               { type: "text",   label: "Internal id (auto)" },
            title:            { type: "text",   label: "Slide title" },
            subtitle:         { type: "textarea", label: "Slide subtitle" },
            ctaPrimaryLabel:  { type: "text",   label: "Primary CTA label" },
            ctaPrimaryUrl: {
              type: "custom",
              label: "Primary CTA link",
              render: (p) => (
                <UrlPicker
                  field={p.field as { label?: string }}
                  value={(p.value as string) ?? ""}
                  onChange={p.onChange as (v: string) => void}
                />
              ),
            },
            ctaSecondaryLabel: { type: "text", label: "Secondary CTA label" },
            ctaSecondaryUrl: {
              type: "custom",
              label: "Secondary CTA link",
              render: (p) => (
                <UrlPicker
                  field={p.field as { label?: string }}
                  value={(p.value as string) ?? ""}
                  onChange={p.onChange as (v: string) => void}
                />
              ),
            },
            backgroundImage: {
              type: "custom",
              label: "Slide background image",
              render: (p) => <ImageField {...p} folder="events" />,
            },
            alignment: {
              type: "radio",
              label: "Alignment",
              options: [
                { label: "Left",   value: "left" },
                { label: "Center", value: "center" },
              ],
            },
            useEventLogo: {
              type: "radio",
              label: "Show event logo",
              options: [
                { label: "No",  value: false as unknown as string },
                { label: "Yes", value: true  as unknown as string },
              ],
            },
          },
          getItemSummary: (item: unknown) =>
            (item as { title?: string })?.title || "Slide",
          defaultItemProps: {
            id: "",
            title: "",
            subtitle: "",
            ctaPrimaryLabel: "Register Now",
            ctaPrimaryUrl: "/tickets",
            ctaSecondaryLabel: "",
            ctaSecondaryUrl: "",
            backgroundImage: "",
            alignment: "left",
            useEventLogo: false,
          },
        },
        sliderControls: {
          type: "object",
          label: "Slider controls (only used when slides ≥ 1)",
          objectFields: {
            arrowsVisible: {
              type: "radio", label: "Show arrows",
              options: [{ label: "Yes", value: true }, { label: "No", value: false }],
            },
            arrowColor:  { type: "text", label: "Arrow color (hex)" },
            arrowSize: {
              type: "select", label: "Arrow size",
              options: [
                { label: "Small",  value: "sm" },
                { label: "Medium", value: "md" },
                { label: "Large",  value: "lg" },
              ],
            },
            navigatorVisible: {
              type: "radio", label: "Show navigator",
              options: [{ label: "Yes", value: true }, { label: "No", value: false }],
            },
            navigatorStyle: {
              type: "select", label: "Navigator style",
              options: [
                { label: "Dots",    value: "dots" },
                { label: "Bars",    value: "bars" },
                { label: "Numbers", value: "numbers" },
              ],
            },
            autoplay: {
              type: "radio", label: "Auto-play",
              options: [{ label: "Yes", value: true }, { label: "No", value: false }],
            },
            intervalSec: { type: "number", label: "Interval (seconds)", min: 2, max: 30 },
            transition: {
              type: "select", label: "Transition",
              options: [
                { label: "Slide", value: "slide" },
                { label: "Fade",  value: "fade"  },
              ],
            },
          },
        },
        // ── ITEM 2 — visibility toggles ───────────────────────────
        showEventName: {
          type: "radio", label: "Show event name",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        showDateTime: {
          type: "radio", label: "Show date / time",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        showLocation: {
          type: "radio", label: "Show location",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        showCountdown: {
          type: "radio", label: "Show inline countdown",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        showSocialHandles: {
          type: "radio", label: "Show social handles",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        showButtons: {
          type: "radio", label: "Show CTA buttons",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
      },
      render: (p) => <Hero {...p} />,
    },

    /* ── RICH TEXT ───────────────────────────────────────────────── */
    RichText: {
      label: "Rich text",
      defaultProps: { title: "About this event", subtitle: "", body: "", layout: defaultLayout },
      fields: {
        title:    makeSparklesField({ label: "Heading", hint: "title" }) as unknown as Field<string>,
        subtitle: { type: "text",     label: "Eyebrow (small caps)" },
        body:     makeSparklesField({ label: "Body", type: "textarea", hint: "body", rows: 6 }) as unknown as Field<string>,
        layout:   layoutField,
      },
      render: (p) => <RichText {...p} />,
    },

    /* ── TEXT BOX ────────────────────────────────────────────────── *
     * Resizable/styleable text box — direct knobs for size, weight,
     * font, colour, background, padding, width, alignment, rounded
     * corners, and border. Use when RichText is too opinionated.     */
    TextBox: {
      label: "Text box",
      defaultProps: {
        content: "Type anything here.",
        fontSize: "base",
        fontWeight: "normal",
        fontFamily: "inherit",
        italic: false,
        underline: false,
        textColor: "",
        backgroundColor: "",
        paddingY: "md",
        paddingX: "md",
        width: "wide",
        alignment: "left",
        rounded: "md",
        border: false,
        layout: defaultLayout,
      },
      fields: {
        content: { type: "textarea", label: "Content" },
        fontSize: {
          type: "select",
          label: "Font size",
          options: [
            { label: "S (14)",   value: "sm" },
            { label: "M (16)",   value: "base" },
            { label: "L (18)",   value: "lg" },
            { label: "XL (20)",  value: "xl" },
            { label: "2XL (24)", value: "2xl" },
            { label: "3XL (30)", value: "3xl" },
            { label: "4XL (36)", value: "4xl" },
            { label: "5XL (48)", value: "5xl" },
            { label: "6XL (60)", value: "6xl" },
          ],
        },
        fontWeight: {
          type: "select",
          label: "Weight",
          options: [
            { label: "Light",      value: "light" },
            { label: "Normal",     value: "normal" },
            { label: "Medium",     value: "medium" },
            { label: "Semibold",   value: "semibold" },
            { label: "Bold",       value: "bold" },
            { label: "Extra-bold", value: "extrabold" },
          ],
        },
        fontFamily: {
          type: "select",
          label: "Font family",
          options: [
            { label: "Inherit (page theme)", value: "inherit" },
            { label: "SF Pro / System",       value: "sf" },
            { label: "Inter",                 value: "inter" },
            { label: "Serif (Playfair)",      value: "serif" },
            { label: "Mono (JetBrains)",      value: "mono" },
          ],
        },
        italic: {
          type: "radio",
          label: "Italic",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        underline: {
          type: "radio",
          label: "Underline",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        textColor:       { type: "text", label: "Text colour (hex, blank = inherit)" },
        backgroundColor: { type: "text", label: "Box background colour (hex, blank = transparent)" },
        paddingY: {
          type: "select",
          label: "Vertical padding (inner)",
          options: [
            { label: "None",  value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
        paddingX: {
          type: "select",
          label: "Horizontal padding (inner)",
          options: [
            { label: "None",  value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
        width: {
          type: "select",
          label: "Max width",
          options: [
            { label: "Narrow", value: "narrow" },
            { label: "Wide",   value: "wide" },
            { label: "Full",   value: "full" },
          ],
        },
        alignment: {
          type: "radio",
          label: "Alignment",
          options: [
            { label: "Left",   value: "left" },
            { label: "Center", value: "center" },
            { label: "Right",  value: "right" },
          ],
        },
        rounded: {
          type: "select",
          label: "Corner radius",
          options: [
            { label: "None",    value: "none" },
            { label: "Small",   value: "sm" },
            { label: "Medium",  value: "md" },
            { label: "Large",   value: "lg" },
            { label: "Pill",    value: "full" },
          ],
        },
        border: {
          type: "radio",
          label: "Border",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        layout: layoutField,
      },
      render: (p) => <TextBox {...p} />,
    },

    /* ── STATS ROW ───────────────────────────────────────────────── */
    StatsRow: {
      label: "Stats row",
      defaultProps: {
        title: "By the numbers",
        subtitle: "",
        animated: false,
        stats: [
          { value: "500+", label: "Attendees", icon: "" },
          { value: "30+",  label: "Speakers",  icon: "" },
          { value: "15+",  label: "Sessions",  icon: "" },
          { value: "10",   label: "Countries", icon: "" },
        ],
        layout: defaultLayout,
      },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
        animated: {
          type: "radio",
          label: "Animate count-up on scroll",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        stats: {
          type: "array",
          label: "Stats",
          getItemSummary: (it) => `${it.value} ${it.label}`,
          defaultItemProps: { value: "100+", label: "Label", icon: "" },
          arrayFields: {
            value: { type: "text", label: "Value (e.g. 500+, 1.2k, 10)" },
            label: { type: "text", label: "Label" },
            icon:  { type: "text", label: "Lucide icon name (optional, e.g. Users)" },
          },
        },
        layout: layoutField,
      },
      render: (p) => <StatsRow {...p} />,
    },

    /* ── SPEAKERS GRID ───────────────────────────────────────────── */
    SpeakersGrid: {
      label: "Speakers grid",
      defaultProps: {
        title: "Speakers",
        subtitle: "",
        gridLayout: "grid-4",
        frame: "circle",
        fit: "contain",
        linkToDetailPages: false,
        layout: defaultLayout,
      },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
        gridLayout: {
          type: "select",
          label: "Grid layout",
          options: [
            { label: "4-column grid", value: "grid-4" },
            { label: "3-column grid", value: "grid-3" },
            { label: "Auto-flow",     value: "row" },
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
        linkToDetailPages: {
          type: "radio",
          label: "Link to speaker detail pages",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        layout: layoutField,
      },
      render: (p) => <SpeakersGrid {...p} />,
    },

    /* ── AGENDA ──────────────────────────────────────────────────── */
    Agenda: {
      label: "Agenda",
      defaultProps: {
        title: "Agenda",
        subtitle: "",
        groupByDay: false,
        showTracks: false,
        showDuration: false,
        showSpeakers: true,
        linkToDetailPages: false,
        layout: defaultLayout,
      },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
        groupByDay: {
          type: "radio",
          label: "Day tabs",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        showTracks: {
          type: "radio",
          label: "Track filter chips",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        showDuration: {
          type: "radio",
          label: "Show duration",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        showSpeakers: {
          type: "radio",
          label: "Show speakers",
          options: [
            { label: "On",  value: true },
            { label: "Off", value: false },
          ],
        },
        linkToDetailPages: {
          type: "radio",
          label: "Link sessions to detail pages",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        layout:   layoutField,
      },
      render: (p) => <Agenda {...p} />,
    },

    /* ── TICKETS ─────────────────────────────────────────────────── */
    TicketsCta: {
      label: "Tickets",
      defaultProps: { title: "Tickets", subtitle: "", ctaLabel: "Buy Tickets", layout: defaultLayout },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
        ctaLabel: { type: "text", label: "Button label" },
        layout:   layoutField,
      },
      render: (p) => <TicketsCta {...p} />,
    },

    /* ── SPONSORS ────────────────────────────────────────────────── */
    SponsorsGrid: {
      label: "Sponsors grid",
      defaultProps: { title: "Our Partners", groupByTier: false, layout: defaultLayout },
      fields: {
        title:  { type: "text", label: "Heading" },
        groupByTier: {
          type: "radio",
          label: "Group by tier",
          options: [
            { label: "No (single grid)", value: false },
            { label: "Yes (tier rows)",  value: true },
          ],
        },
        layout: layoutField,
      },
      render: (p) => <SponsorsGrid {...p} />,
    },

    /* ── VIDEO ───────────────────────────────────────────────────── */
    Video: {
      label: "Video",
      defaultProps: { title: "", videoUrl: "", layout: defaultLayout },
      fields: {
        title:    { type: "text", label: "Heading" },
        videoUrl: {
          type: "text",
          label: "Video URL (YouTube, Vimeo, Loom, or .mp4/.webm)",
        },
        layout:   layoutField,
      },
      render: (p) => <Video {...p} />,
    },

    /* ── GALLERY ─────────────────────────────────────────────────── */
    Gallery: {
      label: "Gallery",
      defaultProps: {
        title: "Event Gallery",
        images: [],
        columns: 4,
        lightbox: false,
        layout: defaultLayout,
      },
      fields: {
        title: { type: "text", label: "Heading" },
        columns: {
          type: "radio",
          label: "Columns",
          options: [
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
          ],
        },
        lightbox: {
          type: "radio",
          label: "Lightbox on click",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        images: {
          type: "array",
          label: "Images",
          getItemSummary: (it, idx) => (it?.caption || it?.alt || `Image ${Number(idx ?? 0) + 1}`),
          defaultItemProps: { url: "", alt: "", caption: "" },
          arrayFields: {
            url: {
              type: "custom",
              label: "Image",
              render: (p) => <ImageField {...p} folder="sections" />,
            },
            alt: { type: "text", label: "Alt text (recommended)" },
            caption: { type: "text", label: "Caption (optional)" },
          },
        },
        layout: layoutField,
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
        variant: "primary",
        layout: defaultLayout,
      },
      fields: {
        title:    { type: "text",     label: "Heading" },
        subtitle: { type: "textarea", label: "Subtitle" },
        ctaLabel: { type: "text",     label: "Button label" },
        ctaUrl: {
          type: "custom",
          label: "Button link",
          render: (p) => (
            <UrlPicker
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
            />
          ),
        },
        variant: {
          type: "select",
          label: "Button style",
          options: [
            { label: "Primary (gold)",   value: "primary" },
            { label: "Secondary (navy)", value: "secondary" },
            { label: "Outline",          value: "outline" },
          ],
        },
        layout: layoutField,
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
        layout: defaultLayout,
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
        layout: layoutField,
      },
      render: (p) => <Faqs {...p} />,
    },

    /* ── SPACER ──────────────────────────────────────────────────── */
    Spacer: {
      label: "Spacer",
      defaultProps: { size: "md" },
      fields: {
        size: {
          type: "select",
          label: "Height",
          options: [
            { label: "X-small", value: "xs" },
            { label: "Small",   value: "sm" },
            { label: "Medium",  value: "md" },
            { label: "Large",   value: "lg" },
            { label: "X-large", value: "xl" },
          ],
        },
      },
      render: (p) => <Spacer {...p} />,
    },

    /* ── DIVIDER ─────────────────────────────────────────────────── */
    Divider: {
      label: "Divider",
      defaultProps: { style: "line", color: "", layout: { paddingY: "sm" } },
      fields: {
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Line",     value: "line" },
            { label: "Dots",     value: "dots" },
            { label: "Gradient", value: "gradient" },
          ],
        },
        color: { type: "text", label: "Colour (hex, blank = default)" },
        layout: layoutField,
      },
      render: (p) => <Divider {...p} />,
    },

    /* ── IMAGE BLOCK ─────────────────────────────────────────────── */
    ImageBlock: {
      label: "Image",
      defaultProps: {
        imageUrl: "",
        alt: "",
        caption: "",
        width: "wide",
        rounded: true,
        layout: defaultLayout,
      },
      fields: {
        imageUrl: {
          type: "custom",
          label: "Image",
          render: (p) => <ImageField {...p} folder="sections" />,
        },
        alt: {
          type: "text",
          label: "Alt text (REQUIRED — describe the image for screen readers)",
        },
        caption: { type: "text", label: "Caption (optional)" },
        width: {
          type: "select",
          label: "Width",
          options: [
            { label: "Narrow", value: "narrow" },
            { label: "Wide",   value: "wide" },
            { label: "Full",   value: "full" },
          ],
        },
        rounded: {
          type: "radio",
          label: "Rounded corners",
          options: [
            { label: "Yes", value: true },
            { label: "No",  value: false },
          ],
        },
        layout: layoutField,
      },
      render: (p) => <ImageBlock {...p} />,
    },

    /* ── TWO COLUMN ──────────────────────────────────────────────── */
    TwoColumn: {
      label: "Two-column",
      defaultProps: {
        leftTitle: "Tell your story",
        leftBody: "Add a few paragraphs of copy on one side and a hero image on the other.",
        rightImage: "",
        imageSide: "right",
        layout: defaultLayout,
      },
      fields: {
        leftTitle: { type: "text", label: "Heading" },
        leftBody:  { type: "textarea", label: "Body" },
        rightImage: {
          type: "custom",
          label: "Image",
          render: (p) => <ImageField {...p} folder="sections" />,
        },
        imageSide: {
          type: "radio",
          label: "Image position",
          options: [
            { label: "Left",  value: "left" },
            { label: "Right", value: "right" },
          ],
        },
        layout: layoutField,
      },
      render: (p) => <TwoColumn {...p} />,
    },

    /* ── TESTIMONIAL ─────────────────────────────────────────────── */
    Testimonial: {
      label: "Testimonial",
      defaultProps: {
        quote: "An exceptional experience — worth every minute.",
        attribution: "Jane Doe",
        role: "CEO, Acme",
        avatar: "",
        avatarAlt: "",
        layout: defaultLayout,
      },
      fields: {
        quote:       { type: "textarea", label: "Quote" },
        attribution: { type: "text",     label: "Attribution (name)" },
        role:        { type: "text",     label: "Role / company" },
        avatar: {
          type: "custom",
          label: "Avatar",
          render: (p) => <ImageField {...p} folder="speakers" />,
        },
        avatarAlt: {
          type: "text",
          label: "Avatar alt text (REQUIRED when avatar set — defaults to attribution)",
        },
        layout: layoutField,
      },
      render: (p) => <Testimonial {...p} />,
    },

    /* ── LOGOS STRIP ─────────────────────────────────────────────── */
    LogosStrip: {
      label: "Logos strip",
      defaultProps: {
        title: "Trusted by",
        logos: [],
        layout: { paddingY: "md" },
      },
      fields: {
        title: { type: "text", label: "Eyebrow" },
        logos: {
          type: "array",
          label: "Logos",
          getItemSummary: (it) => it.alt || "Logo",
          defaultItemProps: { url: "", alt: "" },
          arrayFields: {
            url: {
              type: "custom",
              label: "Logo",
              render: (p) => <ImageField {...p} folder="sponsors" />,
            },
            alt: { type: "text", label: "Brand name (REQUIRED — used as alt text)" },
          },
        },
        layout: layoutField,
      },
      render: (p) => <LogosStrip {...p} />,
    },

    /* ── FORM (B23) ──────────────────────────────────────────────── */
    FormBlock: {
      label: "Form",
      defaultProps: {
        title: "Get in touch",
        subtitle: "",
        ctaLabel: "Submit",
        successMessage: "Thanks — we got your submission.",
        webhookUrl: "",
        fields: [
          { id: "name",  label: "Your name", type: "text",  required: true },
          { id: "email", label: "Email",     type: "email", required: true },
        ],
        layout: defaultLayout,
      },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "textarea", label: "Subtitle" },
        ctaLabel: { type: "text", label: "Submit button label" },
        successMessage: { type: "textarea", label: "Success message" },
        webhookUrl: { type: "text", label: "Optional webhook URL (POST on submit)" },
        fields: {
          type: "array",
          label: "Form fields",
          getItemSummary: (it) => `${it?.label || "Field"}${it?.required ? " *" : ""}`,
          defaultItemProps: { id: "field", label: "Field", type: "text", required: false, options: [] },
          arrayFields: {
            id:    { type: "text", label: "ID (no spaces)" },
            label: { type: "text", label: "Label" },
            type: {
              type: "select",
              label: "Type",
              options: [
                { label: "Text",      value: "text" },
                { label: "Email",     value: "email" },
                { label: "Phone",     value: "tel" },
                { label: "Textarea",  value: "textarea" },
                { label: "Select",    value: "select" },
                { label: "Checkbox",  value: "checkbox" },
              ],
            },
            required: {
              type: "radio",
              label: "Required",
              options: [
                { label: "No",  value: false },
                { label: "Yes", value: true },
              ],
            },
            options: {
              type: "textarea",
              label: "Select options (one per line)",
            },
          },
        },
        layout: layoutField,
      },
      render: (p) => {
        const raw = (p as { fields?: unknown }).fields
        const fields: FormBlockProps["fields"] = Array.isArray(raw)
          ? (raw as Array<Record<string, unknown>>).map((f) => {
              const opts = (f.options ?? []) as unknown
              const optionList = typeof opts === "string"
                ? opts.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
                : Array.isArray(opts) ? opts.map((o) => String(o)) : undefined
              return {
                id: typeof f.id === "string" ? f.id : "",
                label: typeof f.label === "string" ? f.label : "",
                type: (typeof f.type === "string" ? f.type : "text") as FormBlockProps["fields"][number]["type"],
                required: Boolean(f.required),
                options: optionList,
              }
            })
          : []
        return <FormBlock {...p} fields={fields} />
      },
    },

    /* ── TICKETS PRICING (B16) ───────────────────────────────────── */
    TicketsPricing: {
      label: "Pricing cards",
      defaultProps: { title: "Choose your ticket", subtitle: "", mostPopular: "", layout: defaultLayout },
      fields: {
        title: { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle" },
        mostPopular: { type: "text", label: "Ticket UUID to mark Most Popular (optional)" },
        layout: layoutField,
      },
      render: (p) => <TicketsPricing {...p} />,
    },

    /* ── CAROUSEL (B20) ──────────────────────────────────────────── */
    Carousel: {
      label: "Carousel",
      defaultProps: {
        slides: [
          { image: "", heading: "", body: "", ctaLabel: "", ctaUrl: "" },
          { image: "", heading: "", body: "", ctaLabel: "", ctaUrl: "" },
        ],
        autoplay: false,
        interval: 5,
        layout: defaultLayout,
      },
      fields: {
        autoplay: {
          type: "radio",
          label: "Autoplay",
          options: [
            { label: "Off", value: false },
            { label: "On",  value: true },
          ],
        },
        interval: { type: "number", label: "Autoplay interval (seconds)", min: 2, max: 30 },
        slides: {
          type: "array",
          label: "Slides",
          getItemSummary: (it, idx) => it?.heading || `Slide ${Number(idx ?? 0) + 1}`,
          defaultItemProps: { image: "", heading: "", body: "", ctaLabel: "", ctaUrl: "" },
          arrayFields: {
            image: {
              type: "custom",
              label: "Image",
              render: (p) => <ImageField {...p} folder="sections" />,
            },
            heading: { type: "text", label: "Heading" },
            body:    { type: "textarea", label: "Body" },
            ctaLabel: { type: "text", label: "CTA label" },
            ctaUrl: {
              type: "custom",
              label: "CTA link",
              render: (p) => (
                <UrlPicker
                  field={p.field as { label?: string }}
                  value={(p.value as string) ?? ""}
                  onChange={p.onChange as (v: string) => void}
                />
              ),
            },
          },
        },
        layout: layoutField,
      },
      render: (p) => <Carousel {...p} />,
    },

    /* ── TABS (B21a) ─────────────────────────────────────────────── */
    TabsBlock: {
      label: "Tabs",
      defaultProps: {
        items: [
          { title: "Overview",  body: "Tell us about the event." },
          { title: "Schedule",  body: "Day-by-day breakdown." },
        ],
        layout: defaultLayout,
      },
      fields: {
        items: {
          type: "array",
          label: "Tabs",
          getItemSummary: (it, idx) => it?.title || `Tab ${Number(idx ?? 0) + 1}`,
          defaultItemProps: { title: "Tab", body: "" },
          arrayFields: {
            title: { type: "text",     label: "Title" },
            body:  { type: "textarea", label: "Body (Markdown)" },
          },
        },
        layout: layoutField,
      },
      render: (p) => <TabsBlock {...p} />,
    },

    /* ── ACCORDION (B21b) ────────────────────────────────────────── */
    AccordionBlock: {
      label: "Accordion",
      defaultProps: {
        items: [
          { title: "What's included?", body: "Lunch, coffee, and an evening reception." },
          { title: "Refund policy",     body: "Tickets are non-refundable but transferable up to 7 days before the event." },
        ],
        layout: defaultLayout,
      },
      fields: {
        items: {
          type: "array",
          label: "Rows",
          getItemSummary: (it, idx) => it?.title || `Row ${Number(idx ?? 0) + 1}`,
          defaultItemProps: { title: "Untitled", body: "" },
          arrayFields: {
            title: { type: "text",     label: "Title" },
            body:  { type: "textarea", label: "Body (Markdown)" },
          },
        },
        layout: layoutField,
      },
      render: (p) => <AccordionBlock {...p} />,
    },

    /* ── IMAGE HOTSPOTS (B26) ────────────────────────────────────── */
    ImageHotspots: {
      label: "Image hotspots",
      defaultProps: {
        image: "",
        alt: "",
        hotspots: [
          { x: 25, y: 50, label: "Hotspot 1", description: "" },
          { x: 75, y: 50, label: "Hotspot 2", description: "" },
        ],
        layout: defaultLayout,
      },
      fields: {
        image: {
          type: "custom",
          label: "Image",
          render: (p) => <ImageField {...p} folder="sections" />,
        },
        alt: { type: "text", label: "Alt text (recommended)" },
        hotspots: {
          type: "array",
          label: "Hotspots",
          getItemSummary: (it, idx) => it?.label || `Hotspot ${Number(idx ?? 0) + 1}`,
          defaultItemProps: { x: 50, y: 50, label: "New hotspot", description: "" },
          arrayFields: {
            x: { type: "number", label: "X (% from left, 0-100)",  min: 0, max: 100 },
            y: { type: "number", label: "Y (% from top, 0-100)",   min: 0, max: 100 },
            label:       { type: "text",     label: "Label" },
            description: { type: "textarea", label: "Description (optional)" },
          },
        },
        layout: layoutField,
      },
      render: (p) => <ImageHotspots {...p} />,
    },

    /* ── EVENT-CARD GRID (B24) ───────────────────────────────────── */
    EventCardGrid: {
      label: "Event-card grid",
      defaultProps: {
        title: "More events",
        mode: "upcoming-from-org",
        eventIds: "",
        layout: defaultLayout,
      },
      fields: {
        title: { type: "text", label: "Heading" },
        mode: {
          type: "radio",
          label: "Source",
          options: [
            { label: "Upcoming from org", value: "upcoming-from-org" },
            { label: "Manual list",       value: "manual" },
          ],
        },
        eventIds: {
          type: "textarea",
          label: "Event UUIDs (comma-separated, used when Source = Manual)",
        },
        layout: layoutField,
      },
      render: (p) => <EventCardGrid {...p} />,
    },

    /* ── COUNTDOWN (B13) ─────────────────────────────────────────── */
    Countdown: {
      label: "Countdown",
      defaultProps: { targetDateOverride: "", title: "Event begins in", subtitle: "", pastMessage: "We're live!", layout: defaultLayout },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "text", label: "Subtitle (optional)" },
        targetDateOverride: {
          type: "text",
          label: "Target date (ISO; blank = event start)",
        },
        pastMessage: { type: "text", label: "Message after target passes" },
        layout: layoutField,
      },
      render: (p) => <Countdown {...p} />,
    },

    /* ── VENUE / MAP (B14) ───────────────────────────────────────── */
    VenueMap: {
      label: "Venue",
      defaultProps: { title: "Venue", address: "", lat: undefined, lng: undefined, height: "md", layout: defaultLayout },
      fields: {
        title:   { type: "text", label: "Heading" },
        address: { type: "textarea", label: "Address (used if lat/lng blank)" },
        lat:     { type: "number", label: "Latitude (optional)" },
        lng:     { type: "number", label: "Longitude (optional)" },
        height: {
          type: "select",
          label: "Map height",
          options: [
            { label: "Small",  value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large",  value: "lg" },
          ],
        },
        layout: layoutField,
      },
      render: (p) => <VenueMap {...p} />,
    },

    /* ── STICKY CTA (B15) ────────────────────────────────────────── */
    StickyCta: {
      label: "Sticky CTA",
      defaultProps: { ctaLabel: "Register Now", ctaUrl: "internal:tickets", subtext: "", visibleOn: "after-hero", mobileOnly: false },
      fields: {
        ctaLabel: { type: "text", label: "Button label" },
        ctaUrl: {
          type: "custom",
          label: "Link",
          render: (p) => (
            <UrlPicker
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
            />
          ),
        },
        subtext: { type: "text", label: "Sub-text (optional)" },
        visibleOn: {
          type: "select",
          label: "Visible on",
          options: [
            { label: "Always",       value: "always" },
            { label: "After hero",   value: "after-hero" },
            { label: "Scroll up",    value: "scroll-up" },
          ],
        },
        mobileOnly: {
          type: "radio",
          label: "Mobile only",
          options: [
            { label: "No",  value: false },
            { label: "Yes", value: true },
          ],
        },
      },
      render: (p) => <StickyCta {...p} />,
    },

    /* ── SOCIAL BAR (B25) ────────────────────────────────────────── */
    SocialBar: {
      label: "Social bar",
      defaultProps: {
        links: [
          { platform: "linkedin", url: "" },
          { platform: "twitter",  url: "" },
        ],
        style: "icon-label",
        alignment: "left",
        layout: defaultLayout,
      },
      fields: {
        alignment: {
          type: "radio",
          label: "Alignment",
          options: [
            { label: "Left",   value: "left" },
            { label: "Center", value: "center" },
            { label: "Right",  value: "right" },
          ],
        },
        style: {
          type: "radio",
          label: "Display",
          options: [
            { label: "Platform name only",     value: "icon" },
            { label: "Platform name + URL",    value: "icon-label" },
          ],
        },
        links: {
          type: "array",
          label: "Links",
          getItemSummary: (it) => `${it.platform || "platform"}: ${it.url || ""}`,
          defaultItemProps: { platform: "linkedin", url: "" },
          arrayFields: {
            platform: {
              type: "select",
              label: "Platform",
              options: [
                { label: "LinkedIn",  value: "linkedin" },
                { label: "Twitter / X", value: "twitter" },
                { label: "Instagram", value: "instagram" },
                { label: "Facebook",  value: "facebook" },
                { label: "YouTube",   value: "youtube" },
                { label: "TikTok",    value: "tiktok" },
                { label: "Website",   value: "website" },
              ],
            },
            url: { type: "text", label: "URL" },
          },
        },
        layout: layoutField,
      },
      render: (p) => <SocialBar {...p} />,
    },

    /* ── NEWSLETTER (deprecated — use FormBlock) ───────────────── */
    Newsletter: {
      label: "Newsletter",
      defaultProps: {
        title: "Stay in the loop",
        subtitle: "Early access to programmes, new events, and member-only updates.",
        ctaLabel: "Subscribe",
        ctaUrl: "/#subscribe",
        layout: defaultLayout,
      },
      fields: {
        title:    { type: "text", label: "Heading" },
        subtitle: { type: "textarea", label: "Subtitle" },
        ctaLabel: { type: "text", label: "Button label" },
        ctaUrl: {
          type: "custom",
          label: "Form action / Link",
          render: (p) => (
            <UrlPicker
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
            />
          ),
        },
        layout:   layoutField,
      },
      render: (p) => <Newsletter {...p} />,
    },

    /* ── EMBED HTML (Phase 4.4) ──────────────────────────────────── */
    EmbedHtml: {
      label: "Embed HTML",
      defaultProps: { code: "", height: 400, layout: defaultLayout },
      fields: {
        code: { type: "textarea", label: "Embed code (paste an iframe from Calendly, YouTube, Vimeo, Typeform…)" },
        height: { type: "number", label: "Min height (px)", min: 100, max: 2000 },
        layout: layoutField,
      },
      render: (p) => <EmbedHtml {...p} />,
    },

    /* ── FOOTER (Phase 4.4) ──────────────────────────────────────── */
    Footer: {
      label: "Footer",
      defaultProps: {
        columns: 4,
        copyright: "© The Leadership Federation. All rights reserved.",
        logoUrl: "",
        useEventLogo: true,
        showPoweredBy: true,
        socialLinks: [],
        links: [],
        // ITEM 9
        mediaImage: "",
        mediaHref: "",
        terms: [],
        useEventSocialHandles: true,
        navButtons: [],
        textField: "",
        showMedia: true,
        showTerms: true,
        showSocial: true,
        showNavButtons: true,
        layout: { ...defaultLayout, paddingY: "md" },
      },
      fields: {
        // ── Setup tab ─────────────────────────────────────────────
        columns: {
          type: "radio",
          label: "Columns",
          options: [
            { label: "1", value: 1 }, { label: "2", value: 2 },
            { label: "3", value: 3 }, { label: "4", value: 4 },
          ],
        },
        copyright: { type: "text", label: "Copyright line" },
        textField: { type: "textarea", label: "Free text (Markdown OK)" },
        useEventLogo: {
          type: "radio", label: "Use event logo (Settings → General)",
          options: [{ label: "No", value: false }, { label: "Yes", value: true }],
        },
        logoUrl: {
          type: "custom",
          label: "Logo (override — only used when 'Use event logo' is No)",
          render: (p) => (
            <ImageField
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
              folder="general"
            />
          ),
        },
        mediaImage: {
          type: "custom",
          label: "Media image (overrides logo when set)",
          render: (p) => (
            <ImageField
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
              folder="general"
              aspectRatio={0}
            />
          ),
        },
        mediaHref: {
          type: "custom", label: "Media link (optional)",
          render: (p) => (
            <UrlPicker field={p.field as { label?: string }} value={(p.value as string) ?? ""} onChange={p.onChange as (v: string) => void} />
          ),
        },
        showPoweredBy: {
          type: "radio", label: "Show 'powered by' line",
          options: [{ label: "No", value: false }, { label: "Yes", value: true }],
        },
        // ── Terms ─────────────────────────────────────────────────
        terms: {
          type: "array", label: "Terms & policies",
          arrayFields: {
            label: { type: "text", label: "Label" },
            url:   { type: "text", label: "URL" },
          },
          getItemSummary: (item: unknown) => (item as { label?: string })?.label || "Term",
        },
        // ── Social ────────────────────────────────────────────────
        useEventSocialHandles: {
          type: "radio", label: "Use event social handles (Settings → General)",
          options: [{ label: "No", value: false }, { label: "Yes", value: true }],
        },
        socialLinks: {
          type: "array",
          label: "Social links (used when 'Use event social handles' is No)",
          arrayFields: {
            label: { type: "text", label: "Label" },
            url:   { type: "text", label: "URL" },
          },
          getItemSummary: (item: unknown) => (item as { label?: string })?.label || "Social link",
        },
        // ── Nav buttons ───────────────────────────────────────────
        navButtons: {
          type: "array", label: "Navigation buttons",
          arrayFields: {
            label: { type: "text", label: "Label" },
            url:   { type: "text", label: "URL" },
            style: {
              type: "radio", label: "Style",
              options: [
                { label: "Primary",   value: "primary" },
                { label: "Secondary", value: "secondary" },
                { label: "Outline",   value: "outline" },
              ],
            },
          },
          getItemSummary: (item: unknown) => (item as { label?: string })?.label || "Button",
        },
        // ── Legacy links (groups) ────────────────────────────────
        links: {
          type: "array",
          label: "Grouped link columns (legacy)",
          arrayFields: {
            label: { type: "text", label: "Label" },
            url:   { type: "text", label: "URL" },
            group: { type: "text", label: "Group (column heading)" },
          },
          getItemSummary: (item: unknown) => (item as { label?: string })?.label || "Link",
        },
        // ── Visibility tab ───────────────────────────────────────
        showMedia: {
          type: "radio", label: "Show media column",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        showTerms: {
          type: "radio", label: "Show terms column",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        showNavButtons: {
          type: "radio", label: "Show nav buttons column",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        showSocial: {
          type: "radio", label: "Show social column",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        layout: layoutField,
      },
      render: (p) => <Footer {...p} />,
    },

    /* ── SPEAKER BIO CARD (Phase 4.4) ────────────────────────────── */
    SpeakerBioCard: {
      label: "Speaker spotlight",
      defaultProps: { speakerId: "", side: "left", size: "lg", layout: defaultLayout },
      fields: {
        speakerId: { type: "text", label: "Speaker ID (UUID — copy from Admin → Speakers)" },
        side: {
          type: "radio", label: "Image side",
          options: [{ label: "Left", value: "left" }, { label: "Right", value: "right" }],
        },
        size: {
          type: "radio", label: "Image size",
          options: [{ label: "Medium", value: "md" }, { label: "Large", value: "lg" }],
        },
        layout: layoutField,
      },
      render: (p) => <SpeakerBioCard {...p} />,
    },

    /* ── SCHEDULE SUMMARY (Phase 4.4) ────────────────────────────── */
    ScheduleSummary: {
      label: "Schedule summary",
      defaultProps: { title: "Schedule", mode: "compact", showSpeakers: true, layout: defaultLayout },
      fields: {
        title: { type: "text", label: "Heading" },
        mode: {
          type: "radio", label: "Layout",
          options: [
            { label: "Compact list",   value: "compact" },
            { label: "Table",          value: "table" },
            { label: "Vertical timeline", value: "timeline" },
          ],
        },
        showSpeakers: {
          type: "radio", label: "Show speaker names",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        layout: layoutField,
      },
      render: (p) => <ScheduleSummary {...p} />,
    },

    /* ── CTA WITH IMAGE (Phase 4.4) ──────────────────────────────── */
    CtaWithImage: {
      label: "CTA + Image",
      defaultProps: {
        image: "",
        imageAlt: "",
        title: "Reserve your seat",
        body: "Curated room. Limited capacity. Apply to attend.",
        ctaLabel: "Apply now",
        ctaUrl: "/tickets",
        secondaryCtaLabel: "",
        secondaryCtaUrl: "",
        imageSide: "left",
        imageStyle: "rounded",
        layout: defaultLayout,
      },
      fields: {
        image: {
          type: "custom",
          label: "Image",
          render: (p) => (
            <ImageField
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
              folder="sections"
            />
          ),
        },
        imageAlt: { type: "text", label: "Image alt text" },
        title: makeSparklesField({ label: "Title", hint: "title" }) as unknown as Field<string>,
        body:  makeSparklesField({ label: "Body", type: "textarea", hint: "body", rows: 4 }) as unknown as Field<string>,
        ctaLabel: { type: "text", label: "Primary CTA label" },
        ctaUrl: {
          type: "custom",
          label: "Primary CTA link",
          render: (p) => (
            <UrlPicker
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
            />
          ),
        },
        secondaryCtaLabel: { type: "text", label: "Secondary CTA label (optional)" },
        secondaryCtaUrl: {
          type: "custom",
          label: "Secondary CTA link",
          render: (p) => (
            <UrlPicker
              field={p.field as { label?: string }}
              value={(p.value as string) ?? ""}
              onChange={p.onChange as (v: string) => void}
            />
          ),
        },
        imageSide: {
          type: "radio", label: "Image side",
          options: [{ label: "Left", value: "left" }, { label: "Right", value: "right" }],
        },
        imageStyle: {
          type: "radio", label: "Image style",
          options: [
            { label: "Rounded",  value: "rounded" },
            { label: "Square",   value: "square" },
            { label: "Circle",   value: "rounded-full" },
          ],
        },
        layout: layoutField,
      },
      render: (p) => <CtaWithImage {...p} />,
    },

    /* ── ITEM 3 — MEDIA WITH TEXT GROUP ─────────────────────────── */
    MediaWithTextGroup: {
      label: "Media with text",
      defaultProps: {
        title: "Why attend",
        subtitle: "",
        items: [
          { id: "", image: "", heading: "Item heading", body: "Body copy goes here.", ctaLabel: "", ctaUrl: "", side: "alternate" },
        ],
        layout: defaultLayout,
      },
      fields: {
        title:    makeSparklesField({ label: "Heading", hint: "title" }) as unknown as Field<string>,
        subtitle: { type: "text", label: "Eyebrow" },
        items: {
          type: "array",
          label: "Items",
          arrayFields: {
            id:       { type: "text", label: "Internal id" },
            image: {
              type: "custom", label: "Image",
              render: (p) => <ImageField {...p} folder="sections" />,
            },
            heading:  { type: "text", label: "Heading" },
            body:     { type: "textarea", label: "Body (Markdown)" },
            ctaLabel: { type: "text", label: "CTA label (optional)" },
            ctaUrl: {
              type: "custom", label: "CTA link",
              render: (p) => (
                <UrlPicker field={p.field as { label?: string }} value={(p.value as string) ?? ""} onChange={p.onChange as (v: string) => void} />
              ),
            },
            side: {
              type: "radio", label: "Image side",
              options: [
                { label: "Alternate", value: "alternate" },
                { label: "Left",      value: "left" },
                { label: "Right",     value: "right" },
              ],
            },
          },
          getItemSummary: (item: unknown) => (item as { heading?: string })?.heading || "Item",
          defaultItemProps: { id: "", image: "", heading: "Item heading", body: "", ctaLabel: "", ctaUrl: "", side: "alternate" },
        },
        layout: layoutField,
      },
      render: (p) => <MediaWithTextGroup {...p} />,
    },

    /* ── ITEM 4 — TESTIMONIALS GROUP ────────────────────────────── */
    TestimonialsGroup: {
      label: "Testimonials",
      defaultProps: {
        title: "What people say",
        subtitle: "",
        items: [
          { id: "", quote: "Quote goes here.", attribution: "Name", role: "Title", avatar: "", rating: 5 },
        ],
        displayStyle: "grid",
        layout: defaultLayout,
      },
      fields: {
        title:    makeSparklesField({ label: "Heading", hint: "title" }) as unknown as Field<string>,
        subtitle: { type: "text", label: "Eyebrow" },
        displayStyle: {
          type: "radio", label: "Display style",
          options: [
            { label: "Carousel", value: "carousel" },
            { label: "Grid",     value: "grid" },
            { label: "List",     value: "list" },
          ],
        },
        items: {
          type: "array",
          label: "Testimonials",
          arrayFields: {
            id:          { type: "text",     label: "Internal id" },
            quote:       { type: "textarea", label: "Quote" },
            attribution: { type: "text",     label: "Name" },
            role:        { type: "text",     label: "Title / company" },
            avatar: {
              type: "custom", label: "Avatar",
              render: (p) => <ImageField {...p} folder="general" aspectRatio={1} />,
            },
            rating: { type: "number", label: "Rating (0–5)", min: 0, max: 5 },
          },
          getItemSummary: (item: unknown) => (item as { attribution?: string })?.attribution || "Testimonial",
          defaultItemProps: { id: "", quote: "", attribution: "", role: "", avatar: "", rating: 5 },
        },
        layout: layoutField,
      },
      render: (p) => <TestimonialsGroup {...p} />,
    },

    /* ── ITEM 5 — FLOOR PLAN ────────────────────────────────────── */
    FloorPlan: {
      label: "Floor plan",
      defaultProps: { title: "Floor plan", image: "", caption: "", hotspots: [], layout: defaultLayout },
      fields: {
        title:   { type: "text", label: "Heading" },
        image: {
          type: "custom", label: "Floor plan image",
          render: (p) => <ImageField {...p} folder="sections" aspectRatio={16 / 9} />,
        },
        caption: { type: "text", label: "Caption" },
        hotspots: {
          type: "array", label: "Hotspots (numbered pins)",
          arrayFields: {
            x:           { type: "number", label: "X position (0–1)", min: 0, max: 1 },
            y:           { type: "number", label: "Y position (0–1)", min: 0, max: 1 },
            label:       { type: "text",   label: "Label" },
            description: { type: "textarea", label: "Tooltip description" },
          },
          getItemSummary: (item: unknown) => (item as { label?: string })?.label || "Hotspot",
          defaultItemProps: { x: 0.5, y: 0.5, label: "Booth", description: "" },
        },
        layout: layoutField,
      },
      render: (p) => <FloorPlan {...p} />,
    },

    /* ── ITEM 6 — EXHIBITORS LISTING ────────────────────────────── */
    ExhibitorsListing: {
      label: "Exhibitors",
      defaultProps: { title: "Exhibitors", groupByCategory: true, layout: defaultLayout },
      fields: {
        title: { type: "text", label: "Heading" },
        groupByCategory: {
          type: "radio", label: "Group by category",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }],
        },
        layout: layoutField,
      },
      render: (p) => <ExhibitorsListing {...p} />,
    },

    /* ── ITEM 6 — EXHIBITOR CATEGORY (single-section) ───────────── */
    ExhibitorCategoryBlock: {
      label: "Exhibitor category",
      defaultProps: { categoryId: "", layout: defaultLayout },
      fields: {
        categoryId: { type: "text", label: "Category id (copy from Data → Exhibitors)" },
        layout: layoutField,
      },
      render: (p) => <ExhibitorCategoryBlock {...p} />,
    },

    /* ── ITEM 7 — HOTELS LISTING ────────────────────────────────── */
    HotelsListing: {
      label: "Hotels",
      defaultProps: { title: "Where to stay", columns: 3, layout: defaultLayout },
      fields: {
        title: { type: "text", label: "Heading" },
        columns: {
          type: "radio", label: "Columns",
          options: [{ label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 }],
        },
        layout: layoutField,
      },
      render: (p) => <HotelsListing {...p} />,
    },
  },

  root: {
    fields: {
      title: { type: "text", label: "Page title (internal)" },
      /* Preset picker — 20 pre-designed colour + font combinations. If
       * set to anything except "Custom", the preset's values WIN over the
       * individual colour/font fields below. Keeps setup to one click for
       * most events while still allowing full manual control.            */
      themePreset: {
        type: "custom",
        label: "Theme preset (overrides fields below when set)",
        render: (p: FieldProps): ReactElement => (
          <ThemePresetGrid
            field={p.field as { label?: string }}
            value={p.value as string | undefined}
            onChange={p.onChange as (v: string) => void}
          />
        ),
      },
      primaryColor: { type: "text", label: "Primary colour (hex, e.g. #e7ab1c)" },
      textColor:    { type: "text", label: "Default text colour (hex)" },
      bgColor:      { type: "text", label: "Page background colour (hex)" },
      fontFamily: {
        type: "select",
        label: "Font family",
        options: [
          { label: "SF Pro / System (default)", value: "sf" },
          { label: "Inter",                     value: "inter" },
          { label: "Serif (Playfair)",          value: "serif" },
          { label: "Mono (JetBrains)",          value: "mono" },
        ],
      },
    },
    defaultProps: {
      title: "",
      themePreset: "custom",
      primaryColor: "",
      textColor: "",
      bgColor: "",
      fontFamily: "sf",
    },
    render: (props) => <Root {...(props as unknown as RootProps & { children: React.ReactNode })} />,
  },
}

/**
 * Post-process: wrap every block's render with a HOC that:
 *   - When props.__hidden is true, mounts the rendered block inside a
 *     <div data-lf-hidden="true"> so the editor CSS shows diagonal
 *     stripes + a "Hidden element" pill.  (Public renderer filters
 *     hidden blocks before they ever reach Puck — see PuckPublicRenderer.)
 *   - Otherwise renders the block exactly as configured.
 *
 * We do this once at config-build time instead of touching every block
 * component individually so the visual pattern works across all 30+
 * block kinds with zero per-block plumbing.
 */
function withHiddenWrapper<P extends { __hidden?: boolean; id?: string }>(
  origRender: ((props: P) => React.ReactNode) | undefined,
): ((props: P) => React.ReactNode) | undefined {
  if (!origRender) return origRender
  // eslint-disable-next-line react/display-name
  return (props: P) => {
    const child = origRender(props)
    const blockId = (props as { id?: string }).id ?? ""
    const hidden = (props as { __hidden?: boolean }).__hidden
    // Only render the editor-only "+ Add optional section" inserter when
    // Puck's metadata.editor flag is set (PuckEventBuilder passes it;
    // PuckPublicRenderer doesn't). Without this guard the inserter HTML
    // leaks onto every public microsite page.
    const meta = (props as { puck?: { metadata?: Record<string, unknown> } }).puck?.metadata ?? {}
    const isEditor = meta.editor === true
    return (
      <>
        {hidden ? <div data-lf-hidden="true">{child}</div> : child}
        {isEditor && <OptionalSectionInserter blockId={blockId} />}
      </>
    )
  }
}

/**
 * "+ Add optional section" button rendered after every block in the
 * editor canvas. Clicking it opens the LEFT-side Sections palette
 * positioned to insert a new block immediately below the clicked one.
 *
 * The button uses MutationObserver-free positioning — it just walks
 * the rendered DOM at click time to find its index inside the root
 * drop zone, then dispatches `builder:open-sections-at-index` with
 * that index + 1.
 *
 * Only renders inside the editor (`.lf-builder-shell`) — public
 * renderer never mounts the inserter because PuckPublicRenderer
 * filters before reaching this layer.
 */
function OptionalSectionInserter({ blockId }: { blockId: string }) {
  // The inserter button is hidden by default and revealed via CSS
  // (.lf-builder-shell ._DropZone-item:hover .lf-add-optional-section).
  // This keeps the canvas clean unless the user is hovering between
  // two sections.
  return (
    <div
      className="lf-add-optional-section"
      data-block-id={blockId}
      onClick={(e) => {
        e.stopPropagation()
        // The clicked button lives in a DropZone-item wrapper; count
        // siblings to figure out the insertion index.
        const wrapper = (e.currentTarget as HTMLElement).closest("[data-puck-component]")?.parentElement
        const root = wrapper?.parentElement
        if (root) {
          const items = Array.from(root.children)
          const myIndex = items.indexOf(wrapper as Element)
          window.dispatchEvent(new CustomEvent("builder:open-sections-at-index", {
            detail: { index: myIndex + 1 },
          }))
        } else {
          // Fallback — append at end.
          window.dispatchEvent(new CustomEvent("builder:open-sections-at-index", {
            detail: { index: -1 },
          }))
        }
      }}
    >
      <span className="lf-add-optional-section-line" />
      <span className="lf-add-optional-section-pill">+ Add optional section</span>
      <span className="lf-add-optional-section-line" />
    </div>
  )
}

if (puckConfig.components) {
  for (const k of Object.keys(puckConfig.components) as Array<keyof BuilderComponents>) {
    const comp = puckConfig.components[k] as { render?: (props: never) => React.ReactNode }
    if (comp?.render) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      comp.render = withHiddenWrapper(comp.render as any) as any
    }
  }
}
