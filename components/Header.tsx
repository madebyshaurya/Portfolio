"use client";
import { useEffect, useState } from "react";
import BlurFade from "@/components/magicui/blur-fade";
import Image from "next/image";
import { motion } from "framer-motion";

// Image configuration - easily editable
const images = [
  {
    path: "/pfp.jpg",
    width: { desktop: 200, mobile: 400 },
    height: { desktop: 200, mobile: 400 },
    alt: "Apple Park, 2024",
    rotation: -5,
  },
  {
    path: "/pfp2.jpeg",
    width: { desktop: 180, mobile: 300 },
    height: { desktop: 260, mobile: 420 },
    alt: "Tim Cook (Apple CEO), 2024",
    rotation: 3,
  },
  {
    path: "/pfp3.jpeg",
    width: { desktop: 180, mobile: 300 },
    height: { desktop: 260, mobile: 420 },
    alt: "MKBHD (YouTuber), 2024",
    rotation: -2,
  },
];

export default function Header() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-cycle through images with no manual interruption
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-10 ml-auto mr-auto flex flex-col md:flex-row gap-10 items-center">
      {/* Text Introduction */}
      <div>
        <BlurFade delay={0.25}>
          <h1 className="text-left md:text-5xl text-3xl">
            hey! i&apos;m shaurya.
          </h1>
        </BlurFade>
        <BlurFade delay={0.5}>
          <h1 className="text-left md:text-3xl text-md text-gray-400">
            a 15 y/o programmer who likes to build things.
          </h1>
        </BlurFade>
      </div>

      {/* Floating Polaroid Images - No Manual Controls */}
      <div className="relative h-64 w-64 md:h-80 md:w-80">
        {images.map((image, index) => (
          <motion.div
            key={image.path}
            className="absolute origin-center"
            initial={{
              rotate: image.rotation,
              scale: 0.8,
              opacity: 0,
            }}
            animate={{
              rotate: image.rotation,
              scale: index === activeIndex ? 1 : 0.8,
              opacity: index === activeIndex ? 1 : 0,
              zIndex: index === activeIndex ? 10 : 0,
              top: `${index * 5}px`,
              left: `${index * 5}px`,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              opacity: { duration: 0.5 },
            }}
          >
            <div className="bg-white p-3 shadow-lg transform transition-all hover:shadow-xl">
              <Image
                src={image.path}
                alt={image.alt}
                width={image.width.desktop}
                height={image.height.desktop}
                className="w-full h-auto"
                priority
              />
              <div className="mt-2 text-center text-sm text-gray-700 font-handwriting">
                {image.alt}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
