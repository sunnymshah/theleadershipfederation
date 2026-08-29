/**
 * Generates the values that belong in the environment — never in the repo.
 *
 *   node scripts/hash-password.mjs            # prompts, nothing echoed to disk
 *   ADMIN_PASSWORD='…' node scripts/hash-password.mjs
 *
 * Prints ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET. Paste them into
 * .env.local for development and into the Vercel project's environment
 * variables for production. The plaintext password is never stored anywhere.
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const N = 16384, r = 8, p = 1, KEYLEN = 64;

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = await rl.question('New admin password: ');
  rl.close();
  return answer;
}

const password = (await readPassword()).trim();
if (password.length < 8) {
  console.error('Refusing: use at least 8 characters.');
  process.exit(1);
}

const salt = randomBytes(32);
const hash = scryptSync(password, salt, KEYLEN, { N, r, p });

/* ':' rather than '$' — Next.js runs .env values through dotenv-expand, which
   would treat `$16384` as a variable reference and silently blank it out.
   Base64 never contains ':', so it is an unambiguous separator. */
console.log(`ADMIN_PASSWORD_HASH=scrypt:${N}:${r}:${p}:${salt.toString('base64')}:${hash.toString('base64')}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString('base64')}`);
