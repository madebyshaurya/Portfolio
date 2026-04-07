"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useSpring } from "motion/react"
import usePartySocket from "partysocket/react"

interface CursorData {
  x: number
  y: number
  country: string
  lastActive: number
}

interface PresenceCountry {
  code: string
  name: string
  count: number
}

interface JoinToast {
  id: number
  country: string
  message: string
}

function toFlagEmoji(code: string) {
  if (!/^[A-Z]{2}$/.test(code) || code === "XX") return "\u{1F30D}"
  return String.fromCodePoint(
    ...code.split("").map((char) => 127397 + char.charCodeAt(0))
  )
}

function SmoothCursor({ x, y, country }: { x: number; y: number; country: string }) {
  const springX = useSpring(x, { stiffness: 200, damping: 28 })
  const springY = useSpring(y, { stiffness: 200, damping: 28 })

  useEffect(() => {
    springX.set(x)
    springY.set(y)
  }, [x, y, springX, springY])

  return (
    <motion.div
      className="pointer-events-none fixed z-[999] select-none"
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
    >
      {/* cursor arrow silhouette */}
      <svg
        width="18"
        height="22"
        viewBox="0 0 18 22"
        fill="none"
        className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      >
        <path
          d="M1.5 1L16 12.5H8.5L5 21L1.5 1Z"
          fill="rgba(161,161,170,0.12)"
          stroke="rgba(161,161,170,0.35)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="ml-3 -mt-1 inline-block text-[11px] leading-none">
        {toFlagEmoji(country)}
      </span>
    </motion.div>
  )
}

export function useLiveCursors(containerRef: React.RefObject<HTMLElement | null>) {
  const [cursors, setCursors] = useState<Record<string, CursorData>>({})
  const [presence, setPresence] = useState({ count: 1, countries: [] as PresenceCountry[] })
  const [toasts, setToasts] = useState<JoinToast[]>([])
  const toastId = useRef(0)
  const lastSent = useRef(0)

  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999"

  const ws = usePartySocket({
    host,
    room: "main",
    onMessage(event) {
      const data = JSON.parse(event.data)

      if (data.type === "cursor") {
        setCursors((prev) => ({
          ...prev,
          [data.id]: {
            x: data.x,
            y: data.y,
            country: data.country,
            lastActive: Date.now(),
          },
        }))
      } else if (data.type === "sync") {
        setCursors(
          Object.fromEntries(
            Object.entries(data.cursors as Record<string, CursorData>).map(
              ([id, c]) => [id, { ...c, lastActive: Date.now() }]
            )
          )
        )
        setPresence((prev) => ({ ...prev, count: Math.max(1, data.count) }))
      } else if (data.type === "join") {
        const id = ++toastId.current
        const flag = toFlagEmoji(data.country)
        setToasts((prev) => [
          ...prev.slice(-2),
          { id, country: data.country, message: `${flag} someone joined` },
        ])
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
      } else if (data.type === "leave") {
        setCursors((prev) => {
          const next = { ...prev }
          delete next[data.id]
          return next
        })
      } else if (data.type === "presence") {
        setPresence({
          count: Math.max(1, data.count),
          countries: data.countries,
        })
      }
    },
  })

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const now = Date.now()
      if (now - lastSent.current < 33) return // ~30fps throttle
      lastSent.current = now

      if (ws.readyState !== WebSocket.OPEN) return

      ws.send(
        JSON.stringify({
          type: "cursor",
          x: e.clientX,
          y: e.clientY,
        })
      )
    },
    [ws]
  )

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove)
    return () => window.removeEventListener("pointermove", handlePointerMove)
  }, [handlePointerMove])

  // Clean up stale cursors (no update in 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 10_000
      setCursors((prev) => {
        const next: typeof prev = {}
        for (const [id, c] of Object.entries(prev)) {
          if (c.lastActive >= cutoff) next[id] = c
        }
        return Object.keys(next).length === Object.keys(prev).length ? prev : next
      })
    }, 5_000)
    return () => clearInterval(interval)
  }, [])

  return { cursors, presence, toasts }
}

export function LiveCursors({ cursors }: { cursors: Record<string, CursorData> }) {
  return (
    <>
      {Object.entries(cursors).map(([id, cursor]) => (
        <SmoothCursor key={id} x={cursor.x} y={cursor.y} country={cursor.country} />
      ))}
    </>
  )
}
