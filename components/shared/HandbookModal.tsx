"use client";

import { useEffect, useRef } from "react";

interface HandbookModalProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: "The Board",
    body: "Your default view. Each column is a project or client. Sticky notes hold anything — ideas, references, freeform thoughts. Tasks live beneath them, with optional due dates and status tracking.",
  },
  {
    title: "The Week",
    body: "Switch to the calendar view to see your week in time blocks. Drag tasks into specific time slots. Recurring tasks show every week automatically.",
  },
  {
    title: "Projects",
    body: "Add a project with the + button on the board. Inside each project you can add tasks, set due dates, and log work sessions. Color-code to keep things visually distinct.",
  },
  {
    title: "Auto-archive",
    body: "Completed project tasks archive themselves automatically 24 hours after you check them off. You don't need to do anything — Nesos clears them so your board stays clean.",
  },
  {
    title: "Archive",
    body: "All archived tasks and projects live in the archive. Open it with the box icon in the top nav (desktop) or via the Archive screen in the menu (mobile). Nothing is ever deleted.",
  },
];

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
        className="animate-modal-in relative z-10 bg-paper-cream rounded-sm shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{ boxShadow: "2px 3px 24px rgba(44, 36, 22, 0.14)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-paper-line flex-shrink-0">
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
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-paper-ink-light hover:text-paper-ink transition-colors text-lg"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {sections.map((s) => (
            <div key={s.title}>
              <h3
                className="text-[11px] uppercase tracking-[0.2em] font-bold mb-1.5"
                style={{ fontFamily: "var(--font-body)", color: "var(--color-paper-rust)" }}
              >
                {s.title}
              </h3>
              <p
                className="text-sm leading-relaxed text-paper-ink-light"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {s.body}
              </p>
            </div>
          ))}
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
