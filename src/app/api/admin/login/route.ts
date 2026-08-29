import { NextResponse } from 'next/server';

import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  csrfMatches,
  isConfigured,
} from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import {
  checkRateLimit,
  clearAttempts,
  clientKey,
  registerFailure,
} from '@/lib/rate-limit';

/* scrypt is Node-only. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Deliberately vague: never reveal whether a field was wrong or a lock is on. */
const GENERIC_ERROR = 'Incorrect password.';

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'Admin access is not configured on this deployment.' },
      { status: 503 }
    );
  }

  /* Reject cross-origin form posts outright. */
  const origin = request.headers.get('origin');
  if (origin) {
    const host = request.headers.get('host');
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 });
    }
  }

  const key = clientKey(request.headers);
  const limit = checkRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${limit.retryAfterSeconds}s.`,
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let password = '';
  let csrf = '';
  try {
    const body = await request.json();
    password = typeof body.password === 'string' ? body.password : '';
    csrf = typeof body.csrf === 'string' ? body.csrf : '';
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const csrfCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CSRF_COOKIE}=`))
    ?.split('=')[1];

  if (!csrfMatches(csrfCookie, csrf)) {
    return NextResponse.json(
      { error: 'Session expired — reload the page and try again.' },
      { status: 403 }
    );
  }

  const ok = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);

  if (!ok) {
    registerFailure(key);
    const after = checkRateLimit(key);
    return NextResponse.json(
      {
        error: GENERIC_ERROR,
        remaining: after.remaining,
      },
      { status: 401 }
    );
  }

  clearAttempts(key);

  const token = await createSessionToken('admin');
  const response = NextResponse.json({ ok: true });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  /* The CSRF token is single-use — force a fresh one next time. */
  response.cookies.delete(CSRF_COOKIE);

  return response;
}
