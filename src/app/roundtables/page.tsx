import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { EditionGrid } from '@/components/sections/EditionGrid';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { EDITIONS } from '@/data/editions';

const TABLES = EDITIONS.filter((e) => e.kind === 'Round Tables');
const UPCOMING_TABLES = TABLES.filter((e) => e.status === 'Upcoming');

export const metadata: Metadata = {
  title: 'CXO Roundtables',
  description:
    'Closed-door, non-attributable roundtables for 12–20 senior leaders, convened under the Chatham House Rule.',
};

const RULES = [
  {
    rule: 'Chatham House Rule',
    detail:
      'Participants may use what is said. Neither the speaker nor their organisation may be identified.',
  },
  {
    rule: 'Peers only',
    detail:
      'Partner organisations support the table. They take part only where they have a comparable operating problem.',
  },
  {
    rule: 'One question, three hours',
    detail:
      'A single operating problem, circulated a fortnight ahead.',
  },
  {
    rule: 'Curated seating',
    detail:
      'Twelve to twenty people, selected for the question. Seats are personal and cannot be delegated.',
  },
];

export default function RoundtablesPage() {
  return (
    <PageShell
      index="02"
      eyebrow="Closed door"
      title="CXO"
      italic="roundtables."
      standfirst="Twelve to twenty leaders, one operating question, held without attribution."
      meta={[`${UPCOMING_TABLES.length} tables scheduled`, '12–20 seats per table', 'Non-attributable']}
    >
      <EditionGrid editions={UPCOMING_TABLES} />

      <section className="pt-stack-section">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              index="03"
              eyebrow="The rules"
              title="How the format"
              italic="works."
              standfirst="Four conditions. Remove any one and the conversation reverts to a panel."
            />
          </div>

          <div className="lg:col-span-7">
            <Reveal>
              <dl className="border-t border-obsidian/15">
                {RULES.map((item, index) => (
                  <div
                    key={item.rule}
                    className="grid grid-cols-1 gap-4 border-b border-obsidian/15 py-8 sm:grid-cols-12"
                  >
                    <dt className="sm:col-span-5">
                      <span className="label-caps mr-4 text-obsidian/25">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-serif text-2xl text-obsidian">
                        {item.rule}
                      </span>
                    </dt>
                    <dd className="text-sm font-light leading-relaxed text-obsidian/70 sm:col-span-7">
                      {item.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pt-stack-section">
        <Reveal className="card-silk p-10 md:p-16">
          <h2 className="max-w-2xl font-serif text-3xl leading-tight text-obsidian md:text-4xl">
            Roundtable seats are allocated by the programme committee.
          </h2>
          <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-obsidian/70">
            Tell us the problem you would bring to the table. If it matches a
            question already in the calendar, we will come back to you with a
            date.
          </p>
          <div className="mt-10">
            <PillLink href="/inquire">Request a seat</PillLink>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
