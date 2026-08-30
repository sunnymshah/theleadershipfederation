/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SUBMISSION STORE
 * ─────────────────────────────────────────────────────────────────────────
 *  Three drivers, chosen automatically in this order:
 *
 *    blob  — Vercel Blob. One JSON object per submission under submissions/.
 *            Writes are independent, so two people submitting at the same
 *            moment cannot overwrite each other the way a single shared file
 *            would. Used whenever BLOB_READ_WRITE_TOKEN is present.
 *    kv    — Vercel KV / Upstash Redis over its REST API, if KV_REST_API_URL
 *            and KV_REST_API_TOKEN are set. Kept so an existing KV can be
 *            dropped in without touching this file.
 *    file  — a JSON file under .data/, development only. Serverless
 *            filesystems are ephemeral, so this never runs in production.
 *
 *  With none configured the store reports `none` and the admin console shows
 *  how to connect one rather than pretending submissions are saved.
 */

import type { Submission, SubmissionStatus } from './submissions';

const KEY_INDEX = 'tlf:submissions';
const KEY_ITEM = (id: string) => `tlf:submission:${id}`;

export type StoreDriver = 'blob' | 'kv' | 'file' | 'none';

export function storeDriver(): StoreDriver {
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob';
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

/* ── Vercel Blob ────────────────────────────────────────────────────────── */

const BLOB_PREFIX = 'submissions/';
const blobPath = (id: string) => `${BLOB_PREFIX}${id}.json`;

async function blobApi() {
  /* Imported lazily so the other drivers never pay for the SDK. */
  return import('@vercel/blob');
}

async function blobPut(submission: Submission) {
  const { put } = await blobApi();
  /* Private: submissions carry personal data, so the blobs must never be
     readable from their URL alone — every read goes through the token. */
  await put(blobPath(submission.id), JSON.stringify(submission), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function blobList(limit: number): Promise<Submission[]> {
  const { list, get } = await blobApi();

  const blobs: { url: string; pathname: string }[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: BLOB_PREFIX, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor && blobs.length < limit);

  /* Ids are time-prefixed, so sorting the pathname sorts by recency. */
  blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));

  const rows = await Promise.all(
    blobs.slice(0, limit).map(async (blob) => {
      try {
        const result = await get(blob.pathname, {
          access: 'private',
          useCache: false,
        });
        if (!result) return null;
        return (await new Response(result.stream).json()) as Submission;
      } catch {
        return null;
      }
    })
  );

  return rows.filter((row): row is Submission => row !== null);
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

  if (driver === 'blob') {
    await blobPut(submission);
    return;
  }

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

  if (driver === 'blob') return blobList(limit);

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

  if (driver === 'blob') {
    const rows = await blobList(5000);
    const row = rows.find((entry) => entry.id === id);
    if (!row) return false;
    await blobPut({ ...row, status });
    return true;
  }

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

  if (driver === 'blob') {
    const { del, list } = await blobApi();
    const page = await list({ prefix: blobPath(id), limit: 1 });
    if (!page.blobs.length) return false;
    await del(page.blobs[0].url);
    return true;
  }

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
    if (driver === 'blob') {
      const { list } = await blobApi();
      const page = await list({ prefix: BLOB_PREFIX, limit: 1 });
      return {
        driver,
        ok: true,
        detail: `Vercel Blob connected — ${
          page.blobs.length ? 'storing submissions.' : 'ready, nothing stored yet.'
        }`,
      };
    }

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
