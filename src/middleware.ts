import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * Gate every /admin route except the login screen itself.
 *
 * Runs on the Edge runtime, which is why session verification uses Web Crypto
 * (see lib/auth.ts) rather than Node's crypto module.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isLogin = pathname === '/admin/login';
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  /* Already signed in and staring at the login page — send them onward. */
  if (isLogin && session) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (!isLogin && !session) {
    const url = new URL('/admin/login', request.url);
    if (pathname !== '/admin') url.searchParams.set('next', pathname + search);
    const response = NextResponse.redirect(url);
    /* Clear a stale or tampered cookie so the next request starts clean. */
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
