'use client';

import { useMemo, useState } from 'react';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { EDITIONS, EDITION_KINDS } from '@/data/editions';
import { cn } from '@/lib/utils';

/**
 * "Every edition. One growing platform." — the full run of programmes, newest
 * first, filterable by format. Each row links to its official event page.
 */
export function EditionsTimeline() {
  const [kind, setKind] = useState('All');

  const rows = useMemo(
    () => (kind === 'All' ? EDITIONS : EDITIONS.filter((e) => e.kind === kind)),
    [kind]
  );

  const upcoming = EDITIONS.filter((e) => e.status === 'Upcoming').length;

  return (
    <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
      <Reveal>
        <Eyebrow index="07">The record</Eyebrow>
        <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-2xl font-serif text-4xl font-medium leading-[1.05] tracking-tight text-obsidian md:text-5xl lg:text-6xl">
            Every edition.
            <span className="block italic text-terracotta/90">
              One growing platform.
            </span>
          </h2>
          <p className="label-caps text-obsidian/50 lg:mb-3">
            {EDITIONS.length} editions · {upcoming} upcoming
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-12 flex flex-wrap gap-2">
          {EDITION_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={cn(
                'label-caps rounded-full border px-5 py-2.5 transition-colors duration-300',
                kind === k
                  ? 'border-obsidian bg-obsidian text-white'
                  : 'border-obsidian/20 text-obsidian/60 hover:border-obsidian/50 hover:text-obsidian'
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <ul className="mt-12 border-t border-obsidian/15">
          {rows.map((edition) => (
            <li key={edition.index} className="border-b border-obsidian/15">
              <a
                href={edition.href}
                target="_blank"
                rel="noreferrer"
                className="group grid grid-cols-1 items-baseline gap-x-6 gap-y-3 py-7 transition-colors hover:bg-white/40 sm:grid-cols-12 sm:px-2"
              >
                <span className="label-caps text-obsidian/25 sm:col-span-1">
                  {edition.index}
                </span>

                <div className="sm:col-span-5">
                  <p className="label-caps text-terracotta">{edition.kind}</p>
                  <h3 className="mt-2 font-serif text-xl leading-tight text-obsidian transition-colors group-hover:text-terracotta md:text-2xl">
                    {edition.title}
                  </h3>
                </div>

                <div className="sm:col-span-3">
                  <p className="font-serif text-lg italic text-obsidian">
                    {edition.city}
                  </p>
                  <p className="label-caps mt-1 text-obsidian/45">
                    {edition.date}
                  </p>
                </div>

                <span
                  className={cn(
                    'label-caps sm:col-span-2',
                    edition.status === 'Upcoming'
                      ? 'text-terracotta'
                      : 'text-obsidian/40'
                  )}
                >
                  {edition.status}
                </span>

                <span className="text-obsidian/30 transition-all group-hover:translate-x-1 group-hover:text-terracotta sm:col-span-1 sm:justify-self-end">
                  <ArrowForwardIcon className="h-5 w-5" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
