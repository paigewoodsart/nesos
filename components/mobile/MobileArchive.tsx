"use client";

import { MobileScreenHeader } from "./MobileScreenHeader";
import { MobileFooter } from "./MobileFooter";
import { DueBadge } from "@/components/shared/DueBadge";
import type { Client, ClientTask } from "@/types";

interface MobileArchiveProps {
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  onUnarchiveClient: (id: string) => void;
  onOpenDrawer: () => void;
}

export function MobileArchive({ clients, tasksByClient, onUnarchiveClient, onOpenDrawer }: MobileArchiveProps) {
  // Sort: project-archived first, then by archived task count desc
  const sorted = [...clients].sort((a, b) => {
    if (a.archived && !b.archived) return -1;
    if (!a.archived && b.archived) return 1;
    const aCount = (tasksByClient[a.id] ?? []).filter((t) => t.archived).length;
    const bCount = (tasksByClient[b.id] ?? []).filter((t) => t.archived).length;
    return bCount - aCount;
  });

  return (
    <div className="flex flex-col h-dvh board-breathe board-grid">
      <MobileScreenHeader title="Archive" onOpenDrawer={onOpenDrawer} />
      <div className="flex-1 overflow-y-auto mobile-scroll px-5 py-4 bg-white/10 backdrop-blur-md">
        {clients.length === 0 && (
          <p className="text-sm text-paper-ink-light text-center mt-12" style={{ fontFamily: "var(--font-body)" }}>
            No projects yet.
          </p>
        )}

        {sorted.map((c) => {
          const archivedTasks = (tasksByClient[c.id] ?? [])
            .filter((t) => t.archived)
            .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
          const isProjectArchived = !!c.archived;

          return (
            <details
              key={c.id}
              open={isProjectArchived || archivedTasks.length > 0}
              className="mb-2"
            >
              <summary className="flex items-center gap-2.5 py-2.5 cursor-pointer list-none select-none">
                {/* Color dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                />

                {/* Project name */}
                <span
                  className="text-base font-semibold text-paper-ink flex-1 truncate"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {c.name}
                </span>

                {/* "Project archived" badge */}
                {isProjectArchived && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnarchiveClient(c.id); }}
                    className="flex-shrink-0 text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: c.color,
                      borderColor: `${c.color}60`,
                      backgroundColor: `${c.color}12`,
                    }}
                  >
                    archived · restore
                  </button>
                )}

                {/* Task count */}
                {archivedTasks.length > 0 && (
                  <span
                    className="flex-shrink-0 text-[13px] text-paper-ink-light"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {archivedTasks.length}
                  </span>
                )}
              </summary>

              <div className="pl-5 pb-1">
                {archivedTasks.length === 0 ? (
                  <p
                    className="text-sm text-paper-ink-light py-2"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    No archived tasks yet.
                  </p>
                ) : (
                  archivedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-2.5 border-b border-paper-line/20"
                      style={{ opacity: 0.6 }}
                    >
                      <span
                        className="flex-1 text-base text-paper-ink truncate"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {t.text}
                      </span>
                      <DueBadge due={t.dueDate} />
                    </div>
                  ))
                )}
              </div>
            </details>
          );
        })}
      </div>
      <MobileFooter />
    </div>
  );
}
