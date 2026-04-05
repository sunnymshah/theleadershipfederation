"use client"

import { useState, useRef, useCallback } from "react"
import { Loader2, CheckCircle2, Minus, AlertCircle, CreditCard, Tag, X } from "lucide-react"
import { registerForEvent } from "@/app/actions/registrationActions"

interface Ticket {
  id: string
  name: string
  description: string | null
  price_inr: number
  inventory_limit: number
  sold: number
}

interface CustomField {
  id: string
  field_label: string
  field_name: string
  field_type: string
  options: string[] | null
  is_required: boolean
}

interface AttendeeDetails {
  name: string
  email: string
  phone?: string
  company?: string
  designation?: string
}

interface AppliedPromo {
  code: string
  discountType: "percentage" | "flat"
  discountValue: number
}

type PaymentState =
  | "idle"
  | "validating"
  | "creating_order"
  | "awaiting_payment"
  | "verifying"
  | "success"
  | "failed"

function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

/** Calculate the discounted price given a base price and promo */
function calcDiscountedPrice(basePrice: number, promo: AppliedPromo): number {
  if (promo.discountType === "percentage") {
    return Math.max(0, Math.round(basePrice * (1 - promo.discountValue / 100)))
  }
  return Math.max(0, basePrice - promo.discountValue)
}

/** Dynamically load the Razorpay checkout script */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function TicketPurchaseCard({
  ticket,
  eventId,
  eventTitle,
  currentPrice,
  tierName,
  customFields,
}: {
  ticket: Ticket
  eventId: string
  eventTitle: string
  currentPrice?: number | null
  tierName?: string | null
  customFields?: CustomField[]
}) {
  const [open, setOpen] = useState(false)
  const [paymentState, setPaymentState] = useState<PaymentState>("idle")
  const [success, setSuccess] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Promo code state
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInput, setPromoInput] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)

  const soldOut = ticket.sold >= ticket.inventory_limit
  const spotsLeft = ticket.inventory_limit - ticket.sold
  const almostGone = !soldOut && spotsLeft <= 10

  // Determine the tier price (tier-discounted or base)
  const hasTierDiscount = currentPrice != null && currentPrice !== ticket.price_inr
  const tierPrice = hasTierDiscount ? currentPrice! : ticket.price_inr

  // Apply promo code discount on top of tier price
  const effectivePrice = appliedPromo
    ? calcDiscountedPrice(tierPrice, appliedPromo)
    : tierPrice

  const hasDiscount = effectivePrice !== ticket.price_inr
  const isPaid = effectivePrice > 0

  const submitting = paymentState !== "idle" && paymentState !== "success" && paymentState !== "failed"

  /** Apply a promo code */
  const handleApplyPromo = useCallback(async () => {
    const code = promoInput.trim()
    if (!code) return

    setPromoLoading(true)
    setPromoError(null)

    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          eventId,
          ticketId: ticket.id,
        }),
      })

      const data = await res.json()

      if (data.valid) {
        setAppliedPromo({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
        })
        setPromoError(null)
        setPromoOpen(false)
      } else {
        setPromoError(data.error || "Invalid promo code.")
      }
    } catch {
      setPromoError("Failed to validate promo code. Please try again.")
    } finally {
      setPromoLoading(false)
    }
  }, [promoInput, eventId, ticket.id])

  /** Remove applied promo code */
  const handleRemovePromo = useCallback(() => {
    setAppliedPromo(null)
    setPromoInput("")
    setPromoError(null)
  }, [])

  /** Collect form data into a typed object */
  const getAttendeeDetails = useCallback((): { details: AttendeeDetails; customFieldValues: Record<string, string> } | null => {
    const form = formRef.current
    if (!form) return null
    const fd = new FormData(form)
    const name = (fd.get("name") as string)?.trim()
    const email = (fd.get("email") as string)?.trim()
    if (!name || !email) return null

    // Collect custom field values
    const customFieldValues: Record<string, string> = {}
    if (customFields && customFields.length > 0) {
      for (const field of customFields) {
        if (field.field_type === "checkbox") {
          customFieldValues[field.id] = fd.has(`custom_${field.id}`) ? "true" : "false"
        } else {
          const val = (fd.get(`custom_${field.id}`) as string)?.trim() || ""
          customFieldValues[field.id] = val
        }
      }
    }

    return {
      details: {
        name,
        email,
        phone: (fd.get("phone") as string)?.trim() || undefined,
        company: (fd.get("company") as string)?.trim() || undefined,
        designation: (fd.get("designation") as string)?.trim() || undefined,
      },
      customFieldValues,
    }
  }, [customFields])

  /** Handle paid ticket flow via Razorpay */
  const handlePaidTicket = useCallback(
    async (details: AttendeeDetails, customFieldValues?: Record<string, string>) => {
      setPaymentState("creating_order")
      setError(null)

      try {
        // 1. Create Razorpay order on server
        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: ticket.id,
            attendeeDetails: details,
            customFieldValues,
            promoCode: appliedPromo?.code || undefined,
          }),
        })

        const orderData = await orderRes.json()

        if (!orderRes.ok) {
          setError(orderData.error || "Failed to create payment order.")
          setPaymentState("failed")
          return
        }

        // Free ticket was handled server-side (promo may have made it free)
        if (orderData.free) {
          setPaymentState("success")
          setSuccess(true)
          return
        }

        // 2. Load Razorpay checkout script
        const loaded = await loadRazorpayScript()
        if (!loaded) {
          setError("Failed to load payment gateway. Please refresh and try again.")
          setPaymentState("failed")
          return
        }

        setPaymentState("awaiting_payment")

        // 3. Open Razorpay modal
        const RazorpayConstructor = (window as unknown as Record<string, unknown>).Razorpay as new (
          opts: Record<string, unknown>
        ) => { open: () => void; on: (event: string, cb: () => void) => void }

        const rzp = new RazorpayConstructor({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "The Leadership Federation",
          description: `${ticket.name} — ${eventTitle}`,
          order_id: orderData.orderId,
          prefill: {
            name: details.name,
            email: details.email,
            contact: details.phone || "",
          },
          theme: {
            color: "#e7ab1c",
          },
          modal: {
            ondismiss: () => {
              // User closed the modal without completing payment
              setPaymentState("idle")
              setError(null)
            },
          },
          handler: async (response: {
            razorpay_order_id: string
            razorpay_payment_id: string
            razorpay_signature: string
          }) => {
            // 4. Verify payment on server
            setPaymentState("verifying")

            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  ticketId: ticket.id,
                  attendeeDetails: details,
                }),
              })

              const verifyData = await verifyRes.json()

              if (verifyRes.ok && verifyData.success) {
                setPaymentState("success")
                setSuccess(true)
              } else {
                setError(verifyData.error || "Payment verification failed.")
                setPaymentState("failed")
              }
            } catch {
              setError(
                "Payment was received but verification failed. " +
                "Your registration will be confirmed shortly. " +
                "Please contact support if you don't receive a confirmation email."
              )
              setPaymentState("failed")
            }
          },
        })

        rzp.on("payment.failed", () => {
          setError("Payment failed. Please try again.")
          setPaymentState("failed")
        })

        rzp.open()
      } catch {
        setError("Something went wrong. Please try again.")
        setPaymentState("failed")
      }
    },
    [ticket.id, ticket.name, eventTitle, appliedPromo]
  )

  /** Handle free ticket flow via existing server action */
  const handleFreeTicket = useCallback(
    async (details: AttendeeDetails, customFieldValues?: Record<string, string>) => {
      setPaymentState("creating_order")
      setError(null)

      try {
        // Use the create-order endpoint which handles free tickets too
        const res = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: ticket.id,
            attendeeDetails: details,
            customFieldValues,
            promoCode: appliedPromo?.code || undefined,
          }),
        })

        const data = await res.json()

        if (res.ok && data.free) {
          setPaymentState("success")
          setSuccess(true)
        } else if (!res.ok) {
          setError(data.error || "Registration failed.")
          setPaymentState("failed")
        }
      } catch {
        // Fallback to server action for free tickets
        const form = formRef.current
        if (!form) return
        const fd = new FormData(form)
        fd.set("eventId", eventId)
        fd.set("ticketId", ticket.id)
        const result = await registerForEvent(fd)
        if (result.success) {
          setPaymentState("success")
          if (result.pendingApproval) {
            setPendingApproval(true)
          }
          setSuccess(true)
        } else {
          setError(result.error ?? "Registration failed.")
          setPaymentState("failed")
        }
      }
    },
    [ticket.id, eventId, appliedPromo]
  )

  /** Form submission handler */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPaymentState("validating")
    setError(null)

    const result = getAttendeeDetails()
    if (!result) {
      setError("Please fill in all required fields.")
      setPaymentState("idle")
      return
    }

    const { details, customFieldValues } = result
    const hasCustomValues = Object.keys(customFieldValues).length > 0

    if (isPaid) {
      await handlePaidTicket(details, hasCustomValues ? customFieldValues : undefined)
    } else {
      await handleFreeTicket(details, hasCustomValues ? customFieldValues : undefined)
    }
  }

  /** Reset from failed state */
  function handleRetry() {
    setPaymentState("idle")
    setError(null)
  }

  /* ── Success state ──────────────────────────────────────────── */
  if (success) {
    return (
      <div
        className="rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[320px]"
        style={{
          border: "1px solid rgba(16,185,129,0.2)",
          background: "rgba(16,185,129,0.04)",
          fontFamily:
            "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
        }}
      >
        <CheckCircle2 size={40} className="text-emerald-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          {isPaid ? "Payment Successful!" : "You\u2019re In!"}
        </h3>
        <p className="text-sm text-white/40 max-w-xs">
          Your registration for{" "}
          <span className="text-white/60">{eventTitle}</span> is confirmed.
          Check your email for your personalized QR ticket.
        </p>
        {isPaid && (
          <div className="mt-4 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <p className="text-xs text-white/30">
              Amount paid:{" "}
              <span className="text-white/60 font-medium">
                &#8377;{fmtPrice(effectivePrice)}
              </span>
            </p>
          </div>
        )}
      </div>
    )
  }

  /* ── Payment processing overlay ─────────────────────────────── */
  const showProcessing =
    paymentState === "creating_order" || paymentState === "verifying"

  /* ── Main card ──────────────────────────────────────────────── */
  return (
    <div
      className="rounded-2xl p-7 flex flex-col relative overflow-hidden transition-all duration-300 hover:border-[#c9a84c]/20"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        fontFamily:
          "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />

      {/* Processing overlay */}
      {showProcessing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-sm">
          <Loader2 size={32} className="text-[#c9a84c] animate-spin mb-4" />
          <p className="text-sm text-white/60 font-medium">
            {paymentState === "creating_order"
              ? "Preparing your order..."
              : "Verifying payment..."}
          </p>
          <p className="text-xs text-white/25 mt-1">
            Please do not close this page
          </p>
        </div>
      )}

      {/* Tier name */}
      <h3 className="text-lg font-semibold text-white mb-1">{ticket.name}</h3>
      {ticket.description && (
        <p className="text-sm text-white/30 mb-6 leading-relaxed">
          {ticket.description}
        </p>
      )}

      {/* Price */}
      <div className="mb-6 mt-auto">
        {effectivePrice === 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-emerald-400">Free</span>
            {ticket.price_inr > 0 && (
              <span className="text-lg text-white/25 line-through tabular-nums ml-2">
                &#8377;{fmtPrice(ticket.price_inr)}
              </span>
            )}
          </div>
        ) : hasDiscount ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              {tierName && (
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/20">
                  {tierName}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tabular-nums">
                &#8377;{fmtPrice(effectivePrice)}
              </span>
              <span className="text-lg text-white/25 line-through tabular-nums">
                &#8377;{fmtPrice(ticket.price_inr)}
              </span>
              <span className="text-xs text-white/25 ml-1">per person</span>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white tabular-nums">
              &#8377;{fmtPrice(ticket.price_inr)}
            </span>
            <span className="text-xs text-white/25 ml-1">per person</span>
          </div>
        )}

        {/* Applied promo badge */}
        {appliedPromo && (
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Tag size={11} />
              {appliedPromo.code}
              {appliedPromo.discountType === "percentage"
                ? ` (-${appliedPromo.discountValue}%)`
                : ` (-\u20B9${fmtPrice(appliedPromo.discountValue)})`}
              <button
                onClick={handleRemovePromo}
                className="ml-1 hover:text-emerald-300 transition-colors"
                aria-label="Remove promo code"
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}

        {/* Availability */}
        <div className="flex items-center gap-2 mt-2">
          {soldOut ? (
            <span className="text-xs text-red-400/80 font-medium">
              Sold out
            </span>
          ) : almostGone ? (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-amber-400/80 font-medium">
                Only {spotsLeft} left
              </span>
            </>
          ) : (
            <span className="text-xs text-white/20">
              {spotsLeft} spots remaining
            </span>
          )}
        </div>
      </div>

      {/* Promo code section (before divider, only for paid base tickets without an applied promo) */}
      {ticket.price_inr > 0 && !appliedPromo && (
        <div className="mb-4">
          {!promoOpen ? (
            <button
              type="button"
              onClick={() => setPromoOpen(true)}
              className="text-xs text-white/30 hover:text-[#c9a84c]/70 transition-colors flex items-center gap-1"
            >
              <Tag size={11} />
              Have a promo code?
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase())
                    setPromoError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleApplyPromo()
                    }
                  }}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#0a0a0a] disabled:opacity-40 transition-all duration-200 flex items-center gap-1.5"
                  style={{
                    background:
                      "linear-gradient(135deg, #c9a84c 0%, #d9b85c 100%)",
                  }}
                >
                  {promoLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
              {promoError && (
                <p className="text-xs text-red-400/80">{promoError}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setPromoOpen(false)
                  setPromoInput("")
                  setPromoError(null)
                }}
                className="text-xs text-white/20 hover:text-white/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mb-6" />

      {/* CTA / Form */}
      {!open ? (
        <button
          onClick={() => !soldOut && setOpen(true)}
          disabled={soldOut}
          className={
            soldOut
              ? "w-full py-3 rounded-xl text-sm font-semibold text-white/20 bg-white/[0.03] border border-white/[0.06] cursor-not-allowed flex items-center justify-center gap-2"
              : "w-full py-3 rounded-xl text-sm font-bold text-[#0a0a0a] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          }
          style={
            soldOut
              ? undefined
              : {
                  background:
                    "linear-gradient(135deg, #c9a84c 0%, #d9b85c 100%)",
                  boxShadow:
                    "0 0 20px rgba(201,168,76,0.2), 0 2px 6px rgba(0,0,0,0.3)",
                }
          }
        >
          {soldOut ? (
            <>
              <Minus size={14} /> Sold Out
            </>
          ) : isPaid ? (
            <>
              <CreditCard size={14} /> Buy Ticket
            </>
          ) : (
            "Secure Your Seat"
          )}
        </button>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            required
            placeholder="Full Name *"
            className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="Email *"
            className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              name="company"
              placeholder="Company"
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
            />
            <input
              type="text"
              name="designation"
              placeholder="Designation"
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
            />
          </div>

          {/* Custom fields */}
          {customFields && customFields.length > 0 && (
            <div className="space-y-3">
              {customFields.map((field) => (
                <div key={field.id}>
                  {field.field_type === "checkbox" ? (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name={`custom_${field.id}`}
                        required={field.is_required}
                        className="w-4 h-4 shrink-0 rounded border-white/[0.08] bg-white/[0.04] text-[#c9a84c] focus:ring-[#c9a84c]/40 focus:ring-offset-0 focus:ring-1 transition-colors accent-[#c9a84c]"
                      />
                      <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                        {field.field_label}
                        {field.is_required && <span className="text-[#c9a84c]/60 ml-0.5">*</span>}
                      </span>
                    </label>
                  ) : (
                    <>
                      <label className="block text-xs text-white/40 mb-1">
                        {field.field_label}
                        {field.is_required && <span className="text-[#c9a84c]/60 ml-0.5">*</span>}
                      </label>
                      {field.field_type === "textarea" ? (
                        <textarea
                          name={`custom_${field.id}`}
                          required={field.is_required}
                          placeholder={field.field_label}
                          className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors min-h-[80px] resize-none"
                        />
                      ) : field.field_type === "select" ? (
                        <div className="relative">
                          <select
                            name={`custom_${field.id}`}
                            required={field.is_required}
                            defaultValue=""
                            className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors appearance-none"
                          >
                            <option value="" disabled className="bg-[#0a0a0a] text-white/40">
                              Select {field.field_label}
                            </option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt} className="bg-[#0a0a0a] text-white">
                                {opt}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/30">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <input
                          type={field.field_type === "email" ? "email" : field.field_type === "url" ? "url" : field.field_type === "number" ? "number" : "text"}
                          name={`custom_${field.id}`}
                          required={field.is_required}
                          placeholder={field.field_label}
                          className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/[0.12]">
              <AlertCircle
                size={14}
                className="text-red-400 mt-0.5 shrink-0"
              />
              <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {/* Payment badge for paid tickets */}
          {isPaid && paymentState === "idle" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#c9a84c]/[0.06] border border-[#c9a84c]/[0.12]">
              <CreditCard size={12} className="text-[#c9a84c]/60" />
              <p className="text-xs text-[#c9a84c]/60">
                Secure payment via Razorpay
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                handleRetry()
              }}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-30"
            >
              Cancel
            </button>

            {paymentState === "failed" ? (
              <button
                type="button"
                onClick={handleRetry}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-[#0a0a0a] transition-colors flex items-center justify-center gap-1.5"
                style={{
                  background:
                    "linear-gradient(135deg, #c9a84c 0%, #d9b85c 100%)",
                }}
              >
                Try Again
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-[#0a0a0a] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                style={{
                  background:
                    "linear-gradient(135deg, #c9a84c 0%, #d9b85c 100%)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />{" "}
                    {paymentState === "awaiting_payment"
                      ? "Complete Payment..."
                      : "Processing..."}
                  </>
                ) : isPaid ? (
                  <>
                    <CreditCard size={14} /> Pay &#8377;
                    {fmtPrice(effectivePrice)}
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
