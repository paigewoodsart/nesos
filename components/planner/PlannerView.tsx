"use client";

import { useCallback, useEffect, useState } from "react";
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
import { DesktopArchive } from "./DesktopArchive";
import { ClientPanel } from "@/components/clients/ClientPanel";
import { MobileView } from "@/components/mobile/MobileView";
import { MobileHome } from "@/components/mobile/MobileHome";
import { HandbookModal, HANDBOOK_VERSION, HANDBOOK_KEY } from "@/components/shared/HandbookModal";
import { ThemePickerModal } from "@/components/shared/ThemePickerModal";
import { useTheme } from "@/hooks/useTheme";
import { THEME_BOARD_CLASS, NEUTRAL_SYSTEM_DEFAULTS, NEUTRAL_CLIENT_COLORS_PALETTE } from "@/lib/theme";
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
  const { theme, setTheme } = useTheme();
  const { events } = useCalendarEvents(activeWeekId);
  const [colorResetKey, setColorResetKey] = useState(0);

  const applyNeutralColors = useCallback(() => {
    localStorage.setItem("sticky-system-config-neutral", JSON.stringify(NEUTRAL_SYSTEM_DEFAULTS));
    setColorResetKey((k) => k + 1);
    clientStore.clients.forEach((client, i) => {
      clientStore.updateClient({ ...client, color: NEUTRAL_CLIENT_COLORS_PALETTE[i % NEUTRAL_CLIENT_COLORS_PALETTE.length] });
    });
  }, [clientStore]);
  const isMobile = useIsMobile();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openSession, setOpenSession] = useState<ClientSession | null>(null);
  const [bypassLanding, setBypassLanding] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showHandbook, setShowHandbook] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    if (authStatus === "loading" || !store.loaded || !clientStore.loaded) return;
    try {
      if (localStorage.getItem(HANDBOOK_KEY) !== HANDBOOK_VERSION) {
        setShowHandbook(true);
      }
    } catch {}
  }, [authStatus, store.loaded, clientStore.loaded]);

  const handleDayChange = useCallback((d: Date) => {
    setActiveDate(d);
    setActiveWeekId(getWeekId(d));
  }, []);

  const handleCloseHandbook = useCallback(() => {
    const isFirstTime = localStorage.getItem(HANDBOOK_KEY) !== HANDBOOK_VERSION;
    setShowHandbook(false);
    try { localStorage.setItem(HANDBOOK_KEY, HANDBOOK_VERSION); } catch {}
    if (isFirstTime) setShowThemePicker(true);
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
      <div className="flex items-center justify-center h-dvh bg-paper-cream">
        <img src="/nesos-favicon-lm.webp" alt="Nesos" className="h-10 w-10 object-contain animate-pulse-soft" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
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
          onArchiveClient={clientStore.archiveClient}
          onUnarchiveClient={clientStore.unarchiveClient}
          events={events}
          activeDate={activeDate}
          onDayChange={handleDayChange}
          onOpenHandbook={() => setShowHandbook(true)}
          theme={theme}
          onThemeChange={setTheme}
          onApplyNeutralColors={applyNeutralColors}
        />
        <HandbookModal open={showHandbook} onClose={handleCloseHandbook} />
        <ThemePickerModal open={showThemePicker} selected={theme} onSelect={setTheme} onClose={() => setShowThemePicker(false)} />
      </>
    );
  }

  const openSessionClient = openSession
    ? clientStore.clients.find((c) => c.id === openSession.clientId) ?? null
    : null;

  const weekTasks = store.tasks.filter((t) => t.dayIndex === -1);

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${THEME_BOARD_CLASS[theme]} board-grid`}>
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
        view={view}
        onViewChange={setView}
        activeDate={activeDate}
        onDayChange={handleDayChange}
        onToggleArchive={() => setShowArchive((v) => !v)}
        onOpenHandbook={() => setShowHandbook(true)}
        theme={theme}
        onThemeChange={setTheme}
        onApplyNeutralColors={applyNeutralColors}
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
            onArchiveClient={clientStore.archiveClient}
            onUnarchiveClient={clientStore.unarchiveClient}
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
            theme={theme}
            colorResetKey={colorResetKey}
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
        <DesktopArchive
          clients={clientStore.clients}
          tasksByClient={clientStore.tasksByClient}
          onUnarchiveClient={clientStore.unarchiveClient}
          onClose={() => setShowArchive(false)}
        />
      )}

      <HandbookModal open={showHandbook} onClose={handleCloseHandbook} />
      <ThemePickerModal open={showThemePicker} selected={theme} onSelect={setTheme} onClose={() => setShowThemePicker(false)} />

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
