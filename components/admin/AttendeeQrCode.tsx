"use client"

import { useState } from "react"
import { QrCode, Download, Loader2, X } from "lucide-react"

interface Props {
  attendeeName: string
  qrToken: string
}

export function AttendeeQrCode({ attendeeName, qrToken }: Props) {
  const [open, setOpen] = useState(false)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generateQr() {
    setOpen(true)
    if (dataUrl) return
    setLoading(true)
    const QRCode = (await import("qrcode")).default
    const url = await QRCode.toDataURL(qrToken, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H",
    })
    setDataUrl(url)
    setLoading(false)
  }

  function handleDownload() {
    if (!dataUrl) return
    const link = document.createElement("a")
    link.download = `qr-${attendeeName.replace(/\s+/g, "-").toLowerCase()}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <>
      <button
        onClick={generateQr}
        className="p-2 rounded-md text-[#aaa] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
        title="View QR Code"
      >
        <QrCode size={15} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-[#1a1a2e]/60 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-[#333]">QR Code</h3>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors">
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-[#777] mb-3 sm:mb-4 text-center truncate">{attendeeName}</p>

              <div className="flex items-center justify-center mb-4 sm:mb-5">
                {loading ? (
                  <div className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-[#aaa]" />
                  </div>
                ) : dataUrl ? (
                  <img src={dataUrl} alt={`QR code for ${attendeeName}`} className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] rounded-lg" />
                ) : null}
              </div>

              <p className="text-[10px] text-[#bbb] text-center font-mono mb-4 sm:mb-5 break-all">{qrToken.slice(0, 16)}…</p>

              <button
                onClick={handleDownload}
                disabled={!dataUrl}
                className="w-full py-2.5 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download PNG
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
