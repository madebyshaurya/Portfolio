"use client";

import { useEffect, useState } from "react";

const BIRTHDAY = new Date(2011, 1, 5); // Feb 5, 2011

function getAge() {
  const ms = Date.now() - BIRTHDAY.getTime();
  return ms / (365.2425 * 24 * 60 * 60 * 1000);
}

export function LiveAge() {
  const [mounted, setMounted] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAge(getAge());
    const id = setInterval(() => setAge(getAge()), 50);
    return () => clearInterval(id);
  }, []);

  const wholeAge = age === null ? "15" : String(Math.floor(age));
  const decimals = mounted && age !== null ? age.toFixed(9).split(".")[1] : "";
  const decimalWidth = `${decimals.length + 1}ch`;

  return (
    <span
      className="inline-flex cursor-default items-baseline text-zinc-900 tabular-nums"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span>{wholeAge}</span>
      <span
        aria-hidden={!mounted}
        className="inline-flex overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          maxWidth: mounted && hovered ? decimalWidth : "0ch",
          opacity: mounted && hovered ? 1 : 0,
          filter: mounted && hovered ? "blur(0px)" : "blur(4px)",
        }}
      >
        <span>.{decimals}</span>
      </span>
    </span>
  );
}
