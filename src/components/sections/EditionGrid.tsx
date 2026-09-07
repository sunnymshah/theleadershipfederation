import Image from 'next/image';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { ALL_IMAGES } from '@/data/images';
import type { Edition } from '@/data/editions';

/**
 * Programme cards backed by the real calendar.
 *
 * Replaces a grid fed from hand-written placeholder data, which was rendering
 * events that do not exist. Photography is assigned deterministically by index
 * — the archive has no per-event imagery yet, so a stable rotation is the
 * honest option: it never implies a photograph is of that specific evening.
 */
export function EditionGrid({
  editions,
  columns = 3,
}: {
  editions: Edition[];
  columns?: 2 | 3;
}) {
  if (!editions.length) {
    return (
      <p className="text-sm font-light text-obsidian/55">
        No dates currently scheduled.
      </p>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 ${
        columns === 3 ? 'lg:grid-cols-3' : ''
      }`}
    >
      {editions.map((edition, index) => {
        const image = ALL_IMAGES[index % ALL_IMAGES.length];

        return (
          <Reveal key={edition.index} as="article" delay={(index % 3) * 0.07}>
            <a
              href={edition.href}
              target="_blank"
              rel="noreferrer"
              className="group block"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden shadow-lg">
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
                />
                <span className="absolute bottom-0 left-0 bg-obsidian px-4 py-3 font-serif text-sm italic text-white">
                  {edition.city}
                </span>
                <span className="label-caps absolute right-0 top-0 bg-terracotta px-3 py-2 text-white">
                  {edition.kind}
                </span>
              </div>

              <div className="label-caps mt-6 flex items-center justify-between text-obsidian/50">
                <span>{edition.date}</span>
                <span
                  className={
                    edition.status === 'Upcoming'
                      ? 'text-terracotta'
                      : 'text-obsidian/40'
                  }
                >
                  {edition.status === 'Upcoming' ? 'Registration open' : 'Concluded'}
                </span>
              </div>

              <h3 className="mt-4 flex items-start justify-between gap-4 font-serif text-2xl leading-tight text-obsidian transition-colors group-hover:text-terracotta">
                {edition.title}
                <ArrowForwardIcon className="mt-1 h-5 w-5 shrink-0 text-obsidian/25 transition-all group-hover:translate-x-1 group-hover:text-terracotta" />
              </h3>
            </a>
          </Reveal>
        );
      })}
    </div>
  );
}
