import { cn } from '@/lib/utils';

/**
 * The numbered section marker — a terracotta rule followed by a tiny, heavily
 * tracked label. Used to open every major section.
 */
export function Eyebrow({
  index,
  children,
  className,
}: {
  /** Optional two-digit section number, e.g. "01". */
  index?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('label-caps flex items-center text-terracotta', className)}>
      <span className="mr-4 h-[1px] w-8 shrink-0 bg-terracotta" />
      {index ? `${index} / ` : null}
      {children}
    </p>
  );
}
