import Image from 'next/image';
import Link from 'next/link';

import { ContactBlock } from '@/components/sections/ContactBlock';
import { NAV, SITE, STAGE_METRICS } from '@/config/site';
import {
  BROWSE_LINKS,
  LEGAL_LINKS,
  OFFICE,
  SOCIALS,
} from '@/data/contact';
import { EDITIONS } from '@/data/editions';

const UPCOMING = EDITIONS.filter((e) => e.status === 'Upcoming').slice(0, 4);

/**
 * Site footer. Carries the full link set as plain markup, which doubles as the
 * no-JS navigation fallback for the overlay menu.
 */
export function Footer() {
  return (
    <>
      <ContactBlock />

      <footer className="relative z-20 mx-auto w-full max-w-canvas px-8 pb-16 pr-24 pt-24 md:px-16 md:pr-[120px]">
        <div className="border-t border-obsidian/20 pt-12">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-4">
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

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="label-caps text-obsidian/45 transition-colors hover:text-terracotta"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Browse */}
            <nav className="md:col-span-2" aria-label="Browse our site">
              <p className="label-caps mb-6 text-obsidian/40">Browse our site</p>
              <ul className="space-y-3">
                {BROWSE_LINKS.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-light text-obsidian/70 transition-colors hover:text-terracotta"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm font-light text-obsidian/70 transition-colors hover:text-terracotta"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Programmes */}
            <nav className="md:col-span-3" aria-label="Programmes">
              <p className="label-caps mb-6 text-obsidian/40">Upcoming events</p>
              <ul className="space-y-3">
                {UPCOMING.map((edition) => (
                  <li key={edition.index}>
                    <a
                      href={edition.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group block text-sm font-light text-obsidian/70 transition-colors hover:text-terracotta"
                    >
                      {edition.title}
                      <span className="label-caps mt-1 block text-[9px] text-obsidian/35">
                        {edition.city} · {edition.date}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <p className="label-caps mb-4 mt-8 text-obsidian/40">Pages</p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {NAV.filter((i) => !i.external).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm font-light text-obsidian/60 transition-colors hover:text-terracotta"
                    >
                      {item.shortLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact */}
            <div className="md:col-span-3">
              <p className="label-caps mb-6 text-obsidian/40">Contact us</p>
              <p className="text-sm font-light leading-relaxed text-obsidian/70">
                For event participation and sponsorship enquiries, write to us at
              </p>
              <a
                href={`mailto:${OFFICE.registerEmail}`}
                className="mt-3 block break-all font-serif text-lg italic text-obsidian transition-colors hover:text-terracotta"
              >
                {OFFICE.registerEmail}
              </a>
              <address className="mt-6 text-sm font-light not-italic leading-relaxed text-obsidian/60">
                {OFFICE.address}
              </address>

              <ul className="mt-8 space-y-2">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-light text-obsidian/50 transition-colors hover:text-terracotta"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
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
            <p className="label-caps text-center text-obsidian/40 md:text-right">
              © {new Date().getFullYear()} {SITE.name}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
