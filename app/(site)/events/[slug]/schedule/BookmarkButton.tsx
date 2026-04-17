"use client"

import { useState, useEffect } from "react"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { bookmarkSession } from "@/app/actions/attendeePortalActions"

interface Props {
  sessionId: string
  sessionTitle: string
}

export function BookmarkButton({ sessionId, sessionTitle }: Props) {
  const [email, setEmail] = useState("")
  const [attendeeId, setAttendeeId] = useState<string | null>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check localStorage for saved attendee info on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lf_attendee_id")
      const savedToken = localStorage.getItem("lf_attendee_qr_token")
      const savedEmail = localStorage.getItem("lf_attendee_email")
      if (saved) setAttendeeId(saved)
      if (savedToken) setQrToken(savedToken)
      if (savedEmail) setEmail(savedEmail)

      // Check if this session is already bookmarked
      const bookmarks = JSON.parse(
        localStorage.getItem("lf_bookmarked_sessions") ?? "[]"
      ) as string[]
      if (bookmarks.includes(sessionId)) {
        setBookmarked(true)
      }
    } catch {
      // localStorage not available
    }
  }, [sessionId])

  async function handleBookmark() {
    setError(null)

    // If no attendee ID, need to look up by email first
    if (!attendeeId) {
      if (!showInput) {
        setShowInput(true)
        return
      }

      if (!email.trim()) {
        setError("Please enter your registered email.")
        return
      }

      setLoading(true)
      try {
        // Use lookupAttendee to get the attendee ID
        const { lookupAttendee } = await import(
          "@/app/actions/attendeePortalActions"
        )
        const result = await lookupAttendee(email.trim())

        if (!result.success || !result.attendee) {
          setError("No registration found for this email.")
          setLoading(false)
          return
        }

        const id = result.attendee.id as string
        const token = (result.attendee.qr_token as string | null) ?? ""
        setAttendeeId(id)
        setQrToken(token)

        // Save to localStorage
        try {
          localStorage.setItem("lf_attendee_id", id)
          if (token) localStorage.setItem("lf_attendee_qr_token", token)
          localStorage.setItem("lf_attendee_email", email.trim())
        } catch {
          // ignore
        }

        // Now bookmark
        await doBookmark(id, token)
      } catch {
        setError("Failed to look up your registration.")
      } finally {
        setLoading(false)
      }
      return
    }

    // Already have attendee ID, just bookmark
    setLoading(true)
    await doBookmark(attendeeId, qrToken ?? "")
    setLoading(false)
  }

  async function doBookmark(attId: string, token: string) {
    try {
      const result = await bookmarkSession(attId, sessionId, token)
      if (result.success) {
        setBookmarked(true)
        setShowInput(false)
        // Save to localStorage
        try {
          const bookmarks = JSON.parse(
            localStorage.getItem("lf_bookmarked_sessions") ?? "[]"
          ) as string[]
          if (!bookmarks.includes(sessionId)) {
            bookmarks.push(sessionId)
            localStorage.setItem(
              "lf_bookmarked_sessions",
              JSON.stringify(bookmarks)
            )
          }
        } catch {
          // ignore
        }
      } else {
        if (result.error?.includes("already bookmarked")) {
          setBookmarked(true)
          setShowInput(false)
        } else {
          setError(result.error ?? "Failed to bookmark session.")
        }
      }
    } catch {
      setError("Something went wrong. Please try again.")
    }
  }

  if (bookmarked) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
        <BookmarkCheck size={14} />
        Added to Agenda
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {showInput && !attendeeId && (
          <input
            type="email"
            placeholder="Your registered email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBookmark()
            }}
            className="px-3 py-1.5 text-xs bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg text-[#1a1a2e] placeholder:text-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/50 focus:ring-2 focus:ring-[#e7ab1c]/20 transition-all w-48"
          />
        )}
        <button
          onClick={handleBookmark}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#e7ab1c]/40 text-[#e7ab1c] bg-[#e7ab1c]/[0.06] hover:bg-[#e7ab1c]/[0.12] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Bookmark size={14} />
          )}
          {showInput && !attendeeId ? "Confirm" : "Add to My Agenda"}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 mt-1.5">{error}</p>
      )}
    </div>
  )
}
