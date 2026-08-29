/**
 * Shared client-side form submission.
 *
 * Tries the API first so the enquiry lands in the admin inbox. If no store is
 * connected (or the request fails), it falls back to composing the message in
 * the visitor's mail client — the lead reaches a human either way, and the
 * caller is told which path was taken so it can show honest copy.
 */

export type SubmitOutcome = 'stored' | 'mail' | 'error';

export async function submitForm(
  payload: Record<string, string>,
  mailTo: string,
  mailSubject: string,
  mailBody: string
): Promise<SubmitOutcome> {
  try {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) return 'stored';

    /* 400 means we told them what to fix — don't silently open a mail draft. */
    if (response.status === 400) return 'error';
  } catch {
    /* fall through to mail */
  }

  window.location.href = `mailto:${mailTo}?subject=${encodeURIComponent(
    mailSubject
  )}&body=${encodeURIComponent(mailBody)}`;
  return 'mail';
}
