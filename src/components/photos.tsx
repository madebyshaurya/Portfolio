"use client"

import { useEffect } from "react"
import { motion, stagger, useAnimate } from "motion/react"
import Floating, { FloatingElement } from "@/components/ui/parallax-floating"

const photos = [
  { src: "/photos/pfp3.jpeg", alt: "at Apple Park" },
  { src: "/photos/ssc.jpeg", alt: "Swift Student Challenge" },
  { src: "/photos/pfp2.jpeg", alt: "me" },
  { src: "/photos/screenshot.jpeg", alt: "hackathon" },
  { src: "/photos/fizzix.png", alt: "Fizzix app" },
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
      className="relative w-full h-[320px] sm:h-[380px] rounded-xl overflow-hidden bg-stone-50"
    >
      <Floating sensitivity={-0.5} easingFactor={0.04}>
        <FloatingElement depth={0.5} className="top-[5%] left-[3%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={photos[0].src}
            alt={photos[0].alt}
            className="w-28 h-36 sm:w-36 sm:h-44 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
          />
        </FloatingElement>
        <FloatingElement depth={1.5} className="top-[8%] left-[30%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={photos[1].src}
            alt={photos[1].alt}
            className="w-32 h-24 sm:w-44 sm:h-32 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[2%] left-[62%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={photos[2].src}
            alt={photos[2].alt}
            className="w-24 h-32 sm:w-32 sm:h-40 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
          />
        </FloatingElement>
        <FloatingElement depth={2} className="top-[50%] left-[8%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={photos[3].src}
            alt={photos[3].alt}
            className="w-36 h-24 sm:w-48 sm:h-32 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
          />
        </FloatingElement>
        <FloatingElement depth={0.8} className="top-[45%] left-[55%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={photos[4].src}
            alt={photos[4].alt}
            className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
          />
        </FloatingElement>
      </Floating>
    </div>
  )
}
