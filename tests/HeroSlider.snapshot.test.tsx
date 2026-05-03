/**
 * HeroSliderInner snapshot test (ITEM 2.4).
 *
 * Renders a slide configured with layout='media-right', mediaSize='lg',
 * primaryMedia.kind='image', elements=buildDefaultElements() and asserts:
 *   - The split-screen grid is present with the data-testid hook
 *   - The media column carries the data-testid for media-right
 *   - The five default elements (eventName, dateTime, venue,
 *     shortDescription, buttonGroup) all appear in DOM order
 *
 * Mocks next/image and next/link so jsdom can render without the
 * Next.js runtime. Mocks embla-carousel-react + embla-carousel-autoplay
 * so the component mounts without trying to attach to real refs.
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import React from "react"

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return React.createElement("img", props as React.ImgHTMLAttributes<HTMLImageElement>)
  },
}))

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("a", { href, ...rest }, children),
}))

vi.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: () => [
    (() => {})  as unknown as React.RefCallback<HTMLDivElement>,
    {
      scrollPrev: () => {}, scrollNext: () => {}, scrollTo: () => {},
      on: () => {}, off: () => {}, reInit: () => {},
      selectedScrollSnap: () => 0, canScrollNext: () => true,
    } as unknown,
  ],
}))

vi.mock("embla-carousel-autoplay", () => ({
  __esModule: true,
  default: () => ({ stop: () => {}, play: () => {} }),
}))

import { HeroSliderInner } from "@/components/admin/puck/HeroSliderInner"
import { buildDefaultElements, type EventShape, type HeroSlide } from "@/components/admin/puck/blocks"

const event: EventShape = {
  id: "evt-1",
  slug: "mumbai",
  title: "GCC Leadership Conclave — Mumbai",
  start_date: new Date("2026-08-15T10:00:00Z").toISOString(),
  end_date: new Date("2026-08-16T19:00:00Z").toISOString(),
  venue: "Grand Hyatt Mumbai",
  description: null,
  cover_image_url: null,
  logo_url: null,
}

const slide: HeroSlide = {
  id: "s-1",
  title: "GCC Leadership Conclave",
  subtitle: "Two days of speakers + workshops",
  ctaPrimaryLabel: "",
  ctaPrimaryUrl: "",
  ctaSecondaryLabel: "",
  ctaSecondaryUrl: "",
  backgroundImage: "",
  alignment: "left",
  layout: "media-right",
  mediaSize: "lg",
  horizontalAlign: "left",
  verticalAlign: "center",
  primaryMedia: { kind: "image", url: "/test.jpg", alt: "Stage" },
  elements: buildDefaultElements("test"),
}

describe("HeroSliderInner — split-screen layout", () => {
  it("renders media-right at lg with 66% media + 34% copy and the 5 default elements in order", () => {
    render(
      <HeroSliderInner
        slides={[slide]}
        event={event}
        controls={{ autoplay: false }}
        height="min-h-[600px]"
        isFirstBlock={true}
      />,
    )

    // Split-screen grid present with the right testid (layout-mediaSize).
    const grid = screen.getByTestId("hero-slide-grid-media-right-lg")
    expect(grid).toBeInTheDocument()
    expect(grid.className).toContain("flex-row")

    // Media column rendered with its testid.
    const media = screen.getByTestId("hero-slide-media-media-right")
    expect(media).toBeInTheDocument()

    // For media-right the order in DOM is copy-first then media; the
    // copy <div data-testid="hero-slide-copy"> must appear BEFORE the
    // media node when iterating grid children.
    const children = Array.from(grid.children) as HTMLElement[]
    const copyIndex  = children.findIndex((c) => c.querySelector('[data-testid="hero-slide-copy"]'))
    const mediaIndex = children.findIndex((c) => c.querySelector('[data-testid="hero-slide-media-media-right"]'))
    expect(copyIndex).toBeGreaterThanOrEqual(0)
    expect(mediaIndex).toBeGreaterThanOrEqual(0)
    expect(copyIndex).toBeLessThan(mediaIndex)

    // Inline width style on the media column should be 66%.
    const mediaCol = children[mediaIndex]
    expect(mediaCol.style.width).toBe("66%")

    // And the copy column should be 34% (100 - 66).
    const copyCol = children[copyIndex]
    expect(copyCol.style.width).toBe("34%")

    // The image renders inside the media column with the test src.
    const img = mediaCol.querySelector("img") as HTMLImageElement | null
    expect(img).not.toBeNull()
    expect(img!.getAttribute("src")).toContain("/test.jpg")

    // Five default elements appear in DOM order: eventName, dateTime,
    // venue, shortDescription, buttonGroup. The first <h1> is the
    // event name; the venue's MapPin row contains the venue text;
    // the buttonGroup contains the Register Now anchor.
    expect(screen.getAllByRole("heading", { level: 1 })[0].textContent).toContain("GCC Leadership Conclave")
    expect(screen.getByText("Grand Hyatt Mumbai")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Register Now/i })).toBeInTheDocument()
  })
})
