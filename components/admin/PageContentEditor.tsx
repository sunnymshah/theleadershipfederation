"use client"

/**
 * ─── PAGE CONTENT EDITOR ────────────────────────────────────────────────
 *
 * Generic admin editor for `page_content` table sections. Drop it into
 * any admin page to expose hero text, stats strips, benefit lists, etc.
 * as editable forms. Shape describes one section (hero vs. list-of-items).
 */

import { useState, useEffect, useCallback } from "react"
import { getPageSection, savePageSection } from "@/app/actions/pageContentActions"
import { Plus, Trash2, Loader2, Save, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Section descriptors ───────────────────────────────────────────── */

export type FieldDef = {
  name: string
  label: string
  placeholder?: string
  textarea?: boolean
}

export type SectionDef =
  | {
      /** A fixed-shape object (e.g. hero: { eyebrow, title, description }) */
      kind: "fields"
      sectionKey: string
      label: string
      description?: string
      fields: FieldDef[]
    }
  | {
      /** A list of items, each with the same shape (stats, benefits, etc.) */
      kind: "list"
      sectionKey: string
      label: string
      description?: string
      itemFields: FieldDef[]
      /** Field used as the item's display title in the collapsed header */
      titleField: string
      /** Label for each item row (e.g. "Stat", "Benefit") */
      itemLabel: string
    }

interface Props {
  pageSlug: string
  sections: SectionDef[]
}

/* ═══════════════════════════════════════════════════════════════════ */

export function PageContentEditor({ pageSlug, sections }: Props) {
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <SectionCard key={s.sectionKey} pageSlug={pageSlug} section={s} />
      ))}
    </div>
  )
}

/* ── Section card ──────────────────────────────────────────────────── */

function SectionCard({ pageSlug, section }: { pageSlug: string; section: SectionDef }) {
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(true)
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const fetchContent = useCallback(async () => {
    setLoading(true)
    const res = await getPageSection(pageSlug, section.sectionKey)
    setContent((res.content as Record<string, unknown>) ?? {})
    setLoading(false)
  }, [pageSlug, section.sectionKey])

  useEffect(() => { fetchContent() }, [fetchContent])

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    const res = await savePageSection(pageSlug, section.sectionKey, content)
    setSaving(false)
    if (res.success) {
      setMessage({ type: "ok", text: "Saved." })
      setTimeout(() => setMessage(null), 2500)
    } else {
      setMessage({ type: "err", text: res.error ?? "Failed to save" })
    }
  }

  return (
    <div className="rounded-xl border border-[#e0e0e0] bg-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#fafafa] transition-colors rounded-xl"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-[#333]">{section.label}</p>
          {section.description && (
            <p className="text-[12px] text-[#888] mt-0.5">{section.description}</p>
          )}
        </div>
        {open ? <ChevronDown size={16} className="text-[#888]" /> : <ChevronRight size={16} className="text-[#888]" />}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[#eee]">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[#aaa] gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : section.kind === "fields" ? (
            <FieldsEditor section={section} value={content} onChange={setContent} />
          ) : (
            <ListEditor section={section} value={content} onChange={setContent} />
          )}

          <div className="flex items-center gap-3 mt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-semibold",
                "hover:bg-[#d4b85c] disabled:opacity-50 transition-colors"
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Section
            </button>
            {message && (
              <span
                className={cn(
                  "text-[13px]",
                  message.type === "ok" ? "text-emerald-600" : "text-red-500"
                )}
              >
                {message.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Fixed-shape editor ────────────────────────────────────────────── */

function FieldsEditor({
  section,
  value,
  onChange,
}: {
  section: Extract<SectionDef, { kind: "fields" }>
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-4 mt-3">
      {section.fields.map((f) => {
        const v = (value[f.name] as string | undefined) ?? ""
        return (
          <div key={f.name}>
            <label className="block text-[12px] font-semibold text-[#555] mb-1.5">{f.label}</label>
            {f.textarea ? (
              <textarea
                value={v}
                placeholder={f.placeholder}
                rows={3}
                onChange={(e) => onChange({ ...value, [f.name]: e.target.value })}
                className={inputCls + " resize-y min-h-[76px]"}
              />
            ) : (
              <input
                type="text"
                value={v}
                placeholder={f.placeholder}
                onChange={(e) => onChange({ ...value, [f.name]: e.target.value })}
                className={inputCls}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── List editor ───────────────────────────────────────────────────── */

function ListEditor({
  section,
  value,
  onChange,
}: {
  section: Extract<SectionDef, { kind: "list" }>
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const items = (value.items as Array<Record<string, string>> | undefined) ?? []

  function updateItem(idx: number, patch: Record<string, string>) {
    const next = [...items]
    next[idx] = { ...next[idx], ...patch }
    onChange({ ...value, items: next })
  }
  function addItem() {
    const blank: Record<string, string> = {}
    section.itemFields.forEach((f) => (blank[f.name] = ""))
    onChange({ ...value, items: [...items, blank] })
  }
  function removeItem(idx: number) {
    onChange({ ...value, items: items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3 mt-3">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold text-[#666] uppercase tracking-wider">
              {section.itemLabel} {idx + 1}
              {item[section.titleField] && (
                <span className="ml-2 text-[#333] normal-case tracking-normal">· {item[section.titleField]}</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="p-1.5 text-[#888] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
              title="Remove"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.itemFields.map((f) => (
              <div key={f.name} className={f.textarea ? "md:col-span-2" : ""}>
                <label className="block text-[11px] font-semibold text-[#555] mb-1">{f.label}</label>
                {f.textarea ? (
                  <textarea
                    value={item[f.name] ?? ""}
                    placeholder={f.placeholder}
                    rows={2}
                    onChange={(e) => updateItem(idx, { [f.name]: e.target.value })}
                    className={inputCls + " resize-y min-h-[60px]"}
                  />
                ) : (
                  <input
                    type="text"
                    value={item[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => updateItem(idx, { [f.name]: e.target.value })}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#c9a84c]/50 text-[#c9a84c] text-sm font-semibold hover:bg-[#c9a84c]/5 transition-colors"
      >
        <Plus size={14} /> Add {section.itemLabel}
      </button>
    </div>
  )
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-white border border-[#e0e0e0] text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c]"
