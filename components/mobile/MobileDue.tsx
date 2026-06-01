"use client";

import { useState } from "react";
import { MobileScreenHeader } from "./MobileScreenHeader";
import { MobileFooter } from "./MobileFooter";
import { SwipeRow } from "./SwipeRow";
import { DueBadge } from "@/components/shared/DueBadge";
import { parseDueDate, dueDateUrgency } from "@/lib/dates";
import type { Client, ClientTask } from "@/types";

const URGENT_COLOR = "#e05252";
const TODAY_COLOR  = "#D4909E";
const WEEK_COLOR   = "#F4956A";

interface TaskWithClient extends ClientTask {
  clientColor: string;
  clientName: string;
  clientId: string;
}

interface SectionProps {
  title: string;
  color: string;
  tasks: TaskWithClient[];
  onArchive: (t: TaskWithClient) => void;
  onDelete: (t: TaskWithClient) => void;
  onToggle: (t: TaskWithClient) => void;
  defaultOpen?: boolean;
}

function Section({ title, color, tasks, onArchive, onDelete, onToggle, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const done = tasks.filter((t) => t.done);
  const pending = tasks.filter((t) => !t.done);

  return (
    <div className="mb-[3px]">
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: color }}
      >
        <span className="text-sm font-bold tracking-[0.18em] uppercase text-white" style={{ fontFamily: "var(--font-body)" }}>
          {title}
        </span>
        <div className="flex items-center gap-3">
          {tasks.length > 0 && (
            <span className="text-white/70 text-xs font-semibold" style={{ fontFamily: "var(--font-body)" }}>
              {pending.length} left
            </span>
          )}
          <span className="text-white text-lg font-light opacity-70">{open ? "∨" : "›"}</span>
        </div>
      </button>

      {/* Task list */}
      {open && (
        <div className="bg-white/10 backdrop-blur-md">
          {tasks.length === 0 ? (
            <p className="px-5 py-4 text-sm text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>
              All clear.
            </p>
          ) : (
            <>
              {pending.map((t) => (
                <SwipeRow
                  key={t.id}
                  onArchive={() => onArchive(t)}
                  onDelete={() => onDelete(t)}
                  archiveColor={t.clientColor}
                >
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-paper-line/20 bg-transparent">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.clientColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-paper-ink truncate" style={{ fontFamily: "var(--font-body)" }}>{t.text}</p>
                      <p className="text-[11px] uppercase tracking-[0.14em] mt-0.5" style={{ fontFamily: "var(--font-body)", color: t.clientColor, opacity: 0.85 }}>{t.clientName}</p>
                    </div>
                    <DueBadge due={t.dueDate} />
                    <button
                      onClick={() => onToggle(t)}
                      className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
                      style={{ borderColor: "rgba(26,26,26,0.22)" }}
                    />
                  </div>
                </SwipeRow>
              ))}
              {done.length > 0 && (
                <details>
                  <summary className="px-5 py-2 text-[13px] text-paper-ink-light cursor-pointer list-none select-none" style={{ fontFamily: "var(--font-body)" }}>
                    ▸ {done.length} done
                  </summary>
                  {done.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-paper-line/20 opacity-50">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.clientColor }} />
                      <span className="flex-1 text-base line-through text-paper-ink truncate" style={{ fontFamily: "var(--font-body)" }}>{t.text}</span>
                      <DueBadge due={t.dueDate} />
                    </div>
                  ))}
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface MobileDueProps {
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  onToggleClientTask: (clientId: string, taskId: string) => void;
  onArchiveClientTask: (clientId: string, taskId: string) => void;
  onRemoveClientTask: (clientId: string, taskId: string) => void;
  onOpenDrawer: () => void;
}

export function MobileDue({
  clients, tasksByClient,
  onToggleClientTask, onArchiveClientTask, onRemoveClientTask,
  onOpenDrawer,
}: MobileDueProps) {
  const allTasks: TaskWithClient[] = clients.flatMap((c) =>
    (tasksByClient[c.id] ?? [])
      .filter((t) => !t.archived && t.dueDate)
      .map((t) => ({ ...t, clientColor: c.color, clientName: c.name, clientId: c.id }))
  );

  // Sort by due date ascending within each bucket
  const byUrgency = (bucket: string) =>
    allTasks
      .filter((t) => dueDateUrgency(t.dueDate) === bucket)
      .sort((a, b) => {
        const da = parseDueDate(a.dueDate), db = parseDueDate(b.dueDate);
        if (!da || !db) return 0;
        return da.getTime() - db.getTime();
      });

  const urgent = byUrgency("overdue");
  const today  = byUrgency("today");
  const soon   = [...byUrgency("soon"), ...byUrgency("upcoming")];

  const onArchive = (t: TaskWithClient) => onArchiveClientTask(t.clientId, t.id);
  const onDelete  = (t: TaskWithClient) => onRemoveClientTask(t.clientId, t.id);
  const onToggle  = (t: TaskWithClient) => onToggleClientTask(t.clientId, t.id);

  return (
    <div className="flex flex-col h-dvh">
      <MobileScreenHeader title="Due" onOpenDrawer={onOpenDrawer} />
      <div className="flex-1 overflow-y-auto bg-white/5 backdrop-blur-sm">
        <Section title="Urgent"    color={URGENT_COLOR} tasks={urgent} defaultOpen={urgent.length > 0} onArchive={onArchive} onDelete={onDelete} onToggle={onToggle} />
        <Section title="Today"     color={TODAY_COLOR}  tasks={today}  defaultOpen={true}              onArchive={onArchive} onDelete={onDelete} onToggle={onToggle} />
        <Section title="This Week" color={WEEK_COLOR}   tasks={soon}   defaultOpen={soon.length > 0}   onArchive={onArchive} onDelete={onDelete} onToggle={onToggle} />
      </div>
      <MobileFooter />
    </div>
  );
}
