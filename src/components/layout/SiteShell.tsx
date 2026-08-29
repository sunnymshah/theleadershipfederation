'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AccentStrip } from './AccentStrip';
import { GlobalMenu } from './GlobalMenu';
import { TopNav } from './TopNav';

/**
 * The persistent chrome shared by every route: top bar, right accent strip and
 * the global menu overlay. Page content is passed through untouched so route
 * segments stay server components.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // A route change should never leave the overlay hanging open.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  /* The admin area is a separate surface — no marketing nav, no accent strip. */
  if (pathname.startsWith('/admin')) return <>{children}</>;

  return (
    <>
      <TopNav />
      <AccentStrip open={menuOpen} onToggle={toggleMenu} />
      <GlobalMenu open={menuOpen} onClose={closeMenu} />
      {children}
    </>
  );
}
