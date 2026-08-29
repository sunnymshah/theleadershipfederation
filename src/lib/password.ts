/**
 * scrypt verification. Node runtime only — the login route opts into it with
 * `export const runtime = 'nodejs'`.
 *
 * Stored format: scrypt:N:r:p:<salt b64>:<hash b64>
 *
 * ':' rather than '$' as the separator — Next.js pipes .env values through
 * dotenv-expand, which would read `$16384` as a variable reference and blank
 * it. Base64 never contains ':', so parsing stays unambiguous.
 */
import { scrypt, timingSafeEqual } from 'node:crypto';

export async function verifyPassword(
  password: string,
  stored: string | undefined
): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }

  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');

  const derived = await new Promise<Buffer>((resolve, reject) => {
    /* maxmem must be raised for N=16384: the default 32MB cap rejects it. */
    scrypt(
      password,
      salt,
      expected.length,
      { N, r, p, maxmem: 256 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key))
    );
  });

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
