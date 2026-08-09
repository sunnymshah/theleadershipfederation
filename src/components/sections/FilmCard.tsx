'use client';

import Image from 'next/image';
import { useState } from 'react';

import { PlayIcon } from '@/components/ui/Icon';
import type { Film } from '@/data/films';

const EMBED_SRC: Record<Film['provider'], (id: string) => string> = {
  youtube: (id) =>
    `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0`,
};

/**
 * Inline event-film player.
 *
 * The iframe is only mounted after an explicit click (a facade), so the page
 * never ships a third-party player to visitors who do not press play. A film
 * with no id yet renders as a poster with a "film in post-production" state
 * rather than an empty embed.
 */
export function FilmCard({ film }: { film: Film }) {
  const [playing, setPlaying] = useState(false);
  const published = film.id.length > 0;

  return (
    <article className="group">
      <div className="hairline-glass relative aspect-video w-full overflow-hidden p-2">
        {playing && published ? (
          <iframe
            src={EMBED_SRC[film.provider](film.id)}
            title={film.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={film.poster.src}
              alt={film.poster.alt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-obsidian/25" />

            {published ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center focus-visible:outline-none"
                aria-label={`Play ${film.title}`}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <PlayIcon className="ml-1 h-6 w-6" />
                </span>
              </button>
            ) : (
              <div className="absolute inset-0 flex items-end p-5">
                <span className="label-caps bg-obsidian px-3 py-2 text-white/90">
                  Film in post-production
                </span>
              </div>
            )}

            <span className="label-caps absolute right-4 top-4 bg-obsidian/80 px-2 py-1.5 text-white/90">
              {film.runtime}
            </span>
          </div>
        )}
      </div>

      <p className="label-caps mt-5 text-terracotta">{film.eyebrow}</p>
      <h3 className="mt-3 font-serif text-2xl text-obsidian md:text-3xl">
        {film.title}
      </h3>
      <p className="mt-3 max-w-sm text-sm font-light leading-relaxed text-obsidian/70">
        {film.description}
      </p>
    </article>
  );
}
