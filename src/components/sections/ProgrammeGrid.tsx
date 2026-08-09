import Image from 'next/image';

import { Reveal } from '@/components/ui/Reveal';
import type { Programme } from '@/data/programmes';

const STATUS_LABEL: Record<Programme['status'], string> = {
  open: 'Registration open',
  waitlist: 'Waitlist',
  invitation: 'By invitation',
  closed: 'Concluded',
};

/**
 * Editorial programme cards. Sharp-cornered image plates with an obsidian
 * overlap label, per the design system's "Images & Media" rules.
 */
export function ProgrammeGrid({
  programmes,
  columns = 3,
}: {
  programmes: Programme[];
  columns?: 2 | 3;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 ${
        columns === 3 ? 'lg:grid-cols-3' : ''
      }`}
    >
      {programmes.map((programme, index) => (
        <Reveal key={programme.slug} as="article" delay={index * 0.08}>
          <div className="group relative aspect-[4/3] w-full overflow-hidden shadow-lg">
            <Image
              src={programme.image.src}
              alt={programme.image.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
            />
            <span className="absolute bottom-0 left-0 bg-obsidian px-4 py-3 font-serif text-sm italic text-white">
              {programme.city}
            </span>
            <span className="label-caps absolute right-0 top-0 bg-terracotta px-3 py-2 text-white">
              {programme.format}
            </span>
          </div>

          <div className="label-caps mt-6 flex items-center justify-between text-obsidian/50">
            <span>{programme.date}</span>
            <span className="text-terracotta">
              {STATUS_LABEL[programme.status]}
            </span>
          </div>

          <h3 className="mt-4 font-serif text-3xl leading-tight text-obsidian">
            {programme.title}
          </h3>

          <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
            {programme.summary}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {programme.themes.map((theme) => (
              <li
                key={theme}
                className="border border-obsidian/15 px-3 py-1.5 text-[11px] font-light text-obsidian/60"
              >
                {theme}
              </li>
            ))}
          </ul>

          <p className="label-caps mt-6 border-t border-obsidian/10 pt-4 text-obsidian/40">
            {programme.seats} · {programme.region}
          </p>
        </Reveal>
      ))}
    </div>
  );
}
