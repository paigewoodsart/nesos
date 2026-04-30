"use client";

import { useState, useCallback } from "react";
import { minutesToTime } from "@/lib/dates";
import { format } from "date-fns";
import type { Client, ClientTask, ClientSession } from "@/types";

interface ClientPanelProps {
  session: ClientSession;
  client: Client;
  tasks: ClientTask[];
  allSessions: ClientSession[];
  onUpdateSession: (s: ClientSession) => void;
  onDeleteSession: (id: string) => void;
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClose: () => void;
}

export function ClientPanel({
  session, client, tasks, allSessions,
  onUpdateSession, onDeleteSession,
  onAddTask, onToggleTask, onDeleteTask,
  onClose,
}: ClientPanelProps) {
  const [taskDraft, setTaskDraft] = useState("");
  const [notes, setNotes] = useState(session.notes);
  const [actualMins, setActualMins] = useState(session.actualMinutes?.toString() ?? "");
  const [dirty, setDirty] = useState(false);

  const scheduledMins = session.endMinute - session.startMinute;

  const save = useCallback(() => {
    onUpdateSession({
      ...session,
      notes,
      actualMinutes: actualMins ? parseInt(actualMins) : null,
    });
    setDirty(false);
  }, [session, notes, actualMins, onUpdateSession]);

  const commitTask = () => {
    if (!taskDraft.trim()) return;
    onAddTask(taskDraft.trim());
    setTaskDraft("");
  };

  const pastSessions = allSessions
    .filter((s) => s.id !== session.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return (
    <div
      className="fixed right-0 top-0 bottom-0 w-[400px] z-50 flex flex-col shadow-2xl animate-fade-up"
      style={{
        backgroundColor: "var(--color-paper-cream)",
        borderLeft: `4px solid ${client.color}`,
        boxShadow: "-4px 0 32px rgba(26,15,7,0.12)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b-2 border-paper-line flex-shrink-0"
        style={{ backgroundColor: `${client.color}12` }}
      >
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: client.color }} />
          <div>
            <h2
              className="text-lg font-semibold text-paper-ink leading-tight"
              style={{ fontFamily: "var(--font-serif)", color: client.color }}
            >
              {client.name}
            </h2>
            <p className="text-xs text-paper-ink-light" style={{ fontFamily: "var(--font-serif)" }}>
              {minutesToTime(session.startMinute)} – {minutesToTime(session.endMinute)} · {scheduledMins}m scheduled
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { if (confirm("Delete this session?")) onDeleteSession(session.id); }}
            className="text-xs text-paper-ink-light hover:text-paper-rust transition-colors"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            delete
          </button>
          <button
            onClick={onClose}
            className="text-xl font-bold text-paper-ink-light hover:text-paper-ink transition-colors w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Time tracking */}
        <div className="px-5 py-4 border-b border-paper-line/50">
          <p className="text-xs font-bold uppercase tracking-widest text-paper-ink-light mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            Time Spent
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={actualMins}
              onChange={(e) => { setActualMins(e.target.value); setDirty(true); }}
              placeholder={`${scheduledMins}`}
              min={0}
              className="w-20 text-2xl font-light border-b-2 border-paper-line bg-transparent outline-none text-center pb-1 text-paper-ink focus:border-paper-rust transition-colors"
              style={{ fontFamily: "var(--font-serif)", color: client.color }}
            />
            <span className="text-sm text-paper-ink-light" style={{ fontFamily: "var(--font-serif)" }}>
              minutes{actualMins && parseInt(actualMins) !== scheduledMins
                ? ` (${parseInt(actualMins) > scheduledMins ? "+" : ""}${parseInt(actualMins) - scheduledMins} vs scheduled)`
                : ""}
            </span>
          </div>
        </div>

        {/* Session notes */}
        <div className="px-5 py-4 border-b border-paper-line/50">
          <p className="text-xs font-bold uppercase tracking-widest text-paper-ink-light mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            Session Log
          </p>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
            placeholder="What did you work on this session?"
            rows={4}
            className="w-full text-sm bg-paper-warm/50 border-2 border-paper-line rounded-sm px-3 py-2 outline-none resize-none text-paper-ink placeholder:text-paper-line/70 focus:border-paper-ink-light transition-colors leading-relaxed"
            style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}
          />
          {dirty && (
            <button
              onClick={save}
              className="mt-2 text-xs px-3 py-1 rounded-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: client.color, fontFamily: "var(--font-serif)" }}
            >
              Save
            </button>
          )}
        </div>

        {/* Tasks */}
        <div className="px-5 py-4 border-b border-paper-line/50">
          <p className="text-xs font-bold uppercase tracking-widest text-paper-ink-light mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Tasks · {pendingTasks.length} remaining
          </p>

          {pendingTasks.map((t) => (
            <ClientTaskRow key={t.id} task={t} clientColor={client.color} onToggle={onToggleTask} onDelete={onDeleteTask} />
          ))}

          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-paper-line/40">
            <span className="font-bold text-base flex-shrink-0" style={{ color: client.color }}>+</span>
            <input
              type="text"
              value={taskDraft}
              onChange={(e) => setTaskDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitTask()}
              placeholder="add task..."
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-paper-line text-paper-ink font-medium"
              style={{ fontFamily: "var(--font-body)" }}
            />
          </div>

          {doneTasks.length > 0 && (
            <details className="mt-3">
              <summary
                className="text-xs text-paper-ink-light cursor-pointer hover:text-paper-ink transition-colors list-none flex items-center gap-1"
                style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
              >
                <span>▸ {doneTasks.length} completed</span>
              </summary>
              <div className="mt-1 space-y-0.5">
                {doneTasks.map((t) => (
                  <ClientTaskRow key={t.id} task={t} clientColor={client.color} onToggle={onToggleTask} onDelete={onDeleteTask} />
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Work history */}
        {pastSessions.length > 0 && (
          <div className="px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-paper-ink-light mb-3" style={{ fontFamily: "var(--font-serif)" }}>
              Work History
            </p>
            <div className="space-y-3">
              {pastSessions.map((s) => (
                <div key={s.id} className="border-l-2 pl-3 py-0.5" style={{ borderColor: client.color + "60" }}>
                  <p className="text-xs text-paper-ink-light font-medium" style={{ fontFamily: "var(--font-serif)" }}>
                    {s.date} · {minutesToTime(s.startMinute)}–{minutesToTime(s.endMinute)}
                    {s.actualMinutes ? ` · ${s.actualMinutes}m spent` : ""}
                  </p>
                  {s.notes && (
                    <p className="text-sm text-paper-ink mt-0.5 leading-snug" style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}>
                      {s.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientTaskRow({ task, clientColor, onToggle, onDelete }: {
  task: ClientTask;
  clientColor: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group flex items-start gap-2 py-1.5">
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
        style={{
          borderColor: task.done ? clientColor : "var(--color-paper-line)",
          backgroundColor: task.done ? clientColor : "transparent",
        }}
      >
        {task.done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-sm leading-snug ${task.done ? "text-paper-ink-light" : "text-paper-ink font-medium"}`}
        style={{ fontFamily: "var(--font-body)", textDecoration: task.done ? "line-through" : "none" }}
      >
        {task.text}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-paper-ink-light hover:text-paper-rust text-base font-bold flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}
