"use client";

import { useState } from "react";
import { MobileScreenHeader } from "./MobileScreenHeader";
import { DueBadge } from "@/components/shared/DueBadge";
import { parseDueDate } from "@/lib/dates";
import { noteTextColor } from "@/lib/colors";
import type { Client, ClientTask } from "@/types";

const LINED_BODY: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(26,26,26,0.04) 23px, rgba(26,26,26,0.04) 24px)",
  backgroundSize: "100% 24px",
  backgroundPositionY: "12px",
};

interface MobileProjectProps {
  client: Client;
  tasks: ClientTask[];
  onAddTask: (clientId: string, text: string, due?: string | null) => void;
  onToggleTask: (clientId: string, taskId: string) => void;
  onArchiveTask: (clientId: string, taskId: string) => void;
  onUpdateTask: (clientId: string, task: ClientTask) => void;
  onBack: () => void;
  onOpenDrawer: () => void;
}

export function MobileProject({
  client, tasks,
  onAddTask, onToggleTask, onArchiveTask, onUpdateTask,
  onBack, onOpenDrawer,
}: MobileProjectProps) {
  const [addText, setAddText] = useState("");
  const [addDue, setAddDue] = useState("");
  const [editingDue, setEditingDue] = useState<string | null>(null);

  const textColor = noteTextColor(client.color);
  const lightText = textColor === "#FFFFFF";

  const active = tasks
    .filter((t) => !t.archived)
    .sort((a, b) => {
      const da = parseDueDate(a.dueDate);
      const db = parseDueDate(b.dueDate);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });

  const archived = tasks.filter((t) => t.archived);
  const done = active.filter((t) => t.done);
  const pending = active.filter((t) => !t.done);
  const total = active.length;
  const doneCount = done.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const commit = () => {
    if (!addText.trim()) return;
    onAddTask(client.id, addText.trim(), addDue.trim() || null);
    setAddText("");
    setAddDue("");
  };

  const bodyStyle: React.CSSProperties = {
    backgroundColor: `${client.color}18`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderLeft: "1px solid rgba(255,255,255,0.45)",
    borderRight: "1px solid rgba(255,255,255,0.45)",
  };

  return (
    <div className="flex flex-col h-screen board-breathe">
      <MobileScreenHeader title="" onBack={onBack} onOpenDrawer={onOpenDrawer} />

      {/* Color band */}
      <div className="flex-shrink-0 px-5 py-3" style={{ backgroundColor: client.color }}>
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ fontFamily: "var(--font-body)", color: lightText ? "rgba(255,255,255,0.9)" : "rgba(26,26,26,0.72)" }}
        >
          {client.name}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <div
            className="flex-1 h-0.5 rounded-full overflow-hidden"
            style={{ backgroundColor: lightText ? "rgba(255,255,255,0.25)" : "rgba(26,26,26,0.15)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: lightText ? "rgba(255,255,255,0.85)" : "rgba(26,26,26,0.4)" }}
            />
          </div>
          <span
            className="text-xs flex-shrink-0"
            style={{ fontFamily: "var(--font-serif)", color: lightText ? "rgba(255,255,255,0.65)" : "rgba(26,26,26,0.5)" }}
          >
            {doneCount}/{total}
          </span>
        </div>
      </div>

      {/* Frosted glass task body */}
      <div className="flex-1 overflow-y-auto mobile-scroll" style={{ ...bodyStyle, ...LINED_BODY }}>
        <div className="px-5 py-2">
          {pending.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3 border-b border-paper-line/20">
              {editingDue === t.id ? (
                <input
                  autoFocus
                  type="date"
                  defaultValue={t.dueDate ?? ""}
                  className="w-24 text-xs bg-transparent border-b border-paper-line outline-none text-paper-ink flex-shrink-0"
                  style={{ fontFamily: "var(--font-body)" }}
                  onBlur={(e) => {
                    onUpdateTask(client.id, { ...t, dueDate: e.target.value || null });
                    setEditingDue(null);
                  }}
                  onKeyDown={(e) => { if (e.key === "Escape") setEditingDue(null); }}
                />
              ) : (
                <button onClick={() => setEditingDue(t.id)} className="flex-shrink-0">
                  <DueBadge due={t.dueDate} />
                </button>
              )}
              <span className="flex-1 text-sm text-paper-ink" style={{ fontFamily: "var(--font-serif)" }}>{t.text}</span>
              <button
                onClick={() => onArchiveTask(client.id, t.id)}
                className="flex-shrink-0 text-[10px] text-paper-ink-light px-1.5 py-0.5 rounded border border-paper-line/40 active:opacity-60"
                style={{ fontFamily: "var(--font-body)" }}
              >
                done
              </button>
              <button
                onClick={() => onToggleTask(client.id, t.id)}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all"
                style={{ borderColor: "rgba(26,26,26,0.22)" }}
              />
            </div>
          ))}

          {done.length > 0 && (
            <details className="mt-2">
              <summary className="text-[10px] italic cursor-pointer list-none select-none text-paper-ink-light py-2" style={{ fontFamily: "var(--font-serif)" }}>
                ▸ {done.length} done
              </summary>
              {done.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-3 border-b border-paper-line/20">
                  <button
                    onClick={() => onToggleTask(client.id, t.id)}
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: client.color, backgroundColor: client.color }}
                  >
                    <svg width="7" height="5" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="flex-1 text-sm line-through opacity-40 text-paper-ink truncate" style={{ fontFamily: "var(--font-serif)" }}>{t.text}</span>
                  <DueBadge due={t.dueDate} />
                </div>
              ))}
            </details>
          )}

          {archived.length > 0 && (
            <details className="mt-2">
              <summary className="text-[10px] italic cursor-pointer list-none select-none text-paper-ink-light py-2" style={{ fontFamily: "var(--font-serif)" }}>
                ▸ {archived.length} archived
              </summary>
              {archived.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/20 opacity-55">
                  <DueBadge due={t.dueDate} />
                  <span className="flex-1 text-sm line-through text-paper-ink truncate" style={{ fontFamily: "var(--font-serif)" }}>{t.text}</span>
                </div>
              ))}
            </details>
          )}

          {active.length === 0 && (
            <p className="text-sm italic text-paper-ink-light text-center mt-12" style={{ fontFamily: "var(--font-serif)" }}>No tasks yet.</p>
          )}
        </div>
      </div>

      {/* Pinned add-task input — same frosted glass */}
      <div
        className="flex-shrink-0 pb-8"
        style={{
          ...bodyStyle,
          borderTop: `1px solid rgba(255,255,255,0.35)`,
          borderBottom: "1px solid rgba(255,255,255,0.45)",
          padding: "12px 20px 32px",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: client.color }}>+</span>
          <input
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="add a task..."
            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-paper-ink-light font-medium text-paper-ink"
            style={{ fontFamily: "var(--font-serif)" }}
          />
          {addText.trim() && (
            <button onClick={commit} className="text-xs px-3 py-1 text-white rounded-full" style={{ backgroundColor: client.color }}>add</button>
          )}
        </div>
        {addText.trim() && (
          <input
            value={addDue}
            onChange={(e) => setAddDue(e.target.value)}
            type="date"
            className="ml-6 mt-1 text-xs bg-transparent border-b border-paper-line/40 outline-none text-paper-ink-light"
            style={{ fontFamily: "var(--font-body)" }}
          />
        )}
      </div>
    </div>
  );
}
