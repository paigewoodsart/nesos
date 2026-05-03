"use client";

import { useState, useRef } from "react";
import { MobileScreenHeader } from "./MobileScreenHeader";

const RASPBERRY = "#D4909E";

interface MobileBrainDumpProps {
  weekId: string;
  brainDump: string;
  onBrainDumpChange: (text: string) => void;
  onOpenDrawer: () => void;
}

export function MobileBrainDump({ weekId: _weekId, brainDump, onBrainDumpChange, onOpenDrawer }: MobileBrainDumpProps) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const handlePlus = () => {
    setEditing(true);
    setTimeout(() => bodyRef.current?.focus(), 50);
  };

  const handleDone = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex flex-col h-dvh board-breathe board-grid">
      <MobileScreenHeader title="Notes" onOpenDrawer={onOpenDrawer} accent={RASPBERRY} />

      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 min-h-0">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button
            onClick={handlePlus}
            className="w-10 h-10 flex items-center justify-center rounded-full text-2xl font-light"
            style={{ backgroundColor: `${RASPBERRY}20`, color: RASPBERRY }}
          >
            +
          </button>
          {(editing || brainDump) && (
            <button
              onClick={handleDone}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: saved ? "#22c55e20" : `${RASPBERRY}20`, color: saved ? "#22c55e" : RASPBERRY, fontFamily: "var(--font-body)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {saved ? "saved" : "done"}
            </button>
          )}
        </div>

        {/* Body only — no title, no placeholder */}
        <textarea
          ref={bodyRef}
          value={brainDump}
          onChange={(e) => onBrainDumpChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleDone(); }}
          placeholder=""
          className="flex-1 w-full bg-transparent border-none outline-none resize-none leading-relaxed text-paper-ink min-h-0"
          style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
        />
      </div>
    </div>
  );
}
