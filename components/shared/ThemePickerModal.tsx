"use client";

import { useEffect, useRef } from "react";
import type { Theme } from "@/lib/theme";
import { THEME_LABELS } from "@/lib/theme";

interface ThemePickerModalProps {
  open: boolean;
  selected: Theme;
  onSelect: (t: Theme) => void;
  onClose: () => void;
}

const THEME_CONFIG: Record<Theme, { gradient: string; description: string }> = {
  original: {
    gradient: "linear-gradient(135deg, #ffdfe5 0%, #fce4ff 14%, #dfe8ff 28%, #d4f5f5 42%, #d8fae5 56%, #fffbd4 70%, #ffe8d4 84%, #ffdfe5 100%)",
    description: "Soft pastels that shift as you work. The full-color version.",
  },
  neutral: {
    gradient: "linear-gradient(135deg, #FAF7F2 0%, #F5EDE0 25%, #EDE3D4 50%, #F5EDE0 75%, #FAF7F2 100%)",
    description: "Warm creams and tans. A quieter, calmer version of the board.",
  },
};

export const THEME_PICKER_KEY = "nesos-theme-picked";

export function ThemePickerModal({ open, selected, onSelect, onClose }: ThemePickerModalProps) {
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
        className="animate-modal-in relative z-10 bg-paper-cream rounded-sm shadow-lg w-full max-w-md flex flex-col"
        style={{ boxShadow: "2px 3px 24px rgba(44, 36, 22, 0.14)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-paper-line flex-shrink-0">
          <div>
            <h2
              className="text-base font-semibold tracking-wide text-paper-ink uppercase"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.18em" }}
            >
              Pick your palette
            </h2>
            <p
              className="text-[11px] text-paper-ink-light mt-0.5 italic"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              you can always change this from the nav
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-paper-ink-light hover:text-paper-ink transition-colors text-lg flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Theme options */}
        <div className="px-6 py-5 flex flex-col gap-3">
          {(["original", "neutral"] as Theme[]).map((t) => {
            const cfg = THEME_CONFIG[t];
            const isActive = selected === t;
            return (
              <button
                key={t}
                onClick={() => onSelect(t)}
                className="w-full text-left rounded-sm border-2 overflow-hidden transition-all"
                style={{
                  borderColor: isActive ? "var(--color-paper-ink)" : "var(--color-paper-line)",
                  boxShadow: isActive ? "0 0 0 1px var(--color-paper-ink)" : "none",
                }}
              >
                {/* Preview strip */}
                <div
                  className="w-full h-12"
                  style={{ background: cfg.gradient }}
                />
                {/* Label */}
                <div className="px-4 py-3 bg-paper-cream">
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.15em] text-paper-ink"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {THEME_LABELS[t]}
                  </p>
                  <p
                    className="text-xs text-paper-ink-light mt-0.5 leading-relaxed"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {cfg.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-paper-line px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-5 py-2 border border-paper-ink/20 text-paper-ink hover:bg-paper-warm transition-colors"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.08em" }}
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
}
