import Image from 'next/image';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { FORMATS } from '@/data/formats';

/**
 * "One community. Five powerful rooms."
 *
 * Redesigned as an editorial index rather than the source site's card row:
 * the first format takes a full-bleed plate because it is the flagship, and
 * the remaining four sit in a hairline grid beneath it. Each row links
 * straight to its live event page.
 */
export function FiveRooms() {
  const [flagship, ...rest] = FORMATS;

  return (
    <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
      <Reveal>
        <Eyebrow index="04">The formats</Eyebrow>
        <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-2xl font-serif text-4xl font-medium leading-[1.05] tracking-tight text-obsidian md:text-5xl lg:text-6xl">
            One community.
            <span className="block italic text-terracotta/90">
              Five powerful rooms.
            </span>
          </h2>
          <p className="max-w-sm text-base font-light leading-relaxed text-obsidian/70">
            Each format is sized for a different kind of conversation. The
            membership carries between them — that is what makes it a
            federation rather than a calendar.
          </p>
        </div>
      </Reveal>

      {/* Flagship — full-bleed plate with the copy overlaid. */}
      <Reveal delay={0.1} className="mt-16">
        <a
          href={flagship.href}
          target="_blank"
          rel="noreferrer"
          className="group relative block aspect-[16/10] w-full overflow-hidden shadow-lg md:aspect-[21/8]"
        >
          <Image
            src={flagship.image.src}
            alt={flagship.image.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 1400px"
            className="object-cover transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian/85 via-obsidian/55 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-14">
            <p className="label-caps text-champagne">
              {flagship.index} · {flagship.scale}
            </p>
            <h3 className="mt-5 max-w-xl font-serif text-3xl leading-tight text-white md:text-5xl">
              {flagship.name}
            </h3>
            <p className="mt-4 max-w-lg text-sm font-light leading-relaxed text-white/75 md:text-base">
              {flagship.detail}
            </p>
            <span className="label-caps mt-7 flex items-center gap-3 text-white/70 transition-colors group-hover:text-champagne">
              {flagship.room}
              <ArrowForwardIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </a>
      </Reveal>

      {/* The other four — hairline grid. */}
      <div className="mt-4 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 sm:grid-cols-2">
        {rest.map((format, index) => (
          <Reveal key={format.index} delay={index * 0.07} className="bg-white/45">
            <a
              href={format.href}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full gap-6 p-8 backdrop-blur-sm transition-colors hover:bg-white/75 md:p-10"
            >
              <div className="relative hidden h-[124px] w-[104px] shrink-0 overflow-hidden shadow-sm sm:block">
                <Image
                  src={format.image.src}
                  alt={format.image.alt}
                  fill
                  sizes="104px"
                  className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="label-caps text-terracotta">
                  {format.index} · {format.scale}
                </p>
                <h3 className="mt-4 font-serif text-2xl leading-tight text-obsidian transition-colors group-hover:text-terracotta">
                  {format.name}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-obsidian/70">
                  {format.detail}
                </p>
                <p className="label-caps mt-5 flex items-center gap-3 border-t border-obsidian/10 pt-4 text-obsidian/45">
                  {format.room}
                  <ArrowForwardIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
