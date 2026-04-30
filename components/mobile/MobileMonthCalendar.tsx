"use client";

import { MobileScreenHeader } from "./MobileScreenHeader";
import { MonthView } from "@/components/planner/MonthView";
import type { Task, ClientSession, Client } from "@/types";

interface MobileMonthCalendarProps {
  activeDate: Date;
  tasks: Task[];
  sessions: ClientSession[];
  clients: Client[];
  onSelectDay: (d: Date) => void;
  onBack: () => void;
  onOpenDrawer: () => void;
}

export function MobileMonthCalendar({ activeDate, tasks, sessions, clients, onSelectDay, onBack, onOpenDrawer }: MobileMonthCalendarProps) {
  return (
    <div className="flex flex-col h-screen board-breathe board-grid">
      <MobileScreenHeader title="Month" onBack={onBack} onOpenDrawer={onOpenDrawer} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <MonthView
          date={activeDate}
          tasks={tasks}
          sessions={sessions}
          clients={clients}
          onSelectDay={onSelectDay}
        />
      </div>
    </div>
  );
}
