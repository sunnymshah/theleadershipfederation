import { ArchiveFilmCard, ReelCard } from '@/components/sections/FilmCard';
import { ArrowForwardIcon } from '@/components/ui/Icon';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import {
  ARCHIVE_FILMS,
  FEATURE_FILMS,
  TESTIMONIAL_REELS,
} from '@/data/films';

/**
 * "Don't take our word for it. See the room." — the motion proof block.
 *
 * Three tiers: linked showreels, self-hosted archive films, and testimonial
 * reels. Nothing heavy loads until it is asked for — the archive films use
 * `preload="none"` behind their poster, and the Instagram embeds are facades
 * that mount their iframe only on click.
 */
export function RoomFilms() {
  return (
    <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
      <Reveal>
        <Eyebrow index="05">Motion proof</Eyebrow>
        <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-2xl font-serif text-4xl font-medium leading-[1.05] tracking-tight text-obsidian md:text-5xl lg:text-6xl">
            Don’t take our word for it.
            <span className="block italic text-terracotta/90">See the room.</span>
          </h2>
          <div className="h-[2px] w-24 bg-champagne lg:mb-4" />
        </div>
      </Reveal>

      {/* ── Tier 1: headline showreels ─────────────────────────────────── */}
      <div className="mt-16 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-2">
        {FEATURE_FILMS.map((film, index) => (
          <Reveal
            key={film.title}
            delay={index * 0.06}
            className="bg-white/45 backdrop-blur-sm"
          >
            <a
              href={film.href}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col justify-between gap-8 p-10 transition-colors hover:bg-white/70 md:p-12"
            >
              <div>
                <p className="label-caps text-terracotta">{film.tag}</p>
                <h3 className="mt-6 font-serif text-2xl leading-tight text-obsidian md:text-3xl">
                  {film.title}
                </h3>
                <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-obsidian/70">
                  {film.blurb}
                </p>
              </div>
              <span className="label-caps flex items-center gap-3 text-obsidian/50 transition-colors group-hover:text-terracotta">
                Watch on LinkedIn
                <ArrowForwardIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          </Reveal>
        ))}
      </div>

      {/* ── Tier 2: archive films ──────────────────────────────────────── */}
      <div className="pt-stack-section">
        <Reveal>
          <Eyebrow>More from the archive</Eyebrow>
          <h3 className="mt-8 font-serif text-3xl leading-tight text-obsidian md:text-4xl">
            Event films, <span className="italic text-terracotta/90">embedded.</span>
          </h3>
          <p className="mt-4 max-w-lg text-sm font-light leading-relaxed text-obsidian/70">
            Films from past conclaves and private formats.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHIVE_FILMS.map((film, index) => (
            <Reveal key={film.title + film.tag} delay={(index % 3) * 0.08}>
              <ArchiveFilmCard film={film} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── Tier 3: testimonial reels ──────────────────────────────────── */}
      <div className="pt-stack-section">
        <Reveal>
          <Eyebrow>In their words</Eyebrow>
          <h3 className="mt-8 font-serif text-3xl leading-tight text-obsidian md:text-4xl">
            Leader <span className="italic text-terracotta/90">testimonials.</span>
          </h3>
          <p className="mt-4 max-w-lg text-sm font-light leading-relaxed text-obsidian/70">
            First-hand reflections from leaders who joined the conversation.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-3xl">
          {TESTIMONIAL_REELS.map((reel, index) => (
            <Reveal key={reel.src} delay={index * 0.08}>
              <ReelCard reel={reel} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
