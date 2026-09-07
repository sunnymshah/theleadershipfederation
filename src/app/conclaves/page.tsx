import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { EditionGrid } from '@/components/sections/EditionGrid';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { EDITIONS } from '@/data/editions';

const UPCOMING = EDITIONS.filter((e) => e.status === 'Upcoming' && e.kind !== 'Round Tables');
const PAST = EDITIONS.filter((e) => e.status === 'Past' && e.kind !== 'Round Tables');

export const metadata: Metadata = {
  title: 'Upcoming Conclaves',
  description:
    'Flagship GCC leadership conclaves, summits and forums convened by The Leadership Federation across its global hubs.',
};

const FORMAT_NOTES = [
  {
    title: 'Main stage',
    detail:
      'Chaired sessions with a stated question and a named position — not vendor keynotes.',
  },
  {
    title: 'Working tracks',
    detail:
      'Parallel rooms capped at forty, where the operating detail actually gets exchanged.',
  },
  {
    title: 'Off-record hours',
    detail:
      'Unfilmed, unbadged time built into the schedule. The reason people travel.',
  },
];

export default function ConclavesPage() {
  return (
    <PageShell
      index="01"
      eyebrow="Convenings"
      title="Upcoming"
      italic="conclaves."
      standfirst="Main-stage programming for GCC leadership, enterprise CXOs and the policymakers who shape the operating environment around them."
      meta={[`${UPCOMING.length} scheduled`, `${PAST.length} in the archive`, `${new Set(EDITIONS.map((e) => e.city)).size} hub cities`]}
    >
      <EditionGrid editions={UPCOMING} />

      <section className="pt-stack-section">
        <SectionHeading
          index="02"
          eyebrow="Format"
          title="How a conclave"
          italic="is built."
          standfirst="Three layers, in a fixed ratio. The proportions are the format."
        />

        <div className="mt-16 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-3">
          {FORMAT_NOTES.map((note, index) => (
            <Reveal
              key={note.title}
              delay={index * 0.1}
              className="bg-white/40 p-10 backdrop-blur-sm"
            >
              <span className="label-caps text-obsidian/25">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 font-serif text-2xl text-obsidian">
                {note.title}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
                {note.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pt-stack-section">
        <SectionHeading
          index="03"
          eyebrow="Archive"
          title="Previously"
          italic="convened."
          standfirst="A short view of the archive. The full record, with films, sits on the past events page."
        />

        <div className="mt-16">
          <EditionGrid editions={PAST.slice(0, 3)} />
        </div>

        <Reveal delay={0.2} className="mt-14">
          <PillLink href="/past-events" variant="outline">
            The full archive
          </PillLink>
        </Reveal>
      </section>
    </PageShell>
  );
}
