"use client";

import { useState } from "react";
import { format, startOfISOWeek, addDays } from "date-fns";
import { MobileScreenHeader } from "./MobileScreenHeader";
import { DueBadge } from "@/components/shared/DueBadge";
import { isToday, isoToMinutes, formatEventTime, parseDueDate } from "@/lib/dates";
import type { Task, CalendarEvent } from "@/types";

const CREAMSICLE = "#F4956A";

interface MobileWeekCalendarProps {
  activeDate: Date;
  tasks: Task[];
  events: CalendarEvent[];
  onBack: () => void;
  onOpenDrawer: () => void;
}

export function MobileWeekCalendar({ activeDate, tasks, events, onBack, onOpenDrawer }: MobileWeekCalendarProps) {
  const weekStart = startOfISOWeek(activeDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const todayIndex = days.findIndex((d) => isToday(d));
  const [selectedIndex, setSelectedIndex] = useState(todayIndex >= 0 ? todayIndex : 0);

  const selectedDay = days[selectedIndex];
  const selectedDateStr = format(selectedDay, "yyyy-MM-dd");

  const dayTasks = tasks.filter((t) => {
    if (t.dayIndex < 0) return false;
    return t.dayIndex === selectedIndex;
  });

  const dayEvents = events
    .filter((e) => {
      if (e.isAllDay) return false;
      return e.start.startsWith(selectedDateStr);
    })
    .sort((a, b) => isoToMinutes(a.start) - isoToMinutes(b.start));

  const dayTasksSorted = dayTasks
    .sort((a, b) => {
      const am = a.startMinute ?? Infinity;
      const bm = b.startMinute ?? Infinity;
      return am - bm;
    });

  return (
    <div className="flex flex-col h-screen board-breathe board-grid">
      <MobileScreenHeader title="Week" onBack={onBack} onOpenDrawer={onOpenDrawer} accent={CREAMSICLE} />

      {/* Day strip */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-paper-line overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {days.map((d, i) => {
            const active = i === selectedIndex;
            const today = isToday(d);
            return (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors"
                style={{ backgroundColor: active ? CREAMSICLE : "transparent" }}
              >
                <span
                  className="text-[9px] uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-body)", color: active ? "white" : "rgba(26,26,26,0.5)" }}
                >
                  {format(d, "EEE")}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: active ? "white" : today ? CREAMSICLE : "#1A1A1A" }}
                >
                  {format(d, "d")}
                </span>
                {today && !active && (
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: CREAMSICLE }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      <div className="flex-1 overflow-y-auto mobile-scroll px-5 py-3 bg-paper-cream/60 backdrop-blur-sm">
        <p className="text-[9px] uppercase tracking-widest mb-2 text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>
          {format(selectedDay, "EEEE, MMM d")}
        </p>

        {dayEvents.map((e) => (
          <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/30">
            <span className="text-xs text-paper-ink-light w-12 flex-shrink-0" style={{ fontFamily: "var(--font-serif)" }}>
              {formatEventTime(e.start)}
            </span>
            <span className="flex-1 text-sm text-paper-ink" style={{ fontFamily: "var(--font-serif)" }}>{e.summary}</span>
          </div>
        ))}

        {dayTasksSorted.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-paper-line/30">
            {t.startMinute !== null ? (
              <span className="text-xs text-paper-ink-light w-12 flex-shrink-0" style={{ fontFamily: "var(--font-serif)" }}>
                {`${Math.floor(t.startMinute / 60)}:${String(t.startMinute % 60).padStart(2, "0")}`}
              </span>
            ) : (
              <span className="w-12 flex-shrink-0" />
            )}
            <span
              className={`flex-1 text-sm ${t.completed ? "line-through opacity-40" : "text-paper-ink"}`}
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {t.text}
            </span>
          </div>
        ))}

        {dayEvents.length === 0 && dayTasksSorted.length === 0 && (
          <p className="text-sm italic text-paper-ink-light text-center mt-12" style={{ fontFamily: "var(--font-serif)" }}>
            Nothing on this day.
          </p>
        )}
      </div>
    </div>
  );
}
