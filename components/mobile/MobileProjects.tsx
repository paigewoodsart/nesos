"use client";

import { useState, useRef, useEffect } from "react";
import { MobileScreenHeader } from "./MobileScreenHeader";
import type { Client } from "@/types";

const PROJECT_COLORS = [
  "#d9ed92","#b5e48c","#99d98c","#76c893","#52b69a","#34a0a4","#168aad","#1a759f",
  "#4cc9f0","#90e0ef","#48cae4","#00b4d8","#0096c7","#0077b6","#023e8a","#03045e",
  "#1e6091","#184e77","#457b9d","#415a77",
];

const PURPLE = "#a084ca";

interface MobileProjectsProps {
  clients: Client[];
  onSelectProject: (id: string) => void;
  onAddClient: (name: string, color: string) => Promise<Client>;
  onBack: () => void;
  onOpenDrawer: () => void;
}

export function MobileProjects({ clients, onSelectProject, onAddClient, onBack, onOpenDrawer }: MobileProjectsProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[4]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const commit = async () => {
    if (!name.trim()) return;
    await onAddClient(name.trim(), color);
    setName("");
    setColor(PROJECT_COLORS[4]);
    setAdding(false);
  };

  const addForm = (
    <div className="mx-4 my-3 rounded-sm overflow-hidden" style={{ backgroundColor: "rgba(249,248,246,0.85)", backdropFilter: "blur(12px)" }}>
      <div className="px-5 pt-5 pb-4">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setAdding(false); }}
          placeholder="Project name..."
          className="w-full text-sm bg-transparent border-b border-paper-line outline-none pb-2 text-paper-ink"
          style={{ fontFamily: "var(--font-serif)" }}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-10 h-10 rounded-full transition-transform active:scale-95"
              style={{
                backgroundColor: c,
                outline: c === color ? `3px solid ${c}` : "none",
                outlineOffset: 3,
                boxShadow: c === color ? "0 0 0 1px rgba(255,255,255,0.6) inset" : "none",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={commit}
            className="flex-1 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-white"
            style={{ backgroundColor: name.trim() ? color : "rgba(0,0,0,0.15)", fontFamily: "var(--font-body)" }}
          >
            Add Project
          </button>
          <button
            onClick={() => { setAdding(false); setName(""); }}
            className="text-sm text-paper-ink-light px-2"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const hasProjects = clients.length > 0;

  return (
    <div className="flex flex-col h-screen board-breathe board-grid">
      <MobileScreenHeader title="Projects" onBack={onBack} onOpenDrawer={onOpenDrawer} />

      <div className="flex-1 overflow-y-auto">
        {/* Add project form at TOP when no projects */}
        {!hasProjects && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-5 text-sm font-bold tracking-[0.22em] uppercase text-white"
            style={{ backgroundColor: PURPLE, fontFamily: "var(--font-body)" }}
          >
            + Add Project
          </button>
        )}
        {!hasProjects && adding && addForm}

        {/* Project list */}
        <div className="flex flex-col gap-[3px] pt-[3px]">
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectProject(c.id)}
              className="w-full flex items-center justify-between px-5 py-5 text-left active:opacity-80 transition-opacity"
              style={{ backgroundColor: c.color }}
            >
              <span
                className="text-sm font-bold tracking-[0.18em] uppercase text-white"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {c.name}
              </span>
              <span className="text-white text-lg font-light opacity-70">›</span>
            </button>
          ))}
        </div>

        {/* Add project form at BOTTOM when projects exist */}
        {hasProjects && adding && addForm}
      </div>

      {/* Add project button at bottom when projects exist */}
      {hasProjects && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex-shrink-0 w-full py-5 text-sm font-bold tracking-[0.22em] uppercase text-white"
          style={{ backgroundColor: PURPLE, fontFamily: "var(--font-body)" }}
        >
          + Add Project
        </button>
      )}
    </div>
  );
}
