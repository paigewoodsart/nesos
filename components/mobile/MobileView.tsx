"use client";

import { useState, useCallback } from "react";
import { MobileHome } from "./MobileHome";
import { MobileDrawer } from "./MobileDrawer";
import { MobileThisWeek } from "./MobileThisWeek";
import { MobileBrainDump } from "./MobileBrainDump";
import { MobileGoals } from "./MobileGoals";
import { MobileProject } from "./MobileProject";
import { MobileArchive } from "./MobileArchive";
import { MobileProjects } from "./MobileProjects";
import { MobileWeekCalendar } from "./MobileWeekCalendar";
import { MobileMonthCalendar } from "./MobileMonthCalendar";
import type { Task, Goal, Client, ClientTask, ClientSession, CalendarEvent } from "@/types";

type MobileScreen =
  | "home"
  | "thisweek"
  | "braindump"
  | "goals"
  | "projects"
  | `project:${string}`
  | "archive"
  | "calendar-week"
  | "calendar-month";

interface MobileViewProps {
  weekId: string;
  tasks: Task[];
  weekGoals: Goal[];
  longtermGoals: Goal[];
  brainDump: string;
  sessions: ClientSession[];
  onAddTask: (partial: Omit<Task, "id" | "weekId" | "createdAt" | "sortOrder">) => Promise<Task>;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onRenameGoal: (id: string, text: string) => void;
  onAddGoal: (text: string, type: "weekly" | "longterm") => void;
  onBrainDumpChange: (text: string) => void;
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  onAddClientTask: (clientId: string, text: string, due?: string | null) => Promise<ClientTask>;
  onToggleClientTask: (clientId: string, taskId: string) => void;
  onArchiveClientTask: (clientId: string, taskId: string) => void;
  onUpdateClientTask: (clientId: string, task: ClientTask) => void;
  onAddClient: (name: string, color: string) => Promise<Client>;
  events: CalendarEvent[];
  activeDate: Date;
  onDayChange: (d: Date) => void;
}

export function MobileView({
  tasks, weekGoals, longtermGoals, brainDump, sessions,
  onAddTask, onToggleTask, onRemoveTask,
  onToggleGoal, onRemoveGoal, onRenameGoal, onAddGoal, onBrainDumpChange,
  clients, tasksByClient,
  onAddClientTask, onToggleClientTask, onArchiveClientTask, onUpdateClientTask, onAddClient,
  events, activeDate, onDayChange,
}: MobileViewProps) {
  const [screen, setScreen] = useState<MobileScreen>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useCallback((s: string) => {
    setScreen(s as MobileScreen);
    setDrawerOpen(false);
  }, []);

  const weekTasks = tasks.filter((t) => t.dayIndex === -1);
  const openDrawer = () => setDrawerOpen(true);

  const addWeekTask = (text: string) =>
    onAddTask({ dayIndex: -1, text, completed: false, startMinute: null, endMinute: null, recurring: false, recurringPattern: null });

  return (
    <div className="relative h-screen overflow-hidden bg-paper-cream">
      {screen === "home" && (
        <MobileHome onOpenDrawer={openDrawer} />
      )}

      {screen === "thisweek" && (
        <MobileThisWeek
          weekTasks={weekTasks}
          clients={clients}
          tasksByClient={tasksByClient}
          events={events}
          onToggleWeekTask={onToggleTask}
          onRemoveWeekTask={onRemoveTask}
          onAddWeekTask={addWeekTask}
          onToggleClientTask={onToggleClientTask}
          onBack={() => setScreen("home")}
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "braindump" && (
        <MobileBrainDump
          brainDump={brainDump}
          onBrainDumpChange={onBrainDumpChange}
          onBack={() => setScreen("home")}
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "goals" && (
        <MobileGoals
          weekGoals={weekGoals}
          longtermGoals={longtermGoals}
          onToggleGoal={onToggleGoal}
          onRemoveGoal={onRemoveGoal}
          onAddGoal={onAddGoal}
          onBack={() => setScreen("home")}
          onOpenDrawer={openDrawer}
        />
      )}

      {screen.startsWith("project:") && (() => {
        const clientId = screen.slice(8);
        const client = clients.find((c) => c.id === clientId);
        if (!client) return null;
        return (
          <MobileProject
            client={client}
            tasks={tasksByClient[clientId] ?? []}
            onAddTask={onAddClientTask}
            onToggleTask={onToggleClientTask}
            onArchiveTask={onArchiveClientTask}
            onUpdateTask={onUpdateClientTask}
            onBack={() => setScreen("home")}
            onOpenDrawer={openDrawer}
          />
        );
      })()}

      {screen === "projects" && (
        <MobileProjects
          clients={clients}
          onSelectProject={(id) => navigate(`project:${id}`)}
          onAddClient={onAddClient}
          onBack={() => setScreen("home")}
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "archive" && (
        <MobileArchive
          clients={clients}
          tasksByClient={tasksByClient}
          onBack={() => setScreen("home")}
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "calendar-week" && (
        <MobileWeekCalendar
          activeDate={activeDate}
          tasks={tasks}
          events={events}
          onBack={() => setScreen("home")}
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "calendar-month" && (
        <MobileMonthCalendar
          activeDate={activeDate}
          tasks={tasks}
          sessions={sessions}
          clients={clients}
          onSelectDay={(d) => { onDayChange(d); navigate("calendar-week"); }}
          onBack={() => setScreen("home")}
          onOpenDrawer={openDrawer}
        />
      )}

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        screen={screen}
        onNavigate={navigate}
      />
    </div>
  );
}
