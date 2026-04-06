"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"

function AnimatedDigit({ char, id }: { char: string; id: string }) {
  return (
    <span className="relative inline-flex overflow-hidden" style={{ width: char === ":" ? "0.35em" : "0.6em", height: "1em" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={`${id}-${char}`}
          initial={{ y: "80%", filter: "blur(3px)", opacity: 0 }}
          animate={{ y: "0%", filter: "blur(0px)", opacity: 1 }}
          exit={{ y: "-80%", filter: "blur(3px)", opacity: 0 }}
          transition={{
            y: { type: "spring", duration: 0.4, bounce: 0.1 },
            filter: { duration: 0.2 },
            opacity: { duration: 0.15 },
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function LiveClock() {
  const [time, setTime] = useState("")
  const [period, setPeriod] = useState("")
  const prevTime = useRef("")

  useEffect(() => {
    function tick() {
      const now = new Date().toLocaleString("en-US", {
        timeZone: "America/Toronto",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
      const [t, p] = now.split(" ")
      setTime(t)
      setPeriod(p)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return null

  const chars = time.split("")

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 animate-[pulse_3s_ease-in-out_infinite]" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-sm text-zinc-500">
        toronto{" "}
      </span>
      <span
        className="text-sm text-zinc-900 tabular-nums inline-flex"
        style={{ fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums" }}
      >
        {chars.map((char, i) => (
          <AnimatedDigit key={i} char={char} id={`d${i}`} />
        ))}
        <span className="text-zinc-400 ml-0.5 text-xs self-center">{period}</span>
      </span>
    </div>
  )
}
