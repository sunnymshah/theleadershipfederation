import { NextResponse } from 'next/server';

import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import {
  deleteSubmission,
  listSubmissions,
  updateSubmissionStatus,
} from '@/lib/store';
import { STATUSES, type SubmissionStatus } from '@/lib/submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Middleware only covers /admin/* — API routes verify the session themselves. */
async function requireSession(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const token = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  return verifySessionToken(token);
}

export async function GET(request: Request) {
  if (!(await requireSession(request))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const rows = await listSubmissions();
  return NextResponse.json({ rows }, { headers: { 'cache-control': 'no-store' } });
}

export async function PATCH(request: Request) {
  if (!(await requireSession(request))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { id, status } = (await request.json().catch(() => ({}))) as {
    id?: string;
    status?: SubmissionStatus;
  };

  if (!id || !status || !STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const ok = await updateSubmissionStatus(id, status);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}

export async function DELETE(request: Request) {
  if (!(await requireSession(request))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const ok = await deleteSubmission(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
