"use client";

import { useState, useRef } from "react";
import { format, addDays, subDays } from "date-fns";
import { isToday, minutesToTime, getWeekId } from "@/lib/dates";
import { TaskList } from "./TaskList";
import { NoteCard } from "./NoteCard";
import { EventBlock } from "./EventBlock";
import { Modal } from "@/components/ui/Modal";
import type { CalendarEvent, Task, Note, Client, ClientSession } from "@/types";

const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const PX_PER_HOUR = 80;
const GRID_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

interface DayViewProps {
  date: Date;
  onNavigate: (date: Date) => void;
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
  planningSlot?: React.ReactNode;
}

export function DayView({
  date, onNavigate,
  events, tasks, notes, clients, sessions, selectedClient,
  onAddTask, onToggleTask, onRemoveTask,
  onSaveNote, onAddNotePhoto,
  onAddSession, onSelectSession,
  planningSlot,
}: DayViewProps) {
  // dayIndex: 0=Mon ... 6=Sun. date.getDay() returns 0=Sun, 1=Mon...
  const rawDay = date.getDay();
  const dayIndex = rawDay === 0 ? 6 : rawDay - 1;
  const weekId = getWeekId(date);

  const today = isToday(date);
  const dayTasks = tasks.filter((t) => t.dayIndex === dayIndex);
  const dayNote = notes.find((n) => n.dayIndex === dayIndex);
  const daySessions = sessions.filter((s) => s.dayIndex === dayIndex && s.weekId === weekId);

  const [addBlockModal, setAddBlockModal] = useState<{ startMinute: number } | null>(null);
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("10:00");

  const handleTimeGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
    setAddBlockModal({ startMinute: snapped });
  };

  const commitBlock = () => {
    if (!selectedClient || !addBlockModal) return;
    const [sh, sm] = blockStart.split(":").map(Number);
    const [eh, em] = blockEnd.split(":").map(Number);
    const startMinute = sh * 60 + sm;
    const endMinute = eh * 60 + em;
    if (endMinute <= startMinute) return;
    onAddSession({
      clientId: selectedClient.id,
      weekId,
      dayIndex,
      startMinute,
      endMinute,
      actualMinutes: null,
      notes: "",
      date: format(date, "yyyy-MM-dd"),
    });
    setAddBlockModal(null);
  };

  const dayEvents = events.filter((e) => {
    const d = new Date(e.start);
    return d.getDay() === rawDay;
  });

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left 1/3: planning panel */}
      <div
        className="flex flex-col border-r-2 border-paper-line bg-paper-warm/40 overflow-y-auto"
        style={{ width: "33.333%", minWidth: 280, maxWidth: 420 }}
      >
        {/* Day header */}
        <div
          className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b-2 border-paper-line"
          style={{ backgroundColor: today ? "rgba(196,72,32,0.06)" : "var(--color-paper-warm)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-1"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: today ? "var(--color-paper-rust)" : "var(--color-paper-ink-light)",
                }}
              >
                {format(date, "EEEE")}
              </p>
              <p
                className="text-7xl font-light leading-none"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: today ? "var(--color-paper-rust)" : "var(--color-paper-ink)",
                }}
              >
                {format(date, "d")}
              </p>
              <p
                className="text-sm text-paper-ink-light mt-1"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {format(date, "MMMM yyyy")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigate(subDays(date, 1))}
                className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-paper-line text-paper-ink-light hover:text-paper-ink hover:border-paper-ink transition-all text-sm"
                aria-label="Previous day"
              >
                ←
              </button>
              <button
                onClick={() => onNavigate(addDays(date, 1))}
                className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-paper-line text-paper-ink-light hover:text-paper-ink hover:border-paper-ink transition-all text-sm"
                aria-label="Next day"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Tasks */}
          <section>
            <h3
              className="text-xs font-bold uppercase tracking-[0.15em] text-paper-rust mb-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <span className="block w-4 h-0.5 bg-paper-rust rounded" />
              Tasks
            </h3>
            <TaskList
              tasks={tasks}
              dayIndex={dayIndex}
              onAdd={(text) => onAddTask(dayIndex, text)}
              onToggle={onToggleTask}
              onRemove={onRemoveTask}
            />
          </section>

          <div className="border-t-2 border-paper-line/50" />

          {/* Notes */}
          <section>
            <h3
              className="text-xs font-bold uppercase tracking-[0.15em] text-paper-ink-light mb-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <span className="block w-4 h-0.5 bg-paper-ink-light/50 rounded" />
              Notes
            </h3>
            <NoteCard
              note={dayNote}
              dayIndex={dayIndex}
              weekId={weekId}
              onSave={(text, photoIds) => onSaveNote(dayIndex, text, photoIds)}
              onAddPhoto={(photoId) => onAddNotePhoto(dayIndex, photoId)}
            />
          </section>

          {/* Client sessions for this day */}
          {daySessions.length > 0 && (
            <>
              <div className="border-t-2 border-paper-line/50" />
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-[0.15em] text-paper-sage mb-3 flex items-center gap-2"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  <span className="block w-4 h-0.5 bg-paper-sage rounded" />
                  Client Work Today
                </h3>
                <div className="space-y-2">
                  {daySessions.map((s) => {
                    const client = clients.find((c) => c.id === s.clientId);
                    if (!client) return null;
                    return (
                      <button
                        key={s.id}
                        onClick={() => onSelectSession(s)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm hover:brightness-95 transition-all text-left"
                        style={{
                          backgroundColor: `${client.color}14`,
                          borderLeft: `4px solid ${client.color}`,
                        }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: client.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: client.color, fontFamily: "var(--font-serif)" }}>
                            {client.name}
                          </p>
                          <p className="text-xs text-paper-ink-light" style={{ fontFamily: "var(--font-serif)" }}>
                            {minutesToTime(s.startMinute)} – {minutesToTime(s.endMinute)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* Planning slot (clients manager + goals) */}
          {planningSlot}
        </div>
      </div>

      {/* Right 2/3: time grid */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          className="overflow-y-auto flex-1"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="flex" style={{ height: GRID_HEIGHT, minWidth: 0 }}>
            {/* Time axis */}
            <div
              className="flex-shrink-0 border-r-2 border-paper-line bg-paper-cream/80 relative"
              style={{ width: 64, height: GRID_HEIGHT }}
            >
              {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
                const hour = START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="absolute right-2 text-right"
                    style={{ top: i * PX_PER_HOUR - 8 }}
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

            {/* Main time column */}
            <div
              className={`flex-1 relative ${selectedClient ? "cursor-crosshair" : ""}`}
              style={{ height: GRID_HEIGHT, backgroundColor: today ? "rgba(196,72,32,0.015)" : undefined }}
              onClick={handleTimeGridClick}
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

              {/* Half-hour ticks */}
              {Array.from({ length: TOTAL_HOURS }, (_, h) => (
                <div
                  key={`half-${h}`}
                  className="absolute left-0"
                  style={{
                    top: h * PX_PER_HOUR + PX_PER_HOUR / 2,
                    width: 12,
                    borderTop: `1px solid var(--color-paper-line)`,
                    opacity: 0.4,
                  }}
                />
              ))}

              {/* Google Calendar events */}
              {dayEvents.map((e) => (
                <EventBlock key={e.id} event={e} pxPerHour={PX_PER_HOUR} startHour={START_HOUR} />
              ))}

              {/* Client session blocks */}
              {daySessions.map((s) => {
                const client = clients.find((c) => c.id === s.clientId);
                if (!client) return null;
                const top = (s.startMinute - START_HOUR * 60) * (PX_PER_HOUR / 60);
                const height = Math.max(28, (s.endMinute - s.startMinute) * (PX_PER_HOUR / 60));
                return (
                  <div
                    key={s.id}
                    className="absolute left-2 right-2 rounded-sm px-3 py-1.5 cursor-pointer hover:brightness-95 transition-all"
                    style={{
                      top,
                      height,
                      backgroundColor: `${client.color}28`,
                      borderLeft: `5px solid ${client.color}`,
                      boxShadow: `2px 2px 8px ${client.color}18`,
                    }}
                    onClick={(e) => { e.stopPropagation(); onSelectSession(s); }}
                    title={`${client.name} · ${minutesToTime(s.startMinute)}–${minutesToTime(s.endMinute)}`}
                  >
                    <p className="text-sm font-bold leading-tight truncate" style={{ color: client.color, fontFamily: "var(--font-serif)" }}>
                      {client.name}
                    </p>
                    {height >= 44 && (
                      <p className="text-xs leading-none mt-0.5" style={{ color: client.color, opacity: 0.7 }}>
                        {minutesToTime(s.startMinute)}–{minutesToTime(s.endMinute)}
                        {s.actualMinutes ? ` · ${s.actualMinutes}m` : ""}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Click hint when client selected */}
              {selectedClient && (
                <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
                  <span
                    className="mt-3 text-xs italic opacity-25 select-none"
                    style={{ color: selectedClient.color, fontFamily: "var(--font-serif)" }}
                  >
                    click to add {selectedClient.name} block
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
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
