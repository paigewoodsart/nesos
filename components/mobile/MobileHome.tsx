"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

interface MobileHomeProps {
  onOpenDrawer: () => void;
  isLoggedIn: boolean;
}

export function MobileHome({ onOpenDrawer, isLoggedIn }: MobileHomeProps) {
  const [phase, setPhase] = useState<"logo" | "begin">("logo");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("begin"), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center board-breathe board-grid relative overflow-hidden">

      {/* Phase 1: N logo */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          opacity: phase === "logo" ? 1 : 0,
          transform: phase === "logo" ? "scale(1)" : "scale(2.5)",
          transition: "opacity 800ms ease-out, transform 800ms ease-out",
          pointerEvents: "none",
        }}
      >
        <img src="/nesos-icon.webp" alt="Nesos" className="h-40 w-40 object-contain" />
      </div>

      {/* Phase 2: NESOS + tagline + action buttons */}
      <div
        className="absolute flex flex-col items-center gap-5"
        style={{
          opacity: phase === "begin" ? 1 : 0,
          transition: "opacity 800ms ease-in",
        }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <h1
            className="text-5xl font-bold tracking-[0.12em]"
            style={{ fontFamily: "var(--font-aboreto)", color: "#1a759f" }}
          >
            NESOS
          </h1>
          <p
            className="text-[10px] tracking-[0.28em] uppercase"
            style={{ fontFamily: "var(--font-body)", color: "#1a759f", opacity: 0.65 }}
          >
            Your work, your rhythm, your island.
          </p>
        </div>

        {isLoggedIn ? (
          <button
            onClick={onOpenDrawer}
            className="mt-2 px-12 py-3.5 text-[11px] tracking-[0.3em] uppercase"
            style={{
              fontFamily: "var(--font-body)",
              color: "#1a759f",
              border: "1px solid rgba(26,96,145,0.4)",
            }}
          >
            PLAN
          </button>
        ) : (
          <div className="mt-2 flex flex-col items-center gap-3">
            <button
              onClick={() => signIn("google")}
              className="px-10 py-3.5 text-[11px] tracking-[0.3em] uppercase text-white"
              style={{
                fontFamily: "var(--font-body)",
                backgroundColor: "#1a759f",
              }}
            >
              Sign in with Google
            </button>
            <button
              onClick={onOpenDrawer}
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-body)", color: "#1a759f", opacity: 0.6 }}
            >
              Continue without account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
