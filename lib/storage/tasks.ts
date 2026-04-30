import { getDb } from "./db";
import type { Task } from "@/types";

export async function getTasksByWeek(weekId: string): Promise<Task[]> {
  const db = await getDb();
  return db.getAllFromIndex("tasks", "by-week", weekId);
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDb();
  await db.put("tasks", task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("tasks", id);
}

export async function getRecurringTasks(): Promise<Task[]> {
  const db = await getDb();
  const all = await db.getAll("tasks");
  return all.filter((t) => t.recurring);
}
