"use client";

import { useState } from "react";
import type { Goal } from "@/types";

interface GoalsSidebarProps {
  weekGoals: Goal[];
  longtermGoals: Goal[];
  onAdd: (text: string, type: "weekly" | "longterm") => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  clientManagerSlot?: React.ReactNode;
}

function GoalItem({ goal, onToggle, onRemove }: { goal: Goal; onToggle: (id: string) => void; onRemove: (id: string) => void }) {
  return (
    <div className="group flex items-start gap-3 py-2">
      <button
        onClick={() => onToggle(goal.id)}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
        style={{
          borderColor: goal.completed ? "var(--color-paper-sage)" : "var(--color-paper-ink-light)",
          backgroundColor: goal.completed ? "var(--color-paper-sage)" : "transparent",
        }}
        aria-label={goal.completed ? "Mark incomplete" : "Mark complete"}
      >
        {goal.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-sm leading-snug font-medium ${goal.completed ? "line-through text-paper-ink-light" : "text-paper-ink"}`}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {goal.text}
      </span>
      <button
        onClick={() => onRemove(goal.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-paper-ink-light hover:text-paper-rust text-base font-bold flex-shrink-0"
        aria-label="Delete goal"
      >
        ×
      </button>
    </div>
  );
}

function AddGoalInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = useState("");
  const commit = () => {
    if (value.trim()) { onAdd(value.trim()); setValue(""); }
  };
  return (
    <div className="flex items-center gap-2 mt-1 pt-1">
      <span className="text-paper-rust text-base font-bold flex-shrink-0">+</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        onBlur={commit}
        placeholder="add goal..."
        className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-paper-line/80 text-paper-ink font-medium"
        style={{ fontFamily: "var(--font-serif)" }}
      />
    </div>
  );
}

export function GoalsSidebar({ weekGoals, longtermGoals, onAdd, onToggle, onRemove, clientManagerSlot }: GoalsSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="w-72 flex-shrink-0 border-l-2 border-paper-line bg-paper-warm/60 flex flex-col overflow-hidden"
      style={{ minHeight: 0 }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-paper-line">
        <h2
          className="text-sm font-bold tracking-[0.15em] uppercase text-paper-ink"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Goals
        </h2>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-paper-ink-light hover:text-paper-rust text-xl font-bold transition-colors w-8 h-8 flex items-center justify-center"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
        {clientManagerSlot}
        <div className="px-5 py-4 space-y-6">
          <section>
            <h3
              className="text-xs font-bold uppercase tracking-[0.15em] text-paper-rust mb-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <span className="block w-4 h-0.5 bg-paper-rust rounded" />
              This Week
            </h3>
            {weekGoals.length === 0 && (
              <p className="text-xs text-paper-ink-light italic mb-2" style={{ fontFamily: "var(--font-serif)" }}>No goals yet.</p>
            )}
            {weekGoals.map((g) => (
              <GoalItem key={g.id} goal={g} onToggle={onToggle} onRemove={onRemove} />
            ))}
            <AddGoalInput onAdd={(text) => onAdd(text, "weekly")} />
          </section>

          <div className="border-t-2 border-paper-line/50" />

          <section>
            <h3
              className="text-xs font-bold uppercase tracking-[0.15em] text-paper-sage mb-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <span className="block w-4 h-0.5 bg-paper-sage rounded" />
              Long-Term
            </h3>
            {longtermGoals.length === 0 && (
              <p className="text-xs text-paper-ink-light italic mb-2" style={{ fontFamily: "var(--font-serif)" }}>Nothing yet — dream big.</p>
            )}
            {longtermGoals.map((g) => (
              <GoalItem key={g.id} goal={g} onToggle={onToggle} onRemove={onRemove} />
            ))}
            <AddGoalInput onAdd={(text) => onAdd(text, "longterm")} />
          </section>
        </div>
        </div>
      )}
    </aside>
  );
}
