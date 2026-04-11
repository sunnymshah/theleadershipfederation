"use client"

import { useState, useRef, useCallback } from "react"
import { Loader2, CheckCircle2, Minus, AlertCircle, CreditCard, Tag, X, ShieldCheck, Sparkles } from "lucide-react"
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

const inputClass =
  "w-full px-3.5 py-2.5 bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg text-sm text-[#1a1a2e] placeholder-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"

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
  const savingsAmount = hasDiscount ? ticket.price_inr - effectivePrice : 0
  const savingsPercent = hasDiscount && ticket.price_inr > 0
    ? Math.round((savingsAmount / ticket.price_inr) * 100)
    : 0

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
      <div className="rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[340px] bg-white shadow-sm border border-emerald-500/30">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-200">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">
          {pendingApproval
            ? "Registration Received"
            : isPaid
            ? "Payment Successful!"
            : "You\u2019re In!"}
        </h3>
        <p className="text-sm text-[#1a1a2e]/65 max-w-xs leading-relaxed">
          {pendingApproval ? (
            <>Your registration for <span className="text-[#1a1a2e] font-medium">{eventTitle}</span> is awaiting approval. We&apos;ll email you once it&apos;s confirmed.</>
          ) : (
            <>Your registration for <span className="text-[#1a1a2e] font-medium">{eventTitle}</span> is confirmed. Check your email for your QR ticket.</>
          )}
        </p>
        {isPaid && !pendingApproval && (
          <div className="mt-5 px-4 py-2.5 rounded-lg bg-[#F4F8FF] border border-[#1a1a2e]/[0.06]">
            <p className="text-xs text-[#1a1a2e]/55">
              Amount paid:{" "}
              <span className="text-[#1a1a2e] font-semibold tabular-nums">
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
      className="rounded-2xl flex flex-col relative overflow-hidden bg-white shadow-sm border border-[#1a1a2e]/[0.06] hover:shadow-md hover:border-[#e7ab1c]/30 transition-all duration-300"
      style={{
        fontFamily:
          "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#e7ab1c] via-[#f0bd3a] to-[#e7ab1c]" />

      <div className="p-7 flex flex-col flex-1">
        {/* Processing overlay */}
        {showProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm">
            <Loader2 size={32} className="text-[#e7ab1c] animate-spin mb-4" />
            <p className="text-sm text-[#1a1a2e] font-semibold">
              {paymentState === "creating_order"
                ? "Preparing your order..."
                : "Verifying payment..."}
            </p>
            <p className="text-xs text-[#1a1a2e]/55 mt-1">
              Please do not close this page
            </p>
          </div>
        )}

        {/* Tier name + tier badge row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-lg font-bold text-[#1a1a2e] leading-tight">{ticket.name}</h3>
          {tierName && hasTierDiscount && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e7ab1c]/15 text-[#a37410] border border-[#e7ab1c]/40">
              <Sparkles size={9} /> {tierName}
            </span>
          )}
        </div>
        {ticket.description && (
          <p className="text-sm text-[#1a1a2e]/65 mb-6 leading-relaxed">
            {ticket.description}
          </p>
        )}

        {/* Price block */}
        <div className="mb-5 mt-auto">
          {effectivePrice === 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-emerald-600">Free</span>
              {ticket.price_inr > 0 && (
                <span className="text-lg text-[#1a1a2e]/40 line-through tabular-nums">
                  &#8377;{fmtPrice(ticket.price_inr)}
                </span>
              )}
            </div>
          ) : hasDiscount ? (
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-bold text-[#1a1a2e] tabular-nums tracking-tight">
                  &#8377;{fmtPrice(effectivePrice)}
                </span>
                <span className="text-lg text-[#1a1a2e]/40 line-through tabular-nums">
                  &#8377;{fmtPrice(ticket.price_inr)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-[#1a1a2e]/55">per person</span>
                {savingsPercent > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Save {savingsPercent}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#1a1a2e] tabular-nums tracking-tight">
                  &#8377;{fmtPrice(ticket.price_inr)}
                </span>
              </div>
              <span className="text-xs text-[#1a1a2e]/55 mt-1 inline-block">per person</span>
            </div>
          )}

          {/* Applied promo badge */}
          {appliedPromo && (
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Tag size={11} />
                {appliedPromo.code}
                {appliedPromo.discountType === "percentage"
                  ? ` (-${appliedPromo.discountValue}%)`
                  : ` (-\u20B9${fmtPrice(appliedPromo.discountValue)})`}
                <button
                  onClick={handleRemovePromo}
                  className="ml-1 hover:text-emerald-900 transition-colors"
                  aria-label="Remove promo code"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          {/* Availability */}
          <div className="flex items-center gap-2 mt-3">
            {soldOut ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                <Minus size={12} /> Sold out
              </span>
            ) : almostGone ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs text-amber-700 font-semibold">
                  Only {spotsLeft} left
                </span>
              </>
            ) : (
              <span className="text-xs text-[#1a1a2e]/55">
                {spotsLeft} spots remaining
              </span>
            )}
          </div>
        </div>

        {/* Promo code section (only for paid base tickets without an applied promo) */}
        {ticket.price_inr > 0 && !appliedPromo && (
          <div className="mb-4">
            {!promoOpen ? (
              <button
                type="button"
                onClick={() => setPromoOpen(true)}
                className="text-xs text-[#1a1a2e]/55 hover:text-[#e7ab1c] transition-colors flex items-center gap-1.5 font-medium"
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
                    className={`${inputClass} uppercase`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#e7ab1c] hover:bg-[#d49c10] disabled:opacity-40 transition-all duration-200 flex items-center gap-1.5"
                  >
                    {promoLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
                {promoError && (
                  <p className="text-xs text-red-600">{promoError}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPromoOpen(false)
                    setPromoInput("")
                    setPromoError(null)
                  }}
                  className="text-xs text-[#1a1a2e]/45 hover:text-[#1a1a2e]/65 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-[#1a1a2e]/[0.06] mb-5" />

        {/* CTA / Form */}
        {!open ? (
          <>
            <button
              onClick={() => !soldOut && setOpen(true)}
              disabled={soldOut}
              className={
                soldOut
                  ? "w-full py-3.5 rounded-xl text-sm font-semibold text-[#1a1a2e]/40 bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] cursor-not-allowed flex items-center justify-center gap-2"
                  : "w-full py-3.5 rounded-xl text-sm font-bold text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(231,171,28,0.35)]"
              }
            >
              {soldOut ? (
                <>
                  <Minus size={14} /> Sold Out
                </>
              ) : isPaid ? (
                <>
                  <CreditCard size={14} /> Buy Ticket — &#8377;{fmtPrice(effectivePrice)}
                </>
              ) : (
                "Secure Your Seat"
              )}
            </button>
            {!soldOut && isPaid && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-[#1a1a2e]/55">
                <ShieldCheck size={11} className="text-[#e7ab1c]" />
                Secure payment via Razorpay
              </div>
            )}
          </>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="name"
              required
              placeholder="Full Name *"
              className={inputClass}
            />
            <input
              type="email"
              name="email"
              required
              placeholder="Email *"
              className={inputClass}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="company"
                placeholder="Company"
                className={inputClass}
              />
              <input
                type="text"
                name="designation"
                placeholder="Designation"
                className={inputClass}
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
                          className="w-4 h-4 shrink-0 rounded border-[#1a1a2e]/[0.12] bg-[#F4F8FF] text-[#e7ab1c] focus:ring-[#e7ab1c]/40 focus:ring-offset-0 focus:ring-2 transition-colors accent-[#e7ab1c]"
                        />
                        <span className="text-sm text-[#1a1a2e]/75 group-hover:text-[#1a1a2e] transition-colors">
                          {field.field_label}
                          {field.is_required && <span className="text-[#e7ab1c] ml-0.5">*</span>}
                        </span>
                      </label>
                    ) : (
                      <>
                        <label className="block text-xs text-[#1a1a2e]/65 mb-1 font-medium">
                          {field.field_label}
                          {field.is_required && <span className="text-[#e7ab1c] ml-0.5">*</span>}
                        </label>
                        {field.field_type === "textarea" ? (
                          <textarea
                            name={`custom_${field.id}`}
                            required={field.is_required}
                            placeholder={field.field_label}
                            className={`${inputClass} min-h-[80px] resize-none`}
                          />
                        ) : field.field_type === "select" ? (
                          <div className="relative">
                            <select
                              name={`custom_${field.id}`}
                              required={field.is_required}
                              defaultValue=""
                              className={`${inputClass} appearance-none pr-9`}
                            >
                              <option value="" disabled>
                                Select {field.field_label}
                              </option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#1a1a2e]/55">
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
                            className={inputClass}
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
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle
                  size={14}
                  className="text-red-600 mt-0.5 shrink-0"
                />
                <p className="text-red-700 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Trust badges for paid tickets */}
            {isPaid && paymentState === "idle" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#e7ab1c]/[0.06] border border-[#e7ab1c]/20">
                <ShieldCheck size={13} className="text-[#e7ab1c] shrink-0" />
                <p className="text-xs text-[#1a1a2e]/75 font-medium">
                  Secure 256-bit encrypted payment via Razorpay
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
                className="flex-1 py-2.5 rounded-lg border border-[#1a1a2e]/[0.08] text-sm text-[#1a1a2e]/65 hover:text-[#1a1a2e] hover:bg-[#F4F8FF] transition-colors disabled:opacity-30"
              >
                Cancel
              </button>

              {paymentState === "failed" ? (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-colors flex items-center justify-center gap-1.5"
                >
                  Try Again
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-[#e7ab1c] hover:bg-[#d49c10] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(231,171,28,0.3)]"
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
    </div>
  )
}
