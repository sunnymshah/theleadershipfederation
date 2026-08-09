import Image from 'next/image';
import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { BOARD, BOARD_COMPOSITION, JURY_CRITERIA } from '@/data/people';

export const metadata: Metadata = {
  title: 'Advisory Board & Jury',
  description:
    'The operators who set the standards for The Leadership Federation’s programming and score its award submissions.',
};

export default function AdvisoryBoardPage() {
  return (
    <PageShell
      index="04"
      eyebrow="Governance"
      title="Advisory board"
      italic="& jury."
      standfirst="The board sets what earns a place on the stage. The jury decides what earns recognition. Both are staffed by operators who have carried the mandate themselves."
      meta={[`${BOARD_COMPOSITION.length} seat categories`, 'Two-year terms', 'Recused on conflict']}
    >
      {/* ── Members ────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          index="05"
          eyebrow="Membership"
          title="Who sits"
          italic="on it."
        />

        {BOARD.length > 0 ? (
          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {BOARD.map((member, index) => (
              <Reveal key={member.name} as="article" delay={index * 0.06}>
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand-dark shadow-lg">
                  {member.portrait ? (
                    <Image
                      src={member.portrait}
                      alt={member.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover grayscale"
                    />
                  ) : null}
                  <span className="label-caps absolute left-0 top-0 bg-terracotta px-3 py-2 text-white">
                    {member.role === 'jury' ? 'Jury' : 'Board'}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-2xl text-obsidian">
                  {member.name}
                </h3>
                <p className="mt-2 text-sm font-light text-obsidian/70">
                  {member.title}
                </p>
                <p className="label-caps mt-3 text-obsidian/40">
                  {member.organisation}
                </p>
              </Reveal>
            ))}
          </div>
        ) : (
          /* Names are published only once each member has cleared being listed. */
          <Reveal className="card-silk mt-16 p-10 md:p-16">
            <p className="label-caps text-terracotta">To be announced</p>
            <h3 className="mt-6 max-w-2xl font-serif text-3xl leading-tight text-obsidian md:text-4xl">
              The 2026–27 board is being seated now, and members are listed here
              only once each has cleared publication.
            </h3>
            <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-obsidian/70">
              The composition below is fixed; the names attached to it are not
              yet public. Nominations for a seat are open to the federation.
            </p>
            <div className="mt-10">
              <PillLink href="/inquire" variant="outline">
                Nominate a board member
              </PillLink>
            </div>
          </Reveal>
        )}
      </section>

      {/* ── Composition ────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="06"
          eyebrow="Composition"
          title="How the seats"
          italic="are balanced."
          standfirst="No single constituency holds a majority. That is the whole mechanism."
        />

        <div className="mt-16 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-2">
          {BOARD_COMPOSITION.map((item, index) => (
            <Reveal
              key={item.seat}
              delay={index * 0.08}
              className="bg-white/40 p-10 backdrop-blur-sm md:p-12"
            >
              <span className="label-caps text-obsidian/25">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 font-serif text-2xl leading-tight text-obsidian">
                {item.seat}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
                {item.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Jury criteria ──────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="07"
          eyebrow="Jury"
          title="What the scoring"
          italic="rewards."
          standfirst="Submissions are scored blind against four weighted criteria. Jurors recuse themselves from their own organisation’s entries."
        />

        <Reveal className="mt-16">
          <dl className="border-t border-obsidian/15">
            {JURY_CRITERIA.map((item) => (
              <div
                key={item.criterion}
                className="grid grid-cols-1 items-baseline gap-4 border-b border-obsidian/15 py-8 sm:grid-cols-12"
              >
                <dt className="flex items-baseline gap-5 sm:col-span-4">
                  <span className="font-serif text-4xl text-terracotta/90">
                    {item.weight}
                  </span>
                  <span className="font-serif text-2xl text-obsidian">
                    {item.criterion}
                  </span>
                </dt>
                <dd className="text-sm font-light leading-relaxed text-obsidian/70 sm:col-span-8">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>
    </PageShell>
  );
}
