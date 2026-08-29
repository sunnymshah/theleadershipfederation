/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ADMIN AUTHENTICATION
 * ─────────────────────────────────────────────────────────────────────────
 *  No credential ever appears in this repository. The server holds only
 *  ADMIN_PASSWORD_HASH (a scrypt digest) and ADMIN_SESSION_SECRET, both read
 *  from the environment. Generate them with `node scripts/hash-password.mjs`.
 *
 *  Session cookies are HMAC-SHA256 signed with Web Crypto rather than Node
 *  crypto, so the exact same verification runs in Edge middleware and in Node
 *  route handlers — one implementation, no drift between the two.
 */

const encoder = new TextEncoder();

/* ── base64url ──────────────────────────────────────────────────────────── */

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Constant-time comparison — never leak how much of a signature matched. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ── session tokens ─────────────────────────────────────────────────────── */

export const SESSION_COOKIE = 'tlf_admin_session';
export const CSRF_COOKIE = 'tlf_admin_csrf';
/** Eight hours — a working day, then re-authenticate. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type SessionPayload = {
  /** Subject — who this session is for. */
  sub: string;
  /** Issued at (seconds). */
  iat: number;
  /** Expires at (seconds). */
  exp: number;
};

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  return secret;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

export async function createSessionToken(sub: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(sessionSecret());
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  );

  return `${body}.${toBase64Url(signature)}`;
}

/** Returns the payload only when the signature is valid AND unexpired. */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;

  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  try {
    const key = await hmacKey(sessionSecret());
    const expected = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    );

    if (!timingSafeEqual(expected, fromBase64Url(signature))) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body))
    ) as SessionPayload;

    if (typeof payload.exp !== 'number') return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/* ── CSRF ───────────────────────────────────────────────────────────────── */

export function createCsrfToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(24)));
}

/** Double-submit check: the cookie value must equal the submitted field. */
export function csrfMatches(cookieValue?: string, formValue?: string) {
  if (!cookieValue || !formValue) return false;
  return timingSafeEqual(
    encoder.encode(cookieValue),
    encoder.encode(formValue)
  );
}

export const isConfigured = () =>
  Boolean(process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_SESSION_SECRET);
