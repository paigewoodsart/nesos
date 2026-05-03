"use client";

import { useState } from "react";
import { MobileScreenHeader } from "./MobileScreenHeader";
import { parseDueDate } from "@/lib/dates";
import { DueBadge } from "@/components/shared/DueBadge";
import type { Client, ClientTask } from "@/types";

const TODAY_COLOR = "#D4909E";

interface MobileTodayProps {
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  onToggleClientTask: (clientId: string, taskId: string) => void;
  onArchiveClientTask: (clientId: string, taskId: string) => void;
  onRemoveClientTask: (clientId: string, taskId: string) => void;
  onUpdateClientTask: (clientId: string, task: ClientTask) => void;
  onOpenDrawer: () => void;
}

export function MobileToday({
  clients, tasksByClient,
  onToggleClientTask, onArchiveClientTask, onRemoveClientTask, onUpdateClientTask,
  onOpenDrawer,
}: MobileTodayProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTasks = clients.flatMap((c) =>
    (tasksByClient[c.id] ?? [])
      .filter((t) => !t.archived)
      .filter((t) => {
        const d = parseDueDate(t.dueDate);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      })
      .map((t) => ({ ...t, clientColor: c.color, clientName: c.name, clientId: c.id }))
  );

  const pending = todayTasks.filter((t) => !t.done);
  const done = todayTasks.filter((t) => t.done);

  const startEdit = (t: typeof todayTasks[0]) => {
    setEditingId(t.id);
    setEditingText(t.text);
  };

  const saveEdit = (t: typeof todayTasks[0]) => {
    if (editingText.trim() && editingText !== t.text) {
      onUpdateClientTask(t.clientId, { ...t, text: editingText.trim() });
    }
    setEditingId(null);
  };

  const confirmDelete = (t: typeof todayTasks[0]) => {
    if (confirm("Are you sure you want to delete this task?")) {
      onRemoveClientTask(t.clientId, t.id);
      setEditingId(null);
    }
  };

  const TaskRow = ({ t }: { t: typeof todayTasks[0] }) => (
    <div className="border-b border-paper-line/30">
      {editingId === t.id ? (
        <div className="py-3 px-1 relative">
          <input
            autoFocus
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={() => saveEdit(t)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(t); if (e.key === "Escape") setEditingId(null); }}
            className="w-full text-sm bg-transparent border-b border-paper-line outline-none text-paper-ink pb-1"
            style={{ fontFamily: "var(--font-body)" }}
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); confirmDelete(t); }}
            className="absolute bottom-3 right-1 text-paper-ink-light active:text-red-500"
            title="Delete task"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 py-2.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.clientColor }} />
          <div className="flex-1 min-w-0" onClick={() => startEdit(t)}>
            <span className={`block text-base truncate cursor-text ${t.done ? "line-through opacity-40" : ""}`} style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}>{t.text}</span>
            <span className="block text-[14px] uppercase tracking-[0.15em] mt-0.5" style={{ fontFamily: "var(--font-body)", color: t.clientColor, opacity: 0.8 }}>{t.clientName}</span>
          </div>
          <DueBadge due={t.dueDate} />
          {/* Archive icon */}
          <button onClick={() => onArchiveClientTask(t.clientId, t.id)} className="flex-shrink-0 text-paper-ink-light active:text-paper-rust">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M2 5v9a1 1 0 001 1h10a1 1 0 001-1V5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Done circle */}
          <button
            onClick={() => onToggleClientTask(t.clientId, t.id)}
            className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
            style={{ borderColor: t.done ? t.clientColor : "rgba(26,26,26,0.22)", backgroundColor: t.done ? t.clientColor : "transparent" }}
          >
            {t.done && <svg width="7" height="5" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-dvh board-breathe board-grid">
      <MobileScreenHeader title="Today" onOpenDrawer={onOpenDrawer} accent={TODAY_COLOR} />
      <div className="flex-1 overflow-y-auto mobile-scroll px-5 py-2 bg-white/10 backdrop-blur-md">
        {pending.map((t) => <TaskRow key={t.id} t={t} />)}

        {done.length > 0 && (
          <details className="mt-2">
            <summary className="text-[14px] cursor-pointer list-none select-none text-paper-ink-light py-2" style={{ fontFamily: "var(--font-body)" }}>
              ▸ {done.length} done
            </summary>
            {done.map((t) => <TaskRow key={t.id} t={t} />)}
          </details>
        )}

        {todayTasks.length === 0 && (
          <p className="text-sm text-paper-ink-light text-center mt-12" style={{ fontFamily: "var(--font-body)" }}>Nothing due today.</p>
        )}
      </div>
    </div>
  );
}
