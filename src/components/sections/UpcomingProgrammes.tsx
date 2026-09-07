import { ArrowForwardIcon } from '@/components/ui/Icon';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { PillLink } from '@/components/ui/PillLink';
import { EDITIONS } from '@/data/editions';

/**
 * The real calendar.
 *
 * This replaces a grid that was rendering invented programmes — an
 * "Enterprise Leadership Summit, Bengaluru, 14 November 2026" that does not
 * exist — directly above the genuine archive. Everything here comes from
 * EDITIONS, which mirrors the live event pages.
 */
export function UpcomingProgrammes() {
  const upcoming = EDITIONS.filter((edition) => edition.status === 'Upcoming');
  if (!upcoming.length) return null;

  const [next, ...rest] = upcoming;

  return (
    <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
      <Reveal>
        <Eyebrow index="03">Next up</Eyebrow>
        <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-2xl font-serif text-4xl font-medium leading-[1.05] tracking-tight text-obsidian md:text-5xl lg:text-6xl">
            Where we are
            <span className="block italic text-terracotta/90">convening next.</span>
          </h2>
          <p className="label-caps text-obsidian/50 lg:mb-3">
            {upcoming.length} programmes open
          </p>
        </div>
      </Reveal>

      {/* The very next date, given its own weight. */}
      <Reveal delay={0.08} className="mt-14">
        <a
          href={next.href}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col gap-8 bg-obsidian p-8 transition-colors hover:bg-[#161616] md:flex-row md:items-end md:justify-between md:p-12"
        >
          <span>
            <span className="label-caps text-champagne">
              {next.kind} · Next date
            </span>
            <span className="mt-5 block max-w-2xl font-serif text-3xl leading-tight text-white md:text-5xl">
              {next.title}
            </span>
            <span className="mt-4 block font-serif text-xl italic text-white/70">
              {next.city}
            </span>
            <span className="label-caps mt-2 block text-white/50">
              {next.date}
            </span>
          </span>

          <span className="label-caps flex shrink-0 items-center gap-3 text-white/70 transition-colors group-hover:text-champagne">
            Registration open
            <ArrowForwardIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </a>
      </Reveal>

      {/* Everything else on the calendar. */}
      {rest.length > 0 && (
        <Reveal delay={0.12}>
          <ul className="mt-4 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((edition) => (
              <li key={edition.index} className="bg-white/50">
                <a
                  href={edition.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col justify-between gap-6 p-7 transition-colors hover:bg-white/80"
                >
                  <span>
                    <span className="label-caps text-terracotta">
                      {edition.kind}
                    </span>
                    <span className="mt-4 block font-serif text-xl leading-tight text-obsidian transition-colors group-hover:text-terracotta">
                      {edition.title}
                    </span>
                  </span>
                  <span className="flex items-end justify-between gap-3">
                    <span>
                      <span className="block font-serif text-lg italic text-obsidian">
                        {edition.city}
                      </span>
                      <span className="label-caps mt-1 block text-obsidian/45">
                        {edition.date}
                      </span>
                    </span>
                    <ArrowForwardIcon className="h-4 w-4 shrink-0 text-obsidian/25 transition-all group-hover:translate-x-1 group-hover:text-terracotta" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      <Reveal delay={0.16} className="mt-12">
        <PillLink href="/register">Register your interest</PillLink>
      </Reveal>
    </section>
  );
}
