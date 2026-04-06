"use client";

import { useEffect, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "motion/react";
import { Footer } from "@/components/footer";
import { MixedFontName } from "@/components/mixed-font-name";
import { Presence } from "@/components/presence";
import { Photos } from "@/components/photos";
import { Guestbook } from "@/components/guestbook";
import { ProjectsHoverModal } from "@/components/ui/services-with-animated-hover-modal";
import { LinkPreview } from "@/components/ui/link-preview";
import { LiveClock } from "@/components/live-clock";
import { TextHighlighter } from "@/components/fancy/text/text-highlighter";
import TextRotate from "@/components/fancy/text/text-rotate";
import PixelateSvgFilter from "@/components/fancy/filter/pixelate-svg-filter";
import { motion } from "motion/react";

const quotes = [
  { text: "the best way to predict the future is to build it.", author: "alan kay" },
  { text: "stay hungry, stay foolish.", author: "steve jobs" },
  { text: "move fast and break things.", author: "mark zuckerberg" },
  { text: "the people who are crazy enough to think they can change the world are the ones who do.", author: "steve jobs" },
  { text: "make something people want.", author: "paul graham" },
  { text: "done is better than perfect.", author: "sheryl sandberg" },
  { text: "if you're not embarrassed by the first version, you shipped too late.", author: "reid hoffman" },
];

function RotatingQuotes() {
  return (
    <div className="space-y-2">
      <div
        className="text-lg sm:text-xl text-zinc-300 italic h-[3.5em] sm:h-[2.5em] flex items-start"
        style={{ fontFamily: "var(--font-editorial)" }}
      >
        <span className="mr-1">&ldquo;</span>
        <TextRotate
          texts={quotes.map((q) => q.text)}
          rotationInterval={4000}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ type: "spring", duration: 0.6, bounce: 0 }}
          staggerDuration={0.02}
          splitBy="words"
        />
      </div>
      <div className="h-5 overflow-hidden">
        <TextRotate
          texts={quotes.map((q) => `— ${q.author}`)}
          rotationInterval={4000}
          mainClassName="text-xs text-zinc-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

const stagger = (i: number) => ({
  initial: { opacity: 0, transform: "translateY(6px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: {
    delay: 0.1 + i * 0.08,
    duration: 0.5,
    ease: [0.23, 1, 0.32, 1] as const,
  },
});

export default function Home() {
  const pixelSize = useMotionValue(12);
  const [size, setSize] = useState(12);
  const [isAnimating, setIsAnimating] = useState(true);

  useMotionValueEvent(pixelSize, "change", (latest) => {
    setSize(latest);
  });

  useEffect(() => {
    const controls = animate(pixelSize, 1, {
      duration: 1,
      ease: "easeOut",
      onComplete: () => setIsAnimating(false),
    });
    return controls.stop;
  }, [pixelSize]);

  return (
    <div className="bg-stone-100">
      {isAnimating && (
        <PixelateSvgFilter id="page-pixelate" size={size} />
      )}

      {/* White card — sits above the sticky footer */}
      <div className="relative z-10 p-3 sm:p-6">
        <div
          className="w-full rounded-2xl sm:rounded-3xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] flex flex-col"
          style={{
            filter: isAnimating ? "url(#page-pixelate)" : undefined,
          }}
        >
        <div className="flex-1 px-6 sm:px-10 py-12 sm:py-16 max-w-2xl">
          {/* Name + presence */}
          <motion.div {...stagger(0)}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <h1 className="text-4xl sm:text-5xl tracking-tight text-zinc-900 leading-[1.1]">
                <MixedFontName name="Shaurya Gupta" />
              </h1>
              <div className="sm:mt-2 shrink-0">
                <Presence />
              </div>
            </div>
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-md">
              15, toronto. i build ios apps and ship things on the internet.
              started coding at 9. been at it for a while.
            </p>
          </motion.div>

          {/* Live clock */}
          <motion.div className="mt-5" {...stagger(1)}>
            <LiveClock />
          </motion.div>

          <div className="mt-10 mb-8 h-px bg-zinc-100" />

          {/* Photos */}
          <motion.section {...stagger(2)}>
            <Photos />
          </motion.section>

          <div className="mt-10 mb-8 h-px bg-zinc-100" />

          {/* Guestbook */}
          <motion.section {...stagger(3)}>
            <Guestbook />
          </motion.section>

          <div className="mt-10 mb-8 h-px bg-zinc-100" />

          {/* Projects */}
          <motion.section {...stagger(4)}>
            <ProjectsHoverModal />
          </motion.section>

          <div className="mt-10 mb-8 h-px bg-zinc-100" />

          {/* A few things */}
          <motion.section {...stagger(5)}>
            <h2 className="text-xs text-zinc-400 tracking-wide uppercase mb-5">
              A few things
            </h2>
            <ul className="space-y-3 text-sm text-zinc-500 leading-relaxed">
              <li>
                — won the{" "}
                <LinkPreview
                  url="https://developer.apple.com/swift-student-challenge/"
                  className="inline"
                >
                  <TextHighlighter
                    triggerType="hover"
                    direction="ltr"
                    className="cursor-pointer text-zinc-900"
                    highlightColor="#e2e8f0"
                    transition={{ type: "spring", duration: 0.6, bounce: 0 }}
                  >
                    swift student challenge
                  </TextHighlighter>
                </LinkPreview>{" "}
                at 13. got invited to wwdc. met tim cook at apple park.
              </li>
              <li>
                — got the{" "}
                <LinkPreview
                  url="https://buildspace.so"
                  className="inline"
                >
                  <TextHighlighter
                    triggerType="hover"
                    direction="ltr"
                    className="cursor-pointer text-zinc-900"
                    highlightColor="#e2e8f0"
                    transition={{ type: "spring", duration: 0.6, bounce: 0 }}
                  >
                    buildspace s5
                  </TextHighlighter>
                </LinkPreview>{" "}
                grant. $5k for ace it.
              </li>
              <li>
                —{" "}
                <LinkPreview
                  url="https://github.com/madebyshaurya/SpendSmart"
                  className="inline"
                >
                  <TextHighlighter
                    triggerType="hover"
                    direction="ltr"
                    className="cursor-pointer text-zinc-900"
                    highlightColor="#e2e8f0"
                    transition={{ type: "spring", duration: 0.6, bounce: 0 }}
                  >
                    spendsmart
                  </TextHighlighter>
                </LinkPreview>{" "}
                got 1.5m+ views on twitter. 549 stars on github.
              </li>
              <li>
                — been to apple park, a bunch of hackathons, and one yc event.
              </li>
              <li>
                — also do robotics, hardware (arduino, pcb design), and 3d
                modeling.
              </li>
            </ul>
          </motion.section>

          <div className="mt-10 mb-8 h-px bg-zinc-100" />

          {/* Rotating quotes */}
          <motion.section {...stagger(6)}>
            <RotatingQuotes />
          </motion.section>
        </div>
        </div>
      </div>

      {/* Sticky footer — reveals as you scroll past the card */}
      <Footer />
    </div>
  );
}
