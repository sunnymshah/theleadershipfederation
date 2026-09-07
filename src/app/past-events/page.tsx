import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { ArchiveFilmCard } from '@/components/sections/FilmCard';
import { EditionGrid } from '@/components/sections/EditionGrid';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { ARCHIVE_FILMS } from '@/data/films';
import { EDITIONS } from '@/data/editions';

const PAST = EDITIONS.filter((e) => e.status === 'Past');
import { STAGE_METRICS } from '@/config/site';

export const metadata: Metadata = {
  title: 'Past Events',
  description:
    'Films, photography and proceedings from The Leadership Federation’s archive of conclaves, summits and roundtable series.',
};

export default function PastEventsPage() {
  return (
    <PageShell
      index="05"
      eyebrow="Archive"
      title="What has already"
      italic="been said."
      standfirst="Every programme is filmed and photographed. The archive is the federation’s memory — and the reason a conversation can pick up two cities later."
      meta={STAGE_METRICS.map((m) => `${m.value} ${m.label}`)}
    >
      {/* ── Films ──────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          index="06"
          eyebrow="Event films"
          title="The cut-downs"
          italic="that travel."
        />

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {ARCHIVE_FILMS.map((film) => (
            <ArchiveFilmCard key={film.title + film.tag} film={film} />
          ))}
        </div>
      </section>

      {/* ── Proceedings ────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="07"
          eyebrow="Proceedings"
          title="The programmes"
          italic="behind them."
        />

        <div className="mt-16">
          <EditionGrid editions={PAST} columns={2} />
        </div>
      </section>

      <section className="pt-stack-section">
        <Reveal className="card-silk p-10 md:p-16">
          <h2 className="max-w-2xl font-serif text-3xl leading-tight text-obsidian md:text-4xl">
            Delegates receive the full proceedings — transcripts, decks and
            unlisted films — within ten working days.
          </h2>
          <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-obsidian/70">
            Roundtable material is circulated in non-attributable form only, in
            keeping with the rule the room was convened under.
          </p>
          <div className="mt-10">
            <PillLink href="/inner-circle">Access the archive</PillLink>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
