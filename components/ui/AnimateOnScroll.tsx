"use client"

import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from "react"

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "blur" | "none"

const HIDDEN_STYLES: Record<AnimationType, CSSProperties> = {
  "fade-up":    { opacity: 0, transform: "translateY(24px)" },
  "fade-down":  { opacity: 0, transform: "translateY(-24px)" },
  "fade-left":  { opacity: 0, transform: "translateX(-32px)" },
  "fade-right": { opacity: 0, transform: "translateX(32px)" },
  "scale":      { opacity: 0, transform: "scale(0.92)" },
  "blur":       { opacity: 0, filter: "blur(8px)", transform: "translateY(12px)" },
  "none":       {},
}

const VISIBLE_STYLES: Record<AnimationType, CSSProperties> = {
  "fade-up":    { opacity: 1, transform: "translateY(0)" },
  "fade-down":  { opacity: 1, transform: "translateY(0)" },
  "fade-left":  { opacity: 1, transform: "translateX(0)" },
  "fade-right": { opacity: 1, transform: "translateX(0)" },
  "scale":      { opacity: 1, transform: "scale(1)" },
  "blur":       { opacity: 1, filter: "blur(0)", transform: "translateY(0)" },
  "none":       {},
}

export function AnimateOnScroll({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
  duration = 700,
  threshold = 0.1,
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  animation?: AnimationType
  delay?: number
  duration?: number
  threshold?: number
  as?: "div" | "section" | "li" | "span"
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Default visible — content is ALWAYS shown so there's no flash of
  // opacity-0 on hard reloads or when JS hydrates slowly. The
  // IntersectionObserver below only animates items genuinely below
  // the fold (it sets invisible-then-visible when they scroll in).
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const initialRect = el.getBoundingClientRect()
    const inViewportNow =
      initialRect.top < window.innerHeight && initialRect.bottom > 0
    if (inViewportNow) {
      setVisible(true)
      return
    }
    setVisible(false)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  const style: CSSProperties = {
    ...(visible ? VISIBLE_STYLES[animation] : HIDDEN_STYLES[animation]),
    transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    transitionDelay: delay ? `${delay}ms` : undefined,
    willChange: "opacity, transform",
  }

  return (
    <Tag ref={ref as any} className={className} style={style}>
      {children}
    </Tag>
  )
}

/** Wrap children in a staggered animation group */
export function StaggerChildren({
  children,
  className = "",
  animation = "fade-up",
  stagger = 100,
  duration = 700,
  threshold = 0.15,
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  animation?: AnimationType
  stagger?: number
  duration?: number
  threshold?: number
  as?: "div" | "section" | "ul"
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Default visible — content is ALWAYS shown so there's no flash of
  // opacity-0 on hard reloads or when JS hydrates slowly. The
  // IntersectionObserver below only animates items genuinely below
  // the fold (it sets invisible-then-visible when they scroll in).
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const initialRect = el.getBoundingClientRect()
    const inViewportNow =
      initialRect.top < window.innerHeight && initialRect.bottom > 0
    if (inViewportNow) {
      setVisible(true)
      return
    }
    setVisible(false)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <Tag ref={ref as any} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => {
            if (!child) return null
            const style: CSSProperties = {
              ...(visible ? VISIBLE_STYLES[animation] : HIDDEN_STYLES[animation]),
              transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              transitionDelay: visible ? `${i * stagger}ms` : "0ms",
              willChange: "opacity, transform",
            }
            return (
              <div key={i} style={style}>
                {child}
              </div>
            )
          })
        : children}
    </Tag>
  )
}
