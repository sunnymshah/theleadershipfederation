"use client"

import { useState, useEffect, useCallback } from "react"

interface TypewriterProps {
  words: string[]
  className?: string
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
}

export function Typewriter({
  words,
  className = "",
  typingSpeed = 90,
  deletingSpeed = 50,
  pauseDuration = 2000,
}: TypewriterProps) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const tick = useCallback(() => {
    const current = words[index]
    if (!isDeleting) {
      setText(current.slice(0, text.length + 1))
      if (text.length + 1 === current.length) {
        setTimeout(() => setIsDeleting(true), pauseDuration)
        return
      }
    } else {
      setText(current.slice(0, text.length - 1))
      if (text.length - 1 === 0) {
        setIsDeleting(false)
        setIndex((i) => (i + 1) % words.length)
        return
      }
    }
  }, [words, index, text, isDeleting, pauseDuration])

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed
    const timer = setTimeout(tick, speed)
    return () => clearTimeout(timer)
  }, [tick, isDeleting, typingSpeed, deletingSpeed])

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[3px] h-[0.9em] bg-current ml-0.5 animate-blink align-middle" />
    </span>
  )
}
