"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { getWeekDays, isToday, minutesToTime } from "@/lib/dates";
import { TaskList } from "./TaskList";
import { NoteCard } from "./NoteCard";
import { EventBlock } from "./EventBlock";
import { Modal } from "@/components/ui/Modal";
import type { CalendarEvent, Task, Note, Client, ClientSession } from "@/types";

const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const PX_PER_HOUR = 60;
const GRID_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;
const TIME_COL_W = 56;
const TASK_PANE_H = 180; // fixed height so time axis always aligns

interface WeekGridProps {
  weekId: string;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  clients: Client[];
  sessions: ClientSession[];
  selectedClient: Client | null;
  onAddTask: (dayIndex: number, text: string) => void;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onSaveNote: (dayIndex: number, text: string, photoIds?: string[]) => void;
  onAddNotePhoto: (dayIndex: number, photoId: string) => void;
  onAddSession: (session: Omit<ClientSession, "id" | "createdAt">) => void;
  onSelectSession: (session: ClientSession) => void;
}

export function WeekGrid({
  weekId, events, tasks, notes, clients, sessions, selectedClient,
  onAddTask, onToggleTask, onRemoveTask,
  onSaveNote, onAddNotePhoto,
  onAddSession, onSelectSession,
}: WeekGridProps) {
  const days = getWeekDays(weekId);
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  const [addBlockModal, setAddBlockModal] = useState<{ dayIndex: number; startMinute: number } | null>(null);
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("10:00");
  const gridRef = useRef<HTMLDivElement>(null);

  const getEventsForDay = (dayIndex: number) =>
    events.filter((e) => {
      const d = new Date(e.start);
      return d.getDay() === (dayIndex === 6 ? 0 : dayIndex + 1);
    });

  const getSessionsForDay = (dayIndex: number) =>
    sessions.filter((s) => s.dayIndex === dayIndex);

  const handleTimeGridClick = (dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedClient) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minute = Math.round((y / PX_PER_HOUR) * 60) + START_HOUR * 60;
    const snapped = Math.round(minute / 15) * 15;
    const hh = Math.floor(snapped / 60).toString().padStart(2, "0");
    const mm = (snapped % 60).toString().padStart(2, "0");
    setBlockStart(`${hh}:${mm}`);
    const endMin = snapped + 60;
    const ehh = Math.floor(endMin / 60).toString().padStart(2, "0");
    const emm = (endMin % 60).toString().padStart(2, "0");
    setBlockEnd(`${ehh}:${emm}`);
    setAddBlockModal({ dayIndex, startMinute: snapped });
  };

  const commitBlock = () => {
    if (!selectedClient || !addBlockModal) return;
    const [sh, sm] = blockStart.split(":").map(Number);
    const [eh, em] = blockEnd.split(":").map(Number);
    const startMinute = sh * 60 + sm;
    const endMinute = eh * 60 + em;
    if (endMinute <= startMinute) return;
    const day = days[addBlockModal.dayIndex];
    onAddSession({
      clientId: selectedClient.id,
      weekId,
      dayIndex: addBlockModal.dayIndex,
      startMinute,
      endMinute,
      actualMinutes: null,
      notes: "",
      date: format(day, "yyyy-MM-dd"),
    });
    setAddBlockModal(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Row 1: sticky day headers ── */}
      <div className="flex flex-shrink-0 border-b-2 border-paper-line bg-paper-cream" style={{ minWidth: "900px" }}>
        <div style={{ width: TIME_COL_W, minWidth: TIME_COL_W }} className="flex-shrink-0 border-r-2 border-paper-line" />
        {days.map((date, i) => {
          const today = isToday(date);
          const dimmed = focusedDay !== null && focusedDay !== i;
          return (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center py-3 border-r-2 border-paper-line last:border-r-0 cursor-pointer select-none transition-all
                ${today ? "bg-paper-rust/8" : "hover:bg-paper-warm/50"}
                ${dimmed ? "opacity-20" : ""}`}
              onClick={() => setFocusedDay(focusedDay === i ? null : i)}
              title={focusedDay === i ? "Exit focus" : "Focus this day"}
            >
              <span
                className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ fontFamily: "var(--font-serif)", color: today ? "var(--color-paper-rust)" : "var(--color-paper-ink-light)" }}
              >
                {format(date, "EEE")}
              </span>
              <span
                className="text-3xl font-light leading-none mt-1"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: today ? "var(--color-paper-rust)" : "var(--color-paper-ink)",
                  ...(today && {
                    width: "44px", height: "44px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    borderRadius: "50%", border: "2px solid var(--color-paper-rust)",
                    backgroundColor: "rgba(196,72,32,0.08)",
                  }),
                }}
              >
                {format(date, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Row 2: tasks + notes (fixed height, scrollable per column) ── */}
      <div className="flex flex-shrink-0 border-b-2 border-paper-line" style={{ minWidth: "900px", height: TASK_PANE_H }}>
        <div
          style={{ width: TIME_COL_W, minWidth: TIME_COL_W }}
          className="flex-shrink-0 border-r-2 border-paper-line bg-paper-cream/80 flex items-start justify-end pr-2 pt-2"
        >
          <span className="text-[10px] italic text-paper-ink-light" style={{ fontFamily: "var(--font-serif)" }}>tasks</span>
        </div>
        {days.map((_, i) => {
          const dimmed = focusedDay !== null && focusedDay !== i;
          return (
            <div
              key={i}
              className={`flex-1 overflow-y-auto border-r-2 border-paper-line last:border-r-0 transition-all ${dimmed ? "opacity-20 pointer-events-none" : ""}`}
            >
              <div className="pt-1">
                <TaskList
                  tasks={tasks}
                  dayIndex={i}
                  onAdd={(text) => onAddTask(i, text)}
                  onToggle={onToggleTask}
                  onRemove={onRemoveTask}
                />
              </div>
              <NoteCard
                note={notes.find((n) => n.dayIndex === i)}
                dayIndex={i}
                weekId={weekId}
                onSave={(text, photoIds) => onSaveNote(i, text, photoIds)}
                onAddPhoto={(photoId) => onAddNotePhoto(i, photoId)}
              />
            </div>
          );
        })}
      </div>

      {/* ── Row 3: time grid (scrolls as one unit) ── */}
      <div className="flex flex-1 overflow-y-auto min-h-0" style={{ minWidth: "900px" }}>
        {/* Time axis */}
        <div
          className="flex-shrink-0 border-r-2 border-paper-line bg-paper-cream/80 relative"
          style={{ width: TIME_COL_W, minWidth: TIME_COL_W, height: GRID_HEIGHT }}
        >
          {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
            const hour = START_HOUR + i;
            return (
              <div
                key={hour}
                className="absolute right-2 text-right"
                style={{ top: i * PX_PER_HOUR - 7 }}
              >
                <span
                  className="text-xs font-medium italic"
                  style={{ color: "var(--color-paper-ink-light)", fontFamily: "var(--font-serif)" }}
                >
                  {hour === 12 ? "noon" : hour > 12 ? `${hour - 12}p` : `${hour}a`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Day time columns */}
        {days.map((_, i) => {
          const dimmed = focusedDay !== null && focusedDay !== i;
          const daySessions = getSessionsForDay(i);
          const dayEvents = getEventsForDay(i);
          const showCursor = !!selectedClient;

          return (
            <div
              key={i}
              className={`flex-1 relative border-r-2 border-paper-line last:border-r-0 transition-all ${dimmed ? "opacity-20 pointer-events-none" : ""} ${showCursor ? "cursor-crosshair" : ""}`}
              style={{ height: GRID_HEIGHT }}
              onClick={(e) => handleTimeGridClick(i, e)}
            >
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS + 1 }, (_, h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0"
                  style={{
                    top: h * PX_PER_HOUR,
                    borderTop: `1px solid var(--color-paper-line)`,
                    opacity: h % 2 === 0 ? 0.85 : 0.35,
                  }}
                />
              ))}

              {/* Google Calendar events */}
              {dayEvents.map((e) => (
                <EventBlock key={e.id} event={e} />
              ))}

              {/* Client session blocks */}
              {daySessions.map((s) => {
                const client = clients.find((c) => c.id === s.clientId);
                if (!client) return null;
                const top = (s.startMinute - START_HOUR * 60);
                const height = Math.max(24, s.endMinute - s.startMinute);
                return (
                  <div
                    key={s.id}
                    className="absolute left-1 right-1 rounded-sm px-2 py-1 cursor-pointer hover:brightness-95 transition-all"
                    style={{
                      top,
                      height,
                      backgroundColor: `${client.color}28`,
                      borderLeft: `4px solid ${client.color}`,
                      boxShadow: `1px 1px 6px ${client.color}20`,
                    }}
                    onClick={(e) => { e.stopPropagation(); onSelectSession(s); }}
                    title={`${client.name} · ${minutesToTime(s.startMinute)}–${minutesToTime(s.endMinute)}`}
                  >
                    <p className="text-xs font-bold leading-tight truncate" style={{ color: client.color, fontFamily: "var(--font-serif)" }}>
                      {client.name}
                    </p>
                    {height >= 36 && (
                      <p className="text-[10px] leading-none mt-0.5" style={{ color: client.color, opacity: 0.7 }}>
                        {minutesToTime(s.startMinute)}–{minutesToTime(s.endMinute)}
                        {s.actualMinutes ? ` · ${s.actualMinutes}m` : ""}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* "Click to add" hint when client selected */}
              {showCursor && !dimmed && (
                <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
                  <span
                    className="mt-2 text-[10px] italic opacity-30 select-none"
                    style={{ color: selectedClient?.color, fontFamily: "var(--font-serif)" }}
                  >
                    click to add {selectedClient?.name} block
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add client block modal */}
      <Modal
        open={!!addBlockModal}
        onClose={() => setAddBlockModal(null)}
        title={selectedClient ? `${selectedClient.name} — add work block` : "Add block"}
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-paper-ink-light uppercase tracking-widest block mb-1" style={{ fontFamily: "var(--font-serif)" }}>Start</label>
              <input
                type="time"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                className="w-full border-b-2 border-paper-line bg-transparent outline-none text-paper-ink text-base pb-1 focus:border-paper-rust transition-colors"
                style={{ fontFamily: "var(--font-serif)" }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-paper-ink-light uppercase tracking-widest block mb-1" style={{ fontFamily: "var(--font-serif)" }}>End</label>
              <input
                type="time"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                className="w-full border-b-2 border-paper-line bg-transparent outline-none text-paper-ink text-base pb-1 focus:border-paper-rust transition-colors"
                style={{ fontFamily: "var(--font-serif)" }}
              />
            </div>
          </div>
          <button
            onClick={commitBlock}
            className="w-full py-2 text-sm font-medium rounded-sm text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: selectedClient?.color, fontFamily: "var(--font-serif)" }}
          >
            Add block
          </button>
        </div>
      </Modal>
    </div>
  );
}
