'use client';

import { useState } from 'react';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { SITE } from '@/config/site';
import { submitForm, type SubmitOutcome } from '@/lib/submit-form';

const INTERESTS = [
  'A conclave seat',
  'A roundtable seat',
  'Inner Circle consideration',
  'Partnership / sponsorship',
  'Speaking on stage',
  'Board or jury nomination',
  'Something else',
] as const;

const FIELD =
  'w-full border-b border-obsidian/25 bg-transparent py-3 font-sans text-base font-light text-obsidian outline-none transition-colors placeholder:text-obsidian/30 focus:border-terracotta';

/**
 * Enquiry form.
 *
 * Posts to /api/submissions so the enquiry lands in the admin inbox, falling
 * back to the visitor's mail client when no store is connected.
 */
export function InquiryForm() {
  const [form, setForm] = useState({
    name: '',
    role: '',
    organisation: '',
    email: '',
    hub: '',
    interest: INTERESTS[0] as string,
    message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const subject = `${form.interest} — ${form.organisation || form.name}`;
    const body = [
      `Name: ${form.name}`,
      `Role: ${form.role}`,
      `Organisation: ${form.organisation}`,
      `Email: ${form.email}`,
      `Hub / city: ${form.hub}`,
      `Interest: ${form.interest}`,
      '',
      'The question I would bring:',
      form.message,
    ].join('\n');

    const result = await submitForm(
      {
        kind: 'inquiry',
        name: form.name,
        email: form.email,
        organisation: form.organisation,
        role: form.role,
        hub: form.hub,
        intent: form.interest,
        message: form.message,
        company_website: honeypot,
      },
      SITE.email,
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
            ? 'Thank you — your enquiry is with us.'
            : 'Finish sending in your mail client.'}
        </h3>
        <p className="mt-4 text-sm font-light leading-relaxed text-obsidian/70">
          {outcome === 'stored'
            ? 'The committee reads every enquiry and replies either way.'
            : 'We opened a pre-filled message for you — press send and it reaches the committee.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="inq_company_website">Company website</label>
        <input
          id="inq_company_website"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            value={form.name}
            onChange={update('name')}
            className={FIELD}
            placeholder="Full name"
            autoComplete="name"
          />
        </Field>

        <Field label="Role" htmlFor="role">
          <input
            id="role"
            name="role"
            required
            value={form.role}
            onChange={update('role')}
            className={FIELD}
            placeholder="e.g. GCC Head"
            autoComplete="organization-title"
          />
        </Field>

        <Field label="Organisation" htmlFor="organisation">
          <input
            id="organisation"
            name="organisation"
            required
            value={form.organisation}
            onChange={update('organisation')}
            className={FIELD}
            placeholder="Company"
            autoComplete="organization"
          />
        </Field>

        <Field label="Work email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            className={FIELD}
            placeholder="name@company.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Hub / city" htmlFor="hub">
          <input
            id="hub"
            name="hub"
            value={form.hub}
            onChange={update('hub')}
            className={FIELD}
            placeholder="e.g. Hyderabad"
          />
        </Field>

        <Field label="Interest" htmlFor="interest">
          <select
            id="interest"
            name="interest"
            value={form.interest}
            onChange={update('interest')}
            className={`${FIELD} cursor-pointer`}
          >
            {INTERESTS.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="The question you would bring"
            htmlFor="message"
            hint="One operating problem, in your own words."
          >
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              value={form.message}
              onChange={update('message')}
              className={`${FIELD} resize-none`}
              placeholder="What are you trying to solve?"
            />
          </Field>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-8 border-l-2 border-terracotta bg-white/60 py-3 pl-4 text-sm font-light text-obsidian/80">
          {error}
        </p>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex items-center space-x-4 rounded-full bg-terracotta px-8 py-4 text-white shadow-lg transition-colors duration-300 hover:bg-obsidian disabled:opacity-50"
        >
          <span className="text-xs font-semibold uppercase tracking-widest">
            {pending ? 'Sending…' : 'Send enquiry'}
          </span>
          <ArrowForwardIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        <p className="text-xs font-light text-obsidian/50">
          We reply to every enquiry.
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
      {hint ? (
        <p className="mt-3 text-xs font-light text-obsidian/40">{hint}</p>
      ) : null}
    </div>
  );
}
