"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useSession, signIn } from "next-auth/react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface GuestbookEntry {
  id: string
  username: string
  avatar: string
  message: string
  createdAt: string
  signature?: string
}

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function Guestbook() {
  const { data: session } = useSession()
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [message, setMessage] = useState("")
  const [signature, setSignature] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  // Fetch real entries
  useEffect(() => {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then((data: GuestbookEntry[]) => setEntries(data))
      .catch(() => {})
  }, [])

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true })
      return () => el.removeEventListener("scroll", checkScroll)
    }
  }, [checkScroll])

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" })
  }

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          signature: signature || undefined,
        }),
      })
      if (res.ok) {
        const entry = await res.json()
        setEntries((prev) => [entry, ...prev])
        setMessage("")
        setSignature("")
        setShowComposer(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!showComposer || !canvasRef.current) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "rgba(24,24,27,0.9)"
    ctx.lineWidth = 2
  }, [showComposer])

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d")
    const point = getPoint(event)
    if (!ctx || !point) return
    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext("2d")
    const point = getPoint(event)
    if (!ctx || !point) return
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing || !canvasRef.current) return
    setIsDrawing(false)
    setSignature(canvasRef.current.toDataURL("image/png"))
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature("")
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xs text-zinc-400 tracking-wide uppercase">
            Guestbook
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="p-1 rounded-md text-zinc-300 transition-colors duration-150 hover:text-zinc-500 disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="p-1 rounded-md text-zinc-300 transition-colors duration-150 hover:text-zinc-500 disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {session ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setShowComposer(true)}
              placeholder="leave a note..."
              maxLength={200}
              className="text-xs px-3 py-1.5 rounded-full border border-zinc-200 bg-transparent outline-none focus:border-zinc-300 transition-colors duration-200 w-36 sm:w-48 placeholder:text-zinc-300"
            />
            <button
              onClick={() => setShowComposer(true)}
              disabled={!message.trim()}
              className="text-xs text-zinc-400 px-3 py-1.5 rounded-full border border-zinc-200 transition-colors duration-200 hover:border-zinc-300 hover:text-zinc-600 disabled:opacity-40"
            >
              sign
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("github")}
            className="text-xs text-zinc-400 px-3 py-1.5 rounded-full border border-zinc-200 transition-colors duration-200 hover:border-zinc-300 hover:text-zinc-600"
          >
            sign with github
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {entries.length === 0 ? (
          <div className="shrink-0 w-full rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
            <p className="text-sm text-zinc-500">
              no notes yet. be the first to leave one.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="relative shrink-0 flex flex-col gap-2.5 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 w-[220px] overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={entry.avatar}
                  alt={entry.username}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="text-xs text-zinc-500 font-medium">
                  {entry.username}
                </span>
                <span className="text-[10px] text-zinc-300 ml-auto tabular-nums">
                  {timeAgo(entry.createdAt)}
                </span>
              </div>
              <p className="text-sm text-zinc-600 leading-snug">
                {entry.message}
              </p>
              {entry.signature ? (
                <img
                  src={entry.signature}
                  alt=""
                  className="pointer-events-none absolute inset-x-3 bottom-2 h-12 object-contain opacity-20 mix-blend-multiply"
                />
              ) : null}
            </div>
          ))
        )}
      </div>

      {showComposer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-800">add a note</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  draw a quick signature if you want.
                </p>
              </div>
              <button
                onClick={() => setShowComposer(false)}
                className="rounded-full p-1 text-zinc-300 transition-colors duration-150 hover:text-zinc-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
              <p className="text-sm text-zinc-600 leading-snug">{message}</p>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-zinc-400">
                  signature
                </span>
                <button
                  onClick={clearSignature}
                  className="text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-600"
                >
                  clear
                </button>
              </div>
              <canvas
                ref={canvasRef}
                className="h-36 w-full rounded-xl border border-zinc-200 bg-white touch-none"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowComposer(false)}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-150 hover:border-zinc-300 hover:text-zinc-600"
              >
                cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs text-white transition-opacity duration-150 disabled:opacity-50"
              >
                {submitting ? "posting..." : "post note"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
