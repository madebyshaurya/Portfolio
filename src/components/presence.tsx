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
      <motion.div
        layout
        transition={{ layout: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }}
        className="relative inline-flex cursor-default items-center gap-2 rounded-full border border-zinc-200/80 bg-white/92 px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-sm"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/70 animate-[presence-ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="text-xs tabular-nums font-medium text-zinc-600"
          >
            {count} online
          </motion.span>
        </AnimatePresence>

        {/* country flags reveal on hover */}
        <AnimatePresence mode="popLayout" initial={false}>
          {hovered && summary.length > 0 && (
            <motion.div
              key="flags"
              initial={{ opacity: 0, scale: 0.92, filter: "blur(3px)" }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                filter: "blur(3px)",
                transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] },
              }}
              style={{ transformOrigin: "left center" }}
              className="flex items-center gap-1"
            >
              <span className="mx-0.5 h-3 w-px bg-zinc-200" />
              {summary.map((country, i) => (
                <motion.span
                  key={country.code}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.18, delay: 0.04 + i * 0.04, ease: [0.23, 1, 0.32, 1] },
                  }}
                  className="text-[13px] leading-none"
                  title={`${country.name} \u00b7 ${country.count}`}
                >
                  {toFlagEmoji(country.code)}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* join toasts */}
      <div className="absolute right-0 top-full z-50 mt-2 flex flex-col items-end gap-1.5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -4, scale: 0.96, filter: "blur(4px)" }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
              }}
              exit={{
                opacity: 0,
                y: -2,
                scale: 0.98,
                filter: "blur(2px)",
                transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
              }}
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
