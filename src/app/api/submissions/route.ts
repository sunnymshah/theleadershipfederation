import { NextResponse } from 'next/server';

import { checkRateLimit, registerFailure, clientKey } from '@/lib/rate-limit';
import { addSubmission, storeDriver } from '@/lib/store';
import { newId, parseSubmission } from '@/lib/submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public form intake. Rate limited per IP, honeypot-screened and validated
 * before anything is written.
 *
 * A rejected spam payload still returns 200: telling a bot it was detected
 * only helps it adapt, and a real visitor never sees this path.
 */
export async function POST(request: Request) {
  const key = `submit:${clientKey(request.headers)}`;
  const limit = checkRateLimit(key);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = parseSubmission(body, {
    ua: request.headers.get('user-agent')?.slice(0, 300) ?? '',
    referer: request.headers.get('referer')?.slice(0, 300) ?? '',
  });

  if (!parsed.ok) {
    if (parsed.error === 'spam') return NextResponse.json({ ok: true });
    registerFailure(key);
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (storeDriver() === 'none') {
    /* Be honest with the caller so the form can fall back to email rather
       than showing a success screen for something that was never saved. */
    return NextResponse.json(
      { error: 'store-unavailable' },
      { status: 503 }
    );
  }

  try {
    await addSubmission({
      ...parsed.value,
      id: newId(),
      createdAt: new Date().toISOString(),
      status: 'new',
    });
  } catch {
    return NextResponse.json({ error: 'store-unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
