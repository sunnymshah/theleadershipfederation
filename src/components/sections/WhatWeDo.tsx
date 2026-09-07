import Image from 'next/image';
import Link from 'next/link';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { SERVICES, type Service } from '@/data/services';
import { HUBS } from '@/data/programmes';

/**
 * The one place the offer is stated.
 *
 * Previously this ran as an abstract "we convene / recognise / connect" list
 * and then, four sections later, as "one community, five powerful rooms" —
 * the same five things twice. Merged into a single indexed list: a visitor
 * scans the "who it's for" line, stops at their row, and clicks.
 */
export function WhatWeDo() {
  return (
    <section className="mx-auto w-full max-w-canvas px-8 pr-24 pt-stack-section md:px-16 md:pr-[120px]">
      <Reveal>
        <Eyebrow index="02">What we do</Eyebrow>

        <p className="mt-8 max-w-4xl font-serif text-3xl font-medium leading-[1.25] tracking-tight text-obsidian md:text-4xl lg:text-[42px]">
          We run the rooms where{' '}
          <span className="italic text-terracotta/90">
            Global Capability Centre
          </span>{' '}
          leadership meets the enterprises, policymakers and peers that shape
          it, across {HUBS.length} hubs worldwide.
        </p>

        <div className="mt-8 h-[2px] w-24 bg-champagne" />
      </Reveal>

      <ul className="mt-14 border-t border-obsidian/15">
        {SERVICES.map((service, index) => (
          <Reveal as="li" key={service.n} delay={index * 0.04}>
            <ServiceRow service={service} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function ServiceRow({ service }: { service: Service }) {
  const body = (
    <>
      <span className="label-caps w-8 shrink-0 pt-1 text-obsidian/25">
        {service.n}
      </span>

      <span className="relative hidden h-[96px] w-[128px] shrink-0 overflow-hidden shadow-sm md:block">
        <Image
          src={service.image.src}
          alt=""
          fill
          sizes="128px"
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
        />
      </span>

      <span className="min-w-0 flex-1 lg:grid lg:grid-cols-12 lg:items-baseline lg:gap-6">
        <span className="lg:col-span-4">
          <span className="block font-serif text-2xl leading-tight text-obsidian transition-colors group-hover:text-terracotta md:text-3xl">
            {service.name}
          </span>
          <span className="label-caps mt-2 block text-terracotta">
            {service.who}
          </span>
        </span>

        <span className="mt-3 block text-sm font-light leading-relaxed text-obsidian/70 lg:col-span-6 lg:mt-0">
          {service.what}
        </span>

        <span className="label-caps mt-3 block text-obsidian/40 lg:col-span-2 lg:mt-0 lg:text-right">
          {service.scale}
        </span>
      </span>

      <ArrowForwardIcon className="mt-1 hidden h-5 w-5 shrink-0 text-obsidian/25 transition-all group-hover:translate-x-1 group-hover:text-terracotta xl:block" />
    </>
  );

  const cls =
    'group flex items-start gap-5 border-b border-obsidian/15 py-7 transition-colors hover:bg-white/40 md:gap-7 lg:px-2';

  return service.external ? (
    <a href={service.href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={service.href} className={cls}>
      {body}
    </Link>
  );
}
