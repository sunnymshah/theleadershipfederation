import { NextResponse } from 'next/server';

import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { listSubmissions } from '@/lib/store';
import { toCsv } from '@/lib/submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const token = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const rows = await listSubmissions(5000);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(toCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="tlf-submissions-${stamp}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
