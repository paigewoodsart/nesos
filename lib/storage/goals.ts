import { getDb } from "./db";
import type { Goal } from "@/types";

export async function getGoalsByWeek(weekId: string): Promise<Goal[]> {
  const db = await getDb();
  return db.getAllFromIndex("goals", "by-week", weekId);
}

export async function getLongtermGoals(): Promise<Goal[]> {
  const db = await getDb();
  return db.getAllFromIndex("goals", "by-type", "longterm");
}

export async function saveGoal(goal: Goal): Promise<void> {
  const db = await getDb();
  await db.put("goals", goal);
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("goals", id);
}
