"use client";

import { useEffect, useRef } from "react";

export const HANDBOOK_VERSION = "2026-06-01";
export const HANDBOOK_KEY = "nesos-handbook-version";

const intro = [
  "Welcome to your Nesos Planner, your personal island.",
  "This is a space to lay everything out and organize it in a way that feels actually approachable. I built Nesos because I spent years trying to make traditional planning work for my brain. Lost notebooks. Sticky notes on every surface. Planners full of tasks that just kept rolling over. I always felt like I was one step behind.",
  "I wanted something calm. Something simple, but with the features that actually make me feel on top of things. That is what Nesos is. I hope it works for you too.",
];

const accountNote = "Before you dive in, make sure you sign in with Google. Everything you add to Nesos is tied to your account and stored securely. Without an account, your data will not be saved between sessions.";

const boardBody = [
  "Set up your space however feels right.",
  "The pencil icon on each project lets you rename it, change its color, or archive and remove it when you no longer need it. You can drag and drop your projects to reorder them whenever things shift.",
  "You can attach files directly to tasks too. Just open a task and add whatever you need to keep alongside it.",
  "On the right side of the board you will find three columns: Urgent, This Week, and This Month. These automatically pull in your tasks based on their due dates. Each task is color coded to match its project so you can see at a glance where it lives. Click any task in those columns and it will open the project it belongs to.",
  "Once a task is marked done, it moves to the archive automatically after 24 hours. Your board stays clean on its own, and nothing is ever lost. You can find everything in the archive anytime using the box icon in the top nav.",
  "When you need your tasks outside of Nesos, use the export icon in the top nav to download a PDF or copy your tasks as text. You can pick specific projects, a date range, all tasks, or a project's full archive. Each project also has its own export icon on its bar for exporting just that project.",
];

interface HandbookModalProps {
  open: boolean;
  onClose: () => void;
}

export function HandbookModal({ open, onClose }: HandbookModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="absolute inset-0 bg-paper-ink/20 backdrop-blur-[2px]" />
      <div
        className="animate-modal-in relative z-10 bg-paper-cream rounded-sm shadow-lg w-full max-w-lg max-h-[85vh] flex flex-col"
        style={{ boxShadow: "2px 3px 24px rgba(44, 36, 22, 0.14)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-paper-line flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/nesos-icon.webp" alt="Nesos" className="h-8 w-8 object-contain flex-shrink-0" />
            <div>
              <h2
                className="text-base font-semibold tracking-wide text-paper-ink uppercase"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.18em" }}
              >
                How to use Nesos
              </h2>
              <p
                className="text-[11px] text-paper-ink-light mt-0.5 italic"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                your work, your rhythm, your island
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-paper-ink-light hover:text-paper-ink transition-colors text-lg flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Intro */}
          <div className="space-y-3 pb-4 border-b border-paper-line/50">
            {intro.map((p, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-paper-ink-light"
                style={{ fontFamily: "var(--font-serif)", fontWeight: i === 0 ? 500 : undefined, color: i === 0 ? "var(--color-paper-ink)" : undefined }}
              >
                {p}
              </p>
            ))}
          </div>

          {/* Account note */}
          <div
            className="px-4 py-3 rounded-sm border border-paper-line/60"
            style={{ backgroundColor: "rgba(26,26,26,0.03)" }}
          >
            <p
              className="text-xs leading-relaxed text-paper-ink-light"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {accountNote}
            </p>
          </div>

          {/* The Board */}
          <div>
            <h3
              className="text-[11px] uppercase tracking-[0.2em] font-bold mb-3"
              style={{ fontFamily: "var(--font-body)", color: "var(--color-paper-rust)" }}
            >
              The Board
            </h3>
            <div className="space-y-3">
              {boardBody.map((p, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-paper-ink-light"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-paper-line px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-5 py-2 border border-paper-ink/20 text-paper-ink hover:bg-paper-warm transition-colors"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.08em" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
