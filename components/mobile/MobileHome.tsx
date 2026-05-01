"use client";

import { useState, useEffect } from "react";

interface MobileHomeProps {
  onOpenDrawer: () => void;
}

export function MobileHome({ onOpenDrawer }: MobileHomeProps) {
  const [phase, setPhase] = useState<"logo" | "begin">("logo");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("begin"), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center board-breathe board-grid">
      {/* Logo — fades in, then scales up and dissolves */}
      <img
        src="/nesos-icon.webp"
        alt="Nesos"
        className="h-24 w-24 object-contain absolute"
        style={{
          opacity: phase === "logo" ? 1 : 0,
          transform: phase === "logo" ? "scale(1)" : "scale(2)",
          transition: "opacity 700ms ease-out, transform 700ms ease-out",
        }}
      />

      {/* BEGIN button — fades in after logo */}
      <button
        onClick={onOpenDrawer}
        className="animate-pulse-soft px-10 py-4 text-sm font-bold tracking-[0.3em] uppercase border-2 transition-opacity duration-700"
        style={{
          fontFamily: "var(--font-aboreto)",
          color: "var(--color-paper-rust)",
          borderColor: "var(--color-paper-rust)",
          opacity: phase === "begin" ? 1 : 0,
          pointerEvents: phase === "begin" ? "auto" : "none",
        }}
      >
        BEGIN
      </button>
    </div>
  );
}
