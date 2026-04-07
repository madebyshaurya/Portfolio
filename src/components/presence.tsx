"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"

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

interface PresenceProps {
  count: number
  countries: PresenceCountry[]
  toasts: JoinToast[]
}

export function Presence({ count, countries, toasts }: PresenceProps) {
  const [hovered, setHovered] = useState(false)

  const summary = useMemo(() => {
    if (countries.length === 0) {
      return [{ code: "CA", name: "Canada", count: 1 }]
    }
    return countries
  }, [countries])

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
            key={count}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="text-xs tabular-nums font-medium text-zinc-600"
          >
            {count} online
          </motion.span>
        </AnimatePresence>

        {/* country flags slide in on hover */}
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
                {toast.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
