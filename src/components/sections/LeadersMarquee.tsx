import { Marquee } from '@/components/sections/Marquee';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { LEADERS, leaderRows, type Leader } from '@/data/leaders';
import { STAGE_METRICS } from '@/config/site';

/**
 * "The calibre of the room" — every leader photographed on a Federation stage,
 * moving in alternating bands.
 *
 * Headshots are plain <img loading="lazy"> rather than next/image on purpose:
 * the source files are already small (~31KB) and served at their display size,
 * so the optimiser would only spend quota.
 *
 * The bands show an evenly-spaced sample rather than the whole roster — see
 * leaderRows(). The full figure is stated beneath them.
 */
export function LeadersMarquee() {
  const rows = leaderRows(3);

  return (
    <section className="relative overflow-hidden py-stack-section">
      <div className="mx-auto w-full max-w-canvas px-8 pr-24 md:px-16 md:pr-[120px]">
        <Reveal>
          <Eyebrow index="06">The calibre of the room</Eyebrow>
          <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <h2 className="max-w-2xl font-serif text-4xl font-medium leading-[1.05] tracking-tight text-obsidian md:text-5xl lg:text-6xl">
              Leaders who have
              <span className="block italic text-terracotta/90">
                taken our stage.
              </span>
            </h2>
            <p className="max-w-sm text-base font-light leading-relaxed text-obsidian/70">
              A selection of decision-makers featured across Leadership
              Federation event programmes.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-baseline gap-x-12 gap-y-6 border-t border-obsidian/20 pt-8">
            {STAGE_METRICS.map((metric) => (
              <div key={metric.label} className="flex items-baseline gap-3">
                <span className="font-serif text-4xl text-obsidian md:text-5xl">
                  {metric.value}
                </span>
                <span className="label-caps text-obsidian/50">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Bands run in alternating directions so the eye never locks onto one. */}
      <div className="mt-16 flex flex-col gap-4">
        {rows.map((row, index) => (
          <Marquee
            key={index}
            speed={130 + index * 22}
            direction={index % 2 === 0 ? 'left' : 'right'}
            itemClassName="px-2"
          >
            {row.map((leader) => (
              <LeaderCard key={`${leader.name}-${leader.company}`} leader={leader} />
            ))}
          </Marquee>
        ))}
      </div>

      <p className="label-caps mx-auto mt-14 w-full max-w-canvas px-8 text-obsidian/40 md:px-16">
        A sample of {LEADERS.length} leaders photographed across 17 programmes
      </p>
    </section>
  );
}

function LeaderCard({ leader }: { leader: Leader }) {
  return (
    <a
      href={leader.href}
      target="_blank"
      rel="noreferrer"
      className="card-silk group flex w-[300px] items-stretch gap-0 transition-colors duration-500 ease-editorial hover:border-obsidian/25 sm:w-[340px]"
    >
      <div className="relative h-[104px] w-[86px] shrink-0 overflow-hidden bg-sand-dark">
        <img
          src={leader.photo}
          alt={`${leader.name}, ${leader.title} at ${leader.company}`}
          loading="lazy"
          decoding="async"
          width={86}
          height={104}
          className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center px-4 py-3">
        <p className="label-caps truncate text-[9px] text-terracotta">
          {leader.event}
        </p>
        <h3 className="mt-2 truncate font-serif text-lg leading-tight text-obsidian">
          {leader.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] font-light leading-snug text-obsidian/60">
          {leader.title}
        </p>
        <p className="label-caps mt-2 truncate text-[9px] text-obsidian/45">
          {leader.company}
        </p>
      </div>
    </a>
  );
}
