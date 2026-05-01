"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllClients, saveClient, deleteClient,
  getClientTasks, saveClientTask, deleteClientTask,
  getSessionsByWeek, saveSession, deleteSession,
} from "@/lib/storage/clients";
import {
  sbGetAllClients, sbSaveClient, sbDeleteClient,
  sbGetClientTasks, sbSaveClientTask, sbDeleteClientTask,
  sbGetSessionsByWeek, sbSaveSession, sbDeleteSession,
} from "@/lib/storage/supabase/clients";
import type { Client, ClientTask, ClientSession } from "@/types";

export const CLIENT_COLORS = [
  "#d9ed92", "#99d98c", "#52b69a", "#34a0a4",
  "#168aad", "#1a759f", "#1e6091", "#184e77",
  "#76c893", "#b5e48c",
];

export function useClientStore(weekId: string, userEmail?: string | null) {
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [tasksByClient, setTasksByClient] = useState<Record<string, ClientTask[]>>({});
  const [loaded, setLoaded] = useState(false);

  const sb = !!userEmail;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let c: Client[], s: ClientSession[];
      try {
        [c, s] = await Promise.all([
          sb ? sbGetAllClients(userEmail!) : getAllClients(),
          sb ? sbGetSessionsByWeek(userEmail!, weekId) : getSessionsByWeek(weekId),
        ]);
      } catch (err) {
        console.error("[useClientStore] Supabase load failed, falling back to IDB:", err);
        [c, s] = await Promise.all([getAllClients(), getSessionsByWeek(weekId)]);
      }
      if (cancelled) return;
      setClients(c);
      setSessions(s);

      const taskMap: Record<string, ClientTask[]> = {};
      await Promise.all(c.map(async (client) => {
        let raw: ClientTask[];
        try {
          raw = sb ? await sbGetClientTasks(userEmail!, client.id) : await getClientTasks(client.id);
        } catch {
          raw = await getClientTasks(client.id);
        }
        taskMap[client.id] = raw.map((t) => ({
          ...t,
          archived: (t as ClientTask & { archived?: boolean }).archived ?? false,
          archivedAt: (t as ClientTask & { archivedAt?: number | null }).archivedAt ?? null,
        }));
      }));
      if (!cancelled) { setTasksByClient(taskMap); setLoaded(true); }
    }
    setLoaded(false);
    load();
    return () => { cancelled = true; };
  }, [weekId, userEmail]); // eslint-disable-line

  const addClient = useCallback(async (name: string, color: string): Promise<Client> => {
    const client: Client = { id: crypto.randomUUID(), name, color, createdAt: Date.now() };
    if (userEmail) await sbSaveClient(userEmail, client); else await saveClient(client);
    setClients((prev) => [...prev, client]);
    setTasksByClient((prev) => ({ ...prev, [client.id]: [] }));
    return client;
  }, [userEmail]);

  const updateClient = useCallback(async (updated: Client) => {
    if (userEmail) await sbSaveClient(userEmail, updated); else await saveClient(updated);
    setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }, [userEmail]);

  const removeClient = useCallback(async (id: string) => {
    if (userEmail) await sbDeleteClient(id); else await deleteClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, [userEmail]);

  const addClientTask = useCallback(async (clientId: string, text: string, dueDate?: string | null): Promise<ClientTask> => {
    const task: ClientTask = { id: crypto.randomUUID(), clientId, text, done: false, doneAt: null, dueDate: dueDate ?? null, archived: false, archivedAt: null, createdAt: Date.now() };
    if (userEmail) await sbSaveClientTask(userEmail, task); else await saveClientTask(task);
    setTasksByClient((prev) => ({ ...prev, [clientId]: [...(prev[clientId] ?? []), task] }));
    return task;
  }, [userEmail]);

  const updateClientTask = useCallback(async (clientId: string, updated: ClientTask) => {
    if (userEmail) await sbSaveClientTask(userEmail, updated); else await saveClientTask(updated);
    setTasksByClient((prev) => ({ ...prev, [clientId]: (prev[clientId] ?? []).map((t) => t.id === updated.id ? updated : t) }));
  }, [userEmail]);

  const toggleClientTask = useCallback(async (clientId: string, taskId: string) => {
    setTasksByClient((prev) => {
      const updated = (prev[clientId] ?? []).map((t) =>
        t.id === taskId ? { ...t, done: !t.done, doneAt: !t.done ? Date.now() : null } : t
      );
      const task = updated.find((t) => t.id === taskId);
      if (task) { if (userEmail) sbSaveClientTask(userEmail, task); else saveClientTask(task); }
      return { ...prev, [clientId]: updated };
    });
  }, [userEmail]);

  const archiveClientTask = useCallback(async (clientId: string, taskId: string) => {
    setTasksByClient((prev) => {
      const updated = (prev[clientId] ?? []).map((t) =>
        t.id === taskId ? { ...t, archived: true, archivedAt: Date.now(), done: true, doneAt: t.doneAt ?? Date.now() } : t
      );
      const task = updated.find((t) => t.id === taskId);
      if (task) { if (userEmail) sbSaveClientTask(userEmail, task); else saveClientTask(task); }
      return { ...prev, [clientId]: updated };
    });
  }, [userEmail]);

  const removeClientTask = useCallback(async (clientId: string, taskId: string) => {
    if (userEmail) await sbDeleteClientTask(taskId); else await deleteClientTask(taskId);
    setTasksByClient((prev) => ({ ...prev, [clientId]: (prev[clientId] ?? []).filter((t) => t.id !== taskId) }));
  }, [userEmail]);

  const addSession = useCallback(async (partial: Omit<ClientSession, "id" | "createdAt">): Promise<ClientSession> => {
    const session: ClientSession = { ...partial, id: crypto.randomUUID(), createdAt: Date.now() };
    if (userEmail) await sbSaveSession(userEmail, session); else await saveSession(session);
    setSessions((prev) => [...prev, session]);
    return session;
  }, [userEmail]);

  const updateSession = useCallback(async (updated: ClientSession) => {
    if (userEmail) await sbSaveSession(userEmail, updated); else await saveSession(updated);
    setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  }, [userEmail]);

  const removeSession = useCallback(async (id: string) => {
    if (userEmail) await sbDeleteSession(id); else await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, [userEmail]);

  const getWeekSessions = useCallback((dayIndex?: number) =>
    dayIndex !== undefined ? sessions.filter((s) => s.dayIndex === dayIndex) : sessions,
  [sessions]);

  return {
    clients, sessions, tasksByClient, loaded,
    addClient, updateClient, removeClient,
    addClientTask, updateClientTask, toggleClientTask, archiveClientTask, removeClientTask,
    addSession, updateSession, removeSession,
    getWeekSessions,
  };
}
