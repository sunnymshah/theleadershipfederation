/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SUBMISSION STORE
 * ─────────────────────────────────────────────────────────────────────────
 *  Two drivers, chosen automatically:
 *
 *    kv    — Vercel KV / Upstash Redis over its REST API. Zero dependencies:
 *            it is plain fetch against the pipeline endpoint. Used whenever
 *            KV_REST_API_URL and KV_REST_API_TOKEN are present.
 *    file  — a JSON file under .data/, for local development only. Serverless
 *            filesystems are ephemeral, so this is never used in production.
 *
 *  With neither configured the store reports `none` and the admin console
 *  shows how to connect one rather than pretending submissions are saved.
 */

import type { Submission, SubmissionStatus } from './submissions';

const KEY_INDEX = 'tlf:submissions';
const KEY_ITEM = (id: string) => `tlf:submission:${id}`;

export type StoreDriver = 'kv' | 'file' | 'none';

export function storeDriver(): StoreDriver {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) return 'kv';
  if (process.env.NODE_ENV !== 'production') return 'file';
  return 'none';
}

/* ── Upstash REST ───────────────────────────────────────────────────────── */

async function kv(commands: (string | number)[][]): Promise<unknown[]> {
  const url = `${process.env.KV_REST_API_URL}/pipeline`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(commands),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`KV request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { result?: unknown; error?: string }[];
  return payload.map((entry) => {
    if (entry.error) throw new Error(`KV error: ${entry.error}`);
    return entry.result;
  });
}

/* ── file driver (development) ──────────────────────────────────────────── */

const FILE = '.data/submissions.json';

async function readFileStore(): Promise<Submission[]> {
  const { readFile } = await import('node:fs/promises');
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as Submission[];
  } catch {
    return [];
  }
}

async function writeFileStore(rows: Submission[]) {
  const { writeFile, mkdir } = await import('node:fs/promises');
  await mkdir('.data', { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), 'utf8');
}

/* ── public API ─────────────────────────────────────────────────────────── */

export async function addSubmission(submission: Submission): Promise<void> {
  const driver = storeDriver();
  if (driver === 'none') throw new Error('No submission store configured');

  if (driver === 'kv') {
    await kv([
      ['SET', KEY_ITEM(submission.id), JSON.stringify(submission)],
      ['LPUSH', KEY_INDEX, submission.id],
      /* Keep the index bounded — 5,000 most recent. */
      ['LTRIM', KEY_INDEX, 0, 4999],
    ]);
    return;
  }

  const rows = await readFileStore();
  rows.unshift(submission);
  await writeFileStore(rows.slice(0, 5000));
}

export async function listSubmissions(limit = 500): Promise<Submission[]> {
  const driver = storeDriver();
  if (driver === 'none') return [];

  if (driver === 'kv') {
    const [ids] = (await kv([['LRANGE', KEY_INDEX, 0, limit - 1]])) as [string[]];
    if (!ids?.length) return [];

    const rows = (await kv([['MGET', ...ids.map(KEY_ITEM)]])) as [
      (string | null)[],
    ];

    return (rows[0] ?? [])
      .filter(Boolean)
      .map((raw) => JSON.parse(raw as string) as Submission);
  }

  return (await readFileStore()).slice(0, limit);
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus
): Promise<boolean> {
  const driver = storeDriver();
  if (driver === 'none') return false;

  if (driver === 'kv') {
    const [raw] = (await kv([['GET', KEY_ITEM(id)]])) as [string | null];
    if (!raw) return false;
    const updated = { ...(JSON.parse(raw) as Submission), status };
    await kv([['SET', KEY_ITEM(id), JSON.stringify(updated)]]);
    return true;
  }

  const rows = await readFileStore();
  const row = rows.find((entry) => entry.id === id);
  if (!row) return false;
  row.status = status;
  await writeFileStore(rows);
  return true;
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const driver = storeDriver();
  if (driver === 'none') return false;

  if (driver === 'kv') {
    await kv([
      ['DEL', KEY_ITEM(id)],
      ['LREM', KEY_INDEX, 0, id],
    ]);
    return true;
  }

  const rows = await readFileStore();
  const next = rows.filter((entry) => entry.id !== id);
  if (next.length === rows.length) return false;
  await writeFileStore(next);
  return true;
}

/** Cheap health probe for the console's diagnostics panel. */
export async function storeHealth(): Promise<{
  driver: StoreDriver;
  ok: boolean;
  detail: string;
}> {
  const driver = storeDriver();

  if (driver === 'none') {
    return {
      driver,
      ok: false,
      detail:
        'No store connected. Submissions cannot be saved until Vercel KV is attached.',
    };
  }

  try {
    if (driver === 'kv') {
      await kv([['PING']]);
      return { driver, ok: true, detail: 'Vercel KV connected.' };
    }
    await readFileStore();
    return {
      driver,
      ok: true,
      detail: 'Local file store (development only — not used in production).',
    };
  } catch (error) {
    return {
      driver,
      ok: false,
      detail: error instanceof Error ? error.message : 'Store unreachable.',
    };
  }
}
