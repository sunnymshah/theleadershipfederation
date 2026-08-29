'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { CSRF_COOKIE } from '@/lib/auth';

export function LoginForm({
  csrf,
  setCookie,
}: {
  csrf: string;
  setCookie: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /* The cookie half of the double-submit pair. Readable by script on purpose —
     its only job is to prove the request came from a page we served. */
  useEffect(() => {
    if (!setCookie) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CSRF_COOKIE}=${csrf}; Path=/; SameSite=Strict; Max-Age=1800${secure}`;
  }, [csrf, setCookie]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password, csrf }),
      });

      if (response.ok) {
        const next = params.get('next');
        router.replace(next && next.startsWith('/admin') ? next : '/admin');
        router.refresh();
        return;
      }

      const data = await response.json().catch(() => ({}));
      setError(data.error ?? 'Sign-in failed.');
      setPassword('');
    } catch {
      setError('Network error — try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10">
      <label
        htmlFor="password"
        className="label-caps mb-3 block text-obsidian/50"
      >
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full border-b border-obsidian/25 bg-transparent py-3 font-sans text-base font-light text-obsidian outline-none transition-colors placeholder:text-obsidian/30 focus:border-terracotta"
        placeholder="••••••••"
      />

      {error && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-terracotta bg-white/50 py-3 pl-4 text-sm font-light text-obsidian/80"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="group mt-10 inline-flex items-center space-x-4 rounded-full bg-terracotta px-8 py-4 text-white shadow-lg transition-colors duration-300 hover:bg-obsidian disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="text-xs font-semibold uppercase tracking-widest">
          {pending ? 'Checking…' : 'Sign in'}
        </span>
        <ArrowForwardIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}
