import Image from 'next/image';

import { PillLink } from '@/components/ui/PillLink';
import { RevealOnMount } from '@/components/ui/Reveal';
import { IMAGES } from '@/data/images';
import { PRIMARY_CTA, STAGE_METRICS } from '@/config/site';

/**
 * The editorial hero — transcribed from the theme export.
 *
 * Three corrections to the source markup, all of them below 2xl:
 *   • `whitespace-nowrap` + 80px type only engages from 2xl, where the
 *     six-column track is finally wide enough (~644px) to carry the longest
 *     line. In the source it engaged at lg, where the column is 516px — the
 *     display line overflowed straight across the collage.
 *   • the top drop grows to clear the absolute nav; the source's 160px let
 *     the eyebrow ride up under the logo.
 *   • the collage gets an explicit height on small screens, since the source
 *     relies on `h-full` inside an `items-center` grid row.
 * Rendering at 2xl and above is unchanged.
 */
export function Hero() {
  return (
    <main className="relative mx-auto flex min-h-[56.25vw] w-full max-w-canvas flex-col justify-between px-8 pb-16 pr-24 pt-[172px] md:px-16 md:pr-[120px] lg:pt-[200px] 2xl:pt-[160px]">
      <div className="relative grid flex-grow grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-16">
        {/* ── Left: typography ─────────────────────────────────────────── */}
        <div className="relative z-20 lg:col-span-6 2xl:-mt-12">
          <div className="absolute -left-4 -top-4 h-2 w-2 bg-champagne" />

          <RevealOnMount>
            <p className="label-caps mb-8 flex items-center text-terracotta">
              <span className="mr-4 h-[1px] w-8 bg-terracotta" />
              01 / Perspectives
            </p>
          </RevealOnMount>

          <RevealOnMount delay={0.1}>
            <h1 className="relative mb-10 font-serif text-[52px] font-medium leading-[1.0] tracking-tighter text-obsidian sm:text-6xl md:text-7xl lg:text-[60px] xl:text-[68px] 2xl:-top-4 2xl:whitespace-nowrap 2xl:text-[80px] min-[1800px]:text-[90px]">
              <span className="block pr-8 italic text-terracotta/90">Global</span>
              platform
              <br />
              for GCC leaders
              <br />
              &amp; executive
              <br />
              <span className="relative z-10">
                decision makers.
                <span className="absolute -bottom-2 left-0 h-[3px] w-32 bg-obsidian" />
              </span>
            </h1>
          </RevealOnMount>

          <RevealOnMount delay={0.2}>
            <div className="mt-12 grid grid-cols-1 items-start gap-8 sm:grid-cols-2">
              <div className="relative border-l border-obsidian/20 pl-6">
                <p className="font-sans text-lg font-light leading-relaxed text-obsidian/80">
                  Over 500 decision-makers. 14 global hubs. High-conviction
                  platforms for leadership transformation.
                </p>
              </div>
              <div>
                <h2 className="mb-3 font-serif text-2xl italic text-obsidian">
                  Shaping narratives
                </h2>
                <p className="font-sans text-sm font-light leading-relaxed text-obsidian/70">
                  Curated dialogues that redefine the boundaries of global
                  leadership and executive strategy across emerging markets.
                </p>
              </div>
            </div>
          </RevealOnMount>

          <RevealOnMount delay={0.3}>
            <div className="mt-12">
              <PillLink href={PRIMARY_CTA.href}>Join the Inner Circle</PillLink>
            </div>
          </RevealOnMount>

          {/* Scroll indicator — sits in the left margin gutter. */}
          <div className="pointer-events-none absolute -left-12 bottom-0 hidden flex-col items-center lg:-bottom-24 lg:flex">
            <span className="label-caps mb-8 -rotate-90 whitespace-nowrap text-obsidian/40">
              Scroll
            </span>
            <div className="relative h-16 w-[1px] overflow-hidden bg-obsidian/20">
              <div className="scroll-indicator h-8 w-full bg-terracotta" />
            </div>
          </div>
        </div>

        {/* ── Right: asymmetric collage ────────────────────────────────── */}
        <div className="relative h-[520px] w-full sm:h-[620px] lg:col-span-6 lg:h-full lg:min-h-[600px]">
          <div className="relative z-10 grid h-full grid-cols-2 gap-4">
            {/* Every frame is above the fold, so none of them lazy-load. */}
            <div className="flex h-full flex-col gap-4">
              <CollageFrame image={IMAGES.conferenceHall} className="flex-grow" />
              <CollageFrame image={IMAGES.workingSession} className="h-1/3" />
            </div>

            <div className="flex h-full flex-col gap-4 pt-16">
              <CollageFrame image={IMAGES.stageMic} className="h-1/4" />
              <CollageFrame image={IMAGES.audience} className="flex-grow" />
              <CollageFrame image={IMAGES.boardroom} className="h-1/4" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Proof strip ─────────────────────────────────────────────────── */}
      <div className="label-caps mt-12 flex w-full flex-col items-center justify-between border-t border-obsidian/20 pt-6 text-obsidian/80 md:flex-row">
        {STAGE_METRICS.map((metric, index) => (
          <div key={metric.label} className="contents">
            {index > 0 && (
              <span className="hidden h-1.5 w-1.5 rounded-full bg-terracotta md:inline-block" />
            )}
            <span className="mb-4 md:mb-0">
              {metric.value} {metric.label}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}

const TREATMENT_CLASS = {
  'full-colour': '',
  sepia: 'sepia-[0.35]',
  grayscale: 'grayscale',
} as const;

function CollageFrame({
  image,
  className,
}: {
  image: { src: string; alt: string; treatment?: keyof typeof TREATMENT_CLASS };
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden shadow-lg ${className ?? ''}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 1024px) 50vw, 25vw"
        priority
        className={`object-cover ${
          TREATMENT_CLASS[image.treatment ?? 'full-colour']
        }`}
      />
    </div>
  );
}
