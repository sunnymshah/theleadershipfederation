'use client';

import { useState } from 'react';

import { PlayIcon } from '@/components/ui/Icon';
import type { ArchiveFilm, TestimonialReel } from '@/data/films';

/**
 * Event-film card. The poster is all that loads up front — `preload="none"`
 * means the ~20MB file is only fetched when the visitor presses play. If the
 * publisher's CDN link has expired, the card shows a quiet unavailable state
 * rather than a broken player.
 */
export function ArchiveFilmCard({ film }: { film: ArchiveFilm }) {
  const [failed, setFailed] = useState(false);

  return (
    <article className="group">
      <div className="hairline-glass relative aspect-video w-full overflow-hidden p-2">
        {failed ? (
          <div className="flex h-full w-full items-center justify-center bg-sand-dark/60">
            <span className="label-caps px-4 text-center text-obsidian/50">
              Film unavailable
            </span>
          </div>
        ) : (
          <video
            src={film.src}
            poster={film.poster}
            controls
            preload="none"
            playsInline
            onError={() => setFailed(true)}
            className="h-full w-full bg-obsidian object-cover"
          />
        )}
      </div>

      <p className="label-caps mt-5 text-terracotta">{film.tag}</p>
      <h4 className="mt-3 font-serif text-xl leading-tight text-obsidian">
        {film.title}
      </h4>
    </article>
  );
}

/** Instagram testimonial reel — a facade that mounts its iframe only on click. */
export function ReelCard({ reel }: { reel: TestimonialReel }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <article>
      <div className="hairline-glass relative aspect-[9/13] w-full overflow-hidden p-2">
        {loaded ? (
          <iframe
            src={reel.src}
            title={reel.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full bg-white"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            aria-label={`Load ${reel.title}`}
            className="group flex h-full w-full flex-col items-center justify-center gap-6 bg-obsidian/90 px-6 text-center transition-colors hover:bg-obsidian"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta text-white transition-transform duration-300 group-hover:scale-110">
              <PlayIcon className="ml-1 h-6 w-6" />
            </span>
            <span className="label-caps text-white/70">Play testimonial</span>
          </button>
        )}
      </div>

      <p className="label-caps mt-5 text-terracotta">{reel.tag}</p>
      <h4 className="mt-3 font-serif text-xl leading-tight text-obsidian">
        {reel.title}
      </h4>
    </article>
  );
}
