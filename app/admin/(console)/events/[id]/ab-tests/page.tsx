/**
 * A/B test reporting page for an event.
 * Lists all tests with exposure counts, conversion counts, conversion
 * rates, and a two-proportion z-test p-value. Admin can declare a
 * winner from the row.
 */

import { listABTests } from "@/app/actions/abTestActions"
import { DeclareWinnerForm, StartStopForm } from "./Forms"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ABTestsPage({ params }: Props) {
  const { id } = await params
  const { tests, error } = await listABTests(id)

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">A/B tests</h1>
      <p className="text-[13px] text-[#1a1a2e]/65 mt-1">
        Run experiments on individual sections of the microsite.
        Significance is reported as a two-sided z-test p-value.
      </p>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {tests.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-[#1a1a2e]/15 p-10 text-center text-[#1a1a2e]/55">
          <p className="text-sm">No A/B tests yet.</p>
          <p className="text-[12px] mt-1">
            Right-click any section in the builder → &quot;A/B test&quot; → set up variant B.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[#1a1a2e]/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1a2e]/[0.03] text-left text-[11px] uppercase tracking-wider text-[#1a1a2e]/55">
              <tr>
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Variant</th>
                <th className="px-4 py-3 font-medium tabular-nums">Exposures</th>
                <th className="px-4 py-3 font-medium tabular-nums">Conversions</th>
                <th className="px-4 py-3 font-medium tabular-nums">Rate</th>
                <th className="px-4 py-3 font-medium tabular-nums">p-value</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a2e]/[0.06]">
              {tests.flatMap((t) => {
                const variants = Object.keys(t.variants ?? { A: {}, B: {} })
                return variants.map((v, vi) => {
                  const exp = t.exposures[v] ?? 0
                  const con = t.conversions[v] ?? 0
                  const rate = t.rates[v] ?? 0
                  const isWinner = t.winner_variant === v
                  return (
                    <tr key={`${t.id}-${v}`} className="hover:bg-[#1a1a2e]/[0.02]">
                      {vi === 0 ? (
                        <>
                          <td className="px-4 py-3 align-top" rowSpan={variants.length}>
                            <div className="font-semibold text-[#1a1a2e]">{t.name}</div>
                            <div className="text-[11px] text-[#1a1a2e]/55 mt-0.5">
                              {t.page_kind} · block {t.block_id.slice(0, 8)}…
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top" rowSpan={variants.length}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider ${
                              t.status === "running"   ? "bg-emerald-50 text-emerald-700" :
                              t.status === "completed" ? "bg-blue-50 text-blue-700" :
                              "bg-gray-50 text-gray-700"
                            }`}>{t.status}</span>
                          </td>
                        </>
                      ) : null}
                      <td className="px-4 py-3 font-mono text-[12px]">
                        {v}{isWinner ? <span className="ml-2 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Winner</span> : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{exp.toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums">{con.toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums">{(rate * 100).toFixed(2)}%</td>
                      {vi === 0 ? (
                        <td className="px-4 py-3 align-top tabular-nums" rowSpan={variants.length}>
                          {t.pValue !== null ? (
                            <span className={t.pValue < 0.05 ? "text-emerald-700 font-semibold" : "text-[#1a1a2e]/65"}>
                              {t.pValue.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-[#1a1a2e]/35">—</span>
                          )}
                        </td>
                      ) : null}
                      {vi === 0 ? (
                        <td className="px-4 py-3 align-top space-y-2" rowSpan={variants.length}>
                          {t.status !== "completed" && (
                            <StartStopForm testId={t.id} status={t.status} />
                          )}
                          {t.status === "running" && variants.length > 1 && (
                            <DeclareWinnerForm testId={t.id} variants={variants} />
                          )}
                        </td>
                      ) : null}
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
