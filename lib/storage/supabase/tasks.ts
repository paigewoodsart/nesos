import { supabase } from "@/lib/supabase";
import type { Task } from "@/types";

export async function sbGetTasksByWeek(userEmail: string, weekId: string): Promise<Task[]> {
  try {
    const res = await fetch(`/api/db/tasks?weekId=${encodeURIComponent(weekId)}`);
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).map(rowToTask);
  } catch {
    const { data } = await supabase.from("tasks").select("*").eq("user_email", userEmail).eq("week_id", weekId);
    return (data ?? []).map(rowToTask);
  }
}

export async function sbGetRecurringTasks(userEmail: string): Promise<Task[]> {
  try {
    const res = await fetch("/api/db/tasks?recurring=true");
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).map(rowToTask);
  } catch {
    const { data } = await supabase.from("tasks").select("*").eq("user_email", userEmail).eq("recurring", true);
    return (data ?? []).map(rowToTask);
  }
}

export async function sbSaveTask(userEmail: string, task: Task): Promise<void> {
  try {
    const res = await fetch("/api/db/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
    if (!res.ok) throw new Error(await res.text());
  } catch {
    await supabase.from("tasks").upsert({
      id: task.id, user_email: userEmail, week_id: task.weekId, day_index: task.dayIndex,
      text: task.text, completed: task.completed, sort_order: task.sortOrder,
      start_minute: task.startMinute, end_minute: task.endMinute,
      recurring: task.recurring, recurring_pattern: task.recurringPattern, created_at: task.createdAt,
    });
  }
}

export async function sbDeleteTask(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/db/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  } catch {
    await supabase.from("tasks").delete().eq("id", id);
  }
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
