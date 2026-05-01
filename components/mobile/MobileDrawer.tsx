"use client";

import { useState } from "react";
import type { Client } from "@/types";

type MobileScreen = string;

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  screen: MobileScreen;
  onNavigate: (s: MobileScreen) => void;
  clients: Client[];
  onAddClient: (name: string, color: string) => void;
}

const CLIENT_COLORS = [
  "#d9ed92","#99d98c","#52b69a","#34a0a4",
  "#168aad","#1a759f","#1e6091","#184e77",
];

const NAVY = "#1e6091";
const RASPBERRY = "#D4909E";

export function MobileDrawer({ open, onClose, screen, onNavigate, clients, onAddClient }: MobileDrawerProps) {
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(CLIENT_COLORS[0]);

  const go = (s: MobileScreen) => { onNavigate(s); };

  const commitAdd = () => {
    if (!newName.trim()) return;
    onAddClient(newName.trim(), newColor);
    setNewName("");
    setNewColor(CLIENT_COLORS[0]);
    setAddingProject(false);
  };

  const navItem = (label: string, key: MobileScreen) => {
    const active = screen === key;
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
        className={`fixed top-0 right-0 z-50 h-full bg-paper-cream shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ width: "78vw", maxWidth: 320 }}
      >
        {/* Header: NESOS title + favicon + close */}
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
          {navItem("Brain Dump", "braindump")}
          {navItem("Goals", "goals")}

          {/* Projects accordion */}
          <div>
            <button
              onClick={() => setProjectsOpen((v) => !v)}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors active:bg-paper-warm/40"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 border"
                style={{
                  backgroundColor: screen.startsWith("project:") ? NAVY : "transparent",
                  borderColor: screen.startsWith("project:") ? NAVY : "rgba(26,26,26,0.22)",
                }}
              />
              <span className="text-xs uppercase tracking-[0.22em] font-bold flex-1"
                style={{ fontFamily: "var(--font-body)", color: screen.startsWith("project:") ? NAVY : "rgba(26,26,26,0.75)" }}>
                Projects
              </span>
              <span className="text-[10px] text-paper-ink-light">{projectsOpen ? "∧" : "∨"}</span>
            </button>

            {projectsOpen && (
              <div className="pl-12 pr-6 pb-2 space-y-0.5">
                {!addingProject ? (
                  <button onClick={() => setAddingProject(true)} className="w-full flex items-center gap-2 py-2 text-left">
                    <span className="text-sm font-bold" style={{ color: RASPBERRY }}>+</span>
                    <span className="text-xs text-paper-ink-light uppercase tracking-wider" style={{ fontFamily: "var(--font-body)" }}>Add</span>
                  </button>
                ) : (
                  <div className="py-2 space-y-2">
                    <input
                      autoFocus value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitAdd(); if (e.key === "Escape") setAddingProject(false); }}
                      placeholder="Project name..."
                      className="w-full text-xs bg-transparent border-b border-paper-line outline-none pb-1 text-paper-ink"
                      style={{ fontFamily: "var(--font-serif)" }}
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {CLIENT_COLORS.map((c) => (
                        <button key={c} onClick={() => setNewColor(c)}
                          className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                          style={{ backgroundColor: c, outline: c === newColor ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={commitAdd} className="text-xs px-2 py-1 text-white" style={{ backgroundColor: newColor }}>Add</button>
                      <button onClick={() => setAddingProject(false)} className="text-xs text-paper-ink-light">Cancel</button>
                    </div>
                  </div>
                )}

                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => go(`project:${c.id}`)}
                    className="w-full flex items-center gap-3 py-2 text-left active:opacity-60 transition-opacity"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span
                      className="text-sm truncate"
                      style={{
                        fontFamily: "var(--font-serif)",
                        color: screen === `project:${c.id}` ? NAVY : "#1A1A1A",
                        fontWeight: screen === `project:${c.id}` ? 600 : 400,
                      }}
                    >
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {navItem("Archive", "archive")}

          {/* Calendar accordion */}
          <div>
            <button
              onClick={() => setCalendarOpen((v) => !v)}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors active:bg-paper-warm/40"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 border"
                style={{
                  backgroundColor: screen.startsWith("calendar") ? NAVY : "transparent",
                  borderColor: screen.startsWith("calendar") ? NAVY : "rgba(26,26,26,0.22)",
                }}
              />
              <span className="text-xs uppercase tracking-[0.22em] font-bold flex-1"
                style={{ fontFamily: "var(--font-body)", color: screen.startsWith("calendar") ? NAVY : "rgba(26,26,26,0.75)" }}>
                Calendar
              </span>
              <span className="text-[10px] text-paper-ink-light">{calendarOpen ? "∧" : "∨"}</span>
            </button>
            {calendarOpen && (
              <div className="pl-12 pr-6 pb-2 space-y-0.5">
                <button onClick={() => go("calendar-week")} className="w-full flex items-center gap-2 py-2 text-left">
                  <span className="text-xs" style={{ fontFamily: "var(--font-serif)", color: screen === "calendar-week" ? NAVY : "#1A1A1A" }}>Week</span>
                </button>
                <button onClick={() => go("calendar-month")} className="w-full flex items-center gap-2 py-2 text-left">
                  <span className="text-xs" style={{ fontFamily: "var(--font-serif)", color: screen === "calendar-month" ? NAVY : "#1A1A1A" }}>Month</span>
                </button>
              </div>
            )}
          </div>
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
