'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import type { Submission, SubmissionStatus } from '@/lib/submissions';

type Health = { driver: string; ok: boolean; detail: string };

const KIND_LABEL: Record<string, string> = {
  register: 'Registration',
  inquiry: 'Enquiry',
};

const STATUS_ORDER: SubmissionStatus[] = ['new', 'read', 'archived'];

/**
 * The operations console: one screen, submissions first.
 *
 * Left is the filtered list, right is the selected record. Everything the
 * operator does — read, archive, delete, export — happens without leaving it.
 */
export function Console({
  initialRows,
  health,
}: {
  initialRows: Submission[];
  health: Health;
}) {
  const [rows, setRows] = useState(initialRows);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRows[0]?.id ?? null
  );
  const [status, setStatus] = useState<SubmissionStatus | 'all'>('all');
  const [kind, setKind] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/submissions', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = (await response.json()) as { rows: Submission[] };
        setRows(data.rows);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  /* Poll gently so a second operator's changes show up without a reload. */
  useEffect(() => {
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false;
      if (kind !== 'all' && row.kind !== kind) return false;
      if (!needle) return true;
      return [
        row.name, row.email, row.organisation, row.role,
        row.event, row.intent, row.hub, row.message,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, status, kind, query]);

  const selected =
    filtered.find((row) => row.id === selectedId) ?? filtered[0] ?? null;

  const counts = useMemo(
    () => ({
      total: rows.length,
      new: rows.filter((r) => r.status === 'new').length,
      register: rows.filter((r) => r.kind === 'register').length,
      inquiry: rows.filter((r) => r.kind === 'inquiry').length,
      week: rows.filter(
        (r) => Date.now() - new Date(r.createdAt).getTime() < 7 * 864e5
      ).length,
    }),
    [rows]
  );

  async function setRowStatus(id: string, next: SubmissionStatus) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, status: next } : row))
    );
    await fetch('/api/admin/submissions', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    }).catch(() => refresh());
  }

  async function remove(id: string) {
    if (!confirm('Delete this submission permanently?')) return;
    setRows((current) => current.filter((row) => row.id !== id));
    await fetch('/api/admin/submissions', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => refresh());
  }

  /* Opening a record is what marks it read — no extra click. */
  useEffect(() => {
    if (selected && selected.status === 'new') {
      setRowStatus(selected.id, 'read');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <div className="space-y-6">
      {!health.ok && <StorageNotice detail={health.detail} />}

      {/* ── Counters ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-px border border-obsidian/10 bg-obsidian/10 lg:grid-cols-5">
        <Stat label="Unread" value={counts.new} accent />
        <Stat label="Last 7 days" value={counts.week} />
        <Stat label="Registrations" value={counts.register} />
        <Stat label="Enquiries" value={counts.inquiry} />
        <Stat label="Total captured" value={counts.total} />
      </section>

      {/* ── Controls ─────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, company, message…"
          className="min-w-[240px] flex-1 border-b border-obsidian/25 bg-transparent py-2.5 text-sm font-light text-obsidian outline-none transition-colors placeholder:text-obsidian/35 focus:border-terracotta"
        />

        <Segmented
          options={[
            { value: 'all', label: `All ${rows.length}` },
            ...STATUS_ORDER.map((s) => ({
              value: s,
              label: `${s} ${rows.filter((r) => r.status === s).length}`,
            })),
          ]}
          value={status}
          onChange={(value) => setStatus(value as SubmissionStatus | 'all')}
        />

        <Segmented
          options={[
            { value: 'all', label: 'Both' },
            { value: 'register', label: 'Registrations' },
            { value: 'inquiry', label: 'Enquiries' },
          ]}
          value={kind}
          onChange={setKind}
        />

        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="label-caps rounded-full border border-obsidian/20 px-4 py-2.5 text-obsidian/60 transition-colors hover:border-obsidian hover:text-obsidian disabled:opacity-40"
        >
          {busy ? 'Refreshing…' : 'Refresh'}
        </button>

        <a
          href="/api/admin/submissions/export"
          className="label-caps rounded-full border-2 border-obsidian px-4 py-2.5 text-obsidian transition-colors hover:bg-obsidian hover:text-white"
        >
          Export CSV
        </a>
      </section>

      {/* ── Inbox ────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 lg:grid-cols-12">
        <div className="max-h-[620px] overflow-y-auto bg-white/60 lg:col-span-5">
          {filtered.length === 0 ? (
            <p className="p-8 text-sm font-light text-obsidian/50">
              {rows.length === 0
                ? 'Nothing captured yet.'
                : 'No submissions match these filters.'}
            </p>
          ) : (
            <ul>
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={cn(
                      'flex w-full flex-col items-start gap-1.5 border-b border-obsidian/10 px-5 py-4 text-left transition-colors',
                      selected?.id === row.id
                        ? 'bg-white'
                        : 'hover:bg-white/80'
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="flex items-center gap-2 truncate">
                        {row.status === 'new' && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                        )}
                        <span className="truncate font-serif text-lg text-obsidian">
                          {row.name}
                        </span>
                      </span>
                      <time className="label-caps shrink-0 text-[9px] text-obsidian/35">
                        {formatShort(row.createdAt)}
                      </time>
                    </span>

                    <span className="truncate text-xs font-light text-obsidian/60">
                      {row.organisation || row.email}
                    </span>

                    <span className="mt-1 flex flex-wrap gap-1.5">
                      <Tag tone="terracotta">
                        {KIND_LABEL[row.kind] ?? row.kind}
                      </Tag>
                      {row.intent && <Tag>{row.intent}</Tag>}
                      {row.status === 'archived' && <Tag>Archived</Tag>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white/60 lg:col-span-7">
          {selected ? (
            <Detail
              row={selected}
              onStatus={setRowStatus}
              onDelete={remove}
            />
          ) : (
            <p className="p-8 text-sm font-light text-obsidian/50">
              Select a submission to read it.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-white/60 p-5">
      <p
        className={cn(
          'font-serif text-4xl leading-none',
          accent && value > 0 ? 'text-terracotta' : 'text-obsidian'
        )}
      >
        {value}
      </p>
      <p className="label-caps mt-3 text-obsidian/45">{label}</p>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'label-caps rounded-full border px-4 py-2.5 transition-colors',
            value === option.value
              ? 'border-obsidian bg-obsidian text-white'
              : 'border-obsidian/20 text-obsidian/55 hover:border-obsidian/50 hover:text-obsidian'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Tag({
  children,
  tone = 'plain',
}: {
  children: React.ReactNode;
  tone?: 'plain' | 'terracotta';
}) {
  return (
    <span
      className={cn(
        'label-caps border px-2 py-1 text-[8px]',
        tone === 'terracotta'
          ? 'border-terracotta/30 text-terracotta'
          : 'border-obsidian/15 text-obsidian/45'
      )}
    >
      {children}
    </span>
  );
}

function Detail({
  row,
  onStatus,
  onDelete,
}: {
  row: Submission;
  onStatus: (id: string, status: SubmissionStatus) => void;
  onDelete: (id: string) => void;
}) {
  const fields: [string, string][] = [
    ['Role', row.role],
    ['Organisation', row.organisation],
    ['Phone', row.phone],
    ['Hub', row.hub],
    ['Programme', row.event],
    ['Participating as', row.intent],
    ['LinkedIn', row.linkedin],
  ];

  const shown = fields.filter(([, value]) => value);

  return (
    <div className="flex h-full flex-col p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-serif text-3xl leading-tight text-obsidian">
            {row.name}
          </h2>
          <p className="label-caps mt-3 text-terracotta">
            {KIND_LABEL[row.kind] ?? row.kind} ·{' '}
            {new Date(row.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${row.email}?subject=${encodeURIComponent(
              `Re: ${row.intent || 'your enquiry'} — The Leadership Federation`
            )}`}
            className="label-caps rounded-full bg-terracotta px-4 py-2.5 text-white transition-colors hover:bg-obsidian"
          >
            Reply
          </a>
          <button
            type="button"
            onClick={() =>
              onStatus(row.id, row.status === 'archived' ? 'read' : 'archived')
            }
            className="label-caps rounded-full border border-obsidian/20 px-4 py-2.5 text-obsidian/60 transition-colors hover:border-obsidian hover:text-obsidian"
          >
            {row.status === 'archived' ? 'Unarchive' : 'Archive'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(row.id)}
            className="label-caps rounded-full border border-obsidian/20 px-4 py-2.5 text-obsidian/45 transition-colors hover:border-red-500 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <a
        href={`mailto:${row.email}`}
        className="mt-5 block break-all font-serif text-xl italic text-obsidian transition-colors hover:text-terracotta"
      >
        {row.email}
      </a>

      <dl className="mt-8 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 sm:grid-cols-2">
        {shown.map(([label, value]) => (
            <div key={label} className="bg-white/70 p-4">
              <dt className="label-caps text-obsidian/40">{label}</dt>
              <dd className="mt-2 break-words text-sm font-light text-obsidian/80">
                {label === 'LinkedIn' ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-obsidian/20 underline-offset-4 hover:text-terracotta"
                  >
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        {/* Keep the hairline grid rectangular when the field count is odd. */}
        {shown.length % 2 === 1 && (
          <div className="hidden bg-white/70 sm:block" aria-hidden="true" />
        )}
      </dl>

      {row.message && (
        <div className="mt-6">
          <p className="label-caps text-obsidian/40">Message</p>
          <p className="mt-3 whitespace-pre-wrap border-l-2 border-champagne pl-5 text-sm font-light leading-relaxed text-obsidian/80">
            {row.message}
          </p>
        </div>
      )}

      <p className="label-caps mt-auto pt-8 text-[9px] text-obsidian/25">
        {row.id} · {row.meta?.referer || 'direct'}
      </p>
    </div>
  );
}

function StorageNotice({ detail }: { detail: string }) {
  return (
    <div className="border-l-2 border-terracotta bg-white/70 p-6">
      <p className="label-caps text-terracotta">No store connected</p>
      <p className="mt-3 max-w-3xl text-sm font-light leading-relaxed text-obsidian/75">
        {detail} Forms currently fall back to opening the visitor&rsquo;s mail
        client, so nothing is lost — but nothing appears here either.
      </p>
      <p className="mt-4 max-w-3xl text-sm font-light leading-relaxed text-obsidian/60">
        To switch it on: Vercel dashboard → Storage → create a KV database →
        connect it to this project → redeploy. It injects{' '}
        <code>KV_REST_API_URL</code> and <code>KV_REST_API_TOKEN</code>{' '}
        automatically and this console starts filling up.
      </p>
    </div>
  );
}

function formatShort(iso: string) {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 864e5);
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}
