import { Footer } from '@/components/layout/Footer';
import { EditionsTimeline } from '@/components/sections/EditionsTimeline';
import { FiveRooms } from '@/components/sections/FiveRooms';
import { WhatWeDo } from '@/components/sections/WhatWeDo';
import { Hero } from '@/components/sections/Hero';
import { LeadersMarquee } from '@/components/sections/LeadersMarquee';
import { PartnerMarquee } from '@/components/sections/PartnerMarquee';
import { ProgrammeGrid } from '@/components/sections/ProgrammeGrid';
import { RoomFilms } from '@/components/sections/RoomFilms';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { SponsorWall } from '@/components/sections/SponsorWall';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { UPCOMING_CONCLAVES } from '@/data/programmes';
import { INNER_CIRCLE_URL } from '@/config/site';

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* ── 02 · What we do, in one scan ───────────────────────────────── */}
      <WhatWeDo />

      <div className="mx-auto mt-stack-section w-full max-w-canvas pr-24 md:pr-[120px]">
        <PartnerMarquee />
      </div>

      {/* ── 02 · Upcoming ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            index="03"
            eyebrow="Convenings"
            title="Where the room is"
            italic="the product."
            standfirst="Main-stage conclaves and closed-door dialogues, convened where GCC leadership actually sits."
          />
          <Reveal delay={0.2}>
            <PillLink href="/conclaves" variant="outline">
              All conclaves
            </PillLink>
          </Reveal>
        </div>

        <div className="mt-20">
          <ProgrammeGrid programmes={UPCOMING_CONCLAVES} />
        </div>
      </section>

      {/* ── 04 · One community, five powerful rooms ────────────────────── */}
      <FiveRooms />

      {/* ── 05 · Motion proof: see the room ────────────────────────────── */}
      <RoomFilms />

      {/* ── 06 · The calibre of the room ───────────────────────────────── */}
      <LeadersMarquee />

      {/* ── 07 · Brands that back the platform ─────────────────────────── */}
      <SponsorWall />

      {/* ── 08 · Every edition ─────────────────────────────────────────── */}
      <EditionsTimeline />

      {/* ── Closing CTA ────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
        <Reveal className="relative bg-obsidian px-8 py-20 md:px-20 md:py-28">
          <p className="label-caps text-champagne">
            Your brand. The right room.
          </p>
          <h2 className="mt-8 max-w-3xl font-serif text-4xl leading-[1.05] text-white md:text-6xl">
            Let’s build the next
            <span className="italic text-champagne"> high-trust gathering.</span>
          </h2>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-white/70">
            Continuity between events is the point. Members carry the same
            conversation from a closed-door breakfast to the main stage.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <PillLink href="/inquire">Start a conversation</PillLink>
            <PillLink
              href="/inner-circle"
              variant="outline"
              withArrow={false}
              className="border-white/40 text-white hover:bg-white hover:text-obsidian"
            >
              Join the Inner Circle
            </PillLink>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
