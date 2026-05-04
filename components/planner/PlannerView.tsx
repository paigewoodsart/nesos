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
import { MobileHome } from "@/components/mobile/MobileHome";
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
  const [bypassLanding, setBypassLanding] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const handleDayChange = useCallback((d: Date) => {
    setActiveDate(d);
    setActiveWeekId(getWeekId(d));
  }, []);

  const handleSelectSession = useCallback((session: ClientSession) => {
    setOpenSession(session);
  }, []);

  if (!isMobile && authStatus === "unauthenticated" && !bypassLanding) {
    return <MobileHome isLoggedIn={false} onOpenDrawer={() => setBypassLanding(true)} />;
  }

  if (authStatus === "loading" || !store.loaded || !clientStore.loaded) {
    if (isMobile) {
      return <MobileHome isLoggedIn={authStatus === "authenticated"} onOpenDrawer={() => {}} />;
    }
    return (
      <div className="flex items-center justify-center h-full bg-paper-cream">
        <img src="/nesos-favicon-lm.webp" alt="Nesos" className="h-10 w-10 object-contain animate-pulse-soft" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileView
        weekId={activeWeekId}
        userEmail={userEmail ?? null}
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
        onRemoveClientTask={clientStore.removeClientTask}
        onUpdateClientTask={clientStore.updateClientTask}
        onAddClient={clientStore.addClient}
        onUpdateClient={clientStore.updateClient}
        onRemoveClient={clientStore.removeClient}
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
      {/* Beta bar — desktop only, pinned to bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 py-1.5 px-4 text-center text-[11px] tracking-wide border-t border-paper-line/30"
        style={{ fontFamily: "var(--font-body)", color: "var(--color-paper-rust)", backgroundColor: "rgba(249,248,246,0.9)", backdropFilter: "blur(8px)" }}
      >
        This resource is still in beta — please email{" "}
        <a href="mailto:nesosplanner@gmail.com" className="underline underline-offset-2">nesosplanner@gmail.com</a>
        {" "}to submit feedback
      </div>
      <WeekNav
        weekId={activeWeekId}
        bloomState={store.bloomState}
        view={view}
        onViewChange={setView}
        activeDate={activeDate}
        onDayChange={handleDayChange}
        onToggleArchive={() => setShowArchive((v) => !v)}
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

      {/* Archive panel */}
      {showArchive && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowArchive(false)} />
          <div className="fixed top-0 right-0 z-50 h-full w-80 flex flex-col shadow-2xl border-l border-paper-line/30" style={{ backgroundColor: "rgba(249,248,246,0.97)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-paper-line/30 flex-shrink-0">
              <h2 className="text-sm font-bold uppercase tracking-widest text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>Archive</h2>
              <button onClick={() => setShowArchive(false)} className="text-paper-ink-light hover:text-paper-ink text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {clientStore.clients.map((c) => {
                const archived = (clientStore.tasksByClient[c.id] ?? []).filter((t) => t.archived);
                if (!archived.length) return null;
                return (
                  <details key={c.id} className="mb-4">
                    <summary className="flex items-center gap-2 py-1.5 cursor-pointer list-none select-none">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-semibold text-paper-ink flex-1" style={{ fontFamily: "var(--font-body)" }}>{c.name}</span>
                      <span className="text-xs text-paper-ink-light">{archived.length}</span>
                    </summary>
                    <div className="pl-4 mt-1">
                      {archived.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 py-2 border-b border-paper-line/20 opacity-60">
                          <span className="flex-1 text-sm line-through text-paper-ink truncate" style={{ fontFamily: "var(--font-body)" }}>{t.text}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
              {clientStore.clients.every((c) => !(clientStore.tasksByClient[c.id] ?? []).some((t) => t.archived)) && (
                <p className="text-sm text-paper-ink-light text-center mt-8" style={{ fontFamily: "var(--font-body)" }}>Nothing archived yet.</p>
              )}
            </div>
          </div>
        </>
      )}

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
