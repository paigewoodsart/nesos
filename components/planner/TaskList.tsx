"use client";

import { useState, useRef } from "react";
import type { Task } from "@/types";
import { minutesToTime } from "@/lib/dates";

interface TaskListProps {
  tasks: Task[];
  dayIndex: number;
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TaskList({ tasks, dayIndex, onAdd, onToggle, onRemove }: TaskListProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dayTasks = tasks.filter((t) => t.dayIndex === dayIndex).sort((a, b) => a.sortOrder - b.sortOrder);

  const commit = () => {
    const text = draft.trim();
    if (text) { onAdd(text); setDraft(""); }
  };

  return (
    <div className="px-3 pb-2">
      {dayTasks.map((task) => (
        <div key={task.id} className="group flex items-start gap-2 py-1.5 animate-fade-up">
          <button
            onClick={() => onToggle(task.id)}
            className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
            style={{
              borderColor: task.completed ? "var(--color-paper-sage)" : "var(--color-paper-ink-light)",
              backgroundColor: task.completed ? "var(--color-paper-sage)" : "transparent",
            }}
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          >
            {task.completed && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <span
              className={`text-sm leading-snug break-words ${task.completed ? "line-through text-paper-ink-light" : "text-paper-ink font-medium"}`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {task.text}
            </span>
            {task.startMinute !== null && (
              <span
                className="ml-1.5 text-xs text-paper-rust font-medium"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {minutesToTime(task.startMinute!)}
                {task.endMinute !== null ? `–${minutesToTime(task.endMinute!)}` : ""}
              </span>
            )}
            {task.recurring && (
              <span className="ml-1 text-xs text-paper-dust-blue font-bold" title="Recurring task">↻</span>
            )}
          </div>

          <button
            onClick={() => onRemove(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-paper-ink-light hover:text-paper-rust text-base font-bold ml-auto flex-shrink-0 w-5 h-5 flex items-center justify-center"
            aria-label="Delete task"
          >
            ×
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-paper-line/50">
        <span className="text-paper-rust text-base font-bold flex-shrink-0 leading-none">+</span>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          onBlur={commit}
          placeholder="add task..."
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-paper-line/70 text-paper-ink min-w-0 font-medium"
          style={{ fontFamily: "var(--font-body)" }}
        />
      </div>
    </div>
  );
}
