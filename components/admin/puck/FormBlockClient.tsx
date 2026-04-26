"use client"

/**
 * Client form for the Form block (B23). Submits to /api/builder-form.
 * Renders typed inputs (text/email/tel/textarea/select/checkbox).
 */

import { useState } from "react"

export type FormField = {
  id: string
  label: string
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox"
  required?: boolean
  options?: string[]
}

export function FormBlockClient({
  eventId,
  sourcePage,
  fields,
  ctaLabel,
  successMessage,
  webhookUrl,
}: {
  eventId: string
  sourcePage?: string
  fields: FormField[]
  ctaLabel: string
  successMessage: string
  webhookUrl?: string
}) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState("submitting")
    setErrorMsg(null)
    const fd = new FormData(e.currentTarget)
    const payload: Record<string, unknown> = {}
    for (const f of fields) {
      if (f.type === "checkbox") {
        payload[f.id] = fd.get(f.id) === "on"
      } else {
        payload[f.id] = fd.get(f.id) ?? ""
      }
    }
    // Honeypot (passthrough to API which silently 200s if filled).
    payload.company_website = fd.get("company_website") ?? ""
    try {
      const res = await fetch("/api/builder-form", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId, sourcePage, fields: payload, webhookUrl }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || "Submission failed")
        setState("error")
        return
      }
      setState("success")
    } catch (err) {
      setErrorMsg((err as Error).message || "Network error")
      setState("error")
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-900">
        {successMessage || "Thanks — we got your submission."}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot — bots fill all fields, humans don't see this. */}
      <input
        type="text"
        name="company_website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden
        className="absolute -left-[9999px] w-0 h-0 opacity-0 pointer-events-none"
      />
      {fields.map((f) => (
        <FormFieldInput key={f.id} field={f} />
      ))}
      {errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[#1a1a2e] text-sm font-bold disabled:opacity-60"
        style={{ backgroundColor: "var(--lf-primary, #e7ab1c)" }}
      >
        {state === "submitting" ? "Submitting…" : (ctaLabel || "Submit")}
      </button>
    </form>
  )
}

function FormFieldInput({ field }: { field: FormField }) {
  const baseCls = "w-full px-3 py-2 rounded-md border border-[#1a1a2e]/15 text-sm bg-white text-[#1a1a2e] focus:outline-none focus:border-[var(--lf-primary,#e7ab1c)] focus:ring-2 focus:ring-[var(--lf-primary,#e7ab1c)]/20"
  const required = field.required ?? false
  if (field.type === "textarea") {
    return (
      <label className="block">
        <span className="block text-[12px] font-medium mb-1">{field.label}{required && <span className="text-red-500"> *</span>}</span>
        <textarea name={field.id} required={required} rows={4} className={baseCls} />
      </label>
    )
  }
  if (field.type === "select") {
    return (
      <label className="block">
        <span className="block text-[12px] font-medium mb-1">{field.label}{required && <span className="text-red-500"> *</span>}</span>
        <select name={field.id} required={required} className={baseCls}>
          <option value="">Select…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
    )
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name={field.id} className="mt-0.5" />
        <span>{field.label}{required && <span className="text-red-500"> *</span>}</span>
      </label>
    )
  }
  return (
    <label className="block">
      <span className="block text-[12px] font-medium mb-1">{field.label}{required && <span className="text-red-500"> *</span>}</span>
      <input type={field.type} name={field.id} required={required} className={baseCls} />
    </label>
  )
}
