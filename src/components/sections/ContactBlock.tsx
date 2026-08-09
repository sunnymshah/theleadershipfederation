import { Reveal } from '@/components/ui/Reveal';
import { DESKS } from '@/data/contact';

/**
 * The obsidian contact panel — three desks, hairline-divided, as published on
 * theleadershipfederation.com. Sits above the footer on every page.
 */
export function ContactBlock() {
  return (
    <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
      <Reveal className="bg-obsidian">
        <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-3">
          {DESKS.map((desk) => (
            <div key={desk.heading} className="bg-obsidian p-8 md:p-12">
              <h2 className="max-w-[15ch] font-serif text-2xl leading-tight text-white md:text-3xl">
                {desk.heading}
              </h2>

              {desk.note && (
                <p className="mt-6 text-sm font-light leading-relaxed text-white/60">
                  {desk.note}
                </p>
              )}

              <ul className="mt-8 space-y-7">
                {desk.people.map((person) => (
                  <li key={person.email}>
                    <p className="label-caps text-champagne">
                      {person.name}
                      {person.role ? ` · ${person.role}` : ''}
                    </p>
                    <a
                      href={`mailto:${person.email}`}
                      className="mt-2 block break-all text-sm font-light text-white/80 transition-colors hover:text-white"
                    >
                      {person.email}
                    </a>
                    {person.phones?.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone.replace(/\s/g, '')}`}
                        className="mt-1 block text-sm font-light text-white/60 transition-colors hover:text-white"
                      >
                        {phone}
                      </a>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
