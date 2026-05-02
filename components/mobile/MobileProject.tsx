"use client";

import { useState, useRef } from "react";
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

const PROJECT_COLORS = [
  "#d9ed92","#b5e48c","#99d98c","#76c893","#52b69a","#34a0a4","#168aad","#1a759f",
  "#4cc9f0","#90e0ef","#48cae4","#00b4d8","#0096c7","#0077b6","#023e8a","#03045e",
  "#1e6091","#184e77","#457b9d","#415a77",
];

interface MobileProjectProps {
  client: Client;
  tasks: ClientTask[];
  onAddTask: (clientId: string, text: string, due?: string | null) => void;
  onToggleTask: (clientId: string, taskId: string) => void;
  onArchiveTask: (clientId: string, taskId: string) => void;
  onUpdateTask: (clientId: string, task: ClientTask) => void;
  onRemoveTask: (clientId: string, taskId: string) => void;
  onUpdateClient: (client: Client) => void;
  onRemoveClient: (id: string) => void;
  onBack: () => void;
  onOpenDrawer: () => void;
}

export function MobileProject({
  client, tasks,
  onAddTask, onToggleTask, onArchiveTask, onUpdateTask,
  onRemoveTask, onUpdateClient, onRemoveClient,
  onBack, onOpenDrawer,
}: MobileProjectProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const [addDue, setAddDue] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(client.name);
  const [editColor, setEditColor] = useState(client.color);
  const [editingDueTask, setEditingDueTask] = useState<ClientTask | null>(null);
  const [projectNotes, setProjectNotes] = useState(client.notes ?? "");

  const addDateRef = useRef<HTMLInputElement>(null);
  const taskDateRef = useRef<HTMLInputElement>(null);

  const lightText = noteTextColor(client.color) === "#FFFFFF";
  const bandColor = editing ? editColor : client.color;
  const bandLight = noteTextColor(bandColor) === "#FFFFFF";

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
    setAddOpen(false);
  };

  const saveEdit = () => {
    onUpdateClient({ ...client, name: editName.trim() || client.name, color: editColor });
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${client.name}" and all its tasks?`)) return;
    onRemoveClient(client.id);
    onBack();
  };

  const openAddDatePicker = () => {
    try { addDateRef.current?.showPicker(); } catch { addDateRef.current?.click(); }
  };

  const openTaskDatePicker = (task: ClientTask) => {
    setEditingDueTask(task);
    setTimeout(() => {
      try { taskDateRef.current?.showPicker(); } catch { taskDateRef.current?.click(); }
    }, 50);
  };

  const bodyStyle: React.CSSProperties = {
    backgroundColor: `${bandColor}18`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderLeft: "1px solid rgba(255,255,255,0.45)",
    borderRight: "1px solid rgba(255,255,255,0.45)",
  };

  return (
    <div className="flex flex-col h-screen board-breathe">
      <MobileScreenHeader title="" onBack={onBack} onOpenDrawer={onOpenDrawer} />

      {/* Hidden task date input */}
      <input
        ref={taskDateRef}
        type="date"
        defaultValue={editingDueTask?.dueDate ?? ""}
        className="sr-only"
        onChange={(e) => {
          if (!editingDueTask) return;
          onUpdateTask(client.id, { ...editingDueTask, dueDate: e.target.value || null });
          setEditingDueTask(null);
        }}
      />

      {/* Color band */}
      <div className="flex-shrink-0 px-5 py-3" style={{ backgroundColor: bandColor }}>
        <div className="flex items-center justify-between">
          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 bg-transparent border-b outline-none text-xs font-semibold uppercase tracking-[0.2em] mr-3 pb-0.5"
              style={{
                fontFamily: "var(--font-body)",
                color: bandLight ? "rgba(255,255,255,0.95)" : "rgba(26,26,26,0.85)",
                borderColor: bandLight ? "rgba(255,255,255,0.5)" : "rgba(26,26,26,0.3)",
              }}
            />
          ) : (
            <p className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-body)", color: lightText ? "rgba(255,255,255,0.9)" : "rgba(26,26,26,0.72)" }}>
              {client.name}
            </p>
          )}
          <button
            onClick={() => { setEditing((v) => !v); setEditName(client.name); setEditColor(client.color); }}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full ml-2"
            style={{ backgroundColor: bandLight ? "rgba(255,255,255,0.15)" : "rgba(26,26,26,0.1)" }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke={bandLight ? "rgba(255,255,255,0.9)" : "rgba(26,26,26,0.7)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {editing ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <button key={c} onClick={() => setEditColor(c)}
                  className="w-7 h-7 rounded-full active:scale-95 transition-transform"
                  style={{ backgroundColor: c, outline: c === editColor ? "2px solid white" : "none", outlineOffset: 2 }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveEdit} className="text-xs px-3 py-1 font-bold text-white"
                style={{ backgroundColor: editColor, fontFamily: "var(--font-body)" }}>
                Save
              </button>
              <button onClick={() => setEditing(false)} className="text-xs px-2 py-1"
                style={{ color: bandLight ? "rgba(255,255,255,0.7)" : "rgba(26,26,26,0.5)", fontFamily: "var(--font-serif)" }}>
                Cancel
              </button>
              <button onClick={handleDelete} className="text-xs px-2 py-1 ml-auto"
                style={{ color: "#ef4444", fontFamily: "var(--font-serif)" }}>
                Delete project
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-0.5 rounded-full overflow-hidden"
              style={{ backgroundColor: lightText ? "rgba(255,255,255,0.25)" : "rgba(26,26,26,0.15)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: lightText ? "rgba(255,255,255,0.85)" : "rgba(26,26,26,0.4)" }} />
            </div>
            <span className="text-xs flex-shrink-0"
              style={{ fontFamily: "var(--font-serif)", color: lightText ? "rgba(255,255,255,0.65)" : "rgba(26,26,26,0.5)" }}>
              {doneCount}/{total}
            </span>
          </div>
        )}
      </div>

      {/* Project notes */}
      <div className="flex-shrink-0 px-5 py-3 border-b" style={{ ...bodyStyle, borderColor: "rgba(255,255,255,0.3)" }}>
        <p className="text-[9px] uppercase tracking-[0.25em] mb-1.5"
          style={{ fontFamily: "var(--font-body)", color: lightText ? "rgba(255,255,255,0.5)" : "rgba(26,26,26,0.4)" }}>
          Notes
        </p>
        <textarea
          value={projectNotes}
          onChange={(e) => setProjectNotes(e.target.value)}
          onBlur={() => { if (projectNotes !== (client.notes ?? "")) onUpdateClient({ ...client, notes: projectNotes }); }}
          placeholder="project context, ideas, links..."
          rows={projectNotes ? Math.min(projectNotes.split("\n").length + 1, 5) : 2}
          className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder:opacity-40"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: lightText ? "rgba(255,255,255,0.85)" : "rgba(26,26,26,0.75)",
          }}
        />
      </div>

      {/* Task body */}
      <div className="flex-1 overflow-y-auto mobile-scroll relative" style={{ ...bodyStyle, ...LINED_BODY }}>

        {/* + button top-right */}
        <button
          onClick={() => { setAddOpen((v) => !v); setAddText(""); setAddDue(""); }}
          className="absolute top-3 right-4 w-10 h-10 flex items-center justify-center rounded-full text-2xl font-light z-10 transition-transform active:scale-90"
          style={{ backgroundColor: `${client.color}25`, color: client.color }}
        >
          {addOpen ? "×" : "+"}
        </button>

        {/* Add task form */}
        {addOpen && (
          <div className="mx-4 mt-3 mb-1 rounded px-4 py-4"
            style={{ backgroundColor: "rgba(249,248,246,0.9)", backdropFilter: "blur(12px)" }}>
            <input
              autoFocus
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              placeholder="Task name..."
              className="w-full text-sm bg-transparent border-b border-paper-line outline-none pb-2 text-paper-ink font-medium"
              style={{ fontFamily: "var(--font-serif)" }}
            />
            <div className="flex items-center justify-between mt-3 gap-2">
              <button
                onClick={openAddDatePicker}
                className="flex items-center gap-1.5 px-3 py-2 rounded border text-xs flex-shrink-0"
                style={{
                  fontFamily: "var(--font-body)",
                  color: addDue ? client.color : "rgba(26,26,26,0.55)",
                  borderColor: addDue ? client.color : "rgba(26,26,26,0.18)",
                  backgroundColor: addDue ? `${client.color}12` : "transparent",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                {addDue ? addDue : "Due date"}
                {addDue && (
                  <span onClick={(e) => { e.stopPropagation(); setAddDue(""); }} className="ml-1 opacity-50">×</span>
                )}
              </button>
              <button
                onClick={commit}
                disabled={!addText.trim()}
                className="px-4 py-2 text-xs font-bold text-white rounded"
                style={{ backgroundColor: addText.trim() ? client.color : "rgba(0,0,0,0.12)", fontFamily: "var(--font-body)" }}
              >
                Add task
              </button>
            </div>
            <input ref={addDateRef} type="date" value={addDue}
              onChange={(e) => setAddDue(e.target.value)} className="sr-only" />
          </div>
        )}

        <div className="px-5 py-2 pt-12">
          {pending.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3 border-b border-paper-line/20">
              <button onClick={() => openTaskDatePicker(t)} className="flex-shrink-0">
                <DueBadge due={t.dueDate} />
              </button>
              <span className="flex-1 text-sm text-paper-ink" style={{ fontFamily: "var(--font-serif)" }}>{t.text}</span>
              <button
                onClick={() => onArchiveTask(client.id, t.id)}
                className="flex-shrink-0 text-[10px] text-paper-ink-light px-1.5 py-0.5 rounded border border-paper-line/40 active:opacity-60"
                style={{ fontFamily: "var(--font-body)" }}
              >
                done
              </button>
              <button
                onClick={() => onRemoveTask(client.id, t.id)}
                className="flex-shrink-0 text-lg leading-none text-paper-ink-light active:text-red-400"
              >
                ×
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
                  <button onClick={() => onToggleTask(client.id, t.id)}
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: client.color, backgroundColor: client.color }}>
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

          {active.length === 0 && !addOpen && (
            <p className="text-sm italic text-paper-ink-light text-center mt-12" style={{ fontFamily: "var(--font-serif)" }}>No tasks yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
