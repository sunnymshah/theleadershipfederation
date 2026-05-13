"use client"

/**
 * ─── LinkedIn Architect Pro ──────────────────────────────────────────
 *
 * Internal content tool for drafting + polishing LinkedIn posts.
 *
 *   - Unicode style buttons (bold sans/serif, italic, mono, small caps,
 *     etc.) — pure client-side text transform, no AI required.
 *   - Magic Refine: rewrites the draft in 3 voices via Gemini.
 *   - Live virality / authority / resonance scores via Gemini, debounced
 *     2s after the last keystroke.
 *   - LinkedIn-styled live preview (desktop / mobile toggle).
 *
 * All AI calls go through /api/admin/linkedin which gates on the
 * "content" permission and rate-limits per IP.
 *
 * Adapted from the standalone Vite app shipped at
 * Downloads/linkedin-architect-pro/index.tsx — re-skinned to use the
 * project's existing patterns (no @google/genai SDK, no inline secrets).
 */

import { useState, useRef, useEffect, useCallback } from "react"

/* ── PROFESSIONAL UNICODE ENGINE ─────────────────────────────────── */

const professionalStyles: Record<
  string,
  { upper: number; lower: number; digits?: number; label: string }
> = {
  boldSans:        { upper: 0x1d5d4, lower: 0x1d5ee, digits: 0x1d7ec, label: "Modern Bold" },
  boldSerif:       { upper: 0x1d400, lower: 0x1d41a, digits: 0x1d7ce, label: "Classic Bold" },
  italicSans:      { upper: 0x1d608, lower: 0x1d622,                  label: "Modern Italic" },
  italicSerif:     { upper: 0x1d434, lower: 0x1d44e,                  label: "Classic Italic" },
  boldItalicSans:  { upper: 0x1d63c, lower: 0x1d656,                  label: "Elite Impact" },
  boldItalicSerif: { upper: 0x1d468, lower: 0x1d482,                  label: "Prestige Bold" },
  mono:            { upper: 0x1d670, lower: 0x1d68a, digits: 0x1d7f6, label: "Tech Mono" },
  doubleStruck:    { upper: 0x1d538, lower: 0x1d552, digits: 0x1d7d8, label: "Mathematical" },
}

const eliteCapsMap: Record<string, string> = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ғ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
  A: "ᴀ", B: "ʙ", C: "ᴄ", D: "ᴅ", E: "ᴇ", F: "ғ", G: "ɢ", H: "ʜ", I: "ɪ", J: "ᴊ", K: "ᴋ", L: "ʟ", M: "ᴍ", N: "ɴ", O: "ᴏ", P: "ᴘ", Q: "ǫ", R: "ʀ", S: "s", T: "ᴛ", U: "ᴜ", V: "ᴠ", W: "ᴡ", X: "x", Y: "ʏ", Z: "ᴢ",
}

function transformText(text: string, style: string): string {
  if (style === "smallCaps") return text.split("").map((c) => eliteCapsMap[c] || c).join("")
  if (style === "underline") return text.split("").map((c) => c + "̲").join("")
  if (style === "strike")    return text.split("").map((c) => c + "̶").join("")
  const map = professionalStyles[style]
  if (!map) return text
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 90)  return String.fromCodePoint(map.upper  + (code - 65))
      if (code >= 97 && code <= 122) return String.fromCodePoint(map.lower  + (code - 97))
      if (map.digits && code >= 48 && code <= 57)
        return String.fromCodePoint(map.digits + (code - 48))
      return char
    })
    .join("")
}

function stripFormatting(text: string): string {
  let result = ""
  for (const char of text) {
    const codePoint = char.codePointAt(0)
    if (!codePoint) {
      result += char
      continue
    }
    if (codePoint === 0x0332 || codePoint === 0x0336) continue
    let matched = false
    for (const style in professionalStyles) {
      const map = professionalStyles[style]
      if (codePoint >= map.upper && codePoint <= map.upper + 25) {
        result += String.fromCharCode(65 + (codePoint - map.upper))
        matched = true
        break
      }
      if (codePoint >= map.lower && codePoint <= map.lower + 25) {
        result += String.fromCharCode(97 + (codePoint - map.lower))
        matched = true
        break
      }
      if (map.digits && codePoint >= map.digits && codePoint <= map.digits + 9) {
        result += String.fromCharCode(48 + (codePoint - map.digits))
        matched = true
        break
      }
    }
    if (!matched) {
      const original = Object.keys(eliteCapsMap).find((k) => eliteCapsMap[k] === char)
      if (original) {
        result += original.toLowerCase()
        matched = true
      }
    }
    if (!matched) result += char
  }
  return result
}

/* ── UI COMPONENTS ───────────────────────────────────────────────── */

function TooltipButton({
  onClick,
  icon,
  tooltip,
  active = false,
}: {
  onClick: () => void
  icon: React.ReactNode
  tooltip: string
  active?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 border border-transparent ${
          active
            ? "bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/30"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        {icon}
      </button>
      {show && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded border border-white/10 shadow-2xl pointer-events-none whitespace-nowrap z-[200]">
          {tooltip}
        </div>
      )}
    </div>
  )
}

function PostPreview({ text, isMobile }: { text: string; isMobile: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split("\n")
  const showMore = lines.length > 5 || text.length > 300
  const content = expanded ? text : lines.slice(0, 5).join("\n")

  return (
    <div
      className={`bg-[#1d2226] text-[#f3f6f8] rounded-xl shadow-2xl border border-white/10 font-sans transition-all duration-700 overflow-hidden ${
        isMobile ? "text-[13px] max-w-[340px]" : "text-[14px] w-full max-w-[580px]"
      }`}
    >
      <div className="p-4">
        <div className="flex gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#004182] flex items-center justify-center text-black font-black">
            LF
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold">
              The Leadership Federation
              <span className="text-gray-400 text-xs font-normal">• 1st</span>
            </div>
            <p className="text-[12px] text-gray-400 leading-tight">
              Global Leadership Platform
            </p>
            <p className="text-[11px] text-gray-400">Just now</p>
          </div>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed min-h-[60px]">
          {!text ? (
            <span className="text-gray-600 italic">
              &ldquo;Good writing is clear thinking made visible.&rdquo; Start typing
              to see your impact&hellip;
            </span>
          ) : (
            content
          )}
          {showMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[#70b5f9] font-bold ml-1 hover:underline"
            >
              ...see more
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-2 border-t border-white/5 flex justify-between items-center text-[11px] text-gray-400">
        <div>1,240 reactions</div>
        <div>48 comments • 12 reposts</div>
      </div>
      <div className="flex border-t border-white/5 text-gray-400 font-bold text-xs">
        <button className="flex-1 py-3 hover:bg-white/5">Like</button>
        <button className="flex-1 py-3 hover:bg-white/5">Comment</button>
        <button className="flex-1 py-3 hover:bg-white/5">Repost</button>
        <button className="flex-1 py-3 hover:bg-white/5">Send</button>
      </div>
    </div>
  )
}

/* ── MAIN PAGE ───────────────────────────────────────────────────── */

export default function LinkedInArchitectPage() {
  const [inputText, setInputText] = useState("")
  const [history, setHistory] = useState<string[]>([""])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isMagicActive, setIsMagicActive] = useState(false)
  const [sentiment, setSentiment] = useState({
    virality: 0,
    authority: 0,
    resonance: 0,
  })
  const [isPreviewMobile, setIsPreviewMobile] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* Undo / redo history */
  const updateText = useCallback(
    (newText: string, addToHistory = true) => {
      if (newText === inputText) return
      setInputText(newText)
      if (addToHistory) {
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newText)
        if (newHistory.length > 50) newHistory.shift()
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
      }
    },
    [inputText, history, historyIndex],
  )

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setInputText(history[historyIndex - 1])
    }
  }
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setInputText(history[historyIndex + 1])
    }
  }

  /* Sentiment analysis — debounced 2s after typing */
  useEffect(() => {
    const trimmed = inputText.trim()
    if (!trimmed) {
      setSentiment({ virality: 0, authority: 0, resonance: 0 })
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyze", text: trimmed }),
        })
        const json = await res.json()
        if (!res.ok) {
          setAiError(json.error ?? `Analyze failed (${res.status})`)
          return
        }
        setAiError(null)
        setSentiment({
          virality: json.virality ?? 0,
          authority: json.authority ?? 0,
          resonance: json.resonance ?? 0,
        })
      } catch (e) {
        setAiError(e instanceof Error ? e.message : "Network error")
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [inputText])

  const applyFormat = (style: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const { selectionStart: start, selectionEnd: end } = textarea
    const selected = inputText.substring(start, end)
    if (!selected) {
      updateText(transformText(stripFormatting(inputText), style))
      return
    }
    updateText(
      inputText.substring(0, start) +
        transformText(selected, style) +
        inputText.substring(end),
    )
  }

  const magicRefine = async (instruction: string) => {
    if (!inputText.trim()) return
    setIsMagicActive(true)
    setAiError(null)
    try {
      const res = await fetch("/api/admin/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refine",
          text: inputText,
          instruction,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAiError(json.error ?? `Refine failed (${res.status})`)
        return
      }
      if (typeof json.text === "string" && json.text.trim()) {
        updateText(json.text.trim())
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Network error")
    } finally {
      setIsMagicActive(false)
    }
  }

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(inputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* no-op */
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 selection:bg-[#00E5FF]/30 -m-6 lg:-m-8">
      {/* Magic loader */}
      {isMagicActive && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-8 text-[#00E5FF] font-black uppercase tracking-[0.5em] animate-pulse">
            Refining Excellence
          </p>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-[500] px-6 sm:px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#00E5FF] text-black font-black flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            A
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter italic text-white">
              Architect Pro
            </h1>
            <div className="h-[2px] w-full bg-gradient-to-r from-[#00E5FF] to-transparent" />
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 items-center">
          <button
            onClick={() => setIsPreviewMobile(!isPreviewMobile)}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            Preview: {isPreviewMobile ? "Mobile" : "Desktop"}
          </button>
          <button
            onClick={copyDraft}
            className="bg-white text-black px-5 sm:px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#00E5FF] transition-all shadow-xl"
          >
            {copied ? "Copied!" : "Copy Draft"}
          </button>
        </div>
      </header>

      {aiError && (
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 pt-4">
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl px-5 py-3 text-sm text-red-200">
            <span className="font-bold uppercase tracking-widest text-[11px] mr-2">
              AI error
            </span>
            {aiError}
          </div>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto p-6 sm:p-8 grid lg:grid-cols-12 gap-8 lg:gap-12">
        {/* LEFT: editor */}
        <div className="lg:col-span-7 space-y-8">
          {/* Toolbar */}
          <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-2 flex flex-wrap items-center gap-1 shadow-2xl">
            <TooltipButton tooltip="Bold Sans"   onClick={() => applyFormat("boldSans")}   icon={<span className="font-black">B</span>} />
            <TooltipButton tooltip="Bold Serif"  onClick={() => applyFormat("boldSerif")}  icon={<span className="font-black font-serif">B</span>} />
            <TooltipButton tooltip="Italic Sans"  onClick={() => applyFormat("italicSans")}  icon={<span className="italic">I</span>} />
            <TooltipButton tooltip="Italic Serif" onClick={() => applyFormat("italicSerif")} icon={<span className="italic font-serif">I</span>} />
            <div className="w-[1px] h-6 bg-white/10 mx-2" />
            <TooltipButton tooltip="Insert Emoji" onClick={() => updateText(inputText + " 🚀")}     icon={<span>😊</span>} />
            <TooltipButton tooltip="External Link" onClick={() => updateText(inputText + " https://")} icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
            } />
            <div className="w-[1px] h-6 bg-white/10 mx-2" />
            <TooltipButton tooltip="Undo" onClick={undo} icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            } />
            <TooltipButton tooltip="Redo" onClick={redo} icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            } />
            <TooltipButton tooltip="Clear Formatting" onClick={() => updateText(stripFormatting(inputText))} icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            } />
            <div className="w-[1px] h-6 bg-white/10 mx-2" />
            <TooltipButton tooltip="Bullet List" onClick={() => updateText(inputText + "\n• ")} icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            } />
            <TooltipButton tooltip="Numbered List" onClick={() => updateText(inputText + "\n1. ")} icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h13M7 12h13M7 16h13M4 8h.01M4 12h.01M4 16h.01"/></svg>
            } />
            <TooltipButton tooltip="Mobile Spacing" onClick={() => magicRefine("Optimize line breaks for mobile readability")} icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            } />
          </div>

          {/* Editor */}
          <div className="bg-[#0D0D0D] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/5 flex flex-col">
            <textarea
              ref={textareaRef}
              className="w-full h-[600px] bg-transparent p-8 lg:p-12 text-xl lg:text-2xl font-medium outline-none resize-none placeholder-gray-800 leading-relaxed"
              placeholder="What's the professional insight today?"
              value={inputText}
              onChange={(e) => updateText(e.target.value)}
            />
            <div className="px-8 lg:px-12 py-6 border-t border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex gap-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Characters</span>
                  <span className="text-xl font-black text-[#00E5FF]">{inputText.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Words</span>
                  <span className="text-xl font-black text-white">
                    {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}
                  </span>
                </div>
              </div>
              <div className="text-[10px] font-black text-[#00E5FF] uppercase tracking-[0.8em] animate-pulse hidden sm:block">
                Ghost Engine Active
              </div>
            </div>
          </div>

          {/* Style cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(professionalStyles).map((styleId) => (
              <button
                key={styleId}
                onClick={() => applyFormat(styleId)}
                className="bg-[#0D0D0D] border border-white/5 p-5 rounded-2xl text-left hover:border-[#00E5FF]/40 transition-all group shadow-lg"
              >
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 group-hover:text-[#00E5FF]">
                  {professionalStyles[styleId].label}
                </p>
                <p className="text-lg font-bold text-white group-hover:text-[#00E5FF] transition-colors truncate">
                  {transformText("Preview", styleId)}
                </p>
              </button>
            ))}
            <button
              onClick={() => applyFormat("smallCaps")}
              className="bg-[#0D0D0D] border border-white/5 p-5 rounded-2xl text-left hover:border-[#00E5FF]/40 transition-all group shadow-lg"
            >
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 group-hover:text-[#00E5FF]">
                Elite Caps
              </p>
              <p className="text-lg font-bold text-white group-hover:text-[#00E5FF] transition-colors truncate">
                {transformText("Preview", "smallCaps")}
              </p>
            </button>
          </div>
        </div>

        {/* RIGHT: refine + preview + scores */}
        <div className="lg:col-span-5 space-y-8 lg:space-y-12">
          {/* Magic refine */}
          <div className="bg-gradient-to-r from-[#00E5FF]/10 to-transparent p-6 rounded-[2rem] border border-[#00E5FF]/20 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00E5FF] mb-6">
              AI Magic Refine
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => magicRefine("Rewrite for high virality")}
                className="bg-[#111] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00E5FF] hover:text-black transition-all"
              >
                🔥 Viral
              </button>
              <button
                onClick={() => magicRefine("Rewrite as a high-authority CEO")}
                className="bg-[#111] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                👔 Executive
              </button>
              <button
                onClick={() => magicRefine("Shorten and tighten the writing")}
                className="bg-[#111] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 transition-all"
              >
                ⚡ Concise
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-[#111] p-6 lg:p-10 rounded-[3rem] border border-white/5 shadow-inner flex justify-center items-center min-h-[500px] overflow-hidden">
            <PostPreview text={inputText} isMobile={isPreviewMobile} />
          </div>

          {/* Sentiment scores */}
          <div className="bg-[#0D0D0D] p-8 lg:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-end mb-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">
                Real-time Impact
              </h4>
              <div className="text-right">
                <span className="text-6xl lg:text-7xl font-black text-white leading-none tracking-tighter">
                  {sentiment.virality}%
                </span>
                <span className="block text-[9px] font-bold text-[#00E5FF] uppercase tracking-widest mt-2">
                  Virality Score
                </span>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-600">
                  <span>Authority</span>
                  <span>{sentiment.authority}%</span>
                </div>
                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-white transition-all duration-1000"
                    style={{ width: `${sentiment.authority}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-600">
                  <span>Resonance</span>
                  <span>{sentiment.resonance}%</span>
                </div>
                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-[#00E5FF] transition-all duration-1000 shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                    style={{ width: `${sentiment.resonance}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-16 text-center opacity-20 text-[10px] font-black uppercase tracking-[1em] sm:tracking-[2em] text-[#00E5FF]">
        Architect Pro Suite · TLF
      </footer>
    </div>
  )
}
