/** Shape of everything captured from the public forms. */

export type SubmissionKind = 'register' | 'inquiry';
export type SubmissionStatus = 'new' | 'read' | 'archived';

export type Submission = {
  id: string;
  createdAt: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  name: string;
  email: string;
  organisation: string;
  role: string;
  phone: string;
  linkedin: string;
  /** Register: the programme picked. */
  event: string;
  /** Register: award / delegate / sponsor / speaker. Inquiry: interest. */
  intent: string;
  hub: string;
  message: string;
  meta: { ua: string; referer: string };
};

export const STATUSES: SubmissionStatus[] = ['new', 'read', 'archived'];

/** Sortable, URL-safe id: time prefix keeps natural ordering. */
export function newId() {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}${random}`;
}

const MAX = {
  name: 120,
  email: 160,
  organisation: 160,
  role: 160,
  phone: 40,
  linkedin: 300,
  event: 200,
  intent: 80,
  hub: 80,
  message: 4000,
};

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ParseResult =
  | { ok: true; value: Omit<Submission, 'id' | 'createdAt' | 'status'> }
  | { ok: false; error: string };

/** Validates and normalises an untrusted public payload. */
export function parseSubmission(
  body: unknown,
  meta: { ua: string; referer: string }
): ParseResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Malformed request.' };
  }

  const raw = body as Record<string, unknown>;

  /* Honeypot: a hidden field only a bot fills in. Accepted, then dropped. */
  if (clean(raw.company_website, 200)) {
    return { ok: false, error: 'spam' };
  }

  const kind: SubmissionKind = raw.kind === 'inquiry' ? 'inquiry' : 'register';
  const name = clean(raw.name, MAX.name);
  const email = clean(raw.email, MAX.email);

  if (name.length < 2) return { ok: false, error: 'Please enter your name.' };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please enter a valid work email.' };
  }

  return {
    ok: true,
    value: {
      kind,
      name,
      email,
      organisation: clean(raw.organisation, MAX.organisation),
      role: clean(raw.role, MAX.role),
      phone: clean(raw.phone, MAX.phone),
      linkedin: clean(raw.linkedin, MAX.linkedin),
      event: clean(raw.event, MAX.event),
      intent: clean(raw.intent, MAX.intent),
      hub: clean(raw.hub, MAX.hub),
      message: clean(raw.message, MAX.message),
      meta,
    },
  };
}

/** CSV escaping that survives Excel and Sheets. */
export function toCsv(rows: Submission[]): string {
  const columns: (keyof Submission)[] = [
    'createdAt', 'kind', 'status', 'name', 'email', 'organisation',
    'role', 'phone', 'linkedin', 'event', 'intent', 'hub', 'message',
  ];

  const escape = (value: string) => {
    const text = String(value ?? '');
    /* Neutralise formula injection — a leading =, +, - or @ is executable. */
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  return [
    columns.join(','),
    ...rows.map((row) =>
      columns.map((column) => escape(String(row[column] ?? ''))).join(',')
    ),
  ].join('\n');
}
