import type { Metadata, Viewport } from 'next';
import { EB_Garamond, Plus_Jakarta_Sans } from 'next/font/google';

import { SiteShell } from '@/components/layout/SiteShell';
import { SITE } from '@/config/site';

import './globals.css';

const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-garamond',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  icons: {
    icon: '/tlf-logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#F4F3EF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${garamond.variable} ${jakarta.variable}`}>
      <body className="bg-warm-silk bg-warm-silk-fixed min-h-screen font-sans text-slate-copy antialiased relative overflow-x-hidden">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
