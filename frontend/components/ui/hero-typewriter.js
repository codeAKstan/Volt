"use client"

import { useState, useEffect, useRef } from "react"

export function HeroTypewriter({ phrases, typingSpeed = 100, deletingSpeed = 50, pauseTime = 1500 }) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex]

    if (isPaused) {
      timerRef.current = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseTime)
      return
    }

    if (isDeleting) {
      if (currentText === "") {
        setIsDeleting(false)
        setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length)
      } else {
        timerRef.current = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1))
        }, deletingSpeed)
      }
    } else {
      if (currentText === currentPhrase) {
        setIsPaused(true)
      } else {
        timerRef.current = setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1))
        }, typingSpeed)
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentText, currentPhraseIndex, isDeleting, isPaused, phrases, typingSpeed, deletingSpeed, pauseTime])

  return (
    <span className="inline-block min-w-[280px]">
      {currentText}
      <span className="animate-blink">|</span>
    </span>
  )
}
