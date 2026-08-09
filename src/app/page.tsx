import { Footer } from '@/components/layout/Footer';
import { FilmCard } from '@/components/sections/FilmCard';
import { Hero } from '@/components/sections/Hero';
import { PartnerMarquee } from '@/components/sections/PartnerMarquee';
import { ProgrammeGrid } from '@/components/sections/ProgrammeGrid';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { FILMS } from '@/data/films';
import { HUBS, UPCOMING_CONCLAVES } from '@/data/programmes';

export default function HomePage() {
  return (
    <>
      <Hero />

      <div className="mx-auto w-full max-w-canvas pr-24 md:pr-[120px]">
        <PartnerMarquee />
      </div>

      {/* ── Upcoming ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            index="02"
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

      {/* ── Films ──────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
        <SectionHeading
          index="03"
          eyebrow="Event films"
          title="The archive,"
          italic="on film."
          standfirst="Every programme is filmed. The cut-downs travel further than the room ever could."
        />

        <div className="mt-20 grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {FILMS.map((film) => (
            <FilmCard key={film.slug} film={film} />
          ))}
        </div>
      </section>

      {/* ── Hubs ───────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              index="04"
              eyebrow="Footprint"
              title="Fourteen hubs,"
              italic="one federation."
              standfirst="The platform follows the capability map — not the conference circuit."
            />
            <Reveal delay={0.2} className="mt-10">
              <PillLink href="/about" variant="outline">
                The thesis
              </PillLink>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal>
              <ul className="grid grid-cols-2 border-l border-t border-obsidian/10 sm:grid-cols-3">
                {HUBS.map((hub, index) => (
                  <li
                    key={hub}
                    className="group flex items-baseline gap-3 border-b border-r border-obsidian/10 px-5 py-6 transition-colors hover:bg-white/40"
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
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
        <Reveal className="relative bg-obsidian px-8 py-20 md:px-20 md:py-28">
          <p className="label-caps text-champagne">Inner Circle</p>
          <h2 className="mt-8 max-w-3xl font-serif text-4xl leading-[1.05] text-white md:text-6xl">
            Membership is by
            <span className="italic text-champagne"> invitation</span>, and the
            room stays small on purpose.
          </h2>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-white/70">
            Continuity between events is the point. Members carry the same
            conversation from a Chatham House breakfast to the main stage.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <PillLink href="/inner-circle">Request consideration</PillLink>
            <PillLink
              href="/inquire"
              variant="outline"
              withArrow={false}
              className="border-white/40 text-white hover:bg-white hover:text-obsidian"
            >
              Partner with us
            </PillLink>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
