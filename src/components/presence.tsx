"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"

type PresenceCountry = {
  code: string
  name: string
  count: number
}

type PresenceResponse = {
  count: number
  countries: PresenceCountry[]
}

function toFlagEmoji(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌍"
  return String.fromCodePoint(
    ...code.split("").map((char) => 127397 + char.charCodeAt(0))
  )
}

function getSessionId() {
  const key = "portfolio-presence-session"
  const existing = window.localStorage.getItem(key)
  if (existing) return existing

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(key, created)
  return created
}

export function Presence() {
  const [hovered, setHovered] = useState(false)
  const [presence, setPresence] = useState<PresenceResponse>({
    count: 1,
    countries: [],
  })

  useEffect(() => {
    const sessionId = getSessionId()

    const heartbeat = async () => {
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
      } catch {}
    }

    const load = async () => {
      try {
        const res = await fetch("/api/presence", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as PresenceResponse
        setPresence({
          count: Math.max(1, data.count),
          countries: data.countries,
        })
      } catch {}
    }

    heartbeat().then(load)
    const heartbeatInterval = window.setInterval(heartbeat, 15_000)
    const loadInterval = window.setInterval(load, 15_000)

    return () => {
      window.clearInterval(heartbeatInterval)
      window.clearInterval(loadInterval)
    }
  }, [])

  const summary = useMemo(() => {
    if (presence.countries.length === 0) {
      return [{ code: "CA", name: "Canada", count: 1 }]
    }
    return presence.countries
  }, [presence.countries])

  return (
    <div
      className="relative inline-flex cursor-default items-center gap-2 rounded-full border border-zinc-200/80 bg-white/92 px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/35 animate-[pulse_3s_ease-in-out_infinite]" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs tabular-nums font-medium text-zinc-600">
        {presence.count} online
      </span>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-0 top-full z-50 mt-2 whitespace-nowrap rounded-xl border border-zinc-100 bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center gap-2">
              {summary.map((country) => (
                <span key={country.code} className="text-sm" title={`${country.name} · ${country.count}`}>
                  {toFlagEmoji(country.code)}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
