"use client"

/**
 * ─── SEND EMAIL BUTTON ─────────────────────────────────────────────────
 *
 * Client component that triggers sending a confirmation email to a single
 * attendee. Shows loading, success, and error states with appropriate
 * visual feedback matching the admin panel's dark/gold theme.
 */

import { useState, useCallback } from "react"
import { sendAttendeeConfirmation } from "@/app/actions/attendeeActions"
import { Loader2, Mail, CheckCircle2, AlertCircle, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface SendEmailButtonProps {
  attendeeId: string
  attendeeName: string
  /** Whether a confirmation has already been sent (confirmation_sent_at is set) */
  hasBeenSent?: boolean
}

type ButtonState = "idle" | "loading" | "success" | "error"

export function SendEmailButton({ attendeeId, attendeeName, hasBeenSent = false }: SendEmailButtonProps) {
  const [state, setState] = useState<ButtonState>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sent, setSent] = useState(hasBeenSent)

  const handleSend = useCallback(async () => {
    if (state === "loading") return

    setState("loading")
    setErrorMsg(null)

    try {
      const result = await sendAttendeeConfirmation(attendeeId)

      if (result.success) {
        setState("success")
        setSent(true)
        // Reset back to idle after showing success
        setTimeout(() => setState("idle"), 3000)
      } else {
        setState("error")
        setErrorMsg(result.error || "Failed to send email.")
        // Reset back to idle after showing error
        setTimeout(() => {
          setState("idle")
          setErrorMsg(null)
        }, 5000)
      }
    } catch {
      setState("error")
      setErrorMsg("An unexpected error occurred.")
      setTimeout(() => {
        setState("idle")
        setErrorMsg(null)
      }, 5000)
    }
  }, [attendeeId, state])

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleSend}
        disabled={state === "loading"}
        title={
          sent
            ? `Resend confirmation to ${attendeeName}`
            : `Send confirmation to ${attendeeName}`
        }
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 focus:ring-offset-1 focus:ring-offset-[#0a0a0a]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          state === "success"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            : state === "error"
              ? "bg-red-500/10 text-red-400 border border-red-500/30"
              : sent
                ? "bg-[#c9a84c]/5 text-[#c9a84c]/70 border border-[#c9a84c]/20 hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] hover:border-[#c9a84c]/40"
                : "bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/20 hover:border-[#c9a84c]/50",
        )}
      >
        {state === "loading" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Sending...</span>
          </>
        ) : state === "success" ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Sent!</span>
          </>
        ) : state === "error" ? (
          <>
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Failed</span>
          </>
        ) : sent ? (
          <>
            <Send className="h-3.5 w-3.5" />
            <span>Resend</span>
          </>
        ) : (
          <>
            <Mail className="h-3.5 w-3.5" />
            <span>Send Email</span>
          </>
        )}
      </button>

      {/* Error message tooltip */}
      {state === "error" && errorMsg && (
        <p className="max-w-[200px] text-[11px] leading-tight text-red-400/80">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
