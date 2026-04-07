"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"

interface PresenceCountry {
  code: string
  name: string
  count: number
}

interface PresenceResponse {
  count: number
  countries: PresenceCountry[]
}

interface JoinToast {
  id: number
  message: string
  flags: string[]
}

function toFlagEmoji(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "\u{1F30D}"
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

function buildJoinMessage(
  prevCount: number,
  nextCount: number,
  prevCountries: PresenceCountry[],
  nextCountries: PresenceCountry[]
): JoinToast | null {
  const diff = nextCount - prevCount
  if (diff <= 0) return null

  // find countries that gained visitors
  const prevMap = new Map(prevCountries.map((c) => [c.code, c.count]))
  const newCountries = nextCountries.filter(
    (c) => c.count > (prevMap.get(c.code) ?? 0)
  )

  if (newCountries.length === 0) return null

  const flags = newCountries.map((c) => toFlagEmoji(c.code))
  const names = newCountries.map((c) => c.name)

  let message: string
  if (diff === 1) {
    message = `someone joined from ${names[0]}`
  } else if (newCountries.length === 1) {
    message = `${diff} people joined from ${names[0]}`
  } else {
    message = `${diff} people joined from ${newCountries.length} countries`
  }

  return { id: Date.now(), message, flags }
}

export function Presence() {
  const [hovered, setHovered] = useState(false)
  const [presence, setPresence] = useState<PresenceResponse>({
    count: 1,
    countries: [],
  })
  const [toasts, setToasts] = useState<JoinToast[]>([])
  const prevPresence = useRef<PresenceResponse | null>(null)
  const toastIdCounter = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

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
        const next = {
          count: Math.max(1, data.count),
          countries: data.countries,
        }

        // check for new joins (skip the very first load)
        if (prevPresence.current) {
          const toast = buildJoinMessage(
            prevPresence.current.count,
            next.count,
            prevPresence.current.countries,
            next.countries
          )
          if (toast) {
            const id = ++toastIdCounter.current
            const t = { ...toast, id }
            setToasts((prev) => [...prev.slice(-2), t])
            setTimeout(() => dismissToast(id), 4000)
          }
        }

        prevPresence.current = next
        setPresence(next)
      } catch {}
    }

    heartbeat().then(load)
    const heartbeatInterval = window.setInterval(heartbeat, 15_000)
    const loadInterval = window.setInterval(load, 15_000)

    return () => {
      window.clearInterval(heartbeatInterval)
      window.clearInterval(loadInterval)
    }
  }, [dismissToast])

  const summary = useMemo(() => {
    if (presence.countries.length === 0) {
      return [{ code: "CA", name: "Canada", count: 1 }]
    }
    return presence.countries
  }, [presence.countries])

  return (
    <div className="relative">
      <div
        className="relative inline-flex cursor-default items-center gap-2 rounded-full border border-zinc-200/80 bg-white/92 px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-sm"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/35 animate-[pulse_3s_ease-in-out_infinite]" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>

        <AnimatePresence mode="popLayout">
          <motion.span
            key={presence.count}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="text-xs tabular-nums font-medium text-zinc-600"
          >
            {presence.count} online
          </motion.span>
        </AnimatePresence>

        {/* country flags that slide in on hover */}
        <AnimatePresence>
          {hovered && summary.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-1 overflow-hidden"
            >
              <span className="mx-0.5 h-3 w-px bg-zinc-200" />
              {summary.map((country) => (
                <motion.span
                  key={country.code}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  className="text-[13px] leading-none"
                  title={`${country.name} \u00b7 ${country.count}`}
                >
                  {toFlagEmoji(country.code)}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* join toasts */}
      <div className="absolute right-0 top-full z-50 mt-2 flex flex-col items-end gap-1.5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -4, scale: 0.96, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, scale: 0.96, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="whitespace-nowrap rounded-full border border-zinc-100 bg-white/95 px-3 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-sm"
            >
              <span className="text-[11px] text-zinc-400">
                {toast.flags.map((flag, i) => (
                  <span key={i} className="mr-1 text-[13px]">{flag}</span>
                ))}
                {toast.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
