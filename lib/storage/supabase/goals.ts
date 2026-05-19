import type { Goal } from "@/types";

export async function sbGetGoalsByWeek(_userEmail: string, weekId: string): Promise<Goal[]> {
  const res = await fetch(`/api/db/goals?weekId=${encodeURIComponent(weekId)}&type=weekly`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).map(rowToGoal);
}

export async function sbGetLongtermGoals(_userEmail: string): Promise<Goal[]> {
  const res = await fetch("/api/db/goals?type=longterm");
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).map(rowToGoal);
}

export async function sbSaveGoal(_userEmail: string, goal: Goal): Promise<void> {
  const res = await fetch("/api/db/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goal),
  });
  if (!res.ok) console.error("[sb] saveGoal:", await res.text());
}

export async function sbDeleteGoal(id: string): Promise<void> {
  const res = await fetch(`/api/db/goals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) console.error("[sb] deleteGoal:", await res.text());
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
