"use client";

import { useState } from "react";
import { DueBadge } from "@/components/shared/DueBadge";
import type { Client, ClientTask } from "@/types";

interface DesktopArchiveProps {
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  onUnarchiveClient: (id: string) => void;
  onClose: () => void;
}

function ProjectSection({ c, tasks, onUnarchiveClient }: {
  c: Client;
  tasks: ClientTask[];
  onUnarchiveClient: (id: string) => void;
}) {
  const archivedTasks = tasks
    .filter((t) => t.archived)
    .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
  const isProjectArchived = !!c.archived;

  return (
    <details open={isProjectArchived || archivedTasks.length > 0} className="group">
      {/* Project header */}
      <summary className="flex items-center gap-3 py-2.5 cursor-pointer list-none select-none rounded-sm hover:bg-paper-warm/40 px-2 -mx-2 transition-colors">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
        <span className="flex-1 text-sm font-semibold text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>
          {c.name}
        </span>
        {isProjectArchived && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnarchiveClient(c.id); }}
            className="flex-shrink-0 text-[10px] uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full border transition-colors hover:opacity-80"
            style={{
              fontFamily: "var(--font-body)",
              color: c.color,
              borderColor: `${c.color}50`,
              backgroundColor: `${c.color}10`,
            }}
          >
            Project archived · restore
          </button>
        )}
        {archivedTasks.length > 0 && (
          <span className="flex-shrink-0 text-xs text-paper-ink-light tabular-nums" style={{ fontFamily: "var(--font-body)" }}>
            {archivedTasks.length} task{archivedTasks.length !== 1 ? "s" : ""}
          </span>
        )}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="flex-shrink-0 text-paper-ink-light transition-transform group-open:rotate-90">
          <path d="M2 1l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </summary>

      <div className="pl-6 mt-1 mb-3">
        {archivedTasks.length === 0 ? (
          <p className="text-xs text-paper-ink-light py-2" style={{ fontFamily: "var(--font-body)" }}>
            No archived tasks.
          </p>
        ) : (
          archivedTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-paper-line/20 opacity-55">
              <span className="flex-1 text-sm line-through text-paper-ink truncate" style={{ fontFamily: "var(--font-body)" }}>{t.text}</span>
              <DueBadge due={t.dueDate} />
              {t.archivedAt && (
                <span className="flex-shrink-0 text-[10px] text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>
                  {new Date(t.archivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </details>
  );
}

export function DesktopArchive({ clients, tasksByClient, onUnarchiveClient, onClose }: DesktopArchiveProps) {
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();

  const sorted = [...clients].sort((a, b) => {
    if (a.archived && !b.archived) return -1;
    if (!a.archived && b.archived) return 1;
    const aCount = (tasksByClient[a.id] ?? []).filter((t) => t.archived).length;
    const bCount = (tasksByClient[b.id] ?? []).filter((t) => t.archived).length;
    return bCount - aCount;
  });

  const visible = sorted.filter((c) => {
    if (!q) return c.archived || (tasksByClient[c.id] ?? []).some((t) => t.archived);
    return (
      c.name.toLowerCase().includes(q) ||
      (tasksByClient[c.id] ?? []).some((t) => t.archived && t.text.toLowerCase().includes(q))
    );
  });

  const archivedProjectCount = clients.filter((c) => c.archived).length;
  const archivedTaskCount = clients.reduce((n, c) => n + (tasksByClient[c.id] ?? []).filter((t) => t.archived).length, 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-paper-ink/10 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full flex flex-col shadow-2xl border-l"
        style={{
          width: "min(680px, 55vw)",
          backgroundColor: "rgba(249,248,246,0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: "rgba(213,211,207,0.35)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-7 pt-6 pb-4 border-b border-paper-line/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold uppercase tracking-[0.2em] text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>
                Archive
              </h2>
              <p className="text-xs text-paper-ink-light mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
                {archivedProjectCount} project{archivedProjectCount !== 1 ? "s" : ""} archived
                {archivedTaskCount > 0 && ` · ${archivedTaskCount} task${archivedTaskCount !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-paper-ink-light hover:text-paper-ink text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-ink-light pointer-events-none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archived projects and tasks..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 border border-paper-line/40 outline-none rounded-sm placeholder:text-paper-ink-light/60 text-paper-ink"
              style={{ fontFamily: "var(--font-body)" }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-4">
          {visible.length === 0 ? (
            <p className="text-sm text-paper-ink-light text-center mt-16" style={{ fontFamily: "var(--font-body)" }}>
              {q ? "No matches found." : "Nothing archived yet."}
            </p>
          ) : (
            <div className="divide-y divide-paper-line/20">
              {visible.map((c) => (
                <ProjectSection
                  key={c.id}
                  c={c}
                  tasks={tasksByClient[c.id] ?? []}
                  onUnarchiveClient={onUnarchiveClient}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
