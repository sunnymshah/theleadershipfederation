import Image from 'next/image';
import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { PartnerMarquee } from '@/components/sections/PartnerMarquee';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { IMAGES } from '@/data/images';
import { HUBS } from '@/data/programmes';
import { STAGE_METRICS } from '@/config/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The Leadership Federation is a global platform connecting GCC leaders, CXOs, policymakers and enterprise solution providers across fourteen hubs.',
};

const PRINCIPLES = [
  {
    title: 'Continuity between programmes',
    detail:
      'Most of the value sits in what carries from one programme to the next, which is why membership and programming are run as a single system.',
  },
  {
    title: 'Chaired by operators',
    detail:
      'Sessions are chaired and awards judged by people who have run centres themselves. Analysts take part, but the agenda is set by practitioners.',
  },
  {
    title: 'Deliberately small rooms',
    detail:
      'Capacity is set by format. A table of fourteen gets into detail that a hall of four hundred cannot.',
  },
  {
    title: 'Evidence first',
    detail:
      'Claims that cannot be measured are not programmed on the main stage and do not advance with the jury.',
  },
];

export default function AboutPage() {
  return (
    <PageShell
      index="03"
      eyebrow="The federation"
      title="A platform for"
      italic="global capability."
      standfirst="The Leadership Federation brings together the people accountable for global capability, and keeps them connected between programmes."
      meta={STAGE_METRICS.map((m) => `${m.value} ${m.label}`)}
    >
      {/* ── Thesis ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionHeading
            index="04"
            eyebrow="Thesis"
            title="Capability outgrew"
            italic="the forum."
            standfirst="Global Capability Centres stopped being back offices somewhere around the point they started owning product, risk and P&L. The convening infrastructure around their leadership never caught up."
          />
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-xl text-base font-light leading-relaxed text-obsidian/70">
              The federation exists to close that gap: to put centre heads,
              group CXOs, policymakers and the enterprises that serve them in
              the same rooms, across the hubs where the work happens.
            </p>
          </Reveal>
        </div>

        <div className="lg:col-span-6">
          <Reveal delay={0.15}>
            <div className="hairline-glass relative aspect-[4/5] w-full p-2">
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={IMAGES.audience.src}
                  alt={IMAGES.audience.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <span className="absolute bottom-6 left-0 bg-obsidian px-5 py-3 font-serif text-lg italic text-white">
                Hyderabad, 2026
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Principles ─────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="05"
          eyebrow="Principles"
          title="How we"
          italic="work."
        />

        <div className="mt-16 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-2">
          {PRINCIPLES.map((principle, index) => (
            <Reveal
              key={principle.title}
              delay={index * 0.08}
              className="bg-white/40 p-10 backdrop-blur-sm md:p-12"
            >
              <span className="label-caps text-terracotta">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 font-serif text-3xl leading-tight text-obsidian">
                {principle.title}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
                {principle.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Hubs ───────────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="06"
          eyebrow="Footprint"
          title="Fourteen hubs"
          italic="on the map."
          standfirst="Programming follows the capability map. Every hub carries at least one convening a year."
        />

        <Reveal className="mt-16">
          <ul className="grid grid-cols-2 border-l border-t border-obsidian/10 sm:grid-cols-3 lg:grid-cols-4">
            {HUBS.map((hub, index) => (
              <li
                key={hub}
                className="group flex items-baseline gap-3 border-b border-r border-obsidian/10 px-5 py-7 transition-colors hover:bg-white/40"
              >
                <span className="label-caps text-obsidian/25">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-serif text-xl text-obsidian transition-colors group-hover:text-terracotta">
                  {hub}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ── Partners ───────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="07"
          eyebrow="Partners"
          title="Enterprises on"
          italic="our stages."
        />
        <div className="mt-14 -mx-8 md:-mx-16">
          <PartnerMarquee />
        </div>
        <Reveal delay={0.2} className="mt-14">
          <PillLink href="/inquire" variant="outline">
            Partnership enquiries
          </PillLink>
        </Reveal>
      </section>
    </PageShell>
  );
}
