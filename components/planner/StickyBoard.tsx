"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { parseDueDate, dueDateUrgency, isWithinNextDays, isEventToday, formatEventTime, isoToMinutes } from "@/lib/dates";
import { noteTextColor, noteTextColorWarm } from "@/lib/colors";
import { NEUTRAL_SYSTEM_DEFAULTS, NEUTRAL_PROJECT_DEFAULT_COLOR, NEUTRAL_WARM_COLORS, NEUTRAL_CLIENT_COLORS_PALETTE } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import { DueBadge } from "@/components/shared/DueBadge";
import { AddTaskInput } from "@/components/shared/AddTaskInput";
import { AddGoalInline } from "@/components/shared/AddGoalInline";
import { MiniCalendar } from "./MiniCalendar";
import { DailyAffirmation } from "./DailyAffirmation";
import { ColorSwatches } from "./ColorPicker";
import { ExportModal } from "./ExportModal";
import type { Client, ClientTask, ClientFile, Task, Goal, CalendarEvent } from "@/types";

// ── Client task row ─────────────────────────────────────────────

function ClientTaskRow({
  task, color, onToggle, onRemove, onSetDue, onArchive, onRename,
  taskFiles, onUploadTaskFiles, onDeleteTaskFile,
}: {
  task: ClientTask; color: string;
  onToggle: () => void; onRemove: () => void;
  onSetDue: (due: string | null) => void;
  onArchive: () => void; onRename: (text: string) => void;
  taskFiles?: ClientFile[];
  onUploadTaskFiles?: (files: File[], onProgress: (pct: number) => void) => Promise<void>;
  onDeleteTaskFile?: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [textDraft, setTextDraft] = useState(task.text);
  const editDueRef = useRef(task.dueDate ?? "");
  const tappingDate = useRef(false);
  const committed = useRef(false);
  const fileCount = taskFiles?.length ?? 0;

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
    <div className="group grid items-center gap-x-2 py-1" style={{ gridTemplateColumns: "76px 1fr 28px 24px 24px" }}>
      {editing ? (
        <div className="col-span-5 flex items-center gap-2 py-0.5">
          <input
            autoFocus
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            onBlur={() => setTimeout(() => { if (tappingDate.current) return; commit(); }, 100)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="flex-1 text-base bg-transparent border-b border-paper-ink-light/50 outline-none [font-family:var(--font-body)]"
            style={{ color: "#1A1A1A" }}
          />
          {/* Calendar - overlay input, ref-based to avoid re-render */}
          <div
            className="relative w-9 h-9 flex items-center justify-center flex-shrink-0"
            onMouseDown={() => { tappingDate.current = true; setTimeout(() => { tappingDate.current = false; }, 500); }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-paper-ink-light pointer-events-none">
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
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-paper-ink-light hover:text-green-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Trash */}
          <button onMouseDown={(e) => { e.preventDefault(); handleDelete(); }}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-paper-ink-light hover:text-red-400 transition-colors">
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center min-w-0">
            <DueBadge due={task.dueDate} color={color} />
          </div>
          <span
            className={`text-base leading-snug truncate cursor-text ${task.done ? "line-through opacity-50" : "font-normal"}`}
            style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
            onClick={() => { setTextDraft(task.text); editDueRef.current = task.dueDate ?? ""; committed.current = false; setEditing(true); }}
          >{task.text}</span>
          <button onClick={onToggle}
            className="flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center mx-auto"
            style={{ borderColor: task.done ? color : "rgba(26,26,26,0.25)", backgroundColor: task.done ? color : "transparent" }}>
            {task.done && <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
          <button onClick={onArchive}
            className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-paper-ink-light hover:text-paper-rust flex items-center justify-center"
            title="Archive task">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 4v7.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => setShowFiles((v) => !v)}
            className="flex-shrink-0 relative opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-paper-ink-light hover:text-paper-ink flex items-center justify-center"
            title="Attach files"
          >
            <svg width="14" height="16" viewBox="0 0 12 14" fill="none">
              <path d="M10.5 6.5L5.5 11.5C4.4 12.6 2.6 12.6 1.5 11.5C0.4 10.4 0.4 8.6 1.5 7.5L6.5 2.5C7.2 1.8 8.3 1.8 9 2.5C9.7 3.2 9.7 4.3 9 5L4.5 9.5C4.2 9.8 3.8 9.8 3.5 9.5C3.2 9.2 3.2 8.8 3.5 8.5L7.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {fileCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center text-white font-bold" style={{ backgroundColor: color, opacity: 1 }}>
                {fileCount}
              </span>
            )}
          </button>
        </>
      )}
      {showFiles && onUploadTaskFiles && onDeleteTaskFile && (
        <div className="col-span-5">
          <FilesSection
            files={taskFiles ?? []}
            onUpload={onUploadTaskFiles}
            onDelete={onDeleteTaskFile}
            label="TASK FILES"
          />
        </div>
      )}
    </div>
  );
}

function ArchivedTaskRow({ task }: { task: ClientTask }) {
  return (
    <div className="grid items-center gap-x-2 py-0.5 opacity-55" style={{ gridTemplateColumns: "72px 1fr" }}>
      <DueBadge due={task.dueDate} />
      <span className="text-xs leading-snug truncate line-through" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }} title={task.text}>{task.text}</span>
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
          style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", textDecoration: task.done ? "line-through" : undefined, opacity: task.done ? 0.45 : 1 }}>
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
          style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-text ${task.completed ? "line-through opacity-50" : "font-medium"}`}
          style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
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
      <span className="text-[10px] font-medium text-paper-ink-light w-10 flex-shrink-0" style={{ fontFamily: "var(--font-body)" }}>{formatEventTime(event.start)}</span>
      <span className="flex-1 text-sm truncate" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}>{event.summary}</span>
    </div>
  );
}

function TaskColumnHeaders() {
  return (
    <div className="grid gap-x-2 mb-1 pb-1 border-b" style={{ gridTemplateColumns: "76px 1fr 28px 24px 24px", borderColor: "rgba(26,26,26,0.08)" }}>
      <span className="text-[11px] uppercase tracking-widest text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>Due</span>
      <span className="text-[11px] uppercase tracking-widest text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>Task</span>
      <span className="text-[11px] uppercase tracking-widest text-paper-ink-light text-center" style={{ fontFamily: "var(--font-body)" }}>✓</span>
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
          style={{ fontFamily: "var(--font-body)", color }}
        />
      ) : (
        <span
          className={`flex-1 text-sm leading-snug cursor-text ${goal.completed ? "line-through opacity-50" : "font-medium"}`}
          style={{ fontFamily: "var(--font-body)", color: goal.completed ? "#1A1A1A" : color }}
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
        style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
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
  // Lavender / soft purple
  "#fce4ff", "#e4b8f8", "#c080ec",
  // Periwinkle / blue-purple
  "#dfe8ff", "#b8ccf8", "#8aacee",
  // Sky blue
  "#b8d8f8", "#7ab8f0", "#4298e0",
  // Cyan / ice
  "#d4f5f5", "#88dce0", "#38b8cc",
  // Teal / ocean
  "#a0e8e0", "#50c8b8", "#18a898",
  // Seafoam
  "#d8fae5", "#9ce8c0", "#50c890",
  // Green
  "#b0f0c8", "#68d898", "#28b860",
];


const CLIENT_COLORS_PALETTE = [
  "#d9ed92", "#b5e48c",
  "#99d98c", "#76c893", "#52b69a", "#40b07a",
  "#34a0a4", "#2d8f8f",
  "#00b4d8", "#5fa8d3",
  "#168aad", "#1a759f", "#0077b6",
  "#1e6091", "#184e77", "#023e8a",
  "#0d3b6e", "#03045e",
  "#457b9d", "#264653",
];

interface SystemConfig { color: string; title: string; }
type SystemKey = "__today__" | "__week__" | "__goals__" | "__braindump__" | "__overdue__";

const SYSTEM_DEFAULTS: Record<SystemKey, SystemConfig> = {
  "__overdue__":   { color: "#5a9cd4", title: "Overdue" },
  "__today__":     { color: "#38b8cc", title: "Today" },
  "__week__":      { color: "#50c890", title: "This Week" },
  "__goals__":     { color: "#8aacee", title: "Goals" },
  "__braindump__": { color: "#c080ec", title: "Notes" },
};

const SYSTEM_CONFIG_KEYS: Record<string, string> = {
  original: "sticky-system-config",
  neutral:  "sticky-system-config-neutral",
};

function loadSystemConfig(theme?: string | null): Record<SystemKey, SystemConfig> {
  try {
    const t = theme ?? localStorage.getItem("nesos-theme");
    const key = SYSTEM_CONFIG_KEYS[t ?? "original"] ?? SYSTEM_CONFIG_KEYS.original;
    const raw = localStorage.getItem(key);
    const saved = JSON.parse(raw ?? "{}");
    const isNew = raw === null;
    const defaults = (isNew && t === "neutral") ? NEUTRAL_SYSTEM_DEFAULTS : SYSTEM_DEFAULTS;
    return {
      "__overdue__":   { ...defaults["__overdue__"],   ...saved["__overdue__"] },
      "__today__":     { ...defaults["__today__"],     ...saved["__today__"] },
      "__week__":      { ...defaults["__week__"],      ...saved["__week__"] },
      "__goals__":     { ...defaults["__goals__"],     ...saved["__goals__"] },
      "__braindump__": { ...defaults["__braindump__"], ...saved["__braindump__"] },
    };
  } catch { return { ...SYSTEM_DEFAULTS }; }
}

function saveSystemConfig(cfg: Record<SystemKey, SystemConfig>, theme?: string) {
  const key = SYSTEM_CONFIG_KEYS[theme ?? "original"] ?? SYSTEM_CONFIG_KEYS.original;
  localStorage.setItem(key, JSON.stringify(cfg));
}

function loadClientOrder(): string[] {
  try { return JSON.parse(localStorage.getItem("client-order") ?? "[]"); } catch { return []; }
}
function saveClientOrder(order: string[]) {
  localStorage.setItem("client-order", JSON.stringify(order));
}

// ── Board layout (tile-based) ────────────────────────────────────

type TileKey = "__goals__" | "__braindump__" | "__overdue__" | "__today__" | "__week__" | "__projects__" | "__add_project__";
type ColKey = "col1" | "col2" | "col3" | "col4";
const COLS: ColKey[] = ["col1", "col2", "col3", "col4"];

function defaultLayout(): Record<ColKey, TileKey[]> {
  return {
    col1: ["__add_project__", "__braindump__", "__goals__"],
    col2: ["__projects__"],
    col3: [],
    col4: ["__overdue__", "__today__", "__week__"],
  };
}

function loadLayout(): Record<ColKey, TileKey[]> {
  try {
    const saved = localStorage.getItem("board-layout-v4");
    if (saved) return JSON.parse(saved);
    return defaultLayout();
  } catch { return defaultLayout(); }
}

function saveLayout(l: Record<ColKey, TileKey[]>) {
  localStorage.setItem("board-layout-v4", JSON.stringify(l));
}

// ── File attachment helpers ──────────────────────────────────────

function putWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Storage upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

// Uploads directly to Supabase Storage via signed URL - no Vercel body size limit.
async function uploadFile(
  file: File,
  clientId: string,
  taskId: string | null,
  onProgress: (pct: number) => void,
): Promise<ClientFile & { localUrl: string }> {
  // 1. Get a signed upload URL from our server (tiny JSON request)
  const urlRes = await fetch("/api/db/files/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, taskId, fileName: file.name }),
  });
  if (!urlRes.ok) {
    const body = await urlRes.json().catch(() => ({}));
    throw new Error(body.error ?? `Auth failed (${urlRes.status})`);
  }
  const { signedUrl, path } = await urlRes.json();

  // 2. PUT file directly to Supabase with real progress events
  await putWithProgress(signedUrl, file, onProgress);

  // 3. Save metadata to our DB
  const id = crypto.randomUUID();
  const meta: ClientFile = {
    id, clientId, taskId,
    fileName: file.name, filePath: path,
    fileSize: file.size, mimeType: file.type || undefined,
    createdAt: new Date().toISOString(),
  };
  const metaRes = await fetch("/api/db/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  if (!metaRes.ok) {
    const body = await metaRes.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to save metadata");
  }

  return { ...meta, localUrl: URL.createObjectURL(file) };
}

function fileIcon(mimeType?: string): string {
  if (!mimeType) return "📎";
  if (mimeType.startsWith("image/")) return "🖼";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv") return "📊";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "🗜";
  return "📎";
}

function FileRow({
  file, onDelete,
}: {
  file: ClientFile & { signedUrl?: string };
  onDelete: () => void;
}) {
  const isImage = file.mimeType?.startsWith("image/");
  const previewUrl = file.signedUrl ?? null;
  const sizeLabel = file.fileSize
    ? file.fileSize > 1_000_000
      ? `${(file.fileSize / 1_000_000).toFixed(1)} MB`
      : `${Math.round(file.fileSize / 1024)} KB`
    : "";

  if (isImage && previewUrl) {
    return (
      <div className="group relative aspect-square rounded overflow-hidden" style={{ border: "1px solid rgba(26,26,26,0.08)" }}>
        <img src={previewUrl} alt={file.fileName} className="w-full h-full object-cover" />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to top, rgba(26,26,26,0.6) 40%, transparent 100%)" }}>
          <div className="flex justify-end gap-1">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-6 h-6 rounded text-white hover:bg-white/20 transition-colors"
              title="Open full size"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7 1h4v4M11 1L6.5 5.5M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <button
              onClick={onDelete}
              className="flex items-center justify-center w-6 h-6 rounded text-white hover:bg-paper-rust/80 transition-colors"
              title="Delete file"
            >×</button>
          </div>
          <p className="text-[10px] text-white/90 truncate leading-tight" style={{ fontFamily: "var(--font-body)" }}>
            {file.fileName}{sizeLabel ? ` · ${sizeLabel}` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 py-0.5">
      <span className="flex-shrink-0 text-sm">{fileIcon(file.mimeType)}</span>
      <a
        href={previewUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-xs truncate hover:underline underline-offset-2"
        style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
      >
        {file.fileName}
      </a>
      {sizeLabel && (
        <span className="text-[10px] flex-shrink-0" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.4 }}>
          {sizeLabel}
        </span>
      )}
      <button
        onClick={onDelete}
        className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-paper-ink-light hover:text-paper-rust transition-opacity text-base leading-none"
        title="Delete file"
      >×</button>
    </div>
  );
}

function FilesSection({
  files,
  onUpload,
  onDelete,
  label = "FILES",
}: {
  files: ClientFile[];
  onUpload: (files: File[], onProgress: (pct: number) => void) => Promise<void>;
  onDelete: (id: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const picked = Array.from(e.target.files);
    e.target.value = "";
    setUploadError(null);
    setProgress(0);
    setUploading(true);
    try {
      await onUpload(picked, setProgress);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="mt-3 pt-2 border-t" style={{ borderColor: "rgba(26,26,26,0.07)" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.45 }}>{label}</span>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-[10px] text-paper-ink-light hover:text-paper-ink transition-colors disabled:opacity-40"
          style={{ fontFamily: "var(--font-body)" }}
          title="Attach file"
        >
          <svg width="11" height="13" viewBox="0 0 12 14" fill="none">
            <path d="M10.5 6.5L5.5 11.5C4.4 12.6 2.6 12.6 1.5 11.5C0.4 10.4 0.4 8.6 1.5 7.5L6.5 2.5C7.2 1.8 8.3 1.8 9 2.5C9.7 3.2 9.7 4.3 9 5L4.5 9.5C4.2 9.8 3.8 9.8 3.5 9.5C3.2 9.2 3.2 8.8 3.5 8.5L7.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {uploading ? `${progress}%` : "attach"}
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
      </div>
      {uploadError && (
        <p className="text-[10px] text-paper-rust mb-1" style={{ fontFamily: "var(--font-body)" }}>{uploadError}</p>
      )}
      {uploading && (
        <div className="mb-2">
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(26,26,26,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%`, background: "var(--color-paper-rust, #8B4A3A)" }}
            />
          </div>
          <p className="text-[9px] mt-0.5 opacity-40" style={{ fontFamily: "var(--font-body)" }}>
            jpeg, png, pdf and most file types supported · up to 50 MB
          </p>
        </div>
      )}
      {!uploading && files.length === 0 && !uploadError && (
        <p className="text-[10px] italic" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.4 }}>No files attached.</p>
      )}
      {/* Image grid */}
      {files.filter((f) => f.mimeType?.startsWith("image/") && f.signedUrl).length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
          {files.filter((f) => f.mimeType?.startsWith("image/") && f.signedUrl).map((f) => (
            <FileRow key={f.id} file={f} onDelete={() => onDelete(f.id)} />
          ))}
        </div>
      )}
      {/* Non-image files */}
      {files.filter((f) => !f.mimeType?.startsWith("image/")).map((f) => (
        <FileRow key={f.id} file={f} onDelete={() => onDelete(f.id)} />
      ))}
    </div>
  );
}

// ── ProjectsList (overflow-aware fade) ──────────────────────────

function ProjectsList({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="flex flex-col gap-2 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-paper-ink/20"
      style={overflows ? {
        maskImage: "linear-gradient(to bottom, black calc(100% - 44px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 44px), transparent 100%)",
      } : undefined}
    >
      {children}
    </div>
  );
}

// ── NotePanel ───────────────────────────────────────────────────

const LINED_BODY: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(26,26,26,0.04) 23px, rgba(26,26,26,0.04) 24px)",
  backgroundSize: "100% 24px",
  backgroundPositionY: "12px",
};

function NotePanel({
  title, color, children, footer, className = "", style: styleProp,
  onTitleChange, onColorChange, colorOptions, onDelete, onArchive,
  collapsed = false, onToggleCollapse, lined = true, theme,
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
  onArchive?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  lined?: boolean;
  theme?: Theme;
}) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const textColor = theme === "neutral" ? noteTextColorWarm(color) : noteTextColor(color);
  const isEditable = !!(onTitleChange || onColorChange || onDelete);

  const commitTitle = () => {
    const t = titleDraft.trim();
    if (t && t !== title) onTitleChange?.(t); else setTitleDraft(title);
    setEditing(false);
  };

  return (
    <div className={`flex flex-col ${className}`}
      style={{ boxShadow: "3px 5px 18px rgba(26,26,26,0.11), 1px 1px 0 rgba(26,26,26,0.04)", ...styleProp }}>

      {/* Header band */}
      <div className="group/header flex items-center gap-1.5 px-3 py-2.5 flex-shrink-0" style={{ backgroundColor: color }}>
        {/* Grip icon - drag affordance */}
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
              onBlur={() => { const t = titleDraft.trim(); if (t && t !== title) onTitleChange?.(t); else setTitleDraft(title); }}
              className="w-full text-sm font-semibold bg-white/60 border-b-2 border-paper-ink-light/30 outline-none px-2 py-1 text-paper-ink"
              style={{ fontFamily: "var(--font-body)" }}
            />
          )}
          {onColorChange && colorOptions && (
            <ColorSwatches swatches={colorOptions} value={color} onChange={onColorChange} />
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {onArchive && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onArchive(); setEditing(false); }}
                  className="py-1.5 px-3 text-xs uppercase tracking-[0.15em] text-paper-ink-light hover:bg-paper-line/20 transition-colors border border-paper-line/40"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { if (confirm("Remove this project?")) { onDelete(); setEditing(false); } }}
                  className="py-1.5 px-3 text-xs uppercase tracking-[0.15em] text-paper-ink-light hover:text-white hover:bg-paper-ink transition-colors border border-paper-line/40"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Remove
                </button>
              )}
            </div>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setEditing(false)}
              className="py-1.5 px-3 text-xs uppercase tracking-[0.15em] text-paper-ink hover:bg-black/10 transition-colors border border-paper-line/40"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Frosted glass body - hidden when collapsed */}
      {!collapsed && (
        <div className="flex flex-col"
          style={{
            backgroundColor: `${color}18`,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderLeft: "1px solid rgba(255,255,255,0.45)",
            borderRight: "1px solid rgba(255,255,255,0.45)",
            borderBottom: "1px solid rgba(255,255,255,0.45)",
          }}>
          <div className="px-4 py-3" style={lined ? LINED_BODY : undefined}>
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

function defaultProjectColor(): string {
  try {
    return localStorage.getItem("nesos-theme") === "neutral"
      ? NEUTRAL_PROJECT_DEFAULT_COLOR
      : CLIENT_COLORS_PALETTE[0];
  } catch { return CLIENT_COLORS_PALETTE[0]; }
}

function AddProjectInline({ onAdd, colorOptions }: { onAdd: (name: string, color: string) => Promise<void>; colorOptions?: string[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(() => defaultProjectColor());

  const commit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName(""); setColor(defaultProjectColor()); setOpen(false);
  };

  return (
    <div className="overflow-hidden" style={{ boxShadow: "2px 3px 10px rgba(26,26,26,0.08)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: (() => { try { return localStorage.getItem("nesos-theme") === "neutral" ? "#988878" : "#9b72cf"; } catch { return "#9b72cf"; } })() }}>
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
            style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}
          />
          <ColorSwatches swatches={colorOptions ?? CLIENT_COLORS_PALETTE} value={color} onChange={setColor} />
          <div className="flex gap-2">
            <button onClick={commit} disabled={!name.trim()}
              className="flex-1 py-1.5 text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: color, color: noteTextColor(color), fontFamily: "var(--font-body)" }}>
              Add {name.trim() || "project"}
            </button>
            <button onClick={() => setOpen(false)}
              className="px-3 text-sm text-paper-ink-light hover:text-paper-ink"
              style={{ fontFamily: "var(--font-body)" }}>
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
  onArchiveClient: (id: string) => void;
  onUnarchiveClient: (id: string) => void;
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
  theme?: Theme;
  colorResetKey?: number;
  userName?: string | null;
}

export function StickyBoard({
  clients, tasksByClient, events,
  onAddClientTask, onToggleClientTask, onRemoveClientTask, onUpdateClientTask, onArchiveClientTask,
  onAddClient, onUpdateClient, onRemoveClient, onArchiveClient, onUnarchiveClient,
  weekTasks, onAddWeekTask, onToggleWeekTask, onRemoveWeekTask, onRenameWeekTask,
  weekGoals, longtermGoals, onToggleGoal, onRemoveGoal, onRenameGoal, onAddGoal,
  brainDump, onBrainDumpChange, theme = "original", colorResetKey = 0, userName,
}: StickyBoardProps) {
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [exportClientId, setExportClientId] = useState<string | null>(null);
  const [systemConfig, setSystemConfig] = useState<Record<SystemKey, SystemConfig>>(() => loadSystemConfig());
  const [clientOrder, setClientOrder] = useState<string[]>(() => loadClientOrder());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState<Record<ColKey, TileKey[]>>(() => loadLayout());
  const [panelDragKey, setPanelDragKey] = useState<TileKey | null>(null);
  const [panelDragSourceCol, setPanelDragSourceCol] = useState<ColKey | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColKey | null>(null);
  const [panelDropTarget, setPanelDropTarget] = useState<{ col: ColKey; index: number } | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("panel-collapsed") ?? "{}");
      return { ...saved, __goals__: false };
    } catch { return {}; }
  });

  useEffect(() => {
    setSystemConfig(loadSystemConfig(theme));
  }, [theme]);

  useEffect(() => {
    if (colorResetKey > 0) setSystemConfig(loadSystemConfig(theme));
  }, [colorResetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const systemColorOptions = theme === "neutral" ? NEUTRAL_WARM_COLORS : WARM_COLORS;
  const clientColorOptions = theme === "neutral" ? NEUTRAL_CLIENT_COLORS_PALETTE : CLIENT_COLORS_PALETTE;

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
      saveSystemConfig(next, theme);
      return next;
    });
  }, [theme]);

  const moveTile = useCallback((tileKey: TileKey, srcCol: ColKey, dstCol: ColKey, dstIdx: number) => {
    setLayout((prev) => {
      const next = { ...prev };
      next[srcCol] = prev[srcCol].filter((k) => k !== tileKey);
      const dst = prev[dstCol].filter((k) => k !== tileKey);
      dst.splice(dstIdx, 0, tileKey);
      next[dstCol] = dst;
      saveLayout(next);
      return next;
    });
  }, []);

  const [filesByClient, setFilesByClient] = useState<Record<string, ClientFile[]>>({});

  // Load files when active project changes
  useEffect(() => {
    if (!activeClientId) return;
    fetch(`/api/db/files?clientId=${activeClientId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((files) => setFilesByClient((prev) => ({ ...prev, [activeClientId]: files })))
      .catch(() => {});
  }, [activeClientId]);

  const handleUploadFiles = useCallback(async (
    clientId: string,
    taskId: string | null,
    fileList: File[],
    onProgress: (pct: number) => void,
  ) => {
    const progresses = new Array(fileList.length).fill(0);
    const updateProgress = (idx: number, pct: number) => {
      progresses[idx] = pct;
      onProgress(Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length));
    };

    type UploadResult = ClientFile & { localUrl: string };
    const results = await Promise.allSettled(
      fileList.map((f, i) => uploadFile(f, clientId, taskId, (pct) => updateProgress(i, pct)))
    );
    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<UploadResult> => r.status === "fulfilled")
      .map((r) => r.value);
    const errors = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

    if (succeeded.length > 0) {
      setFilesByClient((prev) => ({
        ...prev,
        [clientId]: [
          ...(prev[clientId] ?? []),
          ...succeeded.map(({ localUrl, ...f }) => ({ ...f, signedUrl: localUrl })),
        ],
      }));
      const res = await fetch(`/api/db/files?clientId=${clientId}`);
      if (res.ok) {
        const serverFiles = await res.json();
        succeeded.forEach(({ localUrl }) => URL.revokeObjectURL(localUrl));
        setFilesByClient((prev) => ({ ...prev, [clientId]: serverFiles }));
      }
    }

    if (errors.length > 0) throw new Error(errors[0].reason?.message ?? "Upload failed");
  }, []);

  const handleDeleteFile = useCallback(async (clientId: string, fileId: string) => {
    await fetch(`/api/db/files?id=${fileId}`, { method: "DELETE" });
    setFilesByClient((prev) => ({
      ...prev,
      [clientId]: (prev[clientId] ?? []).filter((f) => f.id !== fileId),
    }));
  }, []);

  const clearPanelDrag = useCallback(() => {
    setPanelDragKey(null);
    setPanelDragSourceCol(null);
    setDragOverCol(null);
    setPanelDropTarget(null);
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

  // Workspace always in col3 (index 2) - projects fixed in col1
  const workspaceColIdx = 2;

  // ── Tile content renderer ────────────────────────────────────────
  const renderTileContent = (key: TileKey) => {
    if (key === "__goals__") {
      return (
        <NotePanel
          title={new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          color={systemConfig["__goals__"].color}
          colorOptions={systemColorOptions}
          onTitleChange={(title) => updateSystemConfig("__goals__", { title })}
          onColorChange={(color) => updateSystemConfig("__goals__", { color })}
          collapsed={!!panelCollapsed["__goals__"]}
          onToggleCollapse={() => togglePanelCollapse("__goals__")}
          lined={false}
          theme={theme}
        >
          <DailyAffirmation color={systemConfig["__goals__"].color} />
        </NotePanel>
      );
    }
    if (key === "__braindump__") {
      return (
        <NotePanel
          title="Calendar"
          color={systemConfig["__braindump__"].color}
          colorOptions={systemColorOptions}
          onTitleChange={(title) => updateSystemConfig("__braindump__", { title })}
          onColorChange={(color) => updateSystemConfig("__braindump__", { color })}
          collapsed={!!panelCollapsed["__braindump__"]}
          onToggleCollapse={() => togglePanelCollapse("__braindump__")}
          lined={false}
          theme={theme}
        >
          <MiniCalendar />
        </NotePanel>
      );
    }
    if (key === "__overdue__") {
      return (
        <NotePanel
          title={systemConfig["__overdue__"].title}
          color={systemConfig["__overdue__"].color}
          colorOptions={systemColorOptions}
          onTitleChange={(title) => updateSystemConfig("__overdue__", { title })}
          onColorChange={(color) => updateSystemConfig("__overdue__", { color })}
          collapsed={!!panelCollapsed["__overdue__"]}
          onToggleCollapse={() => togglePanelCollapse("__overdue__")}
          theme={theme}
        >
          {overdueItems.length === 0 ? (
            <p className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>Nothing overdue.</p>
          ) : (
            overdueItems.map((t) => (
              <AggregatedTaskRow key={t.id} task={t} clientColor={t.clientColor}
                onToggle={() => onToggleClientTask(t.clientId, t.id)}
                onOpenProject={() => setActiveClientId(t.clientId)}
              />
            ))
          )}
        </NotePanel>
      );
    }
    if (key === "__today__") {
      return (
        <NotePanel
          title={systemConfig["__today__"].title}
          color={systemConfig["__today__"].color}
          colorOptions={systemColorOptions}
          onTitleChange={(title) => updateSystemConfig("__today__", { title })}
          onColorChange={(color) => updateSystemConfig("__today__", { color })}
          collapsed={!!panelCollapsed["__today__"]}
          onToggleCollapse={() => togglePanelCollapse("__today__")}
          theme={theme}
        >
          {todayMeetings.length === 0 && todayTasks.length === 0 && (
            <p className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>Nothing due today.</p>
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
      );
    }
    if (key === "__week__") {
      return (
        <NotePanel
          title={systemConfig["__week__"].title}
          color={weekColor}
          colorOptions={systemColorOptions}
          onTitleChange={(title) => updateSystemConfig("__week__", { title })}
          onColorChange={(color) => updateSystemConfig("__week__", { color })}
          collapsed={!!panelCollapsed["__week__"]}
          onToggleCollapse={() => togglePanelCollapse("__week__")}
          theme={theme}
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
            <p className="text-xs italic pb-1" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.4 }}>Nothing yet.</p>
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
              <summary className="text-[10px] italic cursor-pointer list-none flex items-center gap-1 pb-1 select-none" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>▸ {manualDone.length} done</summary>
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
      );
    }
    if (key === "__projects__") {
      const orderMap = new Map(clientOrder.map((id, i) => [id, i]));
      const allOrdered = [...clients].sort((a, b) => {
        const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : clients.length;
        const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : clients.length;
        return ai - bi;
      });
      const ordered = allOrdered.filter((c) => !c.archived);
      const archivedClients = allOrdered.filter((c) => c.archived);
      return (
        <ProjectsList>
          {ordered.map((c, i) => {
            const active = activeClientId === c.id;
            const tc = theme === "neutral" ? noteTextColorWarm(c.color) : noteTextColor(c.color);
            const isDragging = dragId === c.id;
            return (
              <div key={c.id} className="relative group/bar">
                {dropIndex === i && dragId !== c.id && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 rounded-full z-10" style={{ backgroundColor: c.color }} />
                )}
                <div
                  className="w-full flex items-center gap-1 transition-all"
                  style={{
                    backgroundColor: c.color,
                    opacity: isDragging ? 0.4 : active ? 1 : 0.82,
                    boxShadow: active ? "3px 5px 18px rgba(26,26,26,0.18), 0 0 0 2px rgba(26,26,26,0.18)" : "2px 3px 8px rgba(26,26,26,0.10)",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setExportClientId(c.id); }}
                    title="Export project tasks"
                    aria-label="Export project tasks"
                    className="flex-shrink-0 flex items-center justify-center w-6 h-6 ml-1 opacity-[0.45] hover:opacity-100 transition-opacity"
                    style={{ color: tc }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1v9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M4.5 6.5L8 10l3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button
                    draggable
                    onClick={() => setActiveClientId(active ? null : c.id)}
                    onDragStart={(e) => { e.stopPropagation(); setDragId(c.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropIndex(i); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!dragId || dragId === c.id) return;
                      const fromIdx = ordered.findIndex((x) => x.id === dragId);
                      const newOrder = ordered.map((x) => x.id);
                      newOrder.splice(fromIdx, 1);
                      newOrder.splice(i, 0, dragId);
                      setClientOrder(newOrder);
                      saveClientOrder(newOrder);
                      setDragId(null); setDropIndex(null);
                    }}
                    onDragEnd={(e) => { e.stopPropagation(); setDragId(null); setDropIndex(null); }}
                    className="flex-1 min-w-0 flex items-center gap-2 pr-3 py-3 text-left transition-all"
                    style={{ cursor: "grab" }}
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
              </div>
            );
          })}
          {archivedClients.length > 0 && (
            <details className="mt-2">
              <summary className="text-[10px] uppercase tracking-[0.2em] cursor-pointer list-none select-none text-paper-ink-light py-1 px-1 flex items-center gap-1.5"
                style={{ fontFamily: "var(--font-body)" }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {archivedClients.length} archived
              </summary>
              <div className="mt-1 flex flex-col gap-1.5">
                {archivedClients.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-sm"
                    style={{ backgroundColor: `${c.color}30`, border: `1px solid ${c.color}40` }}>
                    <span className="flex-1 text-xs uppercase tracking-[0.15em] truncate text-paper-ink-light"
                      style={{ fontFamily: "var(--font-body)" }}>{c.name}</span>
                    <button onClick={() => onUnarchiveClient(c.id)}
                      className="text-[10px] text-paper-ink-light hover:text-paper-ink uppercase tracking-[0.12em] flex-shrink-0"
                      style={{ fontFamily: "var(--font-body)" }}>
                      restore
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
          <ExportModal
            open={!!exportClientId}
            onClose={() => setExportClientId(null)}
            clients={clients}
            tasksByClient={tasksByClient}
            lockedClientId={exportClientId ?? undefined}
            userName={userName}
            theme={theme}
          />
        </ProjectsList>
      );
    }
    if (key === "__add_project__") {
      return (
        <AddProjectInline
          colorOptions={clientColorOptions}
          onAdd={async (name, color) => {
            const client = await onAddClient(name, color);
            setActiveClientId(client.id);
          }}
        />
      );
    }
    return null;
  };

  // ── Draggable tile wrapper ────────────────────────────────────────
  const renderTile = (key: TileKey, colKey: ColKey, tileIdx: number) => {
    const isDragging = panelDragKey === key;
    const showDrop = panelDropTarget?.col === colKey && panelDropTarget?.index === tileIdx && panelDragKey !== key;
    return (
      <div key={key} className="relative flex flex-col">
        {showDrop && (
          <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-paper-ink/30 rounded-full z-10 pointer-events-none" />
        )}
        <div
          draggable
          onDragStart={(e) => {
            if (dragId || (colKey !== "col1" && colKey !== "col4")) return;
            setPanelDragKey(key);
            setPanelDragSourceCol(colKey);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            if (dragId || (colKey !== "col1" && colKey !== "col4")) return;
            e.preventDefault();
            e.stopPropagation();
            setDragOverCol(colKey);
            setPanelDropTarget({ col: colKey, index: tileIdx });
          }}
          onDrop={(e) => {
            if (dragId || (colKey !== "col1" && colKey !== "col4")) { clearPanelDrag(); return; }
            e.preventDefault();
            e.stopPropagation();
            if (!panelDragKey || panelDragKey === key || !panelDragSourceCol) { clearPanelDrag(); return; }
            moveTile(panelDragKey, panelDragSourceCol, colKey, tileIdx);
            clearPanelDrag();
          }}
          onDragEnd={clearPanelDrag}
          style={{ opacity: isDragging ? 0.4 : 1, cursor: (colKey === "col1" || colKey === "col4") ? "grab" : "default" }}
          className="flex flex-col"
        >
          {renderTileContent(key)}
        </div>
      </div>
    );
  };

  // ── Workspace content ────────────────────────────────────────────
  const renderWorkspace = () => {
    if (!activeClient) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm italic text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>← select a project</p>
        </div>
      );
    }
    const allTasks = tasksByClient[activeClient.id] ?? [];
    const active = allTasks.filter((t) => !t.archived);
    const archived = allTasks.filter((t) => t.archived);
    const sortedActive = [...active].sort((a, b) => {
      const da = parseDueDate(a.dueDate), db = parseDueDate(b.dueDate);
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
      return da.getTime() - db.getTime();
    });
    return (
      <NotePanel
        title={activeClient.name}
        color={activeClient.color}
        className="flex-1"
        colorOptions={clientColorOptions}
        onTitleChange={(name) => onUpdateClient({ ...activeClient, name })}
        onColorChange={(color) => onUpdateClient({ ...activeClient, color })}
        theme={theme}
        onArchive={() => { onArchiveClient(activeClient.id); setActiveClientId(null); }}
        onDelete={() => { onRemoveClient(activeClient.id); setActiveClientId(null); }}
      >
        <textarea
          key={activeClient.id}
          defaultValue={activeClient.notes ?? ""}
          onBlur={(e) => {
            const val = e.target.value;
            if (val !== (activeClient.notes ?? "")) onUpdateClient({ ...activeClient, notes: val });
          }}
          placeholder="project notes..."
          rows={2}
          className="w-full text-sm bg-transparent border-b border-paper-line/30 outline-none resize-none text-paper-ink leading-relaxed pb-1 mb-3"
          style={{ fontFamily: "var(--font-body)" }}
        />
        {sortedActive.length === 0 && archived.length === 0 && (
          <p className="text-xs italic pb-1" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.5 }}>No tasks yet.</p>
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
                taskFiles={(filesByClient[activeClient.id] ?? []).filter((f) => f.taskId === t.id)}
                onUploadTaskFiles={(fl, onProgress) => handleUploadFiles(activeClient.id, t.id, fl, onProgress)}
                onDeleteTaskFile={(id) => handleDeleteFile(activeClient.id, id)}
              />
            ))}
          </>
        )}
        {archived.length > 0 && (
          <details className="mt-2">
            <summary className="text-[10px] italic cursor-pointer list-none flex items-center gap-1 pb-1 select-none" style={{ fontFamily: "var(--font-body)", color: "#1A1A1A", opacity: 0.45 }}>
              ▸ {archived.length} archived
            </summary>
            <div className="mt-1 space-y-0.5">
              {archived.map((t) => <ArchivedTaskRow key={t.id} task={t} />)}
            </div>
          </details>
        )}
        <AddTaskInput color={activeClient.color} onAdd={(text, due) => onAddClientTask(activeClient.id, text, due)} />
        <FilesSection
          files={(filesByClient[activeClient.id] ?? []).filter((f) => !f.taskId)}
          onUpload={(fl, onProgress) => handleUploadFiles(activeClient.id, null, fl, onProgress)}
          onDelete={(id) => handleDeleteFile(activeClient.id, id)}
        />
      </NotePanel>
    );
  };

  return (
    <div className="flex-1 flex">
      {COLS.map((col, colIdx) => {
        const tiles = layout[col];
        const isWorkspace = colIdx === workspaceColIdx;
        if (!tiles.length && !isWorkspace) return null;

        const isDragTarget = dragOverCol === col && !!panelDragKey && !dragId && (col === "col1" || col === "col4");
        const colClass = isWorkspace
          ? "flex-1 min-w-0 flex flex-col gap-3 p-3 pb-10 overflow-y-auto border-l border-white/20"
          : col === "col4"
            ? "w-[300px] flex-shrink-0 flex flex-col gap-3 p-3 pb-10 overflow-y-auto border-l border-white/20"
            : "w-[300px] flex-shrink-0 flex flex-col gap-3 p-3 pb-10 overflow-y-auto border-r border-white/20";

        return (
          <div
            key={col}
            className={colClass}
            style={{ outline: isDragTarget ? "1px dashed rgba(26,26,26,0.15)" : "none", outlineOffset: -3 }}
            onDragOver={(e) => { if (!dragId && (col === "col1" || col === "col4")) { e.preventDefault(); setDragOverCol(col); } }}
            onDrop={(e) => {
              if (dragId || !panelDragKey || !panelDragSourceCol || (col !== "col1" && col !== "col4")) { clearPanelDrag(); return; }
              e.preventDefault();
              moveTile(panelDragKey, panelDragSourceCol, col, layout[col].length);
              clearPanelDrag();
            }}
          >
            {tiles.map((key, i) => renderTile(key, col, i))}
            {isWorkspace && renderWorkspace()}
          </div>
        );
      })}
    </div>
  );
}
