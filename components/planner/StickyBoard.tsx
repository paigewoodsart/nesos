"use client";

import { useState, useCallback, useRef } from "react";
import { parseDueDate, dueDateUrgency, isWithinNextDays, isEventToday, formatEventTime, isoToMinutes } from "@/lib/dates";
import { noteTextColor } from "@/lib/colors";
import { DueBadge } from "@/components/shared/DueBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { AddTaskInput } from "@/components/shared/AddTaskInput";
import { AddGoalInline } from "@/components/shared/AddGoalInline";
import type { Client, ClientTask, Task, Goal, CalendarEvent } from "@/types";

// ── Client task row ─────────────────────────────────────────────

function ClientTaskRow({
  task, color, onToggle, onRemove, onSetDue, onArchive, onRename,
}: {
  task: ClientTask; color: string;
  onToggle: () => void; onRemove: () => void;
  onSetDue: (due: string | null) => void;
  onArchive: () => void; onRename: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [textDraft, setTextDraft] = useState(task.text);
  const editDueRef = useRef(task.dueDate ?? "");
  const tappingDate = useRef(false);
  const committed = useRef(false);

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    const t = textDraft.trim();
    if (t && t !== task.text) onRename(t); else setTextDraft(task.text);
    const newDue = editDueRef.current;
    if (newDue !== (task.dueDate ?? "")) onSetDue(newDue || null);
    setEditing(false);
    setTimeout(() => { committed.current = false; }, 200);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) onRemove();
  };

  return (
    <div className="group grid items-center gap-x-2 py-1" style={{ gridTemplateColumns: "72px 1fr 24px 20px" }}>
      {editing ? (
        <div className="col-span-4 flex items-center gap-2 py-0.5">
          <input
            autoFocus
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            onBlur={() => setTimeout(() => { if (tappingDate.current) return; commit(); }, 100)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="flex-1 text-sm bg-transparent border-b border-paper-ink-light/50 outline-none"
            style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
          />
          {/* Calendar — overlay input, ref-based to avoid re-render */}
          <div
            className="relative w-7 h-7 flex items-center justify-center flex-shrink-0"
            onMouseDown={() => { tappingDate.current = true; setTimeout(() => { tappingDate.current = false; }, 500); }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-paper-ink-light pointer-events-none">
              <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input type="date" defaultValue={task.dueDate ?? ""}
              onChange={(e) => { editDueRef.current = e.target.value; }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              style={{ fontSize: 16 }}
            />
          </div>
          {/* Check */}
          <button onMouseDown={(e) => { e.preventDefault(); commit(); }}
            className="flex-shrink-0 text-paper-ink-light hover:text-green-600 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Trash */}
          <button onMouseDown={(e) => { e.preventDefault(); handleDelete(); }}
            className="flex-shrink-0 text-paper-ink-light hover:text-red-400 transition-colors">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center min-w-0">
            <DueBadge due={task.dueDate} />
          </div>
          <span
            className={`text-sm leading-snug truncate cursor-text ${task.done ? "line-through opacity-50" : "font-medium"}`}
            style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
            onClick={() => { setTextDraft(task.text); editDueRef.current = task.dueDate ?? ""; committed.current = false; setEditing(true); }}
          >{task.text}</span>
          <button onClick={onToggle}
            className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center mx-auto"
            style={{ borderColor: task.done ? color : "rgba(26,26,26,0.25)", backgroundColor: task.done ? color : "transparent" }}>
            {task.done && <svg width="7" height="5" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
          <button onClick={onArchive}
            className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-paper-ink-light hover:text-paper-rust text-[13px] flex items-center justify-center"
            title="Archive task">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 4v7.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V4" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

function ArchivedTaskRow({ task }: { task: ClientTask }) {
  return (
    <div className="grid items-center gap-x-2 py-0.5 opacity-55" style={{ gridTemplateColumns: "72px 1fr" }}>
      <DueBadge due={task.dueDate} />
      <span className="text-xs leading-snug truncate line-through" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }} title={task.text}>{task.text}</span>
    </div>
  );
}

function AggregatedTaskRow({ task, clientColor, onToggle, onOpenProject }: {
  task: ClientTask & { clientName: string }; clientColor: string;
  onToggle: () => void; onOpenProject: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1 group">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: clientColor }} />
      <button
        onClick={onOpenProject}
        className="flex-1 min-w-0 text-left"
        title={`Open ${task.clientName}`}
      >
        <span className="block text-sm leading-snug truncate group-hover:underline decoration-dotted underline-offset-2"
          style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", textDecoration: task.done ? "line-through" : undefined, opacity: task.done ? 0.45 : 1 }}>
          {task.text}
        </span>
        <span className="block text-[10px] leading-none mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 truncate" style={{ fontFamily: "var(--font-body)", color: clientColor }}>
          {task.clientName}
        </span>
      </button>
      <DueBadge due={task.dueDate} />
      <button onClick={onToggle}
        className="flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center"
        style={{ borderColor: task.done ? clientColor : "rgba(26,26,26,0.22)", backgroundColor: task.done ? clientColor : "transparent" }}>
        {task.done && <svg width="7" height="5" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
    </div>
  );
}

function WeekTaskRow({ task, color, onToggle, onRemove, onRename }: {
  task: Task; color: string;
  onToggle: () => void; onRemove: () => void; onRename: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const commit = () => {
    const t = draft.trim();
    if (t && t !== task.text) onRename(t); else setDraft(task.text);
    setEditing(false);
  };
  return (
    <div className="group flex items-start gap-2 py-1.5">
      <button onClick={onToggle}
        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center"
        style={{ borderColor: task.completed ? color : "rgba(26,26,26,0.25)", backgroundColor: task.completed ? color : "transparent" }}>
        {task.completed && <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
      {editing ? (
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(task.text); setEditing(false); } }}
          className="flex-1 text-sm bg-transparent border-b border-paper-ink-light/50 outline-none font-medium"
          style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-text ${task.completed ? "line-through opacity-50" : "font-medium"}`}
          style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}
          onDoubleClick={() => { setDraft(task.text); setEditing(true); }}
        >{task.text}</span>
      )}
      <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-paper-ink-light hover:text-paper-rust text-base font-bold transition-opacity">×</button>
    </div>
  );
}

function MeetingRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] font-medium text-paper-ink-light w-10 flex-shrink-0" style={{ fontFamily: "var(--font-serif)" }}>{formatEventTime(event.start)}</span>
      <span className="flex-1 text-sm truncate" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}>{event.summary}</span>
    </div>
  );
}

function TaskColumnHeaders() {
  return (
    <div className="grid gap-x-2 mb-1 pb-1 border-b" style={{ gridTemplateColumns: "72px 1fr 24px 20px", borderColor: "rgba(26,26,26,0.08)" }}>
      <span className="text-[9px] uppercase tracking-widest text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>Due</span>
      <span className="text-[9px] uppercase tracking-widest text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>Task</span>
      <span className="text-[9px] uppercase tracking-widest text-paper-ink-light text-center" style={{ fontFamily: "var(--font-body)" }}>✓</span>
      <span />
    </div>
  );
}

function GoalRow({ goal, color, onToggle, onRemove, onRename }: {
  goal: Goal; color: string;
  onToggle: (id: string) => void; onRemove: (id: string) => void; onRename: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.text);

  const commit = () => {
    const t = draft.trim();
    if (t && t !== goal.text) onRename(goal.id, t); else setDraft(goal.text);
    setEditing(false);
  };

  return (
    <div className="group flex items-start gap-2 py-1">
      <button onClick={() => onToggle(goal.id)}
        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center"
        style={{ borderColor: goal.completed ? color : "rgba(26,26,26,0.22)", backgroundColor: goal.completed ? color : "transparent" }}>
        {goal.completed && <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
      {editing ? (
        <input autoFocus value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(goal.text); setEditing(false); } }}
          className="flex-1 text-sm bg-transparent border-b border-paper-ink-light/50 outline-none font-medium"
          style={{ fontFamily: "var(--font-serif)", color }}
        />
      ) : (
        <span
          className={`flex-1 text-sm leading-snug cursor-text ${goal.completed ? "line-through opacity-50" : "font-medium"}`}
          style={{ fontFamily: "var(--font-serif)", color: goal.completed ? "#1A1A1A" : color }}
          onDoubleClick={() => { setDraft(goal.text); setEditing(true); }}
          title="Double-click to edit"
        >
          {goal.text}
        </span>
      )}
      <button onClick={() => onRemove(goal.id)} className="opacity-0 group-hover:opacity-100 text-paper-ink-light hover:text-paper-rust text-base font-bold transition-opacity">×</button>
    </div>
  );
}

function AddWeekTaskInline({ onAdd, color }: { onAdd: (text: string) => void; color: string }) {
  const [v, setV] = useState("");
  const commit = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  return (
    <div className="flex items-center gap-2">
      <span className="text-base font-bold flex-shrink-0" style={{ color }}>+</span>
      <input value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit()} onBlur={commit}
        placeholder="add task..."
        className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-paper-ink-light font-medium"
        style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}
      />
    </div>
  );
}

// ── System config ───────────────────────────────────────────────

const SYSTEM_COLORS = [
  "#F4956A", "#D4909E",
  "#d9ed92", "#b5e48c", "#99d98c", "#76c893",
  "#52b69a", "#40b07a", "#34a0a4", "#2d8f8f",
  "#168aad", "#00b4d8", "#1a759f", "#5fa8d3",
  "#1e6091", "#0077b6", "#184e77", "#023e8a",
];

const WARM_COLORS = [
  // Blush / light pink
  "#ffdde1", "#ffb3c1", "#ff8fa3",
  // Raspberry / rose
  "#D4909E", "#c06b7a", "#a84d5e",
  // Coral
  "#ff7f7f", "#ff6b6b", "#e05252",
  // Peach / salmon
  "#ffcba4", "#ffb085", "#F4956A",
  // Amber / warm orange
  "#ffd19a", "#ffab5e", "#f08030",
  // Warm yellow / gold
  "#fff3b0", "#ffe066", "#f5c842",
  // Mauve / warm lavender
  "#d4a5c9", "#c490b8", "#9a6ab5",
];

const CLIENT_COLORS_PALETTE = [
  // Lime / yellow-green
  "#d9ed92", "#b5e48c",
  // Mid green
  "#99d98c", "#76c893", "#52b69a", "#40b07a",
  // Teal
  "#34a0a4", "#2d8f8f",
  // Sky / light blue
  "#00b4d8", "#5fa8d3",
  // Medium blue
  "#168aad", "#1a759f", "#0077b6",
  // Deep blue
  "#1e6091", "#184e77", "#023e8a",
  // Navy
  "#0d3b6e", "#03045e",
  // Slate blue-green
  "#457b9d", "#264653",
];

interface SystemConfig { color: string; title: string; }
type SystemKey = "__today__" | "__week__" | "__goals__" | "__braindump__" | "__overdue__";

const SYSTEM_DEFAULTS: Record<SystemKey, SystemConfig> = {
  "__overdue__":   { color: "#e05252", title: "Overdue" },
  "__today__":     { color: "#D4909E", title: "Today" },
  "__week__":      { color: "#F4956A", title: "This Week" },
  "__goals__":     { color: "#F4956A", title: "Goals" },
  "__braindump__": { color: "#F4956A", title: "Notes" },
};

function loadSystemConfig(): Record<SystemKey, SystemConfig> {
  try {
    const saved = JSON.parse(localStorage.getItem("sticky-system-config") ?? "{}");
    return {
      "__overdue__":   { ...SYSTEM_DEFAULTS["__overdue__"],   ...saved["__overdue__"] },
      "__today__":     { ...SYSTEM_DEFAULTS["__today__"],     ...saved["__today__"] },
      "__week__":      { ...SYSTEM_DEFAULTS["__week__"],      ...saved["__week__"] },
      "__goals__":     { ...SYSTEM_DEFAULTS["__goals__"],     ...saved["__goals__"] },
      "__braindump__": { ...SYSTEM_DEFAULTS["__braindump__"], ...saved["__braindump__"] },
    };
  } catch { return { ...SYSTEM_DEFAULTS }; }
}

function saveSystemConfig(cfg: Record<SystemKey, SystemConfig>) {
  localStorage.setItem("sticky-system-config", JSON.stringify(cfg));
}

function loadClientOrder(): string[] {
  try { return JSON.parse(localStorage.getItem("client-order") ?? "[]"); } catch { return []; }
}
function saveClientOrder(order: string[]) {
  localStorage.setItem("client-order", JSON.stringify(order));
}

// ── NotePanel ───────────────────────────────────────────────────

const LINED_BODY: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(26,26,26,0.04) 23px, rgba(26,26,26,0.04) 24px)",
  backgroundSize: "100% 24px",
  backgroundPositionY: "12px",
};

function NotePanel({
  title, color, children, footer, className = "", style: styleProp,
  onTitleChange, onColorChange, colorOptions, onDelete,
  collapsed = false, onToggleCollapse,
}: {
  title: string; color: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onTitleChange?: (t: string) => void;
  onColorChange?: (c: string) => void;
  colorOptions?: string[];
  onDelete?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const textColor = noteTextColor(color);
  const isEditable = !!(onTitleChange || onColorChange || onDelete);

  const commitTitle = () => {
    const t = titleDraft.trim();
    if (t && t !== title) onTitleChange?.(t); else setTitleDraft(title);
    setEditing(false);
  };

  return (
    <div className={`flex flex-col overflow-hidden ${className}`}
      style={{ boxShadow: "3px 5px 18px rgba(26,26,26,0.11), 1px 1px 0 rgba(26,26,26,0.04)", ...styleProp }}>

      {/* Header band */}
      <div className="group/header flex items-center gap-1.5 px-3 py-2.5 flex-shrink-0" style={{ backgroundColor: color }}>
        {/* Grip icon — drag affordance */}
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none"
          className="flex-shrink-0 opacity-0 group-hover/header:opacity-40 transition-opacity mr-1"
          style={{ color: textColor }}>
          <circle cx="2" cy="2" r="1.1" fill="currentColor"/>
          <circle cx="6" cy="2" r="1.1" fill="currentColor"/>
          <circle cx="2" cy="6" r="1.1" fill="currentColor"/>
          <circle cx="6" cy="6" r="1.1" fill="currentColor"/>
          <circle cx="2" cy="10" r="1.1" fill="currentColor"/>
          <circle cx="6" cy="10" r="1.1" fill="currentColor"/>
        </svg>

        <span className="flex-1 text-xs font-semibold uppercase tracking-[0.2em] truncate"
          style={{ fontFamily: "var(--font-body)", color: textColor, opacity: textColor === "#FFFFFF" ? 0.9 : 0.72 }}>
          {title}
        </span>

        {isEditable && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => { setTitleDraft(title); setEditing((v) => !v); }}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-sm transition-opacity opacity-0 group-hover/header:opacity-60 hover:!opacity-100"
            style={{ color: textColor }}>
            {editing
              ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M2 2l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-6 6-2.5.5.5-2.5 6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </button>
        )}

        {onToggleCollapse && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onToggleCollapse}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-sm transition-opacity opacity-0 group-hover/header:opacity-60 hover:!opacity-100"
            style={{ color: textColor }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              {collapsed
                ? <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M2 6.5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
          </button>
        )}
      </div>

      {/* Inline edit panel */}
      {editing && !collapsed && (
        <div className="px-4 py-3 space-y-3 flex-shrink-0" style={{ backgroundColor: `${color}20`, borderBottom: `1px solid ${color}30` }}>
          {onTitleChange && (
            <input
              autoFocus value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") { setTitleDraft(title); setEditing(false); } }}
              onBlur={commitTitle}
              className="w-full text-sm font-semibold bg-white/60 border-b-2 border-paper-ink-light/30 outline-none px-2 py-1 text-paper-ink"
              style={{ fontFamily: "var(--font-serif)" }}
            />
          )}
          {onColorChange && colorOptions && (
            <div className="flex flex-wrap gap-1.5">
              {colorOptions.map((c) => (
                <button key={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onColorChange(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: c === color ? "2px solid rgba(26,26,26,0.5)" : "none", outlineOffset: 2 }}
                />
              ))}
            </div>
          )}
          {onDelete && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { if (confirm("Remove this project?")) { onDelete(); setEditing(false); } }}
              className="w-full py-1.5 text-xs uppercase tracking-[0.15em] text-paper-ink-light hover:text-white hover:bg-paper-ink transition-colors border border-paper-line/40"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Remove project
            </button>
          )}
        </div>
      )}

      {/* Frosted glass body — hidden when collapsed */}
      {!collapsed && (
        <div className="flex flex-col min-h-0 flex-1"
          style={{
            backgroundColor: `${color}18`,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderLeft: "1px solid rgba(255,255,255,0.45)",
            borderRight: "1px solid rgba(255,255,255,0.45)",
            borderBottom: "1px solid rgba(255,255,255,0.45)",
          }}>
          <div className="flex-1 overflow-y-auto px-4 py-3" style={LINED_BODY}>
            {children}
          </div>
          {footer && (
            <div className="px-4 py-2 flex-shrink-0 border-t" style={{ borderColor: "rgba(26,26,26,0.07)", backgroundColor: "rgba(26,26,26,0.015)" }}>
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Project inline ──────────────────────────────────────────

function AddProjectInline({ onAdd }: { onAdd: (name: string, color: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CLIENT_COLORS_PALETTE[0]);

  const commit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName(""); setColor(CLIENT_COLORS_PALETTE[0]); setOpen(false);
  };

  return (
    <div className="overflow-hidden" style={{ boxShadow: "2px 3px 10px rgba(26,26,26,0.08)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: "#9b72cf" }}>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] flex-1" style={{ fontFamily: "var(--font-body)", color: "#FFFFFF", opacity: 0.9 }}>
          + Add Project
        </span>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-3"
          style={{
            backgroundColor: "#9b72cf18",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderLeft: "1px solid rgba(255,255,255,0.45)",
            borderRight: "1px solid rgba(255,255,255,0.45)",
            borderBottom: "1px solid rgba(255,255,255,0.45)",
          }}>
          <input autoFocus type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="Project name..."
            className="w-full text-sm border-b-2 border-paper-ink-light/40 bg-transparent outline-none pb-1 font-medium placeholder:text-paper-ink-light"
            style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A" }}
          />
          <div className="flex gap-1.5 flex-wrap">
            {CLIENT_COLORS_PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={commit} disabled={!name.trim()}
              className="flex-1 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: color, fontFamily: "var(--font-serif)" }}>
              Add {name.trim() || "project"}
            </button>
            <button onClick={() => setOpen(false)}
              className="px-3 text-sm text-paper-ink-light hover:text-paper-ink"
              style={{ fontFamily: "var(--font-serif)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Props & main component ──────────────────────────────────────

interface StickyBoardProps {
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  events: CalendarEvent[];
  onAddClientTask: (clientId: string, text: string, dueDate?: string) => void;
  onToggleClientTask: (clientId: string, taskId: string) => void;
  onRemoveClientTask: (clientId: string, taskId: string) => void;
  onUpdateClientTask: (clientId: string, task: ClientTask) => void;
  onArchiveClientTask: (clientId: string, taskId: string) => void;
  onAddClient: (name: string, color: string) => Promise<Client>;
  onUpdateClient: (client: Client) => void;
  onRemoveClient: (id: string) => void;
  weekTasks: Task[];
  onAddWeekTask: (text: string) => void;
  onToggleWeekTask: (id: string) => void;
  onRemoveWeekTask: (id: string) => void;
  onRenameWeekTask: (id: string, text: string) => void;
  weekGoals: Goal[];
  longtermGoals: Goal[];
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onRenameGoal: (id: string, text: string) => void;
  onAddGoal: (text: string, type: "weekly" | "longterm") => void;
  brainDump: string;
  onBrainDumpChange: (text: string) => void;
}

export function StickyBoard({
  clients, tasksByClient, events,
  onAddClientTask, onToggleClientTask, onRemoveClientTask, onUpdateClientTask, onArchiveClientTask,
  onAddClient, onUpdateClient, onRemoveClient,
  weekTasks, onAddWeekTask, onToggleWeekTask, onRemoveWeekTask, onRenameWeekTask,
  weekGoals, longtermGoals, onToggleGoal, onRemoveGoal, onRenameGoal, onAddGoal,
  brainDump, onBrainDumpChange,
}: StickyBoardProps) {
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [systemConfig, setSystemConfig] = useState<Record<SystemKey, SystemConfig>>(() => loadSystemConfig());
  const [clientOrder, setClientOrder] = useState<string[]>(() => loadClientOrder());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [leftOrder, setLeftOrder] = useState<["__goals__", "__braindump__"] | ["__braindump__", "__goals__"]>(() => {
    try { return JSON.parse(localStorage.getItem("left-panel-order") ?? "null") ?? ["__goals__", "__braindump__"]; } catch { return ["__goals__", "__braindump__"]; }
  });
  const [rightOrder, setRightOrder] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("right-panel-order") ?? "null");
      if (Array.isArray(saved) && saved.includes("__overdue__")) return saved;
      return ["__overdue__", "__today__", "__week__"];
    } catch { return ["__overdue__", "__today__", "__week__"]; }
  });
  const [panelDragKey, setPanelDragKey] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("panel-collapsed") ?? "{}"); } catch { return {}; }
  });
  const togglePanelCollapse = (key: string) => {
    setPanelCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("panel-collapsed", JSON.stringify(next));
      return next;
    });
  };

  const updateSystemConfig = useCallback((key: SystemKey, patch: Partial<SystemConfig>) => {
    setSystemConfig((prev) => {
      const next = { ...prev, [key]: { ...prev[key], ...patch } };
      saveSystemConfig(next);
      return next;
    });
  }, []);

  // ── Aggregated data ─────────────────────────────────────────────
  const allClientTasks = clients.flatMap((c) =>
    (tasksByClient[c.id] ?? []).filter((t) => !t.archived)
      .map((t) => ({ ...t, clientName: c.name, clientColor: c.color }))
  );

  const todayTasks = allClientTasks.filter((t) => {
    const d = parseDueDate(t.dueDate);
    return d ? isWithinNextDays(d, 1) : false;
  });

  const todayMeetings = events
    .filter((e) => !e.isAllDay && isEventToday(e.start))
    .sort((a, b) => isoToMinutes(a.start) - isoToMinutes(b.start));

  const weekTasks7 = allClientTasks
    .filter((t) => { const d = parseDueDate(t.dueDate); return d ? isWithinNextDays(d, 7) : false; })
    .sort((a, b) => parseDueDate(a.dueDate)!.getTime() - parseDueDate(b.dueDate)!.getTime());

  const weekMeetings = events
    .filter((e) => !e.isAllDay)
    .sort((a, b) => isoToMinutes(a.start) - isoToMinutes(b.start));

  const manualPending = weekTasks.filter((t) => !t.completed);
  const manualDone = weekTasks.filter((t) => t.completed);
  const weekColor = systemConfig["__week__"].color;

const overdueItems = allClientTasks
    .filter((t) => !t.done && dueDateUrgency(t.dueDate) === "overdue")
    .sort((a, b) => parseDueDate(a.dueDate)!.getTime() - parseDueDate(b.dueDate)!.getTime());

  const activeClient = activeClientId ? clients.find((c) => c.id === activeClientId) ?? null : null;

  return (
    <div className="flex-1 flex overflow-hidden board-breathe">

      {/* ── Col 1: Goals + Brain Dump + Add Project (draggable order) ── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 p-3 overflow-hidden border-r border-white/20">
        {leftOrder.map((key) => {
          const isGoals = key === "__goals__";
          return (
            <div
              key={key}
              draggable
              onDragStart={() => setPanelDragKey(key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (panelDragKey && panelDragKey !== key) {
                  const next: typeof leftOrder = [key, leftOrder.find(k => k !== key)!] as typeof leftOrder;
                  setLeftOrder(next);
                  localStorage.setItem("left-panel-order", JSON.stringify(next));
                }
                setPanelDragKey(null);
              }}
              onDragEnd={() => setPanelDragKey(null)}
              style={{ flex: panelCollapsed[key] ? "0 0 auto" : (isGoals ? 2 : 1), minHeight: 0, opacity: panelDragKey === key ? 0.4 : 1, cursor: "grab" }}
              className="flex flex-col overflow-hidden"
            >
              {isGoals ? (
                <NotePanel
                  title={systemConfig["__goals__"].title}
                  color={systemConfig["__goals__"].color}
                  colorOptions={WARM_COLORS}
                  onTitleChange={(title) => updateSystemConfig("__goals__", { title })}
                  onColorChange={(color) => updateSystemConfig("__goals__", { color })}
                  collapsed={!!panelCollapsed["__goals__"]}
                  onToggleCollapse={() => togglePanelCollapse("__goals__")}
                  className="flex-1"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.6 }}>This Week</p>
                  {weekGoals.length === 0 && <p className="text-xs italic mb-2" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", opacity: 0.45 }}>No goals yet.</p>}
                  {weekGoals.map((g) => <GoalRow key={g.id} goal={g} color="#168aad" onToggle={onToggleGoal} onRemove={onRemoveGoal} onRename={onRenameGoal} />)}
                  <AddGoalInline onAdd={(t) => onAddGoal(t, "weekly")} color="#168aad" placeholder="add weekly goal..." />
                  <div className="mt-3 mb-2 border-t" style={{ borderColor: "rgba(26,26,26,0.08)" }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.6 }}>Long-Term</p>
                  {longtermGoals.length === 0 && <p className="text-xs italic mb-2" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", opacity: 0.45 }}>Dream big.</p>}
                  {longtermGoals.map((g) => <GoalRow key={g.id} goal={g} color="#34a0a4" onToggle={onToggleGoal} onRemove={onRemoveGoal} onRename={onRenameGoal} />)}
                  <AddGoalInline onAdd={(t) => onAddGoal(t, "longterm")} color="#34a0a4" placeholder="add long-term goal..." />
                </NotePanel>
              ) : (
                <NotePanel
                  title={systemConfig["__braindump__"].title}
                  color={systemConfig["__braindump__"].color}
                  colorOptions={WARM_COLORS}
                  onTitleChange={(title) => updateSystemConfig("__braindump__", { title })}
                  onColorChange={(color) => updateSystemConfig("__braindump__", { color })}
                  collapsed={!!panelCollapsed["__braindump__"]}
                  onToggleCollapse={() => togglePanelCollapse("__braindump__")}
                  className="flex-1"
                >
                  <textarea
                    value={brainDump}
                    onChange={(e) => onBrainDumpChange(e.target.value)}
                    placeholder="dump it all here — no judgment, no structure needed."
                    className="w-full h-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-paper-ink-light/70"
                    style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "#1A1A1A", minHeight: 80 }}
                  />
                </NotePanel>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Col 2: Project list ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col gap-2 p-3 overflow-y-auto border-r border-white/20">
        {(() => {
          const orderMap = new Map(clientOrder.map((id, i) => [id, i]));
          const ordered = [...clients].sort((a, b) => {
            const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : clients.length;
            const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : clients.length;
            return ai - bi;
          });
          return ordered.map((c, i) => {
          const active = activeClientId === c.id;
          const tc = noteTextColor(c.color);
          const isDragging = dragId === c.id;
          return (
            <div key={c.id} className="relative">
              {dropIndex === i && dragId !== c.id && (
                <div className="absolute -top-1 left-0 right-0 h-0.5 rounded-full z-10" style={{ backgroundColor: c.color }} />
              )}
              <button
                draggable
                onClick={() => setActiveClientId(active ? null : c.id)}
                onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { e.preventDefault(); setDropIndex(i); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === c.id) return;
                  const fromIdx = ordered.findIndex(x => x.id === dragId);
                  const newOrder = ordered.map(x => x.id);
                  newOrder.splice(fromIdx, 1);
                  newOrder.splice(i, 0, dragId);
                  setClientOrder(newOrder);
                  saveClientOrder(newOrder);
                  setDragId(null); setDropIndex(null);
                }}
                onDragEnd={() => { setDragId(null); setDropIndex(null); }}
                className="w-full flex items-center gap-2 px-3 py-3 text-left transition-all group/bar"
                style={{
                  backgroundColor: c.color,
                  opacity: isDragging ? 0.4 : active ? 1 : 0.82,
                  boxShadow: active ? "3px 5px 18px rgba(26,26,26,0.18), 0 0 0 2px rgba(26,26,26,0.18)" : "2px 3px 8px rgba(26,26,26,0.10)",
                  cursor: "grab",
                }}
              >
                <svg width="10" height="14" viewBox="0 0 10 14" fill="none"
                  className="flex-shrink-0 opacity-0 group-hover/bar:opacity-40 transition-opacity"
                  style={{ color: tc }}>
                  <circle cx="3" cy="2" r="1.2" fill="currentColor"/>
                  <circle cx="7" cy="2" r="1.2" fill="currentColor"/>
                  <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
                  <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
                  <circle cx="3" cy="12" r="1.2" fill="currentColor"/>
                  <circle cx="7" cy="12" r="1.2" fill="currentColor"/>
                </svg>
              <span className="flex-1 text-xs font-semibold uppercase tracking-[0.2em] truncate"
                style={{ fontFamily: "var(--font-body)", color: tc, opacity: tc === "#FFFFFF" ? 0.9 : 0.72 }}>
                {c.name}
              </span>
              <span style={{ color: tc, opacity: 0.45, fontSize: 14 }}>›</span>
              </button>
            </div>
          );
          });
        })()}
        <AddProjectInline onAdd={async (name, color) => {
          const client = await onAddClient(name, color);
          setActiveClientId(client.id);
        }} />
      </div>

      {/* ── Col 3: Project workspace ── */}
      <div className="flex-1 p-3 overflow-y-auto min-w-0">
        {activeClient ? (() => {
          const allTasks = tasksByClient[activeClient.id] ?? [];
          const active = allTasks.filter((t) => !t.archived);
          const archived = allTasks.filter((t) => t.archived);
          const doneCount = active.filter((t) => t.done).length;
          const sortedActive = [...active].sort((a, b) => {
            const da = parseDueDate(a.dueDate), db = parseDueDate(b.dueDate);
            if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
            return da.getTime() - db.getTime();
          });
          return (
            <NotePanel
              title={activeClient.name}
              color={activeClient.color}
              className="h-full"
              colorOptions={CLIENT_COLORS_PALETTE}
              onTitleChange={(name) => onUpdateClient({ ...activeClient, name })}
              onColorChange={(color) => onUpdateClient({ ...activeClient, color })}
              onDelete={() => { onRemoveClient(activeClient.id); setActiveClientId(null); }}
              footer={<ProgressBar done={doneCount} total={active.length} color={activeClient.color} />}
            >
              {/* Project notes */}
              <textarea
                key={activeClient.id}
                defaultValue={activeClient.notes ?? ""}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val !== (activeClient.notes ?? "")) onUpdateClient({ ...activeClient, notes: val });
                }}
                placeholder="project notes..."
                rows={2}
                className="w-full text-xs bg-transparent border-b border-paper-line/30 outline-none resize-none text-paper-ink leading-relaxed pb-1 mb-3 italic"
                style={{ fontFamily: "var(--font-serif)" }}
              />

              {sortedActive.length === 0 && archived.length === 0 && (
                <p className="text-xs italic pb-1" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", opacity: 0.5 }}>No tasks yet.</p>
              )}
              {sortedActive.length > 0 && (
                <>
                  <TaskColumnHeaders />
                  {sortedActive.map((t) => (
                    <ClientTaskRow key={t.id} task={t} color={activeClient.color}
                      onToggle={() => onToggleClientTask(activeClient.id, t.id)}
                      onRemove={() => onRemoveClientTask(activeClient.id, t.id)}
                      onSetDue={(due) => onUpdateClientTask(activeClient.id, { ...t, dueDate: due })}
                      onArchive={() => onArchiveClientTask(activeClient.id, t.id)}
                      onRename={(text) => onUpdateClientTask(activeClient.id, { ...t, text })}
                    />
                  ))}
                </>
              )}
              {archived.length > 0 && (
                <details className="mt-2">
                  <summary className="text-[10px] italic cursor-pointer list-none flex items-center gap-1 pb-1 select-none" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", opacity: 0.45 }}>
                    ▸ {archived.length} archived
                  </summary>
                  <div className="mt-1 space-y-0.5">
                    {archived.map((t) => <ArchivedTaskRow key={t.id} task={t} />)}
                  </div>
                </details>
              )}
              <AddTaskInput color={activeClient.color} onAdd={(text, due) => onAddClientTask(activeClient.id, text, due)} />
            </NotePanel>
          );
        })() : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm italic text-paper-ink-light" style={{ fontFamily: "var(--font-serif)" }}>← select a project</p>
          </div>
        )}
      </div>

      {/* ── Col 4: Today + This Week (draggable order) ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 p-3 overflow-hidden border-l border-white/20">
        {rightOrder.map((key) => {
          const flexSize = key === "__week__" ? 2 : 1;
          return (
            <div
              key={key}
              draggable
              onDragStart={() => setPanelDragKey(key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (panelDragKey && panelDragKey !== key) {
                  const from = rightOrder.indexOf(panelDragKey);
                  const to = rightOrder.indexOf(key);
                  const next = [...rightOrder];
                  next.splice(from, 1);
                  next.splice(to, 0, panelDragKey);
                  setRightOrder(next);
                  localStorage.setItem("right-panel-order", JSON.stringify(next));
                }
                setPanelDragKey(null);
              }}
              onDragEnd={() => setPanelDragKey(null)}
              style={{ flex: panelCollapsed[key] ? "0 0 auto" : flexSize, minHeight: 0, opacity: panelDragKey === key ? 0.4 : 1, cursor: "grab" }}
              className="flex flex-col overflow-hidden"
            >
              {key === "__overdue__" ? (
                <NotePanel
                  title={systemConfig["__overdue__"].title}
                  color={systemConfig["__overdue__"].color}
                  colorOptions={WARM_COLORS}
                  onTitleChange={(title) => updateSystemConfig("__overdue__", { title })}
                  onColorChange={(color) => updateSystemConfig("__overdue__", { color })}
                  collapsed={!!panelCollapsed["__overdue__"]}
                  onToggleCollapse={() => togglePanelCollapse("__overdue__")}
                  className="flex-1"
                >
                  {overdueItems.length === 0 ? (
                    <p className="text-xs italic" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", opacity: 0.5 }}>Nothing overdue.</p>
                  ) : (
                    overdueItems.map((t) => (
                      <AggregatedTaskRow key={t.id} task={t} clientColor={t.clientColor}
                        onToggle={() => onToggleClientTask(t.clientId, t.id)}
                        onOpenProject={() => setActiveClientId(t.clientId)}
                      />
                    ))
                  )}
                </NotePanel>
              ) : key === "__today__" ? (
                <NotePanel
                  title={systemConfig["__today__"].title}
                  color={systemConfig["__today__"].color}
                  colorOptions={WARM_COLORS}
                  onTitleChange={(title) => updateSystemConfig("__today__", { title })}
                  onColorChange={(color) => updateSystemConfig("__today__", { color })}
                  collapsed={!!panelCollapsed["__today__"]}
                  onToggleCollapse={() => togglePanelCollapse("__today__")}
                  className="flex-1"
                >
                  {todayMeetings.length === 0 && todayTasks.length === 0 && (
                    <p className="text-xs italic" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", opacity: 0.5 }}>Nothing due today.</p>
                  )}
                  {todayMeetings.length > 0 && (
                    <>
                      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>Meetings</p>
                      {todayMeetings.map((e) => <MeetingRow key={e.id} event={e} />)}
                    </>
                  )}
                  {todayTasks.length > 0 && (
                    <>
                      {todayMeetings.length > 0 && <div className="my-2 border-t" style={{ borderColor: "rgba(26,26,26,0.07)" }} />}
                      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>Due Today</p>
                      {todayTasks.map((t) => (
                        <AggregatedTaskRow key={t.id} task={t} clientColor={t.clientColor} onToggle={() => onToggleClientTask(t.clientId, t.id)} onOpenProject={() => setActiveClientId(t.clientId)} />
                      ))}
                    </>
                  )}
                </NotePanel>
              ) : key === "__week__" ? (
                <NotePanel
                  title={systemConfig["__week__"].title}
                  color={weekColor}
                  colorOptions={WARM_COLORS}
                  onTitleChange={(title) => updateSystemConfig("__week__", { title })}
                  onColorChange={(color) => updateSystemConfig("__week__", { color })}
                  collapsed={!!panelCollapsed["__week__"]}
                  onToggleCollapse={() => togglePanelCollapse("__week__")}
                  className="flex-1"
                >
                  {weekMeetings.length > 0 && (
                    <>
                      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>Meetings</p>
                      {weekMeetings.map((e) => <MeetingRow key={e.id} event={e} />)}
                      <div className="my-2 border-t" style={{ borderColor: "rgba(26,26,26,0.07)" }} />
                    </>
                  )}
                  {weekTasks7.length > 0 && (
                    <>
                      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>Due This Week</p>
                      {weekTasks7.map((t) => (
                        <AggregatedTaskRow key={t.id} task={t} clientColor={t.clientColor} onToggle={() => onToggleClientTask(t.clientId, t.id)} onOpenProject={() => setActiveClientId(t.clientId)} />
                      ))}
                      <div className="my-2 border-t" style={{ borderColor: "rgba(26,26,26,0.07)" }} />
                    </>
                  )}
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>On My Plate</p>
                  {manualPending.length === 0 && weekTasks7.length === 0 && weekMeetings.length === 0 && (
                    <p className="text-xs italic pb-1" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", opacity: 0.4 }}>Nothing yet.</p>
                  )}
                  {manualPending.map((t) => (
                    <WeekTaskRow key={t.id} task={t} color={weekColor}
                      onToggle={() => onToggleWeekTask(t.id)}
                      onRemove={() => onRemoveWeekTask(t.id)}
                      onRename={(text) => onRenameWeekTask(t.id, text)}
                    />
                  ))}
                  {manualDone.length > 0 && (
                    <details className="mt-1">
                      <summary className="text-[10px] italic cursor-pointer list-none flex items-center gap-1 pb-1 select-none" style={{ fontFamily: "var(--font-serif)", color: "#1A1A1A", opacity: 0.5 }}>▸ {manualDone.length} done</summary>
                      {manualDone.map((t) => (
                        <WeekTaskRow key={t.id} task={t} color={weekColor}
                          onToggle={() => onToggleWeekTask(t.id)}
                          onRemove={() => onRemoveWeekTask(t.id)}
                          onRename={(text) => onRenameWeekTask(t.id, text)}
                        />
                      ))}
                    </details>
                  )}
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: `${weekColor}25` }}>
                    <AddWeekTaskInline onAdd={onAddWeekTask} color={weekColor} />
                  </div>
                </NotePanel>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
