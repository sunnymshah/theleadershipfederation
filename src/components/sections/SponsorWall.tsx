import { Marquee } from '@/components/sections/Marquee';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { PRIORITY_SPONSORS, SPONSORS } from '@/data/sponsors';

/**
 * "Brands that back the platform." — the lead marks run as a marquee, the full
 * roster sits beneath as a quiet grid.
 *
 * Marks are plain <img> for the same reason as the leader headshots: 125 logos
 * double-buffered would spend the image-optimisation quota on files that are
 * already tiny.
 */
export function SponsorWall() {
  /* Cap the grid — 125 marks is a lot of DOM for a supporting section. */
  const rest = SPONSORS.slice(PRIORITY_SPONSORS.length, PRIORITY_SPONSORS.length + 40);
  const remaining = SPONSORS.length - PRIORITY_SPONSORS.length - rest.length;

  return (
    <section className="overflow-hidden pt-stack-section">
      <div className="mx-auto w-full max-w-canvas px-8 pr-24 md:px-16 md:pr-[120px]">
        <Reveal>
          <Eyebrow index="06">Partners</Eyebrow>
          <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <h2 className="max-w-2xl font-serif text-4xl font-medium leading-[1.05] tracking-tight text-obsidian md:text-5xl lg:text-6xl">
              Brands that back
              <span className="block italic text-terracotta/90">the platform.</span>
            </h2>
            <p className="max-w-sm text-base font-light leading-relaxed text-obsidian/70">
              Selected partners and sponsors shown on official event pages and
              recent event content.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mt-16">
        <Marquee speed={80} itemClassName="px-6">
          {PRIORITY_SPONSORS.map((sponsor) => (
            <SponsorMark key={sponsor.name} {...sponsor} lead />
          ))}
        </Marquee>
      </div>

      <div className="mx-auto mt-16 w-full max-w-canvas px-8 pr-24 md:px-16 md:pr-[120px]">
        <Reveal>
          <ul className="grid grid-cols-2 gap-px border border-obsidian/10 bg-obsidian/10 sm:grid-cols-3 lg:grid-cols-5">
            {rest.map((sponsor) => (
              <li
                key={sponsor.name}
                className="flex h-[104px] items-center justify-center bg-white/40 px-5 backdrop-blur-sm"
              >
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  loading="lazy"
                  decoding="async"
                  className="max-h-12 w-auto max-w-full object-contain opacity-95 transition-opacity duration-300 ease-editorial hover:opacity-100"
                />
              </li>
            ))}
          </ul>
          <p className="label-caps mt-8 text-obsidian/40">
            {SPONSORS.length} partner and sponsor marks
            {remaining > 0 ? ` · ${remaining} more not shown` : ''}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function SponsorMark({
  name,
  logo,
  lead = false,
}: {
  name: string;
  logo: string;
  lead?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center ${
        lead ? 'h-[92px] w-[190px]' : 'h-[72px] w-[150px]'
      }`}
      title={name}
    >
      <img
        src={logo}
        alt={name}
        loading="lazy"
        decoding="async"
        className="max-h-full w-auto max-w-full object-contain opacity-95 transition-opacity duration-300 ease-editorial hover:opacity-100"
      />
    </div>
  );
}
