import Image from 'next/image';
import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { PillLink } from '@/components/ui/PillLink';
import { Reveal } from '@/components/ui/Reveal';
import { IMAGES } from '@/data/images';

export const metadata: Metadata = {
  title: 'Inner Circle',
  description:
    'Invitation-only membership of The Leadership Federation for senior GCC and enterprise leadership.',
};

const ENTITLEMENTS = [
  {
    title: 'Standing seat',
    detail:
      'A held seat at every conclave in your region, plus first call on roundtables matched to your operating question.',
  },
  {
    title: 'The archive',
    detail:
      'Full proceedings: transcripts, decks and unlisted films from every programme, including those you did not attend.',
  },
  {
    title: 'Warm introductions',
    detail:
      'Peer introductions made by the programme committee against a stated need — never a directory dump.',
  },
  {
    title: 'Agenda influence',
    detail:
      'Members set the questions. The programming committee builds the calendar from what the circle submits.',
  },
];

const PATH = [
  {
    step: 'Nomination',
    detail:
      'A current member, board member or the programme committee puts a name forward. Self-nomination is accepted and treated identically.',
  },
  {
    step: 'Conversation',
    detail:
      'A short call about the mandate you carry and the question you would bring. No pitch deck.',
  },
  {
    step: 'Committee review',
    detail:
      'The committee balances the circle across hubs, sectors and seniority before extending an invitation.',
  },
  {
    step: 'Invitation',
    detail:
      'Terms are annual and renew by mutual agreement. A seat is personal and cannot be transferred.',
  },
];

export default function InnerCirclePage() {
  return (
    <PageShell
      index="06"
      eyebrow="Membership"
      title="The inner"
      italic="circle."
      standfirst="Invitation-only membership for the leaders accountable for global capability. Small on purpose, and balanced deliberately across hubs and sectors."
      meta={['By invitation', 'Annual term', 'Non-transferable']}
    >
      {/* ── Entitlements ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            index="07"
            eyebrow="What it carries"
            title="What membership"
            italic="includes."
            standfirst="Membership is the mechanism that keeps a conversation alive between convenings."
          />
          <Reveal delay={0.2} className="mt-10">
            <div className="hairline-glass relative aspect-[4/3] w-full p-2">
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={IMAGES.boardroom.src}
                  alt={IMAGES.boardroom.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal>
            <dl className="border-t border-obsidian/15">
              {ENTITLEMENTS.map((item, index) => (
                <div
                  key={item.title}
                  className="grid grid-cols-1 gap-4 border-b border-obsidian/15 py-8 sm:grid-cols-12"
                >
                  <dt className="sm:col-span-5">
                    <span className="label-caps mr-4 text-obsidian/25">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-serif text-2xl text-obsidian">
                      {item.title}
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
      </section>

      {/* ── Path to membership ─────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <SectionHeading
          index="08"
          eyebrow="Admission"
          title="How admission"
          italic="works."
        />

        <div className="mt-16 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-2 lg:grid-cols-4">
          {PATH.map((item, index) => (
            <Reveal
              key={item.step}
              delay={index * 0.08}
              className="bg-white/40 p-10 backdrop-blur-sm"
            >
              <span className="font-serif text-5xl text-terracotta/30">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 font-serif text-2xl text-obsidian">
                {item.step}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
                {item.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <Reveal className="relative bg-obsidian px-8 py-20 md:px-20 md:py-28">
          <p className="label-caps text-champagne">Consideration</p>
          <h2 className="mt-8 max-w-3xl font-serif text-4xl leading-[1.05] text-white md:text-6xl">
            Tell us the question you would bring to
            <span className="italic text-champagne"> the table.</span>
          </h2>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-white/70">
            That is genuinely the whole application. The committee reads every
            submission and replies either way.
          </p>
          <div className="mt-12">
            <PillLink href="/inquire">Request consideration</PillLink>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
