import { getDb } from "./db";
import type { Client, ClientTask, ClientSession } from "@/types";

// ── Clients ────────────────────────────────────────────────────

export async function getAllClients(): Promise<Client[]> {
  const db = await getDb();
  return db.getAll("clients");
}

export async function saveClient(client: Client): Promise<void> {
  const db = await getDb();
  await db.put("clients", client);
}

export async function deleteClient(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("clients", id);
}

// ── Client tasks ───────────────────────────────────────────────

export async function getClientTasks(clientId: string): Promise<ClientTask[]> {
  const db = await getDb();
  return db.getAllFromIndex("client-tasks", "by-client", clientId);
}

export async function saveClientTask(task: ClientTask): Promise<void> {
  const db = await getDb();
  await db.put("client-tasks", task);
}

export async function deleteClientTask(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("client-tasks", id);
}

// ── Client sessions ────────────────────────────────────────────

export async function getSessionsByClient(clientId: string): Promise<ClientSession[]> {
  const db = await getDb();
  return db.getAllFromIndex("client-sessions", "by-client", clientId);
}

export async function getSessionsByWeek(weekId: string): Promise<ClientSession[]> {
  const db = await getDb();
  return db.getAllFromIndex("client-sessions", "by-week", weekId);
}

export async function saveSession(session: ClientSession): Promise<void> {
  const db = await getDb();
  await db.put("client-sessions", session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("client-sessions", id);
}
