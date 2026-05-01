"use client";

import { useCallback, useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useWeekStore } from "@/hooks/useWeekStore";
import { useClientStore } from "@/hooks/useClientStore";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getWeekId } from "@/lib/dates";
import { WeekNav } from "./WeekNav";
import { WeekGrid } from "./WeekGrid";
import { MonthView } from "./MonthView";
import { StickyBoard } from "./StickyBoard";
import { ClientPanel } from "@/components/clients/ClientPanel";
import { MobileView } from "@/components/mobile/MobileView";
import type { View } from "./ViewToggle";
import type { Client, ClientSession } from "@/types";

interface PlannerViewProps {
  weekId: string;
}

function PlannerInner({ weekId: initialWeekId }: PlannerViewProps) {
  const [view, setView] = useState<View>("board");
  const [activeDate, setActiveDate] = useState<Date>(() => new Date());
  const [activeWeekId, setActiveWeekId] = useState(initialWeekId);

  const { data: session, status: authStatus } = useSession();
  const userEmail = authStatus === "authenticated" ? (session?.user?.email ?? null) : authStatus === "unauthenticated" ? null : undefined;

  const store = useWeekStore(activeWeekId, userEmail ?? null);
  const clientStore = useClientStore(activeWeekId, userEmail ?? null);
  const { events } = useCalendarEvents(activeWeekId);
  const isMobile = useIsMobile();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openSession, setOpenSession] = useState<ClientSession | null>(null);

  const handleDayChange = useCallback((d: Date) => {
    setActiveDate(d);
    setActiveWeekId(getWeekId(d));
  }, []);

  const handleSelectSession = useCallback((session: ClientSession) => {
    setOpenSession(session);
  }, []);

  if (authStatus === "loading" || !store.loaded || !clientStore.loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-paper-ink-light italic text-sm animate-pulse-soft" style={{ fontFamily: "var(--font-serif)" }}>
          Loading your week...
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileView
        weekId={activeWeekId}
        tasks={store.tasks}
        weekGoals={store.weekGoals}
        longtermGoals={store.longtermGoals}
        brainDump={store.brainDump}
        sessions={clientStore.sessions}
        onAddTask={store.addTask}
        onToggleTask={store.toggleTask}
        onRemoveTask={store.removeTask}
        onToggleGoal={store.toggleGoal}
        onRemoveGoal={store.removeGoal}
            onRenameGoal={store.renameGoal}
        onAddGoal={store.addGoal}
        onBrainDumpChange={store.updateBrainDump}
        clients={clientStore.clients}
        tasksByClient={clientStore.tasksByClient}
        onAddClientTask={clientStore.addClientTask}
        onToggleClientTask={clientStore.toggleClientTask}
        onArchiveClientTask={clientStore.archiveClientTask}
        onUpdateClientTask={clientStore.updateClientTask}
        onAddClient={clientStore.addClient}
        events={events}
        activeDate={activeDate}
        onDayChange={handleDayChange}
      />
    );
  }

  const openSessionClient = openSession
    ? clientStore.clients.find((c) => c.id === openSession.clientId) ?? null
    : null;

  const weekTasks = store.tasks.filter((t) => t.dayIndex === -1);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WeekNav
        weekId={activeWeekId}
        bloomState={store.bloomState}
        view={view}
        onViewChange={setView}
        activeDate={activeDate}
        onDayChange={handleDayChange}
      />

      <div className="flex flex-1 min-h-0">
        {view === "board" && (
          <StickyBoard
            clients={clientStore.clients}
            tasksByClient={clientStore.tasksByClient}
            events={events}
            onAddClientTask={clientStore.addClientTask}
            onToggleClientTask={clientStore.toggleClientTask}
            onRemoveClientTask={clientStore.removeClientTask}
            onUpdateClientTask={clientStore.updateClientTask}
            onArchiveClientTask={clientStore.archiveClientTask}
            onAddClient={clientStore.addClient}
            onUpdateClient={clientStore.updateClient}
            onRemoveClient={clientStore.removeClient}
            weekTasks={weekTasks}
            onAddWeekTask={(text) =>
              store.addTask({ dayIndex: -1, text, completed: false, startMinute: null, endMinute: null, recurring: false, recurringPattern: null })
            }
            onToggleWeekTask={store.toggleTask}
            onRemoveWeekTask={store.removeTask}
            onRenameWeekTask={store.renameTask}
            weekGoals={store.weekGoals}
            longtermGoals={store.longtermGoals}
            onToggleGoal={store.toggleGoal}
            onRemoveGoal={store.removeGoal}
            onRenameGoal={store.renameGoal}
            onAddGoal={store.addGoal}
            brainDump={store.brainDump}
            onBrainDumpChange={store.updateBrainDump}
          />
        )}

        {view === "calendar" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <WeekGrid
              weekId={activeWeekId}
              events={events}
              tasks={store.tasks}
              notes={store.notes}
              clients={clientStore.clients}
              sessions={clientStore.sessions}
              selectedClient={selectedClient}
              onAddTask={(dayIndex, text) =>
                store.addTask({ dayIndex, text, completed: false, startMinute: null, endMinute: null, recurring: false, recurringPattern: null })
              }
              onToggleTask={store.toggleTask}
              onRemoveTask={store.removeTask}
              onSaveNote={(dayIndex, text, photoIds) => store.upsertNote(dayIndex, text, photoIds)}
              onAddNotePhoto={(dayIndex, photoId) => store.addNotePhoto(dayIndex, photoId)}
              onAddSession={clientStore.addSession}
              onSelectSession={handleSelectSession}
            />
          </div>
        )}

        {view === "month" && (
          <MonthView
            date={activeDate}
            tasks={store.tasks}
            sessions={clientStore.sessions}
            clients={clientStore.clients}
            onSelectDay={(d) => {
              handleDayChange(d);
              setView("calendar");
            }}
          />
        )}
      </div>

      {openSession && openSessionClient && (
        <>
          <div
            className="fixed inset-0 z-40 bg-paper-ink/10 backdrop-blur-[1px]"
            onClick={() => setOpenSession(null)}
          />
          <ClientPanel
            session={openSession}
            client={openSessionClient}
            tasks={clientStore.tasksByClient[openSessionClient.id] ?? []}
            allSessions={clientStore.sessions.filter((s) => s.clientId === openSessionClient.id)}
            onUpdateSession={clientStore.updateSession}
            onDeleteSession={(id) => { clientStore.removeSession(id); setOpenSession(null); }}
            onAddTask={(text) => clientStore.addClientTask(openSessionClient.id, text)}
            onToggleTask={(id) => clientStore.toggleClientTask(openSessionClient.id, id)}
            onDeleteTask={(id) => clientStore.removeClientTask(openSessionClient.id, id)}
            onClose={() => setOpenSession(null)}
          />
        </>
      )}
    </div>
  );
}

export function PlannerView({ weekId }: PlannerViewProps) {
  return (
    <SessionProvider>
      <PlannerInner weekId={weekId} />
    </SessionProvider>
  );
}
