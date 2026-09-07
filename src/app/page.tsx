import { Footer } from '@/components/layout/Footer';
import { EditionsTimeline } from '@/components/sections/EditionsTimeline';
import { Hero } from '@/components/sections/Hero';
import { LeadersMarquee } from '@/components/sections/LeadersMarquee';
import { RoomFilms } from '@/components/sections/RoomFilms';
import { SponsorWall } from '@/components/sections/SponsorWall';
import { UpcomingProgrammes } from '@/components/sections/UpcomingProgrammes';
import { WhatWeDo } from '@/components/sections/WhatWeDo';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { INNER_CIRCLE_URL } from '@/config/site';

/**
 * Homepage order, by what a first-time visitor needs:
 *
 *   01 Hero            who we are
 *   02 What we do      the offer, once — the five services
 *   03 Next up         the real calendar, and how to get in
 *   04 The room        who is actually there (341 leaders)
 *   05 See the room    film, for anyone still unconvinced
 *   06 Partners        the brands backing it
 *   07 The record      the archive
 *      CTA             the ask
 *
 * Removed from this page, deliberately:
 *   • "One community, five powerful rooms" — it described the same five
 *     things as What we do, in different words.
 *   • The standalone partner logo strip — SponsorWall already shows them.
 *   • A programme grid built from placeholder data, which was publishing
 *     invented events above the genuine calendar.
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      <WhatWeDo />

      <UpcomingProgrammes />

      <LeadersMarquee />

      <RoomFilms />

      <SponsorWall />

      <EditionsTimeline pastOnly />

      <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
        <Reveal className="relative bg-obsidian px-8 py-20 md:px-20 md:py-28">
          <p className="label-caps text-champagne">
            Your brand. The right room.
          </p>
          <h2 className="mt-8 max-w-3xl font-serif text-4xl leading-[1.05] text-white md:text-6xl">
            Let&rsquo;s build the next
            <span className="italic text-champagne"> high-trust gathering.</span>
          </h2>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-white/70">
            Tell us which room you belong in and the committee will come back to
            you either way.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <PillLink href="/register">Register or nominate</PillLink>
            <PillLink
              href={INNER_CIRCLE_URL}
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
