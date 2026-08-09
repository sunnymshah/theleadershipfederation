'use client';

import { useState } from 'react';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { SITE } from '@/config/site';

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
 * Submitting composes a message in the visitor's own mail client — nothing is
 * transmitted from the page, so the form is fully functional with no backend
 * and no third-party data processor.
 *
 * TO SWITCH TO A HOSTED ENDPOINT: replace the body of `handleSubmit` with a
 * `fetch('/api/inquire', { method: 'POST', body: JSON.stringify(form) })` and
 * add the route handler. Keep the field names — they match the mail template.
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

  const update = (key: keyof typeof form) => (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

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

    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
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

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          className="group inline-flex items-center space-x-4 rounded-full bg-terracotta px-8 py-4 text-white shadow-lg transition-colors duration-300 hover:bg-obsidian"
        >
          <span className="text-xs font-semibold uppercase tracking-widest">
            Send enquiry
          </span>
          <ArrowForwardIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        <p className="text-xs font-light text-obsidian/50">
          Opens a pre-filled message in your mail client — nothing is sent from
          this page.
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
