import { Marquee } from '@/components/sections/Marquee';
import { PRIORITY_SPONSORS } from '@/data/sponsors';

/**
 * Compact partner strip — the lead marks only. The full roster lives in
 * <SponsorWall />. Plain <img> to keep 24 tiny logos off the image optimiser.
 */
export function PartnerMarquee() {
  return (
    <section className="relative z-20 border-y border-obsidian/10 py-10">
      <p className="label-caps mb-8 px-8 text-obsidian/40 md:px-16">
        Enterprises on our stages
      </p>

      <Marquee speed={70} itemClassName="px-8">
        {PRIORITY_SPONSORS.map((sponsor) => (
          <div
            key={sponsor.name}
            title={sponsor.name}
            className="flex h-16 w-[150px] items-center justify-center"
          >
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              loading="lazy"
              decoding="async"
              className="max-h-full w-auto max-w-full object-contain opacity-65 grayscale transition-all duration-500 ease-editorial hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </Marquee>
    </section>
  );
}
