import Image from 'next/image';
import Link from 'next/link';

import { NAV, PRIMARY_CTA, SITE, STAGE_METRICS } from '@/config/site';
import { HUBS } from '@/data/programmes';

export function Footer() {
  return (
    <footer className="relative z-20 mx-auto w-full max-w-canvas px-8 pb-16 pr-24 pt-24 md:px-16 md:pr-[120px]">
      <div className="border-t border-obsidian/20 pt-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Image
              src="/tlf-logo.png"
              alt={SITE.name}
              width={866}
              height={288}
              className="h-auto w-[200px] object-contain"
            />
            <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-obsidian/60">
              {SITE.description}
            </p>
            <div className="mt-8 h-[2px] w-24 bg-champagne" />
          </div>

          <nav className="md:col-span-3" aria-label="Footer">
            <p className="label-caps mb-6 text-obsidian/40">Programmes</p>
            <ul className="space-y-3">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-light text-obsidian/70 transition-colors hover:text-terracotta"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={PRIMARY_CTA.href}
                  className="text-sm font-light text-obsidian/70 transition-colors hover:text-terracotta"
                >
                  {PRIMARY_CTA.label}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="label-caps mb-6 text-obsidian/40">Hubs</p>
            <p className="text-sm font-light leading-relaxed text-obsidian/70">
              {HUBS.join(' · ')}
            </p>

            <p className="label-caps mb-3 mt-8 text-obsidian/40">Enquiries</p>
            <a
              href={`mailto:${SITE.email}`}
              className="font-serif text-xl italic text-obsidian transition-colors hover:text-terracotta"
            >
              {SITE.email}
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-obsidian/10 pt-6 text-obsidian/60 md:flex-row">
          <div className="label-caps flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {STAGE_METRICS.map((metric) => (
              <span key={metric.label}>
                {metric.value} {metric.label}
              </span>
            ))}
          </div>
          <p className="label-caps text-obsidian/40">
            © {new Date().getFullYear()} {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
