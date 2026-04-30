"use client"

/**
 * Embla-powered slider used by the Hero block when `slides[]` has 1+
 * entries. Lives in its own module so the embla bundle is code-split
 * out of the public bundle for events that don't use a hero slider.
 *
 * Mirrors the visual chrome of the legacy single-hero render — full-
 * bleed background image, gradient overlay, optional logo, date/venue
 * eyebrow, title, subtitle, primary + secondary CTA — but each slide
 * provides its own copy of those props. Auto-rotates every `interval`
 * seconds (default 6), pauses on hover. Arrows + dots respect the
 * sliderControls config from the inspector.
 */

import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState, useRef } from "react"
import { Calendar, MapPin, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from "lucide-react"
import { resolveUrl, urlIsExternal } from "./UrlPicker"
import { parseFocalPoint } from "@/components/admin/ImageUploadCrop"
import { sfFont, type EventShape } from "./blocks"

export type HeroSlide = {
  id: string
  title: string
  subtitle: string
  ctaPrimaryLabel: string
  ctaPrimaryUrl: string
  ctaSecondaryLabel?: string
  ctaSecondaryUrl?: string
  backgroundImage: string
  alignment?: "left" | "center"
  useEventLogo?: boolean
}

export type SliderControls = {
  arrowsVisible?: boolean
  arrowColor?: string
  arrowSize?: "sm" | "md" | "lg"
  navigatorVisible?: boolean
  navigatorStyle?: "dots" | "bars" | "numbers"
  autoplay?: boolean
  intervalSec?: number
  transition?: "slide" | "fade"
}

export function HeroSliderInner({
  slides,
  event,
  controls,
  height,
  isFirstBlock,
}: {
  slides: HeroSlide[]
  event: EventShape
  controls: SliderControls
  height: string
  isFirstBlock: boolean
}) {
  const transition = controls.transition === "fade" ? "fade" : "slide"
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: transition === "fade" ? 18 : 30,
  })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const hoveringRef = useRef(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)
    onSelect()
    return () => { emblaApi.off("select", onSelect) }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi || !controls.autoplay) return
    const ms = Math.max(2000, (controls.intervalSec ?? 6) * 1000)
    const tick = () => {
      if (!emblaApi) return
      if (hoveringRef.current) return
      if (emblaApi.canScrollNext()) emblaApi.scrollNext()
      else emblaApi.scrollTo(0)
    }
    const t = setInterval(tick, ms)
    return () => clearInterval(t)
  }, [emblaApi, controls.autoplay, controls.intervalSec])

  const arrowSize = controls.arrowSize === "sm" ? 14 : controls.arrowSize === "lg" ? 22 : 18
  const arrowColor = controls.arrowColor || "#ffffff"
  const arrowsVisible = controls.arrowsVisible !== false
  const navVisible = controls.navigatorVisible !== false
  const navStyle = controls.navigatorStyle ?? "dots"

  function fmtDate(start: string, end: string | null) {
    try {
      const s = new Date(start)
      const e = end ? new Date(end) : null
      const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
      return e ? `${s.toLocaleDateString("en-IN", opts)} – ${e.toLocaleDateString("en-IN", opts)}` : s.toLocaleDateString("en-IN", opts)
    } catch {
      return start
    }
  }

  return (
    <section
      className={`relative ${height} overflow-hidden bg-[#1a1a2e]`}
      onMouseEnter={() => { hoveringRef.current = true }}
      onMouseLeave={() => { hoveringRef.current = false }}
    >
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, idx) => {
            const bg = slide.backgroundImage || event.cover_image_url
            const shownTitle = slide.title || event.title
            const logo = slide.useEventLogo ? event.logo_url ?? null : null
            const centered = slide.alignment === "center"
            return (
              <div
                key={slide.id || idx}
                className={`relative shrink-0 grow-0 basis-full h-full flex items-end ${transition === "fade" ? "transition-opacity" : ""}`}
                style={transition === "fade" ? { opacity: idx === selectedIdx ? 1 : 0.001 } : undefined}
              >
                {bg && (() => {
                  const { src, objectPosition } = parseFocalPoint(bg)
                  return (
                    <Image
                      src={src}
                      alt={shownTitle || "Event"}
                      fill
                      priority={isFirstBlock && idx === 0}
                      fetchPriority={isFirstBlock && idx === 0 ? "high" : "auto"}
                      className="object-cover opacity-60"
                      style={{ objectPosition }}
                      sizes="100vw"
                    />
                  )
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
                <div className={`relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pb-20 pt-28 w-full ${centered ? "text-center" : ""}`}>
                  {logo && (() => {
                    const { src } = parseFocalPoint(logo)
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={`${event.title || "Event"} logo`}
                        className={`h-14 sm:h-16 w-auto mb-6 drop-shadow-md ${centered ? "mx-auto" : ""}`}
                      />
                    )
                  })()}
                  {event.start_date && (
                    <div
                      className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] mb-4 ${centered ? "justify-center" : ""}`}
                      style={{ color: "var(--lf-primary, #e7ab1c)" }}
                    >
                      <Calendar size={13} /> {fmtDate(event.start_date, event.end_date)}
                      {event.venue && (
                        <>
                          <span className="opacity-40">·</span>
                          <MapPin size={13} /> {event.venue}
                        </>
                      )}
                    </div>
                  )}
                  <h1
                    className={`text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.05] ${centered ? "max-w-4xl mx-auto" : "max-w-4xl"}`}
                    style={sfFont}
                  >
                    {shownTitle || "Untitled Event"}
                  </h1>
                  {slide.subtitle && (
                    <p className={`mt-5 text-lg sm:text-xl text-white/80 leading-relaxed ${centered ? "max-w-2xl mx-auto" : "max-w-2xl"}`}>
                      {slide.subtitle}
                    </p>
                  )}
                  {(slide.ctaPrimaryLabel && slide.ctaPrimaryUrl) || (slide.ctaSecondaryLabel && slide.ctaSecondaryUrl) ? (
                    <div className={`mt-8 flex flex-wrap items-center gap-3 ${centered ? "justify-center" : ""}`}>
                      {slide.ctaPrimaryLabel && slide.ctaPrimaryUrl && (
                        <Link
                          href={resolveUrl(slide.ctaPrimaryUrl, event.slug)}
                          target={urlIsExternal(slide.ctaPrimaryUrl) ? "_blank" : undefined}
                          rel={urlIsExternal(slide.ctaPrimaryUrl) ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[#1a1a2e] text-sm font-bold transition-colors hover:brightness-95"
                          style={{ backgroundColor: "var(--lf-primary, #e7ab1c)" }}
                        >
                          {slide.ctaPrimaryLabel}
                          <ChevronRightIcon size={14} />
                        </Link>
                      )}
                      {slide.ctaSecondaryLabel && slide.ctaSecondaryUrl && (
                        <Link
                          href={resolveUrl(slide.ctaSecondaryUrl, event.slug)}
                          target={urlIsExternal(slide.ctaSecondaryUrl) ? "_blank" : undefined}
                          rel={urlIsExternal(slide.ctaSecondaryUrl) ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white border-2 border-white/80 text-sm font-bold hover:bg-white/10 transition-colors"
                        >
                          {slide.ctaSecondaryLabel}
                        </Link>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Arrows */}
      {arrowsVisible && slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={scrollPrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
            style={{ color: arrowColor }}
          >
            <ChevronLeft size={arrowSize} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={scrollNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
            style={{ color: arrowColor }}
          >
            <ChevronRight size={arrowSize} strokeWidth={2} />
          </button>
        </>
      )}

      {/* Navigator */}
      {navVisible && slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2 px-4">
          {slides.map((_, i) => {
            const active = i === selectedIdx
            if (navStyle === "numbers") {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`min-w-[28px] h-7 px-2 rounded-md text-[11px] font-bold ${active ? "bg-white text-[#1a1a2e]" : "bg-white/30 text-white hover:bg-white/50"}`}
                >
                  {i + 1}
                </button>
              )
            }
            if (navStyle === "bars") {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${active ? "w-10 bg-white" : "w-5 bg-white/40 hover:bg-white/70"}`}
                />
              )
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all ${active ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}`}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
