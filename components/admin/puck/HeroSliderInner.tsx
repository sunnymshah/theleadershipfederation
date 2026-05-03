"use client"

/**
 * Embla-powered slider used by the Hero block when `slides[]` has 1+
 * entries. Code-split so the embla bundle stays out of the public
 * bundle for events that don't use a hero slider.
 *
 * Per-slide capabilities:
 *   - background: color (flat / gradient) / image (with focal-point +
 *     overlay) / video (autoplay muted loop). Mobile override applied
 *     when window.innerWidth < 768.
 *   - layout: background-only OR split-screen with primary media on
 *     left / right / top / bottom (ITEM 2).
 *   - elements: ordered array of element types each with their own
 *     props (eventName / dateTime / venue / shortDescription / label /
 *     buttonGroup / countdown / socialHandles / primaryMedia /
 *     secondaryMedia). Falls back to legacy show* booleans for
 *     pre-elements slides.
 *
 * Slider chrome respects sliderControls.arrowDesign (stroke / stroke-
 * circle / filled / filled-box), navigatorStyle (dots / dashes / lines
 * / numbers), and pauseOnHover.
 */

import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState, useRef, type CSSProperties } from "react"
import {
  Calendar, MapPin, ChevronRight as ChevronRightIcon,
} from "lucide-react"
import { resolveUrl, urlIsExternal } from "./UrlPicker"
import { parseFocalPoint } from "@/components/admin/ImageUploadCrop"
import {
  sfFont,
  buildDefaultElements,
  type EventShape, type SocialHandles,
  type HeroSlide, type SliderControls, type SlideBackground,
  type HeroElement, type EventNameFormat, type HeroElementButton,
} from "./blocks"

/* ── Background helpers ─────────────────────────────────────────── */
function clamp01(n: number) { return Math.max(0, Math.min(1, n)) }

function pickBackground(slide: HeroSlide, isMobile: boolean): SlideBackground | null {
  const main = slide.background
  if (!main) {
    // Legacy fallback: convert top-level backgroundImage into an image bg.
    if (slide.backgroundImage) {
      return {
        type: "image",
        image: {
          url: slide.backgroundImage, opacity: 1, fit: "cover",
          position: { x: 0.5, y: 0.5 },
          overlayEnabled: true, overlayColor: "#000000", overlayOpacity: 0.55,
        },
      }
    }
    return null
  }
  if (isMobile && main.mobile) return main.mobile
  return main
}

export function HeroSliderInner({
  slides,
  event,
  controls,
  height,
  isFirstBlock,
  socialHandles,
}: {
  slides: HeroSlide[]
  event: EventShape
  controls: SliderControls
  height: string
  isFirstBlock: boolean
  socialHandles?: SocialHandles
}) {
  const transition = controls.transition === "fade" ? "fade" : "slide"
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: transition === "fade" ? 18 : 30,
  })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const hoveringRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  // Track viewport for mobile background overrides + responsive layout.
  useEffect(() => {
    if (typeof window === "undefined") return
    const compute = () => setIsMobile(window.innerWidth < 768)
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [])

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

  // Autoplay. ITEM 6.3: pauseOnHover gates the hover-skip behaviour.
  useEffect(() => {
    if (!emblaApi || !controls.autoplay) return
    const pauseOnHover = controls.pauseOnHover !== false
    const ms = Math.max(2000, (controls.intervalSec ?? 6) * 1000)
    const tick = () => {
      if (!emblaApi) return
      if (pauseOnHover && hoveringRef.current) return
      if (emblaApi.canScrollNext()) emblaApi.scrollNext()
      else emblaApi.scrollTo(0)
    }
    const t = setInterval(tick, ms)
    return () => clearInterval(t)
  }, [emblaApi, controls.autoplay, controls.intervalSec, controls.pauseOnHover])

  const arrowSize = controls.arrowSize === "sm" ? 14 : controls.arrowSize === "lg" ? 22 : 18
  const arrowColor = controls.arrowColor || "#ffffff"
  const arrowsVisible = controls.arrowsVisible !== false
  const arrowDesign = controls.arrowDesign ?? "stroke"
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
            const bg = pickBackground(slide, isMobile)
            const slideElements = resolveElements(slide)
            const slideLayout = slide.layout ?? "background-only"
            const horizontalAlign = slide.horizontalAlign
              ?? (slide.alignment === "center" ? "center" : "left")
            const verticalAlign = slide.verticalAlign ?? "bottom"

            return (
              <div
                key={slide.id || idx}
                className={`relative shrink-0 grow-0 basis-full h-full ${transition === "fade" ? "transition-opacity" : ""}`}
                style={transition === "fade" ? { opacity: idx === selectedIdx ? 1 : 0.001 } : undefined}
              >
                <SlideBackgroundLayer
                  bg={bg}
                  isFirst={isFirstBlock && idx === 0}
                  alt={slide.title || event.title || "Event"}
                />
                <div className="absolute inset-0">
                  <SlideContent
                    slide={slide}
                    layout={slideLayout}
                    horizontalAlign={horizontalAlign}
                    verticalAlign={verticalAlign}
                    elements={slideElements}
                    event={event}
                    fmtDate={fmtDate}
                    socialHandles={socialHandles ?? {}}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {arrowsVisible && slides.length > 1 && (
        <>
          <ArrowButton
            direction="prev"
            onClick={scrollPrev}
            design={arrowDesign}
            size={arrowSize}
            color={arrowColor}
          />
          <ArrowButton
            direction="next"
            onClick={scrollNext}
            design={arrowDesign}
            size={arrowSize}
            color={arrowColor}
          />
        </>
      )}

      {navVisible && slides.length > 1 && (
        <Navigator
          style={navStyle}
          count={slides.length}
          selectedIdx={selectedIdx}
          onJump={scrollTo}
        />
      )}
    </section>
  )
}

/* ── ITEM 1.2 — slide background layer ────────────────────────── */
function SlideBackgroundLayer({
  bg, isFirst, alt,
}: {
  bg: SlideBackground | null
  isFirst: boolean
  alt: string
}) {
  if (!bg) {
    return <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
  }
  if (bg.type === "color" && bg.color) {
    const c = bg.color
    const opacity = clamp01(c.opacity ?? 1)
    const style: CSSProperties = c.mode === "gradient" && c.gradientTo
      ? { backgroundImage: `linear-gradient(180deg, ${c.color}, ${c.gradientTo})`, opacity }
      : { backgroundColor: c.color, opacity }
    return (
      <>
        <div className="absolute inset-0" style={style} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/70 via-[#050505]/30 to-transparent pointer-events-none" />
      </>
    )
  }
  if (bg.type === "image" && bg.image) {
    const img = bg.image
    const { src } = parseFocalPoint(img.url)
    const objectPosition = `${(img.position?.x ?? 0.5) * 100}% ${(img.position?.y ?? 0.5) * 100}%`
    const objectFit = img.fit === "contain" ? "contain" : "cover"
    const overlayRgba = hexToRgba(img.overlayColor || "#000000", clamp01(img.overlayOpacity ?? 0.55))
    return (
      <>
        {img.fit === "tile" ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${src}')`,
              backgroundRepeat: "repeat",
              backgroundPosition: "top left",
              opacity: clamp01(img.opacity ?? 1),
            }}
          />
        ) : src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={isFirst}
            fetchPriority={isFirst ? "high" : "auto"}
            sizes="100vw"
            style={{ objectFit, objectPosition, opacity: clamp01(img.opacity ?? 1) }}
            className="select-none"
          />
        ) : null}
        {img.overlayEnabled && (
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: overlayRgba }} />
        )}
      </>
    )
  }
  if (bg.type === "video" && bg.video) {
    const v = bg.video
    const overlayRgba = hexToRgba(v.overlayColor || "#000000", clamp01(v.overlayOpacity ?? 0.45))
    return (
      <>
        <video
          src={v.url}
          autoPlay
          muted
          loop={v.loop !== false}
          playsInline
          aria-label={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: overlayRgba }} />
      </>
    )
  }
  return null
}

function hexToRgba(hex: string, alpha: number): string {
  const v = (hex ?? "").trim()
  if (/^rgba?\(/i.test(v)) return v
  let h = v.startsWith("#") ? v.slice(1) : v
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return `rgba(0,0,0,${alpha})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/* ── ITEM 2 — slide content with optional split-screen layout ─── */
const MEDIA_SIZE_PCT: Record<NonNullable<HeroSlide["mediaSize"]>, number> = {
  xs: 25, sm: 33, md: 50, lg: 66, xl: 80,
}

function SlideContent({
  slide, layout, horizontalAlign, verticalAlign, elements, event, fmtDate, socialHandles,
}: {
  slide: HeroSlide
  layout: NonNullable<HeroSlide["layout"]>
  horizontalAlign: "left" | "center" | "right"
  verticalAlign: "top" | "center" | "bottom"
  elements: HeroElement[]
  event: EventShape
  fmtDate: (s: string, e: string | null) => string
  socialHandles: SocialHandles
}) {
  const verticalMap = {
    top: "items-start", center: "items-center", bottom: "items-end",
  } as const
  // ITEM 2.2 — horizontal align maps to flex justify on the COPY column,
  // independent of vertical align. So a media-right + bottom-right copy
  // genuinely lands in the bottom-right of its track.
  const horizontalMap = {
    left: "justify-start", center: "justify-center", right: "justify-end",
  } as const
  const alignText =
    horizontalAlign === "center" ? "text-center" :
    horizontalAlign === "right" ? "text-right" : ""

  const copy = (
    <div
      data-testid="hero-slide-copy"
      className={`relative z-10 px-6 sm:px-10 py-12 w-full max-w-6xl ${alignText}`}
    >
      {elements.map((el) => (
        <ElementRenderer
          key={el.id}
          el={el}
          slide={slide}
          event={event}
          fmtDate={fmtDate}
          socialHandles={socialHandles}
          horizontalAlign={horizontalAlign}
        />
      ))}
    </div>
  )

  if (layout === "background-only") {
    return (
      <div className={`absolute inset-0 flex ${verticalMap[verticalAlign]} ${horizontalMap[horizontalAlign]}`}>
        {copy}
      </div>
    )
  }

  const media = slide.primaryMedia
  if (!media || !media.url) return (
    <div className={`absolute inset-0 flex ${verticalMap[verticalAlign]} ${horizontalMap[horizontalAlign]}`}>{copy}</div>
  )

  const sizePct = MEDIA_SIZE_PCT[slide.mediaSize ?? "lg"]
  const isHorizontal = layout === "media-left" || layout === "media-right"
  const mediaEl = (
    <div className="relative w-full h-full overflow-hidden" data-testid={`hero-slide-media-${layout}`}>
      {media.kind === "video" ? (
        <video src={media.url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={parseFocalPoint(media.url).src} alt={media.alt ?? ""} className="absolute inset-0 w-full h-full object-cover" />
      )}
    </div>
  )

  const styleMedia: CSSProperties = isHorizontal
    ? { width: `${sizePct}%`, height: "100%" }
    : { width: "100%", height: `${sizePct}%` }
  const styleCopy: CSSProperties = isHorizontal
    ? { width: `${100 - sizePct}%`, height: "100%" }
    : { width: "100%", height: `${100 - sizePct}%` }

  const order = layout === "media-left" || layout === "media-top" ? "media-first" : "copy-first"
  return (
    <div
      className={`absolute inset-0 flex ${isHorizontal ? "flex-row" : "flex-col"}`}
      data-testid={`hero-slide-grid-${layout}-${slide.mediaSize ?? "lg"}`}
    >
      {order === "media-first" ? (
        <>
          <div style={styleMedia}>{mediaEl}</div>
          <div style={styleCopy} className={`flex ${verticalMap[verticalAlign]} ${horizontalMap[horizontalAlign]}`}>{copy}</div>
        </>
      ) : (
        <>
          <div style={styleCopy} className={`flex ${verticalMap[verticalAlign]} ${horizontalMap[horizontalAlign]}`}>{copy}</div>
          <div style={styleMedia}>{mediaEl}</div>
        </>
      )}
    </div>
  )
}

/* ── ITEM 3 — element renderer ─────────────────────────────────── */
function ElementRenderer({
  el, slide, event, fmtDate, socialHandles, horizontalAlign,
}: {
  el: HeroElement
  slide: HeroSlide
  event: EventShape
  fmtDate: (s: string, e: string | null) => string
  socialHandles: SocialHandles
  horizontalAlign: "left" | "center" | "right"
}) {
  const centered = horizontalAlign === "center"
  const eventLogo = slide.useEventLogo ? event.logo_url ?? null : null

  switch (el.kind) {
    case "eventName":
      return <EventNameElement text={el.text || slide.title || event.title || "Untitled Event"} format={el.format} centered={centered} logo={eventLogo} />
    case "shortDescription":
      return el.text || slide.subtitle ? (
        <p
          className={`mt-5 text-lg sm:text-xl text-white/80 leading-relaxed ${centered ? "max-w-2xl mx-auto" : "max-w-2xl"}`}
          style={formatToStyle(el.format)}
        >
          {el.text || slide.subtitle}
        </p>
      ) : null
    case "label":
      return el.text ? (
        <span
          className="inline-flex items-center px-3 py-1 mb-3 rounded-full bg-white/15 text-white text-[11px] font-bold uppercase tracking-[0.2em]"
          style={formatToStyle(el.format)}
        >
          {el.text}
        </span>
      ) : null
    case "buttonGroup":
      return <ButtonGroupElement buttons={el.buttons} slide={slide} event={event} centered={centered} />
    case "countdown":
      return event.start_date ? <InlineCountdown to={event.start_date} centered={centered} /> : null
    case "socialHandles":
      return <InlineSocialHandles handles={socialHandles} centered={centered} />
    case "primaryMedia":
    case "secondaryMedia": {
      const url = el.url ?? ""
      const alt = el.alt ?? ""
      if (!url) return null
      if (el.mediaKind === "video") {
        return <video src={url} autoPlay muted loop playsInline className="mt-4 max-h-72 w-auto rounded-lg" />
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={parseFocalPoint(url).src} alt={alt} className={`mt-4 max-h-72 w-auto rounded-lg ${centered ? "mx-auto" : ""}`} />
      )
    }
    case "dateTime":
      return <DateTimeElement el={el as HeroElement} event={event} centered={centered} fmtDate={fmtDate} />
    case "venue":
      return event.venue ? (
        <div className={`mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/85 ${centered ? "justify-center" : ""}`}>
          <MapPin size={13} /> {event.venue}
        </div>
      ) : null
  }
}

/* ── ITEM 3 / ITEM 4 — Event Name with formatting ──────────────── */
function EventNameElement({
  text, format, centered, logo,
}: {
  text: string
  format?: EventNameFormat
  centered: boolean
  logo: string | null
}) {
  const f = format ?? {}
  const cls = [
    "text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.05]",
    centered ? "max-w-4xl mx-auto" : "max-w-4xl",
    f.bold === false ? "" : "font-bold",
    f.italic ? "italic" : "",
    f.underline ? "underline" : "",
    f.strikethrough ? "line-through" : "",
  ].filter(Boolean).join(" ")
  const transformCls = {
    none: "",
    uppercase: "uppercase",
    lowercase: "lowercase",
    capitalize: "capitalize",
  }[f.textTransform ?? "none"]
  const alignCls = f.textAlign === "right" ? "text-right" : f.textAlign === "center" ? "text-center" : f.textAlign === "left" ? "text-left" : ""
  const style: CSSProperties = {
    ...sfFont,
    ...(f.textColor ? { color: f.textColor } : {}),
    ...(f.textBackground ? { backgroundColor: f.textBackground, padding: "0.05em 0.2em" } : {}),
    ...(typeof f.lineHeight === "number" ? { lineHeight: f.lineHeight } : {}),
    ...(typeof f.letterSpacing === "number" ? { letterSpacing: `${f.letterSpacing}px` } : {}),
  }
  const titleNode = f.link ? (
    <Link href={f.link} className={`${cls} ${transformCls} ${alignCls}`} style={style}>{text}</Link>
  ) : (
    <h1 className={`${cls} ${transformCls} ${alignCls}`} style={style}>{text}</h1>
  )

  if (f.listType === "ordered") return <ol className="list-decimal list-inside">{<li>{titleNode}</li>}</ol>
  if (f.listType === "bullet")  return <ul className="list-disc list-inside">{<li>{titleNode}</li>}</ul>
  return (
    <>
      {logo && (() => {
        const { src } = parseFocalPoint(logo)
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className={`h-14 sm:h-16 w-auto mb-6 drop-shadow-md ${centered ? "mx-auto" : ""}`} />
        )
      })()}
      {titleNode}
    </>
  )
}

function formatToStyle(format?: EventNameFormat): CSSProperties {
  if (!format) return {}
  return {
    ...(format.textColor ? { color: format.textColor } : {}),
    ...(format.textBackground ? { backgroundColor: format.textBackground } : {}),
    ...(typeof format.lineHeight === "number" ? { lineHeight: format.lineHeight } : {}),
    ...(typeof format.letterSpacing === "number" ? { letterSpacing: `${format.letterSpacing}px` } : {}),
    ...(format.textTransform && format.textTransform !== "none" ? { textTransform: format.textTransform as CSSProperties["textTransform"] } : {}),
    ...(format.textAlign ? { textAlign: format.textAlign as CSSProperties["textAlign"] } : {}),
  }
}

/* ── ITEM 3.5 — Button Group ────────────────────────────────────── */
function ButtonGroupElement({
  buttons, slide, event, centered,
}: {
  buttons?: HeroElementButton[]
  slide: HeroSlide
  event: EventShape
  centered: boolean
}) {
  // Backwards compat: if buttons is empty/missing, fall back to the
  // legacy ctaPrimary/ctaSecondary pair.
  const list: HeroElementButton[] = (buttons ?? []).filter((b) => b.label)
  const fallback: HeroElementButton[] = []
  if (list.length === 0) {
    if (slide.ctaPrimaryLabel && slide.ctaPrimaryUrl) {
      fallback.push({ id: "p", label: slide.ctaPrimaryLabel, type: "url", url: slide.ctaPrimaryUrl, style: "primary" })
    }
    if (slide.ctaSecondaryLabel && slide.ctaSecondaryUrl) {
      fallback.push({ id: "s", label: slide.ctaSecondaryLabel, type: "url", url: slide.ctaSecondaryUrl, style: "outline" })
    }
  }
  const final = list.length > 0 ? list : fallback
  if (final.length === 0) return null
  return (
    <div className={`mt-8 flex flex-wrap items-center gap-3 ${centered ? "justify-center" : ""}`}>
      {final.map((b) => {
        const href = b.type === "anchor" && b.anchor
          ? `#${b.anchor.replace(/^#/, "")}`
          : b.type === "register"
            ? `/events/${event.slug}/register`
            : b.url ?? "#"
        const cls =
          b.style === "primary"
            ? "inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[#1a1a2e] text-sm font-bold transition-colors hover:brightness-95"
            : b.style === "secondary"
              ? "inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/15 text-sm font-bold"
              : "inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white border-2 border-white/80 text-sm font-bold hover:bg-white/10 transition-colors"
        const style: CSSProperties | undefined = b.style === "primary"
          ? { backgroundColor: "var(--lf-primary, #e7ab1c)" }
          : undefined
        return (
          <Link
            key={b.id}
            href={resolveUrl(href, event.slug)}
            target={urlIsExternal(href) ? "_blank" : undefined}
            rel={urlIsExternal(href) ? "noopener noreferrer" : undefined}
            className={cls}
            style={style}
          >
            {b.label}
            {b.style === "primary" && <ChevronRightIcon size={14} />}
          </Link>
        )
      })}
    </div>
  )
}

/* ── ITEM 5 — Date/Time element with size + format + icon style ── */
function DateTimeElement({
  el, event, centered, fmtDate,
}: {
  el: HeroElement
  event: EventShape
  centered: boolean
  fmtDate: (s: string, e: string | null) => string
}) {
  if (!event.start_date) return null
  const showDate = el.showDate !== false
  const showTime = el.showTime !== false
  const showVenue = el.showVenue !== false
  const widget = el.widgetSize ?? "md"
  const sizeCls =
    widget === "sm" ? "text-[11px]" :
    widget === "lg" ? "text-[14px]" :
    widget === "xl" ? "text-[16px]" : "text-[12px]"
  const iconSize =
    widget === "sm" ? 11 :
    widget === "lg" ? 14 :
    widget === "xl" ? 16 : 13
  const iconStyle = el.iconStyle ?? "outline"
  const iconStrokeWidth = iconStyle === "minimal" ? 1 : iconStyle === "solid" ? 2.4 : 1.6
  const showIcon = iconStyle !== "none"

  const dateStr = (() => {
    if (!showDate) return ""
    const start = new Date(event.start_date)
    if (el.formatType === "iso") return start.toISOString().slice(0, 10)
    if (el.formatType === "long") {
      const opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      return start.toLocaleDateString("en-IN", opts)
    }
    // ITEM 5 — US (MM/DD/YYYY) + EU (DD/MM/YYYY) date formats.
    // Use en-US and en-GB locales rather than en-IN so the slash format
    // matches the spec's region (en-IN renders DD/MM/YYYY by default
    // which is fine for EU but not US).
    if (el.formatType === "us") {
      return start.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    }
    if (el.formatType === "eu") {
      return start.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    }
    return fmtDate(event.start_date, event.end_date)
  })()
  const timeStr = showTime
    ? new Date(event.start_date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    : ""

  const color = el.textColor || "var(--lf-primary, #e7ab1c)"
  return (
    <div
      className={`flex flex-wrap items-center gap-3 font-semibold uppercase tracking-[0.22em] mb-4 ${sizeCls} ${centered ? "justify-center" : ""}`}
      style={{ color }}
    >
      {showDate && (
        <span className="inline-flex items-center gap-1.5">
          {showIcon && <Calendar size={iconSize} strokeWidth={iconStrokeWidth} fill={iconStyle === "solid" ? "currentColor" : "none"} />}
          {dateStr}
        </span>
      )}
      {showTime && timeStr && (
        <>
          {showDate && <span className="opacity-40">·</span>}
          <span className="inline-flex items-center gap-1.5">
            {showIcon && <Calendar size={iconSize} strokeWidth={iconStrokeWidth} />}
            {timeStr}
          </span>
        </>
      )}
      {showVenue && event.venue && (
        <>
          {(showDate || showTime) && <span className="opacity-40">·</span>}
          <span className="inline-flex items-center gap-1.5">
            {showIcon && <MapPin size={iconSize} strokeWidth={iconStrokeWidth} fill={iconStyle === "solid" ? "currentColor" : "none"} />}
            {event.venue}
          </span>
        </>
      )}
    </div>
  )
}

/* ── Inline countdown / social handles (extracted from blocks.tsx) ── */
function InlineCountdown({ to, centered }: { to: string; centered: boolean }) {
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const target = new Date(to).getTime()
  const ms = Math.max(0, target - now)
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  const secs = Math.floor((ms % 60_000) / 1000)
  const cell = (n: number, label: string) => (
    <div className="flex flex-col items-center min-w-[56px] sm:min-w-[64px] px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15">
      <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">{String(n).padStart(2, "0")}</span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/65">{label}</span>
    </div>
  )
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-2.5 ${centered ? "justify-center" : ""}`}>
      {cell(days, "Days")}{cell(hours, "Hrs")}{cell(mins, "Min")}{cell(secs, "Sec")}
    </div>
  )
}

function InlineSocialHandles({
  handles, centered,
}: {
  handles: SocialHandles
  centered: boolean
}) {
  const links: Array<{ key: string; href: string; label: string }> = []
  if (handles.twitter)   links.push({ key: "tw", href: handles.twitter,   label: "X / Twitter" })
  if (handles.linkedin)  links.push({ key: "li", href: handles.linkedin,  label: "LinkedIn" })
  if (handles.instagram) links.push({ key: "ig", href: handles.instagram, label: "Instagram" })
  if (handles.facebook)  links.push({ key: "fb", href: handles.facebook,  label: "Facebook" })
  if (handles.youtube)   links.push({ key: "yt", href: handles.youtube,   label: "YouTube" })
  if (handles.website)   links.push({ key: "ww", href: handles.website,   label: "Website" })
  if (links.length === 0) return null
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-2.5 ${centered ? "justify-center" : ""}`}>
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 text-white text-[10px] font-bold uppercase"
        >
          {l.key.toUpperCase()}
        </a>
      ))}
    </div>
  )
}

/* ── ITEM 6.1 — Arrow chrome variants ─────────────────────────────
 *
 * Inline SVG paths per design — no lucide dependency for the chevron
 * itself, so each variant can stamp its own stroke / fill / decoration.
 */
function ArrowSvg({
  direction, design, size, color,
}: {
  direction: "prev" | "next"
  design: NonNullable<SliderControls["arrowDesign"]>
  size: number
  color: string
}) {
  // The "stroke" design inverts the path inside a soft pill — chevron
  // is rendered as a simple stroked V rotated 90° per direction.
  const half = size / 2
  // Chevron path traced from (-0.4 size, -0.5 size) → (0.4 size, 0) →
  // (-0.4 size, 0.5 size). Drawn relative to the centre then flipped
  // horizontally for the "prev" direction.
  const x1 = direction === "prev" ?  half * 0.4 : -half * 0.4
  const x2 = direction === "prev" ? -half * 0.4 :  half * 0.4
  const x3 = direction === "prev" ?  half * 0.4 : -half * 0.4
  const path = `M${x1},-${half * 0.5} L${x2},0 L${x3},${half * 0.5}`
  const strokeWidth = design === "filled" || design === "filled-box" ? 2.5 : 2
  const stroke = design === "filled" || design === "filled-box" ? "#1a1a2e" : color
  return (
    <svg
      width={size}
      height={size}
      viewBox={`-${half} -${half} ${size} ${size}`}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

function ArrowButton({
  direction, onClick, design, size, color,
}: {
  direction: "prev" | "next"
  onClick: () => void
  design: NonNullable<SliderControls["arrowDesign"]>
  size: number
  color: string
}) {
  const sideCls = direction === "prev" ? "left-3 sm:left-6" : "right-3 sm:right-6"
  const aria = `${direction === "prev" ? "Previous" : "Next"} slide`
  const arrow = <ArrowSvg direction={direction} design={design} size={size} color={color} />

  if (design === "filled") {
    return (
      <button
        type="button"
        aria-label={aria}
        onClick={onClick}
        className={`absolute ${sideCls} top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors`}
        style={{ backgroundColor: color }}
      >
        {arrow}
      </button>
    )
  }
  if (design === "filled-box") {
    return (
      <button
        type="button"
        aria-label={aria}
        onClick={onClick}
        className={`absolute ${sideCls} top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-10 h-10 rounded-md transition-colors`}
        style={{ backgroundColor: color }}
      >
        {arrow}
      </button>
    )
  }
  if (design === "stroke-circle") {
    return (
      <button
        type="button"
        aria-label={aria}
        onClick={onClick}
        className={`absolute ${sideCls} top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-10 h-10 rounded-full border-2 hover:bg-white/10 transition-colors`}
        style={{ borderColor: color, color }}
      >
        {arrow}
      </button>
    )
  }
  // stroke (default) — soft pill with no border.
  return (
    <button
      type="button"
      aria-label={aria}
      onClick={onClick}
      className={`absolute ${sideCls} top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors`}
      style={{ color }}
    >
      {arrow}
    </button>
  )
}

/* ── ITEM 6.2 — Navigator variants ────────────────────────────── */
function Navigator({
  style, count, selectedIdx, onJump,
}: {
  style: NonNullable<SliderControls["navigatorStyle"]>
  count: number
  selectedIdx: number
  onJump: (i: number) => void
}) {
  // ITEM 6.2 — "numbers" renders a single "X / Y" counter (per spec)
  // rather than a row of per-slide buttons. Click jumps to the next
  // slide; aria-live keeps a screen reader updated.
  if (style === "numbers") {
    return (
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2 px-4">
        <button
          type="button"
          onClick={() => onJump((selectedIdx + 1) % count)}
          aria-label={`Slide ${selectedIdx + 1} of ${count} — click for next`}
          aria-live="polite"
          className="inline-flex items-center justify-center min-w-[64px] h-8 px-3 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-[12px] font-bold tabular-nums"
        >
          {String(selectedIdx + 1).padStart(2, "0")}
          <span className="opacity-50 mx-1.5">/</span>
          {String(count).padStart(2, "0")}
        </button>
      </div>
    )
  }
  return (
    <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2 px-4">
      {Array.from({ length: count }).map((_, i) => {
        const active = i === selectedIdx
        if (style === "dashes") {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1 rounded transition-all ${active ? "w-12 bg-white" : "w-6 bg-white/40 hover:bg-white/70"}`}
            />
          )
        }
        if (style === "lines") {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-0.5 rounded transition-all ${active ? "w-14 bg-white" : "w-7 bg-white/30 hover:bg-white/60"}`}
            />
          )
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all ${active ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}`}
          />
        )
      })}
    </div>
  )
}

/* ── ITEM 3.5 — back-compat: legacy → elements[] ─────────────────── */
function resolveElements(slide: HeroSlide): HeroElement[] {
  if (Array.isArray(slide.elements) && slide.elements.length > 0) return slide.elements
  // Materialise the canonical default order, then thread the slide's
  // legacy fields through (title → eventName.text, subtitle →
  // shortDescription.text, CTAs → buttonGroup.buttons).
  const out = buildDefaultElements(slide.id ? `el-${slide.id}` : "el")
  for (const el of out) {
    if (el.kind === "eventName" && slide.title) el.text = slide.title
    if (el.kind === "shortDescription" && slide.subtitle) el.text = slide.subtitle
    if (el.kind === "buttonGroup") {
      const buttons: typeof el.buttons = []
      if (slide.ctaPrimaryLabel && slide.ctaPrimaryUrl) {
        buttons.push({ id: "p", label: slide.ctaPrimaryLabel, type: "url", url: slide.ctaPrimaryUrl, style: "primary" })
      }
      if (slide.ctaSecondaryLabel && slide.ctaSecondaryUrl) {
        buttons.push({ id: "s", label: slide.ctaSecondaryLabel, type: "url", url: slide.ctaSecondaryUrl, style: "outline" })
      }
      // Only override the canonical default Register button when the
      // slide actually carries legacy CTAs — otherwise keep the default.
      if (buttons.length > 0) el.buttons = buttons
    }
  }
  return out
}
