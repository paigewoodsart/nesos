"use client";

import { useState, useRef } from "react";

interface BrainDumpProps {
  value: string;
  onChange: (text: string) => void;
  onOrganize?: () => void;
}

export function BrainDump({ value, onChange, onOrganize }: BrainDumpProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-paper-line bg-paper-warm/30">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-paper-warm/50 transition-colors text-left"
      >
        <span
          className="text-xs uppercase tracking-widest text-paper-ink-light"
          style={{ fontFamily: "var(--font-serif)", fontSize: "10px" }}
        >
          Notes {value.trim() && <span className="text-paper-rust">•</span>}
        </span>
        <span className="text-paper-ink-light text-xs">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="torn-edge px-6 pb-5 pt-4 animate-fade-up">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder=""
            rows={5}
            className="w-full text-sm bg-paper-warm/60 border border-paper-line rounded-sm px-3 py-2.5 outline-none resize-none text-paper-ink placeholder:text-paper-line focus:border-paper-ink-light transition-colors leading-relaxed"
            style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}
          />
          {onOrganize && value.trim().length > 20 && (
            <button
              onClick={onOrganize}
              className="mt-2 text-xs text-paper-dust-blue hover:text-paper-ink transition-colors"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
            >
              ask bloom bot to organize this →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
