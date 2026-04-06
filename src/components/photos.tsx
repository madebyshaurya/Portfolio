"use client"

import { useEffect } from "react"
import { ArrowUpRight } from "lucide-react"
import { motion, stagger, useAnimate } from "motion/react"
import { Cursor } from "@/components/motion-primitives/cursor"
import Floating, { FloatingElement } from "@/components/ui/parallax-floating"

const photos = [
  {
    src: "/photos/pfp2.jpeg",
    alt: "Shaurya with Tim Cook",
    label: "apple park",
  },
  {
    src: "/photos/pfp3.jpeg",
    alt: "Shaurya with MKBHD",
    label: "wwdc",
  },
]

export function Photos() {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    animate(
      "img",
      { opacity: [0, 1] },
      { duration: 0.5, delay: stagger(0.12) }
    )
  }, [animate])

  return (
    <div
      ref={scope}
      className="relative h-[360px] w-full overflow-visible sm:h-[420px]"
    >
      <Cursor
        attachToParent
        springConfig={{ stiffness: 180, damping: 22 }}
        variants={{
          initial: { opacity: 0, scale: 0.85 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.85 },
        }}
      >
        <div className="flex items-center gap-1 rounded-full bg-white/92 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-zinc-700 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-sm">
          view
          <ArrowUpRight className="h-3 w-3" />
        </div>
      </Cursor>
      <div className="pointer-events-none absolute inset-x-6 top-6 h-px bg-zinc-100" />
      <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-zinc-100" />
      <Floating sensitivity={-0.55} easingFactor={0.04}>
        <FloatingElement depth={0.8} className="left-[2%] top-[8%] sm:left-[4%]">
          <motion.div
            initial={{ opacity: 0, y: 14, rotate: -7 }}
            animate={{ opacity: 1, y: 0, rotate: -7 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="group relative cursor-pointer"
          >
            <div className="rounded-[2rem] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/5">
              <motion.img
                src={photos[0].src}
                alt={photos[0].alt}
                className="h-[210px] w-[170px] rounded-[1.4rem] object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-[260px] sm:w-[210px]"
              />
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  {photos[0].label}
                </span>
                <span className="text-xs text-zinc-300">2024</span>
              </div>
            </div>
          </motion.div>
        </FloatingElement>

        <FloatingElement depth={1.5} className="left-[44%] top-[18%] sm:left-[56%] sm:top-[12%]">
          <motion.div
            initial={{ opacity: 0, y: 18, rotate: 6 }}
            animate={{ opacity: 1, y: 0, rotate: 6 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="group relative cursor-pointer"
          >
            <div className="rounded-[2rem] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/5">
              <motion.img
                src={photos[1].src}
                alt={photos[1].alt}
                className="h-[220px] w-[170px] rounded-[1.4rem] object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-[270px] sm:w-[210px]"
              />
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  {photos[1].label}
                </span>
                <span className="text-xs text-zinc-300">apple</span>
              </div>
            </div>
          </motion.div>
        </FloatingElement>
      </Floating>
    </div>
  )
}
