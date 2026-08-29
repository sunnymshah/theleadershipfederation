import { ArrowForwardIcon } from '@/components/ui/Icon';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { EDITIONS } from '@/data/editions';
import { LEADERS } from '@/data/leaders';
import { SPONSORS } from '@/data/sponsors';
import { JURY } from '@/data/board';
import { HUBS } from '@/data/programmes';

/**
 * The plain-English answer to "what is this?", placed immediately under the
 * hero — the editorial display line sets a tone, but a first-time visitor
 * needs the sentence before they will scroll past it.
 *
 * Every figure is derived from the data files rather than typed, so the
 * numbers can never drift from what the rest of the page shows.
 */
const nextUp = EDITIONS.find((e) => e.status === 'Upcoming');

const PILLARS = [
  {
    verb: 'We convene',
    stat: `${EDITIONS.length}`,
    statLabel: 'programmes',
    detail:
      'Conclaves, sector summits and closed-door round tables across every hub where global capability actually sits.',
  },
  {
    verb: 'We recognise',
    stat: `${JURY.length}`,
    statLabel: 'jury members',
    detail:
      'Awards scored blind against evidence, not narrative — judged by operators who have carried the mandate themselves.',
  },
  {
    verb: 'We connect',
    stat: `${LEADERS.length}`,
    statLabel: 'leaders on stage',
    detail:
      'An invitation-only circle that keeps the same conversation running between events, not just during them.',
  },
];

export function WhatWeDo() {
  return (
    <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
      <Reveal>
        <Eyebrow index="02">What we do</Eyebrow>

        <p className="mt-8 max-w-4xl font-serif text-3xl font-medium leading-[1.25] tracking-tight text-obsidian md:text-4xl lg:text-[44px]">
          The Leadership Federation puts the people who run{' '}
          <span className="italic text-terracotta/90">
            Global Capability Centres
          </span>{' '}
          — and the CXOs, policymakers and enterprises around them — in rooms
          sized for candour, across{' '}
          <span className="italic text-terracotta/90">{HUBS.length} hubs</span>{' '}
          worldwide.
        </p>

        <div className="mt-8 h-[2px] w-24 bg-champagne" />
      </Reveal>

      {/* Three pillars — the whole business in one scan. */}
      <div className="mt-16 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-3">
        {PILLARS.map((pillar, index) => (
          <Reveal
            key={pillar.verb}
            delay={index * 0.08}
            className="bg-white/45 p-9 backdrop-blur-sm md:p-11"
          >
            <p className="label-caps text-terracotta">{pillar.verb}</p>
            <p className="mt-6 flex items-baseline gap-3">
              <span className="font-serif text-5xl leading-none text-obsidian md:text-6xl">
                {pillar.stat}
              </span>
              <span className="label-caps text-obsidian/45">
                {pillar.statLabel}
              </span>
            </p>
            <p className="mt-6 text-sm font-light leading-relaxed text-obsidian/70">
              {pillar.detail}
            </p>
          </Reveal>
        ))}
      </div>

      {/* The single most useful thing on the page: what's next, and where. */}
      {nextUp && (
        <Reveal delay={0.1} className="mt-4">
          <a
            href={nextUp.href}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-6 bg-obsidian p-8 transition-colors hover:bg-[#161616] md:flex-row md:items-center md:justify-between md:p-11"
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-10">
              <span className="label-caps shrink-0 text-champagne">
                Next in the calendar
              </span>
              <span>
                <span className="block font-serif text-2xl leading-tight text-white md:text-3xl">
                  {nextUp.title}
                </span>
                <span className="label-caps mt-2 block text-white/55">
                  {nextUp.city} · {nextUp.date} · {nextUp.kind}
                </span>
              </span>
            </div>

            <span className="label-caps flex shrink-0 items-center gap-3 text-white/70 transition-colors group-hover:text-champagne">
              Registration open
              <ArrowForwardIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        </Reveal>
      )}

      <Reveal delay={0.15}>
        <p className="label-caps mt-8 flex flex-wrap gap-x-8 gap-y-3 text-obsidian/40">
          <span>{SPONSORS.length} partner brands</span>
          <span>{HUBS.length} global hubs</span>
          <span>{EDITIONS.filter((e) => e.status === 'Upcoming').length} programmes open</span>
        </p>
      </Reveal>
    </section>
  );
}
