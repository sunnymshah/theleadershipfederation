import Link from 'next/link';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { INNER_CIRCLE_URL } from '@/config/site';
import { EDITIONS } from '@/data/editions';
import { JURY } from '@/data/board';
import { HUBS } from '@/data/programmes';

/**
 * What the federation actually sells, stated as services rather than mood.
 *
 * A first-time visitor should be able to point at the one row that applies to
 * them and click it. Each service names who it is for, what they get, and
 * where it goes — no abstractions like "we convene".
 */

const nextUp = EDITIONS.find((e) => e.status === 'Upcoming');

type Service = {
  n: string;
  name: string;
  who: string;
  what: string;
  scale: string;
  href: string;
  external?: boolean;
};

const SERVICES: Service[] = [
  {
    n: '01',
    name: 'Conclaves & Summits',
    who: 'For GCC heads and enterprise CXOs',
    what: 'Main-stage programmes on scaling a centre from delivery to ownership — flagship conclaves plus BFSI and AI sector summits.',
    scale: '150–400 delegates',
    href: '/conclaves',
  },
  {
    n: '02',
    name: 'CXO Round Tables',
    who: 'For leaders with one hard problem',
    what: 'Closed-door, non-attributable tables under the Chatham House Rule. One operating question, no vendors, no decks.',
    scale: '12–20 seats',
    href: '/roundtables',
  },
  {
    n: '03',
    name: 'Awards & Recognition',
    who: 'For teams with results they can prove',
    what: 'Submissions scored blind against evidence, transferability and durability by a jury of operators — not a popularity vote.',
    scale: `${JURY.length}-member jury`,
    href: '/advisory-board',
  },
  {
    n: '04',
    name: 'Sponsorship & Speaking',
    who: 'For enterprises selling to this room',
    what: 'Brand presence and a stage slot earned on the same evidence standard as everyone else. Sponsors fund the table; they do not buy the keynote.',
    scale: 'Per programme',
    href: '/register',
  },
  {
    n: '05',
    name: 'The Inner Circle',
    who: 'For senior leaders who want continuity',
    what: 'Invitation-only membership: a standing seat, the full archive, and peer introductions made against a stated need.',
    scale: 'By invitation',
    href: INNER_CIRCLE_URL,
    external: true,
  },
];

export function WhatWeDo() {
  return (
    <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
      <Reveal>
        <Eyebrow index="02">What we do</Eyebrow>

        <p className="mt-8 max-w-4xl font-serif text-3xl font-medium leading-[1.25] tracking-tight text-obsidian md:text-4xl lg:text-[42px]">
          We run the rooms where{' '}
          <span className="italic text-terracotta/90">
            Global Capability Centre
          </span>{' '}
          leadership meets the enterprises, policymakers and peers that shape
          it — across {HUBS.length} hubs worldwide.
        </p>

        <div className="mt-8 h-[2px] w-24 bg-champagne" />
      </Reveal>

      {/* Five services, one row each — scan the "who" column and stop. */}
      <Reveal delay={0.05}>
        <ul className="mt-14 border-t border-obsidian/15">
          {SERVICES.map((service) => {
            const inner = (
              <>
                <span className="label-caps w-8 shrink-0 text-obsidian/25">
                  {service.n}
                </span>

                <span className="min-w-0 flex-1 sm:grid sm:grid-cols-12 sm:items-baseline sm:gap-6">
                  <span className="sm:col-span-4">
                    <span className="block font-serif text-2xl leading-tight text-obsidian transition-colors group-hover:text-terracotta md:text-3xl">
                      {service.name}
                    </span>
                    <span className="label-caps mt-2 block text-terracotta">
                      {service.who}
                    </span>
                  </span>

                  <span className="mt-3 block text-sm font-light leading-relaxed text-obsidian/70 sm:col-span-6 sm:mt-0">
                    {service.what}
                  </span>

                  <span className="label-caps mt-3 block text-obsidian/40 sm:col-span-2 sm:mt-0 sm:text-right">
                    {service.scale}
                  </span>
                </span>

                <ArrowForwardIcon className="mt-1 hidden h-5 w-5 shrink-0 text-obsidian/25 transition-all group-hover:translate-x-1 group-hover:text-terracotta lg:block" />
              </>
            );

            const cls =
              'group flex items-start gap-5 border-b border-obsidian/15 py-7 transition-colors hover:bg-white/40 sm:px-2';

            return (
              <li key={service.n}>
                {service.external ? (
                  <a href={service.href} target="_blank" rel="noreferrer" className={cls}>
                    {inner}
                  </a>
                ) : (
                  <Link href={service.href} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </Reveal>

      {/* The single most actionable thing on the page. */}
      {nextUp && (
        <Reveal delay={0.1} className="mt-10">
          <a
            href={nextUp.href}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-6 bg-obsidian p-8 transition-colors hover:bg-[#161616] md:flex-row md:items-center md:justify-between md:p-11"
          >
            <span className="flex flex-col gap-5 md:flex-row md:items-center md:gap-10">
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
            </span>

            <span className="label-caps flex shrink-0 items-center gap-3 text-white/70 transition-colors group-hover:text-champagne">
              Registration open
              <ArrowForwardIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        </Reveal>
      )}
    </section>
  );
}
