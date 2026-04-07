"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import SignaturePad from "signature_pad"
import confetti from "canvas-confetti"
import { ChevronLeft, ChevronRight, PenLine, Type, Upload, RotateCcw, X, Trash2 } from "lucide-react"
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
  canManage?: boolean
  signature?: string
  signatureText?: string
}

type SignatureMode = "draw" | "type" | "upload"
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
  const composerAnchorRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)

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
  const [composerPosition, setComposerPosition] = useState({ top: 0, left: 0 })
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetch("/api/guestbook")
      .then(async (r) => {
        const data = await r.json().catch(() => [])
        if (!r.ok || !Array.isArray(data)) {
          return []
        }
        return data as GuestbookEntry[]
      })
      .then((data) => setEntries(data))
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

  const syncSignatureFromPad = useCallback(() => {
    const pad = signaturePadRef.current
    if (!pad) return
    setSignature(pad.isEmpty() ? "" : pad.toDataURL("image/png"))
  }, [])

  const setupSignaturePad = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const previousData = signaturePadRef.current?.toData() ?? null
    const dpr = Math.max(window.devicePixelRatio || 1, 1)

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const pad = new SignaturePad(canvas, {
      minWidth: 0.8,
      maxWidth: 2.1,
      penColor: "rgba(24,24,27,0.92)",
      velocityFilterWeight: 0.65,
      throttle: 12,
    })

    if (previousData && previousData.length > 0) {
      pad.fromData(previousData)
    }

    pad.addEventListener("endStroke", syncSignatureFromPad)
    signaturePadRef.current = pad
    syncSignatureFromPad()
  }, [syncSignatureFromPad])

  useEffect(() => {
    if (!showComposer || signatureMode !== "draw") return
    setupSignaturePad()

    const handleResize = () => setupSignaturePad()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [showComposer, signatureMode, setupSignaturePad])

  useEffect(() => {
    if (!showComposer || !composerAnchorRef.current) return

    const updatePosition = () => {
      const rect = composerAnchorRef.current?.getBoundingClientRect()
      if (!rect) return

      const width = composerStep === "compose" ? 384 : 420
      const estimatedHeight = composerStep === "compose" ? 330 : 300
      const left = Math.min(
        Math.max(16, rect.right - width),
        window.innerWidth - width - 16
      )
      const top = Math.min(rect.bottom + 10, window.innerHeight - estimatedHeight - 16)

      setComposerPosition({
        top: Math.max(16, top),
        left,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, { passive: true })

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition)
    }
  }, [showComposer, composerStep])

  const clearSignature = () => {
    signaturePadRef.current?.clear()
    setSignature("")
    setTypedSignature("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const undoSignature = () => {
    const pad = signaturePadRef.current
    if (!pad) return
    const data = pad.toData()
    if (data.length === 0) return
    data.pop()
    pad.fromData(data)
    syncSignatureFromPad()
  }

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setSignature(result)
    }
    reader.readAsDataURL(file)
  }

  const closeComposer = () => {
    setShowComposer(false)
    setComposerStep("compose")
    setErrorMessage("")
  }

  const resetComposer = () => {
    setMessage("")
    clearSignature()
    setSignatureMode("draw")
    setComposerStep("compose")
    setErrorMessage("")
  }

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" })
  }

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return

    setSubmitting(true)
    setErrorMessage("")
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          signature:
            signatureMode === "draw" || signatureMode === "upload"
              ? signature || undefined
              : undefined,
          signatureText:
            signatureMode === "type" ? typedSignature.trim() || undefined : undefined,
        }),
      })

      if (res.ok) {
        const entry = await res.json()
        setEntries((prev) => [{ ...entry, canManage: true }, ...prev])
        resetComposer()
        setShowComposer(false)
        scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" })
        void fetch("/api/guestbook", { cache: "no-store" })
          .then((r) => r.json())
          .then((data: GuestbookEntry[]) => setEntries(data))
          .catch(() => {})

        const confettiPalette = ["#18181b", "#52525b", "#a1a1aa", "#e4e4e7"]
        confetti({
          particleCount: 28,
          spread: 60,
          startVelocity: 24,
          gravity: 0.9,
          scalar: 0.78,
          ticks: 180,
          origin: { x: 0.34, y: 0.3 },
          colors: confettiPalette,
          shapes: ["circle"],
        })
        confetti({
          particleCount: 28,
          spread: 60,
          startVelocity: 24,
          gravity: 0.9,
          scalar: 0.78,
          ticks: 180,
          origin: { x: 0.66, y: 0.3 },
          colors: confettiPalette,
          shapes: ["circle"],
        })
        confetti({
          particleCount: 16,
          spread: 44,
          startVelocity: 18,
          gravity: 1.04,
          scalar: 0.62,
          ticks: 150,
          origin: { x: 0.5, y: 0.2 },
          colors: ["#18181b", "#d4d4d8", "#fafafa"],
          shapes: ["square"],
        })
      } else {
        const data = await res.json().catch(() => null)
        setErrorMessage(data?.error || "Couldn’t post note.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const canPreview =
    message.trim().length > 0 &&
    (signatureMode === "type"
      ? typedSignature.trim().length > 0
      : signature.length > 0)

  const handleDelete = async (entry: GuestbookEntry) => {
    if (!window.confirm("Delete this guestbook note?")) return

    try {
      const res = await fetch("/api/guestbook", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        window.alert(data?.error || "Couldn’t delete note.")
        return
      }

      setEntries((prev) => prev.filter((item) => item.id !== entry.id))
    } catch {
      window.alert("Couldn’t delete note.")
    }
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs uppercase tracking-wide text-zinc-400">
              Guestbook
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="press-scale flex h-8 w-8 items-center justify-center rounded-md text-zinc-300 hover:text-zinc-500 disabled:cursor-default disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="press-scale flex h-8 w-8 items-center justify-center rounded-md text-zinc-300 hover:text-zinc-500 disabled:cursor-default disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {session?.user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              title="sign out"
              className="press-scale inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50/70 py-1 pl-1 pr-2.5 text-[11px] text-zinc-400 hover:border-zinc-300 hover:bg-white hover:text-zinc-600"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "you"}
                  width={20}
                  height={20}
                  className="rounded-full ring-1 ring-black/[0.04]"
                />
              ) : null}
              sign out
            </button>
          ) : null}
        </div>

        {session ? (
          <MorphingPopover
            open={showComposer}
            onOpenChange={setShowComposer}
            className="justify-end"
          >
            <div ref={composerAnchorRef} className="flex items-center gap-2">
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
                className="w-40 rounded-full border border-zinc-200 bg-white/95 px-4 py-2 text-sm text-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-colors duration-200 placeholder:text-zinc-400 focus:border-zinc-300 sm:w-52"
              />
              <MorphingPopoverTrigger
                disabled={!message.trim()}
                className="press-scale rounded-full border border-zinc-200 bg-white/95 px-4 py-2 text-sm text-zinc-600 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:border-zinc-300 hover:text-zinc-800 disabled:opacity-40"
              >
                sign
              </MorphingPopoverTrigger>
            </div>

            <MorphingPopoverContent
              className={`fixed z-[80] rounded-[24px] border-zinc-200/90 bg-white/96 p-0 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl ${
                composerStep === "compose"
                  ? "w-[min(24rem,calc(100vw-2rem))]"
                  : "w-[min(26.25rem,calc(100vw-2rem))]"
              }`}
              style={{
                top: composerPosition.top,
                left: composerPosition.left,
              }}
            >
              <div className="relative overflow-hidden rounded-[24px]">
                <ProgressiveBlur
                  direction="bottom"
                  blurIntensity={0.4}
                  blurLayers={8}
                  className="absolute inset-0 z-0"
                />

                <div className="relative z-10 p-5">
                  {errorMessage ? (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
                    >
                      {errorMessage}
                    </div>
                  ) : null}

                  {composerStep === "compose" ? (
                    <>
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-[15px] font-medium text-zinc-900">
                            sign the guestbook
                          </h3>
                          <p className="mt-1 text-xs text-zinc-400">
                            draw, type, or import a signature.
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
                        <div className="flex items-center gap-3">
                          {signatureMode === "draw" ? (
                            <button
                              onClick={undoSignature}
                              className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-600"
                            >
                              <RotateCcw className="h-3 w-3" />
                              undo
                            </button>
                          ) : null}
                          <button
                            onClick={clearSignature}
                            className="text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-600"
                          >
                            clear
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1">
                        <button
                          onClick={() => setSignatureMode("draw")}
                          className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-150 ${
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
                          className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-150 ${
                            signatureMode === "type"
                              ? "bg-white text-zinc-900 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-600"
                          }`}
                        >
                          <Type className="h-3.5 w-3.5" />
                          type
                        </button>
                        <button
                          onClick={() => setSignatureMode("upload")}
                          className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-150 ${
                            signatureMode === "upload"
                              ? "bg-white text-zinc-900 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-600"
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          import
                        </button>
                      </div>

                      {signatureMode === "draw" ? (
                        <div className="mt-4 overflow-hidden rounded-[20px] border border-zinc-200 bg-white">
                          <div className="border-b border-zinc-100 bg-[linear-gradient(to_bottom,transparent_95%,rgba(0,0,0,0.03)_95%)] bg-[length:100%_24px] px-4 py-2">
                            <canvas
                              ref={canvasRef}
                              className="h-24 w-full touch-none"
                            />
                          </div>
                        </div>
                      ) : null}

                      {signatureMode === "type" ? (
                        <div className="mt-4 rounded-[20px] border border-zinc-200 bg-white px-4 py-3">
                          <input
                            type="text"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            placeholder="type your signature"
                            maxLength={48}
                            className="w-full border-0 bg-transparent text-[1.7rem] text-zinc-900 outline-none placeholder:text-zinc-300"
                            style={{ fontFamily: "var(--font-handwritten)" }}
                          />
                        </div>
                      ) : null}

                      {signatureMode === "upload" ? (
                        <div className="mt-4 rounded-[20px] border border-dashed border-zinc-200 bg-zinc-50/70 p-4">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleSignatureUpload}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex min-h-24 w-full flex-col items-center justify-center rounded-[16px] border border-zinc-200 bg-white px-4 py-5 text-center transition-colors duration-150 hover:border-zinc-300"
                          >
                            {signature ? (
                              <img
                                src={signature}
                                alt="Uploaded signature preview"
                                className="max-h-14 w-auto object-contain"
                              />
                            ) : (
                              <>
                                <Upload className="h-4 w-4 text-zinc-400" />
                                <span className="mt-2 text-xs text-zinc-500">
                                  import a signature photo or scan
                                </span>
                                <span className="mt-1 text-[11px] text-zinc-300">
                                  png, jpg, or heic screenshot
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : null}

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={closeComposer}
                          className="press-scale rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
                        >
                          cancel
                        </button>
                        <button
                          onClick={() => setComposerStep("preview")}
                          disabled={!canPreview}
                          className="press-scale rounded-full bg-zinc-950 px-4 py-2 text-xs text-white disabled:opacity-40"
                        >
                          done
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-[15px] font-medium text-zinc-900">
                            preview note
                          </h3>
                          <p className="mt-1 text-xs text-zinc-400">
                            post it or go back to tweak it.
                          </p>
                        </div>
                        <button
                          onClick={closeComposer}
                          className="rounded-full p-1.5 text-zinc-300 transition-colors duration-150 hover:text-zinc-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <Tilt rotationFactor={4} springOptions={{ stiffness: 180, damping: 20 }}>
                        <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_4px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center gap-2">
                            {session?.user?.image ? (
                              <Image
                                src={session.user.image}
                                alt={session.user.name ?? "you"}
                                width={20}
                                height={20}
                                className="rounded-full"
                              />
                            ) : null}
                            <span className="text-xs font-medium text-zinc-500">
                              {session?.user?.name ?? "you"}
                            </span>
                          </div>
                          <p className="relative z-10 mt-3 text-sm leading-relaxed text-zinc-700">
                            {message}
                          </p>
                          {(signatureMode === "draw" || signatureMode === "upload") && signature ? (
                            <img
                              src={signature}
                              alt=""
                              className="pointer-events-none absolute inset-x-4 bottom-3 h-12 object-contain opacity-20 mix-blend-multiply"
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

                      <div className="mt-4 flex justify-between gap-2">
                        <button
                          onClick={() => setComposerStep("compose")}
                          className="press-scale rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
                        >
                          back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="press-scale rounded-full bg-zinc-950 px-4 py-2 text-xs text-white disabled:opacity-50"
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
            className="press-scale rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
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
              className="relative w-[300px] shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Image
                    src={entry.avatar}
                    alt={entry.username}
                    width={28}
                    height={28}
                    className="rounded-full ring-1 ring-black/[0.04]"
                  />
                  <span className="truncate text-sm font-medium text-zinc-600">
                    {entry.username}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] tabular-nums text-zinc-300">
                    {timeAgo(entry.createdAt)}
                  </span>
                  {entry.canManage ? (
                    <button
                      onClick={() => void handleDelete(entry)}
                      className="press-scale inline-flex min-h-8 items-center gap-1 rounded-full border border-zinc-200 bg-white/80 px-2.5 text-[11px] text-zinc-400 hover:border-red-200 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                      delete
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="relative z-10 mt-4 text-[15px] leading-snug text-zinc-600">
                {entry.message}
              </p>
              {entry.signature ? (
                <img
                  src={entry.signature}
                  alt=""
                  className="pointer-events-none absolute inset-x-4 bottom-3 h-16 object-contain opacity-20 mix-blend-multiply"
                />
              ) : null}
              {entry.signatureText ? (
                <span
                  className="pointer-events-none absolute bottom-3 right-4 rotate-[-4deg] text-xl text-zinc-900/25"
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
