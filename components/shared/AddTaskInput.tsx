"use client";

import { useRef, useState } from "react";

interface AddTaskInputProps {
  color: string;
  onAdd: (text: string, due?: string) => void;
}

export function AddTaskInput({ color, onAdd }: AddTaskInputProps) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [expanded, setExpanded] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), due || undefined);
    setText("");
    setDue("");
    setExpanded(false);
  };

  const openPicker = () => {
    try { dateRef.current?.showPicker(); } catch { dateRef.current?.click(); }
  };

  const displayDue = due
    ? new Date(due + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: `${color}25` }}>
      <div className="flex items-center gap-2">
        <span className="text-base font-bold flex-shrink-0" style={{ color }}>+</span>
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); if (e.target.value) setExpanded(true); }}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          onFocus={() => setExpanded(true)}
          placeholder="add task..."
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-paper-ink-light font-medium"
          style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
        />
      </div>
      {expanded && (
        <div className="flex items-center gap-2 mt-1.5 pl-6">
          {/* Calendar date picker */}
          <button
            onClick={openPicker}
            className="relative flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              color: due ? color : "rgba(26,26,26,0.5)",
              borderColor: due ? color : "rgba(26,26,26,0.18)",
              backgroundColor: due ? `${color}12` : "transparent",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {displayDue ?? "due date"}
            {due && (
              <span
                onPointerDown={(e) => { e.stopPropagation(); setDue(""); }}
                className="ml-0.5 opacity-50 hover:opacity-100"
              >
                ×
              </span>
            )}
          </button>
          <input
            ref={dateRef}
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="sr-only"
          />
          <button
            onClick={commit}
            disabled={!text.trim()}
            className="text-xs font-bold px-2 py-0.5 rounded-sm text-white transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{ backgroundColor: color, fontFamily: "var(--font-body)" }}
          >
            add
          </button>
        </div>
      )}
    </div>
  );
}
