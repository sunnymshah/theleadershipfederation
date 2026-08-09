import { PageShell } from '@/components/layout/PageShell';
import { PillLink } from '@/components/ui/PillLink';
import { NAV } from '@/config/site';
import Link from 'next/link';

export default function NotFound() {
  return (
    <PageShell
      eyebrow="404"
      title="This page isn't"
      italic="on the programme."
      standfirst="The address you followed doesn't match anything in the federation's index."
    >
      <div className="flex flex-wrap gap-4">
        <PillLink href="/">Return to the hero</PillLink>
        <PillLink href="/inquire" variant="outline">
          Ask us directly
        </PillLink>
      </div>

      <ul className="mt-20 grid grid-cols-1 border-l border-t border-obsidian/10 sm:grid-cols-2 lg:grid-cols-3">
        {NAV.map((item, index) => (
          <li key={item.href} className="border-b border-r border-obsidian/10">
            <Link
              href={item.href}
              className="group flex h-full flex-col justify-between gap-6 p-8 transition-colors hover:bg-white/40"
            >
              <span className="label-caps text-obsidian/25">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="block font-serif text-2xl text-obsidian transition-colors group-hover:text-terracotta">
                  {item.label}
                </span>
                <span className="mt-3 block text-sm font-light leading-relaxed text-obsidian/60">
                  {item.blurb}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
