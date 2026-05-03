"use client"

/**
 * Zoho-parity manager table.
 *
 * Replaces the EntityListItem list view with a full table — top
 * toolbar (search + Filter / Sort / Columns icons + Add button), body
 * rows with optional checkbox + avatar + per-column cells + hover
 * actions kebab menu, header row sortable. Filter / Sort / Columns
 * popovers live in the toolbar; column visibility persists per-tableId
 * in localStorage (`lf-manager-columns-{tableId}`).
 *
 * Used by SpeakersManager, SessionsManager, TicketsManager,
 * SponsorsManager, ExhibitorsManager, HotelsManager. Each manager
 * supplies a typed columns[] config + onAdd / onRowClick callbacks.
 *
 * Component contract intentionally narrow — the table doesn't own
 * mutations. Consumers call their own server actions on add / edit /
 * delete and pass the refreshed `items` back in.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  Filter, ArrowUpDown, Columns3, Plus, Search, MoreHorizontal,
  ChevronUp, ChevronDown, X, Check,
} from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"

export type ColumnDef<T> = {
  /** Stable key — used for sort + visibility persistence. */
  key: string
  /** Header text. */
  label: string
  /** Renders the cell body. */
  render: (item: T) => ReactNode
  /** Comparator value for sort. Falsy when sort isn't supported. */
  sortValue?: (item: T) => string | number
  /** Whether the column is sortable (default true when sortValue set). */
  sortable?: boolean
  /** Default visibility when no localStorage entry exists. */
  defaultVisible?: boolean
  /** Optional column width for the header / first body cell. */
  width?: string
  /** Optional textual filter — when set, the Filter dropdown surfaces
   *  a text input that does case-insensitive substring matching. */
  filter?: (item: T, q: string) => boolean
}

export type RowAction<T> = {
  icon: ReactNode
  label: string
  onClick: (item: T) => void
  danger?: boolean
}

export type BulkAction = {
  label: string
  onClick: (ids: string[]) => void
  danger?: boolean
}

export function ManagerTable<T extends { id: string }>({
  tableId,
  title,
  onClose,
  items,
  columns,
  rowAvatar,
  rowActions,
  onAdd,
  onRowClick,
  addLabel,
  bulkActions,
  initialSort,
  emptyTitle,
  emptyHint,
  searchPlaceholder,
}: {
  tableId: string
  title: string
  onClose?: () => void
  items: T[]
  columns: ColumnDef<T>[]
  rowAvatar?: (item: T) => { src?: string | null; fallback: string; prefix?: ReactNode }
  rowActions?: (item: T) => RowAction<T>[]
  onAdd: () => void
  onRowClick: (item: T) => void
  addLabel: string
  bulkActions?: BulkAction[]
  initialSort?: { key: string; dir: "asc" | "desc" }
  emptyTitle?: string
  emptyHint?: string
  searchPlaceholder?: string
}) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(`lf-manager-columns-${tableId}`)
        if (raw) return new Set(JSON.parse(raw) as string[])
      }
    } catch {}
    return new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.key))
  })
  const [openMenu, setOpenMenu] = useState<null | "filter" | "sort" | "columns">(null)
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Persist column visibility.
  useEffect(() => {
    try {
      localStorage.setItem(`lf-manager-columns-${tableId}`, JSON.stringify(Array.from(visibleKeys)))
    } catch {}
  }, [visibleKeys, tableId])

  // Click-outside closes any open dropdown.
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!openMenu) return
    function onDoc(e: MouseEvent) {
      if (!toolbarRef.current) return
      if (toolbarRef.current.contains(e.target as Node)) return
      setOpenMenu(null)
    }
    window.addEventListener("mousedown", onDoc)
    return () => window.removeEventListener("mousedown", onDoc)
  }, [openMenu])

  // Filter + sort the items.
  const visibleColumns = columns.filter((c) => visibleKeys.has(c.key))
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = items
    if (q) {
      rows = rows.filter((it) => {
        // Match across every column with a sortValue (string-stringified).
        return columns.some((c) => {
          const v = c.sortValue?.(it)
          if (typeof v === "string") return v.toLowerCase().includes(q)
          if (typeof v === "number") return String(v).includes(q)
          return false
        })
      })
    }
    for (const c of columns) {
      const v = filterValues[c.key]
      if (v && v.trim() && c.filter) {
        const qq = v.trim()
        rows = rows.filter((it) => c.filter!(it, qq))
      }
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col?.sortValue) {
        rows = [...rows].sort((a, b) => {
          const av = col.sortValue!(a)
          const bv = col.sortValue!(b)
          if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av
          const sa = String(av ?? "").toLowerCase()
          const sb = String(bv ?? "").toLowerCase()
          if (sa < sb) return sort.dir === "asc" ? -1 : 1
          if (sa > sb) return sort.dir === "asc" ?  1 : -1
          return 0
        })
      }
    }
    return rows
  }, [items, columns, search, sort, filterValues])

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" }
      if (prev.dir === "asc") return { key, dir: "desc" }
      return null
    })
  }
  function toggleVisible(key: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const allSelected = filtered.length > 0 && filtered.every((it) => selected.has(it.id))
  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((it) => it.id)))
  }

  const showCheckboxes = !!bulkActions && bulkActions.length > 0

  const sortableCols = columns.filter((c) => c.sortable !== false && !!c.sortValue)
  const filterCols = columns.filter((c) => c.filter)

  return (
    <SecondaryPanel title={title} onClose={onClose}>
      <div ref={toolbarRef} className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--z-border,#e5e7eb)] bg-white relative">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--z-text-muted,#6b7280)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
            className="z-input !pl-7 !h-7 !text-[12px]"
          />
        </div>
        <ToolbarBtn active={openMenu === "filter"} onClick={() => setOpenMenu(openMenu === "filter" ? null : "filter")} title="Filter"><Filter size={12} /></ToolbarBtn>
        <ToolbarBtn active={openMenu === "sort"}   onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")} title="Sort"><ArrowUpDown size={12} /></ToolbarBtn>
        <ToolbarBtn active={openMenu === "columns"} onClick={() => setOpenMenu(openMenu === "columns" ? null : "columns")} title="Columns"><Columns3 size={12} /></ToolbarBtn>
        <button
          type="button"
          onClick={onAdd}
          className="z-btn-primary !h-7 !text-[11px]"
        >
          <Plus size={12} strokeWidth={2} />
          {addLabel}
        </button>

        {openMenu === "filter" && (
          <Popover>
            <PopoverHeader>Filters</PopoverHeader>
            {filterCols.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-[var(--z-text-muted,#6b7280)] italic">No filterable columns.</p>
            ) : (
              filterCols.map((c) => (
                <label key={c.key} className="block px-3 py-1.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{c.label}</span>
                  <input
                    value={filterValues[c.key] ?? ""}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, [c.key]: e.target.value }))}
                    placeholder={`Filter ${c.label.toLowerCase()}…`}
                    className="z-input !h-7 !text-[11px]"
                  />
                </label>
              ))
            )}
            {Object.values(filterValues).some(Boolean) && (
              <button type="button" onClick={() => setFilterValues({})} className="w-full px-3 py-1.5 text-left text-[11px] text-[var(--z-info,#3e7af7)] hover:bg-[var(--z-bg-alt,#f7f8fa)]">
                Clear all
              </button>
            )}
          </Popover>
        )}

        {openMenu === "sort" && (
          <Popover>
            <PopoverHeader>Sort by</PopoverHeader>
            {sortableCols.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-[var(--z-text-muted,#6b7280)] italic">No sortable columns.</p>
            ) : (
              sortableCols.map((c) => {
                const active = sort?.key === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => { toggleSort(c.key); setOpenMenu(null) }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
                  >
                    <span className={active ? "font-bold text-[var(--z-text,#1f2937)]" : "text-[var(--z-text,#1f2937)]"}>{c.label}</span>
                    {active && (
                      sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </button>
                )
              })
            )}
            {sort && (
              <button type="button" onClick={() => { setSort(null); setOpenMenu(null) }} className="w-full px-3 py-1.5 text-left text-[11px] text-[var(--z-info,#3e7af7)] hover:bg-[var(--z-bg-alt,#f7f8fa)]">
                Clear sort
              </button>
            )}
          </Popover>
        )}

        {openMenu === "columns" && (
          <Popover>
            <PopoverHeader>Columns</PopoverHeader>
            {columns.map((c) => {
              const on = visibleKeys.has(c.key)
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleVisible(c.key)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
                >
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded border ${on ? "bg-[var(--z-info,#3e7af7)] border-[var(--z-info,#3e7af7)] text-white" : "border-[var(--z-border-strong,#d1d5db)] bg-white"}`}>
                    {on && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span>{c.label}</span>
                </button>
              )
            })}
          </Popover>
        )}
      </div>

      {showCheckboxes && selected.size > 0 && (
        <div className="px-3 py-1.5 bg-[var(--z-info,#3e7af7)]/10 border-b border-[var(--z-info,#3e7af7)]/30 flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-[var(--z-info,#3e7af7)]">{selected.size} selected</span>
          {bulkActions!.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => { a.onClick(Array.from(selected)); setSelected(new Set()) }}
              className={`z-btn !h-6 !text-[11px] ${a.danger ? "!text-red-600 hover:!bg-red-50" : ""}`}
            >
              {a.label}
            </button>
          ))}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto z-btn z-btn-icon !w-5 !h-5"><X size={11} /></button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="z-empty mt-12 px-6">
          <p className="z-empty-title">{emptyTitle ?? `No ${title.toLowerCase()} yet`}</p>
          <p className="z-empty-desc">{emptyHint ?? `Add your first ${addLabel.toLowerCase().replace(/^add\s+/, "")}.`}</p>
          <button type="button" onClick={onAdd} className="z-btn-primary mt-4 !text-[12px]">
            <Plus size={12} strokeWidth={2} /> {addLabel}
          </button>
        </div>
      ) : (
        <div className="overflow-y-auto overflow-x-auto flex-1">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[var(--z-bg-alt,#f7f8fa)] z-10">
              <tr className="border-b border-[var(--z-border,#e5e7eb)]">
                {showCheckboxes && (
                  <th className="px-2 py-2 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {rowAvatar && <th className="px-2 py-2 w-9" />}
                {visibleColumns.map((c) => {
                  const sortable = c.sortable !== false && !!c.sortValue
                  const active = sort?.key === c.key
                  return (
                    <th
                      key={c.key}
                      style={c.width ? { width: c.width } : undefined}
                      className={`px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] ${sortable ? "cursor-pointer hover:text-[var(--z-text,#1f2937)]" : ""}`}
                      onClick={sortable ? () => toggleSort(c.key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {active && (
                          sort!.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                        )}
                      </span>
                    </th>
                  )
                })}
                {rowActions && <th className="px-2 py-2 w-8" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const av = rowAvatar?.(item)
                const actions = rowActions?.(item) ?? []
                const isMenuOpen = openRowMenu === item.id
                return (
                  <tr
                    key={item.id}
                    className="group border-b border-[var(--z-border,#e5e7eb)] hover:bg-[var(--z-bg-alt,#f7f8fa)] cursor-pointer"
                    onClick={(e) => {
                      // Don't fire onRowClick for clicks inside checkbox /
                      // actions (they have their own handlers).
                      const t = e.target as HTMLElement
                      if (t.closest("[data-stop]")) return
                      onRowClick(item)
                    }}
                  >
                    {showCheckboxes && (
                      <td className="px-2 py-2 w-8" data-stop>
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleRow(item.id)}
                          aria-label={`Select row ${item.id}`}
                        />
                      </td>
                    )}
                    {av && (
                      <td className="px-2 py-2 w-9">
                        <span className="inline-flex items-center gap-1">
                          {av.prefix}
                          {av.src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={av.src} alt="" className="w-7 h-7 rounded-full object-cover bg-[var(--z-bg-alt,#f7f8fa)]" />
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-[var(--z-bg-alt,#f7f8fa)] inline-flex items-center justify-center text-[10px] font-bold text-[var(--z-text-muted,#6b7280)]">{av.fallback}</span>
                          )}
                        </span>
                      </td>
                    )}
                    {visibleColumns.map((c) => (
                      <td key={c.key} className="px-2 py-2 text-[12px] text-[var(--z-text,#1f2937)]">
                        {c.render(item)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-2 py-2 w-8 relative" data-stop>
                        <button
                          type="button"
                          aria-label="Row actions"
                          onClick={(e) => { e.stopPropagation(); setOpenRowMenu(isMenuOpen ? null : item.id) }}
                          className="z-btn z-btn-icon !w-6 !h-6 opacity-0 group-hover:opacity-100 data-[open=true]:opacity-100"
                          data-open={isMenuOpen ? "true" : undefined}
                        >
                          <MoreHorizontal size={11} />
                        </button>
                        {isMenuOpen && (
                          <div
                            className="absolute right-1 top-full mt-1 w-44 bg-white rounded-md shadow-lg border border-[var(--z-border,#e5e7eb)] py-1 z-30"
                            onMouseLeave={() => setOpenRowMenu(null)}
                          >
                            {actions.map((a) => (
                              <button
                                key={a.label}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setOpenRowMenu(null); a.onClick(item) }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left hover:bg-[var(--z-bg-alt,#f7f8fa)] ${a.danger ? "text-red-600" : "text-[var(--z-text,#1f2937)]"}`}
                              >
                                {a.icon}
                                {a.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </SecondaryPanel>
  )
}

function ToolbarBtn({
  children, onClick, title, active,
}: {
  children: ReactNode
  onClick: () => void
  title: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`z-btn z-btn-icon !w-7 !h-7 ${active ? "bg-[var(--z-bg-alt,#f7f8fa)] text-[var(--z-info,#3e7af7)]" : ""}`}
    >
      {children}
    </button>
  )
}

function Popover({ children }: { children: ReactNode }) {
  return (
    <div className="absolute right-2 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-[var(--z-border,#e5e7eb)] py-1 z-40 max-h-[60vh] overflow-y-auto">
      {children}
    </div>
  )
}
function PopoverHeader({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] border-b border-[var(--z-border,#e5e7eb)]">{children}</div>
  )
}
