"use client";

import { useState, useRef, useEffect } from "react";
import { MobileScreenHeader } from "./MobileScreenHeader";
import { parseDueDate } from "@/lib/dates";
import { DueBadge } from "@/components/shared/DueBadge";
import type { Client, ClientTask } from "@/types";

const PROJECT_COLORS = [
  "#d9ed92","#b5e48c","#99d98c","#76c893","#52b69a","#34a0a4","#168aad","#1a759f",
  "#4cc9f0","#90e0ef","#48cae4","#00b4d8","#0096c7","#0077b6","#023e8a","#03045e",
  "#1e6091","#184e77","#457b9d","#415a77",
];

const PURPLE = "#a084ca";

interface MobileProjectsProps {
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  onAddClient: (name: string, color: string) => Promise<Client>;
  onUpdateClient: (client: Client) => void;
  onRemoveClient: (id: string) => void;
  onAddClientTask: (clientId: string, text: string, due?: string | null) => Promise<ClientTask>;
  onToggleClientTask: (clientId: string, taskId: string) => void;
  onArchiveClientTask: (clientId: string, taskId: string) => void;
  onRemoveClientTask: (clientId: string, taskId: string) => void;
  onUpdateClientTask: (clientId: string, task: ClientTask) => void;
  onOpenDrawer: () => void;
}

function ArchiveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 5v9a1 1 0 001 1h10a1 1 0 001-1V5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface ProjectPanelProps {
  client: Client;
  tasks: ClientTask[];
  onUpdateClient: (c: Client) => void;
  onRemoveClient: (id: string) => void;
  onAddTask: (clientId: string, text: string, due?: string | null) => Promise<ClientTask>;
  onToggleTask: (clientId: string, taskId: string) => void;
  onArchiveTask: (clientId: string, taskId: string) => void;
  onRemoveTask: (clientId: string, taskId: string) => void;
  onUpdateTask: (clientId: string, task: ClientTask) => void;
}

function ProjectPanel({
  client, tasks,
  onUpdateClient, onRemoveClient,
  onAddTask, onToggleTask, onArchiveTask, onRemoveTask, onUpdateTask,
}: ProjectPanelProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(client.notes ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const [addDue, setAddDue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const tappingDate = useRef(false);

  const active = tasks.filter((t) => !t.archived).sort((a, b) => {
    const da = parseDueDate(a.dueDate), db = parseDueDate(b.dueDate);
    if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
    return da.getTime() - db.getTime();
  });
  const pending = active.filter((t) => !t.done);
  const done = active.filter((t) => t.done);
  const archived = tasks.filter((t) => t.archived);

  const commitAdd = async () => {
    if (!addText.trim()) return;
    await onAddTask(client.id, addText.trim(), addDue || null);
    setAddText(""); setAddDue(""); setAddOpen(false);
  };

  const startEdit = (t: ClientTask) => { setEditingId(t.id); setEditingText(t.text); };
  const saveEdit = (t: ClientTask) => {
    if (editingText.trim() && editingText !== t.text) onUpdateTask(client.id, { ...t, text: editingText.trim() });
    setEditingId(null);
  };
  const confirmDelete = (t: ClientTask) => {
    if (confirm("Are you sure you want to delete this task?")) { onRemoveTask(client.id, t.id); setEditingId(null); }
  };

const lightText = false; // tasks area is always on light bg

  const editDueRef = useRef(""); // ref avoids re-render that destroys date picker

  const saveEditWithDue = (t: ClientTask) => {
    const updates: Partial<ClientTask> = {};
    if (editingText.trim() && editingText !== t.text) updates.text = editingText.trim();
    const newDue = editDueRef.current;
    if (newDue !== (t.dueDate ?? "")) updates.dueDate = newDue || null;
    if (Object.keys(updates).length) onUpdateTask(client.id, { ...t, ...updates });
    setEditingId(null);
    editDueRef.current = "";
  };

  const TaskRow = ({ t }: { t: ClientTask }) => (
    <div className="border-b border-paper-line/20">
      {editingId === t.id ? (
        <div className="flex items-center gap-2 py-2.5 px-1">
          <input
            autoFocus
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={() => {
              setTimeout(() => {
                if (tappingDate.current) return;
                saveEditWithDue(t);
              }, 100);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") saveEditWithDue(t); if (e.key === "Escape") setEditingId(null); }}
            className="flex-1 bg-transparent border-b border-paper-line outline-none text-paper-ink pb-0.5"
            style={{ fontFamily: "var(--font-body)", fontSize: 16 }}
          />
          {/* Date picker — transparent overlay, ref-based to avoid re-render */}
          <div
            className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center"
            onTouchStart={() => { tappingDate.current = true; setTimeout(() => { tappingDate.current = false; }, 800); }}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-paper-ink-light pointer-events-none"><rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <input
              type="date"
              defaultValue={t.dueDate ?? ""}
              onChange={(e) => {
                editDueRef.current = e.target.value;
                // Update the icon color as visual confirmation
                const icon = e.currentTarget.previousElementSibling as SVGElement | null;
                if (icon) icon.style.color = client.color;
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              style={{ fontSize: 16 }}
            />
          </div>
          {/* Save check */}
          <button onMouseDown={(e) => { e.preventDefault(); saveEditWithDue(t); }} className="flex-shrink-0 text-paper-ink-light active:text-green-600">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {/* Trash */}
          <button onMouseDown={(e) => { e.preventDefault(); confirmDelete(t); }} className="flex-shrink-0 text-paper-ink-light active:text-red-500 scale-125">
            <TrashIcon />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 py-2.5 px-1">
          <DueBadge due={t.dueDate} />
          <span
            className={`flex-1 text-base cursor-text ${t.done ? "line-through opacity-40" : "text-paper-ink"}`}
            style={{ fontFamily: "var(--font-body)" }}
            onClick={() => !t.done && startEdit(t)}
          >
            {t.text}
          </span>
          <button onClick={() => onArchiveTask(client.id, t.id)} className="flex-shrink-0 text-paper-ink-light active:text-paper-rust">
            <ArchiveIcon />
          </button>
          <button
            onClick={() => onToggleTask(client.id, t.id)}
            className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
            style={{ borderColor: t.done ? client.color : "rgba(26,26,26,0.22)", backgroundColor: t.done ? client.color : "transparent" }}
          >
            {t.done && <svg width="7" height="5" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-0 mb-[3px] overflow-hidden bg-white/10 backdrop-blur-md">
      {/* Notes dropdown */}
      <button
        onClick={() => setNotesOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left border-b border-paper-line/20"
      >
        <span className="text-[13px] uppercase tracking-[0.2em] font-bold" style={{ fontFamily: "var(--font-body)", color: "rgba(26,26,26,0.75)" }}>
          {notesOpen ? "▾" : "▸"} Notes
        </span>
      </button>
      {notesOpen && (
        <div className="px-4 py-3 border-b border-paper-line/20">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => { if (notes !== (client.notes ?? "")) onUpdateClient({ ...client, notes }); }}
            placeholder="project notes, context, ideas..."
            rows={3}
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed italic text-paper-ink placeholder:text-paper-ink-light/50"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>
      )}

      {/* Add task */}
      <div className="px-4 pt-2">
        {!addOpen ? (
          <button
            onClick={() => {
              if (editingId) {
                const editing = [...pending, ...done].find((t) => t.id === editingId);
                if (editing) saveEditWithDue(editing);
              }
              setAddOpen(true);
            }}
            className="flex items-center gap-2 py-2 text-sm"
            style={{ color: "rgba(26,26,26,0.75)", fontFamily: "var(--font-body)" }}
          >
            <span className="text-lg font-bold leading-none">+</span>
            <span>Add task</span>
          </button>
        ) : (
          <div className="py-3">
            <input
              autoFocus
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitAdd(); if (e.key === "Escape") setAddOpen(false); }}
              placeholder="Task name..."
              className="w-full bg-transparent border-b border-paper-line outline-none pb-2 text-paper-ink"
              style={{ fontFamily: "var(--font-body)", fontSize: 16 }}
            />
            <div className="flex items-center justify-between mt-3 gap-2">
              {/* Date picker — transparent overlay for iOS compatibility */}
              <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs flex-shrink-0 cursor-pointer"
                style={{ color: addDue ? client.color : "rgba(26,26,26,0.5)", borderColor: addDue ? client.color : "rgba(26,26,26,0.18)", backgroundColor: addDue ? `${client.color}12` : "transparent", fontFamily: "var(--font-body)" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <span>{addDue || "Due date"}</span>
                {addDue && <span onPointerDown={(e) => { e.stopPropagation(); setAddDue(""); }} className="ml-1 opacity-50">×</span>}
                <input type="date" value={addDue} onChange={(e) => setAddDue(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  style={{ fontSize: 16 }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setAddOpen(false); setAddText(""); setAddDue(""); }} className="text-xs text-paper-ink-light px-2" style={{ fontFamily: "var(--font-body)" }}>Cancel</button>
                <button onClick={commitAdd} disabled={!addText.trim()} className="px-3 py-1.5 text-xs font-bold text-white rounded" style={{ backgroundColor: addText.trim() ? client.color : "rgba(0,0,0,0.12)", fontFamily: "var(--font-body)" }}>Add task</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="px-3">
        {pending.map((t) => <TaskRow key={t.id} t={t} />)}

        {done.length > 0 && (
          <details>
            <summary className="text-[14px] cursor-pointer list-none select-none text-paper-ink-light py-2" style={{ fontFamily: "var(--font-body)" }}>▸ {done.length} done</summary>
            {done.map((t) => <TaskRow key={t.id} t={t} />)}
          </details>
        )}

        {archived.length > 0 && (
          <details>
            <summary className="text-[14px] cursor-pointer list-none select-none text-paper-ink-light py-2" style={{ fontFamily: "var(--font-body)" }}>▸ {archived.length} archived</summary>
            {archived.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-paper-line/20 opacity-50">
                <DueBadge due={t.dueDate} />
                <span className="flex-1 text-base line-through text-paper-ink truncate" style={{ fontFamily: "var(--font-body)" }}>{t.text}</span>
              </div>
            ))}
          </details>
        )}

        {active.length === 0 && !addOpen && (
          <p className="text-sm text-paper-ink-light text-center py-4" style={{ fontFamily: "var(--font-body)" }}>No tasks yet.</p>
        )}
      </div>
    </div>
  );
}

export function MobileProjects({
  clients, tasksByClient,
  onAddClient, onUpdateClient, onRemoveClient,
  onAddClientTask, onToggleClientTask, onArchiveClientTask, onRemoveClientTask, onUpdateClientTask,
  onOpenDrawer,
}: MobileProjectsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[4]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const commit = async () => {
    if (!name.trim()) return;
    await onAddClient(name.trim(), color);
    setName(""); setColor(PROJECT_COLORS[4]); setAdding(false);
  };

  const toggle = (id: string) => setOpenId((prev) => prev === id ? null : id);

  const addForm = (
    <div className="mx-0 mb-[3px] bg-white/10 backdrop-blur-md">
      <div className="px-5 pt-5 pb-4">
        <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setAdding(false); }}
          placeholder="Project name..."
          className="w-full bg-transparent border-b border-paper-line outline-none pb-2 text-paper-ink"
          style={{ fontFamily: "var(--font-body)", fontSize: 16 }}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {PROJECT_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} className="w-10 h-10 rounded-full active:scale-95 transition-transform"
              style={{ backgroundColor: c, outline: c === color ? `3px solid ${c}` : "none", outlineOffset: 3, boxShadow: c === color ? "0 0 0 1px rgba(255,255,255,0.6) inset" : "none" }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button onClick={commit} className="flex-1 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-white"
            style={{ backgroundColor: name.trim() ? color : "rgba(0,0,0,0.15)", fontFamily: "var(--font-body)" }}>
            Add Project
          </button>
          <button onClick={() => { setAdding(false); setName(""); }} className="text-sm text-paper-ink-light px-2" style={{ fontFamily: "var(--font-body)" }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-dvh board-breathe board-grid">
      <MobileScreenHeader title="Projects" onOpenDrawer={onOpenDrawer} />
      <div className="flex-1 overflow-y-auto bg-white/5 backdrop-blur-sm">
        {/* Add project — always at top */}
        {!adding ? (
          <button onClick={() => setAdding(true)} className="w-full py-3 text-sm font-bold tracking-[0.22em] uppercase text-white mb-[3px]"
            style={{ backgroundColor: PURPLE, fontFamily: "var(--font-body)" }}>
            + Add Project
          </button>
        ) : addForm}

        {/* Project list */}
        <div className="flex flex-col gap-[3px]">
          {clients.map((c) => (
            <div key={c.id}>
              {/* Project header card */}
              <button
                onClick={() => toggle(c.id)}
                className="w-full flex items-center justify-between px-5 py-3 text-left active:opacity-80 transition-opacity"
                style={{ backgroundColor: c.color }}
              >
                <span className="text-sm font-bold tracking-[0.18em] uppercase text-white" style={{ fontFamily: "var(--font-body)" }}>{c.name}</span>
                <span className="text-white text-lg font-light opacity-70">{openId === c.id ? "∨" : "›"}</span>
              </button>

              {/* Accordion content */}
              {openId === c.id && (
                <ProjectPanel
                  client={c}
                  tasks={tasksByClient[c.id] ?? []}
                  onUpdateClient={onUpdateClient}
                  onRemoveClient={(id) => { onRemoveClient(id); setOpenId(null); }}
                  onAddTask={onAddClientTask}
                  onToggleTask={onToggleClientTask}
                  onArchiveTask={onArchiveClientTask}
                  onRemoveTask={onRemoveClientTask}
                  onUpdateTask={onUpdateClientTask}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
