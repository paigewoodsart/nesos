"use client";

import { useState } from "react";

interface AddGoalInlineProps {
  onAdd: (text: string) => void;
  color: string;
  placeholder: string;
}

export function AddGoalInline({ onAdd, color, placeholder }: AddGoalInlineProps) {
  const [v, setV] = useState("");

  const commit = () => {
    if (v.trim()) { onAdd(v.trim()); setV(""); }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-base font-bold flex-shrink-0" style={{ color }}>+</span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 text-xs bg-transparent border-none outline-none placeholder:text-paper-ink-light"
        style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}
      />
    </div>
  );
}
