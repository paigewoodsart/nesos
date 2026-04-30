import { supabase } from "@/lib/supabase";
import type { Client, ClientTask, ClientSession } from "@/types";

// ── Clients ──────────────────────────────────────────────────────

export async function sbGetAllClients(userEmail: string): Promise<Client[]> {
  const { data } = await supabase.from("clients").select("*").eq("user_email", userEmail);
  return (data ?? []).map(r => ({ id: r.id, name: r.name, color: r.color, createdAt: r.created_at }));
}

export async function sbSaveClient(userEmail: string, client: Client): Promise<void> {
  await supabase.from("clients").upsert({ id: client.id, user_email: userEmail, name: client.name, color: client.color, created_at: client.createdAt });
}

export async function sbDeleteClient(id: string): Promise<void> {
  await supabase.from("clients").delete().eq("id", id);
}

// ── Client Tasks ─────────────────────────────────────────────────

export async function sbGetClientTasks(userEmail: string, clientId: string): Promise<ClientTask[]> {
  const { data } = await supabase.from("client_tasks").select("*").eq("user_email", userEmail).eq("client_id", clientId);
  return (data ?? []).map(rowToClientTask);
}

export async function sbSaveClientTask(userEmail: string, task: ClientTask): Promise<void> {
  await supabase.from("client_tasks").upsert({
    id: task.id,
    user_email: userEmail,
    client_id: task.clientId,
    text: task.text,
    done: task.done,
    done_at: task.doneAt,
    due_date: task.dueDate,
    archived: task.archived,
    archived_at: task.archivedAt,
    created_at: task.createdAt,
  });
}

export async function sbDeleteClientTask(id: string): Promise<void> {
  await supabase.from("client_tasks").delete().eq("id", id);
}

// ── Client Sessions ──────────────────────────────────────────────

export async function sbGetSessionsByWeek(userEmail: string, weekId: string): Promise<ClientSession[]> {
  const { data } = await supabase.from("client_sessions").select("*").eq("user_email", userEmail).eq("week_id", weekId);
  return (data ?? []).map(rowToSession);
}

export async function sbSaveSession(userEmail: string, session: ClientSession): Promise<void> {
  await supabase.from("client_sessions").upsert({
    id: session.id,
    user_email: userEmail,
    client_id: session.clientId,
    week_id: session.weekId,
    day_index: session.dayIndex,
    start_minute: session.startMinute,
    end_minute: session.endMinute,
    actual_minutes: session.actualMinutes,
    notes: session.notes,
    date: session.date,
    created_at: session.createdAt,
  });
}

export async function sbDeleteSession(id: string): Promise<void> {
  await supabase.from("client_sessions").delete().eq("id", id);
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
