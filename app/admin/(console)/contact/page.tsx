"use client"

/**
 * ── CONTACT ADMIN ───────────────────────────────────────────────────
 * Manages three collections in one page:
 *   • contact_departments
 *   • contact_persons (department-scoped)
 *   • office_locations
 * Affects /contact public page.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getContactData,
  createContactDepartment,
  updateContactDepartment,
  deleteContactDepartment,
  createContactPerson,
  updateContactPerson,
  deleteContactPerson,
  createOfficeLocation,
  updateOfficeLocation,
  deleteOfficeLocation,
} from "@/app/actions/cmsActions"
import { Plus, Pencil, Trash2, Loader2, Mail, MapPin, UsersRound, Building } from "lucide-react"
import { cn } from "@/lib/utils"

interface Department {
  id: string; name: string; description: string | null; icon: string | null
  sort_order: number; is_active: boolean
}
interface Person {
  id: string; department_id: string; name: string; role: string | null
  email: string | null; phone: string | null; phone_raw: string | null
  sort_order: number; is_active: boolean
}
interface Office {
  id: string; city: string; address_lines: string[]; timezone: string | null
  phone: string | null; email: string | null; is_primary: boolean
  sort_order: number; is_active: boolean
}

type Mode = "department" | "person" | "office"

export default function AdminContactPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [persons, setPersons]         = useState<Person[]>([])
  const [offices, setOffices]         = useState<Office[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const [mode, setMode]               = useState<Mode | null>(null)
  const [editing, setEditing]         = useState<Department | Person | Office | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [personDeptId, setPersonDeptId] = useState<string>("")

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await getContactData(false)
    if (res.success) {
      setDepartments((res.departments ?? []) as Department[])
      setPersons((res.persons ?? []) as Person[])
      setOffices((res.offices ?? []) as Office[])
    } else setError(res.error ?? "Failed to load")
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function openDept(d?: Department) { setMode("department"); setEditing(d ?? null); setError(null) }
  function openPerson(p?: Person, deptId?: string) {
    setMode("person"); setEditing(p ?? null); setPersonDeptId(p?.department_id ?? deptId ?? departments[0]?.id ?? ""); setError(null)
  }
  function openOffice(o?: Office) { setMode("office"); setEditing(o ?? null); setError(null) }
  function close() { setMode(null); setEditing(null); setError(null) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const activeEl = form.querySelector<HTMLInputElement>('input[name="is_active_cb"]')
    fd.set("is_active", activeEl?.checked ? "true" : "false")

    if (mode === "office") {
      const primaryEl = form.querySelector<HTMLInputElement>('input[name="is_primary_cb"]')
      fd.set("is_primary", primaryEl?.checked ? "true" : "false")
    }

    if (editing && "id" in editing) fd.set("id", editing.id)

    let res
    if (mode === "department") {
      res = editing ? await updateContactDepartment(fd) : await createContactDepartment(fd)
    } else if (mode === "person") {
      res = editing ? await updateContactPerson(fd) : await createContactPerson(fd)
    } else {
      res = editing ? await updateOfficeLocation(fd) : await createOfficeLocation(fd)
    }

    if (res.success) { close(); await fetchAll() }
    else setError(res.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(kind: Mode, id: string) {
    if (!confirm(`Delete this ${kind}?`)) return
    setDeletingId(id)
    let res
    if (kind === "department")  res = await deleteContactDepartment(id)
    else if (kind === "person") res = await deleteContactPerson(id)
    else                        res = await deleteOfficeLocation(id)
    if (res.success) await fetchAll()
    else setError(res.error ?? "Failed to delete")
    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail size={22} className="text-amber-500" />
            Contact
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Departments, people, and office locations shown on /contact.
          </p>
        </div>
      </div>

      {error && !mode && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Form */}
      {mode && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editing ? `Edit ${mode}` : `New ${mode}`}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "department" && (() => {
              const d = editing as Department | null
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Name *"><input name="name" required defaultValue={d?.name ?? ""} className={inputCls} /></Field>
                    <Field label="Icon (lucide)"><input name="icon" defaultValue={d?.icon ?? ""} className={inputCls} placeholder="Handshake, Trophy, Megaphone, Mail" /></Field>
                  </div>
                  <Field label="Description">
                    <textarea name="description" defaultValue={d?.description ?? ""} rows={3} className={cn(inputCls, "resize-y")} />
                  </Field>
                </>
              )
            })()}

            {mode === "person" && (() => {
              const p = editing as Person | null
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Department *">
                      <select name="department_id" required value={personDeptId} onChange={(e) => setPersonDeptId(e.target.value)} className={inputCls}>
                        <option value="">— select —</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Name *"><input name="name" required defaultValue={p?.name ?? ""} className={inputCls} /></Field>
                    <Field label="Role"><input name="role" defaultValue={p?.role ?? ""} className={inputCls} placeholder="VP Marketing" /></Field>
                    <Field label="Email"><input name="email" type="email" defaultValue={p?.email ?? ""} className={inputCls} /></Field>
                    <Field label="Phone (display)"><input name="phone" defaultValue={p?.phone ?? ""} className={inputCls} placeholder="+91 72279 93338" /></Field>
                    <Field label="Phone (raw for tel:)"><input name="phone_raw" defaultValue={p?.phone_raw ?? ""} className={inputCls} placeholder="+917227993338" /></Field>
                  </div>
                </>
              )
            })()}

            {mode === "office" && (() => {
              const o = editing as Office | null
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="City *"><input name="city" required defaultValue={o?.city ?? ""} className={inputCls} /></Field>
                    <Field label="Timezone"><input name="timezone" defaultValue={o?.timezone ?? ""} className={inputCls} placeholder="GMT+4" /></Field>
                    <Field label="Phone"><input name="phone" defaultValue={o?.phone ?? ""} className={inputCls} /></Field>
                    <Field label="Email"><input name="email" type="email" defaultValue={o?.email ?? ""} className={inputCls} /></Field>
                  </div>
                  <Field label="Address Lines * (one per line)">
                    <textarea name="address_lines" required defaultValue={(o?.address_lines ?? []).join("\n")} rows={4} className={cn(inputCls, "resize-y")} placeholder={"The Leadership Federation\nOffice No. 44-43, Building of Dubai Municipality\nBur Dubai - Al Fahidi\nDubai, United Arab Emirates"} />
                  </Field>
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="checkbox" name="is_primary_cb" defaultChecked={o ? o.is_primary : false} className="w-4 h-4 rounded accent-[#e7ab1c]" />
                      Primary office
                    </label>
                  </div>
                </>
              )
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Sort Order">
                <input name="sort_order" type="number" defaultValue={(editing as {sort_order?: number})?.sort_order ?? 0} className={inputCls} />
              </Field>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" name="is_active_cb" defaultChecked={editing ? (editing as {is_active: boolean}).is_active : true} className="w-4 h-4 rounded accent-[#e7ab1c]" />
                  Active
                </label>
              </div>
            </div>

            {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-[#e7ab1c] text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-[#d49c10] disabled:opacity-50 transition-colors">
                {submitting ? "Saving…" : editing ? "Update" : "Create"}
              </button>
              <button type="button" onClick={close}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Departments */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Building size={14} /> Departments & Contact People
              </h3>
              <button onClick={() => openDept()} className="inline-flex items-center gap-1 text-xs text-[#e7ab1c] hover:text-[#d49c10] font-semibold">
                <Plus size={14} /> Add Department
              </button>
            </div>
            {departments.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400">No departments yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {departments.map(d => {
                  const people = persons.filter(p => p.department_id === d.id)
                  return (
                    <li key={d.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {d.name}
                            {!d.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                          </p>
                          {d.description && <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>}
                          <p className="text-[11px] text-gray-400 mt-0.5">icon: {d.icon ?? "—"} · order {d.sort_order}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => openDept(d)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => handleDelete("department", d.id)} disabled={deletingId === d.id}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                            {deletingId === d.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* People */}
                      <div className="mt-3 pl-4 border-l-2 border-gray-100">
                        {people.length === 0 ? (
                          <p className="text-xs text-gray-400">No people assigned.</p>
                        ) : (
                          <ul className="space-y-2">
                            {people.map(p => (
                              <li key={p.id} className="flex items-start justify-between gap-3 text-sm">
                                <div className="min-w-0 flex-1">
                                  <p className="text-gray-900">
                                    <UsersRound size={12} className="inline -mt-0.5 mr-1 text-gray-400" />
                                    {p.name}
                                    {p.role && <span className="ml-2 text-gray-500">— {p.role}</span>}
                                    {!p.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 flex gap-3">
                                    {p.email && <span>{p.email}</span>}
                                    {p.phone && <span>{p.phone}</span>}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button onClick={() => openPerson(p)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                                    <Pencil size={12} /> Edit
                                  </button>
                                  <button onClick={() => handleDelete("person", p.id)} disabled={deletingId === p.id}
                                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                                    {deletingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    Delete
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button onClick={() => openPerson(undefined, d.id)} className="mt-2 inline-flex items-center gap-1 text-xs text-[#e7ab1c] hover:text-[#d49c10] font-semibold">
                          <Plus size={12} /> Add Person
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Offices */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={14} /> Office Locations
              </h3>
              <button onClick={() => openOffice()} className="inline-flex items-center gap-1 text-xs text-[#e7ab1c] hover:text-[#d49c10] font-semibold">
                <Plus size={14} /> Add Office
              </button>
            </div>
            {offices.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400">No offices yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {offices.map(o => (
                  <li key={o.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {o.city}
                        {o.is_primary && <span className="ml-2 bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Primary</span>}
                        {!o.is_active && <span className="ml-2 text-gray-500 uppercase tracking-wide text-[10px] font-semibold">Inactive</span>}
                      </p>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        {o.address_lines.map((line, i) => <div key={i}>{line}</div>)}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 flex gap-3">
                        {o.timezone && <span>{o.timezone}</span>}
                        {o.phone && <span>{o.phone}</span>}
                        {o.email && <span>{o.email}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openOffice(o)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete("office", o.id)} disabled={deletingId === o.id}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                        {deletingId === o.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
