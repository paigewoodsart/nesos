"use client";

import { MobileScreenHeader } from "./MobileScreenHeader";
import type { Goal } from "@/types";

const WEEK_COLOR = "#168aad";
const LONG_COLOR = "#34a0a4";

interface MobileGoalsProps {
  weekGoals: Goal[];
  longtermGoals: Goal[];
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onAddGoal: (text: string, type: "weekly" | "longterm") => void;
  onBack: () => void;
  onOpenDrawer: () => void;
}

interface GoalRowProps {
  goal: Goal;
  color: string;
  onToggle: () => void;
  onRemove: () => void;
}

function GoalRow({ goal, color, onToggle, onRemove }: GoalRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-paper-line/30">
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
        style={{ borderColor: goal.completed ? color : "rgba(26,26,26,0.25)", backgroundColor: goal.completed ? color : "transparent" }}
      >
        {goal.completed && (
          <svg width="7" height="5" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-sm ${goal.completed ? "line-through opacity-40" : "text-paper-ink"}`}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {goal.text}
      </span>
      <button onClick={onRemove} className="text-paper-ink-light hover:text-paper-rust text-lg font-bold leading-none">×</button>
    </div>
  );
}

interface GoalSectionProps {
  title: string;
  color: string;
  goals: Goal[];
  type: "weekly" | "longterm";
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (text: string, type: "weekly" | "longterm") => void;
}

function GoalSection({ title, color, goals, type, onToggle, onRemove, onAdd }: GoalSectionProps) {
  const pending = goals.filter((g) => !g.completed);
  const done = goals.filter((g) => g.completed);

  return (
    <div className="mb-6">
      <p className="text-[9px] uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-body)", color }}>
        {title}
      </p>
      {pending.map((g) => (
        <GoalRow key={g.id} goal={g} color={color} onToggle={() => onToggle(g.id)} onRemove={() => onRemove(g.id)} />
      ))}
      {done.length > 0 && (
        <details className="mt-1">
          <summary className="text-[10px] italic cursor-pointer list-none select-none text-paper-ink-light py-1" style={{ fontFamily: "var(--font-serif)" }}>
            ▸ {done.length} done
          </summary>
          {done.map((g) => (
            <GoalRow key={g.id} goal={g} color={color} onToggle={() => onToggle(g.id)} onRemove={() => onRemove(g.id)} />
          ))}
        </details>
      )}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-base font-bold" style={{ color }}>+</span>
        <input
          placeholder="add a goal..."
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-paper-ink-light text-paper-ink"
          style={{ fontFamily: "var(--font-serif)" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              onAdd(e.currentTarget.value.trim(), type);
              e.currentTarget.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}

export function MobileGoals({ weekGoals, longtermGoals, onToggleGoal, onRemoveGoal, onAddGoal, onBack, onOpenDrawer }: MobileGoalsProps) {
  return (
    <div className="flex flex-col h-screen bg-paper-cream">
      <MobileScreenHeader title="Goals" onBack={onBack} onOpenDrawer={onOpenDrawer} accent={WEEK_COLOR} />
      <div className="flex-1 overflow-y-auto mobile-scroll px-5 py-4">
        <GoalSection
          title="This Week"
          color={WEEK_COLOR}
          goals={weekGoals}
          type="weekly"
          onToggle={onToggleGoal}
          onRemove={onRemoveGoal}
          onAdd={onAddGoal}
        />
        <GoalSection
          title="Long-Term"
          color={LONG_COLOR}
          goals={longtermGoals}
          type="longterm"
          onToggle={onToggleGoal}
          onRemove={onRemoveGoal}
          onAdd={onAddGoal}
        />
      </div>
    </div>
  );
}
