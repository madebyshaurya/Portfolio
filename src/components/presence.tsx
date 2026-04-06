"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"

// Just you — will be real with PartyKit later
// When wired to PartyKit, each connection sends its country via CF-IPCountry header

export function Presence() {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative inline-flex items-center gap-2 cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-zinc-400/40 animate-[pulse_3s_ease-in-out_infinite]" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-400" />
      </span>
      <span className="text-xs text-zinc-400 tabular-nums">
        1 online
      </span>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 mt-2 px-3 py-2 bg-white rounded-lg border border-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.06)] z-50 whitespace-nowrap"
          >
            <span className="text-xs text-zinc-500">just you 🇨🇦</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
