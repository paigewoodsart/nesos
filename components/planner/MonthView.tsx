"use client";

import { format, startOfMonth, endOfMonth, startOfISOWeek, addDays, isSameMonth } from "date-fns";
import { isToday } from "@/lib/dates";
import type { Task, ClientSession, Client } from "@/types";

interface MonthViewProps {
  date: Date;
  tasks: Task[];
  sessions: ClientSession[];
  clients: Client[];
  onSelectDay: (date: Date) => void;
}

export function MonthView({ date, tasks, sessions, clients, onSelectDay }: MonthViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfISOWeek(monthStart);

  // Build 6-week grid (42 cells)
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(addDays(gridStart, i));
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Month title */}
      <div className="flex-shrink-0 px-8 py-5 border-b-2 border-paper-line">
        <h2
          className="text-4xl font-light text-paper-ink"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {format(date, "MMMM")}
          <span className="text-paper-ink-light ml-3 text-2xl">{format(date, "yyyy")}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {dayNames.map((d) => (
            <div key={d} className="text-center pb-2">
              <span
                className="text-xs font-bold uppercase tracking-[0.15em] text-paper-ink-light"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-paper-line/40">
          {cells.map((cellDate, i) => {
            const inMonth = isSameMonth(cellDate, date);
            const today = isToday(cellDate);
            const rawDay = cellDate.getDay();
            const dayIndex = rawDay === 0 ? 6 : rawDay - 1;

            const dayTasks = tasks.filter((t) => t.dayIndex === dayIndex && inMonth);
            const completedCount = dayTasks.filter((t) => t.completed).length;
            const pendingCount = dayTasks.length - completedCount;

            const daySessions = sessions.filter((s) => {
              return s.dayIndex === dayIndex && s.date === format(cellDate, "yyyy-MM-dd");
            });

            return (
              <button
                key={i}
                onClick={() => onSelectDay(cellDate)}
                className={`min-h-[90px] p-2 text-left flex flex-col gap-1 transition-colors ${
                  inMonth ? "bg-paper-cream hover:bg-paper-warm/60" : "bg-paper-warm/20 hover:bg-paper-warm/40"
                } ${today ? "ring-2 ring-paper-rust ring-inset" : ""}`}
              >
                <span
                  className={`text-sm font-medium leading-none ${today ? "text-paper-rust font-bold" : inMonth ? "text-paper-ink" : "text-paper-ink-light/50"}`}
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {format(cellDate, "d")}
                </span>

                {/* Task dots */}
                {(pendingCount > 0 || completedCount > 0) && (
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {pendingCount > 0 && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-sm font-medium"
                        style={{
                          backgroundColor: "rgba(196,72,32,0.12)",
                          color: "var(--color-paper-rust)",
                          fontFamily: "var(--font-serif)",
                        }}
                      >
                        {pendingCount} task{pendingCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {completedCount > 0 && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-sm font-medium"
                        style={{
                          backgroundColor: "rgba(62,96,56,0.12)",
                          color: "var(--color-paper-sage)",
                          fontFamily: "var(--font-serif)",
                        }}
                      >
                        ✓ {completedCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Client session color strips */}
                {daySessions.length > 0 && (
                  <div className="flex gap-0.5 mt-auto flex-wrap">
                    {daySessions.map((s) => {
                      const client = clients.find((c) => c.id === s.clientId);
                      if (!client) return null;
                      return (
                        <span
                          key={s.id}
                          className="h-1.5 rounded-full flex-1"
                          style={{ backgroundColor: client.color, minWidth: 8, maxWidth: 24 }}
                          title={client.name}
                        />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
