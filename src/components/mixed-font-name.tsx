"use client"

import { useEffect, useMemo, useRef, useState } from "react"

const fontStyles = [
  { fontFamily: "var(--font-editorial)", fontWeight: 300, fontStyle: "normal" },
  { fontFamily: "var(--font-editorial)", fontWeight: 400, fontStyle: "italic" },
  { fontFamily: "var(--font-geist-sans)", fontWeight: 400, fontStyle: "normal" },
  { fontFamily: "var(--font-geist-mono)", fontWeight: 400, fontStyle: "normal" },
  { fontFamily: "var(--font-editorial)", fontWeight: 400, fontStyle: "normal" },
  { fontFamily: "var(--font-geist-pixel-square)", fontWeight: 500, fontStyle: "normal" },
]

const scrambleGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*@+=?"

function seededIndex(seed: number, mod: number) {
  return Math.abs(Math.sin(seed * 12.9898) * 10000) % mod
}

function getStableAssignments(name: string) {
  return name.split("").map((char, index) => {
    if (char === " ") return 0
    return Math.floor(seededIndex(char.charCodeAt(0) + index * 17, fontStyles.length))
  })
}

export function MixedFontName({ name }: { name: string }) {
  const stableAssignments = useMemo(() => getStableAssignments(name), [name])
  const [characters, setCharacters] = useState(() => name.split(""))
  const [assignments, setAssignments] = useState(stableAssignments)
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  const startScramble = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
    }

    setIsAnimating(true)

    let frame = 0
    const totalFrames = 12

    intervalRef.current = window.setInterval(() => {
      frame += 1

      const revealCount = Math.floor((frame / totalFrames) * name.length)

      setCharacters(
        name.split("").map((char, index) => {
          if (char === " ") return " "
          if (index < revealCount) return char
          return scrambleGlyphs[Math.floor(Math.random() * scrambleGlyphs.length)]
        })
      )

      setAssignments(
        name.split("").map((char, index) => {
          if (char === " ") return 0
          if (index < revealCount) return stableAssignments[index]
          return Math.floor(Math.random() * fontStyles.length)
        })
      )

      if (frame >= totalFrames) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current)
        }
        intervalRef.current = null
        setCharacters(name.split(""))
        setAssignments(stableAssignments)
        setIsAnimating(false)
      }
    }, 58)
  }

  useEffect(() => {
    setCharacters(name.split(""))
    setAssignments(stableAssignments)

    timeoutRef.current = window.setTimeout(() => {
      startScramble()
    }, 240)

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [name, stableAssignments])

  if (assignments.length === 0) {
    return (
      <span style={{ fontFamily: "var(--font-editorial)", fontWeight: 300 }}>
        {name}
      </span>
    )
  }

  return (
    <span
      onMouseEnter={() => {
        if (!isAnimating) startScramble()
      }}
      style={{
        display: "inline-block",
        transition: "filter 220ms ease, letter-spacing 220ms ease",
        filter: isAnimating ? "blur(0.35px)" : "blur(0px)",
        letterSpacing: isAnimating ? "-0.02em" : "0em",
      }}
    >
      {characters.map((char, i) =>
        char === " " ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span
            key={i}
            style={{
              fontFamily: fontStyles[assignments[i]].fontFamily,
              fontWeight: fontStyles[assignments[i]].fontWeight,
              fontStyle: fontStyles[assignments[i]].fontStyle,
              display: "inline-block",
              transition:
                "font-family 180ms ease, font-style 180ms ease, font-weight 180ms ease, transform 180ms ease, opacity 180ms ease",
              transform: isAnimating ? "translateY(-0.02em)" : "translateY(0)",
              opacity: isAnimating ? 0.95 : 1,
            }}
          >
            {char}
          </span>
        )
      )}
    </span>
  )
}
