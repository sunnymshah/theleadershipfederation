"use client"

import { useTransition } from "react"
import { startABTest, stopABTest, declareWinner } from "@/app/actions/abTestActions"

export function StartStopForm({ testId, status }: { testId: string; status: "draft" | "running" | "completed" }) {
  const [pending, start] = useTransition()
  return (
    <div className="flex items-center gap-2">
      {status === "draft" && (
        <button
          type="button"
          onClick={() => start(async () => { await startABTest(testId); window.location.reload() })}
          disabled={pending}
          className="inline-flex items-center px-3 h-7 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Start
        </button>
      )}
      {status === "running" && (
        <button
          type="button"
          onClick={() => start(async () => { await stopABTest(testId); window.location.reload() })}
          disabled={pending}
          className="inline-flex items-center px-3 h-7 rounded text-[11px] font-bold uppercase tracking-wider bg-gray-600 text-white hover:bg-gray-700"
        >
          Stop
        </button>
      )}
    </div>
  )
}

export function DeclareWinnerForm({ testId, variants }: { testId: string; variants: string[] }) {
  const [pending, start] = useTransition()
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-[#1a1a2e]/55">Winner:</span>
      {variants.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => start(async () => { await declareWinner(testId, v); window.location.reload() })}
          disabled={pending}
          className="inline-flex items-center px-2.5 h-7 rounded text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
        >
          {v}
        </button>
      ))}
    </div>
  )
}
