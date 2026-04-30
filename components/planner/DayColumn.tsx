"use client";

import { format } from "date-fns";
import { isToday } from "@/lib/dates";
import { EventBlock } from "./EventBlock";
import { TaskList } from "./TaskList";
import { NoteCard } from "./NoteCard";
import type { CalendarEvent, Task, Note } from "@/types";

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = END_HOUR - START_HOUR;
const PX_PER_HOUR = 60;
const GRID_HEIGHT = HOURS * PX_PER_HOUR;

interface DayColumnProps {
  date: Date;
  dayIndex: number;
  events: CalendarEvent[];
  tasks: Task[];
  note: Note | undefined;
  weekId: string;
  focusedDay: number | null;
  onFocusDay: (dayIndex: number | null) => void;
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onSaveNote: (text: string, photoIds?: string[]) => void;
  onAddNotePhoto: (photoId: string) => void;
}

const allDayEvents = (events: CalendarEvent[]) => events.filter((e) => e.isAllDay);
const timedEvents = (events: CalendarEvent[]) => events.filter((e) => !e.isAllDay);

export function DayColumn({
  date,
  dayIndex,
  events,
  tasks,
  note,
  weekId,
  focusedDay,
  onFocusDay,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onSaveNote,
  onAddNotePhoto,
}: DayColumnProps) {
  const today = isToday(date);
  const dimmed = focusedDay !== null && focusedDay !== dayIndex;

  const dayAllDay = allDayEvents(events);
  const dayTimed = timedEvents(events);

  return (
    <div
      className={`flex flex-col border-r-2 border-paper-line last:border-r-0 transition-all ${dimmed ? "focus-dimmed" : "focus-active"}`}
      style={{ minWidth: "140px" }}
    >
      {/* Day header */}
      <div
        className={`flex flex-col items-center py-3 border-b-2 cursor-pointer select-none flex-shrink-0 transition-colors
          ${today
            ? "bg-paper-rust/10 border-paper-rust/40"
            : "bg-paper-cream border-paper-line hover:bg-paper-warm/60"
          }`}
        onClick={() => onFocusDay(focusedDay === dayIndex ? null : dayIndex)}
        title={focusedDay === dayIndex ? "Exit focus mode" : "Focus this day"}
      >
        <span
          className="text-xs uppercase tracking-[0.15em] font-bold"
          style={{
            fontFamily: "var(--font-serif)",
            color: today ? "var(--color-paper-rust)" : "var(--color-paper-ink-light)",
          }}
        >
          {format(date, "EEE")}
        </span>
        <span
          className="text-3xl font-light leading-none mt-1"
          style={{
            fontFamily: "var(--font-serif)",
            color: today ? "var(--color-paper-rust)" : "var(--color-paper-ink)",
            ...(today && {
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "2px solid var(--color-paper-rust)",
              backgroundColor: "rgba(196, 72, 32, 0.08)",
            }),
          }}
        >
          {format(date, "d")}
        </span>
      </div>

      {/* All-day events */}
      {dayAllDay.length > 0 && (
        <div className="px-2 py-1.5 border-b-2 border-paper-line flex-shrink-0 bg-paper-dust-blue/10">
          {dayAllDay.map((e) => (
            <div
              key={e.id}
              className="text-xs px-2 py-1 rounded-sm mb-0.5 text-paper-dust-blue bg-paper-dust-blue/15 font-medium truncate"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {e.summary}
            </div>
          ))}
        </div>
      )}

      {/* Tasks section */}
      <div className="flex-shrink-0 py-2 border-b-2 border-paper-line">
        <TaskList
          tasks={tasks}
          dayIndex={dayIndex}
          onAdd={onAddTask}
          onToggle={onToggleTask}
          onRemove={onRemoveTask}
        />
      </div>

      {/* Time grid */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{ height: GRID_HEIGHT }}
      >
        {Array.from({ length: HOURS + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0"
            style={{
              top: i * PX_PER_HOUR,
              borderTop: `1px solid var(--color-paper-line)`,
              opacity: i % 2 === 0 ? 0.9 : 0.4,
            }}
          />
        ))}

        {dayTimed.map((e) => (
          <EventBlock key={e.id} event={e} />
        ))}
      </div>

      {/* Notes */}
      <div className="flex-shrink-0 border-t-2 border-paper-line mt-auto">
        <NoteCard
          note={note}
          dayIndex={dayIndex}
          weekId={weekId}
          onSave={onSaveNote}
          onAddPhoto={onAddNotePhoto}
        />
      </div>
    </div>
  );
}
