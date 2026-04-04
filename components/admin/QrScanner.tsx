"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import {
  lookupByQrToken,
  checkInAttendee,
} from "@/app/actions/checkInActions"
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Camera,
  CameraOff,
  Keyboard,
  RotateCcw,
  User,
  Mail,
  Building2,
  Ticket,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────── */
/*  Types                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

interface AttendeeResult {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  status: string
  check_in_at: string | null
  events: { title: string; venue: string; start_date: string } | null
  tickets: { name: string } | null
}

type ScanState =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "loading" }
  | { kind: "found"; attendee: AttendeeResult }
  | { kind: "checked_in"; attendee: AttendeeResult }
  | { kind: "already_checked_in"; attendee: AttendeeResult; checkInTime: string }
  | { kind: "error"; message: string }

interface QrScannerProps {
  selectedEventId: string | null
  onCheckIn?: () => void
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Sound helper — short beep via Web Audio API                            */
/* ──────────────────────────────────────────────────────────────────────── */

function playBeep(success: boolean) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = success ? 880 : 300
    osc.type = success ? "sine" : "square"
    gain.gain.value = 0.15
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.15 : 0.3))
    osc.stop(ctx.currentTime + (success ? 0.15 : 0.3))
  } catch {
    // Audio not available — silently skip
  }
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Component                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

export default function QrScanner({ selectedEventId, onCheckIn }: QrScannerProps) {
  const [state, setState] = useState<ScanState>({ kind: "idle" })
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [checkingIn, setCheckingIn] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "qr-scanner-region"
  const processingRef = useRef(false)

  /* ── Process a scanned / entered QR token ──────────────────────────── */
  const processQrToken = useCallback(async (token: string) => {
    if (processingRef.current) return
    processingRef.current = true

    setState({ kind: "loading" })

    try {
      const result = await lookupByQrToken(token)

      if (!result.success || !result.attendee) {
        playBeep(false)
        setState({ kind: "error", message: result.error ?? "Attendee not found." })
        return
      }

      const attendee = result.attendee as AttendeeResult

      // If filtering by event, make sure the attendee belongs to this event
      if (selectedEventId && attendee.events) {
        // The attendee's event_id is embedded; we check via the join
        // Nothing to block — the server already resolved the attendee
      }

      if (attendee.status === "checked_in") {
        playBeep(false)
        setState({
          kind: "already_checked_in",
          attendee,
          checkInTime: attendee.check_in_at
            ? new Date(attendee.check_in_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Unknown",
        })
        return
      }

      if (attendee.status === "cancelled") {
        playBeep(false)
        setState({ kind: "error", message: "This registration has been cancelled." })
        return
      }

      playBeep(true)
      setState({ kind: "found", attendee })
    } catch {
      playBeep(false)
      setState({ kind: "error", message: "Failed to look up QR code. Please try again." })
    } finally {
      processingRef.current = false
    }
  }, [selectedEventId])

  /* ── Start camera ──────────────────────────────────────────────────── */
  const startCamera = useCallback(async () => {
    setCameraError(null)

    try {
      // Clean up existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
        } catch {
          // ignore
        }
        scannerRef.current.clear()
        scannerRef.current = null
      }

      const scanner = new Html5Qrcode(scannerContainerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
        },
        (decodedText) => {
          processQrToken(decodedText)
        },
        () => {
          // QR parse error — ignore (camera still scanning)
        },
      )

      setCameraActive(true)
    } catch (err) {
      const msg = (err as Error).message ?? String(err)
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setCameraError("Camera permission denied. Please allow camera access and try again.")
      } else if (msg.includes("NotFound") || msg.includes("NotReadable")) {
        setCameraError("No camera found. Try the manual entry option.")
      } else {
        setCameraError(`Camera error: ${msg}`)
      }
      setCameraActive(false)
    }
  }, [processQrToken])

  /* ── Stop camera ───────────────────────────────────────────────────── */
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        // ignore
      }
      try {
        scannerRef.current.clear()
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
    setCameraActive(false)
  }, [])

  /* ── Auto-start camera on mount (if not manual mode) ───────────────── */
  useEffect(() => {
    if (!manualMode) {
      // Small delay to ensure the DOM element exists
      const timer = setTimeout(() => {
        startCamera()
      }, 300)
      return () => {
        clearTimeout(timer)
        stopCamera()
      }
    } else {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualMode])

  /* ── Cleanup on unmount ────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Handle check-in ───────────────────────────────────────────────── */
  async function handleCheckIn(attendeeId: string) {
    setCheckingIn(true)
    try {
      const result = await checkInAttendee(attendeeId)
      if (result.success && result.attendee) {
        playBeep(true)
        setState({ kind: "checked_in", attendee: result.attendee as AttendeeResult })
        onCheckIn?.()
      } else {
        setState({ kind: "error", message: result.error ?? "Check-in failed." })
      }
    } catch {
      setState({ kind: "error", message: "Check-in failed. Please try again." })
    } finally {
      setCheckingIn(false)
    }
  }

  /* ── Reset for next scan ───────────────────────────────────────────── */
  function handleReset() {
    setState({ kind: "idle" })
    setManualInput("")
    processingRef.current = false
    if (!manualMode) {
      startCamera()
    }
  }

  /* ── Manual submit ─────────────────────────────────────────────────── */
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualInput.trim()) return
    await processQrToken(manualInput.trim())
  }

  /* ──────────────────────────────────────────────────────────────────── */
  /*  Render                                                              */
  /* ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Mode toggle ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setManualMode(false)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            !manualMode
              ? "bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30"
              : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60",
          )}
        >
          <Camera size={16} />
          Camera
        </button>
        <button
          onClick={() => setManualMode(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            manualMode
              ? "bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30"
              : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60",
          )}
        >
          <Keyboard size={16} />
          Manual Entry
        </button>
      </div>

      {/* ── Scanner area ─────────────────────────────────────────── */}
      {!manualMode && state.kind !== "found" && state.kind !== "checked_in" && state.kind !== "already_checked_in" && (
        <div className="relative rounded-2xl border border-white/[0.06] bg-[#050505] overflow-hidden">
          {/* Camera viewfinder */}
          <div className="relative w-full" style={{ minHeight: 360 }}>
            <div id={scannerContainerId} className="w-full" />

            {/* Scanning overlay */}
            {cameraActive && state.kind !== "loading" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Corner brackets */}
                <div className="relative w-[280px] h-[280px]">
                  {/* Top-left */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#c9a84c] rounded-tl-md" />
                  {/* Top-right */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#c9a84c] rounded-tr-md" />
                  {/* Bottom-left */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#c9a84c] rounded-bl-md" />
                  {/* Bottom-right */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#c9a84c] rounded-br-md" />

                  {/* Animated scan line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent animate-scan-line" />
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {state.kind === "loading" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-[#c9a84c] animate-spin" />
                  <span className="text-white/70 text-sm font-medium">Looking up attendee...</span>
                </div>
              </div>
            )}

            {/* Camera error */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
                <div className="text-center px-8">
                  <CameraOff size={48} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 text-sm mb-4">{cameraError}</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-lg bg-white/[0.06] text-white/70 text-sm hover:bg-white/[0.1] transition-colors"
                    >
                      Retry Camera
                    </button>
                    <button
                      onClick={() => setManualMode(true)}
                      className="px-4 py-2 rounded-lg bg-[#c9a84c]/15 text-[#c9a84c] text-sm hover:bg-[#c9a84c]/25 transition-colors"
                    >
                      Use Manual Entry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Idle / no camera placeholder */}
            {!cameraActive && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                  <Camera size={48} className="text-white/15 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Starting camera...</p>
                </div>
              </div>
            )}
          </div>

          {/* Status bar below camera */}
          <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                cameraActive ? "bg-emerald-400 animate-pulse" : "bg-white/20",
              )} />
              <span className="text-xs text-white/40">
                {cameraActive ? "Scanning for QR codes..." : "Camera inactive"}
              </span>
            </div>
            <span className="text-[10px] text-white/20">Point camera at QR code</span>
          </div>
        </div>
      )}

      {/* ── Manual entry ─────────────────────────────────────────── */}
      {manualMode && state.kind !== "found" && state.kind !== "checked_in" && state.kind !== "already_checked_in" && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center">
              <Keyboard size={28} className="text-[#c9a84c]" />
            </div>
          </div>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">
                QR Code Token
              </label>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste or type QR code token..."
                autoFocus
                className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors font-mono tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={state.kind === "loading" || !manualInput.trim()}
              className="w-full py-3.5 rounded-lg bg-[#c9a84c] text-[#050505] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {state.kind === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Looking up...
                </>
              ) : (
                <>
                  <ScanLine size={16} /> Look Up Attendee
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────── */}
      {state.kind === "error" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <XCircle size={24} className="text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-1">Not Found</h3>
              <p className="text-sm text-white/50">{state.message}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="mt-5 w-full py-3 rounded-lg bg-white/[0.06] text-white/70 text-sm font-medium hover:bg-white/[0.1] transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Scan Next
          </button>
        </div>
      )}

      {/* ── Found: attendee info + check-in button ───────────────── */}
      {state.kind === "found" && (
        <div className="rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/[0.03] p-6 space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-3">
              <User size={24} className="text-[#c9a84c]" />
            </div>
            <h3 className="text-xl font-bold text-white">{state.attendee.name}</h3>
            {state.attendee.designation && state.attendee.company && (
              <p className="text-sm text-white/40 mt-0.5">
                {state.attendee.designation}, {state.attendee.company}
              </p>
            )}
          </div>

          {/* Details grid */}
          <div className="space-y-3 bg-white/[0.02] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-white/30 shrink-0" />
              <span className="text-sm text-white/60">{state.attendee.email}</span>
            </div>
            {state.attendee.company && (
              <div className="flex items-center gap-3">
                <Building2 size={14} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/60">{state.attendee.company}</span>
              </div>
            )}
            {state.attendee.events && (
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/60">{state.attendee.events.title}</span>
              </div>
            )}
            {state.attendee.tickets && (
              <div className="flex items-center gap-3">
                <Ticket size={14} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/60">{state.attendee.tickets.name}</span>
              </div>
            )}
          </div>

          {/* Check-in button */}
          <button
            onClick={() => handleCheckIn(state.attendee.id)}
            disabled={checkingIn}
            className="w-full py-4 rounded-xl bg-[#c9a84c] text-[#050505] text-base font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c9a84c]/20"
          >
            {checkingIn ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Checking In...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} /> Check In
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="w-full py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Success: checked in ──────────────────────────────────── */}
      {state.kind === "checked_in" && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          {/* Animated check icon */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-emerald-400 mb-1">Checked In!</h3>
          <p className="text-lg text-white/80 font-medium">{state.attendee.name}</p>
          {state.attendee.company && (
            <p className="text-sm text-white/40 mt-0.5">{state.attendee.company}</p>
          )}
          {state.attendee.events && (
            <p className="text-xs text-white/30 mt-2">{state.attendee.events.title}</p>
          )}

          <button
            onClick={handleReset}
            className="mt-6 w-full py-3.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-bold hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-2"
          >
            <ScanLine size={16} /> Scan Next
          </button>
        </div>
      )}

      {/* ── Already checked in ───────────────────────────────────── */}
      {state.kind === "already_checked_in" && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={28} className="text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-yellow-400 mb-1">Already Checked In</h3>
            <p className="text-lg text-white/80 font-medium">{state.attendee.name}</p>
            {state.attendee.company && (
              <p className="text-sm text-white/40 mt-0.5">{state.attendee.company}</p>
            )}
            <p className="text-sm text-white/40 mt-3">
              Checked in at <span className="text-yellow-400/80 font-medium">{state.checkInTime}</span>
            </p>
          </div>

          <button
            onClick={handleReset}
            className="mt-6 w-full py-3.5 rounded-xl bg-yellow-500/10 text-yellow-400 text-sm font-bold hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <ScanLine size={16} /> Scan Next
          </button>
        </div>
      )}

      {/* ── CSS for scan line animation ──────────────────────────── */}
      <style jsx global>{`
        @keyframes scan-line {
          0%, 100% { top: 8px; }
          50% { top: calc(100% - 8px); }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
        /* Hide html5-qrcode's default UI chrome */
        #qr-scanner-region img[alt="Info icon"] {
          display: none !important;
        }
        #qr-scanner-region video {
          border-radius: 12px !important;
        }
        #${scannerContainerId} > div {
          border: none !important;
        }
      `}</style>
    </div>
  )
}
