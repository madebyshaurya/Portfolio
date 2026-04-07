"use client";

import { useState } from "react";
import { FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { HiOutlineMail } from "react-icons/hi";

const links = [
  {
    label: "github",
    href: "https://github.com/madebyshaurya",
    icon: FaGithub,
    color: "#333",
    glow: "rgba(51,51,51,0.4)",
  },
  {
    label: "x",
    href: "https://x.com/madebyshaurya",
    icon: FaXTwitter,
    color: "#000",
    glow: "rgba(0,0,0,0.35)",
  },
  {
    label: "linkedin",
    href: "https://linkedin.com/in/shauryaguptaaa",
    icon: FaLinkedinIn,
    color: "#0A66C2",
    glow: "rgba(10,102,194,0.4)",
  },
  {
    label: "email",
    href: "mailto:shaurya50211@gmail.com",
    icon: HiOutlineMail,
    color: "#EA4335",
    glow: "rgba(234,67,53,0.4)",
  },
];

function SocialLink({
  link,
}: {
  link: (typeof links)[number];
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="press-scale flex items-center gap-1.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <link.icon
        className="w-3.5 h-3.5"
        style={{
          color: hovered ? link.color : "#a1a1aa",
          filter: hovered ? `drop-shadow(0 0 6px ${link.glow})` : "none",
          transform: hovered ? "scale(1.15)" : "scale(1)",
          transition: "color 200ms cubic-bezier(0.23,1,0.32,1), filter 200ms cubic-bezier(0.23,1,0.32,1), transform 200ms cubic-bezier(0.23,1,0.32,1)",
        }}
      />
      <span
        className="text-xs"
        style={{
          color: hovered ? link.color : "#a1a1aa",
          transition: "color 200ms cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {link.label}
      </span>
    </a>
  );
}

export function Footer() {
  return (
    <div className="sticky z-0 bottom-0 left-0 w-full bg-stone-100 overflow-hidden">
      <div className="relative px-6 sm:px-10 py-8 flex items-end justify-between h-44">
        <div className="flex gap-5 relative z-10">
          {links.map((link) => (
            <SocialLink key={link.label} link={link} />
          ))}
        </div>
        <span className="text-xs text-zinc-300 relative z-10">
          &copy; {new Date().getFullYear()}
        </span>

        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[30%] text-[100px] sm:text-[180px] leading-none font-[family-name:var(--font-geist-pixel-square)] select-none pointer-events-none whitespace-nowrap"
          style={{
            color: "transparent",
            WebkitTextStroke: "1px rgba(0,0,0,0.06)",
          }}
        >
          shaurya
        </span>
      </div>
    </div>
  );
}
