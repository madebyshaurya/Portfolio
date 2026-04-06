"use client"

import gsap from "gsap"
import { motion } from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

interface ProjectItem {
  image: string
  title: string
  description: string
  tag: string
  href: string
}

const projects: ProjectItem[] = [
  {
    image: "/projects/esprit.png",
    title: "Esprit",
    description: "autonomous AI pentesting agents",
    tag: "Current",
    href: "https://esprit.dev",
  },
  {
    image: "/projects/spendsmart.png",
    title: "SpendSmart",
    description: "open-source ios expense tracker — 1.5m+ views on twitter",
    tag: "549 ★",
    href: "https://github.com/madebyshaurya/SpendSmart",
  },
  {
    image: "/projects/fizzix.png",
    title: "Fizzix",
    description: "interactive physics playgrounds — won me a trip to apple park",
    tag: "SSC '24",
    href: "https://github.com/madebyshaurya/Fizzix",
  },
  {
    image: "/projects/aceit.jpeg",
    title: "Ace It",
    description: "ai study flashcards — $5k buildspace grant",
    tag: "Buildspace S5",
    href: "#",
  },
]

const modalAnimation = {
  closed: {
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  },
  enter: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  },
  initial: { scale: 0.95, opacity: 0 },
}

export function ProjectsHoverModal() {
  const [modal, setModal] = useState({ active: false, index: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <section className="relative w-full">
      <h2 className="text-xs text-zinc-400 tracking-wide uppercase mb-5">
        Selected Work
      </h2>
      <div ref={containerRef} className="relative">
        <div className="flex w-full flex-col">
          {projects.map((project, index) => (
            <a
              key={project.title}
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border-t border-zinc-100 py-4 last:border-b transition-colors duration-200"
              onMouseEnter={() => !isMobile && setModal({ active: true, index })}
              onMouseLeave={() => !isMobile && setModal({ active: false, index })}
            >
              {/* Desktop layout */}
              <div className="hidden sm:flex items-baseline justify-between">
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <h3 className="text-base font-medium text-zinc-900 shrink-0">
                    {project.title}
                  </h3>
                  <span className="text-sm text-zinc-400 truncate">
                    {project.description}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 tabular-nums shrink-0 ml-4">
                  {project.tag}
                </span>
              </div>
              {/* Mobile layout */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-zinc-900">
                    {project.title}
                  </h3>
                  <span className="text-xs text-zinc-400 tabular-nums">
                    {project.tag}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  {project.description}
                </p>
              </div>
            </a>
          ))}
        </div>
        {!isMobile && (
          <FollowModal modal={modal} projects={projects} containerRef={containerRef} />
        )}
      </div>
    </section>
  )
}

function FollowModal({
  modal,
  projects,
  containerRef,
}: {
  modal: { active: boolean; index: number }
  projects: ProjectItem[]
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const { active, index } = modal
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!modalRef.current || !containerRef.current) return

    const xMove = gsap.quickTo(modalRef.current, "left", {
      duration: 0.5,
      ease: "power3",
    })
    const yMove = gsap.quickTo(modalRef.current, "top", {
      duration: 0.5,
      ease: "power3",
    })

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      xMove(e.clientX - rect.left + 16)
      yMove(e.clientY - rect.top - 80)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [containerRef])

  return (
    <motion.div
      animate={active ? "enter" : "closed"}
      className="pointer-events-none absolute z-50 overflow-hidden rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      initial="initial"
      ref={modalRef}
      variants={modalAnimation}
      style={{ width: 240, height: 150 }}
    >
      <div
        className="absolute h-full w-full transition-[top] duration-400 ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{ top: `${index * -100}%` }}
      >
        {projects.map((project) => (
          <div className="relative h-full w-full" key={project.title}>
            <Image
              alt={project.title}
              className="object-cover"
              fill
              src={project.image}
              sizes="240px"
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
