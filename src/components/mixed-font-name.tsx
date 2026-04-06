"use client"

import { useState, useEffect } from "react"

const fontStyles = [
  { fontFamily: "var(--font-editorial)", fontWeight: 300, fontStyle: "normal" },
  { fontFamily: "var(--font-editorial)", fontWeight: 400, fontStyle: "italic" },
  { fontFamily: "var(--font-geist-sans)", fontWeight: 400, fontStyle: "normal" },
  { fontFamily: "var(--font-geist-mono)", fontWeight: 400, fontStyle: "normal" },
  { fontFamily: "var(--font-editorial)", fontWeight: 400, fontStyle: "normal" },
  { fontFamily: "var(--font-geist-pixel-square)", fontWeight: 500, fontStyle: "normal" },
]

export function MixedFontName({ name }: { name: string }) {
  const [assignments, setAssignments] = useState<number[]>([])

  useEffect(() => {
    setAssignments(
      name.split("").map(() => Math.floor(Math.random() * fontStyles.length))
    )
  }, [name])

  if (assignments.length === 0) {
    return (
      <span style={{ fontFamily: "var(--font-editorial)", fontWeight: 300 }}>
        {name}
      </span>
    )
  }

  return (
    <span>
      {name.split("").map((char, i) =>
        char === " " ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span
            key={i}
            style={{
              fontFamily: fontStyles[assignments[i]].fontFamily,
              fontWeight: fontStyles[assignments[i]].fontWeight,
              fontStyle: fontStyles[assignments[i]].fontStyle,
            }}
          >
            {char}
          </span>
        )
      )}
    </span>
  )
}
