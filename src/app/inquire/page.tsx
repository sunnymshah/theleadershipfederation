import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { InquiryForm } from '@/components/sections/InquiryForm';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { SITE } from '@/config/site';
import { HUBS } from '@/data/programmes';

export const metadata: Metadata = {
  title: 'Inquire',
  description:
    'Enquire about a conclave seat, a closed-door roundtable, Inner Circle membership or partnership with The Leadership Federation.',
};

const ROUTES_IN = [
  {
    title: 'Delegates',
    detail:
      'Seats at conclaves are allocated by the programme committee against the mandate you carry, not by order of payment.',
  },
  {
    title: 'Partners',
    detail:
      'Enterprises fund the table and take the stage on the same evidence standard as everyone else. No pay-to-keynote.',
  },
  {
    title: 'Speakers',
    detail:
      'Bring a position and the measurement behind it. Chaired sessions only — we do not run open mics.',
  },
];

export default function InquirePage() {
  return (
    <PageShell
      index="07"
      eyebrow="Contact"
      title="Start a"
      italic="conversation."
      standfirst="Tell us what you are trying to solve and which room you think it belongs in. The committee reads every enquiry and replies either way."
      meta={[`${HUBS.length} hubs`, 'Replies within 5 working days']}
    >
      <section className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <InquiryForm />
        </div>

        <div className="lg:col-span-5">
          <Reveal>
            <p className="label-caps text-obsidian/40">Direct</p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-4 block font-serif text-2xl italic text-obsidian transition-colors hover:text-terracotta md:text-3xl"
            >
              {SITE.email}
            </a>
            <div className="mt-8 h-[2px] w-24 bg-champagne" />
          </Reveal>

          <Reveal delay={0.15} className="mt-14">
            <dl className="border-t border-obsidian/15">
              {ROUTES_IN.map((item) => (
                <div key={item.title} className="border-b border-obsidian/15 py-7">
                  <dt className="font-serif text-xl text-obsidian">
                    {item.title}
                  </dt>
                  <dd className="mt-3 text-sm font-light leading-relaxed text-obsidian/70">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="pt-stack-section">
        <SectionHeading
          index="08"
          eyebrow="Coverage"
          title="Where we"
          italic="convene."
        />
        <Reveal className="mt-14">
          <p className="max-w-4xl font-serif text-2xl leading-relaxed text-obsidian/70 md:text-3xl">
            {HUBS.join(' · ')}
          </p>
        </Reveal>
      </section>
    </PageShell>
  );
}
