import { Marquee } from '@/components/sections/Marquee';
import { PARTNERS } from '@/data/partners';

/**
 * Partner enterprises, set as typographic wordmarks. When cleared logo files
 * land in /public/partners, swap the <span> for an <Image> keyed off
 * `partner.logo` — the marquee itself needs no changes.
 */
export function PartnerMarquee() {
  return (
    <section className="relative z-20 border-y border-obsidian/10 py-10">
      <p className="label-caps mb-8 px-8 text-obsidian/40 md:px-16">
        Enterprises on our stages
      </p>

      <Marquee speed={60} itemClassName="px-10">
        {PARTNERS.map((partner) => (
          <span
            key={partner.name}
            className="whitespace-nowrap font-serif text-2xl text-obsidian/50 transition-colors hover:text-obsidian md:text-3xl"
          >
            {partner.name}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
