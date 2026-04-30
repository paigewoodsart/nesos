"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllClients, saveClient, deleteClient,
  getClientTasks, saveClientTask, deleteClientTask,
  getSessionsByWeek, saveSession, deleteSession,
} from "@/lib/storage/clients";
import type { Client, ClientTask, ClientSession } from "@/types";

export const CLIENT_COLORS = [
  "#d9ed92", // lime cream
  "#99d98c", // light green
  "#52b69a", // ocean mist
  "#34a0a4", // tropical teal
  "#168aad", // bondi blue
  "#1a759f", // cerulean
  "#1e6091", // baltic blue
  "#184e77", // yale blue
  "#76c893", // emerald
  "#b5e48c", // light green 2
];

export function useClientStore(weekId: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [tasksByClient, setTasksByClient] = useState<Record<string, ClientTask[]>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [c, s] = await Promise.all([getAllClients(), getSessionsByWeek(weekId)]);
      if (cancelled) return;
      setClients(c);
      setSessions(s);

      const taskMap: Record<string, ClientTask[]> = {};
      await Promise.all(c.map(async (client) => {
        const raw = await getClientTasks(client.id);
        taskMap[client.id] = raw.map((t) => ({
          ...t,
          archived: (t as ClientTask & { archived?: boolean }).archived ?? false,
          archivedAt: (t as ClientTask & { archivedAt?: number | null }).archivedAt ?? null,
        }));
      }));
      if (!cancelled) {
        setTasksByClient(taskMap);
        setLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [weekId]);

  const addClient = useCallback(async (name: string, color: string): Promise<Client> => {
    const client: Client = { id: crypto.randomUUID(), name, color, createdAt: Date.now() };
    await saveClient(client);
    setClients((prev) => [...prev, client]);
    setTasksByClient((prev) => ({ ...prev, [client.id]: [] }));
    return client;
  }, []);

  const updateClient = useCallback(async (updated: Client) => {
    await saveClient(updated);
    setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }, []);

  const removeClient = useCallback(async (id: string) => {
    await deleteClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addClientTask = useCallback(async (clientId: string, text: string, dueDate?: string | null): Promise<ClientTask> => {
    const task: ClientTask = { id: crypto.randomUUID(), clientId, text, done: false, doneAt: null, dueDate: dueDate ?? null, archived: false, archivedAt: null, createdAt: Date.now() };
    await saveClientTask(task);
    setTasksByClient((prev) => ({ ...prev, [clientId]: [...(prev[clientId] ?? []), task] }));
    return task;
  }, []);

  const updateClientTask = useCallback(async (clientId: string, updated: ClientTask) => {
    await saveClientTask(updated);
    setTasksByClient((prev) => ({
      ...prev,
      [clientId]: (prev[clientId] ?? []).map((t) => t.id === updated.id ? updated : t),
    }));
  }, []);

  const toggleClientTask = useCallback(async (clientId: string, taskId: string) => {
    setTasksByClient((prev) => {
      const updated = (prev[clientId] ?? []).map((t) =>
        t.id === taskId ? { ...t, done: !t.done, doneAt: !t.done ? Date.now() : null } : t
      );
      const task = updated.find((t) => t.id === taskId);
      if (task) saveClientTask(task);
      return { ...prev, [clientId]: updated };
    });
  }, []);

  const archiveClientTask = useCallback(async (clientId: string, taskId: string) => {
    setTasksByClient((prev) => {
      const updated = (prev[clientId] ?? []).map((t) =>
        t.id === taskId ? { ...t, archived: true, archivedAt: Date.now(), done: true, doneAt: t.doneAt ?? Date.now() } : t
      );
      const task = updated.find((t) => t.id === taskId);
      if (task) saveClientTask(task);
      return { ...prev, [clientId]: updated };
    });
  }, []);

  const removeClientTask = useCallback(async (clientId: string, taskId: string) => {
    await deleteClientTask(taskId);
    setTasksByClient((prev) => ({ ...prev, [clientId]: (prev[clientId] ?? []).filter((t) => t.id !== taskId) }));
  }, []);

  const addSession = useCallback(async (partial: Omit<ClientSession, "id" | "createdAt">): Promise<ClientSession> => {
    const session: ClientSession = { ...partial, id: crypto.randomUUID(), createdAt: Date.now() };
    await saveSession(session);
    setSessions((prev) => [...prev, session]);
    return session;
  }, []);

  const updateSession = useCallback(async (updated: ClientSession) => {
    await saveSession(updated);
    setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  }, []);

  const removeSession = useCallback(async (id: string) => {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getWeekSessions = useCallback((dayIndex?: number) =>
    dayIndex !== undefined
      ? sessions.filter((s) => s.dayIndex === dayIndex)
      : sessions,
  [sessions]);

  return {
    clients, sessions, tasksByClient, loaded,
    addClient, updateClient, removeClient,
    addClientTask, updateClientTask, toggleClientTask, archiveClientTask, removeClientTask,
    addSession, updateSession, removeSession,
    getWeekSessions,
  };
}
