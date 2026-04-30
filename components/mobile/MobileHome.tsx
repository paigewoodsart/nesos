"use client";

import type { Client } from "@/types";

interface MobileHomeProps {
  onOpenDrawer: () => void;
  onNavigate: (screen: string) => void;
  clients: Client[];
}

const NAVY = "#1e6091";
const RASPBERRY = "#D4909E";

export function MobileHome({ onOpenDrawer, onNavigate, clients }: MobileHomeProps) {
  const navItem = (label: string, screen: string) => (
    <button
      key={screen}
      onClick={() => onNavigate(screen)}
      className="w-full flex items-center gap-4 px-6 py-4 text-left border-b border-paper-line/30 active:bg-paper-warm/40 transition-colors"
    >
      <span className="w-2 h-2 rounded-full border flex-shrink-0" style={{ borderColor: "rgba(26,26,26,0.22)" }} />
      <span className="text-xs uppercase tracking-[0.22em] font-bold" style={{ fontFamily: "var(--font-body)", color: "rgba(26,26,26,0.75)" }}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="h-screen flex flex-col bg-paper-cream">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 flex-shrink-0">
        <img src="/nesos-icon.webp" alt="Nesos" className="h-10 w-10 object-contain" />
        <button onClick={onOpenDrawer} className="w-11 h-11 flex items-center justify-center" aria-label="Open menu">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <rect y="0" width="22" height="2.2" rx="1.1" fill="rgba(26,26,26,0.4)"/>
            <rect y="7" width="22" height="2.2" rx="1.1" fill="rgba(26,26,26,0.4)"/>
            <rect y="14" width="22" height="2.2" rx="1.1" fill="rgba(26,26,26,0.4)"/>
          </svg>
        </button>
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto mobile-scroll">
        <div className="border-t border-paper-line/30">
          {navItem("This Week", "thisweek")}
          {navItem("Brain Dump", "braindump")}
          {navItem("Goals", "goals")}

          {/* Projects */}
          <div className="border-b border-paper-line/30">
            <div className="flex items-center gap-4 px-6 py-4">
              <span className="w-2 h-2 rounded-full border flex-shrink-0" style={{ borderColor: "rgba(26,26,26,0.22)" }} />
              <span className="text-xs uppercase tracking-[0.22em] font-bold" style={{ fontFamily: "var(--font-body)", color: "rgba(26,26,26,0.75)" }}>
                Projects
              </span>
            </div>
            <div className="pl-12 pr-6 pb-3 space-y-0.5">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onNavigate(`project:${c.id}`)}
                  className="w-full flex items-center gap-3 py-2.5 text-left active:opacity-60 transition-opacity"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-sm" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}>{c.name}</span>
                </button>
              ))}
              <button
                onClick={() => onNavigate("addproject")}
                className="w-full flex items-center gap-2 py-2 text-left mt-1"
              >
                <span className="text-sm font-bold" style={{ color: RASPBERRY }}>+</span>
                <span className="text-xs text-paper-ink-light uppercase tracking-wider" style={{ fontFamily: "var(--font-body)" }}>Add project</span>
              </button>
            </div>
          </div>

          {navItem("Archive", "archive")}
          {navItem("Calendar", "calendar-week")}
        </div>
      </div>
    </div>
  );
}
