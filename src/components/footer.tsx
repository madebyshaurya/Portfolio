"use client";

const links = [
  { label: "github", href: "https://github.com/madebyshaurya" },
  { label: "x", href: "https://x.com/madebyshaurya" },
  { label: "linkedin", href: "https://linkedin.com/in/shauryaguptaaa" },
  { label: "email", href: "mailto:shaurya50211@gmail.com" },
];

export function Footer() {
  return (
    <div className="sticky z-0 bottom-0 left-0 w-full bg-stone-100 overflow-hidden">
      <div className="relative px-6 sm:px-10 py-8 flex items-end justify-between h-44">
        <div className="flex gap-4 relative z-10">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="press-scale text-xs text-zinc-400 hover:text-zinc-600"
            >
              {link.label}
            </a>
          ))}
        </div>
        <span className="text-xs text-zinc-300 relative z-10">
          &copy; {new Date().getFullYear()}
        </span>

        {/* Big outlined name, half cut off, centered */}
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
