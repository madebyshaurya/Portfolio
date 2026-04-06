"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useSession, signIn } from "next-auth/react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface GuestbookEntry {
  id: string
  username: string
  avatar: string
  message: string
  createdAt: string
}

const demoEntries: GuestbookEntry[] = [
  { id: "d1", username: "rauchg", avatar: "https://avatars.githubusercontent.com/rauchg", message: "ship it 🚀", createdAt: "2025-04-01" },
  { id: "d2", username: "shrutikapoor08", avatar: "https://avatars.githubusercontent.com/shrutikapoor08", message: "love seeing young builders ship real stuff!", createdAt: "2025-03-28" },
  { id: "d3", username: "t3dotgg", avatar: "https://avatars.githubusercontent.com/t3dotgg", message: "this portfolio is clean", createdAt: "2025-03-25" },
  { id: "d4", username: "shadcn", avatar: "https://avatars.githubusercontent.com/shadcn", message: "nice design system choices", createdAt: "2025-03-20" },
  { id: "d5", username: "leerob", avatar: "https://avatars.githubusercontent.com/leerob", message: "the mixed font thing is a vibe", createdAt: "2025-03-18" },
  { id: "d6", username: "twostraws", avatar: "https://avatars.githubusercontent.com/twostraws", message: "fizzix was a great SSC entry.", createdAt: "2025-03-15" },
  { id: "d7", username: "dris-e", avatar: "https://avatars.githubusercontent.com/dris-e", message: "15 and shipping like this? respect.", createdAt: "2025-03-10" },
]

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
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [entries, setEntries] = useState<GuestbookEntry[]>(demoEntries)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Fetch real entries
  useEffect(() => {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then((data: GuestbookEntry[]) => {
        if (data.length > 0) {
          setEntries(data)
        }
      })
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
        body: JSON.stringify({ message: message.trim() }),
      })
      if (res.ok) {
        const entry = await res.json()
        setEntries((prev) => [entry, ...prev])
        setMessage("")
      }
    } finally {
      setSubmitting(false)
    }
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
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="leave a note..."
              maxLength={200}
              className="text-xs px-3 py-1.5 rounded-full border border-zinc-200 bg-transparent outline-none focus:border-zinc-300 transition-colors duration-200 w-36 sm:w-48 placeholder:text-zinc-300"
            />
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="text-xs text-zinc-400 px-3 py-1.5 rounded-full border border-zinc-200 transition-colors duration-200 hover:border-zinc-300 hover:text-zinc-600 disabled:opacity-40"
            >
              {submitting ? "..." : "sign"}
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
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="shrink-0 flex flex-col gap-2.5 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 w-[220px]"
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
          </div>
        ))}
      </div>
    </section>
  )
}
