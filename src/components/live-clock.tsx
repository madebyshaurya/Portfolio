"use client"

import { useState, useEffect } from "react"
import { SlidingNumber } from "@/components/motion-primitives/sliding-number"

export function LiveClock() {
  const [parts, setParts] = useState<{ hour: number; minute: number; second: number } | null>(null)
  const [period, setPeriod] = useState("")

  useEffect(() => {
    function tick() {
      const now = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).formatToParts(new Date())

      const hour = Number(now.find((part) => part.type === "hour")?.value ?? 0)
      const minute = Number(now.find((part) => part.type === "minute")?.value ?? 0)
      const second = Number(now.find((part) => part.type === "second")?.value ?? 0)
      const dayPeriod = now.find((part) => part.type === "dayPeriod")?.value ?? ""

      setParts({ hour, minute, second })
      setPeriod(dayPeriod)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!parts) return null

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/92 px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/70 animate-[presence-ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-sm text-zinc-500">
        toronto{" "}
      </span>
      <span
        className="text-sm text-zinc-900 tabular-nums inline-flex"
        style={{ fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums" }}
      >
        <SlidingNumber value={parts.hour} padStart />
        <span className="mx-[0.08em]">:</span>
        <SlidingNumber value={parts.minute} padStart />
        <span className="mx-[0.08em]">:</span>
        <SlidingNumber value={parts.second} padStart />
        <span className="text-zinc-400 ml-0.5 text-xs self-center">{period}</span>
      </span>
    </div>
  )
}
