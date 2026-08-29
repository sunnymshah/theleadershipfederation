import { cookies } from 'next/headers';

import { LoginForm } from '@/components/admin/LoginForm';
import { CSRF_COOKIE, createCsrfToken, isConfigured } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  /* A fresh CSRF token per render, handed to the form and mirrored in a
     cookie. The API accepts the post only when the two agree. */
  const store = cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  const csrf = existing ?? createCsrfToken();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <p className="label-caps flex items-center text-terracotta">
          <span className="mr-4 h-[1px] w-8 bg-terracotta" />
          Restricted
        </p>

        <h1 className="mt-8 font-serif text-5xl font-medium leading-[1.0] tracking-tighter text-obsidian">
          Admin
          <span className="block italic text-terracotta/90">portal.</span>
        </h1>

        <div className="mt-6 h-[2px] w-24 bg-champagne" />

        {isConfigured() ? (
          <LoginForm csrf={csrf} setCookie={!existing} />
        ) : (
          <div className="card-silk mt-10 p-8">
            <p className="label-caps text-terracotta">Not configured</p>
            <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
              This deployment has no <code>ADMIN_PASSWORD_HASH</code> or{' '}
              <code>ADMIN_SESSION_SECRET</code> set. Generate them with{' '}
              <code>node scripts/hash-password.mjs</code> and add them to the
              environment.
            </p>
          </div>
        )}

        <p className="label-caps mt-10 text-obsidian/35">
          The Leadership Federation
        </p>
      </div>
    </main>
  );
}
