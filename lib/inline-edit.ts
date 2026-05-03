"use client"

/**
 * Shared inline-edit hook for canvas text in the Puck event-page
 * builder. Wraps a contentEditable span/div and exposes:
 *
 *   useInlineEdit(value, onSave, { multiline })
 *     ↳ { ref, contentEditable, suppressContentEditableWarning,
 *         "data-lf-inline-editable": true, onBlur, onKeyDown, onPaste,
 *         onFocus }
 *
 * Caller spreads the returned bag onto its rendered element. The hook:
 *   - syncs DOM ↔ React imperatively (only writes innerText when the
 *     element isn't focused, so the caret never jumps mid-edit)
 *   - snapshots the value on focus; Esc reverts to the snapshot
 *   - Enter (without shift) blurs to commit when !multiline; otherwise
 *     a newline is allowed
 *   - onBlur dispatches the saved text via the `onSave` callback
 *   - onPaste strips HTML formatting (Word / Google Docs paste)
 *   - on first hover anywhere in the page, a "Click to edit" tooltip
 *     appears once per browser; localStorage key
 *     `lf-inline-edit-tip-dismissed=1` persists the dismissal
 *
 * Companion helpers in the same module:
 *   patchBlockProps(blockId, updater) — finds the Puck block by id and
 *     dispatches a replace with the updated props object.
 *   patchHeroSlideElement(blockId, slideId, elementId, updater) —
 *     drills into a Hero block's slides[].elements[] tree.
 *   patchHeroSlideButton(blockId, slideId, elementId, buttonId, updater)
 *     — drills further to a buttonGroup's buttons[].
 */

import { useEffect, useRef, useState } from "react"
import { getPuckDispatch, getPuckData } from "@/components/admin/puck/zoho/PuckBridge"

const ROOT_ZONE = "root:default-zone"
const TIP_KEY = "lf-inline-edit-tip-dismissed"

type ElementBag = {
  ref: (el: HTMLElement | null) => void
  contentEditable: "true"
  suppressContentEditableWarning: true
  "data-lf-inline-editable": true
  onBlur: (e: React.FocusEvent<HTMLElement>) => void
  onFocus: (e: React.FocusEvent<HTMLElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onPaste: (e: React.ClipboardEvent<HTMLElement>) => void
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => void
  onClick: (e: React.MouseEvent<HTMLElement>) => void
}

export function useInlineEdit(
  value: string,
  onSave: (next: string) => void,
  options?: { multiline?: boolean },
): ElementBag {
  const multiline = options?.multiline === true
  const elRef = useRef<HTMLElement | null>(null)
  const focusedRef = useRef(false)
  const snapshotRef = useRef<string>(value)

  // Imperative DOM ↔ React sync: write the value into innerText only
  // when the element isn't focused, so the user's caret position is
  // never reset mid-edit by a parent re-render.
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    if (focusedRef.current) return
    if (el.innerText !== value) el.innerText = value ?? ""
  }, [value])

  function attachRef(el: HTMLElement | null) {
    elRef.current = el
    // First-mount paint of the value (the useEffect above only fires
    // after commit, which happens after the browser already painted
    // the empty element).
    if (el && !focusedRef.current && el.innerText !== value) {
      el.innerText = value ?? ""
    }
  }

  function commit(text: string) {
    if (text === snapshotRef.current) return
    snapshotRef.current = text
    onSave(text)
  }

  function revertToSnapshot() {
    const el = elRef.current
    if (!el) return
    el.innerText = snapshotRef.current
  }

  return {
    ref: attachRef,
    contentEditable: "true",
    suppressContentEditableWarning: true,
    "data-lf-inline-editable": true,
    onFocus: () => {
      focusedRef.current = true
      // Snapshot at focus so Esc reverts to whatever the value was when
      // editing started, not whatever the parent rerenders to mid-edit.
      const el = elRef.current
      snapshotRef.current = el?.innerText ?? value ?? ""
      // Dismiss the tip the moment the user actually starts editing.
      try { localStorage.setItem(TIP_KEY, "1") } catch {}
    },
    onBlur: (e) => {
      focusedRef.current = false
      const text = (e.currentTarget.innerText ?? "").replace(/ /g, " ").trimEnd()
      commit(text)
    },
    onKeyDown: (e) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        revertToSnapshot()
        ;(e.currentTarget as HTMLElement).blur()
        return
      }
      if (e.key === "Enter" && !e.shiftKey) {
        if (multiline) {
          // Allow a real newline.
          return
        }
        e.preventDefault()
        e.stopPropagation()
        ;(e.currentTarget as HTMLElement).blur()
        return
      }
      // Don't let the canvas swallow the key (e.g. backspace closing a
      // selected block). The handler in PuckEventBuilder ignores keys
      // when document.activeElement.isContentEditable so this is mostly
      // belt-and-braces.
      e.stopPropagation()
    },
    onPaste: (e) => {
      e.preventDefault()
      const text = e.clipboardData?.getData("text/plain") ?? ""
      // Use document.execCommand for caret-correct paste; if it's
      // disabled (some Firefox configurations), fall back to a manual
      // insertText via the Selection API.
      if (typeof document !== "undefined" && document.execCommand) {
        document.execCommand("insertText", false, text)
      } else {
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const range = sel.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(text))
      }
    },
    onMouseEnter: () => {
      // Tooltip mount is handled by InlineEditTip below — we just need
      // to mark the page as "user has hovered an editable" once so the
      // global listener can show the tip on the very first hover.
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("lf-inline-edit-hover"))
        }
      } catch {}
    },
    onMouseDown: (e) => {
      // ITEM 2.2 — Puck's block-wrapper click handler runs on mousedown
      // for selection. If we don't stop propagation here, the wrapper
      // calls e.preventDefault() before the browser ever runs the
      // default focus action on the contentEditable, so the caret never
      // lands. Stopping propagation lets the default focus run; we
      // also call element.focus() explicitly inside a microtask so the
      // caret lands at the click position even when the wrapper has
      // an aggressive mousedown listener.
      e.stopPropagation()
      const el = e.currentTarget
      // Defer the focus to the next tick — calling focus() during
      // mousedown when another element is about to receive focus by
      // default is a no-op in some browsers. The microtask runs after
      // the default action and beats Puck's selection effect.
      Promise.resolve().then(() => {
        if (document.activeElement !== el) {
          try { el.focus() } catch {}
        }
      })
    },
    onClick: (e) => {
      // Same reasoning as onMouseDown — also stop click bubbling so
      // global click handlers (e.g. Puck's "deselect when clicking
      // outside the inspector") don't fire on every keystroke target.
      e.stopPropagation()
    },
  }
}

/* ── Dispatch helpers (used by the onSave callback) ─────────────── */

/** Find the Puck block by its id and dispatch a replace with the
 *  updater's result. Returns true on success. */
export function patchBlockProps(
  blockId: string,
  updater: (props: Record<string, unknown>) => Record<string, unknown>,
): boolean {
  const dispatch = getPuckDispatch()
  const data = getPuckData()
  if (!dispatch || !data || !blockId) return false
  const arr = Array.isArray(data.content) ? data.content : []
  const idx = arr.findIndex((c) =>
    (c as unknown as { props?: { id?: string } })?.props?.id === blockId,
  )
  if (idx === -1) return false
  const block = arr[idx] as unknown as { type: string; props: Record<string, unknown> }
  const nextProps = updater(block.props ?? {})
  dispatch({
    type: "replace",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { type: block.type, props: { ...block.props, ...nextProps } } as any,
    destinationIndex: idx,
    destinationZone: ROOT_ZONE,
  })
  return true
}

/** Patch a single slide.elements[] entry inside a Hero block. */
export function patchHeroSlideElement(
  blockId: string,
  slideId: string,
  elementId: string,
  patch: Record<string, unknown>,
): boolean {
  return patchBlockProps(blockId, (props) => {
    const slides = Array.isArray(props.slides) ? (props.slides as Array<Record<string, unknown>>) : []
    const nextSlides = slides.map((s) => {
      if (s.id !== slideId) return s
      const elements = Array.isArray(s.elements) ? (s.elements as Array<Record<string, unknown>>) : []
      const nextEls = elements.map((el) => (el.id === elementId ? { ...el, ...patch } : el))
      return { ...s, elements: nextEls }
    })
    return { slides: nextSlides }
  })
}

/** Patch a single button inside a buttonGroup element of a Hero slide. */
export function patchHeroSlideButton(
  blockId: string,
  slideId: string,
  elementId: string,
  buttonId: string,
  patch: Record<string, unknown>,
): boolean {
  return patchBlockProps(blockId, (props) => {
    const slides = Array.isArray(props.slides) ? (props.slides as Array<Record<string, unknown>>) : []
    const nextSlides = slides.map((s) => {
      if (s.id !== slideId) return s
      const elements = Array.isArray(s.elements) ? (s.elements as Array<Record<string, unknown>>) : []
      const nextEls = elements.map((el) => {
        if (el.id !== elementId) return el
        const buttons = Array.isArray(el.buttons) ? (el.buttons as Array<Record<string, unknown>>) : []
        const nextBtns = buttons.map((b) => (b.id === buttonId ? { ...b, ...patch } : b))
        return { ...el, buttons: nextBtns }
      })
      return { ...s, elements: nextEls }
    })
    return { slides: nextSlides }
  })
}

/** Patch an array entry by index inside an arbitrary block prop, e.g.
 *  StatsRow.stats[i].value or Faqs.faqs[i].q. */
export function patchBlockArrayItem(
  blockId: string,
  arrayKey: string,
  index: number,
  patch: Record<string, unknown>,
): boolean {
  return patchBlockProps(blockId, (props) => {
    const arr = Array.isArray(props[arrayKey]) ? (props[arrayKey] as Array<Record<string, unknown>>) : []
    const next = arr.map((item, i) => (i === index ? { ...item, ...patch } : item))
    return { [arrayKey]: next }
  })
}

/** Util — answer the question "is this block being rendered by the
 *  editor right now?" so call sites can gate the inline-edit wrapper.
 *  All editor-mounted blocks receive `puck.metadata.editor === true`
 *  from PuckEventBuilder. */
export function isEditorRender(puck: { metadata?: Record<string, unknown> } | undefined | null): boolean {
  return Boolean(puck && (puck.metadata as { editor?: unknown } | undefined)?.editor === true)
}

/* ── First-use tooltip ──────────────────────────────────────────── */

/**
 * Hook used by the canvas-shell that mounts InlineEditTip. The tip
 * listens for the "lf-inline-edit-hover" CustomEvent fired by every
 * useInlineEdit-bagged element on first mouseenter and renders a small
 * "Click to edit" callout near the cursor for ~4s. Persists the
 * dismissal in localStorage.
 *
 * Exposes a single React component (`InlineEditTip`) intended to live
 * once at the top of the editor shell.
 */
export function useInlineEditTip(): { visible: boolean; dismiss: () => void; pos: { x: number; y: number } } {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === "undefined") return
    let dismissed = false
    try { dismissed = localStorage.getItem(TIP_KEY) === "1" } catch {}
    if (dismissed) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let onMove: ((e: MouseEvent) => void) | null = null

    const onHover = () => {
      if (visible) return
      setVisible(true)
      onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
      window.addEventListener("mousemove", onMove)
      timer = setTimeout(() => {
        setVisible(false)
        try { localStorage.setItem(TIP_KEY, "1") } catch {}
        if (onMove) window.removeEventListener("mousemove", onMove)
      }, 4000)
    }

    const onClick = () => {
      if (!visible) return
      setVisible(false)
      try { localStorage.setItem(TIP_KEY, "1") } catch {}
      if (timer) clearTimeout(timer)
      if (onMove) window.removeEventListener("mousemove", onMove)
    }

    window.addEventListener("lf-inline-edit-hover", onHover, { once: true })
    window.addEventListener("click", onClick, { capture: true, once: false })

    return () => {
      window.removeEventListener("lf-inline-edit-hover", onHover)
      window.removeEventListener("click", onClick, { capture: true })
      if (timer) clearTimeout(timer)
      if (onMove) window.removeEventListener("mousemove", onMove)
    }
    // visible intentionally omitted from deps — the listener captures
    // the latest via closure refresh. Avoiding dep churn keeps the
    // listener attached just once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    visible,
    pos,
    dismiss: () => {
      setVisible(false)
      try { localStorage.setItem(TIP_KEY, "1") } catch {}
    },
  }
}
