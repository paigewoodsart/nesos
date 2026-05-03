"use client";

import { useState } from "react";
import { MobileScreenHeader } from "./MobileScreenHeader";
import { formatEventTime, isoToMinutes, isWithinNextDays, isEventToday, parseDueDate } from "@/lib/dates";
import { DueBadge } from "@/components/shared/DueBadge";
import type { Task, Client, ClientTask, CalendarEvent } from "@/types";

const CREAMSICLE = "#F4956A";

interface MobileThisWeekProps {
  weekTasks: Task[];
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  events: CalendarEvent[];
  onToggleWeekTask: (id: string) => void;
  onRemoveWeekTask: (id: string) => void;
  onAddWeekTask: (text: string) => void;
  onToggleClientTask: (clientId: string, taskId: string) => void;
  onOpenDrawer: () => void;
}

export function MobileThisWeek({
  weekTasks, clients, tasksByClient, events,
  onToggleWeekTask, onRemoveWeekTask, onAddWeekTask, onToggleClientTask,
  onOpenDrawer,
}: MobileThisWeekProps) {
  const [addText, setAddText] = useState("");

  const commit = () => {
    if (!addText.trim()) return;
    onAddWeekTask(addText.trim());
    setAddText("");
  };

  const pending = weekTasks.filter((t) => !t.completed);
  const done = weekTasks.filter((t) => t.completed);

  const weekMeetings = events
    .filter((e) => !e.isAllDay)
    .sort((a, b) => isoToMinutes(a.start) - isoToMinutes(b.start));

  const allClientTasks = clients.flatMap((c) =>
    (tasksByClient[c.id] ?? [])
      .filter((t) => !t.archived)
      .map((t) => ({ ...t, clientColor: c.color, clientName: c.name }))
  );

  const weekTasks7 = allClientTasks
    .filter((t) => {
      const d = parseDueDate(t.dueDate);
      return d ? isWithinNextDays(d, 7) : false;
    })
    .sort((a, b) => {
      const da = parseDueDate(a.dueDate)!;
      const db = parseDueDate(b.dueDate)!;
      return da.getTime() - db.getTime();
    });

  const todayMeetings = weekMeetings.filter((e) => isEventToday(e.start));

  return (
    <div className="flex flex-col h-dvh board-breathe board-grid">
      <MobileScreenHeader title="This Week" onOpenDrawer={onOpenDrawer} accent={CREAMSICLE} />

      {/* Progress */}
      <div className="px-5 py-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-paper-line/50 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: weekTasks.length ? `${Math.round((done.length / weekTasks.length) * 100)}%` : "0%", backgroundColor: CREAMSICLE }} />
          </div>
          <span className="text-xs text-paper-ink-light flex-shrink-0" style={{ fontFamily: "var(--font-body)" }}>{done.length}/{weekTasks.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mobile-scroll px-5 py-2 bg-white/10 backdrop-blur-md">
        {todayMeetings.length > 0 && (
          <div className="mb-4">
            <p className="text-[13px] uppercase tracking-widest mb-2 text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>Meetings Today</p>
            {todayMeetings.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/30">
                <span className="text-xs text-paper-ink-light w-10 flex-shrink-0" style={{ fontFamily: "var(--font-body)" }}>{formatEventTime(e.start)}</span>
                <span className="flex-1 text-base text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>{e.summary}</span>
              </div>
            ))}
          </div>
        )}

        {weekTasks7.length > 0 && (
          <div className="mb-4">
            <p className="text-[13px] uppercase tracking-widest mb-2 text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>Due This Week</p>
            {weekTasks7.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/30">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.clientColor }} />
                <div className="flex-1 min-w-0">
                  <span className={`block text-base truncate ${t.done ? "line-through opacity-40" : ""}`} style={{ fontFamily: "var(--font-body)", color: "#1A1A1A" }}>{t.text}</span>
                  <span className="block text-[14px] uppercase tracking-[0.15em] mt-0.5" style={{ fontFamily: "var(--font-body)", color: t.clientColor, opacity: 0.8 }}>{t.clientName}</span>
                </div>
                <DueBadge due={t.dueDate} />
                <button
                  onClick={() => onToggleClientTask(t.clientId, t.id)}
                  className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{ borderColor: t.done ? t.clientColor : "rgba(26,26,26,0.22)", backgroundColor: t.done ? t.clientColor : "transparent" }}
                >
                  {t.done && <svg width="7" height="5" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
              </div>
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-4">
            <p className="text-[13px] uppercase tracking-widest mb-2 text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>On My Plate</p>
            {pending.map((t) => (
              <div key={t.id} className="group flex items-center gap-3 py-3 border-b border-paper-line/30">
                <button onClick={() => onToggleWeekTask(t.id)} className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all" style={{ borderColor: "rgba(26,26,26,0.25)" }} />
                <span className="flex-1 text-base text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>{t.text}</span>
                <button onClick={() => onRemoveWeekTask(t.id)} className="text-paper-ink-light hover:text-paper-rust text-lg font-bold leading-none">×</button>
              </div>
            ))}
          </div>
        )}

        {done.length > 0 && (
          <details className="mt-2">
            <summary className="text-[14px] cursor-pointer list-none select-none text-paper-ink-light py-2" style={{ fontFamily: "var(--font-body)" }}>
              ▸ {done.length} done
            </summary>
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3 border-b border-paper-line/20">
                <button onClick={() => onToggleWeekTask(t.id)} className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: CREAMSICLE, backgroundColor: CREAMSICLE }}>
                  <svg width="7" height="5" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <span className="flex-1 text-base line-through opacity-40 text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>{t.text}</span>
              </div>
            ))}
          </details>
        )}

        {weekTasks.length === 0 && weekTasks7.length === 0 && weekMeetings.length === 0 && (
          <p className="text-sm text-paper-ink-light text-center mt-12" style={{ fontFamily: "var(--font-body)" }}>Nothing on the plate yet.</p>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-paper-line/30 px-5 py-3 bg-paper-cream/70 backdrop-blur-sm pb-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: CREAMSICLE }}>+</span>
          <input
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="add to plate..."
            className="flex-1 text-base bg-transparent border-none outline-none placeholder:text-paper-ink-light font-medium text-paper-ink"
            style={{ fontFamily: "var(--font-body)" }}
          />
          {addText.trim() && (
            <button onClick={commit} className="text-xs px-3 py-1 text-white rounded-full" style={{ backgroundColor: CREAMSICLE }}>add</button>
          )}
        </div>
      </div>
    </div>
  );
}
