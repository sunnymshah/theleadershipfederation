/**
 * Login throttling.
 *
 * A per-instance in-memory counter. On serverless this is best-effort — each
 * warm instance keeps its own tally, so a determined attacker spraying across
 * cold starts gets more attempts than the nominal limit. It is still worth
 * having: it stops the common case (a script hammering one endpoint) dead, and
 * it costs nothing. The real backstop is that the password is scrypt-hashed
 * with N=16384, which makes each guess deliberately expensive.
 *
 * If you later add Vercel KV, swap the Map for an atomic INCR with TTL and
 * this becomes a hard global limit.
 */

type Attempt = { count: number; firstAt: number; blockedUntil: number };

const attempts = new Map<string, Attempt>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BASE_BLOCK_MS = 60 * 1000;
/** Stop the map growing without bound on a long-lived instance. */
const MAX_TRACKED = 5000;

export type RateResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

export function checkRateLimit(key: string): RateResult {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record) return { allowed: true, retryAfterSeconds: 0, remaining: MAX_ATTEMPTS };

  if (record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000),
      remaining: 0,
    };
  }

  if (now - record.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true, retryAfterSeconds: 0, remaining: MAX_ATTEMPTS };
  }

  return {
    allowed: record.count < MAX_ATTEMPTS,
    retryAfterSeconds: 0,
    remaining: Math.max(0, MAX_ATTEMPTS - record.count),
  };
}

export function registerFailure(key: string) {
  const now = Date.now();

  if (attempts.size > MAX_TRACKED) attempts.clear();

  const record = attempts.get(key) ?? { count: 0, firstAt: now, blockedUntil: 0 };
  if (now - record.firstAt > WINDOW_MS) {
    record.count = 0;
    record.firstAt = now;
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    /* Each attempt past the limit doubles the wait: 1m, 2m, 4m, 8m… */
    const overage = record.count - MAX_ATTEMPTS;
    record.blockedUntil = now + BASE_BLOCK_MS * Math.pow(2, Math.min(overage, 6));
  }

  attempts.set(key, record);
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}

/** Best-available client identifier behind Vercel's proxy. */
export function clientKey(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
  return `login:${ip}`;
}
