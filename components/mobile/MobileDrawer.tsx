"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

type MobileScreen = string;

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  screen: MobileScreen;
  onNavigate: (s: MobileScreen) => void;
}

const NAVY = "#1e6091";

export function MobileDrawer({ open, onClose, screen, onNavigate }: MobileDrawerProps) {
  const { data: session } = useSession();

  const go = (s: MobileScreen) => { onNavigate(s); };

  const navItem = (label: string, key: MobileScreen) => {
    const active = screen === key || (key === "projects" && screen.startsWith("project:"));
    return (
      <button
        onClick={() => go(key)}
        className="w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors active:bg-paper-warm/40"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 border"
          style={{
            backgroundColor: active ? NAVY : "transparent",
            borderColor: active ? NAVY : "rgba(26,26,26,0.22)",
          }}
        />
        <span
          className="text-xs uppercase tracking-[0.22em] font-bold"
          style={{ fontFamily: "var(--font-body)", color: active ? NAVY : "rgba(26,26,26,0.75)" }}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-paper-ink/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full backdrop-blur-xl shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ width: "78vw", maxWidth: 320, backgroundColor: "rgba(249,248,246,0.22)", borderLeft: "1px solid rgba(213,211,207,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-10 pb-5 border-b border-paper-line/40">
          <div className="flex items-start gap-3">
            <img src="/nesos-icon.webp" alt="Nesos" className="h-12 w-12 object-contain flex-shrink-0 mt-0.5" />
            <div>
              <h2
                className="text-2xl font-bold tracking-tight leading-none"
                style={{ fontFamily: "var(--font-aboreto)", color: NAVY }}
              >
                NESOS
              </h2>
              <p className="text-[11px] tracking-[0.18em] text-paper-ink-light mt-1" style={{ fontFamily: "var(--font-body)" }}>
                νῆσος · ne·sos
              </p>
              <p className="text-[10px] italic text-paper-ink-light/70 mt-1" style={{ fontFamily: "var(--font-serif)" }}>
                Your work. Your rhythm. Your island.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-paper-ink-light hover:text-paper-ink text-lg mt-1">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {navItem("This Week", "thisweek")}
          {navItem("Notes", "braindump")}
          {navItem("Goals", "goals")}
          {navItem("Projects", "projects")}
          {navItem("Archive", "archive")}

        </div>

        {/* Spotify brain music */}
        <a
          href="https://open.spotify.com/playlist/1DS3PGYtl7dV8YGTXfbPRt"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors active:bg-paper-warm/40"
        >
          <img src="/spotify-logo.webp" alt="Spotify" className="w-4 h-4 object-contain flex-shrink-0" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
          <span className="text-xs uppercase tracking-[0.22em] font-bold" style={{ fontFamily: "var(--font-body)", color: "rgba(26,26,26,0.75)" }}>
            Brain Music
          </span>
        </a>

        {/* Auth */}
        <div className="flex-shrink-0 border-t border-paper-line/30 px-6 py-3">
          {session ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-paper-ink-light truncate" style={{ fontFamily: "var(--font-serif)" }}>
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-[10px] text-paper-ink-light underline underline-offset-2 ml-3 flex-shrink-0"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="w-full text-xs py-2 border border-paper-ink/20 text-paper-ink-light hover:text-paper-ink transition-colors"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Sign in with Google
            </button>
          )}
        </div>

        {/* Beta note */}
        <div className="flex-shrink-0 border-t border-paper-line/20 px-6 py-2.5">
          <p className="text-[10px] text-paper-ink-light text-center" style={{ fontFamily: "var(--font-body)" }}>
            beta —{" "}
            <a href="mailto:nesosplanner@gmail.com" className="underline underline-offset-2">
              nesosplanner@gmail.com
            </a>
          </p>
        </div>

        {/* Privacy policy */}
        <div className="flex-shrink-0 border-t border-paper-line/20 px-6 py-2.5 text-center">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-paper-ink-light underline underline-offset-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Privacy Policy
          </a>
        </div>

        {/* Footer credit */}
        <div className="flex-shrink-0 border-t border-paper-line/30 px-6 py-4 flex items-center gap-3">
          <img src="/nesos-icon.webp" alt="Nesos" className="h-7 w-7 object-contain opacity-60 flex-shrink-0" />
          <p className="text-[10px] text-paper-ink-light leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
            created with love by{" "}
            <a
              href="https://www.paigewoods.art"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-paper-ink transition-colors"
            >
              Paige Woods
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
