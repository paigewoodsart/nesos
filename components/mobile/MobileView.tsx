"use client";

import { useState, useCallback, useEffect } from "react";
import { THEME_BOARD_CLASS } from "@/lib/theme";
import { MobileHome } from "./MobileHome";
import { MobileDrawer } from "./MobileDrawer";
import { MobileThisWeek } from "./MobileThisWeek";
import { MobileToday } from "./MobileToday";
import { MobileBrainDump } from "./MobileBrainDump";
import { MobileGoals } from "./MobileGoals";
import { MobileArchive } from "./MobileArchive";
import { MobileProjects } from "./MobileProjects";
import { MobileDue } from "./MobileDue";
import type { Task, Goal, Client, ClientTask, ClientSession, CalendarEvent } from "@/types";

const LAST_VISIT_KEY = "nesos-last-visit";
const LAST_SCREEN_KEY = "nesos-last-screen";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

type MobileScreen =
  | "home"
  | "due"
  | "today"
  | "thisweek"
  | "braindump"
  | "goals"
  | "projects"
  | "archive";

function getInitialScreen(): MobileScreen {
  return "home";
}

interface MobileViewProps {
  weekId: string;
  userEmail: string | null;
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
  onRemoveClientTask: (clientId: string, taskId: string) => void;
  onUpdateClientTask: (clientId: string, task: ClientTask) => void;
  onAddClient: (name: string, color: string) => Promise<Client>;
  onUpdateClient: (client: Client) => Promise<void>;
  onRemoveClient: (id: string) => Promise<void>;
  onArchiveClient: (id: string) => void;
  onUnarchiveClient: (id: string) => void;
  events: CalendarEvent[];
  activeDate: Date;
  onDayChange: (d: Date) => void;
  onOpenHandbook?: () => void;
  theme?: import("@/lib/theme").Theme;
  onThemeChange?: (t: import("@/lib/theme").Theme) => void;
}

export function MobileView({
  weekId,
  userEmail,
  tasks, weekGoals, longtermGoals, brainDump, sessions,
  onAddTask, onToggleTask, onRemoveTask,
  onToggleGoal, onRemoveGoal, onRenameGoal, onAddGoal, onBrainDumpChange,
  clients, tasksByClient,
  onAddClientTask, onToggleClientTask, onArchiveClientTask, onRemoveClientTask, onUpdateClientTask,
  onAddClient, onUpdateClient, onRemoveClient, onArchiveClient, onUnarchiveClient,
  events, activeDate, onDayChange, onOpenHandbook, theme, onThemeChange,
}: MobileViewProps) {
  const [screen, setScreen] = useState<MobileScreen>(getInitialScreen);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Persist screen + visit timestamp
  useEffect(() => {
    try {
      localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
      localStorage.setItem(LAST_SCREEN_KEY, screen);
    } catch {}
  }, [screen]);

  const navigate = useCallback((s: string) => {
    setScreen(s as MobileScreen);
    setDrawerOpen(false);
  }, []);

  const weekTasks = tasks.filter((t) => t.dayIndex === -1);
  const openDrawer = () => setDrawerOpen(true);

  const addWeekTask = (text: string) =>
    onAddTask({ dayIndex: -1, text, completed: false, startMinute: null, endMinute: null, recurring: false, recurringPattern: null });

  return (
    <div className={`relative h-dvh overflow-hidden ${THEME_BOARD_CLASS[theme ?? "original"]} board-grid`}>
      {screen === "home" && (
        <MobileHome onOpenDrawer={openDrawer} isLoggedIn={!!userEmail} />
      )}

      {screen === "due" && (
        <MobileDue
          clients={clients}
          tasksByClient={tasksByClient}
          onToggleClientTask={onToggleClientTask}
          onArchiveClientTask={onArchiveClientTask}
          onRemoveClientTask={onRemoveClientTask}
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "today" && (
        <MobileToday
          clients={clients}
          tasksByClient={tasksByClient}
          onToggleClientTask={onToggleClientTask}
          onArchiveClientTask={onArchiveClientTask}
          onRemoveClientTask={onRemoveClientTask}
          onUpdateClientTask={onUpdateClientTask}
          onOpenDrawer={openDrawer}
        />
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
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "braindump" && (
        <MobileBrainDump
          weekId={weekId}
          brainDump={brainDump}
          onBrainDumpChange={onBrainDumpChange}
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
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "projects" && (
        <MobileProjects
          clients={clients}
          tasksByClient={tasksByClient}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onRemoveClient={onRemoveClient}
          onArchiveClient={onArchiveClient}
          onUnarchiveClient={onUnarchiveClient}
          onAddClientTask={onAddClientTask}
          onToggleClientTask={onToggleClientTask}
          onArchiveClientTask={onArchiveClientTask}
          onRemoveClientTask={onRemoveClientTask}
          onUpdateClientTask={onUpdateClientTask}
          onOpenDrawer={openDrawer}
        />
      )}

      {screen === "archive" && (
        <MobileArchive
          clients={clients}
          tasksByClient={tasksByClient}
          onUnarchiveClient={onUnarchiveClient}
          onOpenDrawer={openDrawer}
        />
      )}

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        screen={screen}
        onNavigate={navigate}
        onOpenHandbook={onOpenHandbook}
        theme={theme}
        onThemeChange={onThemeChange}
      />
    </div>
  );
}
