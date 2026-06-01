"use client";

import { useState, useRef, useEffect } from "react";
import { MobileScreenHeader } from "./MobileScreenHeader";
import { MobileFooter } from "./MobileFooter";
import { SwipeRow } from "./SwipeRow";
import { parseDueDate } from "@/lib/dates";
import { DueBadge } from "@/components/shared/DueBadge";
import {
  DndContext, TouchSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Client, ClientTask } from "@/types";

function loadTaskOrder(clientId: string): string[] {
  try { return JSON.parse(localStorage.getItem(`task-order-${clientId}`) ?? "[]"); } catch { return []; }
}
function saveTaskOrder(clientId: string, ids: string[]) {
  try { localStorage.setItem(`task-order-${clientId}`, JSON.stringify(ids)); } catch {}
}
function loadProjectOrder(): string[] {
  try { return JSON.parse(localStorage.getItem("mobile-project-order") ?? "[]"); } catch { return []; }
}
function saveProjectOrder(ids: string[]) {
  try { localStorage.setItem("mobile-project-order", JSON.stringify(ids)); } catch {}
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="touch-none">
      <circle cx="3" cy="2.5" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="2.5" r="1.2" fill="currentColor"/>
      <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="3" cy="11.5" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="11.5" r="1.2" fill="currentColor"/>
    </svg>
  );
}

interface SortableTaskItemProps {
  t: ClientTask;
  client: Client;
  editingId: string | null;
  editingText: string;
  editDueRef: React.MutableRefObject<string>;
  tappingDate: React.MutableRefObject<boolean>;
  onStartEdit: (t: ClientTask) => void;
  onSaveEdit: (t: ClientTask) => void;
  onCancelEdit: () => void;
  onSetEditText: (s: string) => void;
  onConfirmDelete: (t: ClientTask) => void;
  onArchive: (t: ClientTask) => void;
  onRemove: (t: ClientTask) => void;
  onToggle: (t: ClientTask) => void;
}

function SortableTaskItem({
  t, client, editingId, editingText, editDueRef, tappingDate,
  onStartEdit, onSaveEdit, onCancelEdit, onSetEditText, onConfirmDelete,
  onArchive, onRemove, onToggle,
}: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
    zIndex: isDragging ? 20 : "auto",
  };

  if (editingId === t.id) {
    return (
      <div ref={setNodeRef} style={style} className="border-b border-paper-line/20 flex items-center gap-2 py-2.5 px-1">
        <input
          autoFocus
          value={editingText}
          onChange={(e) => onSetEditText(e.target.value)}
          onBlur={() => { setTimeout(() => { if (tappingDate.current) return; onSaveEdit(t); }, 100); }}
          onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(t); if (e.key === "Escape") onCancelEdit(); }}
          className="flex-1 bg-transparent border-b border-paper-line outline-none text-paper-ink pb-0.5"
          style={{ fontFamily: "var(--font-body)", fontSize: 16 }}
        />
        <div
          className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center"
          onTouchStart={() => { tappingDate.current = true; setTimeout(() => { tappingDate.current = false; }, 800); }}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-paper-ink-light pointer-events-none">
            <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="date"
            defaultValue={t.dueDate ?? ""}
            onChange={(e) => {
              editDueRef.current = e.target.value;
              const icon = e.currentTarget.previousElementSibling as SVGElement | null;
              if (icon) icon.style.color = client.color;
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            style={{ fontSize: 16 }}
          />
        </div>
        <button onMouseDown={(e) => { e.preventDefault(); onSaveEdit(t); }} className="flex-shrink-0 text-paper-ink-light active:text-green-600">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onMouseDown={(e) => { e.preventDefault(); onConfirmDelete(t); }} className="flex-shrink-0 text-paper-ink-light active:text-red-500 scale-125">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <SwipeRow onArchive={() => onArchive(t)} onDelete={() => onRemove(t)} archiveColor={client.color}>
        <div className="border-b border-paper-line/20 flex items-center gap-2 py-2.5 px-1 bg-white/10">
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 text-paper-ink-light/30 active:text-paper-ink-light p-0.5 touch-none"
            tabIndex={-1}
          >
            <GripIcon />
          </button>
          <DueBadge due={t.dueDate} />
          <span
            className={`flex-1 text-base cursor-text ${t.done ? "line-through opacity-40" : "text-paper-ink"}`}
            style={{ fontFamily: "var(--font-body)" }}
            onClick={() => !t.done && onStartEdit(t)}
          >
            {t.text}
          </span>
          <button
            onClick={() => onToggle(t)}
            className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
            style={{ borderColor: t.done ? client.color : "rgba(26,26,26,0.22)", backgroundColor: t.done ? client.color : "transparent" }}
          >
            {t.done && <svg width="7" height="5" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
        </div>
      </SwipeRow>
    </div>
  );
}

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
  onArchiveClient: (id: string) => void;
  onUnarchiveClient: (id: string) => void;
  onAddClientTask: (clientId: string, text: string, due?: string | null) => Promise<ClientTask>;
  onToggleClientTask: (clientId: string, taskId: string) => void;
  onArchiveClientTask: (clientId: string, taskId: string) => void;
  onRemoveClientTask: (clientId: string, taskId: string) => void;
  onUpdateClientTask: (clientId: string, task: ClientTask) => void;
  onOpenDrawer: () => void;
}


interface ProjectPanelProps {
  client: Client;
  tasks: ClientTask[];
  onUpdateClient: (c: Client) => void;
  onRemoveClient: (id: string) => void;
  onArchiveClient: (id: string) => void;
  onAddTask: (clientId: string, text: string, due?: string | null) => Promise<ClientTask>;
  onToggleTask: (clientId: string, taskId: string) => void;
  onArchiveTask: (clientId: string, taskId: string) => void;
  onRemoveTask: (clientId: string, taskId: string) => void;
  onUpdateTask: (clientId: string, task: ClientTask) => void;
}

function ProjectPanel({
  client, tasks,
  onUpdateClient, onRemoveClient, onArchiveClient,
  onAddTask, onToggleTask, onArchiveTask, onRemoveTask, onUpdateTask,
}: ProjectPanelProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(client.notes ?? "");
  const [editingProject, setEditingProject] = useState(false);
  const [editName, setEditName] = useState(client.name);
  const [editColor, setEditColor] = useState(client.color);
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const [addDue, setAddDue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const tappingDate = useRef(false);

  const [taskOrder, setTaskOrder] = useState<string[]>(() => loadTaskOrder(client.id));
  const sensors = useSensors(useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }));

  const active = tasks.filter((t) => !t.archived);
  const pendingUnsorted = active.filter((t) => !t.done);
  const pending = [...pendingUnsorted].sort((a, b) => {
    const ai = taskOrder.indexOf(a.id), bi = taskOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) {
      const da = parseDueDate(a.dueDate), db = parseDueDate(b.dueDate);
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
      return da.getTime() - db.getTime();
    }
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  });
  const done = active.filter((t) => t.done);
  const archived = tasks.filter((t) => t.archived);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event;
    if (!over || dragActive.id === over.id) return;
    const ids = pending.map((t) => t.id);
    const newOrder = arrayMove(ids, ids.indexOf(dragActive.id as string), ids.indexOf(over.id as string));
    setTaskOrder(newOrder);
    saveTaskOrder(client.id, newOrder);
  };

  const commitAdd = async () => {
    if (!addText.trim()) return;
    await onAddTask(client.id, addText.trim(), addDue || null);
    setAddText(""); setAddDue(""); setAddOpen(false);
  };

  const saveProjectEdit = () => {
    onUpdateClient({ ...client, name: editName.trim() || client.name, color: editColor });
    setEditingProject(false);
  };

  const handleDeleteProject = () => {
    if (!confirm(`Delete "${client.name}" and all its tasks?`)) return;
    onRemoveClient(client.id);
  };

  const startEdit = (t: ClientTask) => { setEditingId(t.id); setEditingText(t.text); };
  const confirmDelete = (t: ClientTask) => {
    if (confirm("Are you sure you want to delete this task?")) { onRemoveTask(client.id, t.id); setEditingId(null); }
  };

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


  return (
    <div className="mx-0 mb-[3px] overflow-hidden bg-white/10 backdrop-blur-md">
      {/* Edit project bar */}
      {!editingProject ? (
        <div className="flex items-center justify-between px-4 py-2 border-b border-paper-line/20">
          <button
            onClick={() => { setEditingProject(true); setEditName(client.name); setEditColor(client.color); }}
            className="flex items-center gap-1.5 text-[12px] text-paper-ink-light active:opacity-60"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit project
          </button>
        </div>
      ) : (
        <div className="px-4 pt-3 pb-3 border-b border-paper-line/20">
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveProjectEdit(); if (e.key === "Escape") setEditingProject(false); }}
            className="w-full bg-transparent border-b border-paper-line outline-none pb-1.5 text-paper-ink"
            style={{ fontFamily: "var(--font-body)", fontSize: 15 }}
          />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {PROJECT_COLORS.map((c) => (
              <button key={c} onClick={() => setEditColor(c)}
                className="w-7 h-7 rounded-full active:scale-95 transition-transform"
                style={{ backgroundColor: c, outline: c === editColor ? `3px solid ${c}` : "none", outlineOffset: 2, boxShadow: c === editColor ? "0 0 0 1px rgba(255,255,255,0.7) inset" : "none" }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={saveProjectEdit} className="px-3 py-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: editColor, fontFamily: "var(--font-body)" }}>
              Save
            </button>
            <button onClick={() => setEditingProject(false)} className="text-xs px-2 py-1.5 text-paper-ink-light"
              style={{ fontFamily: "var(--font-body)" }}>
              Cancel
            </button>
            <button onClick={() => { onArchiveClient(client.id); setEditingProject(false); }} className="text-xs px-2 py-1.5"
              style={{ color: "#1a759f", fontFamily: "var(--font-body)" }}>
              Archive
            </button>
            <button onClick={handleDeleteProject} className="text-xs px-2 py-1.5 ml-auto"
              style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>
              Delete
            </button>
          </div>
        </div>
      )}

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
            className="w-full bg-transparent outline-none resize-none text-base leading-relaxed text-paper-ink placeholder:text-paper-ink-light/50"
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pending.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {pending.map((t) => (
              <SortableTaskItem
                key={t.id}
                t={t}
                client={client}
                editingId={editingId}
                editingText={editingText}
                editDueRef={editDueRef}
                tappingDate={tappingDate}
                onStartEdit={startEdit}
                onSaveEdit={saveEditWithDue}
                onCancelEdit={() => setEditingId(null)}
                onSetEditText={setEditingText}
                onConfirmDelete={confirmDelete}
                onArchive={(t) => onArchiveTask(client.id, t.id)}
                onRemove={(t) => onRemoveTask(client.id, t.id)}
                onToggle={(t) => onToggleTask(client.id, t.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {done.length > 0 && (
          <details>
            <summary className="text-[14px] cursor-pointer list-none select-none text-paper-ink-light py-2" style={{ fontFamily: "var(--font-body)" }}>▸ {done.length} done</summary>
            {done.map((t) => (
              <SwipeRow key={t.id} onArchive={() => onArchiveTask(client.id, t.id)} onDelete={() => onRemoveTask(client.id, t.id)} archiveColor={client.color}>
                <div className="border-b border-paper-line/20 flex items-center gap-3 py-2.5 px-1 bg-white/10">
                  <DueBadge due={t.dueDate} />
                  <span className="flex-1 text-base line-through opacity-40 text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>{t.text}</span>
                  <button onClick={() => onToggleTask(client.id, t.id)} className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: client.color, backgroundColor: client.color }}>
                    <svg width="7" height="5" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </SwipeRow>
            ))}
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

interface SortableProjectCardProps {
  client: Client;
  tasks: ClientTask[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onUpdateClient: (c: Client) => void;
  onRemoveClient: (id: string) => void;
  onArchiveClient: (id: string) => void;
  onAddTask: (clientId: string, text: string, due?: string | null) => Promise<ClientTask>;
  onToggleTask: (clientId: string, taskId: string) => void;
  onArchiveTask: (clientId: string, taskId: string) => void;
  onRemoveTask: (clientId: string, taskId: string) => void;
  onUpdateTask: (clientId: string, task: ClientTask) => void;
}

function SortableProjectCard({
  client, tasks, openId, setOpenId,
  onUpdateClient, onRemoveClient, onArchiveClient,
  onAddTask, onToggleTask, onArchiveTask, onRemoveTask, onUpdateTask,
}: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: client.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : "auto",
    position: "relative",
  };
  const isOpen = openId === client.id;

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      {/* Project header */}
      <div className="flex items-stretch w-full" style={{ backgroundColor: client.color }}>
        {/* Grip handle */}
        <button
          {...listeners}
          {...attributes}
          className="flex items-center justify-center px-3 touch-none flex-shrink-0 active:opacity-60"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
        >
          <GripIcon />
        </button>
        {/* Accordion toggle */}
        <button
          onClick={() => setOpenId(isOpen ? null : client.id)}
          className="flex-1 flex items-center justify-between px-4 py-3 text-left active:opacity-80 transition-opacity"
        >
          <span className="text-sm font-bold tracking-[0.18em] uppercase text-white" style={{ fontFamily: "var(--font-body)" }}>{client.name}</span>
          <span className="text-white text-lg font-light opacity-70">{isOpen ? "∨" : "›"}</span>
        </button>
      </div>

      {/* Accordion panel */}
      {isOpen && (
        <ProjectPanel
          client={client}
          tasks={tasks}
          onUpdateClient={onUpdateClient}
          onRemoveClient={(id) => { onRemoveClient(id); setOpenId(null); }}
          onArchiveClient={(id) => { onArchiveClient(id); setOpenId(null); }}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onArchiveTask={onArchiveTask}
          onRemoveTask={onRemoveTask}
          onUpdateTask={onUpdateTask}
        />
      )}
    </div>
  );
}

export function MobileProjects({
  clients, tasksByClient,
  onAddClient, onUpdateClient, onRemoveClient, onArchiveClient, onUnarchiveClient,
  onAddClientTask, onToggleClientTask, onArchiveClientTask, onRemoveClientTask, onUpdateClientTask,
  onOpenDrawer,
}: MobileProjectsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[4]);
  const [projectOrder, setProjectOrder] = useState<string[]>(loadProjectOrder);
  const inputRef = useRef<HTMLInputElement>(null);

  const projectSensors = useSensors(useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }));

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const commit = async () => {
    if (!name.trim()) return;
    await onAddClient(name.trim(), color);
    setName(""); setColor(PROJECT_COLORS[4]); setAdding(false);
  };

  const activeClients = clients.filter((c) => !c.archived);
  const orderedClients = [...activeClients].sort((a, b) => {
    const ai = projectOrder.indexOf(a.id);
    const bi = projectOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedClients.map((c) => c.id);
    const newOrder = arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
    setProjectOrder(newOrder);
    saveProjectOrder(newOrder);
  };

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
    <div className="flex flex-col h-dvh">
      <MobileScreenHeader title="Projects" onOpenDrawer={onOpenDrawer} />
      <MobileFooter />
      <div className="flex-1 overflow-y-auto bg-white/5 backdrop-blur-sm">
        {/* Add project — always at top */}
        {!adding ? (
          <button onClick={() => setAdding(true)} className="w-full py-3 text-sm font-bold tracking-[0.22em] uppercase text-white mb-[3px]"
            style={{ backgroundColor: PURPLE, fontFamily: "var(--font-body)" }}>
            + Add Project
          </button>
        ) : addForm}

        {/* Project list — sortable */}
        <DndContext sensors={projectSensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
          <SortableContext items={orderedClients.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-[3px]">
              {orderedClients.map((c) => (
                <SortableProjectCard
                  key={c.id}
                  client={c}
                  tasks={tasksByClient[c.id] ?? []}
                  openId={openId}
                  setOpenId={setOpenId}
                  onUpdateClient={onUpdateClient}
                  onRemoveClient={onRemoveClient}
                  onArchiveClient={onArchiveClient}
                  onAddTask={onAddClientTask}
                  onToggleTask={onToggleClientTask}
                  onArchiveTask={onArchiveClientTask}
                  onRemoveTask={onRemoveClientTask}
                  onUpdateTask={onUpdateClientTask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Archived projects */}
        {clients.some((c) => c.archived) && (
          <details className="mt-2 px-4 pb-4">
            <summary className="text-[11px] uppercase tracking-[0.2em] text-paper-ink-light py-2 cursor-pointer list-none select-none flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-body)" }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {clients.filter((c) => c.archived).length} archived
            </summary>
            <div className="mt-1 flex flex-col gap-1.5">
              {clients.filter((c) => c.archived).map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-sm"
                  style={{ backgroundColor: `${c.color}20`, border: `1px solid ${c.color}30` }}>
                  <span className="flex-1 text-xs uppercase tracking-[0.15em] text-paper-ink-light truncate" style={{ fontFamily: "var(--font-body)" }}>{c.name}</span>
                  <button onClick={() => onUnarchiveClient(c.id)}
                    className="text-[11px] text-paper-ink-light uppercase tracking-[0.12em] flex-shrink-0"
                    style={{ fontFamily: "var(--font-body)" }}>
                    restore
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
