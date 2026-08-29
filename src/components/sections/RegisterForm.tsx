'use client';

import { useState } from 'react';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { OFFICE } from '@/data/contact';
import { submitForm, type SubmitOutcome } from '@/lib/submit-form';
import { EDITIONS } from '@/data/editions';

const PARTICIPATION = [
  'Nomination for an award',
  'Delegate',
  'Sponsor',
  'Speaker',
] as const;

const UPCOMING = EDITIONS.filter((e) => e.status === 'Upcoming');

const FIELD =
  'w-full border-b border-obsidian/25 bg-transparent py-3 font-sans text-base font-light text-obsidian outline-none transition-colors placeholder:text-obsidian/30 focus:border-terracotta';

/**
 * Registration form.
 *
 * Posts to /api/submissions so the lead lands in the admin inbox. If no store
 * is connected the API says so and we fall back to the visitor's mail client,
 * which is why the success copy differs between the two paths — it would be
 * dishonest to show "received" for something that was never saved.
 */
export function RegisterForm({ defaultAs }: { defaultAs?: string }) {
  const initialAs =
    PARTICIPATION.find((p) => p.toLowerCase() === defaultAs?.toLowerCase()) ??
    PARTICIPATION[0];

  const [form, setForm] = useState({
    name: '',
    role: '',
    organisation: '',
    email: '',
    phone: '',
    linkedin: '',
    event: UPCOMING[0]?.title ?? '',
    participation: initialAs as string,
    message: '',
  });
  /* Hidden from people, irresistible to bots. */
  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update =
    (key: keyof typeof form) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const subject = `${form.participation} — ${form.organisation || form.name}`;
    const body = [
      `Name: ${form.name}`,
      `Role: ${form.role}`,
      `Organisation: ${form.organisation}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `LinkedIn: ${form.linkedin || '—'}`,
      `Event: ${form.event}`,
      `Participating as: ${form.participation}`,
      '',
      'Notes:',
      form.message || '—',
    ].join('\n');

    const result = await submitForm(
      {
        kind: 'register',
        name: form.name,
        email: form.email,
        organisation: form.organisation,
        role: form.role,
        phone: form.phone,
        linkedin: form.linkedin,
        event: form.event,
        intent: form.participation,
        message: form.message,
        company_website: honeypot,
      },
      OFFICE.registerEmail,
      subject,
      body
    );

    if (result === 'error') {
      setError('Please check your name and work email, then try again.');
    } else {
      setOutcome(result);
    }
    setPending(false);
  };

  if (outcome) {
    return (
      <div className="card-silk max-w-2xl p-8 md:p-10">
        <p className="label-caps text-terracotta">
          {outcome === 'stored' ? 'Received' : 'Almost there'}
        </p>
        <h3 className="mt-5 font-serif text-3xl leading-tight text-obsidian">
          {outcome === 'stored'
            ? 'Thank you — your registration is with us.'
            : 'Finish sending in your mail client.'}
        </h3>
        <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
          {outcome === 'stored'
            ? 'The programme committee reads every submission and will come back to you either way.'
            : 'We opened a pre-filled message for you — press send and it reaches the committee.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <input id="name" required value={form.name} onChange={update('name')} className={FIELD} placeholder="Full name" autoComplete="name" />
        </Field>

        <Field label="Role" htmlFor="role">
          <input id="role" required value={form.role} onChange={update('role')} className={FIELD} placeholder="e.g. GCC Head" autoComplete="organization-title" />
        </Field>

        <Field label="Organisation" htmlFor="organisation">
          <input id="organisation" required value={form.organisation} onChange={update('organisation')} className={FIELD} placeholder="Company" autoComplete="organization" />
        </Field>

        <Field label="Work email" htmlFor="email">
          <input id="email" type="email" required value={form.email} onChange={update('email')} className={FIELD} placeholder="name@company.com" autoComplete="email" />
        </Field>

        <Field label="Phone" htmlFor="phone">
          <input id="phone" type="tel" value={form.phone} onChange={update('phone')} className={FIELD} placeholder="+91…" autoComplete="tel" />
        </Field>

        <Field label="LinkedIn profile" htmlFor="linkedin" hint="Optional.">
          <input id="linkedin" type="url" value={form.linkedin} onChange={update('linkedin')} className={FIELD} placeholder="linkedin.com/in/…" />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Which event would you like to participate in?" htmlFor="event">
            <select id="event" value={form.event} onChange={update('event')} className={`${FIELD} cursor-pointer`}>
              {UPCOMING.map((edition) => (
                <option key={edition.index} value={`${edition.title} — ${edition.city}, ${edition.date}`}>
                  {edition.title} — {edition.city}, {edition.date}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <p className="label-caps mb-5 text-obsidian/50">
            How would you like to participate?
          </p>
          <div className="flex flex-wrap gap-3">
            {PARTICIPATION.map((option) => (
              <label
                key={option}
                className={`cursor-pointer rounded-full border px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-300 ${
                  form.participation === option
                    ? 'border-obsidian bg-obsidian text-white'
                    : 'border-obsidian/20 text-obsidian/60 hover:border-obsidian/50 hover:text-obsidian'
                }`}
              >
                <input
                  type="radio"
                  name="participation"
                  value={option}
                  checked={form.participation === option}
                  onChange={update('participation')}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <Field label="Anything we should know?" htmlFor="message" hint="Optional — the question you would bring to the room.">
            <textarea id="message" rows={3} value={form.message} onChange={update('message')} className={`${FIELD} resize-none`} placeholder="Tell us briefly" />
          </Field>
        </div>
      </div>

      <label className="mt-12 flex cursor-pointer items-start gap-4">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#DF5838]"
        />
        <span className="text-xs font-light leading-relaxed text-obsidian/60">
          I consent to The Leadership Federation contacting me by email, call or
          WhatsApp with event details and periodic updates.
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-8 border-l-2 border-terracotta bg-white/60 py-3 pl-4 text-sm font-light text-obsidian/80">
          {error}
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex items-center space-x-4 rounded-full bg-terracotta px-8 py-4 text-white shadow-lg transition-colors duration-300 hover:bg-obsidian disabled:opacity-50"
        >
          <span className="text-xs font-semibold uppercase tracking-widest">
            {pending ? 'Sending…' : 'Nominate now'}
          </span>
          <ArrowForwardIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        <p className="text-xs font-light text-obsidian/50">
          We reply to every submission.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label-caps mb-3 block text-obsidian/50">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-3 text-xs font-light text-obsidian/40">{hint}</p> : null}
    </div>
  );
}
