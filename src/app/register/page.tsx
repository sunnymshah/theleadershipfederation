import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { RegisterForm } from '@/components/sections/RegisterForm';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { EDITIONS } from '@/data/editions';
import { STAGE_METRICS } from '@/config/site';

export const metadata: Metadata = {
  title: 'Register Now',
  description:
    'Nominate yourself for an award, register as a delegate, apply to speak or become a sponsor at a Leadership Federation programme.',
};

const PATHS = [
  {
    title: 'Nomination for an award',
    detail:
      'Put yourself or a colleague forward. Submissions are scored blind by the jury against evidence, transferability, durability and originality.',
  },
  {
    title: 'Delegate',
    detail:
      'Connect with fellow leaders, take the insight back, and be part of the room rather than the audience.',
  },
  {
    title: 'Sponsor',
    detail:
      'Brand exposure to a curated senior audience — and a seat at the table on the same evidence standard as everyone else.',
  },
  {
    title: 'Speaker',
    detail:
      'Bring a position and the measurement behind it. Chaired sessions only; we do not run open mics.',
  },
];

const UPCOMING = EDITIONS.filter((e) => e.status === 'Upcoming');

export default function RegisterPage() {
  return (
    <PageShell
      index="05"
      eyebrow="Register"
      title="Take the next step in your"
      italic="leadership journey."
      standfirst="Join our community of global leaders. Nominate yourself for an award, register as a delegate, apply to speak, or partner with us as a sponsor."
      meta={[
        `${UPCOMING.length} programmes open`,
        ...STAGE_METRICS.slice(0, 1).map((m) => `${m.value} ${m.label}`),
      ]}
    >
      {/* ── Paths ──────────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-2 lg:grid-cols-4">
          {PATHS.map((path, index) => (
            <Reveal
              key={path.title}
              delay={index * 0.07}
              className="bg-white/45 p-9 backdrop-blur-sm"
            >
              <span className="label-caps text-terracotta">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="mt-5 font-serif text-2xl leading-tight text-obsidian">
                {path.title}
              </h2>
              <p className="mt-3 text-sm font-light leading-relaxed text-obsidian/70">
                {path.detail}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Form ───────────────────────────────────────────────────────── */}
      <section className="pt-stack-section">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading
              index="06"
              eyebrow="The form"
              title="Fill this in and our team"
              italic="will get in touch."
            />
            <div className="mt-14">
              <RegisterForm />
            </div>
          </div>

          <div className="lg:col-span-5">
            <Reveal>
              <p className="label-caps text-obsidian/40">Open programmes</p>
              <ul className="mt-6 border-t border-obsidian/15">
                {UPCOMING.map((edition) => (
                  <li key={edition.index} className="border-b border-obsidian/15">
                    <a
                      href={edition.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group block py-5 transition-colors hover:text-terracotta"
                    >
                      <p className="label-caps text-terracotta">{edition.kind}</p>
                      <p className="mt-2 font-serif text-lg leading-tight text-obsidian transition-colors group-hover:text-terracotta">
                        {edition.title}
                      </p>
                      <p className="label-caps mt-2 text-obsidian/45">
                        {edition.city} · {edition.date}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
