"use client";

import { useState } from "react";

interface AddTaskInputProps {
  color: string;
  onAdd: (text: string, due?: string) => void;
}

export function AddTaskInput({ color, onAdd }: AddTaskInputProps) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [expanded, setExpanded] = useState(false);

  const commit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), due.trim() || undefined);
    setText("");
    setDue("");
    setExpanded(false);
  };

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
          style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}
        />
      </div>
      {expanded && (
        <div className="flex items-center gap-2 mt-1.5 pl-6">
          <input
            type="text"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="due date (4/24)"
            className="flex-1 text-xs bg-transparent border-b border-paper-ink-light/40 outline-none placeholder:text-paper-ink-light pb-0.5"
            style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}
          />
          <button
            onClick={commit}
            className="text-xs font-bold px-2 py-0.5 rounded-sm text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: color, fontFamily: "var(--font-serif)" }}
          >
            add
          </button>
        </div>
      )}
    </div>
  );
}
