"use client";

import { useState } from "react";
import { CLIENT_COLORS } from "@/hooks/useClientStore";
import type { Client } from "@/types";

interface ClientManagerProps {
  clients: Client[];
  onAdd: (name: string, color: string) => void;
  onRemove: (id: string) => void;
  onSelect: (client: Client | null) => void;
  selected: Client | null;
}

export function ClientManager({ clients, onAdd, onRemove, onSelect, selected }: ClientManagerProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CLIENT_COLORS[0]);

  const commit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName("");
    setColor(CLIENT_COLORS[0]);
    setAdding(false);
  };

  return (
    <div className="px-5 py-4 border-b-2 border-paper-line">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-xs font-bold uppercase tracking-[0.15em] text-paper-ink"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Clients
        </h3>
        <button
          onClick={() => setAdding((a) => !a)}
          className="text-paper-rust text-base font-bold leading-none hover:opacity-70 transition-opacity"
          title="Add client"
        >
          {adding ? "×" : "+"}
        </button>
      </div>

      {/* Client list */}
      <div className="space-y-1 mb-2">
        {clients.map((c) => (
          <div key={c.id} className="group flex items-center gap-2">
            <button
              onClick={() => onSelect(selected?.id === c.id ? null : c)}
              className="flex items-center gap-2 flex-1 text-left py-1 px-2 rounded-sm transition-all hover:bg-paper-warm"
              style={{
                backgroundColor: selected?.id === c.id ? `${c.color}18` : undefined,
                borderLeft: selected?.id === c.id ? `3px solid ${c.color}` : "3px solid transparent",
              }}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <span
                className="text-sm font-medium text-paper-ink truncate"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {c.name}
              </span>
            </button>
            <button
              onClick={() => onRemove(c.id)}
              className="opacity-0 group-hover:opacity-100 text-paper-ink-light hover:text-paper-rust text-sm font-bold transition-opacity flex-shrink-0"
              aria-label="Remove client"
            >
              ×
            </button>
          </div>
        ))}
        {clients.length === 0 && !adding && (
          <p className="text-xs text-paper-ink-light italic" style={{ fontFamily: "var(--font-serif)" }}>
            No clients yet.
          </p>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="mt-2 space-y-2 animate-fade-up">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="Client name..."
            autoFocus
            className="w-full text-sm border-b-2 border-paper-line bg-transparent outline-none pb-1 text-paper-ink font-medium placeholder:text-paper-line"
            style={{ fontFamily: "var(--font-serif)" }}
          />
          <div className="flex gap-1.5 flex-wrap">
            {CLIENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          <button
            onClick={commit}
            disabled={!name.trim()}
            className="w-full py-1.5 text-sm font-medium rounded-sm transition-colors disabled:opacity-40"
            style={{
              backgroundColor: color,
              color: "white",
              fontFamily: "var(--font-serif)",
            }}
          >
            Add {name.trim() || "client"}
          </button>
        </div>
      )}
    </div>
  );
}
