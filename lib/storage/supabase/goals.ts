import { api } from "./api";
import type { Goal } from "@/types";

export async function sbGetGoalsByWeek(_userEmail: string, weekId: string): Promise<Goal[]> {
  const res = await api(`/api/db/goals?weekId=${encodeURIComponent(weekId)}&type=weekly`);
  return (await res.json()).map(rowToGoal);
}

export async function sbGetLongtermGoals(_userEmail: string): Promise<Goal[]> {
  const res = await api("/api/db/goals?type=longterm");
  return (await res.json()).map(rowToGoal);
}

export async function sbSaveGoal(_userEmail: string, goal: Goal): Promise<void> {
  await api("/api/db/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(goal) });
}

export async function sbDeleteGoal(id: string): Promise<void> {
  await api(`/api/db/goals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

function rowToGoal(r: Record<string, unknown>): Goal {
  return {
    id: r.id as string,
    weekId: r.week_id as string | null,
    text: r.text as string,
    completed: r.completed as boolean,
    type: r.type as "weekly" | "longterm",
    createdAt: r.created_at as number,
  };
}
