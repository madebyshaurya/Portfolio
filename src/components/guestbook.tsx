"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useSession, signIn } from "next-auth/react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, PenLine, Type, X } from "lucide-react"
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "@/components/motion-primitives/morphing-popover"
import { ProgressiveBlur } from "@/components/motion-primitives/progressive-blur"
import { Tilt } from "@/components/motion-primitives/tilt"

interface GuestbookEntry {
  id: string
  username: string
  avatar: string
  message: string
  createdAt: string
  signature?: string
  signatureText?: string
}

type SignatureMode = "draw" | "type"
type ComposerStep = "compose" | "preview"

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
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [message, setMessage] = useState("")
  const [signature, setSignature] = useState("")
  const [typedSignature, setTypedSignature] = useState("")
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("draw")
  const [composerStep, setComposerStep] = useState<ComposerStep>("compose")
  const [submitting, setSubmitting] = useState(false)
  const [showComposer, setShowComposer] = useState(false)

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
    if (!el) return
    el.addEventListener("scroll", checkScroll, { passive: true })
    return () => el.removeEventListener("scroll", checkScroll)
  }, [checkScroll])

  const setupCanvas = useCallback(() => {
    if (!canvasRef.current) return
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
    ctx.strokeStyle = "rgba(24,24,27,0.92)"
    ctx.lineWidth = 2.2
  }, [])

  useEffect(() => {
    if (showComposer && signatureMode === "draw") {
      setupCanvas()
    }
  }, [showComposer, signatureMode, setupCanvas])

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
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const point = getPoint(event)
    if (!canvas || !ctx || !point) return

    canvas.setPointerCapture(event.pointerId)
    drawingRef.current = true
    lastPointRef.current = point
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext("2d")
    const point = getPoint(event)
    const lastPoint = lastPointRef.current
    if (!ctx || !point || !lastPoint) return

    const midX = (lastPoint.x + point.x) / 2
    const midY = (lastPoint.y + point.y) / 2
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY)
    ctx.stroke()
    lastPointRef.current = point
  }

  const stopDrawing = () => {
    if (!drawingRef.current || !canvasRef.current) return
    drawingRef.current = false
    lastPointRef.current = null
    setSignature(canvasRef.current.toDataURL("image/png"))
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setSignature("")
    setTypedSignature("")
  }

  const closeComposer = () => {
    setShowComposer(false)
    setComposerStep("compose")
  }

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
          signature: signatureMode === "draw" ? signature || undefined : undefined,
          signatureText:
            signatureMode === "type" ? typedSignature.trim() || undefined : undefined,
        }),
      })

      if (res.ok) {
        const entry = await res.json()
        setEntries((prev) => [entry, ...prev])
        setMessage("")
        setSignature("")
        setTypedSignature("")
        setShowComposer(false)
        setComposerStep("compose")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xs uppercase tracking-wide text-zinc-400">
            Guestbook
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="rounded-md p-1 text-zinc-300 transition-colors duration-150 hover:text-zinc-500 disabled:cursor-default disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="rounded-md p-1 text-zinc-300 transition-colors duration-150 hover:text-zinc-500 disabled:cursor-default disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {session ? (
          <MorphingPopover
            open={showComposer}
            onOpenChange={setShowComposer}
            className="justify-end"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setComposerStep("compose")
                  setShowComposer(true)
                }
              }}
                placeholder="leave a note..."
                maxLength={200}
                className="w-36 rounded-full border border-zinc-200 bg-transparent px-3 py-1.5 text-xs text-zinc-700 outline-none transition-colors duration-200 placeholder:text-zinc-300 focus:border-zinc-300 sm:w-48"
              />
              <MorphingPopoverTrigger
                disabled={!message.trim()}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-200 hover:border-zinc-300 hover:text-zinc-600 disabled:opacity-40"
              >
                sign
              </MorphingPopoverTrigger>
            </div>

            <MorphingPopoverContent
              className={`right-0 top-[calc(100%+12px)] rounded-[28px] border-zinc-200/90 bg-white/95 p-0 shadow-[0_24px_80px_rgba(0,0,0,0.10)] backdrop-blur-xl ${
                composerStep === "compose"
                  ? "w-[min(28rem,calc(100vw-2rem))]"
                  : "w-[min(32rem,calc(100vw-2rem))]"
              }`}
            >
              <div className="relative overflow-hidden rounded-[28px]">
                <ProgressiveBlur
                  direction="bottom"
                  blurIntensity={0.5}
                  blurLayers={10}
                  className="absolute inset-0 z-0"
                />

                <div className="relative z-10 p-6">
                  {composerStep === "compose" ? (
                    <>
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-medium text-zinc-900">sign the guestbook</h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            add a note, then draw or type a signature.
                          </p>
                        </div>
                        <button
                          onClick={closeComposer}
                          className="rounded-full p-1.5 text-zinc-300 transition-colors duration-150 hover:text-zinc-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                          Signature
                        </span>
                        <button
                          onClick={clearSignature}
                          className="text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-600"
                        >
                          clear
                        </button>
                      </div>

                      <div className="mt-3 inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1">
                        <button
                          onClick={() => setSignatureMode("draw")}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-150 ${
                            signatureMode === "draw"
                              ? "bg-white text-zinc-900 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-600"
                          }`}
                        >
                          <PenLine className="h-3.5 w-3.5" />
                          draw
                        </button>
                        <button
                          onClick={() => setSignatureMode("type")}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-150 ${
                            signatureMode === "type"
                              ? "bg-white text-zinc-900 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-600"
                          }`}
                        >
                          <Type className="h-3.5 w-3.5" />
                          type
                        </button>
                      </div>

                      {signatureMode === "draw" ? (
                        <div className="mt-4 overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
                          <div className="border-b border-zinc-100 bg-[linear-gradient(to_bottom,transparent_95%,rgba(0,0,0,0.03)_95%)] bg-[length:100%_28px] px-4 py-3">
                            <canvas
                              ref={canvasRef}
                              className="h-32 w-full touch-none"
                              onPointerDown={startDrawing}
                              onPointerMove={draw}
                              onPointerUp={stopDrawing}
                              onPointerCancel={stopDrawing}
                              onPointerLeave={stopDrawing}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-4">
                          <input
                            type="text"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            placeholder="type your signature"
                            maxLength={48}
                            className="w-full border-0 bg-transparent text-2xl text-zinc-900 outline-none placeholder:text-zinc-300"
                            style={{ fontFamily: "var(--font-handwritten)" }}
                          />
                        </div>
                      )}

                      <div className="mt-5 flex justify-end gap-2">
                        <button
                          onClick={closeComposer}
                          className="rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-400 transition-colors duration-150 hover:border-zinc-300 hover:text-zinc-600"
                        >
                          cancel
                        </button>
                        <button
                          onClick={() => setComposerStep("preview")}
                          className="rounded-full bg-zinc-950 px-4 py-2 text-xs text-white transition-opacity duration-150"
                        >
                          done
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-medium text-zinc-900">preview note</h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            this is how it will look in the guestbook.
                          </p>
                        </div>
                        <button
                          onClick={closeComposer}
                          className="rounded-full p-1.5 text-zinc-300 transition-colors duration-150 hover:text-zinc-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <Tilt rotationFactor={5} springOptions={{ stiffness: 180, damping: 20 }}>
                        <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_12px_24px_rgba(0,0,0,0.04)]">
                          <div className="flex items-center gap-2">
                            {session.user?.image ? (
                              <Image
                                src={session.user.image}
                                alt={session.user.name ?? "you"}
                                width={20}
                                height={20}
                                className="rounded-full"
                              />
                            ) : null}
                            <span className="text-xs font-medium text-zinc-500">
                              {session.user?.name ?? "you"}
                            </span>
                          </div>
                          <p className="relative z-10 mt-3 text-base leading-relaxed text-zinc-700">
                            {message}
                          </p>
                          {signatureMode === "draw" && signature ? (
                            <img
                              src={signature}
                              alt=""
                              className="pointer-events-none absolute inset-x-4 bottom-3 h-14 object-contain opacity-20 mix-blend-multiply"
                            />
                          ) : null}
                          {signatureMode === "type" && typedSignature ? (
                            <span
                              className="pointer-events-none absolute bottom-3 right-4 rotate-[-4deg] text-lg text-zinc-900/25"
                              style={{ fontFamily: "var(--font-handwritten)" }}
                            >
                              {typedSignature}
                            </span>
                          ) : null}
                        </div>
                      </Tilt>

                      <div className="mt-5 flex justify-between gap-2">
                        <button
                          onClick={() => setComposerStep("compose")}
                          className="rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-400 transition-colors duration-150 hover:border-zinc-300 hover:text-zinc-600"
                        >
                          back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="rounded-full bg-zinc-950 px-4 py-2 text-xs text-white transition-opacity duration-150 disabled:opacity-50"
                        >
                          {submitting ? "posting..." : "post note"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </MorphingPopoverContent>
          </MorphingPopover>
        ) : (
          <button
            onClick={() => signIn("github")}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-200 hover:border-zinc-300 hover:text-zinc-600"
          >
            sign with github
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-2 flex gap-3 overflow-x-auto px-2 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {entries.length === 0 ? (
          <div className="w-full shrink-0 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
            <p className="text-sm text-zinc-500">
              no notes yet. be the first to leave one.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="relative w-[220px] shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50/50 p-4"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={entry.avatar}
                  alt={entry.username}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="text-xs font-medium text-zinc-500">
                  {entry.username}
                </span>
                <span className="ml-auto text-[10px] tabular-nums text-zinc-300">
                  {timeAgo(entry.createdAt)}
                </span>
              </div>
              <p className="relative z-10 mt-2.5 text-sm leading-snug text-zinc-600">
                {entry.message}
              </p>
              {entry.signature ? (
                <img
                  src={entry.signature}
                  alt=""
                  className="pointer-events-none absolute inset-x-3 bottom-2 h-12 object-contain opacity-20 mix-blend-multiply"
                />
              ) : null}
              {entry.signatureText ? (
                <span
                  className="pointer-events-none absolute bottom-2 right-3 rotate-[-4deg] text-base text-zinc-900/25"
                  style={{ fontFamily: "var(--font-handwritten)" }}
                >
                  {entry.signatureText}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>

    </section>
  )
}
