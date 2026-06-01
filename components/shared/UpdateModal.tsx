"use client";

import { useEffect, useRef } from "react";

export const UPDATE_VERSION = "2026-06-01";
export const UPDATE_KEY = "nesos-update-version";

const UPDATES: { title: string; body: string }[] = [
  {
    title: "Color themes",
    body: "The board now has two palettes to choose from. Original keeps the soft pastel rainbow you know. Neutral shifts everything into warm creams and tans for a quieter feel. Switch anytime from the two dots in the nav.",
  },
  {
    title: "Custom panel colors",
    body: "Click the pencil icon on any panel header to change its color. The color picker now shows swatches that match your chosen theme, so everything stays cohesive.",
  },
  {
    title: "Drag and drop projects",
    body: "Your projects in the left column can now be reordered by dragging. Hold and drag any project tab to move it into the order that makes sense for how you work.",
  },
  {
    title: "File attachments",
    body: "You can now attach files directly to any project. Open a project and scroll to the bottom to upload. Files stay attached to the project and are easy to find whenever you need them.",
  },
  {
    title: "Auto archive",
    body: "Completed tasks now move to the archive automatically after 24 hours. Your board stays clean on its own, and nothing is ever deleted. Everything lives in the archive, accessible from the box icon in the nav.",
  },
];

interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpdateModal({ open, onClose }: UpdateModalProps) {
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
                What's new
              </h2>
              <p
                className="text-[11px] text-paper-ink-light mt-0.5 italic"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                a few things that changed since your last visit
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

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {UPDATES.map((u, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="flex-shrink-0 w-1.5 rounded-full mt-1"
                style={{ backgroundColor: "var(--color-paper-rust)", minHeight: "1rem", height: "auto", alignSelf: "stretch", opacity: 0.5 }}
              />
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[0.15em] text-paper-ink mb-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {u.title}
                </p>
                <p
                  className="text-sm leading-relaxed text-paper-ink-light"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {u.body}
                </p>
              </div>
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
