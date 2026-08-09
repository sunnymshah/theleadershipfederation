import Image from 'next/image';
import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { ADVISORY_BOARD, BOARD_PROCESS, JURY, JURY_CRITERIA } from '@/data/board';

export const metadata: Metadata = {
  title: 'Advisory Board & Jury',
  description:
    'The distinguished leaders who set the standards for The Leadership Federation’s programming and score its award submissions.',
};

export default function AdvisoryBoardPage() {
  return (
    <PageShell
      index="04"
      eyebrow="Governance"
      title="Advisory board"
      italic="& jury."
      standfirst="A distinguished group of leaders shaping the future. The board sets what earns a place on the stage; the jury decides what earns recognition."
      meta={[
        `${ADVISORY_BOARD.length} board advisors`,
        `${JURY.length} jury members`,
        'Two-year terms',
      ]}
    >
      {/* ── Advisory Board ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          index="05"
          eyebrow="Our advisory board"
          title="Renowned leaders,"
          italic="shaping tomorrow."
        />

        <div className="mt-16 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-2">
          {ADVISORY_BOARD.map((member, index) => (
            <Reveal
              key={member.name}
              as="article"
              delay={(index % 2) * 0.06}
              className="bg-white/45 backdrop-blur-sm"
            >
              <div className="flex h-full flex-col gap-6 p-8 sm:flex-row md:p-10">
                {member.photo && (
                  <div className="relative h-[168px] w-[142px] shrink-0 overflow-hidden bg-sand-dark shadow-sm">
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      sizes="142px"
                      className="object-cover object-top"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="font-serif text-2xl leading-tight text-obsidian">
                    {member.name}
                  </h3>
                  <p className="label-caps mt-3 text-terracotta">
                    {member.title}
                  </p>
                  {member.bio && (
                    <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
                      {member.bio}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Jury ───────────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="06"
          eyebrow="Our jury members"
          title="The deciders,"
          italic="recognising excellence."
          standfirst="Submissions are scored blind. Jurors recuse themselves from their own organisation’s entries."
        />

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {JURY.map((member, index) => (
            <Reveal key={member.name} as="article" delay={(index % 4) * 0.05}>
              {member.photo && (
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand-dark shadow-sm">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-top"
                  />
                </div>
              )}
              <h3 className="mt-4 font-serif text-lg leading-tight text-obsidian">
                {member.name}
              </h3>
              <p className="mt-2 text-xs font-light leading-snug text-obsidian/65">
                {member.title}
              </p>
              {member.country && (
                <p className="label-caps mt-2 text-[9px] text-obsidian/40">
                  {member.country}
                </p>
              )}
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Process, compressed ────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="07"
          eyebrow="The process"
          title="How a seat"
          italic="is earned."
        />

        <div className="mt-16 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-2 lg:grid-cols-4">
          {BOARD_PROCESS.map((item, index) => (
            <Reveal
              key={item.step}
              delay={index * 0.07}
              className="bg-white/45 p-9 backdrop-blur-sm"
            >
              <span className="font-serif text-5xl text-terracotta/30">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 font-serif text-2xl text-obsidian">
                {item.step}
              </h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-obsidian/70">
                {item.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Scoring ────────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="08"
          eyebrow="Scoring"
          title="What the jury"
          italic="rewards."
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

        <Reveal delay={0.15} className="mt-14 flex flex-wrap gap-4">
          <PillLink href="/register">Nominate now</PillLink>
          <PillLink href="/inquire" variant="outline">
            Nominate a board member
          </PillLink>
        </Reveal>
      </section>
    </PageShell>
  );
}
