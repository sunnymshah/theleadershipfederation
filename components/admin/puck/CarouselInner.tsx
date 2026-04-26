"use client"

/**
 * Thin embla-carousel-react wrapper used by the Carousel block (B20).
 * Lives in its own module so the Embla bundle only loads when a page
 * actually uses a carousel.
 */

import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { resolveUrl, urlIsExternal } from "./UrlPicker"

export type CarouselSlide = {
  image: string
  heading?: string
  body?: string
  ctaLabel?: string
  ctaUrl?: string
}

export function CarouselInner({
  slides,
  autoplay,
  interval,
  eventSlug,
}: {
  slides: CarouselSlide[]
  autoplay?: boolean
  interval?: number
  eventSlug: string
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" })
  const [selectedIdx, setSelectedIdx] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)
    onSelect()
    return () => { emblaApi.off("select", onSelect) }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi || !autoplay) return
    const ms = Math.max(2000, (interval ?? 5) * 1000)
    const t = setInterval(() => {
      if (!emblaApi) return
      if (emblaApi.canScrollNext()) emblaApi.scrollNext()
      else emblaApi.scrollTo(0)
    }, ms)
    return () => clearInterval(t)
  }, [emblaApi, autoplay, interval])

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((s, i) => (
            <div key={i} className="relative shrink-0 grow-0 basis-full">
              <div className="relative aspect-[16/9] bg-[#1a1a2e]">
                {s.image && (
                  <Image src={s.image} alt={s.heading || ""} fill className="object-cover opacity-80" sizes="100vw" />
                )}
                {(s.heading || s.body || (s.ctaLabel && s.ctaUrl)) && (
                  <div className="absolute inset-0 flex flex-col items-start justify-end p-8 md:p-12 bg-gradient-to-t from-black/80 to-transparent text-white">
                    {s.heading && <h3 className="text-2xl md:text-4xl font-bold mb-2 max-w-2xl">{s.heading}</h3>}
                    {s.body && <p className="opacity-85 max-w-xl mb-4">{s.body}</p>}
                    {s.ctaLabel && s.ctaUrl && (
                      <Link
                        href={resolveUrl(s.ctaUrl, eventSlug)}
                        target={urlIsExternal(s.ctaUrl) ? "_blank" : undefined}
                        rel={urlIsExternal(s.ctaUrl) ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-bold text-[#1a1a2e]"
                        style={{ backgroundColor: "var(--lf-primary, #e7ab1c)" }}
                      >
                        {s.ctaLabel}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/85 backdrop-blur text-[#1a1a2e] shadow-lg hover:bg-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/85 backdrop-blur text-[#1a1a2e] shadow-lg hover:bg-white"
          >
            <ChevronRight size={18} />
          </button>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  selectedIdx === i ? "bg-[var(--lf-primary,#e7ab1c)]" : "bg-[#1a1a2e]/20 hover:bg-[#1a1a2e]/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
