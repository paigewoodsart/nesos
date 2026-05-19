import type { Client, ClientTask, ClientSession } from "@/types";

// ── Clients ──────────────────────────────────────────────────────

export async function sbGetAllClients(_userEmail: string): Promise<Client[]> {
  const res = await fetch("/api/db/clients");
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).map((r: Record<string, unknown>) => ({ id: r.id, name: r.name, color: r.color, notes: (r.notes as string | null) ?? undefined, createdAt: r.created_at }));
}

export async function sbSaveClient(_userEmail: string, client: Client): Promise<void> {
  const res = await fetch("/api/db/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(client) });
  if (!res.ok) console.error("[sb] saveClient:", await res.text());
}

export async function sbDeleteClient(id: string): Promise<void> {
  const res = await fetch(`/api/db/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) console.error("[sb] deleteClient:", await res.text());
}

// ── Client Tasks ─────────────────────────────────────────────────

export async function sbGetClientTasks(_userEmail: string, clientId: string): Promise<ClientTask[]> {
  const res = await fetch(`/api/db/client-tasks?clientId=${encodeURIComponent(clientId)}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).map(rowToClientTask);
}

export async function sbSaveClientTask(_userEmail: string, task: ClientTask): Promise<void> {
  const res = await fetch("/api/db/client-tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
  if (!res.ok) console.error("[sb] saveClientTask:", await res.text());
}

export async function sbDeleteClientTask(id: string): Promise<void> {
  const res = await fetch(`/api/db/client-tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) console.error("[sb] deleteClientTask:", await res.text());
}

// ── Client Sessions ──────────────────────────────────────────────

export async function sbGetSessionsByWeek(_userEmail: string, weekId: string): Promise<ClientSession[]> {
  const res = await fetch(`/api/db/sessions?weekId=${encodeURIComponent(weekId)}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).map(rowToSession);
}

export async function sbSaveSession(_userEmail: string, session: ClientSession): Promise<void> {
  const res = await fetch("/api/db/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(session) });
  if (!res.ok) console.error("[sb] saveSession:", await res.text());
}

export async function sbDeleteSession(id: string): Promise<void> {
  const res = await fetch(`/api/db/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) console.error("[sb] deleteSession:", await res.text());
}

// ── Row mappers ──────────────────────────────────────────────────

function rowToClientTask(r: Record<string, unknown>): ClientTask {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    text: r.text as string,
    done: r.done as boolean,
    doneAt: r.done_at as number | null,
    dueDate: r.due_date as string | null,
    archived: r.archived as boolean,
    archivedAt: r.archived_at as number | null,
    createdAt: r.created_at as number,
  };
}

function rowToSession(r: Record<string, unknown>): ClientSession {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    weekId: r.week_id as string,
    dayIndex: r.day_index as number,
    startMinute: r.start_minute as number,
    endMinute: r.end_minute as number,
    actualMinutes: r.actual_minutes as number | null,
    notes: r.notes as string,
    date: r.date as string,
    createdAt: r.created_at as number,
  };
}
