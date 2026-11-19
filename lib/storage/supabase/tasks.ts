import { api } from "./api";
import type { Task } from "@/types";

export async function sbGetTasksByWeek(_userEmail: string, weekId: string): Promise<Task[]> {
  const res = await api(`/api/db/tasks?weekId=${encodeURIComponent(weekId)}`);
  return (await res.json()).map(rowToTask);
}

export async function sbGetRecurringTasks(_userEmail: string): Promise<Task[]> {
  const res = await api("/api/db/tasks?recurring=true");
  return (await res.json()).map(rowToTask);
}

export async function sbSaveTask(_userEmail: string, task: Task): Promise<void> {
  await api("/api/db/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
}

export async function sbDeleteTask(id: string): Promise<void> {
  await api(`/api/db/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

function rowToTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    weekId: r.week_id as string,
    dayIndex: r.day_index as number,
    text: r.text as string,
    completed: r.completed as boolean,
    sortOrder: r.sort_order as number,
    startMinute: r.start_minute as number | null,
    endMinute: r.end_minute as number | null,
    recurring: r.recurring as boolean,
    recurringPattern: r.recurring_pattern as "weekly" | "daily" | null,
    createdAt: r.created_at as number,
  };
}
